import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { missionService } from '../services/missionService';
import { DocumentUploadModal } from '../components/modals/DocumentUploadModal';
import { DocumentList } from '../components/DocumentList';
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Settings, 
  User, 
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([
    {
      id: 1,
      title: 'Fiche d\'intervention signée',
      type: 'fiche_travail',
      url: 'https://via.placeholder.com/800x1000.png?text=Fiche+Intervention',
      createdAt: '2024-06-15T10:30:00Z',
      createdBy: 'Admin System'
    },
    {
      id: 2,
      title: 'Photo avant intervention',
      type: 'photo_avant',
      url: 'https://via.placeholder.com/800x600.png?text=Photo+Avant',
      createdAt: '2024-06-15T10:35:00Z',
      createdBy: 'Admin System'
    },
    {
      id: 3,
      title: 'Photo après intervention',
      type: 'photo_apres',
      url: 'https://via.placeholder.com/800x600.png?text=Photo+Apres',
      createdAt: '2024-06-15T14:20:00Z',
      createdBy: 'Admin System'
    }
  ]);

  const { data: mission, loading, error } = useApi(
    () => missionService.getMissionById(parseInt(id || '0')),
    [id]
  );

  const handleAddDocument = (documentUrl: string) => {
    const newDocument = {
      id: documents.length + 1,
      title: 'Nouveau document',
      type: 'fiche_travail',
      url: documentUrl,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin System'
    };
    
    setDocuments([...documents, newDocument]);
  };

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur: {error || 'Mission non trouvée'}</p>
        <button 
          onClick={() => navigate('/missions')}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Retour à la liste des missions
        </button>
      </div>
    );
  }

  // Calculer le statut de la mission
  const hasCompletedInterventions = mission.interventions?.some(i => i.dateHeureFin);
  const hasOngoingInterventions = mission.interventions?.some(i => !i.dateHeureFin);
  
  let status = 'En attente';
  let statusColor = 'bg-yellow-100 text-yellow-800';
  
  if (hasCompletedInterventions && !hasOngoingInterventions) {
    status = 'Terminée';
    statusColor = 'bg-green-100 text-green-800';
  } else if (hasOngoingInterventions) {
    status = 'En cours';
    statusColor = 'bg-blue-100 text-blue-800';
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/missions')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mission #{mission.numIntervention}
            </h1>
            <p className="text-gray-600">{mission.natureIntervention}</p>
          </div>
        </div>
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {status === 'Terminée' && <CheckCircle className="h-3 w-3 mr-1" />}
            {status === 'En cours' && <Clock className="h-3 w-3 mr-1" />}
            {status === 'En attente' && <AlertCircle className="h-3 w-3 mr-1" />}
            {status}
          </span>
        </div>
      </div>

      {/* Informations de la mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Détails de la mission */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Détails de la mission</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Client</p>
                <p className="text-sm text-gray-600">
                  {mission.client?.nom || `Client #${mission.clientId}`}
                  {mission.client?.entreprise && ` (${mission.client.entreprise})`}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Date prévue</p>
                <p className="text-sm text-gray-600">
                  {mission.dateSortieFicheIntervention 
                    ? new Date(mission.dateSortieFicheIntervention).toLocaleDateString('fr-FR')
                    : 'Non définie'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Objectif du contrat</p>
                <p className="text-sm text-gray-600">
                  {mission.objectifDuContrat || 'Non défini'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Description</p>
                <p className="text-sm text-gray-600">
                  {mission.description || 'Aucune description'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Interventions</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {mission.interventions?.length || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Terminées</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {mission.interventions?.filter(i => i.dateHeureFin).length || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">En cours</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {mission.interventions?.filter(i => !i.dateHeureFin).length || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-600">Techniciens</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {new Set(mission.interventions?.flatMap(i => i.techniciens?.map(t => t.id)).filter(Boolean)).size || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des interventions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Interventions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technicien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!mission.interventions || mission.interventions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune intervention pour cette mission
                  </td>
                </tr>
              ) : (
                mission.interventions.map((intervention) => (
                  <tr key={intervention.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{intervention.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {intervention.techniciens && intervention.techniciens.length > 0 ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {intervention.techniciens[0].nom} {intervention.techniciens[0].prenom}
                            </div>
                            <div className="text-xs text-gray-500">
                              {intervention.techniciens[0].specialite?.libelle || 'Non spécifié'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intervention.dateHeureDebut 
                        ? new Date(intervention.dateHeureDebut).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intervention.dateHeureFin 
                        ? new Date(intervention.dateHeureFin).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intervention.duree 
                        ? `${Math.floor(intervention.duree / 60)}h ${intervention.duree % 60}min`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        intervention.dateHeureFin 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {intervention.dateHeureFin ? 'Terminée' : 'En cours'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Documents</h2>
          <button
            onClick={() => setShowDocumentModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </button>
        </div>
        
        <div className="p-6">
          <DocumentList 
            documents={documents}
            onDelete={handleDeleteDocument}
          />
        </div>
      </div>

      {/* Modal d'ajout de document */}
      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSuccess={handleAddDocument}
        missionId={parseInt(id || '0')}
      />
    </div>
  );
};
