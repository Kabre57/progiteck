import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { specialiteService, CreateSpecialiteData } from '../../services/specialiteService';
import { Specialite } from '../../types/api';
import toast from 'react-hot-toast';

interface SpecialiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  specialite?: Specialite | null;
}

export const SpecialiteModal: React.FC<SpecialiteModalProps> = ({ isOpen, onClose, onSuccess, specialite }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSpecialiteData>({
    libelle: '',
    description: ''
  });

  useEffect(() => {
    if (specialite) {
      setFormData({
        libelle: specialite.libelle,
        description: specialite.description || ''
      });
    } else {
      setFormData({
        libelle: '',
        description: ''
      });
    }
  }, [specialite, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (specialite) {
        await specialiteService.updateSpecialite(specialite.id, formData);
        toast.success('Spécialité modifiée avec succès');
      } else {
        await specialiteService.createSpecialite(formData);
        toast.success('Spécialité créée avec succès');
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
            {specialite ? 'Modifier la spécialité' : 'Nouvelle spécialité'}
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
              Libellé *
            </label>
            <input
              type="text"
              required
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {specialite ? 'Modifier' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};