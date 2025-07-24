import { KeyValuePipe } from '@angular/common';
import { Component, computed, inject, InjectionToken, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EventManager } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { Suggestion } from '@sinequa/atomic';
import {
  AppStore,
  AuditService,
  AutocompleteService,
  DrawerAdvancedFiltersComponent,
  DrawerStackService,
  HighlightWordPipe,
  UserSettingsStore
} from '@sinequa/atomic-angular';

import { ButtonComponent, HorizontalDividerComponent, ListItemComponent } from '@sinequa/ui';

import { SearchInputComponent } from '../search-input.component';

const AUTOCOMPLETE_CATEGORIES_SORT_PREFERENCES = new InjectionToken("Order by preference for suggestion's categories", {
  factory: () => ['full-text', 'recent-search', 'saved-search', 'title', 'concepts', 'people']
});
// Icons mapping for each category
const AUTOCOMPLETE_CATEGORIES_ICONS = new InjectionToken<Record<string, string>>('Icons for each suggestion categories', {
  factory: () => ({
    'recent-search': 'fa-fw far fa-history',
    'saved-search': 'fa-fw fas fa-star',
    title: 'fa-fw far fa-file-alt',
    concepts: 'fa-fw far fa-lightbulb',
    people: 'fa-fw far fa-user',
    company: 'fa-fw far fa-building',
    location: 'fa-fw far fa-location-dot'
  })
});

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css'],
  imports: [KeyValuePipe, HighlightWordPipe, TranslocoPipe, ListItemComponent, HorizontalDividerComponent, ButtonComponent]
})
export class AutocompleteComponent {
  readonly text = input<string>('');
  readonly onClick = output<Suggestion>();

  readonly wasSearchClicked = signal(false);
  readonly activeTab = signal<'saved' | 'recent'>('recent'); // Add tab state

  readonly autocompleteService = inject(AutocompleteService);
  readonly auditService = inject(AuditService);
  readonly appStore = inject(AppStore);
  readonly userSettingsStore = inject(UserSettingsStore);
  private readonly drawerStack = inject(DrawerStackService);

  // Order by preference for suggestion's categories
  readonly autocompleteCategories = inject(AUTOCOMPLETE_CATEGORIES_SORT_PREFERENCES);
  // Icons mapping for each category
  readonly autocompleteIcons = inject(AUTOCOMPLETE_CATEGORIES_ICONS);

  protected readonly overlayOpen = this.autocompleteService.opened;

  autocomplete = computed(() => this.appStore.customizationJson()?.autocomplete);
  advancedSearch = computed(() => {
    const features = this.appStore.customizationJson()?.features;
    return features ? features['advancedSearch'] : false;
  });

  readonly allSuggestions = toSignal(
    combineLatest([toObservable(this.text), toObservable(this.wasSearchClicked)]).pipe(
      switchMap(([testText]) => {
        // Always get all saved searches without text filtering
        const allSavedSearches = of(this.autocompleteService.getFromUserSettingsForText('', this.autocomplete() ?? 3));

        if (!testText) return allSavedSearches;

        // Get text-filtered suggestions from user settings (for recent searches, etc.)
        const filteredUserSettings = of(this.autocompleteService.getFromUserSettingsForText(testText, this.autocomplete() ?? 3)).pipe(
          map(suggestions => suggestions.filter(item => item.category !== 'saved-search'))
        );

        return combineLatest([
          allSavedSearches, // All saved searches (unfiltered)
          filteredUserSettings, // Text-filtered user settings (excluding saved searches)
          this.autocompleteService.getFromSuggestQueriesForText(testText).pipe(
            catchError(error => {
              console.log('Error getting suggestions from suggest queries', error);
              return of([]);
            })
          )
        ]);
      }),
      map(items => items.flat(2)),
      map(items => items.filter(item => item.category !== 'bookmark')),
      // order the items to have full-text, recent search and saved search at the beginning
      map(items =>
        items.sort((a, b) => {
          return this.autocompleteCategories.indexOf(a.category) - this.autocompleteCategories.indexOf(b.category);
        })
      )
    )
  );

  readonly suggestions = computed(() => {
    const allSuggestions = this.allSuggestions() || [];
    const activeTab = this.activeTab();

    let filteredSuggestions;
    if (activeTab === 'saved') {
      filteredSuggestions = allSuggestions.filter(item => item.category === 'saved-search');
    } else {
      filteredSuggestions = allSuggestions.filter(item => item.category !== 'saved-search');
    }

    return Object.groupBy(filteredSuggestions, ({ category }) => category);
  });

  constructor(
    { el: { nativeElement } }: SearchInputComponent,
    private eventManager: EventManager
  ) {
    this.eventManager.addEventListener(nativeElement, 'click', () => this.wasSearchClicked.set(true));
  }

  public itemClicked(item: Suggestion): void {
    this.auditService.notify({
      type: 'Search_Autocomplete',
      detail: {
        display: item.display,
        category: item.category
      }
    });
    this.onClick.emit(item);
  }

  public setActiveTab(tab: 'saved' | 'recent'): void {
    this.activeTab.set(tab);
  }

  openAdvancedSearch(): void {
    this.overlayOpen.set(false);
    this.drawerStack.open(DrawerAdvancedFiltersComponent);
  }

  preventClose(event: Event): void {
    event.stopPropagation();
  }
}
