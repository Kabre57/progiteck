import { useState, useEffect } from 'react';
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
  
  const [clients, setClients] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
    loadMissions();
  }, []);

  const loadClients = async () => {
    try {
      // Délai plus long pour éviter le rate limiting (3 secondes)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await clientService.getClients({ page: 1, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
    }
  };

  const loadMissions = async () => {
    try {
      // Délai plus long pour éviter le rate limiting (4 secondes)
      await new Promise(resolve => setTimeout(resolve, 4000));
      const response = await missionService.getMissions({ page: 1, limit: 100 });
      setMissions(response.data || []);
    } catch (error) {
      console.error('Failed to load missions:', error);
      setMissions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({
        ...formData,
        clientId: Number(formData.clientId),
        missionId: formData.missionId ? Number(formData.missionId) : undefined,
        dateValidite: new Date(formData.dateValidite).toISOString(),
        lignes: formData.lignes.filter(l => l.designation.trim()),
      });
      toast.success(devis ? 'Devis modifié avec succès' : 'Devis créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [...formData.lignes, { 
        designation: '', 
        quantite: 1, 
        prixUnitaire: 0, 
        ordre: formData.lignes.length + 1 
      }],
    });
  };

  const removeLigne = (index: number) => {
    const newLignes = formData.lignes.filter((_, i) => i !== index);
    setFormData({ ...formData, lignes: newLignes });
  };

  const updateLigne = (index: number, field: string, value: any) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setFormData({ ...formData, lignes: newLignes });
  };

  // Calcul automatique des montants
  const calculateMontants = () => {
    const montantHT = formData.lignes.reduce((sum, ligne) => {
      return sum + (ligne.quantite * ligne.prixUnitaire);
    }, 0);
    
    const montantTVA = montantHT * (formData.tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;
    
    return {
      montantHT: Math.round(montantHT * 100) / 100,
      montantTVA: Math.round(montantTVA * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100
    };
  };

  const montants = calculateMontants();

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Client *
          </label>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Sélectionner un client</option>
            {clients.map((client) => (
              <option key={`devis-client-${client.id || Math.random()}`} value={client.id}>
                {client.nom} - {client.entreprise || 'Particulier'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mission (optionnel)
          </label>
          <select
            value={formData.missionId}
            onChange={(e) => setFormData({ ...formData, missionId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Sélectionner une mission</option>
            {missions.map((mission) => (
              <option key={`devis-mission-${mission.id || mission.numIntervention || Math.random()}`} value={mission.id || mission.numIntervention}>
                {mission.numIntervention} - {mission.natureIntervention}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titre *
          </label>
          <input
            type="text"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date de validité *
          </label>
          <input
            type="date"
            value={formData.dateValidite}
            onChange={(e) => setFormData({ ...formData, dateValidite: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Taux TVA (%)
          </label>
          <input
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Lignes du devis */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lignes du devis
          </label>
          <button
            type="button"
            onClick={addLigne}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Ajouter Ligne
          </button>
        </div>

        {formData.lignes.map((ligne, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-md">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Désignation
              </label>
              <input
                type="text"
                value={ligne.designation}
                onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantité
              </label>
              <input
                type="number"
                value={ligne.quantite}
                onChange={(e) => updateLigne(index, 'quantite', Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix unitaire (FCFA)
              </label>
              <input
                type="number"
                value={ligne.prixUnitaire}
                onChange={(e) => updateLigne(index, 'prixUnitaire', Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total: {formatMontant(ligne.quantite * ligne.prixUnitaire)}
              </span>
              {formData.lignes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLigne(index)}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totaux */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Montant HT:</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatMontant(montants.montantHT)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">TVA ({formData.tauxTVA}%):</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatMontant(montants.montantTVA)}
          </span>
        </div>
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-base font-medium text-gray-900 dark:text-white">Montant TTC:</span>
          <span className="text-base font-bold text-gray-900 dark:text-white">
            {formatMontant(montants.montantTTC)}
          </span>
        </div>
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
          {loading ? 'Sauvegarde...' : (devis ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </form>
  );
}