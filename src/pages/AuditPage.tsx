import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { StatCard } from '../components/StatCard';
import { 
  Eye, 
  Shield, 
  Activity, 
  AlertTriangle,
  Search,
  Filter,
  Calendar
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState('');
  const [entityType, setEntityType] = useState('');

  // Simulation des données d'audit
  const auditLogs = [
    {
      id: 1,
      user: 'Admin System',
      actionType: 'CREATE',
      entityType: 'CLIENT',
      details: 'Client ACME Corporation créé',
      timestamp: '2024-01-20T10:30:00Z',
      ipAddress: '192.168.1.100'
    },
    {
      id: 2,
      user: 'Jean Dupont',
      actionType: 'UPDATE',
      entityType: 'MISSION',
      details: 'Mission #1001 modifiée',
      timestamp: '2024-01-20T09:15:00Z',
      ipAddress: '192.168.1.101'
    },
    {
      id: 3,
      user: 'Admin System',
      actionType: 'DELETE',
      entityType: 'USER',
      details: 'Utilisateur test supprimé',
      timestamp: '2024-01-19T16:45:00Z',
      ipAddress: '192.168.1.100'
    }
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit</h1>
        <p className="text-gray-600">Journal des actions et traçabilité du système</p>
      </div>

      {/* Statistiques d'audit */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total logs"
          value={1247}
          icon={Eye}
          color="blue"
        />
        <StatCard
          title="Aujourd'hui"
          value={23}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Alertes"
          value={3}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Utilisateurs actifs"
          value={8}
          icon={Shield}
          color="purple"
        />
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'action
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les actions</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'entité
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les entités</option>
              <option value="USER">Utilisateur</option>
              <option value="CLIENT">Client</option>
              <option value="MISSION">Mission</option>
              <option value="INTERVENTION">Intervention</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table des logs d'audit */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Détails
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Heure
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.user}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.actionType)}`}>
                    {log.actionType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.entityType}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {log.details}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};