import React, { useState, useEffect } from 'react';
import { X, Save, Loader, Plus, Trash2 } from 'lucide-react';
import { interventionService, CreateInterventionData } from '../../services/interventionService';
import { missionService } from '../../services/missionService';
import { technicienService } from '../../services/technicienService';
import { Intervention, Mission, Technicien } from '../../types/api';
import toast from 'react-hot-toast';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  intervention?: Intervention | null;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({ isOpen, onClose, onSuccess, intervention }) => {
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [formData, setFormData] = useState<CreateInterventionData>({
    dateHeureDebut: '',
    dateHeureFin: '',
    duree: undefined,
    missionId: 0,
    technicienId: undefined,
    techniciens: []
  });

  useEffect(() => {
    if (isOpen) {
      loadMissions();
      loadTechniciens();
    }
  }, [isOpen]);

  useEffect(() => {
    if (intervention) {
      // Récupérer le technicien principal
      const principalTechnicien = intervention.techniciens?.find(t => t.role === 'principal');
      const technicienId = principalTechnicien?.id;
      
      // Récupérer les techniciens supplémentaires (sans le principal)
      const additionalTechniciens = intervention.techniciens
        ?.filter(t => t.id !== technicienId)
        .map(t => ({
          id: t.id,
          role: t.role || 'assistant',
          commentaire: t.commentaire
        })) || [];

      setFormData({
        dateHeureDebut: intervention.dateHeureDebut ? new Date(intervention.dateHeureDebut).toISOString().slice(0, 16) : '',
        dateHeureFin: intervention.dateHeureFin ? new Date(intervention.dateHeureFin).toISOString().slice(0, 16) : '',
        duree: intervention.duree,
        missionId: intervention.missionId,
        technicienId: technicienId,
        techniciens: additionalTechniciens
      });
    } else {
      setFormData({
        dateHeureDebut: new Date().toISOString().slice(0, 16),
        dateHeureFin: '',
        duree: undefined,
        missionId: 0,
        technicienId: undefined,
        techniciens: []
      });
    }
  }, [intervention, isOpen]);

  const loadMissions = async () => {
    try {
      const response = await missionService.getMissions(1, 100);
      setMissions(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
    }
  };

  const loadTechniciens = async () => {
    try {
      const response = await technicienService.getTechniciens(1, 100);
      setTechniciens(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error);
    }
  };

  const calculateDuration = () => {
    if (formData.dateHeureDebut && formData.dateHeureFin) {
      const start = new Date(formData.dateHeureDebut);
      const end = new Date(formData.dateHeureFin);
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      setFormData({ ...formData, duree: durationMinutes });
    }
  };

  useEffect(() => {
    calculateDuration();
  }, [formData.dateHeureDebut, formData.dateHeureFin]);

  const handleAddTechnicien = () => {
    setFormData({
      ...formData,
      techniciens: [
        ...(formData.techniciens || []),
        { id: 0, role: 'assistant', commentaire: '' }
      ]
    });
  };

  const handleRemoveTechnicien = (index: number) => {
    const updatedTechniciens = [...(formData.techniciens || [])];
    updatedTechniciens.splice(index, 1);
    setFormData({ ...formData, techniciens: updatedTechniciens });
  };

  const handleTechnicienChange = (index: number, field: string, value: any) => {
    const updatedTechniciens = [...(formData.techniciens || [])];
    updatedTechniciens[index] = {
      ...updatedTechniciens[index],
      [field]: value
    };
    setFormData({ ...formData, techniciens: updatedTechniciens });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filtrer les techniciens valides (avec un ID valide)
      const validTechniciens = formData.techniciens?.filter(t => t.id > 0) || [];
      
      const dataToSend = {
        ...formData,
        dateHeureDebut: formData.dateHeureDebut ? new Date(formData.dateHeureDebut).toISOString() : undefined,
        dateHeureFin: formData.dateHeureFin ? new Date(formData.dateHeureFin).toISOString() : undefined,
        techniciens: validTechniciens
      };

      if (intervention) {
        await interventionService.updateIntervention(intervention.id, dataToSend);
        toast.success('Intervention modifiée avec succès');
      } else {
        await interventionService.createIntervention(dataToSend);
        toast.success('Intervention créée avec succès');
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
            {intervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
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
              Mission *
            </label>
            <select
              required
              value={formData.missionId}
              onChange={(e) => setFormData({ ...formData, missionId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Sélectionner une mission...</option>
              {missions.map((mission) => (
                <option key={mission.numIntervention} value={mission.numIntervention}>
                  #{mission.numIntervention} - {mission.natureIntervention}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technicien principal
            </label>
            <select
              value={formData.technicienId || ''}
              onChange={(e) => setFormData({ ...formData, technicienId: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un technicien...</option>
              {techniciens.map((technicien) => (
                <option key={technicien.id} value={technicien.id}>
                  {technicien.nom} {technicien.prenom} - {technicien.specialite?.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Techniciens supplémentaires */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Techniciens supplémentaires
              </label>
              <button
                type="button"
                onClick={handleAddTechnicien}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </button>
            </div>
            
            {formData.techniciens && formData.techniciens.length > 0 ? (
              <div className="space-y-3">
                {formData.techniciens.map((tech, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={tech.id || ''}
                      onChange={(e) => handleTechnicienChange(index, 'id', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un technicien...</option>
                      {techniciens
                        .filter(t => t.id !== formData.technicienId && 
                                    !formData.techniciens?.some((tech, i) => i !== index && tech.id === t.id))
                        .map((technicien) => (
                          <option key={technicien.id} value={technicien.id}>
                            {technicien.nom} {technicien.prenom} - {technicien.specialite?.libelle}
                          </option>
                        ))}
                    </select>
                    <select
                      value={tech.role || 'assistant'}
                      onChange={(e) => handleTechnicienChange(index, 'role', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="assistant">Assistant</option>
                      <option value="expert">Expert</option>
                      <option value="observateur">Observateur</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveTechnicien(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Aucun technicien supplémentaire</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure de début *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dateHeureDebut}
              onChange={(e) => setFormData({ ...formData, dateHeureDebut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure de fin
            </label>
            <input
              type="datetime-local"
              value={formData.dateHeureFin}
              onChange={(e) => setFormData({ ...formData, dateHeureFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée (minutes)
            </label>
            <input
              type="number"
              readOnly
              value={formData.duree || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Calculée automatiquement à partir des dates de début et de fin
            </p>
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
                  {intervention ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
