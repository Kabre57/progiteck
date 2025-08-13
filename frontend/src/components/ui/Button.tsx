import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  className?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded transition-colors focus:outline-none ${variantClasses[variant] || ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
