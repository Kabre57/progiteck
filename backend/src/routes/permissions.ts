import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import permissionController from '../controllers/permissionController';

const router: Router = Router();

// Routes pour les permissions
router.get(
  '/permissions',
  authenticateToken,
  requirePermission('admin', 'read'),
  permissionController.getAllPermissions
);

router.post(
  '/permissions',
  authenticateToken,
  requirePermission('admin', 'create'),
  permissionController.createPermission
);

// Routes pour les permissions utilisateur
router.get(
  '/users/:userId/permissions',
  authenticateToken,
  requirePermission('utilisateurs', 'read'),
  permissionController.getUserPermissions
);

router.post(
  '/users/:userId/permissions/grant',
  authenticateToken,
  requirePermission('utilisateurs', 'update'),
  permissionController.grantUserPermission
);

router.post(
  '/users/:userId/permissions/revoke',
  authenticateToken,
  requirePermission('utilisateurs', 'update'),
  permissionController.revokeUserPermission
);

router.get(
  '/users/:userId/permissions/check',
  authenticateToken,
  requirePermission('utilisateurs', 'read'),
  permissionController.checkUserPermission
);

// Routes pour les rôles
router.get(
  '/roles',
  authenticateToken,
  requirePermission('admin', 'read'),
  permissionController.getAllRoles
);

router.post(
  '/roles',
  authenticateToken,
  requirePermission('admin', 'create'),
  permissionController.createRole
);

router.get(
  '/roles/:roleId/permissions',
  authenticateToken,
  requirePermission('admin', 'read'),
  permissionController.getRolePermissions
);

router.put(
  '/roles/:roleId/permissions',
  authenticateToken,
  requirePermission('admin', 'update'),
  permissionController.updateRolePermissions
);

export default router;