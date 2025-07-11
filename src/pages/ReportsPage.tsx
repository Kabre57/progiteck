import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { StatCard } from '../components/StatCard';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  Briefcase,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('clients');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Appel API pour générer le rapport
      toast.success('Rapport généré avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'clients', label: 'Rapport Clients', icon: Users },
    { value: 'missions', label: 'Rapport Missions', icon: Briefcase },
    { value: 'interventions', label: 'Rapport Interventions', icon: Settings },
    { value: 'techniciens', label: 'Rapport Techniciens', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-600">Générez et consultez vos rapports d'activité</p>
      </div>

      {/* Statistiques des rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Rapports générés"
          value={24}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Ce mois"
          value={8}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Téléchargements"
          value={156}
          icon={Download}
          color="purple"
        />
        <StatCard
          title="Tendance"
          value="+12%"
          icon={TrendingUp}
          color="yellow"
        />
      </div>

      {/* Générateur de rapports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Générer un nouveau rapport
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de rapport
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Génération...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Générer le rapport
              </>
            )}
          </button>
        </div>
      </div>

      {/* Liste des rapports récents */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Rapports récents
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Rapport Clients - Janvier 2024</p>
                  <p className="text-xs text-gray-500">Généré le 15/01/2024</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-900">
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Rapport Interventions - Décembre 2023</p>
                  <p className="text-xs text-gray-500">Généré le 31/12/2023</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-900">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};