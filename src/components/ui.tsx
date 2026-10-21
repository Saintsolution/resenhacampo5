import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = 'text-slate-900',
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  color?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </Card>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants: Record<string, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors text-slate-900 disabled:bg-slate-50"
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors text-slate-900 disabled:bg-slate-50 bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  const sizes: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="text-center py-12 text-slate-400">
      {icon && <div className="flex justify-center mb-3">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );
}
