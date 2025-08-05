import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { CreateClientRequest } from '@/types';
import { logger } from '@/config/logger';

export const getClients = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, search } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nom: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { entreprise: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          typePaiement: true,
          _count: {
            select: {
              missions: true,
              devis: true,
              factures: true
            }
          }
        },
        orderBy: {
          dateDInscription: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.client.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      clients,
      paginationMeta,
      'Clients récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching clients:', error);
    sendError(res, 'Erreur lors de la récupération des clients');
  }
};

export const getClientById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        typePaiement: true,
        missions: {
          include: {
            _count: {
              select: {
                interventions: true
              }
            }
          }
        },
        devis: true,
        factures: true,
        _count: {
          select: {
            missions: true,
            devis: true,
            factures: true
          }
        }
      }
    });

    if (!client) {
      sendError(res, 'Client non trouvé', 404);
      return;
    }

    sendSuccess(res, client, 'Client récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching client:', error);
    sendError(res, 'Erreur lors de la récupération du client');
  }
};

export const createClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      nom,
      email,
      entreprise,
      typeDeCart,
      typePaiementId,
      localisation
    }: CreateClientRequest = req.body;
    let telephone = req.body.telephone;

    // Normaliser le numéro de téléphone avant sauvegarde
    if (telephone) {
      const cleanedPhone = telephone.replace(/[^\d]/g, "");
      // Optionnel : formater le numéro pour l\"affichage
      if (cleanedPhone.length === 10) {
        telephone = cleanedPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, 
          "$1 $2 $3 $4 $5");
      } else if (cleanedPhone.length === 8) {
        telephone = cleanedPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, 
          "$1 $2 $3 $4");
      }
    }

    // Vérifier que l\'email n\'existe pas déjà
    const existingClient = await prisma.client.findUnique({
      where: { email }
    });

    if (existingClient) {
      sendError(res, 'Un client avec cet email existe déjà', 400);
      return;
    }

    // Si typePaiementId est fourni, vérifier qu'il existe
    if (typePaiementId) {
      const typePaiement = await prisma.typePaiement.findUnique({
        where: { id: typePaiementId }
      });

      if (!typePaiement) {
        sendError(res, 'Type de paiement non trouvé', 404);
        return;
      }
    }

    const client = await prisma.client.create({
      data: {
        nom,
        email,
        telephone,
        entreprise,
        typeDeCart: typeDeCart || 'Standard',
        typePaiementId,
        localisation
      },
      include: {
        typePaiement: true,
        _count: {
          select: {
            missions: true,
            devis: true,
            factures: true
          }
        }
      }
    });

    sendSuccess(res, client, 'Client créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating client:', error);
    sendError(res, 'Erreur lors de la création du client');
  }
};

export const updateClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);
    const updateData: Partial<CreateClientRequest> = req.body;

    // Vérifier que le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!existingClient) {
      sendError(res, 'Client non trouvé', 404);
      return;
    }

    // Si email est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.email && updateData.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: updateData.email }
      });

      if (emailExists) {
        sendError(res, 'Un client avec cet email existe déjà', 400);
        return;
      }
    }

    // Si typePaiementId est fourni, vérifier qu'il existe
    if (updateData.typePaiementId) {
      const typePaiement = await prisma.typePaiement.findUnique({
        where: { id: updateData.typePaiementId }
      });

      if (!typePaiement) {
        sendError(res, 'Type de paiement non trouvé', 404);
        return;
      }
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      include: {
        typePaiement: true,
        _count: {
          select: {
            missions: true,
            devis: true,
            factures: true
          }
        }
      }
    });

    sendSuccess(res, client, 'Client mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating client:', error);
    sendError(res, 'Erreur lors de la mise à jour du client');
  }
};

export const deleteClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const clientId = parseInt(id);

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        missions: true,
        devis: true,
        factures: true
      }
    });

    if (!client) {
      sendError(res, 'Client non trouvé', 404);
      return;
    }

    // Vérifier qu'il n'y a pas de données liées
    if (client.missions.length > 0 || client.devis.length > 0 || client.factures.length > 0) {
      sendError(
        res,
        'Impossible de supprimer un client avec des missions, devis ou factures associés',
        400
      );
      return;
    }

    await prisma.client.delete({
      where: { id: clientId }
    });

    sendSuccess(res, null, 'Client supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting client:', error);
    sendError(res, 'Erreur lors de la suppression du client');
  }
};