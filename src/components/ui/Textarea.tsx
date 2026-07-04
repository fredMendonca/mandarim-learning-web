import React from 'react'
import clsx from 'clsx'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          {...props}
          className={clsx(
            'w-full rounded-lg border px-3 py-2 text-sm text-slate-800 bg-white resize-y',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-slate-50 disabled:cursor-not-allowed',
            'transition-colors',
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300',
            className,
          )}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
