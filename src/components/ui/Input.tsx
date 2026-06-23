import { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = ({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          className={`
            w-full px-4 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-error focus:border-error focus:ring-error' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};
