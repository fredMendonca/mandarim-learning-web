import React from 'react'
import clsx from 'clsx'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  emptyMessage?: string
  className?: string
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Nenhum registro encontrado.',
  className,
}: TableProps<T>) {
  return (
    <div className={clsx('overflow-x-auto rounded-lg border border-slate-200', className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-400 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={clsx('px-4 py-3 text-slate-700', col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
