import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}: ButtonProps) => {
  const variantStyles = {
    primary:
      'bg-primary text-white hover:bg-opacity-90 active:bg-opacity-80',
    secondary:
      'bg-accent text-white hover:bg-opacity-90 active:bg-opacity-80',
    outline:
      'border-2 border-primary text-primary hover:bg-primary hover:bg-opacity-10',
    ghost: 'text-primary hover:bg-primary hover:bg-opacity-10',
    danger:
      'bg-error text-white hover:bg-opacity-90 active:bg-opacity-80',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? '⏳' : children}
    </button>
  );
};
