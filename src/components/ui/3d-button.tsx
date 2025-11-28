import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type MotionProps } from 'framer-motion';
import { IconLoader2, type TablerIcon } from '@tabler/icons-react';

import { cn } from '@/lib/utils';

const TABLER_ICON_STYLE = { size: 14 };

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 border',
  {
    variants: {
      variant: {
        default:
          'bg-[#aa08f3] text-white hover:bg-[#9010dd] border-[#8706c9] border-b-4 border-b-[#7005b9] shadow-[0_10px_30px_rgba(170,8,243,0.35)]',
        ai: 'bg-[#aa08f3] text-white hover:bg-[#9010dd] border-[#8706c9] border-b-4 border-b-[#7005b9] shadow-[0_10px_30px_rgba(170,8,243,0.35)]',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 border-red-700 border-b-4 border-b-red-600 shadow-md',
        outline:
          'border bg-white hover:bg-neutral-100 border-neutral-300 border-b-4 border-b-neutral-200 shadow-[0_8px_18px_rgba(15,23,42,0.1)]',
        outline_destructive:
          'border text-red-500 bg-white hover:bg-red-50 border-red-600 border-b-4 border-b-red-500 shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground shadow-none',
        ghost_destructive: 'bg-transparent text-red-500 hover:bg-red-100 shadow-none',
        link: 'text-primary underline-offset-4 hover:underline',
        solid: 'bg-zinc-800 text-white hover:bg-zinc-700 shadow-md',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        xs: 'h-8 rounded-md px-4 text-sm',
        icon: 'h-10 w-10 border-b border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type MotionButtonPropsType = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> &
  MotionProps;

export interface ButtonProps extends MotionButtonPropsType {
  asChild?: boolean;
  supportIcon?: TablerIcon;
  leadingIcon?: TablerIcon;
  isLoading?: boolean;
  stretch?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      stretch = false,
      supportIcon = undefined,
      leadingIcon = undefined,
      isLoading = false,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const SupportIconRender = supportIcon ?? React.Fragment;
    const LeadingIconRender = leadingIcon ?? React.Fragment;
    void asChild;
    return (
      <motion.button
        className={cn(
          buttonVariants({ variant, size, className }),
          stretch && 'w-full',
        )}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <IconLoader2 {...TABLER_ICON_STYLE} className="animate-spin" />
        ) : null}
        {!isLoading && supportIcon && <SupportIconRender {...TABLER_ICON_STYLE} />}
        {children}
        {leadingIcon && <LeadingIconRender {...TABLER_ICON_STYLE} />}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';

export type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement>;

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'button-group flex flex-row overflow-hidden rounded-lg border w-fit divide-x',
          '*:rounded-none *:border-none',
          className,
        )}
        {...props}
      />
    );
  },
);

ButtonGroup.displayName = 'ButtonGroup';

export { Button, ButtonGroup, buttonVariants };
