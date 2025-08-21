-- Migration pour ajouter le système de permissions granulaires
-- Date: 2024-01-01
-- Description: Ajout des tables Permission, RolePermission, UserPermission et modification de la table Role

-- Étape 1: Modifier la table Role existante
ALTER TABLE roles 
ADD COLUMN description TEXT,
ADD COLUMN "isDefault" BOOLEAN DEFAULT FALSE,
ADD COLUMN "isSystem" BOOLEAN DEFAULT FALSE,
ADD COLUMN "createdAt" TIMESTAMP DEFAULT NOW(),
ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();

-- Étape 2: Créer la table Permission
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Étape 3: Créer la table RolePermission (relation many-to-many)
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE("roleId", "permissionId")
);

-- Étape 4: Créer la table UserPermission (permissions directes)
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "createdBy" INTEGER,
    FOREIGN KEY ("userId") REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY ("permissionId") REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY ("createdBy") REFERENCES utilisateurs(id),
    UNIQUE("userId", "permissionId")
);

-- Étape 5: Insérer les permissions de base
INSERT INTO permissions (resource, action, description) VALUES
-- Permissions clients
('clients', 'create', 'Créer de nouveaux clients'),
('clients', 'read', 'Consulter les clients'),
('clients', 'update', 'Modifier les clients'),
('clients', 'delete', 'Supprimer les clients'),

-- Permissions missions
('missions', 'create', 'Créer de nouvelles missions'),
('missions', 'read', 'Consulter les missions'),
('missions', 'update', 'Modifier les missions'),
('missions', 'delete', 'Supprimer les missions'),

-- Permissions interventions
('interventions', 'create', 'Créer de nouvelles interventions'),
('interventions', 'read', 'Consulter les interventions'),
('interventions', 'update', 'Modifier les interventions'),
('interventions', 'delete', 'Supprimer les interventions'),

-- Permissions devis
('devis', 'create', 'Créer de nouveaux devis'),
('devis', 'read', 'Consulter les devis'),
('devis', 'update', 'Modifier les devis'),
('devis', 'delete', 'Supprimer les devis'),
('devis', 'validate', 'Valider les devis'),

-- Permissions factures
('factures', 'create', 'Créer de nouvelles factures'),
('factures', 'read', 'Consulter les factures'),
('factures', 'update', 'Modifier les factures'),
('factures', 'delete', 'Supprimer les factures'),

-- Permissions rapports
('rapports', 'create', 'Créer de nouveaux rapports'),
('rapports', 'read', 'Consulter les rapports'),
('rapports', 'update', 'Modifier les rapports'),
('rapports', 'delete', 'Supprimer les rapports'),
('rapports', 'validate', 'Valider les rapports'),

-- Permissions techniciens
('techniciens', 'create', 'Créer de nouveaux techniciens'),
('techniciens', 'read', 'Consulter les techniciens'),
('techniciens', 'update', 'Modifier les techniciens'),
('techniciens', 'delete', 'Supprimer les techniciens'),

-- Permissions matériels
('materiels', 'create', 'Créer de nouveaux matériels'),
('materiels', 'read', 'Consulter les matériels'),
('materiels', 'update', 'Modifier les matériels'),
('materiels', 'delete', 'Supprimer les matériels'),

-- Permissions utilisateurs
('utilisateurs', 'create', 'Créer de nouveaux utilisateurs'),
('utilisateurs', 'read', 'Consulter les utilisateurs'),
('utilisateurs', 'update', 'Modifier les utilisateurs'),
('utilisateurs', 'delete', 'Supprimer les utilisateurs'),

-- Permissions dashboard
('dashboard', 'read', 'Accéder au tableau de bord'),

-- Permissions messages
('messages', 'create', 'Envoyer des messages'),
('messages', 'read', 'Lire les messages'),
('messages', 'update', 'Modifier les messages'),
('messages', 'delete', 'Supprimer les messages'),

-- Permissions notifications
('notifications', 'create', 'Créer des notifications'),
('notifications', 'read', 'Lire les notifications'),
('notifications', 'update', 'Modifier les notifications'),
('notifications', 'delete', 'Supprimer les notifications'),

-- Permissions spécialités
('specialites', 'create', 'Créer de nouvelles spécialités'),
('specialites', 'read', 'Consulter les spécialités'),
('specialites', 'update', 'Modifier les spécialités'),
('specialites', 'delete', 'Supprimer les spécialités'),

