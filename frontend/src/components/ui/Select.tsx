import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ label, error, className = '', children, ...props }) => {
  return (
    <div className={`mb-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="text-xs text-red-600 mt-1 block">{error}</span>
      )}
    </div>
  );
};

export default Select;
