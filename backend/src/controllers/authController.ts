import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';
import { AuthTokenPayload } from '@/types';

interface LoginRequest {
  email: string;
  motDePasse: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, motDePasse }: LoginRequest = req.body;

    // Trouver l'utilisateur
    const user = await prisma.utilisateur.findUnique({
      where: { email },
      include: {
        role: true
      }
    });

    if (!user) {
      sendError(res, 'Email ou mot de passe incorrect', 401);
      return;
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isValidPassword) {
      sendError(res, 'Email ou mot de passe incorrect', 401);
      return;
    }

    // Vérifier que le compte est actif
    if (user.status !== 'active') {
      sendError(res, 'Compte désactivé', 401);
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      logger.error('JWT secrets not configured');
      sendError(res, 'Configuration serveur manquante');
      return;
    }

    // Créer les tokens
    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role.libelle
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret, { expiresIn: '7d' });

    // Mettre à jour la dernière connexion
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const responseData = {
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        phone: user.phone,
        theme: user.theme,
        displayName: user.displayName,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };

    sendSuccess(res, responseData, 'Connexion réussie');
  } catch (error) {
    logger.error('Login error:', error);
    sendError(res, 'Erreur lors de la connexion');
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, 'Refresh token requis', 401);
      return;
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtRefreshSecret || !jwtSecret) {
      logger.error('JWT secrets not configured');
      sendError(res, 'Configuration serveur manquante');
      return;
    }

    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as AuthTokenPayload;

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.utilisateur.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!user || user.status !== 'active') {
      sendError(res, 'Utilisateur non trouvé ou inactif', 401);
      return;
    }

    // Créer un nouveau access token
    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role.libelle
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });

    sendSuccess(res, { accessToken }, 'Token rafraîchi avec succès');
  } catch (error) {
    logger.error('Refresh token error:', error);
    sendError(res, 'Token invalide', 401);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      sendError(res, 'Utilisateur non authentifié', 401);
      return;
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        role: true,
        technicien: {
          include: {
            specialite: true
          }
        }
      }
    });

    if (!user) {
      sendError(res, 'Utilisateur non trouvé', 404);
      return;
    }

    const userData = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      phone: user.phone,
      theme: user.theme,
      displayName: user.displayName,
      role: user.role,
      technicien: user.technicien
    };

    sendSuccess(res, userData, 'Profil récupéré avec succès');
  } catch (error) {
    logger.error('Get profile error:', error);
    sendError(res, 'Erreur lors de la récupération du profil');
  }
};