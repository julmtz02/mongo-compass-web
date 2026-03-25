import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/20 animate-slide-up ${className}`}>
      {children}
    </div>
  );
}
