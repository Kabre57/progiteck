import { useState } from 'react';
import { Materiel, CreateMaterielData } from '@/types';
import toast from 'react-hot-toast';

interface MaterielFormProps {
  materiel?: Materiel;
  onSubmit: (data: CreateMaterielData | Partial<CreateMaterielData>) => Promise<void>;
  onCancel: () => void;
}

export default function MaterielForm({ materiel, onSubmit, onCancel }: MaterielFormProps) {
  const [formData, setFormData] = useState({
    reference: materiel?.reference || '',
    designation: materiel?.designation || '',
    description: materiel?.description || '',
    quantiteTotale: materiel?.quantiteTotale || 0,
    seuilAlerte: materiel?.seuilAlerte || 5,
    emplacement: materiel?.emplacement || '',
    categorie: materiel?.categorie || 'Outillage',
    prixUnitaire: materiel?.prixUnitaire || 0,
    fournisseur: materiel?.fournisseur || '',
    dateAchat: materiel?.dateAchat ? 
      new Date(materiel.dateAchat).toISOString().slice(0, 10) : '',
    garantie: materiel?.garantie || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const cleanData: CreateMaterielData = {
        reference: formData.reference.trim(),
        designation: formData.designation.trim(),
        description: formData.description?.trim() || undefined,
        quantiteTotale: Number(formData.quantiteTotale),
        seuilAlerte: Number(formData.seuilAlerte),
        emplacement: formData.emplacement?.trim() || undefined,
        categorie: formData.categorie,
        prixUnitaire: formData.prixUnitaire ? Number(formData.prixUnitaire) : undefined,
        fournisseur: formData.fournisseur?.trim() || undefined,
        dateAchat: formData.dateAchat || undefined,
        garantie: formData.garantie?.trim() || undefined,
      };
      
      await onSubmit(cleanData);
    } catch (error: unknown) {
      console.error('Materiel form error:', error);
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

  const categories = ['Outillage', 'Pièce', 'Consommable', 'Équipement', 'Sécurité'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Référence *
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            required
            placeholder="REF-001"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Désignation *
          </label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
            placeholder="Perceuse électrique"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Catégorie *
          </label>
          <select
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Emplacement
          </label>
          <input
            type="text"
            name="emplacement"
            value={formData.emplacement}
            onChange={handleChange}
            placeholder="Atelier A - Étagère 2"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantité totale *
          </label>
          <input
            type="number"
            name="quantiteTotale"
            value={formData.quantiteTotale}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Seuil d'alerte *
          </label>
          <input
            type="number"
            name="seuilAlerte"
            value={formData.seuilAlerte}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prix unitaire (FCFA)
          </label>
          <input
            type="number"
            name="prixUnitaire"
            value={formData.prixUnitaire}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fournisseur
          </label>
          <input
            type="text"
            name="fournisseur"
            value={formData.fournisseur}
            onChange={handleChange}
            placeholder="Nom du fournisseur"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date d'achat
          </label>
          <input
            type="date"
            name="dateAchat"
            value={formData.dateAchat}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Garantie
          </label>
          <input
            type="text"
            name="garantie"
            value={formData.garantie}
            onChange={handleChange}
            placeholder="2 ans"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
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
          placeholder="Description détaillée du matériel..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : (materiel ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  );
}