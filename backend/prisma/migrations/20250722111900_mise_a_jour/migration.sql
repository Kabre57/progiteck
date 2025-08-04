-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "phone" TEXT,
    "theme" TEXT DEFAULT 'light',
    "displayName" TEXT,
    "address" TEXT,
    "state" TEXT,
    "country" TEXT,
    "designation" TEXT,
    "balance" DOUBLE PRECISION DEFAULT 0,
    "emailStatus" TEXT DEFAULT 'verified',
    "kycStatus" TEXT DEFAULT 'pending',
    "lastLogin" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialites" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "specialites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "techniciens" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "specialiteId" INTEGER NOT NULL,
    "utilisateurId" INTEGER,

    CONSTRAINT "techniciens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_paiement" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "delaiPaiement" INTEGER DEFAULT 30,
    "tauxRemise" DOUBLE PRECISION DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "types_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "entreprise" TEXT,
    "typeDeCart" TEXT DEFAULT 'Standard',
    "numeroDeCarte" TEXT,
    "typePaiementId" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'active',
    "localisation" TEXT,
    "dateDInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "numIntervention" TEXT NOT NULL,
    "natureIntervention" TEXT NOT NULL,
    "objectifDuContrat" TEXT NOT NULL,
    "description" TEXT,
    "priorite" TEXT DEFAULT 'normale',
    "statut" TEXT DEFAULT 'planifiee',
    "dateSortieFicheIntervention" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("numIntervention")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" SERIAL NOT NULL,
    "dateHeureDebut" TIMESTAMP(3) NOT NULL,
    "dateHeureFin" TIMESTAMP(3),
    "duree" INTEGER,
    "missionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicien_interventions" (
    "id" SERIAL NOT NULL,
    "technicienId" INTEGER NOT NULL,
    "interventionId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'assistant',
    "commentaire" TEXT,

    CONSTRAINT "technicien_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "missionId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidite" TIMESTAMP(3) NOT NULL,
    "dateValidationDG" TIMESTAMP(3),
    "dateValidationPDG" TIMESTAMP(3),
    "dateReponseClient" TIMESTAMP(3),
    "commentaireDG" TEXT,
    "commentairePDG" TEXT,
    "commentaireClient" TEXT,
    "validePar" INTEGER,
    "valideParPDG" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis_lignes" (
    "id" SERIAL NOT NULL,
    "devisId" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "devis_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "devisId" INTEGER,
    "clientId" INTEGER NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'emise',
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "datePaiement" TIMESTAMP(3),
    "modePaiement" TEXT,
    "referenceTransaction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture_lignes" (
    "id" SERIAL NOT NULL,
    "factureId" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "facture_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports_mission" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "interventionId" INTEGER,
    "technicienId" INTEGER NOT NULL,
    "missionId" TEXT NOT NULL,
    "createdById" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'soumis',
    "dateValidation" TIMESTAMP(3),
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapports_mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapport_images" (
    "id" SERIAL NOT NULL,
    "rapportId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "rapport_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiels" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "description" TEXT,
    "quantiteTotale" INTEGER NOT NULL DEFAULT 0,
    "quantiteDisponible" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 5,
    "emplacement" TEXT,
    "categorie" TEXT NOT NULL DEFAULT 'Outillage',
    "prixUnitaire" DOUBLE PRECISION DEFAULT 0,
    "fournisseur" TEXT,
    "dateAchat" TIMESTAMP(3),
    "garantie" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materiels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sorties_materiel" (
    "id" SERIAL NOT NULL,
    "materielId" INTEGER NOT NULL,
    "interventionId" INTEGER NOT NULL,
    "technicienId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "dateSortie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motif" TEXT,
    "retourne" BOOLEAN NOT NULL DEFAULT false,
    "dateRetour" TIMESTAMP(3),
    "quantiteRetour" INTEGER DEFAULT 0,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sorties_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrees_materiel" (
    "id" SERIAL NOT NULL,
    "materielId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "dateEntree" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'achat',
    "prixTotal" DOUBLE PRECISION DEFAULT 0,
    "fournisseur" TEXT,
    "facture" TEXT,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrees_materiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GeneresFactures" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_libelle_key" ON "roles"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "specialites_libelle_key" ON "specialites"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "techniciens_utilisateurId_key" ON "techniciens"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "types_paiement_libelle_key" ON "types_paiement"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "technicien_interventions_technicienId_interventionId_key" ON "technicien_interventions"("technicienId", "interventionId");

-- CreateIndex
CREATE UNIQUE INDEX "devis_numero_key" ON "devis"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factures_devisId_key" ON "factures"("devisId");

-- CreateIndex
CREATE UNIQUE INDEX "materiels_reference_key" ON "materiels"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "_GeneresFactures_AB_unique" ON "_GeneresFactures"("A", "B");

-- CreateIndex
CREATE INDEX "_GeneresFactures_B_index" ON "_GeneresFactures"("B");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "techniciens" ADD CONSTRAINT "techniciens_specialiteId_fkey" FOREIGN KEY ("specialiteId") REFERENCES "specialites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "techniciens" ADD CONSTRAINT "techniciens_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_typePaiementId_fkey" FOREIGN KEY ("typePaiementId") REFERENCES "types_paiement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("numIntervention") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicien_interventions" ADD CONSTRAINT "technicien_interventions_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "techniciens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicien_interventions" ADD CONSTRAINT "technicien_interventions_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("numIntervention") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis_lignes" ADD CONSTRAINT "devis_lignes_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_lignes" ADD CONSTRAINT "facture_lignes_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_mission" ADD CONSTRAINT "rapports_mission_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_mission" ADD CONSTRAINT "rapports_mission_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "techniciens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_mission" ADD CONSTRAINT "rapports_mission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("numIntervention") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_images" ADD CONSTRAINT "rapport_images_rapportId_fkey" FOREIGN KEY ("rapportId") REFERENCES "rapports_mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties_materiel" ADD CONSTRAINT "sorties_materiel_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties_materiel" ADD CONSTRAINT "sorties_materiel_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties_materiel" ADD CONSTRAINT "sorties_materiel_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "techniciens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrees_materiel" ADD CONSTRAINT "entrees_materiel_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "materiels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneresFactures" ADD CONSTRAINT "_GeneresFactures_A_fkey" FOREIGN KEY ("A") REFERENCES "devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GeneresFactures" ADD CONSTRAINT "_GeneresFactures_B_fkey" FOREIGN KEY ("B") REFERENCES "factures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
