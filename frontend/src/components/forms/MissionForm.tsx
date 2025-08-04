import { useState, useEffect } from 'react';
import { Mission } from '@/types';
import { clientService } from '@/services/clientService';
import toast from 'react-hot-toast';

interface MissionFormProps {
  mission?: Mission;
  onSubmit: (data: CreateMissionData | Partial<CreateMissionData>) => Promise<void>;
  onCancel: () => void;
}

export default function MissionForm({ mission, onSubmit, onCancel }: MissionFormProps) {
  const [formData, setFormData] = useState({
    natureIntervention: mission?.natureIntervention || '',
    objectifDuContrat: mission?.objectifDuContrat || '',
    description: mission?.description || '',
    priorite: mission?.priorite || 'normale',
    statut: mission?.statut || 'planifiee',
    dateSortieFicheIntervention: mission?.dateSortieFicheIntervention ? 
      new Date(mission.dateSortieFicheIntervention).toISOString().slice(0, 16) : '',
    clientId: mission?.clientId || '',
  });
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      // Délai plus long pour éviter le rate limiting (3 secondes)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await clientService.getClients({ page: 1, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      toast.error('Erreur lors du chargement des clients');
      // Fallback avec données vides pour éviter le crash
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    
    if (!formData.dateSortieFicheIntervention) {
      toast.error('Veuillez sélectionner une date de sortie');
      return;
    }
    
    if (!formData.natureIntervention.trim()) {
      toast.error('Veuillez saisir la nature de l\'intervention');
      return;
    }
    
    if (!formData.objectifDuContrat.trim()) {
      toast.error('Veuillez saisir l\'objectif du contrat');
      return;
    }
    
    setLoading(true);
    
    try {
      // Préparer les données selon le format exact attendu
      const missionData: CreateMissionData = {
        natureIntervention: formData.natureIntervention.trim(),
        objectifDuContrat: formData.objectifDuContrat.trim(),
        clientId: Number(formData.clientId),
        dateSortieFicheIntervention: new Date(formData.dateSortieFicheIntervention).toISOString(),
        description: formData.description && formData.description.trim() ? formData.description.trim() : undefined,
        priorite: formData.priorite && formData.priorite !== 'normale' ? formData.priorite as 'normale' | 'urgente' : undefined,
        statut: formData.statut && formData.statut !== 'planifiee' ? formData.statut as 'planifiee' | 'en_cours' | 'terminee' | 'annulee' : undefined,
      };
      
      console.log('Submitting mission:', missionData);
      await onSubmit(missionData);
    } catch (error: unknown) {
      console.error('Error submitting mission:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nature de l'intervention *
          </label>
          <input
            type="text"
            name="natureIntervention"
            value={formData.natureIntervention}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Client *
          </label>
          {loadingClients ? (
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              Chargement des clients...
            </div>
          ) : (
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={`client-${client.id}`} value={client.id}>
                {client.nom} - {client.entreprise || 'Particulier'}
              </option>
            ))}
          </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priorité
          </label>
          <select
            name="priorite"
            value={formData.priorite}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="normale">Normale</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Statut
          </label>
          <select
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date de sortie *
          </label>
          <input
            type="datetime-local"
            name="dateSortieFicheIntervention"
            value={formData.dateSortieFicheIntervention}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Objectif du contrat *
        </label>
        <input
          type="text"
          name="objectifDuContrat"
          value={formData.objectifDuContrat}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : (mission ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  );
}