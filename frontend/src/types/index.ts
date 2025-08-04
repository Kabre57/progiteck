// Types de base pour l'application
export interface Role {
  id: number;
  libelle: string;
  description?: string;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
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
  lastLogin?: Date;
  status: string;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  role?: Role;
}

export interface Specialite {
  id: number;
  libelle: string;
  description?: string;
  _count?: {
    techniciens: number;
  };
}

export interface Technicien {
  id: number;
  nom: string;
  prenom: string;
  contact: string;
  specialiteId: number;
  utilisateurId?: number;
  specialite?: Specialite;
  utilisateur?: Utilisateur;
  _count?: {
    interventions: number;
  };
}

export interface TypePaiement {
  id: number;
  libelle: string;
  description?: string;
  delaiPaiement?: number;
  tauxRemise?: number;
  actif: boolean;
  _count?: {
    clients: number;
  };
}

export interface Client {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  typeDeCart?: string; // Peut être 'Standard' | 'Premium' | 'VIP'
  numeroDeCarte?: string;
  typePaiementId?: number;
  typePaiement?: TypePaiement;
  statut: string;
  localisation?: string;
  dateDInscription: Date; // Ou string si c'est une chaîne ISO
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    missions: number;
    devis: number;
    factures: number;
  };
}

export interface Mission {
  numIntervention: string; // ID dans le schema.prisma
  id?: number; // Ajouté pour compatibilité si l'ID est parfois numérique
  natureIntervention: string;
  objectifDuContrat: string;
  description?: string;
  priorite?: 'normale' | 'urgente';
  statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  dateSortieFicheIntervention: Date; // Ou string si c'est une chaîne ISO
  clientId: number;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  _count?: {
    interventions: number;
    rapports: number;
  };
}

export interface TechnicienIntervention {
  id?: number; // Optionnel car peut être créé sans ID
  technicienId: number;
  interventionId?: number; // Optionnel pour la création
  role: 'Principal' | 'Assistant' | 'expert';
  commentaire?: string;
  technicien?: Technicien;
}

export interface Intervention {
  id: number;
  dateHeureDebut: Date; // Ou string si c'est une chaîne ISO
  dateHeureFin?: Date; // Ou string si c'est une chaîne ISO
  duree?: number;
  missionId: string;
  createdAt: Date;
  updatedAt: Date;
  mission?: Mission;
  techniciens?: TechnicienIntervention[];
  sortiesMateriels?: Array<{
    id: number;
    materielId: number;
    quantite: number;
    commentaire?: string;
    materiel: {
      id: number;
      reference: string;
      designation: string;
      quantiteDisponible: number;
    };
  }>;
}

export interface Devis {
  id: number;
  numero: string;
  clientId: number;
  missionId?: string; // numIntervention de la mission
  titre: string;
  description?: string;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  statut: 'brouillon' | 'envoye' | 'valide_dg' | 'refuse_dg' | 'valide_pdg' | 'refuse_pdg' | 'accepte_client' | 'refuse_client' | 'facture';
  dateCreation: Date; // Ou string si c'est une chaîne ISO
  dateValidite: Date; // Ou string si c'est une chaîne ISO
  dateValidationDG?: Date; // Ou string si c'est une chaîne ISO
  dateValidationPDG?: Date; // Ou string si c'est une chaîne ISO
  dateReponseClient?: Date; // Ou string si c'est une chaîne ISO
  commentaireDG?: string;
  commentairePDG?: string;
  commentaireClient?: string;
  validePar?: number;
  valideParPDG?: number;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  mission?: Mission;
  lignes: DevisLigne[];
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
  devisId?: number;
  clientId: number;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  statut: 'emise' | 'envoyee' | 'payee' | 'annulee';
  dateEmission: Date; // Ou string si c'est une chaîne ISO
  dateEcheance: Date; // Ou string si c'est une chaîne ISO
  datePaiement?: Date; // Ou string si c'est une chaîne ISO
  modePaiement?: string;
  referenceTransaction?: string;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  devis?: Devis;
  lignes: FactureLigne[];
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

export interface RapportMission {
  id: number;
  titre: string;
  contenu: string;
  interventionId?: number;
  technicienId: number;
  missionId: string; // numIntervention de la mission
  createdById?: number;
  statut: 'soumis' | 'valide' | 'rejete';
  dateValidation?: Date; // Ou string si c'est une chaîne ISO
  commentaire?: string;
  createdAt: Date;
  updatedAt: Date;
  intervention?: Intervention;
  technicien?: Technicien;
  mission?: Mission;
  images?: RapportImage[];
}

export interface RapportImage {
  id: number;
  rapportId: number;
  url: string;
  description?: string;
  ordre: number;
}

export interface Message {
  id: number;
  contenu: string;
  senderId: number;
  receiverId: number;
  readAt?: Date; // Ou string si c'est une chaîne ISO
  createdAt: Date; // Ou string si c'est une chaîne ISO
  sender?: Utilisateur;
  receiver?: Utilisateur;
}

export interface Notification {
  id: number;
  type: string; // 'info' | 'success' | 'warning' | 'error'
  message: string;
  data?: string;
  readAt?: Date; // Ou string si c'est une chaîne ISO
  createdAt: Date; // Ou string si c'est une chaîne ISO
  userId: number;
}

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  timestamp: Date; // Ou string si c'est une chaîne ISO
}

