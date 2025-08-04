import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { missionService } from '@/services/missionService';
import { technicienService } from '@/services/technicienService';
import { interventionService } from '@/services/interventionService';
import { CreateRapportRequest, Mission, Technicien, Intervention, RapportImage } from '@/types';

interface RapportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRapportRequest) => Promise<void>;
  initialData?: CreateRapportRequest & { id?: number };
}

export default function RapportForm({ isOpen, onClose, onSubmit, initialData }: RapportFormProps) {
  const [formData, setFormData] = useState<CreateRapportRequest>({
    titre: '',
    contenu: '',
    interventionId: undefined,
    technicienId: 0,
    missionId: '',
    images: [],
  });
  const [missions, setMissions] = useState<Mission[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMissions();
      loadTechniciens();
      if (initialData) {
        setFormData({
          titre: initialData.titre || '',
          contenu: initialData.contenu || '',
          interventionId: initialData.interventionId,
          technicienId: initialData.technicienId || 0,
          missionId: initialData.missionId || '',
          images: initialData.images || [],
        });
        if (initialData.missionId) {
          loadInterventionsByMission(initialData.missionId);
        }
      } else {
        setFormData({
          titre: '',
          contenu: '',
          interventionId: undefined,
          technicienId: 0,
          missionId: '',
          images: [],
        });
      }
    }
  }, [isOpen, initialData]);

  const loadMissions = async () => {
    try {
      const response = await missionService.getMissions({ page: 1, limit: 100 });
      setMissions(response.data || []);
    } catch (error) {
      console.error('Failed to load missions:', error);
      toast.error('Erreur lors du chargement des missions.');
    }
  };

  const loadTechniciens = async () => {
    try {
      const response = await technicienService.getTechniciens({ page: 1, limit: 100 });
      setTechniciens(response.data || []);
    } catch (error) {
      console.error('Failed to load techniciens:', error);
      toast.error('Erreur lors du chargement des techniciens.');
    }
  };

  const loadInterventionsByMission = async (missionId: string) => {
    try {
      const response = await interventionService.getInterventions({ page: 1, limit: 100, missionId });
      setInterventions(response.data || []);
    } catch (error) {
      console.error('Failed to load interventions:', error);
      toast.error('Erreur lors du chargement des interventions pour cette mission.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'missionId' && value) {
      loadInterventionsByMission(value);
    } else if (name === 'missionId' && !value) {
      setInterventions([]);
      setFormData(prev => ({ ...prev, interventionId: undefined }));
    }
  };

  const handleImageChange = (index: number, field: keyof RapportImage, value: string) => {
    const newImages = [...formData.images!];
    newImages[index] = { ...newImages[index], [field]: value };
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleAddImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images!, { url: '', description: '', ordre: prev.images!.length + 1 }],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images!.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!formData.titre || !formData.contenu || !formData.technicienId || !formData.missionId) {
        toast.error('Veuillez remplir tous les champs obligatoires.');
        setLoading(false);
        return;
      }

      // Ensure technicienId is a number
      const dataToSubmit = {
        ...formData,
        technicienId: Number(formData.technicienId),
        interventionId: formData.interventionId ? Number(formData.interventionId) : undefined,
        images: formData.images?.filter(img => img.url !== '').map((img, index) => ({ ...img, ordre: index + 1 })) || [],
      };

      await onSubmit(dataToSubmit);
      toast.success(`Rapport ${initialData ? 'mis à jour' : 'créé'} avec succès !`);
      onClose();
    } catch (error: any) {
      console.error('Error submitting rapport:', error);
      toast.error(`Erreur lors de la sauvegarde du rapport: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Modifier le Rapport' : 'Nouveau Rapport'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre du Rapport"
          name="titre"
          value={formData.titre}
          onChange={handleChange}
          required
        />
        <Textarea
          label="Contenu du Rapport"
          name="contenu"
          value={formData.contenu}
          onChange={handleChange}
          required
        />
        <Select
          label="Mission"
          name="missionId"
          value={formData.missionId}
          onChange={handleChange}
          required
        >
          <option value="">Sélectionner une mission</option>
          {missions.map(mission => (
            <option key={mission.numIntervention} value={mission.numIntervention}>
              {mission.numIntervention} - {mission.natureIntervention}
            </option>
          ))}
        </Select>
        {formData.missionId && interventions.length > 0 && (
          <Select
            label="Intervention (Optionnel)"
            name="interventionId"
            value={formData.interventionId || ''}
            onChange={handleChange}
          >
            <option value="">Sélectionner une intervention</option>
            {interventions.map(intervention => (
              <option key={intervention.id} value={intervention.id}>
                {intervention.id} - {new Date(intervention.dateHeureDebut).toLocaleDateString()}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="Technicien Responsable"
          name="technicienId"
          value={formData.technicienId}
          onChange={handleChange}
          required
        >
          <option value="">Sélectionner un technicien</option>
          {techniciens.map(tech => (
            <option key={tech.id} value={tech.id}>
              {tech.prenom} {tech.nom} ({tech.specialite?.libelle})
            </option>
          ))}
        </Select>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images du Rapport</label>
          {formData.images?.map((image, index) => (
            <div key={index} className="flex items-end space-x-2">
              <div className="flex-grow">
                <Input
                  label={`URL Image ${index + 1}`}
                  name="url"
                  value={image.url}
                  onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <Input
                  label="Description (optionnel)"
                  name="description"
                  value={image.description}
                  onChange={(e) => handleImageChange(index, 'description', e.target.value)}
                  placeholder="Description de l'image"
                />
              </div>
              <Button type="button" variant="destructive" onClick={() => handleRemoveImage(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddImage} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Ajouter une image</span>
          </Button>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sauvegarde...' : initialData ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}


