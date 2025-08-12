import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';
import { missionService } from '@/services/missionService';
import toast from 'react-hot-toast';
import { Mission } from '@/types';

interface MissionFormProps {
  mission?: Mission;
  onSubmit: (data: MissionFormData) => Promise<void>;
  onCancel: () => void;
}

interface MissionFormData {
  natureIntervention: string;
  objectifDuContrat: string;
  description?: string;
  priorite?: string;
  dateSortieFicheIntervention: string;
  clientId: number;
}

export default function MissionForm({ mission, onSubmit, onCancel }: MissionFormProps) {
  const [formData, setFormData] = useState<MissionFormData>({
    natureIntervention: mission?.natureIntervention || '',
    objectifDuContrat: mission?.objectifDuContrat || '',
    description: mission?.description || '',
    priorite: mission?.priorite || 'normale',
    dateSortieFicheIntervention: mission?.dateSortieFicheIntervention 
      ? new Date(mission.dateSortieFicheIntervention).toISOString().slice(0, 16)
      : '',
    clientId: mission?.clientId || 0
  });

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      setClientLoading(true);
      try {
        const response = await clientService.getClients({ page: 1, limit: 100 });
        setClients(response.data || []);
      } catch (error) {
        console.error('Failed to load clients:', error);
        toast.error('Erreur lors du chargement des clients');
      } finally {
        setClientLoading(false);
      }
    };

    loadClients();
  }, []);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Validation
    if (!formData.clientId) {
      throw new Error('Veuillez sélectionner un client');
    }
    if (!formData.dateSortieFicheIntervention) {
      throw new Error('Veuillez sélectionner une date');
    }
    if (!formData.natureIntervention.trim()) {
      throw new Error('Veuillez saisir la nature de l\'intervention');
    }
    if (!formData.objectifDuContrat.trim()) {
      throw new Error('Veuillez saisir l\'objectif du contrat');
    }

    await onSubmit({
      ...formData,
      clientId: Number(formData.clientId)
    });
  } catch (error: any) {
    console.error('Mission form error:', error);
    toast.error(error.message || 'Erreur lors de la sauvegarde');
  } finally {
    setLoading(false);
  }
};
  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Client *</label>
          {clientLoading ? (
            <div className="animate-pulse py-2 bg-gray-200 rounded"></div>
          ) : (
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.nom} - {client.entreprise || 'Particulier'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="datetime-local"
            name="dateSortieFicheIntervention"
            value={formData.dateSortieFicheIntervention}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nature *</label>
          <input
            type="text"
            name="natureIntervention"
            value={formData.natureIntervention}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priorité</label>
          <select
            name="priorite"
            value={formData.priorite}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="normale">Normale</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Objectif *</label>
        <textarea
          name="objectifDuContrat"
          value={formData.objectifDuContrat}
          onChange={handleChange}
          required
          rows={3}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}