export interface Materiel {
  id: number;
  reference: string;
  designation: string;
  description?: string;
  quantiteTotale: number;
  quantiteDisponible: number;
  seuilAlerte: number;
  emplacement?: string;
  categorie: string;
  prixUnitaire?: number;
  fournisseur?: string;
  dateAchat?: Date; // Ou string si c'est une chaîne ISO
  garantie?: string;
  statut: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    sorties: number;
    entrees: number;
  };
}

export interface SortieMateriel {
  id: number;
  materielId: number;
  interventionId: number;
  technicienId: number;
  quantite: number;
  dateSortie: Date; // Ou string si c'est une chaîne ISO
  motif?: string;
  retourne: boolean;
  dateRetour?: Date; // Ou string si c'est une chaîne ISO
  quantiteRetour?: number;
  commentaire?: string;
  createdAt: Date; // Ou string si c'est une chaîne ISO
  materiel?: Materiel;
  intervention?: Intervention;
  technicien?: Technicien;
}

export interface EntreeMateriel {
  id: number;
  materielId: number;
  quantite: number;
  dateEntree: Date; // Ou string si c'est une chaîne ISO
  source: string;
  prixTotal?: number;
  fournisseur?: string;
  facture?: string;
  commentaire?: string;
  createdAt: Date; // Ou string si c'est une chaîne ISO
  materiel?: Materiel;
}

// Interfaces pour les requêtes API (basées sur interventionController.ts et interventions.ts)

export interface CreateInterventionData {
  missionId: string; // numIntervention de la mission
  dateHeureDebut: string; // ISO 8601 string
  dateHeureFin?: string; // ISO 8601 string
  duree?: number; // en minutes
  techniciens: Array<{ technicienId: number; role: 'Principal' | 'Assistant' | 'expert'; commentaire?: string }>;
  materiels?: Array<{
    materielId: number;
    quantite: number;
    commentaire?: string;
  }>;
}

export interface UpdateInterventionData extends Partial<CreateInterventionData> {}

export interface CheckAvailabilityRequest {
  technicienId: number;
  dateHeureDebut: string; // ISO 8601 string
  dateHeureFin: string; // ISO 8601 string
  excludeInterventionId?: number;
}

// Interfaces pour les données de formulaire (à adapter selon les besoins du frontend)

export interface CreateMissionData {
  numIntervention: string;
  natureIntervention: string;
  objectifDuContrat: string;
  description?: string;
  priorite?: 'normale' | 'urgente';
  statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  dateSortieFicheIntervention: string;
  clientId: number;
}

export interface UpdateMissionData extends Partial<CreateMissionData> {}

