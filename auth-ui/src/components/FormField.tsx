import { type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function FormField({ label, hint, error, id, className = '', ...props }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-surface-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 bg-surface-900 border border-surface-600 rounded-xl text-surface-100 text-sm
          placeholder:text-surface-400 transition-colors duration-200
          focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-surface-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
