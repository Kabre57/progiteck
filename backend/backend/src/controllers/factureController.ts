import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { UpdateFactureRequest } from '@/types';
import { logger } from '@/config/logger';

export const getFactures = async (
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

    const [factures, total] = await Promise.all([
      prisma.facture.findMany({
        where,
        include: {
          client: {
            include: {
              typePaiement: true
            }
          },
          devis: {
            include: {
              mission: true
            }
          },
          lignes: {
            orderBy: {
              ordre: 'asc'
            }
          }
        },
        orderBy: {
          dateEmission: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.facture.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      factures,
      paginationMeta,
      'Factures récupérées avec succès'
    );
  } catch (error) {
    logger.error('Error fetching factures:', error);
    sendError(res, 'Erreur lors de la récupération des factures');
  }
};

export const getFactureById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const factureId = parseInt(id);

    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        devis: {
          include: {
            mission: true
          }
        },
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    if (!facture) {
      sendError(res, 'Facture non trouvée', 404);
      return;
    }

    sendSuccess(res, facture, 'Facture récupérée avec succès');
  } catch (error) {
    logger.error('Error fetching facture:', error);
    sendError(res, 'Erreur lors de la récupération de la facture');
  }
};

export const getOverdueFactures = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();

    const overdueFactures = await prisma.facture.findMany({
      where: {
        AND: [
          {
            statut: {
              in: ['emise', 'envoyee']
            }
          },
          {
            dateEcheance: {
              lt: now
            }
          }
        ]
      },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        devis: {
          include: {
            mission: true
          }
        }
      },
      orderBy: {
        dateEcheance: 'asc'
      }
    });

    // Calculer les jours de retard
    const facturesWithDelay = overdueFactures.map(facture => {
      const delayDays = Math.floor((now.getTime() - facture.dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...facture,
        joursRetard: delayDays
      };
    });

    sendSuccess(res, facturesWithDelay, 'Factures en retard récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching overdue factures:', error);
    sendError(res, 'Erreur lors de la récupération des factures en retard');
  }
};

export const updateFacture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const factureId = parseInt(id);
    const updateData: UpdateFactureRequest = req.body;

    // Vérifier que la facture existe
    const existingFacture = await prisma.facture.findUnique({
      where: { id: factureId }
    });

    if (!existingFacture) {
      sendError(res, 'Facture non trouvée', 404);
      return;
    }

    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: {
        ...updateData,
        datePaiement: updateData.datePaiement ? new Date(updateData.datePaiement) : undefined
      },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        devis: {
          include: {
            mission: true
          }
        },
        lignes: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    sendSuccess(res, facture, 'Facture mise à jour avec succès');
  } catch (error) {
    logger.error('Error updating facture:', error);
    sendError(res, 'Erreur lors de la mise à jour de la facture');
  }
};

export const deleteFacture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const factureId = parseInt(id);

    // Vérifier que la facture existe
    const facture = await prisma.facture.findUnique({
      where: { id: factureId }
    });

    if (!facture) {
      sendError(res, 'Facture non trouvée', 404);
      return;
    }

    // Vérifier que la facture n'est pas payée
    if (facture.statut === 'payee') {
      sendError(res, 'Impossible de supprimer une facture payée', 400);
      return;
    }

    await prisma.facture.delete({
      where: { id: factureId }
    });

    sendSuccess(res, null, 'Facture supprimée avec succès');
  } catch (error) {
    logger.error('Error deleting facture:', error);
    sendError(res, 'Erreur lors de la suppression de la facture');
  }
};