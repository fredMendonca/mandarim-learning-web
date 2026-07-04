import React from 'react'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            {...props}
            className={clsx(
              'w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm text-slate-800 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              'transition-colors',
              error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300',
              className,
            )}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
