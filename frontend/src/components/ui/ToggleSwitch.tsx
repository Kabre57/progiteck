interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({ 
  checked, 
  onChange, 
  label, 
  description, 
  disabled = false 
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div>
          {label && (
            <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}></div>
      </label>
    </div>
  );
}