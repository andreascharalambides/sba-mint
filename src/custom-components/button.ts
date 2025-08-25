import { computed, Directive, input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@sinequa/ui';

const buttonVariants = cva(
  cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:text-muted-foreground disabled:pointer-events-none',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        default: ['bg-muted text-foreground', 'hover:bg-foreground/5'],
        primary: ['bg-primary text-primary-foreground', 'hover:bg-primary-hover', 'active:bg-primary-active', 'disabled:bg-muted'],
        secondary: ['bg-secondary text-secondary-foreground', 'hover:bg-secondary-hover', 'active:bg-secondary-active', 'disabled:bg-secondary-disabled'],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive-hover',
          'active:bg-destructive-active',
          'disabled:bg-destructive-disabled'
        ],
        ghost: ['bg-transparent text-foreground', 'hover:bg-foreground/10'],
        icon: ['bg-transparent text-foreground'],
        ai: [
          'from-ai-from via-ai-via to-ai-to text-ai-foreground',
          'hover:from-ai-from/80 hover:via-ai-via/80 hover:to-ai-to/80',
          'active:from-ai-from/60 active:via-ai-via/60 active:to-ai-to/60',
          'disabled:text-ai-foreground disabled:opacity-30'
        ],
        none: ''
      },
      decoration: {
        outline: 'border border-foreground/20 bg-transparent active:bg-transparent disabled:bg-transparent',
        underline: 'bg-transparent hover:underline hover:bg-transparent active:bg-transparent disabled:bg-transparent',
        none: ''
      },
      size: {
        default: 'h-8 px-3 py-0',
        xs: 'h-4 rounded-xs px-0',
        sm: 'h-6 rounded-md',
        lg: 'h-11 px-8',
        icon: 'size-8'
      }
    },
    compoundVariants: [
      { decoration: 'none', variant: 'ai', class: ['bg-gradient-to-r'] },
      {
        decoration: 'outline',
        variant: 'primary',
        class: ['text-primary border-primary hover:bg-primary/10 active:bg-primary/20 disabled:border-primary/20 disabled:text-primary/20']
      },
      {
        decoration: 'outline',
        variant: 'secondary',
        class: ['text-secondary border-secondary hover:bg-secondary/10 active:bg-secondary/20 disabled:border-secondary/20 disabled:text-secondary/20']
      },
      {
        decoration: 'outline',
        variant: 'destructive',
        class: [
          'text-destructive border-destructive hover:bg-destructive/10 active:bg-destructive/20 disabled:border-destructive/20 disabled:text-destructive/20'
        ]
      },
      { decoration: 'outline', variant: 'ai', class: ['[&>span]:text-ai border-bg-ai-100/0 hover:border-bg-ai-100/10 active:border-bg-ai-100/20'] },
      { decoration: 'underline', variant: 'primary', class: ['text-primary disabled:text-primary-disabled'] },
      { decoration: 'underline', variant: 'secondary', class: ['text-secondary disabled:text-secondary-disabled'] },
      { decoration: 'underline', variant: 'destructive', class: ['text-destructive disabled:text-destructive-disabled'] },
      { decoration: 'underline', variant: 'ai', class: ['[&>span]:text-ai hover:[&>span]:after:underline-ai no-underline!'] }
    ],
    defaultVariants: {
      variant: 'default',
      decoration: 'none',
      size: 'default'
    }
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: 'button',
  standalone: true,
  host: {
    '[class]': `variants()`
  }
})
export class ButtonComponent {
  class = input<string>();
  variant = input<ButtonVariants['variant']>('default');
  decoration = input<ButtonVariants['decoration']>('none');
  size = input<ButtonVariants['size']>('default');
  variants = computed(() => {
    if (this.variant() === 'none') return this.class();
    return cn(buttonVariants({ variant: this.variant(), decoration: this.decoration(), size: this.size(), class: this.class() }));
  });
}
