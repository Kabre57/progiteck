import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { AuthTokenPayload } from '@/types';
import { logger } from '@/config/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    roleId: number;
    role: {
      id: number;
      libelle: string;
    };
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Configuration serveur manquante'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
    
    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.utilisateur.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(403).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
      return;
    }

    if (!roles.includes(req.user.role.libelle)) {
      res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
      return;
    }

    next();
  };
};

export type { AuthenticatedRequest };