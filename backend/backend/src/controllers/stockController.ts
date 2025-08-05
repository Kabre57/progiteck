import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { logger } from '@/config/logger';

interface CreateMaterielRequest {
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

interface CreateSortieRequest {
  materielId: number;
  interventionId: number;
  technicienId: number;
  quantite: number;
  motif?: string;
  commentaire?: string;
}

interface CreateEntreeRequest {
  materielId: number;
  quantite: number;
  source: string;
  prixTotal?: number;
  fournisseur?: string;
  facture?: string;
  commentaire?: string;
}

// Gestion des matériels
export const getMateriels = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, search, categorie, seuilAlerte } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { reference: { contains: search as string, mode: 'insensitive' } },
        { designation: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (categorie) {
      where.categorie = categorie as string;
    }

    if (seuilAlerte === 'true') {
      where.quantiteDisponible = { lte: prisma.materiel.fields.seuilAlerte };
    }

    const [materiels, total] = await Promise.all([
      prisma.materiel.findMany({
        where,
        include: {
          _count: {
            select: {
              sorties: true,
              entrees: true
            }
          }
        },
        orderBy: [
          { designation: 'asc' }
        ],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.materiel.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      materiels,
      paginationMeta,
      'Matériels récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching materiels:', error);
    sendError(res, 'Erreur lors de la récupération des matériels');
  }
};

export const getMaterielById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const materielId = parseInt(id);

    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
      include: {
        sorties: {
          include: {
            intervention: {
              include: {
                mission: {
                  include: {
                    client: true
                  }
                }
              }
            },
            technicien: true
          },
          orderBy: {
            dateSortie: 'desc'
          }
        },
        entrees: {
          orderBy: {
            dateEntree: 'desc'
          }
        },
        _count: {
          select: {
            sorties: true,
            entrees: true
          }
        }
      }
    });

    if (!materiel) {
      sendError(res, 'Matériel non trouvé', 404);
      return;
    }

    sendSuccess(res, materiel, 'Matériel récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching materiel:', error);
    sendError(res, 'Erreur lors de la récupération du matériel');
  }
};

export const createMateriel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      reference,
      designation,
      description,
      quantiteTotale,
      seuilAlerte,
      emplacement,
      categorie,
      prixUnitaire,
      fournisseur,
      dateAchat,
      garantie
    }: CreateMaterielRequest = req.body;

    // Vérifier que la référence n'existe pas déjà
    const existingMateriel = await prisma.materiel.findUnique({
      where: { reference }
    });

    if (existingMateriel) {
      sendError(res, 'Un matériel avec cette référence existe déjà', 400);
      return;
    }

    const materiel = await prisma.materiel.create({
      data: {
        reference,
        designation,
        description,
        quantiteTotale,
        quantiteDisponible: quantiteTotale, // Initialement égale à la quantité totale
        seuilAlerte,
        emplacement,
        categorie,
        prixUnitaire,
        fournisseur,
        dateAchat: dateAchat ? new Date(dateAchat) : null,
        garantie
      },
      include: {
        _count: {
          select: {
            sorties: true,
            entrees: true
          }
        }
      }
    });

    sendSuccess(res, materiel, 'Matériel créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating materiel:', error);
    sendError(res, 'Erreur lors de la création du matériel');
  }
};

export const updateMateriel = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const materielId = parseInt(id);
    const updateData: Partial<CreateMaterielRequest> = req.body;

    // Vérifier que le matériel existe
    const existingMateriel = await prisma.materiel.findUnique({
      where: { id: materielId }
    });

    if (!existingMateriel) {
      sendError(res, 'Matériel non trouvé', 404);
      return;
    }

    // Si référence est modifiée, vérifier qu'elle n'existe pas déjà
    if (updateData.reference && updateData.reference !== existingMateriel.reference) {
      const referenceExists = await prisma.materiel.findUnique({
        where: { reference: updateData.reference }
      });

      if (referenceExists) {
        sendError(res, 'Un matériel avec cette référence existe déjà', 400);
        return;
      }
    }

    const materiel = await prisma.materiel.update({
      where: { id: materielId },
      data: {
        ...updateData,
        dateAchat: updateData.dateAchat ? new Date(updateData.dateAchat) : undefined
      },
      include: {
        _count: {
          select: {
            sorties: true,
            entrees: true
          }
        }
      }
    });

    sendSuccess(res, materiel, 'Matériel mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating materiel:', error);
    sendError(res, 'Erreur lors de la mise à jour du matériel');
  }
};

