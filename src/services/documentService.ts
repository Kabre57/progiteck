import { apiClient } from './api';
import { Document, PaginatedResponse } from '../types/api';

export interface CreateDocumentData {
  title: string;
  type: string;
  url: string;
  missionId: number;
}

export interface UpdateDocumentData {
  title?: string;
  type?: string;
}

class DocumentService {
  // Lister les documents
  async getDocuments(page = 1, limit = 10, missionId?: number, type?: string): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (missionId) {
      params.append('missionId', missionId.toString());
    }
    
    if (type) {
      params.append('type', type);
    }

    const response = await apiClient.get(`/documents?${params}`);
    return response.data;
  }

  // Récupérer les documents d'une mission
  async getMissionDocuments(missionId: number): Promise<Document[]> {
    const response = await apiClient.get(`/documents/mission/${missionId}`);
    return response.data.data;
  }

  // Créer un document
  async createDocument(documentData: CreateDocumentData): Promise<Document> {
    const response = await apiClient.post('/documents', documentData);
    return response.data.data;
  }

  // Récupérer un document par ID
  async getDocumentById(id: number): Promise<Document> {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data.data;
  }

  // Modifier un document
  async updateDocument(id: number, documentData: UpdateDocumentData): Promise<Document> {
    const response = await apiClient.put(`/documents/${id}`, documentData);
    return response.data.data;
  }

  // Supprimer un document
  async deleteDocument(id: number): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  }

  // Télécharger un document (simulé)
  async downloadDocument(id: number): Promise<Blob> {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const documentService = new DocumentService();