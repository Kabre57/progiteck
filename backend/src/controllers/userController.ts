import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { 
 
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest 
} from '@/types';
import { logger } from '@/config/logger';

export const getUsers = async (
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
        { prenom: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.utilisateur.findMany({
        where,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          phone: true,
          theme: true,
          displayName: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              libelle: true,
            }
          },
          technicien: {
            select: {
              id: true,
              specialite: {
                select: {
                  libelle: true
                }
              }
            }
          }
        },
        orderBy: [
          { nom: 'asc' },
          { prenom: 'asc' }
        ],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.utilisateur.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      users,
      paginationMeta,
      'Utilisateurs récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching users:', error);
    sendError(res, 'Erreur lors de la récupération des utilisateurs');
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        theme: true,
        displayName: true,
        address: true,
        state: true,
        country: true,
        designation: true,
        balance: true,
        emailStatus: true,
        kycStatus: true,
        lastLogin: true,
        status: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            libelle: true,
          }
        },
        technicien: {
          select: {
            id: true,
            contact: true,
            specialite: {
              select: {
                id: true,
                libelle: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    sendSuccess(res, user, 'Profil récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching profile:', error);
    sendError(res, 'Erreur lors de la récupération du profil');
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.motDePasse);
    if (!isValidPassword) {
      sendError(res, 'Mot de passe actuel incorrect', 400);
      return;
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.utilisateur.update({
      where: { id: userId },
      data: {
        motDePasse: hashedNewPassword
      }
    });

    sendSuccess(res, null, 'Mot de passe modifié avec succès');
  } catch (error) {
    logger.error('Error changing password:', error);
    sendError(res, 'Erreur lors de la modification du mot de passe');
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      phone,
      theme,
      displayName,
      address,
      state,
      country,
      designation,
      roleId,
      status
    }: CreateUserRequest = req.body;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.utilisateur.findUnique({
      where: { email }
    });

    if (existingUser) {
      sendError(res, 'Un utilisateur avec cet email existe déjà', 400);
      return;
    }

    // Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      sendError(res, 'Rôle non trouvé', 404);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 12);

    const user = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        phone: phone || null,
        theme: theme || 'light',
        displayName: displayName || null,
        address: address || null,
        state: state || null,
        country: country || null,
        designation: designation || null,
        roleId,
        status: status || 'active'
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        theme: true,
        displayName: true,
        address: true,
        state: true,
        country: true,
        designation: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            libelle: true,
          }
        }
      }
    });

    sendSuccess(res, user, 'Utilisateur créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating user:', error);
    sendError(res, 'Erreur lors de la création de l\'utilisateur');
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id as string);

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        theme: true,
        displayName: true,
        address: true,
        state: true,
        country: true,
        designation: true,
        balance: true,
        emailStatus: true,
        kycStatus: true,
        lastLogin: true,
        status: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            libelle: true,
          }
        },
        technicien: {
          select: {
            id: true,
            contact: true,
            specialite: {
              select: {
                id: true,
                libelle: true,
              }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            messagesReceived: true,
            notifications: true,
            auditLogs: true
          }
        }
      }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    sendSuccess(res, user, 'Utilisateur récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching user:', error);
    sendError(res, 'Erreur lors de la récupération de l\'utilisateur');
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
  const { id } = req.params;
  const userId = parseInt(id ?? '');
    const updateData: UpdateUserRequest = req.body;

    // Log des données reçues
    logger.debug('Update payload:', { userId, updateData });

    // Vérification de l'existence de l'utilisateur
    const existingUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!existingUser) {
      return sendError(res, 'Utilisateur non trouvé', 404);
    }

    // Vérification du rôle
    if (updateData.roleId) {
      const roleExists = await prisma.role.findUnique({
        where: { id: updateData.roleId }
      });
      if (!roleExists) {
        return sendError(res, 'Rôle spécifié non valide', 400);
      }
    }

    // Vérification email unique (sauf pour l'utilisateur courant)
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailUser = await prisma.utilisateur.findUnique({
        where: { email: updateData.email }
      });
      if (emailUser) {
        return sendError(res, 'Email déjà utilisé par un autre utilisateur', 400);
      }
    }

    // Mise à jour
    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data: updateData,
      include: { role: true }
    });

    sendSuccess(res, updatedUser, 'Utilisateur mis à jour');
  } catch (error) {
    logger.error('Update error:', error);
    sendError(res, 'Erreur de mise à jour', 500);
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id as string);
    const currentUserId = req.user!.id;

    // Empêcher l'auto-suppression
    if (userId === currentUserId) {
      sendError(res, 'Vous ne pouvez pas supprimer votre propre compte', 400);
      return;
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        technicien: {
          include: {
            interventions: true,
            rapports: true
          }
        },
        messages: true,
        messagesReceived: true,
        notifications: true,
        auditLogs: true
      }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    // Vérifier s'il y a des données liées critiques
    const hasLinkedData = (user.technicien?.interventions && user.technicien.interventions.length > 0) ||
      (user.technicien?.rapports && user.technicien.rapports.length > 0);
    if (hasLinkedData) {
      sendError(
        res,
        'Impossible de supprimer un utilisateur avec des interventions ou rapports associés. Désactivez le compte à la place.',
        400
      );
      return;
    }

    // Supprimer l'utilisateur (les relations seront supprimées en cascade)
    await prisma.utilisateur.delete({
      where: { id: userId }
    });

    sendSuccess(res, null, 'Utilisateur supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting user:', error);
    sendError(res, 'Erreur lors de la suppression de l\'utilisateur');
  }
};

export const toggleUserStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id as string);
    const currentUserId = req.user!.id;

    // Empêcher l'auto-désactivation
    if (userId === currentUserId) {
      sendError(res, 'Vous ne pouvez pas modifier le statut de votre propre compte', 400);
      return;
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    const newStatus = existingUser.status === 'active' ? 'inactive' : 'active';

    const user = await prisma.utilisateur.update({
      where: { id: userId },
      data: { status: newStatus },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            libelle: true
          }
        }
      }
    });

    sendSuccess(
      res, 
      user, 
      `Utilisateur ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès`
    );
  } catch (error) {
    logger.error('Error toggling user status:', error);
    sendError(res, 'Erreur lors de la modification du statut');
  }
};

export const resetUserPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword }: { newPassword: string } = req.body;
    const userId = parseInt(id as string);

    // Vérifier que l'utilisateur existe
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.utilisateur.update({
      where: { id: userId },
      data: { motDePasse: hashedPassword }
    });

    sendSuccess(res, null, 'Mot de passe réinitialisé avec succès');
  } catch (error) {
    logger.error('Error resetting password:', error);
    sendError(res, 'Erreur lors de la réinitialisation du mot de passe');
  }
};

export const getRoles = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        libelle: true,
        _count: {
          select: {
            utilisateurs: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    });

    sendSuccess(res, roles, 'Rôles récupérés avec succès');
  } catch (error) {
    logger.error('Error fetching roles:', error);
    sendError(res, 'Erreur lors de la récupération des rôles');
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    // Récupérer l'utilisateur avec le mot de passe
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.motDePasse);
    if (!isValidPassword) {
      sendError(res, 'Mot de passe actuel incorrect', 400);
      return;
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.utilisateur.update({
      where: { id: userId },
      data: {
        motDePasse: hashedNewPassword
      }
    });

    sendSuccess(res, null, 'Mot de passe modifié avec succès');
  } catch (error) {
    logger.error('Error changing password:', error);
    sendError(res, 'Erreur lors de la modification du mot de passe');
  }
};


