import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'quiet'
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', disabled, children, ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
  const styles = {
    primary: 'bg-accent text-bg hover:bg-accent/90',
    ghost: 'border border-line text-ink hover:border-accent hover:text-accent',
    danger: 'bg-danger text-ink hover:bg-danger/90',
    quiet: 'bg-raised text-ink hover:bg-line',
  }[variant]
  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
