import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { generateDevisNumber, generateFactureNumber } from '@/utils/generators';
import { CreateDevisRequest, ValidateDevisRequest } from '@/types';
import { logger } from '@/config/logger';

// Fonction utilitaire pour calculer les montants d'un devis
const calculateDevisMontants = (lignes: Array<{ quantite: number; prixUnitaire: number }>, tauxTVA: number) => {
  const montantHT = lignes.reduce((sum, ligne) => {
    const montantLigne = ligne.quantite * ligne.prixUnitaire;
    return sum + montantLigne;
  }, 0);
  
  const montantTVA = montantHT * (tauxTVA / 100);
  const montantTTC = montantHT + montantTVA;
  
  return {
    montantHT: Math.round(montantHT * 100) / 100, // Arrondir à 2 décimales
    montantTVA: Math.round(montantTVA * 100) / 100,
    montantTTC: Math.round(montantTTC * 100) / 100
  };
};

export const getDevis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, statut, clientId } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (statut) {
      where.statut = statut as string;
    }

    if (clientId) {
      where.clientId = parseInt(clientId as string);
    }

    const [devis, total] = await Promise.all([
      prisma.devis.findMany({
        where,
        include: {
          client: {
            include: {
              typePaiement: true
            }
          },
          mission: true,
          lignes: {
            orderBy: {
              ordre: 'asc'
            }
          },
          validateur: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          },
          validateurPDG: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          }
        },
        orderBy: {
          dateCreation: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.devis.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      devis,
      paginationMeta,
      'Devis récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching devis:', error);
    sendError(res, 'Erreur lors de la récupération des devis');
  }
};

export const getDevisById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "Paramètre 'id' manquant", 400);
      return;
    }
    const devisId = parseInt(id);

    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        mission: true,
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        },
        validateur: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        validateurPDG: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        facture: true
      }
    });

    if (!devis) {
      sendError(res, 'Devis non trouvé', 404);
      return;
    }

    sendSuccess(res, devis, 'Devis récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching devis:', error);
    sendError(res, 'Erreur lors de la récupération du devis');
  }
};

export const createDevis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      clientId,
      missionId,
      titre,
      description,
      tauxTVA,
      dateValidite,
      lignes
    }: CreateDevisRequest = req.body;

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      sendError(res, 'Client non trouvé', 404);
      return;
    }

    // Si missionId est fourni, vérifier qu'elle existe
    if (missionId) {
      const mission = await prisma.mission.findUnique({
        where: { numIntervention: String(missionId) }
      });

      if (!mission) {
        sendError(res, 'Mission non trouvée', 404);
        return;
      }
    }

    // Générer le numéro de devis
    const numero = await generateDevisNumber();

    // Calculer automatiquement les montants
    const montants = calculateDevisMontants(lignes, tauxTVA);

    const devis = await prisma.devis.create({
      data: {
        numero,
        clientId,
        missionId: missionId ? String(missionId) : null,
        titre,
  description: typeof description === 'string' ? description : null,
        montantHT: montants.montantHT,
        tauxTVA,
        montantTTC: montants.montantTTC,
        dateValidite: new Date(dateValidite),
        lignes: {
          create: lignes.map((ligne, index) => ({
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantHT: Math.round((ligne.quantite * ligne.prixUnitaire) * 100) / 100,
            ordre: index + 1
          }))
        }
      },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        mission: true,
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    sendSuccess(res, devis, 'Devis créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating devis:', error);
    sendError(res, 'Erreur lors de la création du devis');
  }
};

export const updateDevis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "Paramètre 'id' manquant", 400);
      return;
    }
    const devisId = parseInt(id);
    const {
      titre,
      description,
      tauxTVA,
      dateValidite,
      lignes
    }: Partial<CreateDevisRequest> = req.body;

    // Vérifier que le devis existe
    const existingDevis = await prisma.devis.findUnique({
      where: { id: devisId }
    });

    if (!existingDevis) {
      sendError(res, 'Devis non trouvé', 404);
      return;
    }

    // Vérifier que le devis peut être modifié
    if (existingDevis.statut !== 'brouillon' && existingDevis.statut !== 'en_attente') {
      sendError(res, 'Seuls les devis en brouillon ou en attente peuvent être modifiés', 400);
      return;
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    
    if (titre !== undefined) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (dateValidite !== undefined) updateData.dateValidite = new Date(dateValidite);

    // Si les lignes ou le taux TVA sont modifiés, recalculer les montants
    if (lignes || tauxTVA !== undefined) {
      const currentTauxTVA = tauxTVA !== undefined ? tauxTVA : existingDevis.tauxTVA;
      
      // Si les lignes ne sont pas fournies, récupérer les lignes existantes
      let lignesForCalculation = lignes;
      if (!lignes) {
  const existingLignes = await prisma.devisLigne.findMany({
    where: { devisId: devisId },
    select: { designation: true, quantite: true, prixUnitaire: true }
  });
  // Vérifier que toutes les lignes ont une désignation
  if (existingLignes.some(ligne => typeof ligne.designation !== 'string' || !ligne.designation.trim())) {
    sendError(res, "Toutes les lignes doivent avoir une désignation pour le calcul.", 400);
    return;
  }
  lignesForCalculation = existingLignes;
      }

      // Calculer les nouveaux montants
      const montants = calculateDevisMontants(lignesForCalculation!, currentTauxTVA);
      
      updateData.montantHT = montants.montantHT;
      updateData.montantTTC = montants.montantTTC;
      if (tauxTVA !== undefined) updateData.tauxTVA = tauxTVA;
    }

    // Mettre à jour le devis dans une transaction
    const devis = await prisma.$transaction(async (tx) => {
      // Mettre à jour le devis
      await tx.devis.update({
        where: { id: devisId },
        data: updateData
      });

      // Si les lignes sont fournies, les remplacer
      if (lignes) {
        // Supprimer les anciennes lignes
  await tx.devisLigne.deleteMany({
          where: { devisId: devisId }
        });

        // Créer les nouvelles lignes
  await tx.devisLigne.createMany({
          data: lignes.map((ligne, index) => ({
            devisId: devisId,
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantHT: Math.round((ligne.quantite * ligne.prixUnitaire) * 100) / 100,
            ordre: index + 1
          }))
        });
      }

      // Retourner le devis mis à jour avec toutes les relations
      return await tx.devis.findUnique({
        where: { id: devisId },
        include: {
          client: {
            include: {
              typePaiement: true
            }
          },
          mission: true,
          lignes: {
            orderBy: {
              ordre: 'asc'
            }
          },
          validateur: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          },
          validateurPDG: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          }
        }
      });
    });

    sendSuccess(res, devis, 'Devis mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating devis:', error);
    sendError(res, 'Erreur lors de la mise à jour du devis');
  }
};

