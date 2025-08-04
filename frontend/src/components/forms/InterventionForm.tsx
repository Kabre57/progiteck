import { useState, useEffect } from 'react';
import { Intervention, CreateInterventionData } from '@/types';
import { missionService } from '@/services/missionService';
import { technicienService } from '@/services/technicienService';
import { stockService } from '@/services/stockService';
import toast from 'react-hot-toast';

interface InterventionFormProps {
  intervention?: Intervention;
  onSubmit: (data: CreateInterventionData | Partial<CreateInterventionData>) => Promise<void>;
  onCancel: () => void;
  onTechnicienSelection?: (technicienIds: number[]) => void;
}

export default function InterventionForm({ 
  intervention, 
  onSubmit, 
  onCancel, 
  onTechnicienSelection 
}: InterventionFormProps) {
  const [formData, setFormData] = useState({
    missionId: intervention?.missionId || '',
    dateHeureDebut: intervention?.dateHeureDebut ? 
      new Date(intervention.dateHeureDebut).toISOString().slice(0, 16) : '',
    dateHeureFin: intervention?.dateHeureFin ? 
      new Date(intervention.dateHeureFin).toISOString().slice(0, 16) : '',
    techniciens: intervention?.techniciens || [],
  });

  const [missions, setMissions] = useState<any[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);
  const [materiels, setMateriels] = useState<any[]>([]);
  const [selectedTechniciens, setSelectedTechniciens] = useState<any[]>([]);
  const [selectedMateriels, setSelectedMateriels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [loadingTechniciens, setLoadingTechniciens] = useState(false);
  const [loadingMateriels, setLoadingMateriels] = useState(false);

  useEffect(() => {
    loadMissions();
    loadTechniciens();
    loadMateriels();
  }, []);

  useEffect(() => {
    // Notifier le parent des techniciens sélectionnés
    if (onTechnicienSelection) {
      // ✅ CORRECTION : Convertir les IDs en entiers et filtrer les valeurs vides
      const technicienIds = selectedTechniciens
        .map(t => parseInt(t.technicienId))
        .filter(id => !isNaN(id));
      onTechnicienSelection(technicienIds);
    }
  }, [selectedTechniciens, onTechnicienSelection]);

  // Initialiser les données lors de la modification
  useEffect(() => {
    if (intervention) {
      // Initialiser les techniciens sélectionnés
      if (intervention.techniciens && intervention.techniciens.length > 0) {
        const technicienData = intervention.techniciens.map(ti => ({
          technicienId: ti.technicienId.toString(),
          role: ti.role || 'principal',
          commentaire: ti.commentaire || ''
        }));
        setSelectedTechniciens(technicienData);
      }
      
      // Initialiser les matériels sélectionnés (si disponibles)
      if (intervention.sortiesMateriels && intervention.sortiesMateriels.length > 0) {
        const materielData = intervention.sortiesMateriels.map(sm => ({
          materielId: sm.materiel.id.toString(),
          quantite: sm.quantite || 1,
          commentaire: sm.commentaire || ''
        }));
        setSelectedMateriels(materielData);
      }
    }
  }, [intervention]);

  const loadMissions = async () => {
    setLoadingMissions(true);
    try {
      const response = await missionService.getMissions({ page: 1, limit: 100 });
      console.log('Missions loaded:', response); // Log détaillé pour debug
      setMissions(response.data || []);
    } catch (error) {
      console.error('Failed to load missions:', error);
      // Log plus détaillé de l'erreur
      if (error && typeof error === 'object') {
        if ('response' in error) {
          console.error('API Response error:', (error as any).response?.data);
        }
        if ('message' in error) {
          console.error('Error message:', (error as any).message);
        }
      }
      toast.error('Erreur lors du chargement des missions');
      setMissions([]);
    } finally {
      setLoadingMissions(false);
    }
  };

  const loadTechniciens = async () => {
    setLoadingTechniciens(true);
    try {
      const response = await technicienService.getTechniciens({ page: 1, limit: 100 });
      console.log('Techniciens loaded:', response); // Log détaillé pour debug
      setTechniciens(response.data || []);
    } catch (error) {
      console.error('Failed to load techniciens:', error);
      // Log plus détaillé de l'erreur
      if (error && typeof error === 'object') {
        if ('response' in error) {
          console.error('API Response error:', (error as any).response?.data);
        }
        if ('message' in error) {
          console.error('Error message:', (error as any).message);
        }
      }
      toast.error('Erreur lors du chargement des techniciens');
      setTechniciens([]);
    } finally {
      setLoadingTechniciens(false);
    }
  };

  const loadMateriels = async () => {
    setLoadingMateriels(true);
    try {
      const response = await stockService.getMateriels({ page: 1, limit: 1000 });
      console.log('Matériels loaded:', response);
      setMateriels(response.data || []);
    } catch (error) {
      console.error('Failed to load matériels:', error);
      toast.error('Erreur lors du chargement des matériels');
      setMateriels([]);
    } finally {
      setLoadingMateriels(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.missionId) {
      toast.error('Veuillez sélectionner une mission');
      return;
    }
    
    if (!formData.dateHeureDebut) {
      toast.error('Veuillez sélectionner une date/heure de début');
      return;
    }
    
    if (selectedTechniciens.length === 0) {
      toast.error('Veuillez assigner au moins un technicien');
      return;
    }

    // Validation des techniciens sélectionnés
    const invalidTechniciens = selectedTechniciens.filter(tech => !tech.technicienId || tech.technicienId === '');
    if (invalidTechniciens.length > 0) {
      toast.error('Veuillez sélectionner tous les techniciens');
      return;
    }
    
    setLoading(true);
    
    try {
      const interventionData: CreateInterventionData = {
        missionId: formData.missionId, // Garder comme string car numIntervention est un string
        dateHeureDebut: new Date(formData.dateHeureDebut).toISOString(),
        dateHeureFin: formData.dateHeureFin ? new Date(formData.dateHeureFin).toISOString() : undefined,
        // ✅ CORRECTION : S'assurer que les IDs des techniciens sont des entiers
        techniciens: selectedTechniciens.map(tech => ({
          technicienId: parseInt(tech.technicienId),
          role: tech.role,
          commentaire: tech.commentaire
        })),
        // ✅ AJOUT : Inclure les matériels sélectionnés
        materiels: selectedMateriels.length > 0 ? selectedMateriels.map(mat => ({
          materielId: parseInt(mat.materielId),
          quantite: mat.quantite,
          commentaire: mat.commentaire
        })) : undefined,
      };
      
      console.log('Submitting intervention:', interventionData);
      await onSubmit(interventionData);
    } catch (error: unknown) {
      console.error('Error submitting intervention:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as { message: string }).message 
        : 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTechnicienAdd = () => {
    setSelectedTechniciens(prev => [...prev, {
      technicienId: '',
      role: 'principal',
      commentaire: '',
    }]);
  };

  const handleTechnicienUpdate = (index: number, field: string, value: string) => {
    setSelectedTechniciens(prev => prev.map((tech, i) => 
      i === index ? { 
        ...tech, 
        // ✅ CORRECTION : Garder technicienId comme string dans l'état local pour la compatibilité avec les selects
        // La conversion en entier se fera lors de la soumission et de la notification au parent
        [field]: value 
      } : tech
    ));
  };

  const handleTechnicienRemove = (index: number) => {
    setSelectedTechniciens(prev => prev.filter((_, i) => i !== index));
  };

  const handleMaterielAdd = () => {
    setSelectedMateriels(prev => [...prev, {
      materielId: '',
      quantite: 1,
      commentaire: '',
    }]);
  };

  const handleMaterielUpdate = (index: number, field: string, value: string | number) => {
    setSelectedMateriels(prev => prev.map((mat, i) => 
      i === index ? { 
        ...mat, 
        [field]: value 
      } : mat
    ));
  };

  const handleMaterielRemove = (index: number) => {
    setSelectedMateriels(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mission *
          </label>
          {loadingMissions ? (
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              Chargement des missions...
            </div>
          ) : (
            <select
              name="missionId"
              value={formData.missionId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner une mission</option>
              {missions.map((mission) => (
                <option key={mission.numIntervention} value={mission.numIntervention}>
                  {mission.numIntervention} - {mission.client?.nom} - {mission.natureIntervention}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
          {/* Date et Heure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date et Heure de Début *
          </label>
          <input
            type="datetime-local"
            name="dateHeureDebut"
            value={formData.dateHeureDebut}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date et Heure de Fin
          </label>
          <input
            type="datetime-local"
            name="dateHeureFin"
            value={formData.dateHeureFin}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>


      {/* Section Techniciens assignés */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Techniciens assignés
          </label>
          <button
            type="button"
            onClick={handleTechnicienAdd}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Ajouter Technicien
          </button>
        </div>

        {selectedTechniciens.map((tech, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Technicien
              </label>
              {loadingTechniciens ? (
                <div className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Chargement...
                </div>
              ) : (
                <select
                  value={tech.technicienId}
                  onChange={(e) => handleTechnicienUpdate(index, 'technicienId', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner</option>
                  {techniciens.map((technicien) => (
                    <option key={technicien.id} value={technicien.id}>
                      {technicien.prenom} {technicien.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Rôle
              </label>
              <select
                value={tech.role}
                onChange={(e) => handleTechnicienUpdate(index, 'role', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="principal">Principal</option>
                <option value="assistant">Assistant</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Commentaire
              </label>
              <input
                type="text"
                value={tech.commentaire}
                onChange={(e) => handleTechnicienUpdate(index, 'commentaire', e.target.value)}
                placeholder="Responsabilités..."
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleTechnicienRemove(index)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}

        {selectedTechniciens.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
            Aucun technicien assigné. Cliquez sur "Ajouter Technicien" pour commencer.
          </div>
        )}
      </div>

      {/* Matériel requis */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Matériel requis
          </label>
          <button
            type="button"
            onClick={handleMaterielAdd}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Ajouter du matériel
          </button>
        </div>
        
        {selectedMateriels.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
            Aucun matériel requis pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedMateriels.map((mat, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Matériel
                  </label>
                  {loadingMateriels ? (
                    <div className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Chargement...
                    </div>
                  ) : (
                    <select
                      value={mat.materielId}
                      onChange={(e) => handleMaterielUpdate(index, 'materielId', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Sélectionner</option>
                      {materiels.map((materiel) => (
                        <option key={materiel.id} value={materiel.id}>
                          {materiel.nom} - {materiel.reference}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mat.quantite}
                    onChange={(e) => handleMaterielUpdate(index, 'quantite', parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Commentaire
                  </label>
                  <input
                    type="text"
                    value={mat.commentaire}
                    onChange={(e) => handleMaterielUpdate(index, 'commentaire', e.target.value)}
                    placeholder="Optionnel"
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleMaterielRemove(index)}
                    className="w-full px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vérification de Disponibilité */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Vérification de Disponibilité
            </span>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Vérification...
          </button>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sauvegarde...' : (intervention ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  );
}
