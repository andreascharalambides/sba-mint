import { Component, computed, inject, input, output, viewChild } from '@angular/core';
import { TranslocoPipe, provideTranslocoScope } from '@jsverse/transloco';

import { Placement } from '@floating-ui/dom';
import { CCSortingChoice, Result } from '@sinequa/atomic';
import { ButtonComponent, DropdownComponent, MenuComponent, MenuContentComponent, MenuItemComponent } from '@sinequa/ui';
import { AppStore } from '../app.store';

export type SortingChoice = CCSortingChoice & {
  $isDesc?: boolean;
};

@Component({
  selector: 'sort-selector, sortselector, SortSelector',
  standalone: true,
  templateUrl: './sort-selector.html',
  imports: [TranslocoPipe, ButtonComponent, MenuComponent, MenuContentComponent, MenuItemComponent],
  providers: [provideTranslocoScope('sort-selector')]
})
export class SortSelectorComponent {
  dropdown = viewChild(DropdownComponent);

  readonly result = input.required<Result>();
  readonly position = input<Placement>('bottom-start');
  readonly onSort = output<SortingChoice>();

  appStore = inject(AppStore);

  readonly queryName = computed(() => this.result()?.queryName);

  // fetch the sorting choices from the queries and process if choice is desc or asc
  readonly sortOptions = computed(() => {
    const query = this.appStore.getQueryByName(this.queryName());
    if (!query) return [];

    if (this.appStore.isTabSearch(query.name)) {
      const tabName = this.result().tab;
      if (tabName && query) {
        const tab = query.tabSearch?.tabs?.find(t => t.name === tabName);
        if (tab && tab.sortingChoices && tab.sortingChoices.length > 0) {
          return tab.sortingChoices
            .reduce((acc, sort) => {
              acc.push({ ...sort, $isDesc: sort.orderByClause.includes('desc') });
              return acc;
            }, [] as SortingChoice[])
            .filter(s => this.result().hasRelevance || !s.orderByClause.includes('globalrelevance'));
        }
      }
    }

    const choices = query.sortingChoices;
    // choices can be an empty string when nothing is defined in the configuration
    if (choices === undefined || (choices as unknown as string) === '') return [];

    return choices
      ?.reduce((acc, sort) => {
        acc.push({ ...sort, $isDesc: sort.orderByClause.includes('desc') });
        return acc;
      }, [] as SortingChoice[])
      .filter(s => this.result().hasRelevance || !s.orderByClause.includes('globalrelevance'));
  });

  readonly sort = computed(() => this.sortOptions()?.find(x => x.name === this.result()?.sort));
  readonly isSortingDesc = computed(() => this.sort()?.orderByClause?.includes('desc'));

  onSortOptionClicked(sort: SortingChoice) {
    if (sort.name !== this.sort()?.name) {
      this.dropdown()?.close();
      this.onSort.emit(sort);
    }
  }
}
