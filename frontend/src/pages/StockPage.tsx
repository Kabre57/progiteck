import { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, Search, Filter } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import MaterielForm from '@/components/forms/MaterielForm';
import { stockService } from '@/services/stockService';
import { useAuth } from '@/hooks/useAuth';
import { Materiel } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function StockPage() {
  const { hasRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterCategorie, setFilterCategorie] = useState('');
  const [showAlertes, setShowAlertes] = useState(false);
  
  const [stats, setStats] = useState({
    totalMateriels: 0,
    enStock: 0,
    enAlerte: 0,
    valeurStock: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await stockService.getMateriels({ page: 1, limit: 1000 });
      const materiels = response.data || [];
      
      const enAlerte = materiels.filter(m => m.quantiteDisponible <= m.seuilAlerte).length;
      const valeurStock = materiels.reduce((sum, m) => sum + (m.quantiteDisponible * (m.prixUnitaire || 0)), 0);
      
      setStats({
        totalMateriels: materiels.length,
        enStock: materiels.filter(m => m.quantiteDisponible > 0).length,
        enAlerte,
        valeurStock,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchMateriels = async (params: { page: number; limit: number; search?: string }) => {
    const response = await stockService.getMateriels({
      ...params,
      categorie: filterCategorie || undefined,
      seuilAlerte: showAlertes || undefined
    });
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleCreate = async (data: CreateMaterielData) => {
    try {
      await stockService.createMateriel(data);
      toast.success('Matériel créé avec succès');
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleEdit = (materiel: Materiel) => {
    setSelectedMateriel(materiel);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateMaterielData>) => {
    if (selectedMateriel) {
      try {
        await stockService.updateMateriel(selectedMateriel.id, data);
        toast.success('Matériel modifié avec succès');
        setShowEditModal(false);
        setSelectedMateriel(null);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de la modification');
      }
    }
  };

  const getStockBadge = (materiel: Materiel) => {
    if (materiel.quantiteDisponible === 0) {
      return <Badge variant="error">Rupture</Badge>;
    } else if (materiel.quantiteDisponible <= materiel.seuilAlerte) {
      return <Badge variant="warning">Alerte</Badge>;
    } else {
      return <Badge variant="success">En stock</Badge>;
    }
  };

  const getCategorieColor = (categorie: string) => {
    const colors = {
      'Outillage': 'bg-blue-100 text-blue-800',
      'Pièce': 'bg-green-100 text-green-800',
      'Consommable': 'bg-yellow-100 text-yellow-800',
      'Équipement': 'bg-purple-100 text-purple-800',
      'Sécurité': 'bg-red-100 text-red-800',
    };
    return colors[categorie as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'reference' as keyof Materiel,
      title: 'Référence',
      render: (value: string, record: Materiel) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{record.designation}</p>
        </div>
      ),
    },
    {
      key: 'categorie' as keyof Materiel,
      title: 'Catégorie',
      render: (categorie: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategorieColor(categorie)}`}>
          {categorie}
        </span>
      ),
    },
    {
      key: 'quantiteDisponible' as keyof Materiel,
      title: 'Stock',
      render: (quantite: number, record: Materiel) => (
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{quantite}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">/ {record.quantiteTotale}</p>
        </div>
      ),
    },
    {
      key: 'seuilAlerte' as keyof Materiel,
      title: 'Seuil',
      render: (seuil: number) => (
        <span className="text-sm text-gray-900 dark:text-white">{seuil}</span>
      ),
    },
    {
      key: 'emplacement' as keyof Materiel,
      title: 'Emplacement',
      render: (emplacement: string) => (
        <span className="text-sm text-gray-900 dark:text-white">{emplacement || '-'}</span>
      ),
    },
    {
      key: 'prixUnitaire' as keyof Materiel,
      title: 'Prix unitaire',
      render: (prix: number) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {prix ? `${prix.toLocaleString('fr-FR')} FCFA` : '-'}
        </span>
      ),
    },
    {
      key: 'statut' as keyof Materiel,
      title: 'Statut',
      render: (value: any, record: Materiel) => getStockBadge(record),
    },
    {
      key: 'actions' as keyof Materiel,
      title: 'Actions',
      render: (value: any, record: Materiel) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
            title="Modifier"
          >
            <Package className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const categories = ['Outillage', 'Pièce', 'Consommable', 'Équipement', 'Sécurité'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion du Stock</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez vos équipements et matériels d'intervention</p>
          </div>
          {hasRole(['admin', 'manager']) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Matériel</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total matériels"
            value={stats.totalMateriels}
            icon={Package}
            color="blue"
            trend={{ value: "5%", isPositive: true }}
          />
          <StatCard
            title="En stock"
            value={stats.enStock}
            icon={TrendingUp}
            color="green"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="Alertes stock"
            value={stats.enAlerte}
            icon={AlertTriangle}
            color="red"
            trend={{ value: "2", isPositive: false }}
          />
          <StatCard
            title="Valeur stock"
            value={`${stats.valeurStock.toLocaleString('fr-FR')} FCFA`}
            icon={TrendingDown}
            color="purple"
          />
        </div>

        {/* Alertes stock */}
        {stats.enAlerte > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Alertes de Stock</h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400">
              {stats.enAlerte} matériel(s) en dessous du seuil d'alerte. Réapprovisionnement nécessaire.
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={filterCategorie}
                onChange={(e) => setFilterCategorie(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="alertes"
                checked={showAlertes}
                onChange={(e) => setShowAlertes(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="alertes" className="text-sm text-gray-700 dark:text-gray-300">
                Afficher uniquement les alertes
              </label>
            </div>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchMateriels}
          pageSize={10}
          searchable={true}
          key={`${refreshTrigger}-${filterCategorie}-${showAlertes}`}
        />

        {/* Modal Création */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouveau Matériel"
          size="lg"
        >
          <MaterielForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Modal Modification */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMateriel(null);
          }}
          title="Modifier Matériel"
          size="lg"
        >
          {selectedMateriel && (
            <MaterielForm
              materiel={selectedMateriel}
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedMateriel(null);
              }}
            />
          )}
        </Modal>
      </div>
    </Layout>
  );
}