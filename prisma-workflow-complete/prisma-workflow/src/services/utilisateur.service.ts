import prisma from '../utils/prisma';
import { Prisma, Utilisateur } from '@prisma/client';

export class UtilisateurService {
  
  /**
   * Créer un nouvel utilisateur
   */
  static async createUtilisateur(data: Prisma.UtilisateurCreateInput): Promise<Utilisateur> {
    try {
      const utilisateur = await prisma.utilisateur.create({
        data,
        include: {
          role: true,
          technicien: {
            include: {
              specialite: true,
            },
          },
        },
      });
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  static async getUtilisateurById(id: number): Promise<Utilisateur | null> {
    try {
      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id },
        include: {
          role: true,
          technicien: {
            include: {
              specialite: true,
            },
          },
          auditLogs: {
            take: 10,
            orderBy: { timestamp: 'desc' },
          },
          notifications: {
            where: { readAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupérer un utilisateur par email
   */
  static async getUtilisateurByEmail(email: string): Promise<Utilisateur | null> {
    try {
      const utilisateur = await prisma.utilisateur.findUnique({
        where: { email },
        include: {
          role: true,
          technicien: {
            include: {
              specialite: true,
            },
          },
        },
      });
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur par email:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les utilisateurs avec pagination
   */
  static async getAllUtilisateurs(
    page: number = 1,
    limit: number = 10,
    filters?: {
      roleId?: number;
      status?: string;
      search?: string;
    }
  ) {
    try {
      const skip = (page - 1) * limit;
      
      const where: Prisma.UtilisateurWhereInput = {};
      
      if (filters?.roleId) {
        where.roleId = filters.roleId;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.search) {
        where.OR = [
          { nom: { contains: filters.search, mode: 'insensitive' } },
          { prenom: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [utilisateurs, total] = await prisma.$transaction([
        prisma.utilisateur.findMany({
          where,
          include: {
            role: true,
            technicien: {
              include: {
                specialite: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.utilisateur.count({ where }),
      ]);

      return {
        data: utilisateurs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUtilisateur(
    id: number,
    data: Prisma.UtilisateurUpdateInput
  ): Promise<Utilisateur> {
    try {
      const utilisateur = await prisma.utilisateur.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          role: true,
          technicien: {
            include: {
              specialite: true,
            },
          },
        },
      });
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  static async deleteUtilisateur(id: number): Promise<Utilisateur> {
    try {
      const utilisateur = await prisma.utilisateur.update({
        where: { id },
        data: {
          status: 'inactive',
          updatedAt: new Date(),
        },
      });
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la dernière connexion
   */
  static async updateLastLogin(id: number): Promise<void> {
    try {
      await prisma.utilisateur.update({
        where: { id },
        data: {
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
      throw error;
    }
  }

  /**
   * Récupérer les utilisateurs par rôle
   */
  static async getUtilisateursByRole(roleLibelle: string): Promise<Utilisateur[]> {
    try {
      const utilisateurs = await prisma.utilisateur.findMany({
        where: {
          role: {
            libelle: roleLibelle,
          },
          status: 'active',
        },
        include: {
          role: true,
          technicien: {
            include: {
              specialite: true,
            },
          },
        },
        orderBy: { nom: 'asc' },
      });
      return utilisateurs;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs par rôle:', error);
      throw error;
    }
  }

  /**
   * Créer un log d'audit pour un utilisateur
   */
  static async createAuditLog(
    userId: number,
    username: string,
    actionType: string,
    entityType: string,
    entityId: string,
    details: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          username,
          actionType,
          entityType,
          entityId,
          details,
          ipAddress,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création du log d\'audit:', error);
      throw error;
    }
  }

  /**
   * Créer une notification pour un utilisateur
   */
  static async createNotification(
    userId: number,
    type: string,
    message: string,
    data?: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          message,
          data,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Marquer les notifications comme lues
   */
  static async markNotificationsAsRead(userId: number, notificationIds?: number[]): Promise<void> {
    try {
      const where: Prisma.NotificationWhereInput = {
        userId,
        readAt: null,
      };

      if (notificationIds && notificationIds.length > 0) {
        where.id = { in: notificationIds };
      }

      await prisma.notification.updateMany({
        where,
        data: {
          readAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
      throw error;
    }
  }
}

