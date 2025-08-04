import { ReactNode } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}

export default function SettingsCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  action 
}: SettingsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}