// Gestion des sorties
export const createSortie = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      materielId,
      interventionId,
      technicienId,
      quantite,
      motif,
      commentaire
    }: CreateSortieRequest = req.body;

    // Vérifier que le matériel existe et a suffisamment de stock
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId }
    });

    if (!materiel) {
      sendError(res, 'Matériel non trouvé', 404);
      return;
    }

    if (materiel.quantiteDisponible < quantite) {
      sendError(res, `Stock insuffisant. Disponible: ${materiel.quantiteDisponible}`, 400);
      return;
    }

    // Vérifier que l'intervention existe
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId }
    });

    if (!intervention) {
      sendError(res, 'Intervention non trouvée', 404);
      return;
    }

    // Créer la sortie et mettre à jour le stock
    const [sortie] = await prisma.$transaction([
      prisma.sortieMateriel.create({
        data: {
          materielId,
          interventionId,
          technicienId,
          quantite,
          motif,
          commentaire
        },
        include: {
          materiel: true,
          intervention: {
            include: {
              mission: {
                include: {
                  client: true
                }
              }
            }
          },
          technicien: true
        }
      }),
      prisma.materiel.update({
        where: { id: materielId },
        data: {
          quantiteDisponible: {
            decrement: quantite
          }
        }
      })
    ]);

    sendSuccess(res, sortie, 'Sortie de matériel enregistrée avec succès', 201);
  } catch (error) {
    logger.error('Error creating sortie:', error);
    sendError(res, 'Erreur lors de l\'enregistrement de la sortie');
  }
};

// Gestion des entrées
export const createEntree = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      materielId,
      quantite,
      source,
      prixTotal,
      fournisseur,
      facture,
      commentaire
    }: CreateEntreeRequest = req.body;

    // Vérifier que le matériel existe
    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId }
    });

    if (!materiel) {
      sendError(res, 'Matériel non trouvé', 404);
      return;
    }

    // Créer l'entrée et mettre à jour le stock
    const [entree] = await prisma.$transaction([
      prisma.entreeMateriel.create({
        data: {
          materielId,
          quantite,
          source,
          prixTotal,
          fournisseur,
          facture,
          commentaire
        },
        include: {
          materiel: true
        }
      }),
      prisma.materiel.update({
        where: { id: materielId },
        data: {
          quantiteDisponible: {
            increment: quantite
          },
          quantiteTotale: {
            increment: quantite
          }
        }
      })
    ]);

    sendSuccess(res, entree, 'Entrée de matériel enregistrée avec succès', 201);
  } catch (error) {
    logger.error('Error creating entree:', error);
    sendError(res, 'Erreur lors de l\'enregistrement de l\'entrée');
  }
};

// Vérification de disponibilité
export const checkDisponibilite = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { materielId, quantiteRequise } = req.body;

    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId }
    });

    if (!materiel) {
      sendError(res, 'Matériel non trouvé', 404);
      return;
    }

    const disponible = materiel.quantiteDisponible >= quantiteRequise;

    sendSuccess(res, {
      disponible,
      quantiteDisponible: materiel.quantiteDisponible,
      quantiteRequise,
      materiel: {
        reference: materiel.reference,
        designation: materiel.designation
      }
    }, 'Vérification de disponibilité effectuée');
  } catch (error) {
    logger.error('Error checking disponibilite:', error);
    sendError(res, 'Erreur lors de la vérification de disponibilité');
  }
};

// Alertes de stock
export const getAlertes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const alertes = await prisma.materiel.findMany({
      where: {
        quantiteDisponible: {
          lte: prisma.materiel.fields.seuilAlerte
        }
      },
      orderBy: {
        quantiteDisponible: 'asc'
      }
    });

    sendSuccess(res, alertes, 'Alertes de stock récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching alertes:', error);
    sendError(res, 'Erreur lors de la récupération des alertes');
  }
};

// Statistiques
export const getStatsStock = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      totalMateriels,
      materielEnStock,
      materielEnAlerte,
      valeurStock
    ] = await Promise.all([
      prisma.materiel.count(),
      prisma.materiel.count({
        where: {
          quantiteDisponible: { gt: 0 }
        }
      }),
      prisma.materiel.count({
        where: {
          quantiteDisponible: {
            lte: prisma.materiel.fields.seuilAlerte
          }
        }
      }),
      prisma.materiel.aggregate({
        _sum: {
          prixUnitaire: true
        },
        where: {
          quantiteDisponible: { gt: 0 }
        }
      })
    ]);

    const stats = {
      totalMateriels,
      materielEnStock,
      materielEnAlerte,
      valeurStock: valeurStock._sum.prixUnitaire || 0
    };

    sendSuccess(res, stats, 'Statistiques de stock récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching stock stats:', error);
    sendError(res, 'Erreur lors de la récupération des statistiques');
  }
};