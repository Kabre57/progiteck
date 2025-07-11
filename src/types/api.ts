// Types de base pour l'API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types des entités
export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phone?: string;
  theme?: string;
  displayName?: string;
  address?: string;
  state?: string;
  country?: string;
  designation?: string;
  balance?: number;
  emailStatus?: string;
  kycStatus?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  role: {
    id: number;
    libelle: string;
    description?: string;
  };
}

export interface Client {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  typeDeCart?: string;
  statut: 'active' | 'inactive';
  localisation?: string;
  dateDInscription: string;
  createdAt: string;
  updatedAt: string;
}

export interface Technicien {
  id: number;
  nom: string;
  prenom: string;
  contact?: string;
  specialiteId?: number;
  utilisateurId?: number;
  specialite?: {
    id: number;
    libelle: string;
    description?: string;
  };
  totalInterventions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Specialite {
  id: number;
  libelle: string;
  description?: string;
  totalTechniciens?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  libelle: string;
  description?: string;
  totalUtilisateurs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Mission {
  numIntervention: number;
  natureIntervention: string;
  objectifDuContrat?: string;
  description?: string;
  dateSortieFicheIntervention?: string;
  clientId: number;
  client?: Client;
  interventions?: Intervention[];
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Intervention {
  id: number;
  dateHeureDebut?: string;
  dateHeureFin?: string;
  duree?: number;
  missionId: number;
  mission?: Mission;
  techniciens?: (Technicien & { role?: string; commentaire?: string })[];
  createdAt: string;
  updatedAt: string;
}

export interface TechnicienIntervention {
  id: number;
  technicienId: number;
  interventionId: number;
  role?: string;
  commentaire?: string;
  technicien: Technicien;
  intervention: Intervention;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  title: string;
  type: string;
  url: string;
  missionId: number;
  createdById: number;
  createdBy?: {
    id: number;
    nom: string;
    prenom: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  data?: string;
  readAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  totalTechniciens: number;
  totalMissions: number;
  totalInterventions: number;
  missionsEnCours: number;
  interventionsEnCours: number;
}

export interface Devis {
  id: number;
  numero: string;
  clientId: number;
  missionId?: number;
  titre: string;
  description?: string;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  statut: 'brouillon' | 'envoye' | 'valide_dg' | 'refuse_dg' | 'accepte_client' | 'refuse_client' | 'facture';
  dateCreation: string;
  dateValidite: string;
  dateValidationDG?: string;
  dateReponseClient?: string;
  commentaireDG?: string;
  commentaireClient?: string;
  validePar?: number;
  factureId?: number;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  mission?: Mission;
  validateur?: User;
  facture?: Facture;
  lignes?: DevisLigne[];
}

export interface DevisLigne {
  id: number;
  devisId: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  ordre: number;
}

export interface Facture {
  id: number;
  numero: string;
  devisId: number;
  clientId: number;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  statut: 'emise' | 'envoyee' | 'payee' | 'annulee';
  dateEmission: string;
  dateEcheance: string;
  datePaiement?: string;
  modePaiement?: string;
  referenceTransaction?: string;
  createdAt: string;
  updatedAt: string;
  devis?: Devis;
  client?: Client;
  lignes?: FactureLigne[];
}

export interface FactureLigne {
  id: number;
  factureId: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  ordre: number;
}

export interface TechnicienDashboard {
  technicien: {
    id: number;
    nom: string;
    prenom: string;
    specialite?: string;
  };
  stats: {
    totalInterventions: number;
    interventionsEnCours: number;
    interventionsTerminees: number;
    dureeMoyenne: number;
  };
  interventionsRecentes: Array<{
    id: number;
    dateHeureDebut?: string;
    dateHeureFin?: string;
    duree?: number;
    mission: {
      numIntervention: number;
      natureIntervention: string;
      client?: {
        nom: string;
        entreprise?: string;
      };
    };
    role?: string;
    commentaire?: string;
    status: string;
  }>;
  missionsEnCours: Array<{
    id: number;
    title: string;
    client: string;
    clientEntreprise?: string;
    progress: number;
    role?: string;
  }>;
  prochainesInterventions: Array<{
    id: number;
    dateHeureDebut?: string;
    mission: {
      numIntervention: number;
      natureIntervention: string;
      client?: {
        nom: string;
        entreprise?: string;
      };
    };
  }>;
}