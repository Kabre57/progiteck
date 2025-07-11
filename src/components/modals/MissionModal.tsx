import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { missionService, CreateMissionData } from '../../services/missionService';
import { clientService } from '../../services/clientService';
import { Mission, Client } from '../../types/api';
import toast from 'react-hot-toast';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mission?: Mission | null;
}

export const MissionModal: React.FC<MissionModalProps> = ({ isOpen, onClose, onSuccess, mission }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<CreateMissionData>({
    natureIntervention: '',
    objectifDuContrat: '',
    description: '',
    dateSortieFicheIntervention: '',
    clientId: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (mission) {
      setFormData({
        natureIntervention: mission.natureIntervention,
        objectifDuContrat: mission.objectifDuContrat || '',
        description: mission.description || '',
        dateSortieFicheIntervention: mission.dateSortieFicheIntervention ? new Date(mission.dateSortieFicheIntervention).toISOString().split('T')[0] : '',
        clientId: mission.clientId
      });
    } else {
      setFormData({
        natureIntervention: '',
        objectifDuContrat: '',
        description: '',
        dateSortieFicheIntervention: '',
        clientId: 0
      });
    }
  }, [mission, isOpen]);

  const loadClients = async () => {
    try {
      const response = await clientService.getClients(1, 100);
      setClients(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mission) {
        await missionService.updateMission(mission.numIntervention, formData);
        toast.success('Mission modifiée avec succès');
      } else {
        await missionService.createMission(formData);
        toast.success('Mission créée avec succès');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mission ? 'Modifier la mission' : 'Nouvelle mission'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nature de l'intervention *
            </label>
            <input
              type="text"
              required
              value={formData.natureIntervention}
              onChange={(e) => setFormData({ ...formData, natureIntervention: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Sélectionner un client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom} - {client.entreprise}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectif du contrat
            </label>
            <input
              type="text"
              value={formData.objectifDuContrat}
              onChange={(e) => setFormData({ ...formData, objectifDuContrat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de sortie fiche d'intervention
            </label>
            <input
              type="date"
              value={formData.dateSortieFicheIntervention}
              onChange={(e) => setFormData({ ...formData, dateSortieFicheIntervention: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mission ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};