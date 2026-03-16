# Estado de Migración (2026-03-08)

## Estado real de paridad

La migración **no está completa al 100%** respecto al sistema legado ASP.NET (`gad_checa_gestion_cementerio`).

## Avances aplicados en esta iteración

- Seed inicial backend alineado con `Program.cs`:
  - Roles: `Admin`, `Usuario`, `Administrador`
  - Usuario admin: `admin@teobu.com`
  - Datos base: `GADInformacion`, `Cementerio de checa`, descuentos (`Ninguno`, `50%`, `100%`)
- Frontend:
  - Creación de contrato migrada a flujo **multi-paso**
  - Creación de bloques conectada a API real
  - Ajustes de layout para evitar superposición de sidebar
  - Ajustes de arranque de Next para mayor estabilidad en desarrollo

## Matriz de paridad (legado -> nuevo)

- Dashboard: **Parcial**
- Contratos:
  - Listado/Detalle/Edición básica: **Sí**
  - Crear en varios pasos: **Sí (versión inicial migrada)**
  - Relación avanzada de contratos + documentos firmados + lógica completa heredada: **Parcial**
- Bloques:
  - Listado: **Sí**
  - Crear con persistencia real: **Sí**
  - Comportamiento idéntico al legado (todos los casos/reglas): **Parcial**
- Bóvedas: **Parcial**
- Difuntos: **Parcial**
- Cobros/Facturas: **Parcial**
- Reportes:
  - Resumen API/UI: **Sí**
  - Reportes completos y PDFs equivalentes al legado: **No**
- Impresión de contrato / PDF: **No**
- Administración de usuarios/roles: **Parcial**
- Notificaciones/Documentos auxiliares: **No**
- Identidad visual exacta (vistas idénticas + assets/logos al 100%): **Parcial**

## Pendiente para cierre 100%

- Migrar todos los subflujos de `ContratosController` legado (incluyendo documentos y reglas completas).
- Migrar reportes detallados y generación PDF equivalente (contratos, cobros, facturas, reportes).
- Migrar módulos auxiliares faltantes (`Notify`, `Documentos`, variantes de vistas/partials).
- Homologar UI al 100% (estructura, estilos, interacción y assets exactos por vista).
