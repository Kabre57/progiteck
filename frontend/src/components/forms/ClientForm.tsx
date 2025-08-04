import { useState, useEffect } from 'react';
import { typePaiementService } from '@/services/typePaiementService';
import toast from 'react-hot-toast';

import { CreateClientData, Client } from '@/types';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientData | Partial<CreateClientData>) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState({
    nom: client?.nom || '',
    email: client?.email || '',
    telephone: client?.telephone || '',
    entreprise: client?.entreprise || '',
    typeDeCart: client?.typeDeCart || 'Standard',
    typePaiementId: client?.typePaiementId || '',
    localisation: client?.localisation || '',
  });
  const [typesPaiement, setTypesPaiement] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTypesPaiement();
  }, []);

  const loadTypesPaiement = async () => {
    try {
      // Délai plus long pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await typePaiementService.getTypesPaiement();
      setTypesPaiement(response.data || []);
    } catch (error) {
      console.error('Failed to load types paiement:', error);
      setTypesPaiement([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Nettoyer les données avant envoi
      const cleanData: CreateClientData | Partial<CreateClientData> = {
        nom: formData.nom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone?.trim() || undefined,
        entreprise: formData.entreprise?.trim() || undefined,
        typeDeCart: formData.typeDeCart,
        localisation: formData.localisation?.trim() || undefined,
      };
      
      // Ajouter typePaiementId seulement si valide
      if (formData.typePaiementId && 
          formData.typePaiementId !== '' && 
          formData.typePaiementId !== 'undefined' &&
          formData.typePaiementId !== undefined &&
          !isNaN(Number(formData.typePaiementId))) {
        (cleanData as CreateClientData).typePaiementId = Number(formData.typePaiementId);
      }
      
      await onSubmit(cleanData);
    } catch (error: unknown) {
      console.error('Client form error:', error);
      const errorMessage = error && typeof error === 'object'
        ? ('response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
          ? (error.response.data as { message: string }).message
          : ('message' in error ? (error as { message: string }).message : 'Erreur lors de la sauvegarde'))
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entreprise
          </label>
          <input
            type="text"
            name="entreprise"
            value={formData.entreprise}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de carte
          </label>
          <select
            name="typeDeCart"
            value={formData.typeDeCart}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de paiement
          </label>
          <select
            name="typePaiementId"
            value={formData.typePaiementId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionner un type</option>
            {typesPaiement.map((type) => (
              <option key={`client-type-${type.id || Math.random()}`} value={type.id}>
                {type.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Localisation
        </label>
        <textarea
          name="localisation"
          value={formData.localisation}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : (client ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  );
}