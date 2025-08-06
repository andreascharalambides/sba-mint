import { Directive, HostListener, inject, input } from '@angular/core';
import { Article, isNotInputEvent } from '@sinequa/atomic';
import { SelectionService } from '@sinequa/atomic-angular';

export type SelectionStrategy = 'replace' | 'stack';

/**
 * Directive that selects an article on click.
 */
@Directive({
  selector: '[appSelectArticleOnClick],[selectArticleOnClick]',
  standalone: true,
  host: {
    '(keydown.enter)': 'onEnter($event)'
  }
})
export class SelectArticleOnClickDirective {
  private readonly selectionService = inject(SelectionService);

  public readonly article = input.required<Partial<Article> | undefined>();
  public readonly strategy = input<SelectionStrategy>('stack');

  public onEnter(e: Event): void {
    if (e && isNotInputEvent(e as KeyboardEvent)) {
      this.onClick();
    }
  }

  @HostListener('click')
  public onClick(): void {
    const article = this.article();
    console.log('Directive clicked, article:', article);
    if (!article || !article.id) return;

    this.selectionService.setCurrentArticle(article as Article);
  }
}
