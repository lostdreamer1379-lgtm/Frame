import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent-outline';
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md' | 'icon-lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?:      ButtonVariant;
  size?:         ButtonSize;
  loading?:      boolean;
  icon?:         React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?:     React.ReactNode;
  fullWidth?:    boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--bg-main)] hover:bg-[var(--accent-hover)] font-semibold',
  secondary:
    'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
  danger:
    'bg-[var(--danger)]/10 border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/20',
  'accent-outline':
    'bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-muted)]',
};

const sizes: Record<ButtonSize, string> = {
  xs:        'h-7  px-2.5 text-xs   rounded-md gap-1.5',
  sm:        'h-8  px-3   text-sm   rounded-md gap-2',
  md:        'h-9  px-4   text-sm   rounded-lg gap-2',
  lg:        'h-11 px-6   text-base rounded-lg gap-2.5',
  'icon-sm': 'h-8  w-8    rounded-md',
  'icon-md': 'h-9  w-9    rounded-lg',
  'icon-lg': 'h-10 w-10   rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      className = '',
      fullWidth = false,
      onClick,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const isIcon     = size.startsWith('icon');

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        whileTap={{ scale: isDisabled ? 1 : 0.96 }}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        className={[
          'inline-flex items-center justify-center transition-colors duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-main)]',
          variants[variant],
          sizes[size],
          isDisabled ? 'opacity-40 cursor-not-allowed' : '',
          fullWidth ? 'w-full' : '',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      >
        {loading && (
          <Loader2 className="animate-spin shrink-0" size={14} />
        )}
        {!loading && icon && (iconPosition === 'left' || isIcon) && (
          <span className="shrink-0">{icon}</span>
        )}
        {!isIcon && children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && !isIcon && (
          <span className="shrink-0">{icon}</span>
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
