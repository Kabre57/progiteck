import React, { useState } from 'react';
import { File, Download, Trash2, Eye, Image, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface Document {
  id: number;
  title: string;
  type: string;
  url: string;
  createdAt: string;
  createdBy: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: number) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete }) => {
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      onDelete?.(id);
      toast.success('Document supprimé avec succès');
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'fiche_travail':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'rapport_intervention':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'signature_client':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'photo_avant':
      case 'photo_apres':
        return <Image className="h-5 w-5 text-yellow-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'fiche_travail':
        return 'Fiche de travail';
      case 'rapport_intervention':
        return 'Rapport d\'intervention';
      case 'signature_client':
        return 'Signature client';
      case 'photo_avant':
        return 'Photo avant';
      case 'photo_apres':
        return 'Photo après';
      default:
        return 'Document';
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <File className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Aucun document disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className={`bg-white border rounded-md overflow-hidden ${
            expandedDoc === doc.id ? 'shadow-md' : ''
          }`}
        >
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
          >
            <div className="flex items-center">
              {getDocumentIcon(doc.type)}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                <p className="text-xs text-gray-500">
                  {getDocumentTypeLabel(doc.type)} • {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="text-blue-600 hover:text-blue-900"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(doc.url, '_blank');
                }}
                title="Voir"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button 
                className="text-green-600 hover:text-green-900"
                onClick={(e) => {
                  e.stopPropagation();
                  // Logique de téléchargement
                  toast.success('Téléchargement démarré');
                }}
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </button>
              {onDelete && (
                <button 
                  className="text-red-600 hover:text-red-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {expandedDoc === doc.id && (
            <div className="p-3 border-t">
              {doc.type.includes('photo') ? (
                <div className="flex justify-center">
                  <img 
                    src={doc.url} 
                    alt={doc.title} 
                    className="max-h-64 object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex justify-center">
                  <iframe 
                    src={doc.url} 
                    title={doc.title}
                    className="w-full h-64 border-0 rounded"
                  />
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <p>Ajouté par: {doc.createdBy}</p>
                <p>Date: {new Date(doc.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};