import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Calendar, Clock, AlertTriangle } from 'lucide-react';
import MissionForm from '@/components/forms/MissionForm';
import Modal from '@/components/ui/Modal';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import { missionService } from '@/services/missionService';
import { Mission } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

import { CreateMissionData } from '@/types';

export default function MissionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [stats, setStats] = useState({
    total: 0,
    planifiees: 0,
    urgentes: 0,
    enRetard: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Délai plus long pour éviter le rate limiting (3 secondes)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await missionService.getMissions({ page: 1, limit: 100 });
      const allMissions = response.data || [];
      
      setStats({
        total: allMissions.length,
        planifiees: allMissions.filter(m => m.statut === 'planifiee').length,
        urgentes: allMissions.filter(m => m.priorite === 'urgente').length,
        enRetard: allMissions.filter(m => {
          const datePrevu = new Date(m.dateSortieFicheIntervention);
          const maintenant = new Date();
          return datePrevu < maintenant && m.statut !== 'terminee';
        }).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback stats si erreur
      setStats({
        total: 0,
        planifiees: 0,
        urgentes: 0,
        enRetard: 0,
      });
    }
  };

  const fetchMissions = async (params: { page: number; limit: number; search?: string }) => {
    try {
      const response = await missionService.getMissions(params);
      return {
        data: response.data || [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        },
      };
    } catch (error) {
      console.error('Failed to fetch missions:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        },
      };
    }
  };

  const handleCreate = async (data: CreateMissionData) => {
    try {
      console.log('Creating mission with data:', data);
      await missionService.createMission(data);
      toast.success('Mission créée avec succès');
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: unknown) {
      console.error('Failed to create mission:', error);
      // Afficher le message d'erreur exact du backend
      let errorMessage = 'Erreur lors de la création de la mission';
      
      if (error && typeof error === 'object') {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      
      console.error('Mission creation error details:', {
        status: (error as { response?: { status?: number } }).response?.status,
        data: (error as { response?: { data?: unknown } }).response?.data,
        message: errorMessage
      });
      
      toast.error(errorMessage);
    }
  };

  const handleEdit = (mission: Mission) => {
    setSelectedMission(mission);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateMissionData>) => {
    // Note: L'API ne semble pas avoir d'endpoint PUT pour les missions
    // On peut implémenter quand l'endpoint sera disponible
    toast.error('Modification des missions non disponible pour le moment');
  };

  const getPriorityBadge = (mission: Mission) => {
    const isUrgent = mission.priorite === 'urgente' || 
                     mission.natureIntervention.toLowerCase().includes('urgent') || 
                     mission.description?.toLowerCase().includes('urgent');
    
    if (isUrgent) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Urgent
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Normal
      </span>
    );
  };

  const getStatusBadge = (mission: Mission) => {
    const statusMap = {
      planifiee: { label: 'Planifiée', color: 'bg-blue-100 text-blue-800' },
      en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
      terminee: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
      annulee: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    };
    
    const status = statusMap[mission.statut as keyof typeof statusMap] || statusMap.planifiee;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
        {status.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'numIntervention' as keyof Mission,
      title: 'N° Intervention',
      render: (value: string, record: Mission) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          {getPriorityBadge(record)}
        </div>
      ),
    },
    {
      key: 'client' as keyof Mission,
      title: 'Client',
      render: (client: Mission['client']) => (
        <div>
          <p className="font-medium text-gray-900">{client.nom}</p>
          <p className="text-sm text-gray-500">{client.entreprise || 'Particulier'}</p>
        </div>
      ),
    },
    {
      key: 'natureIntervention' as keyof Mission,
      title: 'Nature de l\'intervention',
      render: (value: string, record: Mission) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 max-w-xs truncate">
            {record.description || record.objectifDuContrat}
          </p>
        </div>
      ),
    },
    {
      key: 'dateSortieFicheIntervention' as keyof Mission,
      title: 'Date planifiée',
      render: (date: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">
            {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
          </span>
        </div>
      ),
    },
    {
      key: '_count' as keyof Mission,
      title: 'Interventions',
      render: (count: Mission['_count']) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-900">{count?.interventions || 0}</span>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      ),
    },
    {
      key: 'statut' as keyof Mission,
      title: 'Statut',
      render: (_: any, record: Mission) => getStatusBadge(record),
    },
    {
      key: 'actions' as keyof Mission,
      title: 'Actions',
      render: (_: any, record: Mission) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Voir détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(record)}
            className="text-green-600 hover:text-green-900 p-1"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Missions</h1>
            <p className="text-gray-600">Planifiez et suivez vos missions d'intervention</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Mission</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total missions"
            value={stats.total}
            icon={Calendar}
            color="blue"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="Planifiées"
            value={stats.planifiees}
            icon={Clock}
            color="green"
            trend={{ value: "12%", isPositive: true }}
          />
          <StatCard
            title="Urgentes"
            value={stats.urgentes}
            icon={AlertTriangle}
            color="red"
            trend={{ value: "5%", isPositive: false }}
          />
          <StatCard
            title="En retard"
            value={stats.enRetard}
            icon={AlertTriangle}
            color="yellow"
            trend={{ value: "2%", isPositive: false }}
          />
        </div>

        {/* Missions urgentes */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-medium text-red-800">Missions Urgentes</h3>
          </div>
          <p className="text-sm text-red-700">
            Vous avez {stats.urgentes} mission(s) marquée(s) comme urgente(s) qui nécessitent une attention immédiate.
          </p>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchMissions}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />
      </div>

      {/* Modales */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle Mission"
        size="lg"
      >
        <MissionForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMission(null);
        }}
        title="Modifier Mission"
        size="lg"
      >
        {selectedMission && (
          <MissionForm
            mission={selectedMission}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedMission(null);
            }}
          />
        )}
      </Modal>
    </Layout>
  );
}