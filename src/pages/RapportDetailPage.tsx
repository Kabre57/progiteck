import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { rapportService } from '../services/rapportService';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Edit, 
  FileText, 
  Image, 
  Trash2, 
  User, 
  XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export const RapportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFullImage, setShowFullImage] = useState<string | null>(null);

  const { data: rapport, loading, error, refetch } = useApi(
    () => rapportService.getRapportById(parseInt(id || '0')),
    [id]
  );

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await rapportService.deleteRapport(parseInt(id || '0'));
        toast.success('Rapport supprimé avec succès');
        navigate('/rapports');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleValidate = async (statut: 'validé' | 'rejeté') => {
    const commentaire = prompt(
      statut === 'validé' 
        ? 'Commentaire de validation (optionnel)' 
        : 'Motif du rejet (optionnel)'
    );
    
    try {
      await rapportService.validateRapport(parseInt(id || '0'), { statut, commentaire: commentaire || undefined });
      toast.success(statut === 'validé' ? 'Rapport validé' : 'Rapport rejeté');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleEdit = () => {
    navigate(`/rapports/edit/${id}`);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'soumis':
        return 'bg-yellow-100 text-yellow-800';
      case 'validé':
        return 'bg-green-100 text-green-800';
      case 'rejeté':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'soumis':
        return 'Soumis';
      case 'validé':
        return 'Validé';
      case 'rejeté':
        return 'Rejeté';
      default:
        return statut;
    }
  };

  // Vérifier si l'utilisateur peut modifier/supprimer le rapport
  const canEdit = () => {
    if (!rapport || !user) return false;
    
    // Si le rapport est déjà validé, personne ne peut le modifier
    if (rapport.statut === 'validé') return false;
    
    // L'admin peut toujours modifier
    if (user.role.libelle === 'admin') return true;
    
    // Le créateur peut modifier son propre rapport s'il n'est pas validé
    return rapport.createdById === user.id;
  };

  // Vérifier si l'utilisateur peut valider/rejeter le rapport
  const canValidate = () => {
    if (!rapport || !user) return false;
    
    // Si le rapport est déjà validé ou rejeté, personne ne peut le valider/rejeter
    if (rapport.statut !== 'soumis') return false;
    
    // Seuls les admins et managers peuvent valider/rejeter
    return ['admin', 'manager'].includes(user.role.libelle);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !rapport) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur: {error || 'Rapport non trouvé'}</p>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/rapports')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {rapport.titre}
            </h1>
            <p className="text-gray-600">
              Rapport #{rapport.id} - {new Date(rapport.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(rapport.statut)}`}>
            {getStatutLabel(rapport.statut)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {(canEdit() || canValidate()) && (
        <div className="flex justify-end space-x-2">
          {canEdit() && (
            <>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </button>
            </>
          )}
          
          {canValidate() && (
            <>
              <button
                onClick={() => handleValidate('validé')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Valider
              </button>
              <button
                onClick={() => handleValidate('rejeté')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeter
              </button>
            </>
          )}
        </div>
      )}

      {/* Informations du rapport */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contenu du rapport */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contenu du rapport</h2>
          
          <div className="prose max-w-none">
            {rapport.contenu.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
          
          {/* Images */}
          {rapport.images && rapport.images.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Images ({rapport.images.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {rapport.images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.url}
                      alt={image.description || 'Image du rapport'}
                      className="w-full h-40 object-cover rounded-md cursor-pointer"
                      onClick={() => setShowFullImage(image.url)}
                    />
                    {image.description && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate rounded-b-md">
                        {image.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Commentaire de validation/rejet */}
          {rapport.commentaire && (
            <div className={`mt-6 p-4 rounded-md ${
              rapport.statut === 'validé' ? 'bg-green-50 border border-green-200' : 
              rapport.statut === 'rejeté' ? 'bg-red-50 border border-red-200' : 
              'bg-gray-50 border border-gray-200'
            }`}>
              <h3 className="text-md font-medium text-gray-900 mb-2">Commentaire</h3>
              <p className="text-sm text-gray-700">{rapport.commentaire}</p>
            </div>
          )}
        </div>

        {/* Informations complémentaires */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Technicien</p>
                <p className="text-sm text-gray-600">
                  {rapport.technicien?.nom} {rapport.technicien?.prenom}
                  {rapport.technicien?.specialite?.libelle && ` (${rapport.technicien.specialite.libelle})`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Mission</p>
                <p className="text-sm text-gray-600">
                  {rapport.mission?.natureIntervention || `Mission #${rapport.missionId}`}
                  <br />
                  {rapport.mission?.client?.nom}
                  {rapport.mission?.client?.entreprise && ` (${rapport.mission.client.entreprise})`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Intervention</p>
                <p className="text-sm text-gray-600">
                  Intervention #{rapport.interventionId}
                  <br />
                  {rapport.intervention?.dateHeureDebut && 
                    `Début: ${new Date(rapport.intervention.dateHeureDebut).toLocaleDateString('fr-FR')}`}
                  {rapport.intervention?.dateHeureFin && 
                    ` - Fin: ${new Date(rapport.intervention.dateHeureFin).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dates</p>
                <p className="text-sm text-gray-600">
                  Créé le: {new Date(rapport.createdAt).toLocaleDateString('fr-FR')}
                  <br />
                  {rapport.dateValidation && 
                    `Validé/Rejeté le: ${new Date(rapport.dateValidation).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Créé par</p>
                <p className="text-sm text-gray-600">
                  {rapport.createdBy?.nom} {rapport.createdBy?.prenom}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Image className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Images</p>
                <p className="text-sm text-gray-600">
                  {rapport.images?.length || 0} image(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'affichage d'image en plein écran */}
      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowFullImage(null)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img 
              src={showFullImage} 
              alt="Image en plein écran" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};