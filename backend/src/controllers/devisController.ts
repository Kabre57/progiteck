import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { generateDevisNumber, generateFactureNumber } from '@/utils/generators';
import { CreateDevisRequest, ValidateDevisRequest } from '@/types';
import { logger } from '@/config/logger';
import { Prisma } from '@prisma/client';

// Fonction utilitaire pour calculer les montants d'un devis
const calculateDevisMontants = (lignes: Array<{ quantite: number; prixUnitaire: number }>, tauxTVA: number) => {
  const montantHT = lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prixUnitaire), 0);
  const montantTVA = montantHT * (tauxTVA / 100);
  const montantTTC = montantHT + montantTVA;
  
  return {
    montantHT: Math.round(montantHT * 100) / 100,
    montantTVA: Math.round(montantTVA * 100) / 100,
    montantTTC: Math.round(montantTTC * 100) / 100
  };
};

export const getDevis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, statut, clientId } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });

    const where: Prisma.DevisWhereInput = {};
    if (statut) where.statut = statut as string;
    if (clientId) where.clientId = parseInt(clientId as string, 10);

    const [devis, total] = await Promise.all([
      prisma.devis.findMany({
        where,
        include: {
          client: { include: { typePaiement: true } },
          mission: true,
          lignes: { orderBy: { ordre: 'asc' } },
          validateur: { select: { id: true, nom: true, prenom: true } },
          validateurPDG: { select: { id: true, nom: true, prenom: true } }
        },
        orderBy: { dateCreation: 'desc' },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.devis.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);
    sendSuccessWithPagination(res, devis, paginationMeta, 'Devis récupérés avec succès');
  } catch (error) {
    logger.error('Error fetching devis:', error);
    sendError(res, 'Erreur lors de la récupération des devis');
  }
};

export const getDevisById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devisId = parseInt(req.params.id || '0', 10);
    if (!devisId) return sendError(res, "ID de devis invalide", 400);

    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        client: { include: { typePaiement: true } },
        mission: true,
        lignes: { orderBy: { ordre: 'asc' } },
        validateur: { select: { id: true, nom: true, prenom: true } },
        validateurPDG: { select: { id: true, nom: true, prenom: true } },
        facture: true
      }
    });

    if (!devis) return sendError(res, 'Devis non trouvé', 404);
    sendSuccess(res, devis, 'Devis récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching devis by ID:', error);
    sendError(res, 'Erreur lors de la récupération du devis');
  }
};

export const createDevis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { clientId, missionId, titre, description, tauxTVA, dateValidite, lignes }: CreateDevisRequest = req.body;
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return sendError(res, 'Client non trouvé', 404);

    if (missionId) {
      const mission = await prisma.mission.findUnique({ where: { numIntervention: String(missionId) } });
      if (!mission) return sendError(res, 'Mission non trouvée', 404);
    }

    const numero = await generateDevisNumber();
    const montants = calculateDevisMontants(lignes, tauxTVA);

    const devis = await prisma.devis.create({
      data: {
        numero, clientId, missionId: missionId ? String(missionId) : null, titre,
        description: typeof description === 'string' ? description : null,
        montantHT: montants.montantHT, tauxTVA, montantTTC: montants.montantTTC,
        dateValidite: new Date(dateValidite),
        lignes: {
          create: lignes.map((ligne: any, index: number) => ({
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantHT: Math.round((ligne.quantite * ligne.prixUnitaire) * 100) / 100,
            ordre: index + 1
          }))
        }
      },
      include: { client: { include: { typePaiement: true } }, mission: true, lignes: { orderBy: { ordre: 'asc' } } }
    });

    sendSuccess(res, devis, 'Devis créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating devis:', error);
    sendError(res, 'Erreur lors de la création du devis');
  }
};

export const updateDevis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devisId = parseInt(req.params.id || '0', 10);
    if (!devisId) return sendError(res, "ID de devis invalide", 400);

    const { titre, description, tauxTVA, dateValidite, lignes }: Partial<CreateDevisRequest> = req.body;
    const existingDevis = await prisma.devis.findUnique({ where: { id: devisId } });
    if (!existingDevis) return sendError(res, 'Devis non trouvé', 404);
    if (existingDevis.statut !== 'brouillon' && existingDevis.statut !== 'en_attente') return sendError(res, 'Seuls les devis en brouillon ou en attente peuvent être modifiés', 400);

    const updateData: Prisma.DevisUpdateInput = {};
    if (titre !== undefined) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (dateValidite !== undefined) updateData.dateValidite = new Date(dateValidite);

    if (lignes || tauxTVA !== undefined) {
      const currentTauxTVA = tauxTVA !== undefined ? tauxTVA : existingDevis.tauxTVA;
      let lignesForCalculation = lignes;
      if (!lignes) {
        const existingLignes = await prisma.devisLigne.findMany({ where: { devisId }, select: { designation: true, quantite: true, prixUnitaire: true } });
        if (existingLignes.some((ligne: any) => typeof ligne.designation !== 'string' || !ligne.designation.trim())) {
          throw new Error("Toutes les lignes doivent avoir une désignation pour le calcul.");
        }
        lignesForCalculation = existingLignes;
      }
      const montants = calculateDevisMontants(lignesForCalculation!, currentTauxTVA);
      updateData.montantHT = montants.montantHT;
      updateData.montantTTC = montants.montantTTC;
      if (tauxTVA !== undefined) updateData.tauxTVA = tauxTVA;
    }

    const devis = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.devis.update({ where: { id: devisId }, data: updateData });
      if (lignes) {
        await tx.devisLigne.deleteMany({ where: { devisId } });
        await tx.devisLigne.createMany({
          data: lignes.map((ligne: any, index: number) => ({
            devisId,
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantHT: Math.round((ligne.quantite * ligne.prixUnitaire) * 100) / 100,
            ordre: index + 1
          }))
        });
      }
      return tx.devis.findUnique({ where: { id: devisId }, include: { client: { include: { typePaiement: true } }, mission: true, lignes: { orderBy: { ordre: 'asc' } }, validateur: { select: { id: true, nom: true, prenom: true } }, validateurPDG: { select: { id: true, nom: true, prenom: true } } } });
    });

    sendSuccess(res, devis, 'Devis mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating devis:', error);
    sendError(res, 'Erreur lors de la mise à jour du devis');
  }
};

