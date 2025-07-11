import React, { useState, useEffect } from 'react';
import { X, Save, Loader, Plus, Trash2 } from 'lucide-react';
import { devisService, CreateDevisData } from '../../services/devisService';
import { clientService } from '../../services/clientService';
import { missionService } from '../../services/missionService';
import { Devis } from '../../types/api';
import toast from 'react-hot-toast';

interface DevisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  devis?: Devis | null;
}

interface FormLigneDevis {
  id?: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montantHT?: number;
}

export const DevisModal: React.FC<DevisModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  devis,
}) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [formData, setFormData] = useState<{
    clientId: number;
    missionId?: number;
    titre: string;
    description: string;
    dateValidite: string;
    tauxTVA: number;
    lignes: FormLigneDevis[];
  }>({
    clientId: 0,
    missionId: undefined,
    titre: '',
    description: '',
    dateValidite: '',
    tauxTVA: 18,
    lignes: [
      {
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        montantHT: 0,
      },
    ],
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadMissions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (devis) {
      setFormData({
        clientId: devis.clientId,
        missionId: devis.missionId || undefined,
        titre: devis.titre,
        description: devis.description || '',
        dateValidite: devis.dateValidite.split('T')[0],
        tauxTVA: devis.tauxTVA || 0,
        lignes:
          devis.lignes?.map((ligne) => ({
            id: ligne.id,
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantHT: ligne.montantHT,
          })) || [],
      });
    } else {
      setFormData({
        clientId: 0,
        missionId: undefined,
        titre: '',
        description: '',
        dateValidite: '',
        tauxTVA: 18,
        lignes: [
          {
            designation: '',
            quantite: 1,
            prixUnitaire: 0,
            montantHT: 0,
          },
        ],
      });
    }
  }, [devis, isOpen]);

  const loadClients = async () => {
    try {
      const res = await clientService.getClients(1, 100);
      setClients(res.data);
    } catch {
      toast.error('Erreur chargement clients');
    }
  };

  const loadMissions = async () => {
    try {
      const res = await missionService.getMissions(1, 100);
      setMissions(res.data);
    } catch {
      toast.error('Erreur chargement missions');
    }
  };

  const handleLigneChange = (
    index: number,
    field: keyof FormLigneDevis,
    value: any
  ) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = {
      ...newLignes[index],
      [field]: value,
    };
    if (field === 'quantite' || field === 'prixUnitaire') {
      newLignes[index].montantHT =
        newLignes[index].quantite * newLignes[index].prixUnitaire;
    }
    setFormData({ ...formData, lignes: newLignes });
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [
        ...formData.lignes,
        {
          designation: '',
          quantite: 1,
          prixUnitaire: 0,
        },
      ],
    });
  };

  const removeLigne = (index: number) => {
    const lignes = [...formData.lignes];
    lignes.splice(index, 1);
    setFormData({ ...formData, lignes: lignes });
  };

  const calculateTotals = () => {
    const montantHT = formData.lignes.reduce(
      (acc, l) => acc + l.quantite * l.prixUnitaire,
      0
    );
    const montantTTC = montantHT * (1 + (formData.tauxTVA || 0) / 100);
    return { montantHT, montantTTC };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const lignesFormatted = formData.lignes.map((l) => ({
        designation: l.designation,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      }));

      const dataToSend: CreateDevisData = {
        ...formData,
        lignes: lignesFormatted,
        dateValidite: new Date(formData.dateValidite).toISOString(),
      };

      if (devis) {
        await devisService.updateDevis(devis.id, dataToSend);
        toast.success('Devis modifié');
      } else {
        await devisService.createDevis(dataToSend);
        toast.success('Devis créé');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const { montantHT, montantTTC } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-2 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto my-8 p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {devis ? 'Modifier un devis' : 'Nouveau devis'}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations générales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Client *</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: parseInt(e.target.value) })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Sélectionner</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mission</label>
              <select
                value={formData.missionId || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    missionId: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Aucune</option>
                {missions.map((m) => (
                  <option key={m.numIntervention} value={m.numIntervention}>
                    #{m.numIntervention} - {m.natureIntervention}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Titre *</label>
              <input
                type="text"
                required
                value={formData.titre}
                onChange={(e) =>
                  setFormData({ ...formData, titre: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date de validité *</label>
              <input
                type="date"
                required
                value={formData.dateValidite}
                onChange={(e) =>
                  setFormData({ ...formData, dateValidite: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-sm font-medium">TVA (%)</label>
              <input
                type="number"
                value={formData.tauxTVA}
                onChange={(e) =>
                  setFormData({ ...formData, tauxTVA: parseFloat(e.target.value) })
                }
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          {/* Lignes de devis */}
          <div className="space-y-3">
            {formData.lignes.map((ligne, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-2 rounded"
              >
                <input
                  type="text"
                  required
                  placeholder="Désignation"
                  className="col-span-4 border px-2 py-1 rounded"
                  value={ligne.designation}
                  onChange={(e) =>
                    handleLigneChange(index, 'designation', e.target.value)
                  }
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Qté"
                  className="col-span-2 border px-2 py-1 rounded"
                  value={ligne.quantite}
                  onChange={(e) =>
                    handleLigneChange(index, 'quantite', parseFloat(e.target.value))
                  }
                />
                <input
                  type="number"
                  min="0"
                  placeholder="PU"
                  className="col-span-2 border px-2 py-1 rounded"
                  value={ligne.prixUnitaire}
                  onChange={(e) =>
                    handleLigneChange(
                      index,
                      'prixUnitaire',
                      parseFloat(e.target.value)
                    )
                  }
                />
                <input
                  type="text"
                  readOnly
                  value={(ligne.quantite * ligne.prixUnitaire).toFixed(2)}
                  className="col-span-2 border px-2 py-1 bg-gray-100 rounded"
                />
                <button
                  type="button"
                  onClick={() => removeLigne(index)}
                  className="col-span-1 text-red-500"
                  disabled={formData.lignes.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLigne}
              className="inline-flex items-center text-sm text-blue-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une ligne
            </button>
          </div>

          {/* Totaux */}
          <div className="border-t pt-4 text-right space-y-1 text-sm sm:text-base">
            <div>Total HT : <strong>{montantHT.toFixed(2)} XOF</strong></div>
            <div>TVA ({formData.tauxTVA}%) : <strong>{(montantTTC - montantHT).toFixed(2)} XOF</strong></div>
            <div className="text-lg">
              Total TTC : <strong>{montantTTC.toFixed(2)} XOF</strong>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Enregistrement...
                </div>
              ) : devis ? (
                'Modifier'
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};