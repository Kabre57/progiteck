import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { rapportService, RapportImage } from '../services/rapportService';
import { interventionService } from '../services/interventionService';
import { missionService } from '../services/missionService';
import { technicienService } from '../services/technicienService';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Plus,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export const RapportFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    interventionId: 0,
    technicienId: 0,
    missionId: 0,
    images: [] as RapportImage[]
  });
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [techniciens, setTechniciens] = useState<any[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  // Charger les données du rapport en mode édition
  const { data: rapportData, loading: rapportLoading, error: rapportError } = useApi(
    () => isEditMode ? rapportService.getRapportById(parseInt(id || '0')) : Promise.resolve(null),
    [id]
  );

  // Charger les missions, interventions et techniciens
  useEffect(() => {
    const loadData = async () => {
      try {
        const [missionsResponse, techniciensResponse] = await Promise.all([
          missionService.getMissions(1, 100),
          technicienService.getTechniciens(1, 100)
        ]);
        
        setMissions(missionsResponse.data);
        setTechniciens(techniciensResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };
    
    loadData();
  }, []);

  // Charger les interventions lorsqu'une mission est sélectionnée
  useEffect(() => {
    if (formData.missionId) {
      const loadInterventions = async () => {
        try {
          // Simuler le chargement des interventions pour la mission sélectionnée
          // Dans une implémentation réelle, vous feriez un appel API
          const interventionsData = missions
            .find(m => m.numIntervention === formData.missionId)?.interventions || [];
          
          setInterventions(interventionsData);
        } catch (error) {
          console.error('Erreur lors du chargement des interventions:', error);
        }
      };
      
      loadInterventions();
    } else {
      setInterventions([]);
    }
  }, [formData.missionId, missions]);

  // Initialiser le formulaire en mode édition
  useEffect(() => {
    if (isEditMode && rapportData) {
      setFormData({
        titre: rapportData.titre,
        contenu: rapportData.contenu,
        interventionId: rapportData.interventionId,
        technicienId: rapportData.technicienId,
        missionId: rapportData.missionId,
        images: rapportData.images || []
      });
    }
  }, [isEditMode, rapportData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titre.trim() || !formData.contenu.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode) {
        // Mettre à jour le rapport existant
        await rapportService.updateRapport(parseInt(id || '0'), {
          titre: formData.titre,
          contenu: formData.contenu,
          images: formData.images
        });
        toast.success('Rapport mis à jour avec succès');
      } else {
        // Créer un nouveau rapport
        await rapportService.createRapport(formData);
        toast.success('Rapport créé avec succès');
      }
      
      navigate('/rapports');
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du rapport:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setImageUploading(true);
    
    // Simuler l'upload d'images
    const newImages: RapportImage[] = [];
    
    Array.from(files).forEach(file => {
      // Dans une implémentation réelle, vous enverriez le fichier au serveur
      // et recevriez l'URL de l'image stockée
      
      // Créer une URL temporaire pour l'aperçu
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push({
          url: reader.result as string,
          description: ''
        });
        
        // Si toutes les images ont été traitées
        if (newImages.length === files.length) {
          setFormData({
            ...formData,
            images: [...formData.images, ...newImages]
          });
          setImageUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleImageDescriptionChange = (index: number, description: string) => {
    const newImages = [...formData.images];
    newImages[index] = { ...newImages[index], description };
    setFormData({ ...formData, images: newImages });
  };

  if (isEditMode && rapportLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isEditMode && rapportError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur: {rapportError}</p>
        <button 
          onClick={() => navigate('/rapports')}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Retour à la liste des rapports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/rapports')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Modifier le rapport' : 'Nouveau rapport'}
            </h1>
            <p className="text-gray-600">
              {isEditMode ? `Rapport #${id}` : 'Créer un nouveau rapport de mission'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                id="titre"
                required
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titre du rapport"
              />
            </div>
            
            {!isEditMode && (
              <>
                <div>
                  <label htmlFor="missionId" className="block text-sm font-medium text-gray-700 mb-1">
                    Mission *
                  </label>
                  <select
                    id="missionId"
                    required
                    value={formData.missionId}
                    onChange={(e) => setFormData({ ...formData, missionId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une mission...</option>
                    {missions.map((mission) => (
                      <option key={mission.numIntervention} value={mission.numIntervention}>
                        #{mission.numIntervention} - {mission.natureIntervention}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="interventionId" className="block text-sm font-medium text-gray-700 mb-1">
                    Intervention *
                  </label>
                  <select
                    id="interventionId"
                    required
                    value={formData.interventionId}
                    onChange={(e) => setFormData({ ...formData, interventionId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.missionId}
                  >
                    <option value="">Sélectionner une intervention...</option>
                    {interventions.map((intervention) => (
                      <option key={intervention.id} value={intervention.id}>
                        #{intervention.id} - {intervention.dateHeureDebut ? new Date(intervention.dateHeureDebut).toLocaleDateString('fr-FR') : 'Non planifiée'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="technicienId" className="block text-sm font-medium text-gray-700 mb-1">
                    Technicien *
                  </label>
                  <select
                    id="technicienId"
                    required
                    value={formData.technicienId}
                    onChange={(e) => setFormData({ ...formData, technicienId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un technicien...</option>
                    {techniciens.map((technicien) => (
                      <option key={technicien.id} value={technicien.id}>
                        {technicien.nom} {technicien.prenom} - {technicien.specialite?.libelle || 'Non spécifié'}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="contenu" className="block text-sm font-medium text-gray-700 mb-1">
              Contenu du rapport *
            </label>
            <textarea
              id="contenu"
              required
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={10}
              placeholder="Détaillez votre rapport d'intervention..."
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Images
              </label>
              <button
                type="button"
                onClick={handleImageUpload}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-1" />
                Ajouter des images
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>
            
            {imageUploading && (
              <div className="flex items-center justify-center h-20 bg-gray-50 rounded-md mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Chargement des images...</span>
              </div>
            )}
            
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="border rounded-md p-2 relative">
                    <img
                      src={image.url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-40 object-cover rounded-md mb-2"
                    />
                    <input
                      type="text"
                      value={image.description || ''}
                      onChange={(e) => handleImageDescriptionChange(index, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Description de l'image"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-md">
                <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Aucune image ajoutée</p>
                <button
                  type="button"
                  onClick={handleImageUpload}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Cliquez pour ajouter des images
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/rapports')}
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};