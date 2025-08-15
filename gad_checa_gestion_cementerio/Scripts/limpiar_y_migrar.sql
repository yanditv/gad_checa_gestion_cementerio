-- Script para limpiar datos existentes y permitir migración del catastro
-- ADVERTENCIA: Este script eliminará TODOS los datos de contratos, difuntos, responsables, etc.
-- Use con precaución solo en ambientes de desarrollo/testing

BEGIN TRANSACTION;

-- Deshabilitar restricciones de clave foránea temporalmente
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"

-- Eliminar datos en orden para evitar conflictos de FK
DELETE FROM [Cuota];
DELETE FROM [Pago];
DELETE FROM [Responsable];
DELETE FROM [Contrato];
DELETE FROM [Difunto];
DELETE FROM [Persona];
DELETE FROM [Boveda];
DELETE FROM [Piso];
DELETE FROM [Bloque];

-- Habilitar restricciones de clave foránea
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"

-- Reset identity seeds si es necesario
DBCC CHECKIDENT ('Contrato', RESEED, 0);
DBCC CHECKIDENT ('Difunto', RESEED, 0);
DBCC CHECKIDENT ('Persona', RESEED, 0);
DBCC CHECKIDENT ('Boveda', RESEED, 0);
DBCC CHECKIDENT ('Piso', RESEED, 0);
DBCC CHECKIDENT ('Bloque', RESEED, 0);

COMMIT TRANSACTION;

PRINT 'Datos eliminados exitosamente. La migración puede ejecutarse ahora.';