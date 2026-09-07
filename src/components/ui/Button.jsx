import { Link } from 'react-router-dom'

/**
 * Buttons are deliberately large and always carry a text label — the people
 * using this are not software-confident, so an icon on its own is not enough.
 */

const VARIANTS = {
  primary:
    'bg-brand-600 text-white border-brand-600 hover:bg-brand-700 hover:border-brand-700 active:bg-brand-800 shadow-sm',
  secondary:
    'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
  danger:
    'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 active:bg-red-800 shadow-sm',
  subtle:
    'bg-slate-100 text-slate-700 border-slate-100 hover:bg-slate-200 hover:border-slate-200',
}

const SIZES = {
  md: 'px-4 py-2.5 text-base gap-2',
  lg: 'px-6 py-3.5 text-lg gap-2.5',
}

function classes({ variant = 'primary', size = 'md', full = false, className = '' }) {
  return [
    'inline-flex items-center justify-center rounded-xl border-2 font-semibold transition',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    full ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export default function Button({
  children,
  icon: Icon,
  variant,
  size = 'md',
  full,
  className,
  type = 'button',
  ...rest
}) {
  return (
    <button type={type} className={classes({ variant, size, full, className })} {...rest}>
      {Icon ? <Icon size={size === 'lg' ? 22 : 20} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

export function LinkButton({ children, icon: Icon, variant, size = 'md', full, className, to, ...rest }) {
  return (
    <Link to={to} className={classes({ variant, size, full, className })} {...rest}>
      {Icon ? <Icon size={size === 'lg' ? 22 : 20} aria-hidden="true" /> : null}
      {children}
    </Link>
  )
}
