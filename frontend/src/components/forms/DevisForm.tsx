import { useState, useEffect, useMemo } from 'react';
import { Devis } from '@/types';
import { clientService } from '@/services/clientService';
import { missionService } from '@/services/missionService';
import toast from 'react-hot-toast';

interface DevisFormProps {
  devis?: Devis;
  onSubmit: (data: CreateDevisData | Partial<CreateDevisData>) => Promise<void>;
  onCancel: () => void;
}

export default function DevisForm({ devis, onSubmit, onCancel }: DevisFormProps) {
  // État du formulaire
  const [formData, setFormData] = useState({
    clientId: devis?.clientId || '',
    missionId: devis?.missionId || '',
    titre: devis?.titre || '',
    description: devis?.description || '',
    tauxTVA: devis?.tauxTVA || 20,
    dateValidite: devis?.dateValidite ? 
      new Date(devis.dateValidite).toISOString().slice(0, 10) : '',
    lignes: devis?.lignes || [
      { designation: '', quantite: 1, prixUnitaire: 0, ordre: 1 }
    ],
  });
  
  // États pour les données chargées
  const [clients, setClients] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Chargement des données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([loadClients(), loadMissions()]);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };
    
    loadData();
  }, []);

  // Chargement des clients avec gestion d'erreur
  const loadClients = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Délai réduit
      const response = await clientService.getClients({ page: 1, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Échec du chargement des clients:', error);
      setClients([]);
      throw error;
    }
  };

  // Chargement des missions avec gestion d'erreur
  const loadMissions = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Délai réduit
      const response = await missionService.getMissions({ page: 1, limit: 100 });
      setMissions(response.data || []);
    } catch (error) {
      console.error('Échec du chargement des missions:', error);
      setMissions([]);
      throw error;
    }
  };

  // Validation du formulaire
  const validateForm = (): string[] => {
    const validationErrors: string[] = [];
    
    if (!formData.clientId) validationErrors.push('Un client doit être sélectionné');
    if (!formData.titre.trim()) validationErrors.push('Le titre est requis');
    if (!formData.dateValidite) validationErrors.push('La date de validité est requise');
    
    // Validation des lignes
    formData.lignes.forEach((ligne, index) => {
      if (!ligne.designation.trim()) {
        validationErrors.push(`La ligne ${index + 1} doit avoir une désignation`);
      }
      if (ligne.quantite <= 0) {
        validationErrors.push(`La quantité de la ligne ${index + 1} doit être positive`);
      }
      if (ligne.prixUnitaire < 0) {
        validationErrors.push(`Le prix unitaire de la ligne ${index + 1} ne peut être négatif`);
      }
    });
    
    return validationErrors;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setLoading(true);
    setErrors([]);
    
    try {
      await onSubmit({
        ...formData,
        clientId: Number(formData.clientId),
        missionId: formData.missionId ? Number(formData.missionId) : undefined,
        dateValidite: new Date(formData.dateValidite).toISOString(),
        lignes: formData.lignes
          .filter(l => l.designation.trim())
          .map((l, index) => ({ ...l, ordre: index + 1 })),
      });
      toast.success(devis ? 'Devis modifié avec succès' : 'Devis créé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde du devis');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des lignes
  const addLigne = () => {
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, { 
        designation: '', 
        quantite: 1, 
        prixUnitaire: 0, 
        ordre: prev.lignes.length + 1 
      }],
    }));
  };

  const removeLigne = (index: number) => {
    if (formData.lignes.length <= 1) {
      toast.error('Un devis doit avoir au moins une ligne');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  const updateLigne = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newLignes = [...prev.lignes];
      newLignes[index] = { ...newLignes[index], [field]: value };
      return { ...prev, lignes: newLignes };
    });
  };

  // Calcul des montants (mémoïsé)
  const { montantHT, montantTVA, montantTTC } = useMemo(() => {
    const ht = formData.lignes.reduce(
      (sum, ligne) => sum + (ligne.quantite * ligne.prixUnitaire), 
      0
    );
    const tva = ht * (formData.tauxTVA / 100);
    const ttc = ht + tva;
    
    return {
      montantHT: Math.round(ht * 100) / 100,
      montantTVA: Math.round(tva * 100) / 100,
      montantTTC: Math.round(ttc * 100) / 100
    };
  }, [formData.lignes, formData.tauxTVA]);

  // Formatage monétaire
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Affichage des erreurs globales */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Veuillez corriger les erreurs suivantes:
          </h3>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700 dark:text-red-300">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client */}
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Client *
          </label>
          <select
            id="client"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-required="true"
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={`client-${client.id}`} value={client.id}>
                {client.nom} - {client.entreprise || 'Particulier'}
              </option>
            ))}
          </select>
        </div>

        {/* Mission */}
        // Dans la partie Mission du formulaire
