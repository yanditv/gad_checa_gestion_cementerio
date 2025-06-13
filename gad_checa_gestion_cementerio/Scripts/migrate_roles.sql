-- Eliminar el rol "Administrador" y migrar usuarios al rol "Admin"
BEGIN TRANSACTION;

-- Obtener el ID del rol Admin
DECLARE @AdminRoleId NVARCHAR(450);
SELECT @AdminRoleId = Id FROM Roles WHERE Nombre = 'Admin';

-- Obtener el ID del rol Administrador
DECLARE @AdministradorRoleId NVARCHAR(450);
SELECT @AdministradorRoleId = Id FROM Roles WHERE Nombre = 'Administrador';

-- Migrar usuarios del rol Administrador al rol Admin
INSERT INTO UsuarioRoles (UsuarioId, RolId)
SELECT UsuarioId, @AdminRoleId
FROM UsuarioRoles
WHERE RolId = @AdministradorRoleId
AND NOT EXISTS (
    SELECT 1 FROM UsuarioRoles 
    WHERE UsuarioId = UsuarioRoles.UsuarioId 
    AND RolId = @AdminRoleId
);

-- Eliminar asignaciones del rol Administrador
DELETE FROM UsuarioRoles WHERE RolId = @AdministradorRoleId;

-- Eliminar el rol Administrador
DELETE FROM Roles WHERE Id = @AdministradorRoleId;

COMMIT; 