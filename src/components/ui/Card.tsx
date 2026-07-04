import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        onClick && 'cursor-pointer hover:border-primary-300 transition-colors',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
  subtitle?: string
}

export function StatCard({ title, value, icon, iconBg = 'bg-primary-50', iconColor = 'text-primary-600', subtitle }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={clsx('p-2.5 rounded-lg', iconBg)}>
          <span className={clsx('block', iconColor)}>{icon}</span>
        </div>
      </div>
    </Card>
  )
}
