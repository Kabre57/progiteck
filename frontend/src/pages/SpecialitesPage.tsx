import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wrench, Users } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { specialiteService } from '@/services/specialiteService';
import { Specialite } from '@/types';
import toast from 'react-hot-toast';

export default function SpecialitesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSpecialite, setSelectedSpecialite] = useState<Specialite | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    techniciens: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Délai plus long pour éviter le rate limiting (3 secondes)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await specialiteService.getSpecialites();
      const specialites = response.data || [];
      
      setStats({
        total: specialites.length,
        actives: specialites.length,
        techniciens: specialites.reduce((sum, s) => sum + (s._count?.techniciens || 0), 0),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback stats
      setStats({
        total: 0,
        actives: 0,
        techniciens: 0,
      });
    }
  };

  const fetchSpecialites = async () => {
    const response = await specialiteService.getSpecialites();
    return {
      data: response.data || [],
      pagination: {
        total: response.data?.length || 0,
        page: 1,
        limit: 100,
        totalPages: 1,
      },
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await specialiteService.createSpecialite(formData);
      toast.success('Spécialité créée avec succès');
      setShowCreateModal(false);
      setFormData({ libelle: '', description: '' });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleEdit = (specialite: Specialite) => {
    setSelectedSpecialite(specialite);
    setFormData({
      libelle: specialite.libelle,
      description: specialite.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpecialite) return;

    try {
      await specialiteService.updateSpecialite(selectedSpecialite.id, formData);
      toast.success('Spécialité modifiée avec succès');
      setShowEditModal(false);
      setSelectedSpecialite(null);
      setFormData({ libelle: '', description: '' });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) {
      try {
        await specialiteService.deleteSpecialite(id);
        toast.success('Spécialité supprimée avec succès');
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const columns = [
    {
      key: 'libelle' as keyof Specialite,
      title: 'Spécialité',
      render: (value: string, record: Specialite) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{record.description || 'Aucune description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: '_count' as keyof Specialite,
      title: 'Techniciens',
      render: (count: Specialite['_count']) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {count?.techniciens || 0} technicien(s)
          </span>
        </div>
      ),
    },
    {
      key: 'statut' as keyof Specialite,
      title: 'Statut',
      render: () => <Badge variant="success">Active</Badge>,
    },
    {
      key: 'actions' as keyof Specialite,
      title: 'Actions',
      render: (value: any, record: Specialite) => (
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Spécialités</h1>
            <p className="text-gray-600">Gérez les spécialités techniques de votre équipe</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Spécialité</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total spécialités"
            value={stats.total}
            icon={Wrench}
            color="blue"
          />
          <StatCard
            title="Spécialités actives"
            value={stats.actives}
            icon={Wrench}
            color="green"
          />
          <StatCard
            title="Techniciens assignés"
            value={stats.techniciens}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchSpecialites}
          pageSize={10}
          searchable={false}
          key={refreshTrigger}
        />

        {/* Modal Création */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ libelle: '', description: '' });
          }}
          title="Nouvelle Spécialité"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé *
              </label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ libelle: '', description: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Modification */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSpecialite(null);
            setFormData({ libelle: '', description: '' });
          }}
          title="Modifier Spécialité"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé *
              </label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSpecialite(null);
                  setFormData({ libelle: '', description: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Modifier
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}