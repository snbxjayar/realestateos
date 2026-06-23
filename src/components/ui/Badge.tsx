import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  children: ReactNode;
  className?: string;
}

export const Badge = ({
  variant = 'primary',
  children,
  className = '',
}: BadgeProps) => {
  const variantStyles = {
    primary: 'bg-primary bg-opacity-10 text-primary',
    secondary: 'bg-accent bg-opacity-10 text-accent',
    success: 'bg-success bg-opacity-10 text-success',
    warning: 'bg-warning bg-opacity-10 text-warning',
    error: 'bg-error bg-opacity-10 text-error',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
