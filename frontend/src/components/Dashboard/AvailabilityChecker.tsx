import React, { useState } from 'react';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

import { AvailabilityResult } from '@/types';

interface AvailabilityCheckerProps {
  technicienIds: number[];
  dateDebut: string;
  dateFin: string;
  onAvailabilityChange: (results: AvailabilityResult[]) => void;
}

export default function AvailabilityChecker({
  technicienIds,
  dateDebut,
  dateFin,
  onAvailabilityChange
}: AvailabilityCheckerProps) {
  const { checking, checkMultiple } = useAvailabilityCheck();
  const [results, setResults] = useState<any[]>([]);

  const handleCheck = async () => {
    try {
      const availabilityResults = await checkMultiple(technicienIds, dateDebut, dateFin);
      setResults(availabilityResults);
      onAvailabilityChange(availabilityResults);
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Vérification de Disponibilité</span>
        </h4>
        <button 
          onClick={handleCheck} 
          disabled={checking || !dateDebut || !dateFin || technicienIds.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {checking ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Vérification...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Vérifier</span>
            </>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(result => (
            <div 
              key={result.technicienId} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                result.available 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  result.available ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {result.available ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <XCircle className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {result.technicien}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.specialite}
                  </p>
                </div>
              </div>
              <div className={`font-medium ${
                result.available 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {result.available ? '✅ Disponible' : '❌ Non disponible'}
              </div>
            </div>
          ))}
        </div>
      )}

      {results.some(r => !r.available) && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Certains techniciens ne sont pas disponibles sur cette période.
              Veuillez modifier les dates ou choisir d'autres techniciens.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}