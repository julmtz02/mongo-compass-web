import { type ReactNode } from 'react';

interface AlertProps {
  variant: 'error' | 'success';
  children: ReactNode;
  visible: boolean;
}

const styles = {
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  success: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
};

export function Alert({ variant, children, visible }: AlertProps) {
  if (!visible) return null;
  return (
    <div className={`mb-4 px-4 py-3 rounded-xl border text-sm animate-fade-in ${styles[variant]}`}>
      {children}
    </div>
  );
}