-- Permissions types de paiement
('types_paiement', 'create', 'Créer de nouveaux types de paiement'),
('types_paiement', 'read', 'Consulter les types de paiement'),
('types_paiement', 'update', 'Modifier les types de paiement'),
('types_paiement', 'delete', 'Supprimer les types de paiement'),

-- Permissions administration
('admin', 'create', 'Fonctions d''administration - création'),
('admin', 'read', 'Fonctions d''administration - lecture'),
('admin', 'update', 'Fonctions d''administration - modification'),
('admin', 'delete', 'Fonctions d''administration - suppression');

-- Étape 6: Marquer les rôles existants comme système et ajouter des descriptions
UPDATE roles SET 
    "isSystem" = TRUE,
    description = CASE 
        WHEN libelle = 'admin' THEN 'Administrateur système avec tous les droits'
        WHEN libelle = 'manager' THEN 'Gestionnaire avec droits étendus'
        WHEN libelle = 'commercial' THEN 'Responsable commercial'
        WHEN libelle = 'technicien' THEN 'Technicien de terrain'
        ELSE 'Rôle utilisateur standard'
    END;

-- Étape 7: Créer les associations rôle-permissions basées sur les rôles existants
-- Administrateur : toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.libelle = 'admin';

-- Manager : permissions étendues sauf administration système
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.libelle = 'manager' 
AND p.resource != 'admin'
AND NOT (p.resource = 'utilisateurs' AND p.action IN ('create', 'delete'));

-- Commercial : permissions commerciales
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.libelle = 'commercial' 
AND p.resource IN ('clients', 'devis', 'factures', 'missions', 'dashboard', 'messages', 'notifications')
AND p.action != 'delete';

-- Technicien : permissions techniques limitées
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.libelle = 'technicien' 
AND (
    (p.resource IN ('interventions', 'rapports', 'materiels') AND p.action IN ('read', 'create', 'update'))
    OR (p.resource IN ('missions', 'techniciens', 'specialites') AND p.action = 'read')
    OR (p.resource = 'messages' AND p.action IN ('read', 'create'))
    OR (p.resource = 'notifications' AND p.action = 'read')
);

-- Étape 8: Créer des index pour optimiser les performances
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_role_permissions_role_id ON role_permissions("roleId");
CREATE INDEX idx_role_permissions_permission_id ON role_permissions("permissionId");
CREATE INDEX idx_user_permissions_user_id ON user_permissions("userId");
CREATE INDEX idx_user_permissions_permission_id ON user_permissions("permissionId");

-- Étape 9: Ajouter des commentaires pour la documentation
COMMENT ON TABLE permissions IS 'Table des permissions atomiques du système';
COMMENT ON TABLE role_permissions IS 'Association entre rôles et permissions';
COMMENT ON TABLE user_permissions IS 'Permissions directes accordées aux utilisateurs';
COMMENT ON COLUMN permissions.resource IS 'Nom de la ressource (ex: clients, missions)';
COMMENT ON COLUMN permissions.action IS 'Action CRUD ou spécialisée (ex: create, read, update, delete, validate)';
COMMENT ON COLUMN user_permissions.granted IS 'true = permission accordée, false = permission refusée (override du rôle)';
COMMENT ON COLUMN user_permissions."createdBy" IS 'Utilisateur qui a accordé/refusé cette permission';

-- Étape 10: Créer une vue pour faciliter les requêtes de permissions effectives
CREATE VIEW user_effective_permissions AS
SELECT DISTINCT 
    u.id as user_id,
    u.email,
    u.nom,
    u.prenom,
    p.resource,
    p.action,
    CASE 
        WHEN up.granted IS NOT NULL THEN up.granted
        WHEN rp.id IS NOT NULL THEN TRUE
        ELSE FALSE
    END as has_permission,
    CASE 
        WHEN up.granted IS NOT NULL THEN 'direct'
        WHEN rp.id IS NOT NULL THEN 'role'
        ELSE 'none'
    END as permission_source
FROM utilisateurs u
CROSS JOIN permissions p
LEFT JOIN user_permissions up ON u.id = up."userId" AND p.id = up."permissionId"
LEFT JOIN role_permissions rp ON u."roleId" = rp."roleId" AND p.id = rp."permissionId"
WHERE up.id IS NOT NULL OR rp.id IS NOT NULL;

COMMENT ON VIEW user_effective_permissions IS 'Vue des permissions effectives de chaque utilisateur (combinaison rôles + permissions directes)';

