import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wrench, Phone, User } from 'lucide-react';
import TechnicienForm from '@/components/forms/TechnicienForm';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { technicienService } from '@/services/technicienService';
import { Technicien } from '@/types';
import toast from 'react-hot-toast';

export default function TechniciensPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTechnicien, setSelectedTechnicien] = useState<Technicien | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [stats, setStats] = useState({
    total: 0,
    disponibles: 0,
    specialites: 0,
    interventions: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await technicienService.getTechniciens({ page: 1, limit: 100 });
      const allTechniciens = response.data || [];
      
      const specialitesUniques = new Set(allTechniciens.map(t => t.specialite.libelle));
      const totalInterventions = allTechniciens.reduce((sum, t) => sum + (t._count?.interventions || 0), 0);
      
      setStats({
        total: allTechniciens.length,
        disponibles: Math.floor(allTechniciens.length * 0.8), // Simulated available count
        specialites: specialitesUniques.size,
        interventions: totalInterventions,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchTechniciens = async (params: { page: number; limit: number; search?: string }) => {
    const response = await technicienService.getTechniciens(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleCreate = async (data: CreateTechnicienData) => {
    await technicienService.createTechnicien(data);
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (technicien: Technicien) => {
    setSelectedTechnicien(technicien);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateTechnicienData>) => {
    if (selectedTechnicien) {
      await technicienService.updateTechnicien(selectedTechnicien.id, data);
      setShowEditModal(false);
      setSelectedTechnicien(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) {
      try {
        await technicienService.deleteTechnicien(id);
        toast.success('Technicien supprimé avec succès');
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getSpecialiteColor = (specialite: string) => {
    const colors = {
      'Électricité': 'bg-yellow-100 text-yellow-800',
      'Plomberie': 'bg-blue-100 text-blue-800',
      'Climatisation': 'bg-green-100 text-green-800',
      'Informatique': 'bg-purple-100 text-purple-800',
      'Mécanique': 'bg-red-100 text-red-800',
    };
    
    return colors[specialite as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const columns = [
    {
      key: 'nom' as keyof Technicien,
      title: 'Technicien',
      render: (value: string, record: Technicien) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {getInitials(record.nom, record.prenom)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{record.prenom} {record.nom}</p>
            <p className="text-sm text-gray-500">ID: {record.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact' as keyof Technicien,
      title: 'Contact',
      render: (contact: string) => (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{contact}</span>
        </div>
      ),
    },
    {
      key: 'specialite' as keyof Technicien,
      title: 'Spécialité',
      render: (specialite: Technicien['specialite']) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialiteColor(specialite.libelle)}`}>
          {specialite.libelle}
        </span>
      ),
    },
    {
      key: '_count' as keyof Technicien,
      title: 'Interventions',
      render: (count: Technicien['_count']) => (
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-900">{count?.interventions || 0}</span>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      ),
    },
    {
      key: 'utilisateur' as keyof Technicien,
      title: 'Compte utilisateur',
      render: (utilisateur: Technicien['utilisateur']) => (
        <div>
          {utilisateur ? (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Connecté</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Non connecté</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'statut' as keyof Technicien,
      title: 'Statut',
      render: () => {
        // Simulated status
        const isAvailable = Math.random() > 0.3;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isAvailable ? 'Disponible' : 'En mission'}
          </span>
        );
      },
    },
    {
      key: 'actions' as keyof Technicien,
      title: 'Actions',
      render: (value: any, record: Technicien) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Techniciens</h1>
            <p className="text-gray-600">Gérez votre équipe technique et leurs spécialités</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Technicien</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total techniciens"
            value={stats.total}
            icon={Wrench}
            color="blue"
            trend={{ value: "5%", isPositive: true }}
          />
          <StatCard
            title="Disponibles"
            value={stats.disponibles}
            icon={Wrench}
            color="green"
            trend={{ value: "2%", isPositive: true }}
          />
          <StatCard
            title="Spécialités"
            value={stats.specialites}
            icon={Wrench}
            color="purple"
          />
          <StatCard
            title="Interventions"
            value={stats.interventions}
            icon={Wrench}
            color="yellow"
            trend={{ value: "18%", isPositive: true }}
          />
        </div>

        {/* Répartition par spécialité */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par Spécialité</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-800">Électricité</p>
                <p className="text-2xl font-bold text-yellow-900">3</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                ⚡
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">Plomberie</p>
                <p className="text-2xl font-bold text-blue-900">2</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                🔧
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">Climatisation</p>
                <p className="text-2xl font-bold text-green-900">2</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                ❄️
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-800">Informatique</p>
                <p className="text-2xl font-bold text-purple-900">1</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                💻
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchTechniciens}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />
      </div>

      {/* Modales */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau Technicien"
        size="lg"
      >
        <TechnicienForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTechnicien(null);
        }}
        title="Modifier Technicien"
        size="lg"
      >
        {selectedTechnicien && (
          <TechnicienForm
            technicien={selectedTechnicien}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedTechnicien(null);
            }}
          />
        )}
      </Modal>
    </Layout>
  );
}