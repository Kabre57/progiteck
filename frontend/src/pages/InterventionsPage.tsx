import { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback
import { Plus, Play, Pause, Clock, Users, Calendar, RefreshCw, Edit, Eye, Printer } from 'lucide-react';
import InterventionForm from '@/components/forms/InterventionForm';
import AvailabilityChecker from '@/components/Dashboard/AvailabilityChecker';
import Modal from '@/components/ui/Modal';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import { interventionService } from '@/services/interventionService';
import { Intervention, CreateInterventionData, AvailabilityResult } from '@/types';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import PrintService from '@/services/printService';

export default function InterventionsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTechniciens, setSelectedTechniciens] = useState<number[]>([]);
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult[]>([]);
  
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    terminees: 0,
    dureeMovenne: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await interventionService.getInterventions({ page: 1, limit: 100 });
      const allInterventions = response.data || [];
      
      const enCours = allInterventions.filter(i => !i.dateHeureFin).length;
      const terminees = allInterventions.filter(i => i.dateHeureFin).length;
      
      // Calcul de la durée moyenne
      const interventionsAvecDuree = allInterventions.filter(i => i.duree);
      const dureeMovenne = interventionsAvecDuree.length > 0 
        ? Math.round(interventionsAvecDuree.reduce((sum, i) => sum + (i.duree || 0), 0) / interventionsAvecDuree.length)
        : 0;
      
      setStats({
        total: allInterventions.length,
        enCours,
        terminees,
        dureeMovenne,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchInterventions = async (params: { page: number; limit: number; search?: string }) => {
    const response = await interventionService.getInterventions(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleCreate = async (data: CreateInterventionData) => {
    try {
      await interventionService.createIntervention(data);
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
      toast.success('Intervention créée avec succès');
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Erreur lors de la création';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateInterventionData>) => {
    if (selectedIntervention) {
      try {
        await interventionService.updateIntervention(selectedIntervention.id, data);
        setShowEditModal(false);
        setSelectedIntervention(null);
        setRefreshTrigger(prev => prev + 1);
        toast.success('Intervention modifiée avec succès');
      } catch (error) {
        toast.error('Erreur lors de la modification');
      }
    }
  };

  const handleEndIntervention = async (intervention: Intervention) => {
    try {
      await interventionService.updateIntervention(intervention.id, {
        dateHeureFin: new Date().toISOString(),
      });
      toast.success('Intervention terminée');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la fin d\'intervention');
    }
  };

  // Mémorisation de la fonction pour éviter la boucle infinie
  const handleTechnicienSelection = useCallback((technicienIds: number[]) => {
    setSelectedTechniciens(technicienIds);
    setAvailabilityResults([]); // Reset availability when selection changes
  }, []); // Tableau de dépendances vide car les setters sont stables

  const canCreateIntervention = () => {
    return availabilityResults.length > 0 && 
           availabilityResults.every(r => r.available);
  };

  const getStatusBadge = (intervention: Intervention) => {
    if (intervention.dateHeureFin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
          Terminée
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-1 animate-pulse"></span>
          En cours
        </span>
      );
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) {
      const now = new Date();
      const startDate = new Date(start);
      return differenceInMinutes(now, startDate);
    }
    return differenceInMinutes(new Date(end), new Date(start));
  };

  const getTechniciensList = (techniciens: Intervention['techniciens']) => {
    return techniciens.map(t => ({
      name: `${t.technicien.prenom} ${t.technicien.nom}`,
      role: t.role,
      specialite: t.technicien.specialite.libelle,
    }));
  };

  const columns = [
    {
      key: 'id' as keyof Intervention,
      title: 'ID',
      render: (id: number) => (
        <span className="font-medium text-gray-900">#{id}</span>
      ),
    },
    {
      key: 'mission' as keyof Intervention,
      title: 'Mission',
      render: (mission: Intervention['mission']) => (
        <div>
          <p className="font-medium text-gray-900">{mission.numIntervention}</p>
          <p className="text-sm text-gray-500">{mission.client.nom}</p>
          <p className="text-xs text-gray-400 max-w-xs truncate">{mission.natureIntervention}</p>
        </div>
      ),
    },
    {
      key: 'techniciens' as keyof Intervention,
      title: 'Techniciens',
      render: (techniciens: Intervention['techniciens']) => (
        <div className="space-y-1">
          {getTechniciensList(techniciens).map((tech, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {tech.name.split(' ').map(n => n.charAt(0)).join('')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                <p className="text-xs text-gray-500">{tech.specialite} - {tech.role}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'dateHeureDebut' as keyof Intervention,
      title: 'Début',
      render: (date: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
            </p>
            <p className="text-xs text-gray-500">
              {format(new Date(date), 'HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'dateHeureFin' as keyof Intervention,
      title: 'Fin',
      render: (date: string | undefined, record: Intervention) => {
        if (date) {
          return (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(date), 'HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          );
        }
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-600 font-medium">En cours...</span>
          </div>
        );
      },
    },
    {
      key: 'duree' as keyof Intervention,
      title: 'Durée',
      render: (duree: number | undefined, record: Intervention) => {
        const calculatedDuration = duree || calculateDuration(record.dateHeureDebut, record.dateHeureFin);
        return (
          <div className="text-center">
            <span className="text-lg font-semibold text-gray-900">
              {formatDuration(calculatedDuration)}
            </span>
            {!record.dateHeureFin && (
              <p className="text-xs text-blue-500">En cours</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'statut' as keyof Intervention,
      title: 'Statut',
      render: (_: any, record: Intervention) => getStatusBadge(record),
    },
    {
      key: 'actions' as keyof Intervention,
      title: 'Actions',
      render: (_: unknown, record: Intervention) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedIntervention(record);
              setShowViewModal(true);
            }}
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
          
          <button
            onClick={() => PrintService.printFicheIntervention(record)}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="Imprimer fiche"
          >
            <Printer className="h-4 w-4" />
          </button>
          
          {!record.dateHeureFin ? (
            <button
              onClick={() => handleEndIntervention(record)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Terminer"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-green-600 text-sm">Terminée</span>
          )}
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Interventions</h1>
            <p className="text-gray-600">Suivi en temps réel de vos interventions techniques</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadStats}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle Intervention</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total interventions"
            value={stats.total}
            icon={Calendar}
            color="blue"
            trend={{ value: "15%", isPositive: true }}
          />
          <StatCard
            title="En cours"
            value={stats.enCours}
            icon={Play}
            color="yellow"
            trend={{ value: "3", isPositive: true }}
          />
          <StatCard
            title="Terminées"
            value={stats.terminees}
            icon={Pause}
            color="green"
            trend={{ value: "12%", isPositive: true }}
          />
          <StatCard
            title="Durée moyenne"
            value={`${Math.round(stats.dureeMovenne / 60)}h`}
            icon={Clock}
            color="purple"
            trend={{ value: "30min", isPositive: false }}
          />
        </div>

        {/* Interventions en cours */}
        {stats.enCours > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Play className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-blue-800">Interventions en Cours</h3>
            </div>
            <p className="text-sm text-blue-700">
              {stats.enCours} intervention(s) en cours d'exécution. Surveillez leur progression en temps réel.
            </p>
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchInterventions}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />
      </div>

      {/* Modal Création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle Intervention"
        size="lg"
      >
        <div className="space-y-6">
          <InterventionForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            onTechnicienSelection={handleTechnicienSelection}
          />
          
          {selectedTechniciens.length > 0 && (
            <AvailabilityChecker
              technicienIds={selectedTechniciens}
              dateDebut="2024-03-15T09:00:00Z" // À récupérer du formulaire
              dateFin="2024-03-15T17:00:00Z"   // À récupérer du formulaire
              onAvailabilityChange={setAvailabilityResults}
            />
          )}
        </div>
      </Modal>

      {/* Modal Modification */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedIntervention(null);
        }}
        title="Modifier Intervention"
        size="lg"
      >
        {selectedIntervention && (
          <InterventionForm
            intervention={selectedIntervention}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedIntervention(null);
            }}
          />
        )}
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedIntervention(null);
        }}
        title="Détails de l'Intervention"
        size="xl"
      >
        {selectedIntervention && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mission</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {selectedIntervention.mission.numIntervention} - {selectedIntervention.mission.client.nom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                <div className="mt-1">{getStatusBadge(selectedIntervention)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(new Date(selectedIntervention.dateHeureDebut), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              {selectedIntervention.dateHeureFin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(selectedIntervention.dateHeureFin), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Techniciens assignés
              </label>
              <div className="space-y-2">
                {getTechniciensList(selectedIntervention.techniciens).map((tech, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {tech.name.split(' ').map(n => n.charAt(0)).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{tech.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tech.specialite}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{tech.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