<div>
  <label htmlFor="mission" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Mission (optionnel)
  </label>
  <select
    id="mission"
    value={formData.missionId}
    onChange={(e) => setFormData({ ...formData, missionId: e.target.value })}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
  >
    <option value="">Sélectionner une mission</option>
    {missions.map((mission, index) => (
      <option 
        key={`mission-${mission.id || index}`} 
        value={mission.id}
      >
        {mission.numIntervention} - {mission.natureIntervention}
      </option>
    ))}
  </select>
</div>

        {/* Titre */}
        <div>
          <label htmlFor="titre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titre *
          </label>
          <input
            id="titre"
            type="text"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-required="true"
          />
        </div>

        {/* Date de validité */}
        <div>
          <label htmlFor="dateValidite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date de validité *
          </label>
          <input
            id="dateValidite"
            type="date"
            value={formData.dateValidite}
            onChange={(e) => setFormData({ ...formData, dateValidite: e.target.value })}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-required="true"
          />
        </div>

        {/* Taux TVA */}
        <div>
          <label htmlFor="tauxTVA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Taux TVA (%)
          </label>
          <input
            id="tauxTVA"
            type="number"
            value={formData.tauxTVA}
            onChange={(e) => setFormData({ ...formData, tauxTVA: Number(e.target.value) })}
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Lignes du devis */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lignes du devis
          </h2>
          <button
            type="button"
            onClick={addLigne}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Ajouter une ligne"
          >
            Ajouter Ligne
          </button>
        </div>

        {formData.lignes.map((ligne, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
            {/* Désignation */}
            <div className="md:col-span-2">
              <label htmlFor={`designation-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Désignation *
              </label>
              <input
                id={`designation-${index}`}
                type="text"
                value={ligne.designation}
                onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-required="true"
              />
            </div>

            {/* Quantité */}
            <div>
              <label htmlFor={`quantite-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantité *
              </label>
              <input
                id={`quantite-${index}`}
                type="number"
                value={ligne.quantite}
                onChange={(e) => updateLigne(index, 'quantite', Number(e.target.value))}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-required="true"
              />
            </div>

            {/* Prix unitaire */}
            <div>
              <label htmlFor={`prixUnitaire-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix unitaire (XOF) *
              </label>
              <input
                id={`prixUnitaire-${index}`}
                type="number"
                value={ligne.prixUnitaire}
                onChange={(e) => updateLigne(index, 'prixUnitaire', Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                aria-required="true"
              />
            </div>

            {/* Actions ligne */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total: {formatMontant(ligne.quantite * ligne.prixUnitaire)}
              </span>
              <button
                type="button"
                onClick={() => removeLigne(index)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label={`Supprimer la ligne ${index + 1}`}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Montant HT:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatMontant(montantHT)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">TVA ({formData.tauxTVA}%):</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatMontant(montantTVA)}
          </span>
        </div>
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-base font-medium text-gray-900 dark:text-white">Montant TTC:</span>
          <span className="text-base font-bold text-gray-900 dark:text-white">
            {formatMontant(montantTTC)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sauvegarde en cours...' : (devis ? 'Modifier le devis' : 'Créer le devis')}
        </button>
      </div>
    </form>
  );
}