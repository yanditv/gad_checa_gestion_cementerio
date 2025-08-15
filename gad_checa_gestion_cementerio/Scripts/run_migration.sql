-- Script para verificar el estado de la migración del catastro
-- Ejecutar este script después de la migración para verificar los datos

-- 1. Verificar cementerio
SELECT 'CEMENTERIO' as TABLA, COUNT(*) as REGISTROS FROM Cementerio;

-- 2. Verificar bloques creados
SELECT 'BLOQUES' as TABLA, COUNT(*) as REGISTROS FROM Bloque;
SELECT Descripcion, Tipo, COUNT(*) as CANTIDAD FROM Bloque GROUP BY Descripcion, Tipo;

-- 3. Verificar pisos creados  
SELECT 'PISOS' as TABLA, COUNT(*) as REGISTROS FROM Piso;

-- 4. Verificar bóvedas creadas
SELECT 'BOVEDAS' as TABLA, COUNT(*) as REGISTROS FROM Boveda;
SELECT b.Descripcion as BLOQUE, COUNT(bo.Id) as BOVEDAS_COUNT
FROM Bloque b
INNER JOIN Piso p ON b.Id = p.BloqueId
INNER JOIN Boveda bo ON p.Id = bo.PisoId
GROUP BY b.Descripcion;

-- 5. Verificar personas creadas
SELECT 'PERSONAS' as TABLA, COUNT(*) as REGISTROS FROM Persona;

-- 6. Verificar difuntos creados
SELECT 'DIFUNTOS' as TABLA, COUNT(*) as REGISTROS FROM Difunto;

-- 7. Verificar contratos creados
SELECT 'CONTRATOS' as TABLA, COUNT(*) as REGISTROS FROM Contrato;

-- 8. Verificar responsables
SELECT 'RESPONSABLES' as TABLA, COUNT(*) as REGISTROS FROM Responsable;

-- 9. Detalle de contratos por bloque
SELECT 
    bl.Descripcion as BLOQUE,
    bl.Tipo as TIPO_BLOQUE,
    COUNT(c.Id) as CONTRATOS_COUNT,
    MIN(c.FechaCreacion) as PRIMERA_MIGRACION,
    MAX(c.FechaCreacion) as ULTIMA_MIGRACION
FROM Bloque bl
INNER JOIN Piso p ON bl.Id = p.BloqueId
INNER JOIN Boveda bo ON p.Id = bo.PisoId
INNER JOIN Contrato c ON bo.Id = c.BovedaId
GROUP BY bl.Descripcion, bl.Tipo
ORDER BY bl.Descripcion;

-- 10. Verificar datos completos (contratos con difuntos y bóvedas)
SELECT 
    c.NumeroSecuencial as CONTRATO,
    d.Nombres + ' ' + d.Apellidos as DIFUNTO,
    bl.Descripcion as BLOQUE,
    bo.Numero as BOVEDA_NUM,
    c.FechaInicio,
    c.FechaFin,
    c.MontoTotal
FROM Contrato c
INNER JOIN Difunto d ON c.DifuntoId = d.Id
INNER JOIN Boveda bo ON c.BovedaId = bo.Id
INNER JOIN Piso p ON bo.PisoId = p.Id
INNER JOIN Bloque bl ON p.BloqueId = bl.Id
ORDER BY bl.Descripcion, bo.Numero;

-- 11. Verificar si hay errores o datos faltantes
SELECT 'CONTRATOS SIN DIFUNTO' as PROBLEMA, COUNT(*) as CANTIDAD
FROM Contrato c LEFT JOIN Difunto d ON c.DifuntoId = d.Id 
WHERE d.Id IS NULL;

SELECT 'CONTRATOS SIN BOVEDA' as PROBLEMA, COUNT(*) as CANTIDAD  
FROM Contrato c LEFT JOIN Boveda b ON c.BovedaId = b.Id
WHERE b.Id IS NULL;

SELECT 'BOVEDAS SIN PISO' as PROBLEMA, COUNT(*) as CANTIDAD
FROM Boveda b LEFT JOIN Piso p ON b.PisoId = p.Id
WHERE p.Id IS NULL;

SELECT 'PISOS SIN BLOQUE' as PROBLEMA, COUNT(*) as CANTIDAD
FROM Piso p LEFT JOIN Bloque bl ON p.BloqueId = bl.Id  
WHERE bl.Id IS NULL;