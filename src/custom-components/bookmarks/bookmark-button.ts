import { Component, computed, inject, input } from '@angular/core';
import { provideTranslocoScope, TranslocoService } from '@jsverse/transloco';

import { ActivatedRoute } from '@angular/router';
import { Article } from '@sinequa/atomic';
import { UserSettingsStore } from '@sinequa/atomic-angular';

@Component({
  selector: 'bookmark-button, bookmarkbutton, BookmarkButton',
  providers: [provideTranslocoScope('bookmark')],
  template: ` @if (isBookmarked()) {
      <i class="fa-fw fa-bookmark fa-solid"></i>
    } @else {
      <i class="fa-fw fa-bookmark fa-regular"></i>
    }`,
  host: {
    class: 'cursor-pointer',
    '[title]': 'title()',
    '(click)': 'bookmark($event)'
  }
})
export class BookmarkButtonComponent {
  public readonly article = input.required<Partial<Article>>();

  private readonly userSettingsStore = inject(UserSettingsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);

  protected isBookmarked = computed(() => {
    return this.userSettingsStore.isBookmarked(this.article());
  });

  protected title = computed(() => this.transloco.translate('bookmarks.bookmarkDocument'));

  public async bookmark(e: Event) {
    e.stopPropagation();
    const isBookmarked = await this.userSettingsStore.isBookmarked(this.article());

    if (isBookmarked) {
      await this.userSettingsStore.unbookmark(this.article()!.id!);
      // notify.success(this.transloco.translate('bookmarks.bookmarkRemoved'), { duration: 2000 });
    } else {
      let current = this.route.snapshot;
      while (current.firstChild) {
        current = current.firstChild;
      }
      const { queryName } = current.data;
      await this.userSettingsStore.bookmark(this.article()! as Article, queryName);
      // notify.success(this.transloco.translate('bookmarks.bookmarkAdded'), { duration: 2000 });
    }
  }
}