export interface AvailabilityResult {
  technicienId: number;
  technicien?: string;
  specialite?: string;
  available: boolean;
  period?: {
    debut: string;
    fin: string;
  };
  conflictingInterventions?: Array<{
    id: number;
    mission: string;
    dateDebut: string;
    dateFin: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Types spécifiques pour remplacer 'any'
export interface UnknownRecord {
  [key: string]: unknown;
}

export interface StringRecord {
  [key: string]: string;
}

export interface NumberRecord {
  [key: string]: number;
}

export interface FormDataRecord {
  [key: string]: string | number | boolean | undefined | null;
}

export interface DashboardKPIs {
  interventions: {
    current: number;
    previous: number;
    growth: number;
    label: string;
  };
  chiffreAffaires: {
    current: number;
    previous: number;
    growth: number;
    label: string;
  };
  nouveauxClients: {
    current: number;
    previous: number;
    growth: number;
    label: string;
  };
  tauxValidation: {
    current: number;
    label: string;
  };
  tempsInterventionMoyen: {
    current: number;
    label: string;
  };
}

export interface DashboardStats {
  clients: { total: number; actifs: number; label: string };
  techniciens: { total: number; label: string };
  missions: { total: number; enCours: number; label: string };
  interventions: { total: number; aujourdhui: number; label: string };
  commercial: { devisEnAttente: number; facturesImpayees: number; label: string };
  rapports: { enAttente: number; label: string };
}

export interface DashboardCharts {
  interventionsParMois: Array<{ mois: string; total: number }>;
  missionsParStatut: Array<{ statut: string; total: number; color: string }>;
  topTechniciens: Array<{ nom: string; specialite: string; total: number }>;
  chiffreAffaires: Array<{ mois: string; montant: number }>;
  interventionsParSpecialite: Array<{ specialite: string; total: number }>;
}

export interface ProjectsStatus {
  missionsEnCours: Array<{
    numIntervention: string;
    natureIntervention: string;
    client: string;
    datePrevue: string;
    techniciens: Array<{ nom: string; specialite: string; role: string }>;
  }>;
  tachesPrioritaires: {
    devisValidationDG: Array<{ id: number; numero: string; client: string; priorite: string }>;
    devisValidationPDG: Array<{ id: number; numero: string; client: string; priorite: string }>;
    rapportsValidation: Array<{ id: number; titre: string; technicien: string; priorite: string }>;
    facturesRetard: Array<{ id: number; numero: string; client: string; joursRetard: number; priorite: string }>;
    interventionsAujourdhui: Array<{ id: number; mission: string; client: string; heureDebut: string }>;
  };
}

export interface RecentActivity {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  details: string;
  userId: number;
  user: {
    nom: string;
    prenom: string;
    role: string;
  };
  createdAt: string;
}

export interface CreateClientData {
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  typeDeCart?: 'Standard' | 'Premium' | 'VIP';
  typePaiementId?: number;
  localisation?: string;
}

export interface CreateTechnicienData {
  nom: string;
  prenom: string;
  contact: string;
  specialiteId: number;
  utilisateurId?: number;
}

export interface CreateDevisData {
  clientId: number;
  missionId?: string; // numIntervention de la mission
  titre: string;
  description?: string;
  tauxTVA: number;
  dateValidite: string;
  lignes: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }>;
}

export interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  phone?: string;
  theme?: 'light' | 'dark';
  displayName?: string;
  address?: string;
  state?: string;
  country?: string;
  designation?: string;
  roleId: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CreateMaterielData {
  reference: string;
  designation: string;
  description?: string;
  quantiteTotale: number;
  seuilAlerte: number;
  emplacement?: string;
  categorie: string;
  prixUnitaire?: number;
  fournisseur?: string;
  dateAchat?: string;
  garantie?: string;
}

export interface CreateSortieData {
  materielId: number;
  interventionId: number;
  technicienId: number;
  quantite: number;
  motif?: string;
  commentaire?: string;
}

export interface CreateEntreeData {
  materielId: number;
  quantite: number;
  source: string;
  prixTotal?: number;
  fournisseur?: string;
  facture?: string;
  commentaire?: string;
}
