import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toast } from 'ngx-sonner';

import { getRelativeDate } from '@sinequa/atomic';
import { countFilters, RecentSearch, TranslocoDateImpurePipe, UserSettingsStore, wrapFiltersToArray } from '@sinequa/atomic-angular';

@Component({
  selector: 'app-recent-searches',
  imports: [RouterModule, TranslocoPipe],
  templateUrl: './recent-searches.component.html',
  styleUrls: ['./recent-searches.component.css'],
  providers: [TranslocoDateImpurePipe]
})
export class RecentSearchesComponent {
  readonly getRelativeDate = getRelativeDate;

  readonly router = inject(Router);
  readonly userSettingsStore = inject(UserSettingsStore);
  readonly history = signal<{ date: string; searches: RecentSearch[] }[]>([]);
  readonly transloco = inject(TranslocoService);
  readonly datePipe = inject(TranslocoDateImpurePipe);

  constructor() {
    effect(() => {
      const recentSearches = this.userSettingsStore.recentSearches();

      untracked(() => {
        const groupedByDay = recentSearches.reduce(
          (acc, search) => {
            const date = new Date(search.date).toISOString().split('T')[0];

            if (!acc[date]) acc[date] = [];

            acc[date].push(search);

            // add filterCount on the fly
            search.filterCount = countFilters(search.queryParams?.filters);

            if (search.queryParams?.filters) search.queryParams.filters = wrapFiltersToArray(search.queryParams.filters);

            return acc;
          },
          {} as Record<string, RecentSearch[]>
        );
        const sortedDates = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));
        const sortedGroupedByDay = sortedDates.map(date => ({ date, searches: groupedByDay[date] }));

        this.history.set(sortedGroupedByDay);
      });
    });
  }

  async remove(event: Event, search: RecentSearch) {
    event.stopImmediatePropagation();

    const index = this.userSettingsStore.recentSearches().findIndex(s => s === search);
    await this.userSettingsStore.deleteRecentSearch(index);

    toast.success('Recent search deleted');
  }

  getQueryParams(search: RecentSearch): Record<string, string> {
    return {
      q: search.queryParams?.text,
      f: (search.queryParams?.filters ?? []).length > 0 ? JSON.stringify(search.queryParams?.filters) : undefined,
      t: search.queryParams?.tab,
      p: search.queryParams?.page,
      n: search.queryParams?.name
    } as any;
  }

  getDate(date: string): string {
    const d = getRelativeDate('en', date);
    const formattedDate = this.datePipe.transform(date, 'fullDate');

    // if today, add "Today - " in front of the formatted date
    if (d.toLocaleLowerCase() === 'today') {
      const langDate = getRelativeDate(this.transloco.getActiveLang(), date);
      return `${langDate}`;
    }

    return formattedDate || date;
  }
}