export const validateDevis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devisId = parseInt(req.params.id || '0', 10);
    if (!devisId) return sendError(res, "ID de devis invalide", 400);

    if (!req.user || typeof req.user.id !== 'number') {
      logger.error('User ID not found in authenticated request for devis validation');
      return sendError(res, 'Utilisateur non authentifié ou ID invalide', 401);
    }
    const validatorId = req.user.id;

    const { statut, commentaireDG, commentairePDG }: ValidateDevisRequest = req.body;
    const existingDevis = await prisma.devis.findUnique({ where: { id: devisId } });
    if (!existingDevis) return sendError(res, 'Devis non trouvé', 404);

    const updateData: Prisma.DevisUpdateInput = { statut };

    if (statut === 'valide_dg' || statut === 'refuse_dg') {
      updateData.dateValidationDG = new Date();
      updateData.validateur = { connect: { id: validatorId } };
      if (commentaireDG) updateData.commentaireDG = commentaireDG;
    }
    if (statut === 'valide_pdg' || statut === 'refuse_pdg') {
      updateData.dateValidationPDG = new Date();
      updateData.validateurPDG = { connect: { id: validatorId } };
      if (commentairePDG) updateData.commentairePDG = commentairePDG;
    }

    const devis = await prisma.devis.update({
      where: { id: devisId },
      data: updateData,
      include: { client: { include: { typePaiement: true } }, mission: true, lignes: { orderBy: { ordre: 'asc' } }, validateur: { select: { id: true, nom: true, prenom: true } }, validateurPDG: { select: { id: true, nom: true, prenom: true } } }
    });
    sendSuccess(res, devis, 'Devis validé avec succès');
  } catch (error) {
    logger.error('Error validating devis:', error);
    sendError(res, 'Erreur lors de la validation du devis');
  }
};

export const convertToInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devisId = parseInt(req.params.id || '0', 10);
    if (!devisId) return sendError(res, "ID de devis invalide", 400);

    const devis = await prisma.devis.findUnique({ where: { id: devisId }, include: { lignes: { orderBy: { ordre: 'asc' } }, client: { include: { typePaiement: true } }, facture: true } });
    if (!devis) return sendError(res, 'Devis non trouvé', 404);
    if (devis.statut !== 'accepte_client' && devis.statut !== 'valide_pdg') return sendError(res, 'Seuls les devis acceptés ou validés peuvent être convertis', 400);
    if (devis.facture) return sendError(res, 'Ce devis a déjà été converti en facture', 400);

    const numeroFacture = await generateFactureNumber();
    const delaiPaiement = devis.client.typePaiement?.delaiPaiement || 30;
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + delaiPaiement);

    const facture = await prisma.facture.create({
      data: {
        numero: numeroFacture, devisId: devis.id, clientId: devis.clientId, montantHT: devis.montantHT, tauxTVA: devis.tauxTVA, montantTTC: devis.montantTTC, dateEcheance,
        lignes: { create: devis.lignes.map((ligne: any) => ({ designation: ligne.designation, quantite: ligne.quantite, prixUnitaire: ligne.prixUnitaire, montantHT: ligne.montantHT, ordre: ligne.ordre })) }
      },
      include: { client: true, lignes: { orderBy: { ordre: 'asc' } } }
    });

    await prisma.devis.update({ where: { id: devisId }, data: { statut: 'facture', facture: { connect: { id: facture.id } } } });
    sendSuccess(res, facture, 'Devis converti en facture avec succès', 201);
  } catch (error) {
    logger.error('Error converting devis to invoice:', error);
    sendError(res, 'Erreur lors de la conversion du devis en facture');
  }
};

export const deleteDevis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devisId = parseInt(req.params.id || '0', 10);
    if (!devisId) return sendError(res, "ID de devis invalide", 400);

    const devis = await prisma.devis.findUnique({ where: { id: devisId }, include: { facture: true } });
    if (!devis) return sendError(res, 'Devis non trouvé', 404);
    if (devis.facture) return sendError(res, 'Impossible de supprimer un devis converti en facture', 400);
    await prisma.devis.delete({ where: { id: devisId } });
    sendSuccess(res, null, 'Devis supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting devis:', error);
    sendError(res, 'Erreur lors de la suppression du devis');
  }
};
