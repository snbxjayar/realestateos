import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  children?: ReactNode;
  className?: string;
}

export const Alert = ({
  type = 'info',
  title,
  message,
  children,
  className = '',
}: AlertProps) => {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-success bg-opacity-10 border-success border-opacity-30 text-success',
    warning: 'bg-warning bg-opacity-10 border-warning border-opacity-30 text-warning',
    error: 'bg-error bg-opacity-10 border-error border-opacity-30 text-error',
  };

  const icons = {
    info: <Info size={20} />,
    success: <CheckCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    error: <AlertCircle size={20} />,
  };

  return (
    <div className={`border rounded-lg p-4 flex gap-3 ${typeStyles[type]} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <p>{message}</p>
        {children}
      </div>
    </div>
  );
};
