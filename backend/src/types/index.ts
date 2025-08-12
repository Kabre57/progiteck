// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour l'authentification
export interface AuthTokenPayload {
  userId: number;
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Types pour les requêtes d'entrée de matériel
export interface CreateEntreeRequest {
  materielId: number;
  quantite: number;
  source: 'Achat' | 'Retour' | 'Transfert' | 'Réparation' | 'Autre';
  prixTotal?: number;
  fournisseur?: string;
  facture?: string;
  commentaire?: string;
}

// Types existants (à conserver)
export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string | null;
  theme?: string;
  displayName?: string | null;
  address?: string | null;
  state?: string | null;
  country?: string | null;
  designation?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  phone?: string | null;
  theme?: string;
  displayName?: string | null;
  address?: string | null;
  state?: string | null;
  country?: string | null;
  designation?: string | null;
  roleId: number;
  status?: string;
}

export interface UpdateUserRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  phone?: string | null;
  theme?: string;
  displayName?: string | null;
  address?: string | null;
  state?: string | null;
  country?: string | null;
  designation?: string | null;
  roleId?: number;
  status?: string;
}

export interface CreateDevisRequest {
  clientId: number;
  missionId?: number;
  titre: string;
  description?: string | null;
  tauxTVA: number;
  dateValidite: string;
  lignes: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }>;
}

export interface ValidateDevisRequest {
  statut: string;
  commentaireDG?: string;
  commentairePDG?: string;
}

export interface CreateRapportRequest {
  titre: string;
  contenu: string;
  interventionId?: number;
  technicienId: number;
  missionId: number;
  images?: Array<{
    url: string;
    description?: string | null;
  }>;
}

export interface ValidateRapportRequest {
  statut: 'valide' | 'rejete';
  commentaire?: string;
}

export interface CreateInterventionRequest {
  dateHeureDebut?: string;
  dateHeureFin?: string;
  duree?: number;
  missionId: number;
  techniciens?: Array<{
    technicienId: number;
    role?: string;
    commentaire?: string;
  }>;
  materiels?: Array<{
    materielId: number;
    quantite: number;
    commentaire?: string;
  }>;
}

export interface UpdateInterventionRequest {
  dateHeureDebut?: string;
  dateHeureFin?: string;
  duree?: number;
  techniciens?: Array<{
    technicienId: number;
    role?: string;
    commentaire?: string;
  }>;
  materiels?: Array<{
    materielId: number;
    quantite: number;
    commentaire?: string;
  }>;
}





export interface CreateTypePaiementRequest {
  libelle: string;
  description?: string | null;
  delaiPaiement?: number;
  tauxRemise?: number;
  actif?: boolean;
}

export interface UpdateTypePaiementRequest {
  libelle?: string;
  description?: string | null;
  delaiPaiement?: number;
  tauxRemise?: number;
  actif?: boolean;
}




export interface CreateTechnicienRequest {
  nom: string;
  prenom: string;
  contact: string;
  specialiteId: number;
  utilisateurId?: number | null;
}


