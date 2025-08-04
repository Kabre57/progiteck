import React from 'react';
import { AlertTriangle, Clock, FileText, DollarSign, Settings } from 'lucide-react';

interface PriorityTasksProps {
  tasks?: {
    devisValidationDG: PriorityTask[];
    devisValidationPDG: PriorityTask[];
    rapportsValidation: PriorityTask[];
    facturesRetard: PriorityTask[];
    interventionsAujourdhui: PriorityTask[];
  };
}

interface PriorityTask {
  id: number;
  numero?: string;
  titre?: string;
  client?: string;
  technicien?: string;
  mission?: string;
  priorite: string;
  joursRetard?: number;
  heureDebut?: string;
}

export default function PriorityTasks({ tasks }: PriorityTasksProps) {
  if (!tasks) return <div>Aucune tâche prioritaire</div>;

  const allTasks = [
    ...tasks.facturesRetard.map(t => ({ ...t, type: 'facture', priority: 'critique' })),
    ...tasks.devisValidationDG.map(t => ({ ...t, type: 'devis-dg', priority: 'haute' })),
    ...tasks.devisValidationPDG.map(t => ({ ...t, type: 'devis-pdg', priority: 'haute' })),
    ...tasks.interventionsAujourdhui.map(t => ({ ...t, type: 'intervention', priority: 'haute' })),
    ...tasks.rapportsValidation.map(t => ({ ...t, type: 'rapport', priority: 'moyenne' }))
  ].sort((a, b) => {
    const priorityOrder = { critique: 0, haute: 1, moyenne: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'facture': return <DollarSign className="h-5 w-5" />;
      case 'devis-dg': return <FileText className="h-5 w-5" />;
      case 'devis-pdg': return <FileText className="h-5 w-5" />;
      case 'intervention': return <Settings className="h-5 w-5" />;
      case 'rapport': return <FileText className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getTaskTitle = (task: any) => {
    switch (task.type) {
      case 'facture': return `Facture ${task.numero}`;
      case 'devis-dg': return `Devis ${task.numero} (DG)`;
      case 'devis-pdg': return `Devis ${task.numero} (PDG)`;
      case 'intervention': return `Intervention Mission ${task.mission}`;
      case 'rapport': return `Rapport ${task.titre}`;
      default: return 'Tâche';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critique': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'haute': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'moyenne': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Tâches Prioritaires ({allTasks.length})
        </h3>
      </div>
      
      <div className="space-y-3">
        {allTasks.slice(0, 8).map((task, index) => (
          <div 
            key={`${task.type}-${task.id}-${index}`}
            className={`flex items-center justify-between p-3 border-l-4 rounded-r-lg ${getPriorityColor(task.priority)}`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-gray-600 dark:text-gray-400">
                {getTaskIcon(task.type)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {getTaskTitle(task)}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {task.client || task.technicien}
                </p>
                {task.joursRetard && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {task.joursRetard} jours de retard
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'critique' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                task.priority === 'haute' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {task.priority.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {allTasks.length > 8 && (
        <button className="mt-4 w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          Voir toutes les tâches ({allTasks.length})
        </button>
      )}
    </div>
  );
}