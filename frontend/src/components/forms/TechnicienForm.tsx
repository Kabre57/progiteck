import { useState, useEffect } from 'react';
import { specialiteService } from '@/services/specialiteService';
import toast from 'react-hot-toast';

import { CreateTechnicienData, Technicien } from '@/types';

interface TechnicienFormProps {
  technicien?: Technicien;
  onSubmit: (data: CreateTechnicienData | Partial<CreateTechnicienData>) => Promise<void>;
  onCancel: () => void;
}

export default function TechnicienForm({ technicien, onSubmit, onCancel }: TechnicienFormProps) {
  const [formData, setFormData] = useState({
    nom: technicien?.nom || '',
    prenom: technicien?.prenom || '',
    contact: technicien?.contact || '',
    specialiteId: technicien?.specialiteId || '',
    utilisateurId: technicien?.utilisateurId || '',
  });
  const [specialites, setSpecialites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSpecialites();
  }, []);

  const loadSpecialites = async () => {
    try {
      // Délai plus long pour éviter le rate limiting (3 secondes)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await specialiteService.getSpecialites();
      setSpecialites(response.data || []);
    } catch (error) {
      console.error('Failed to load specialites:', error);
      setSpecialites([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({
        ...formData,
        specialiteId: Number(formData.specialiteId),
        utilisateurId: formData.utilisateurId ? Number(formData.utilisateurId) : undefined,
      });
      toast.success(technicien ? 'Technicien modifié avec succès' : 'Technicien créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prénom *
          </label>
          <input
            type="text"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact *
          </label>
          <input
            type="tel"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Spécialité *
          </label>
          <select
            name="specialiteId"
            value={formData.specialiteId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Sélectionner une spécialité</option>
            {specialites.map((specialite) => (
              <option key={`tech-specialite-${specialite.id || Math.random()}`} value={specialite.id}>
                {specialite.libelle}
              </option>
            ))}
          </select>
        </div>
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
          {loading ? 'Sauvegarde...' : (technicien ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  );
}