export const validateDevis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "Paramètre 'id' manquant", 400);
      return;
    }
    const devisId = parseInt(id);
    const { statut, commentaireDG, commentairePDG }: ValidateDevisRequest = req.body;

    // Vérifier que le devis existe
    const existingDevis = await prisma.devis.findUnique({
      where: { id: devisId }
    });

    if (!existingDevis) {
      sendError(res, 'Devis non trouvé', 404);
      return;
    }

    const updateData: Record<string, unknown> = {
      statut
    };

    // Gestion des validations DG
    if (statut === 'valide_dg' || statut === 'refuse_dg') {
      updateData.dateValidationDG = new Date();
      updateData.validePar = req.user?.id;
      if (commentaireDG) {
        updateData.commentaireDG = commentaireDG;
      }
    }

    // Gestion des validations PDG
    if (statut === 'valide_pdg' || statut === 'refuse_pdg') {
      updateData.dateValidationPDG = new Date();
      updateData.valideParPDG = req.user?.id;
      if (commentairePDG) {
        updateData.commentairePDG = commentairePDG;
      }
    }

    const devis = await prisma.devis.update({
      where: { id: devisId },
      data: updateData,
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        mission: true,
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        },
        validateur: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        validateurPDG: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    sendSuccess(res, devis, 'Devis validé avec succès');
  } catch (error) {
    logger.error('Error validating devis:', error);
    sendError(res, 'Erreur lors de la validation du devis');
  }
};

export const convertToInvoice = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "Paramètre 'id' manquant", 400);
      return;
    }
    const devisId = parseInt(id);

    // Vérifier que le devis existe et est accepté par le client
    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        },
        client: {
          include: {
            typePaiement: true
          }
        },
        facture: true
      }
    });

    if (!devis) {
      sendError(res, 'Devis non trouvé', 404);
      return;
    }

    // Vérifier le statut selon le type de devis
    if (devis.statut !== 'accepte_client' && devis.statut !== 'valide_pdg') {
      sendError(res, 'Seuls les devis acceptés par le client ou validés PDG (devis internes) peuvent être convertis en facture', 400);
      return;
    }

  if (devis.facture) {
      sendError(res, 'Ce devis a déjà été converti en facture', 400);
      return;
    }

    // Générer le numéro de facture
    const numeroFacture = await generateFactureNumber();

    // Calculer la date d'échéance
    const delaiPaiement = devis.client.typePaiement?.delaiPaiement || 30;
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + delaiPaiement);

    // Créer la facture
    const facture = await prisma.facture.create({
      data: {
        numero: numeroFacture,
        devisId: devis.id,
        clientId: devis.clientId,
        montantHT: devis.montantHT,
        tauxTVA: devis.tauxTVA,
        montantTTC: devis.montantTTC,
        dateEcheance,
        lignes: {
          create: devis.lignes.map(ligne => ({
            designation: ligne.designation,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montantHT: ligne.montantHT,
            ordre: ligne.ordre
          }))
        }
      },
      include: {
        client: true,
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    // Mettre à jour le devis
    await prisma.devis.update({
      where: { id: devisId },
      data: {
        statut: 'facture',
  facture: { connect: { id: facture.id } }
      }
    });

    sendSuccess(res, facture, 'Devis converti en facture avec succès', 201);
  } catch (error) {
    logger.error('Error converting devis to invoice:', error);
    sendError(res, 'Erreur lors de la conversion du devis en facture');
  }
};

export const deleteDevis = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "Paramètre 'id' manquant", 400);
      return;
    }
    const devisId = parseInt(id);

    // Vérifier que le devis existe
    const devis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        facture: true
      }
    });

    if (!devis) {
      sendError(res, 'Devis non trouvé', 404);
      return;
    }

    // Vérifier qu'il n'y a pas de facture liée
    if (devis.facture) {
      sendError(
        res,
        'Impossible de supprimer un devis converti en facture',
        400
      );
      return;
    }

    await prisma.devis.delete({
      where: { id: devisId }
    });

    sendSuccess(res, null, 'Devis supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting devis:', error);
    sendError(res, 'Erreur lors de la suppression du devis');
  }
};