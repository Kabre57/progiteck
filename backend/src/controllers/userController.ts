import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';
import { CreateUserRequest, UpdateUserRequest } from '@/types';
import bcrypt from 'bcrypt';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nom, prenom, email, motDePasse, phone, roleId, status,
      theme, displayName, address, state, country, designation
    }: CreateUserRequest = req.body;

    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'Un utilisateur avec cet email existe déjà', 400);
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return sendError(res, 'Rôle non trouvé', 404);
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 12);

    const user = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        phone: phone || null,
        roleId,
        status: status || 'active',
        theme: theme || 'light',
        displayName: displayName || `${prenom} ${nom}`,
        address: address || null,
        state: state || null,
        country: country || null,
        designation: designation || null,
      },
      select: { 
        id: true, 
        nom: true, 
        prenom: true, 
        email: true, 
        phone: true, 
        role: { select: { id: true, libelle: true } },
        status: true,
        createdAt: true,
        updatedAt: true,
        theme: true,
        displayName: true,
        address: true,
        state: true,
        country: true,
        designation: true,
      }
    });

    sendSuccess(res, user, 'Utilisateur créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating user:', error);
    sendError(res, 'Erreur lors de la création de l\'utilisateur');
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id || '0', 10);
    if (isNaN(userId) || userId === 0) return sendError(res, "ID d'utilisateur invalide", 400);
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, nom: true, prenom: true, email: true, phone: true, theme: true, displayName: true, address: true, state: true, country: true, designation: true, balance: true, emailStatus: true, kycStatus: true, lastLogin: true, status: true, createdAt: true, role: { select: { id: true, libelle: true } }, technicien: { select: { id: true, contact: true, specialite: { select: { id: true, libelle: true } } } }, _count: { select: { messages: true, messagesReceived: true, notifications: true, auditLogs: true } } }
    });
    if (!user) return sendError(res, 'Utilisateur non trouvé', 404);
    sendSuccess(res, user, 'Utilisateur récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching user:', error);
    sendError(res, 'Erreur lors de la récupération de l\'utilisateur');
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id || '0', 10);
    if (isNaN(userId) || userId === 0) return sendError(res, "ID d'utilisateur invalide", 400);

    const updateData: UpdateUserRequest = req.body;

    if (updateData.motDePasse) {
      updateData.motDePasse = await bcrypt.hash(updateData.motDePasse, 12);
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data: updateData,
      select: { 
        id: true, 
        nom: true, 
        prenom: true, 
        email: true, 
        phone: true, 
        role: { select: { id: true, libelle: true } },
        status: true,
        createdAt: true,
        updatedAt: true,
        theme: true,
        displayName: true,
        address: true,
        state: true,
        country: true,
        designation: true,
      }
    });

    sendSuccess(res, updatedUser, 'Utilisateur mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating user:', error);
    sendError(res, 'Erreur lors de la mise à jour de l\'utilisateur');
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id || '0', 10);
    if (isNaN(userId) || userId === 0) return sendError(res, "ID d'utilisateur invalide", 400);

    await prisma.utilisateur.delete({
      where: { id: userId }
    });

    sendSuccess(res, null, 'Utilisateur supprimé avec succès', 204);
  } catch (error) {
    logger.error('Error deleting user:', error);
    sendError(res, 'Erreur lors de la suppression de l\'utilisateur');
  }
};
