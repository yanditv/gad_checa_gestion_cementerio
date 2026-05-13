# Requerimientos — Sistema de Gestión de Cementerio GAD Checa (migración)

Este documento define **todos** los requerimientos del sistema, tomando como
base la aplicación legada ASP.NET MVC ubicada en `../gad_checa_gestion_cementerio/`
y el `Manual_Usuario_Sistema_Cementerio.md`. La meta es **paridad funcional 100 %**
con el legado en `new-migration/`, y enumera además las mejoras que deben
incorporarse durante la migración.

Convenciones:

- **[L]** = comportamiento existente en el legado que debe migrarse tal cual.
- **[M]** = mejora introducida en la nueva implementación.
- **[N]** = funcionalidad nueva exigida por el negocio.
- Estado: `Pendiente | Parcial | Completo`. El estado refleja el snapshot al
  momento de redactar este documento (ver `MIGRATION_STATUS.md` para la matriz
  viva).

---

## 0. Alcance y stakeholders

- **Cliente:** GAD Parroquial de Checa.
- **Producto:** Sistema web de gestión de cementerio (catastro, contratos de
  arriendo, cobranza, reportes, administración de usuarios).
- **Usuarios finales:** Administrador, Operador (registro/cobros), Cobrador,
  Consulta.
- **Idioma de la UI:** Español de Ecuador.
- **Moneda y cultura:** USD (`en-US` para formato numérico) sobre cultura
  `es-EC` para fechas y textos.
- **Zona horaria:** America/Guayaquil (UTC−5, sin DST).
- **Datos legados a preservar:** archivo `CATASTRO_FINAL.xlsx` (bloques, pisos,
  bóvedas, propietarios, difuntos, contratos preexistentes).

---

## 1. Requerimientos funcionales por módulo

Para cada módulo se listan: **R1, R2 …** los requerimientos atómicos. Cada
requerimiento incluye su origen (`[L]`/`[M]`/`[N]`) y el estado actual.

### 1.1 Autenticación y sesión

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| AUTH-R1 | [L] | Inicio de sesión por **email + contraseña** con JWT en el frontend (legado usaba cookie de Identity; en el nuevo stack se reemplaza por Bearer JWT + httpOnly cookie de refresh, equivalente funcional). | Parcial |
| AUTH-R2 | [L] | Sesión inactiva expira a los **30 minutos** (sliding) y absoluta a los **7 días** (paridad con `CementerioApp.Session`/`CementerioApp.Auth` legados). | Pendiente |
| AUTH-R3 | [L] | Password policy del legado: longitud ≥ 6, una mayúscula, una minúscula, un dígito. **Sin** símbolos obligatorios. | Pendiente |
| AUTH-R4 | [L] | Cambio de contraseña desde el perfil del usuario. | Pendiente |
| AUTH-R5 | [L] | Recuperación de contraseña por email (envío con `EmailSender`/SMTP del legado). | Pendiente |
| AUTH-R6 | [L] | Logout invalida la sesión y redirige al login. | Parcial |
| AUTH-R7 | [M] | Endpoints protegidos por **`@UseGuards(JwtAuthGuard, RolesGuard)`** + decorador `@Roles('Admin' \| 'Administrador' \| 'Usuario')`. | Parcial |
| AUTH-R8 | [M] | Páginas Next.js fuera de `/auth/login` deben redirigir al login si no hay JWT válido (middleware Next). | Pendiente |
| AUTH-R9 | [N] | Seed inicial idéntico al legado: usuario `admin@teobu.com` / clave `Admin123!`, roles `Admin`, `Usuario`, `Administrador`. | Completo |

**Reglas de negocio**

- Los tres roles legados se mantienen: `Admin`, `Usuario`, `Administrador`. Los
  dos primeros existen por compatibilidad histórica; **`Administrador` es el
  rol con permisos globales** (validado en el layout legado: ver `_Layout.cshtml`).
- Si un usuario nuevo se crea sin asignación de rol, recibe `Usuario` por defecto.

### 1.2 Dashboard

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| DASH-R1 | [L] | KPIs principales: total difuntos, ingresos totales del año, bóvedas disponibles/ocupadas, nichos disponibles/ocupados, contratos por vencer y contratos vencidos. | Completo |
| DASH-R2 | [L] | Gráfico de pastel: distribución de espacios. | Completo |
| DASH-R3 | [L] | Gráfico de dona: estado de contratos (activos / por vencer / vencidos). | Completo |
| DASH-R4 | [L] | Gráfico de barras mensuales: ingresos vs deudas. **Hoy se simula con factores fijos**; debe migrarse al cálculo real (sumar pagos del mes vs cuotas vencidas no pagadas). | Parcial |
| DASH-R5 | [L] | Gráfico de área: tendencia anual de ingresos. Mismo origen real que DASH-R4. | Parcial |
| DASH-R6 | [L] | Sección "Alertas Importantes": tarjeta amarilla si hay contratos por vencer, roja si hay vencidos, verde "todo en orden" si no. | Completo |
| DASH-R7 | [L] | Sección "Accesos Rápidos" (6 tiles): nuevo contrato, ver contratos, espacios, registro difuntos, cobros, reportes. | Completo |
| DASH-R8 | [N] | Gráfico de capacidad con barra de progreso (total ocupados / total espacios). | Completo |
| DASH-R9 | [M] | El endpoint `GET /dashboard` del backend debe devolver **todos** los datos en una sola llamada, sin que el cliente calcule nada que requiera datos privilegiados. | Pendiente |

### 1.3 Contratos

El módulo más complejo. El controlador legado tiene **39 acciones** (`ContratosController.cs`, ~2300 LOC) que deben mapearse.

#### 1.3.1 Listado y consulta

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| CONTRA-R1 | [L] | Listado paginado de contratos (10 por página en el legado, 15 en el nuevo). Mantener configurable. | Completo |
| CONTRA-R2 | [L] | Búsqueda por número de contrato, nombres y apellidos del difunto, número de identificación. **Debe soportar múltiples palabras** (búsqueda AND palabra-a-palabra como en el legado). | Parcial |
| CONTRA-R3 | [L] | Filtros por estado: `activos`, `porvencer` (vencen en ≤30 días), `vencidos`, `inactivos`. | Pendiente |
| CONTRA-R4 | [L] | Cada fila muestra: número de contrato, difunto, bóveda con bloque/piso, fecha inicio, fecha fin, monto, badge de estado, indicador "Renovación" si aplica. | Parcial |
| CONTRA-R5 | [L] | Acción **ver detalle** que muestra: datos del contrato, datos del difunto, ubicación de la bóveda, propietario, responsables, plan de cuotas, historial de pagos, documentos firmados, contrato relacionado (otro contrato en la misma bóveda). | Parcial |
| CONTRA-R6 | [L] | Acción **editar** los campos limitados: BovedaId, FechaInicio, FechaFin, MontoTotal, Estado, Observaciones (igual al `Bind` legado). | Parcial |
| CONTRA-R7 | [L] | Acción **eliminar (lógica)**: marca `estado=false`. Nunca borrar físicamente — el legado conserva el histórico. | Pendiente |
| CONTRA-R8 | [L] | Acción **renovar** un contrato existente: crea uno nuevo con `esRenovacion=true`, `contratoOrigenId` apuntando al original, `vecesRenovado = vecesRenovado_original + 1`, fechas recalculadas. Validar que `vecesRenovado ≤ Cementerio.VecesRenovacionBovedas` (o `VecesRenovacionNicho` según tipo). | Pendiente |
| CONTRA-R9 | [L] | Acción **relacionar contratos**: dos contratos pueden vincularse cuando comparten bóveda (difuntos distintos enterrados juntos). Endpoint `POST /contratos/relacionar` con `{ contratoIdA, contratoIdB }`. | Pendiente |
| CONTRA-R10 | [L] | Acción **remover relación** entre contratos. | Pendiente |

#### 1.3.2 Wizard de creación (multi-paso)

El legado guarda el modelo intermedio en `HttpContext.Session` (key `NuevoContrato`).
En el nuevo stack se persiste en estado React/`localStorage` o en una colección
temporal por usuario (decisión: **localStorage**, ver §3 del `MIGRATION_PLAN.md`).

Pasos:

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| CONTRA-R11 | [L] | **Paso 1 — Datos del contrato:** selección de bóveda (modal con búsqueda y paginación, filtro por tipo Bóveda/Nicho), fecha de inicio, número de meses, monto total (autocalculado pero editable), descuentos. Al cambiar la bóveda se recargan precio y duración basados en `Cementerio.tarifa_arriendo[_nicho]` y `Cementerio.AniosArriendoBovedas/Nicho`. | Parcial |
| CONTRA-R12 | [L] | **Paso 2 — Datos del difunto:** nombres, apellidos, número de identificación (validar único entre difuntos del mismo año), fechas (nacimiento, defunción), causa, observaciones. Validar `fechaNacimiento < fechaDefuncion`. | Parcial |
| CONTRA-R13 | [L] | **Paso 3 — Responsables:** mínimo 1, máximo N. Por cada responsable: buscar persona existente (autocompletado) **o** registrar nueva. Incluir parentesco. | Parcial |
| CONTRA-R14 | [L] | **Paso 4 — Pago:** plan de cuotas. Permite: pago único (al contado) o plan en N cuotas (mensual/trimestral/semestral/anual) con cálculo automático de fechas de vencimiento. Aplicar descuento si corresponde. | Parcial |
| CONTRA-R15 | [L] | **Paso 5 — Verificación:** mostrar resumen y permitir editar regresando a pasos anteriores sin perder el estado. | Completo |
| CONTRA-R16 | [L] | Botón **Guardar** crea: el contrato, las cuotas, el difunto (si es nuevo), los responsables (si son nuevos), las relaciones `ContratoResponsable`, y devuelve el contrato creado. Toda la operación debe ir en una **transacción Prisma** (`prisma.$transaction`). | Parcial |
| CONTRA-R17 | [L] | El **número secuencial** se asigna automáticamente al guardar siguiendo el formato del legado: `YYYY-NNNN` (año en curso + correlativo de 4 dígitos). El correlativo es global por año, no por bóveda. | Pendiente |
| CONTRA-R18 | [L] | Validación cruzada: la bóveda elegida debe estar disponible **o** permitir uso compartido si el usuario marca "contrato relacionado". | Parcial |

#### 1.3.3 Documentos del contrato

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| CONTRA-R19 | [L] | **Subir documento firmado** (PDF escaneado del contrato). Se guarda en `wwwroot/documentos/contratos/{id}/` en el legado. En el nuevo stack: directorio configurable (`STORAGE_PATH` env) o S3-compatible. Se persiste el path en `Contrato.pathDocumentoFirmado`. | Pendiente |
| CONTRA-R20 | [L] | **Generar PDF oficial del contrato** con el contenido reglamentario (cláusulas, datos del difunto, bóveda, responsables, plan de pagos, firmas). El legado usa **QuestPDF + Rotativa**; el nuevo stack usa **`pdfkit`** (`frontend/src/lib/contrato-pdf.ts`). | Parcial |
| CONTRA-R21 | [L] | **Imprimir recibo** de un contrato (pago al contado): documento aparte, más corto. | Pendiente |
| CONTRA-R22 | [N] | Permitir descargar el PDF sin abrir el navegador del archivo (header `Content-Disposition: attachment`). | Pendiente |

#### 1.3.4 Endpoints de soporte del wizard

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| CONTRA-R23 | [L] | `GET /contratos/create-metadata` → descuentos, bancos, tipos de pago. | Completo |
| CONTRA-R24 | [L] | `GET /contratos/bovedas-disponibles?search=&tipo=&page=` → bóvedas libres paginadas. | Completo |
| CONTRA-R25 | [L] | `GET /contratos/numero-secuencial` → siguiente correlativo a usar. | Completo |
| CONTRA-R26 | [L] | `GET /contratos/buscar-responsable?term=` → personas que coinciden con el término (autocompletado). | Pendiente |
| CONTRA-R27 | [L] | `POST /contratos/buscar-relacionables` → contratos candidatos para relacionar a uno dado (mismo difunto en bóveda compartida, mismo periodo, etc.). | Pendiente |

### 1.4 Bóvedas y Bloques

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| BOV-R1 | [L] | Listado paginado con búsqueda por número, propietario y filtros por estado (disponible/ocupada). | Completo |
| BOV-R2 | [L] | Crear bóveda con: número, capacidad, tipo (`Bóveda`/`Nicho`), precio, precio de arrendamiento, bloque, piso, observaciones. | Parcial |
| BOV-R3 | [L] | Editar bóveda, incluyendo cambiar propietario (modal de búsqueda en `_BuscarPropietarioModal.cshtml`). | Pendiente |
| BOV-R4 | [L] | Asociar bóveda a un **propietario** (Persona → Propietario). | Pendiente |
| BOV-R5 | [L] | Eliminar bóveda (lógica) sólo si no tiene contratos activos. | Pendiente |
| BOV-R6 | [L] | Endpoint `GET /bovedas/contratos-en-boveda/:id` → contratos históricos de esa bóveda. | Pendiente |
| BLO-R1 | [L] | Listado de bloques con número de bóvedas por bloque y cementerio asociado. | Completo |
| BLO-R2 | [L] | Crear bloque con nombre, descripción, cementerio. Al crear el bloque se generan automáticamente los pisos según el campo "número de pisos" del formulario. | Parcial |
| BLO-R3 | [L] | Editar y eliminar bloque (lógica). | Pendiente |
| BLO-R4 | [L] | Detalle del bloque mostrando pisos y bóvedas con su estado. | Pendiente |

### 1.5 Personas, Propietarios y Responsables

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| PER-R1 | [L] | CRUD de personas. Identificación única por `(tipoIdentificacion, numeroIdentificacion)`. | Parcial |
| PER-R2 | [L] | Búsqueda autocompletado por nombre/cédula. | Pendiente |
| PER-R3 | [L] | Detalle muestra: datos personales, contratos en los que participa (como responsable o propietario), bóvedas propias, historial de pagos. | Pendiente |
| PER-R4 | [L] | Una persona puede ser simultáneamente **Propietario** (dueño de bóveda) y **Responsable** (en uno o más contratos). | Completo |
| PER-R5 | [L] | Datos no modificables tras creación: `tipoIdentificacion`, `numeroIdentificacion` (clave de negocio). Sólo el rol `Administrador` puede editarlos. | Pendiente |
| PROP-R1 | [L] | Modal `_CrearPropietarioModal` para crear propietario desde la pantalla de bóveda — debe migrarse como modal React. | Pendiente |

### 1.6 Difuntos

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| DIF-R1 | [L] | Listado paginado con filtros: número de identificación, nombres, apellidos, bóveda donde reposa. | Parcial |
| DIF-R2 | [L] | Crear difunto vinculado obligatoriamente a una bóveda. | Pendiente |
| DIF-R3 | [L] | Editar / eliminar difunto. Eliminación lógica, nunca destructiva si hay contrato asociado. | Pendiente |
| DIF-R4 | [L] | Validar `fechaNacimiento < fechaDefuncion`. | Pendiente |
| DIF-R5 | [N] | Calcular y mostrar **edad al fallecer** en la vista de detalle (no en la tabla). | Parcial |

### 1.7 Cobros y Pagos

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| COB-R1 | [L] | Listado de contratos con cuotas pendientes (filtrar por número, nombre, identificación). | Parcial |
| COB-R2 | [L] | Pantalla **Cobrar**: muestra todas las cuotas del contrato; el operador marca las cuotas a pagar; el sistema suma total; permite aplicar descuento configurado. | Pendiente |
| COB-R3 | [L] | Métodos de pago: Efectivo, Tarjeta débito, Tarjeta crédito, Transferencia bancaria, Cheque. Para transferencia/cheque: banco (`Banco` table) y referencia. | Pendiente |
| COB-R4 | [L] | Al registrar pago: crea `Pago` con `numeroRecibo` autoincremental por año (`YYYY-NNNN`), crea filas `CuotaPago` para cada cuota cubierta, marca `Cuota.pagada=true` y `Cuota.fechaPago=now`. Operación transaccional. | Pendiente |
| COB-R5 | [L] | Recargo por mora: calculado automáticamente. Tasa configurable a nivel de cementerio (campo nuevo `tasaMoraDiaria` — agregar en migración). | [M] Pendiente |
| COB-R6 | [L] | Generar **factura/recibo PDF** del pago con la información del contrato, cuotas pagadas y total. Legado: `FacturaPagoPdfDocument.cs`. | Pendiente |
| COB-R7 | [L] | Reimprimir factura desde el detalle del pago. | Pendiente |
| COB-R8 | [N] | Anular pago (sólo `Administrador`): marca `Pago.estado=false` y revierte `Cuota.pagada` de cada cuota involucrada. | Pendiente |

### 1.8 Reportes

Cinco reportes principales en el legado (`ReportesController.cs`), todos con UI y PDF.

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| REP-R1 | [L] | **Resumen general** (`/reportes`): dashboards consolidados con filtro de fechas. | Parcial |
| REP-R2 | [L] | **Ingresos por fecha** (`/reportes/ingresos?desde=&hasta=`): tabla de pagos con totales, agrupado por método de pago. Export PDF. | Parcial |
| REP-R3 | [L] | **Cuentas por cobrar** (`/reportes/cuentas-por-cobrar`): listado de cuotas vencidas con días de mora, monto deuda, contacto. Export PDF. | Parcial |
| REP-R4 | [L] | **Reporte de bóvedas** (`/reportes/bovedas?tipoBloque=&nombreBloque=`): inventario filtrado con estado, propietario, contrato vigente. Export PDF. | Pendiente |
| REP-R5 | [L] | **Reporte por bloque**: ocupación por bloque, porcentaje, próximas liberaciones. | Pendiente |
| REP-R6 | [M] | Exportar a **Excel** además de PDF (usar la librería `xlsx` ya presente en el backend). | Pendiente |
| REP-R7 | [N] | Comparativa mensual: gráfico interanual mes-a-mes (último año vs año anterior). | Pendiente |
| REP-R8 | [M] | Todos los reportes deben aceptar parámetros vía query string para que sean **deep-linkables**. | Pendiente |

### 1.9 Administración (área `Admin`)

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| ADM-R1 | [L] | CRUD de usuarios: `Index`, `Create`, `Edit`, `Delete`, `ResetPassword`. | Parcial |
| ADM-R2 | [L] | Asignación de uno o varios roles a un usuario. | Pendiente |
| ADM-R3 | [L] | CRUD de roles: `Index`, `Create`, `Edit`, `Delete`, `UsersInRole`. | Pendiente |
| ADM-R4 | [L] | Reset de contraseña fuerza al usuario a cambiarla en el siguiente login (`mustChangePassword=true`). | Pendiente |
| ADM-R5 | [L] | El usuario `admin@teobu.com` no se puede eliminar ni perder el rol `Administrador`. | Pendiente |
| ADM-R6 | [N] | **Auditoría visible**: en el detalle de cada entidad mostrar `usuarioCreador`, `fechaCreacion`, `usuarioActualizador`, `fechaActualizacion`. Los campos ya existen en el esquema; falta exponerlos en UI. | Pendiente |

### 1.10 Configuración del cementerio

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| CFG-R1 | [L] | Pantalla `/cementerio` o `/configuracion`: edita la fila de `Cementerio` (sólo hay una). Campos: nombre, dirección, email, teléfono, abreviatura del título del presidente, presidente, `VecesRenovacionBovedas`, `VecesRenovacionNicho`, `AniosArriendoBovedas`, `AniosArriendoNicho`, `tarifa_arriendo`, `tarifa_arriendo_nicho`, `EntidadFinanciera`, `NombreEntidadFinanciera`, `NumeroCuenta`. | Pendiente |
| CFG-R2 | [L] | Pantalla **GAD**: edita la fila de `GADInformacion` (nombre, dirección, teléfono, email, `LogoUrl`, `Website`, `Mision`, `Vision`). | Pendiente |
| CFG-R3 | [L] | CRUD de **Descuentos**. | Pendiente |
| CFG-R4 | [L] | CRUD de **Bancos**. | Pendiente |
| CFG-R5 | [M] | Campos del cementerio agregados al esquema y seed: `tarifaArriendo`, `tarifaArriendoNicho`, `vecesRenovacionBovedas`, `vecesRenovacionNicho`, `aniosArriendoBovedas`, `aniosArriendoNicho`, `entidadFinanciera`, `nombreEntidadFinanciera`, `numeroCuenta`, `abreviaturaTituloPresidente`, `presidente`, `tasaMoraDiaria`. Migración: `20260513172915_completar_modelo_legado`. | **Completo** |

### 1.11 Notificaciones (`Notify`)

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| NOT-R1 | [L] | Dropdown en el header con notificaciones del usuario. Vacío por defecto. | Parcial |
| NOT-R2 | [L] | Página `/notify` lista todas las notificaciones. | Pendiente |
| NOT-R3 | [N] | Generar notificaciones automáticas para:<br>– contratos por vencer en 30 días<br>– cuotas vencidas no pagadas<br>– pagos registrados<br>El backend expone `GET /notify` y `POST /notify/:id/marcar-leida`. | Pendiente |
| NOT-R4 | [N] | Job programado (NestJS `@Cron('0 7 * * *')`) que genera las notificaciones diarias y envía email a responsables si el cementerio tiene SMTP configurado. | Pendiente |

### 1.12 Manual de usuario

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| MAN-R1 | [L] | Link en sidebar "Manual de Usuario" abre el PDF estático. En el legado vive en `wwwroot/Manual_de_Usuario.pdf`. En Next.js: `frontend/public/Manual_de_Usuario.pdf` o ruta `/manual`. | Pendiente |
| MAN-R2 | [M] | Como alternativa, generar el manual desde el markdown `Manual_Usuario_Sistema_Cementerio.md` y servir la versión HTML navegable en `/manual`. | Parcial |

### 1.13 Migración de datos legados

| ID | Tag | Descripción | Estado |
|----|-----|-------------|--------|
| MIG-R1 | [L] | El backend Nest debe ejecutar la **migración del catastro** desde `CATASTRO_FINAL.xlsx` (existe `CatastroMigrationService.cs` legado, 681 LOC). El nuevo equivalente es `backend/src/bootstrap/catastro-import.service.ts`. | Parcial |
| MIG-R2 | [L] | El proceso debe ser idempotente: si el archivo ya fue migrado (renombrado con timestamp), no re-importar. | Parcial |
| MIG-R3 | [L] | El proceso crea: Bloques → Pisos → Bóvedas → Personas (propietarios + responsables) → Difuntos → Contratos → Cuotas iniciales. | Parcial |
| MIG-R4 | [L] | Reporte de la importación: total de cada entidad creada, errores por fila. | Pendiente |
| MIG-R5 | [M] | Importación on-demand desde el menú **Configuración → Importar catastro** (sólo `Administrador`). Permite cargar Excel desde la UI sin reiniciar el servidor. | Pendiente |
| MIG-R6 | [N] | **Migración de datos desde SQL Server (legado en producción)** a PostgreSQL. Producir un script `scripts/migrate-sqlserver-to-postgres.ts` que:<br>1. Lee la BD de origen (cadena configurable).<br>2. Mapea las tablas (incluye renombres `tarifa_arriendo` → `tarifaArriendo`, etc.).<br>3. Inserta en orden topológico respetando FKs.<br>4. Genera un reporte con conteos antes/después. | Pendiente |

---

## 2. Modelo de datos — paridad y mejoras

### 2.1 Entidades existentes en el legado

Lista canónica (ver `Models/*.cs`):

```
Usuario (Identity ApplicationUser)
Rol (IdentityRole)
UsuarioRol (AspNetUserRoles)
Cementerio
GADInformacion
Bloque
Piso
Boveda
Persona
Propietario       (Persona especializada)
Responsable       (Persona especializada)
Difunto
Contrato
ContratoResponsable
Cuota
Pago
CuotaPago
Descuento
Banco
Notificacion      (existe en legado, falta migrar)
DocumentoFirmado  (path en wwwroot/documentos/contratos/...)
```

### 2.2 Brechas de esquema — **cerradas**

Originalmente detectadas como pendientes; **resueltas en la migración
`20260513172915_completar_modelo_legado`** (Fase 0).

| Entidad | Campos añadidos | Origen | Estado |
|---------|-----------------|--------|--------|
| `Cementerio` | `abreviaturaTituloPresidente`, `presidente`, `vecesRenovacionNicho`, `vecesRenovacionBovedas`, `aniosArriendoNicho`, `aniosArriendoBovedas`, `tarifaArriendo`, `tarifaArriendoNicho`, `entidadFinanciera`, `nombreEntidadFinanciera`, `numeroCuenta`, `tasaMoraDiaria`, `fechaActualizacion`, `fechaEliminacion` | `CementerioModel.cs` | **Completo** |
| `Contrato` | `descuentoId` (FK), `montoSubtotal`, `montoDescuento`, `fechaEliminacion` | Lógica de cobro legada | **Completo** |
| `Pago` | `descuentoId` (FK), `montoSubtotal`, `montoDescuento`, `fechaCreacion`, `fechaActualizacion`, `fechaEliminacion`, auditoría completa | Cobros con descuento + paridad de auditoría | **Completo** |
| `Notificacion` | tabla creada: `id`, `usuarioId`, `tipo`, `titulo`, `mensaje`, `entidadTipo`, `entidadId`, `leida`, `fechaLectura`, `fechaCreacion` | `NotifyController.cs` | **Completo** (esquema) |
| `Documento` | tabla creada: `id`, `contratoId`, `storageKey`, `nombreOriginal`, `mimeType`, `tamanioBytes`, `tipo`, `subidoPorId`, `fechaCreacion` | `DocumentoViewModel.cs` | **Completo** (esquema) |
| `Persona` | `estadoCivil`, `profesion`, `nacionalidad`, auditoría completa (`fechaActualizacion`, `fechaEliminacion`, `usuarioActualizadorId`, `usuarioEliminadorId`) | `PersonaModel.cs` | **Completo** |
| `Difunto` | `nacionalidad`, `estadoCivil`, `lugarNacimiento`, `lugarDefuncion`, `nombreConyuge`, `nombrePadre`, `nombreMadre`, `numeroCertificadoDefuncion`, `entidadEmisora`, `fechaEmisionCertificado` | Manual de usuario §5 | **Completo** |
| `GADInformacion` | `logoUrl`, `website`, `mision`, `vision`, `fechaCreacion`, `fechaActualizacion`, auditoría | Vista institucional / encabezados PDF | **Completo** |
| `Banco` | `fechaCreacion` | Trazabilidad | **Completo** |
| `Usuario` | `mustChangePassword` | Preparación reset de contraseña (Fase 1) | **Completo** |

### 2.3 Reglas de negocio críticas a preservar

1. **Eliminación lógica:** ninguna entidad de dominio se borra físicamente; sólo
   se marca `estado=false` y se llena `usuarioEliminadorId`/`fechaEliminacion`.
2. **Auditoría obligatoria:** todas las escrituras llenan `usuarioCreadorId` o
   `usuarioActualizadorId` (interceptor Nest + middleware Prisma).
3. **Una bóveda puede tener varios contratos a lo largo del tiempo**, pero
   sólo uno con `estado=true && fechaFin >= today` salvo que estén
   **relacionados** (campo `contratoRelacionadoId`).
4. **Renovaciones encadenadas**: `vecesRenovado` cuenta cuántas renovaciones
   ha tenido el contrato original; nunca debe superar
   `Cementerio.VecesRenovacionBovedas` (o `VecesRenovacionNicho`).
5. **Numeración secuencial reinicia cada año** (contratos y recibos de pago).
6. **Una cuota puede tener múltiples pagos** (pago parcial); su `pagada=true`
   sólo cuando la suma de pagos cubre el `monto + intereses`.

---

## 3. Requerimientos no funcionales

### 3.1 Stack tecnológico (decidido)

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Backend | **NestJS 11** + Prisma 6 + PostgreSQL 14+ | Ya iniciado en `new-migration/backend`. |
| Frontend | **Next.js 15** (App Router) + React 19 + Tailwind preparado + Bootstrap (Able Pro template) | Ya iniciado en `new-migration/frontend`. Ver `DESIGN.md`. |
| Auth | JWT (bearer en frontend; `@nestjs/jwt` en backend) + bcrypt para hash | Equivalente funcional a Identity legado. |
| Cache | `localStorage` para wizards multi-paso; `@tanstack/react-query` para datos remotos | React Query ya en `package.json`. |
| PDF | `pdfkit` (Node) en el backend o en route handlers de Next | Reemplaza QuestPDF/Rotativa. |
| Excel | `xlsx` (ya en backend) | Lectura del catastro + export de reportes. |
| Email | `nodemailer` con SMTP configurable | Reemplaza `EmailSender` legado. |
| Runtime | `bun` (preferido) o `node 20+` | Definido en `bun.lock`. |

### 3.2 Rendimiento

- **Listados:** todas las consultas deben paginar (`page` + `limit`, default 15)
  y soportar `search`. Nunca exponer endpoints "trae todo".
- **N+1:** Prisma con `include` selectivos. Para queries de detalle se usa
  proyección manual cuando hay más de 3 niveles.
- **Tiempo de respuesta:** P95 ≤ 400 ms para listados de 15 items en datos de
  hasta 50 k filas; P95 ≤ 1.5 s para generación de PDF de contrato.
- **Frontend:** TTI ≤ 2 s en 4G; bundle `<` 250 kB JS inicial gzip (excluyendo
  Bootstrap/Tabler que vienen estáticos).

### 3.3 Seguridad

- Contraseñas: bcrypt cost ≥ 10.
- JWT: secreto desde variable de entorno (`JWT_SECRET`), expiración 7 d.
- CSRF: API stateless con bearer → no aplica para JSON; **sí** aplica para
  formularios server-rendered de Next (configurar tokens si se introducen).
- CORS: solo orígenes definidos en `FRONTEND_URL`.
- Cabeceras: `helmet` activado en `main.ts`.
- Validación: **todos** los DTO con `class-validator`; rechazar campos no
  declarados (`whitelist: true, forbidNonWhitelisted: true`).
- Inyección SQL: 100 % vía Prisma. Cualquier `prisma.$queryRawUnsafe` debe ser
  revisado en PR.
- Datos sensibles: ninguno (no se manejan tarjetas, sólo método de pago como
  texto). Email y teléfono no se cifran.
- Auditoría: cada operación de escritura registra usuario y timestamp (§2.3).
- Eliminación lógica preserva trazabilidad.

### 3.4 Disponibilidad y operación

- Deploy: Docker Compose (`docker-compose.yml` ya presente). Servicios:
  `postgres`, `backend`, `frontend`, `nginx` opcional.
- Healthchecks:
  - Backend: `GET /health` (DB + memoria + uptime).
  - Frontend: `GET /` con timeout 3 s.
- Backups DB: cron diario, retención 30 d (script externo, no parte del app).
- Logs: stdout estructurado JSON. En producción enviar a Loki/CloudWatch.
- Migraciones Prisma: ejecutan en el arranque del contenedor backend
  (`bun prisma migrate deploy`); fallo bloquea el inicio.

### 3.5 Accesibilidad

- Nivel **WCAG 2.1 AA** como objetivo.
- `lang="es"` en `<html>` (ya cumplido).
- Contraste mínimo 4.5:1 para texto regular.
- Navegación por teclado completa en menús, modales y wizards.
- `aria-label` en triggers icónicos (botones del header, acciones de tabla).
- Mensajes de error de formulario asociados al input con `aria-describedby`.
- Spinners con `role="status"` y `aria-live="polite"`.

### 3.6 Internacionalización

- Único idioma: **es-EC** en UI.
- Formato numérico: USD `$1,234.56` (`Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`).
- Fechas en UI: `dd/MM/yyyy` para tabla, `d 'de' MMMM 'de' yyyy` para PDF.
- API: fechas en ISO 8601 UTC; conversión a Guayaquil en el cliente.

### 3.7 Compatibilidad

- Navegadores: Chrome/Edge/Firefox/Safari últimas 2 versiones. **No** se
  soporta IE.
- Resoluciones: ≥ 320 px (móvil) hasta 1920 px. Layout responsive (`DESIGN.md`).
- Impresión: hojas A4 verticales para contrato; A4 horizontal para reporte de
  bóvedas y cuentas por cobrar.

### 3.8 Calidad de código

- **TypeScript estricto** (`strict: true`).
- Validación de DTO con `class-validator` en backend y `zod` en frontend
  (frontera HTTP).
- **Sin estado global del lado backend** (sin singletons mutables fuera del
  contexto Nest).
- Lint: ESLint con preset `@nestjs` (backend) y `next/core-web-vitals` (frontend).
- Tests:
  - Unitarios para servicios con lógica no-trivial (cálculo de cuotas,
    numeración, mora).
  - Integración para los 5 reportes (validar consistencia matemática).
  - E2E (Playwright) opcional para wizard de contratos en CI.
- Cobertura mínima objetivo: 60 % en `backend/src/modules/*/`.

### 3.9 Documentación

- **Swagger** disponible en `/api/docs` (ya configurado).
- README por módulo cuando la lógica supere las 200 LOC.
- **Este documento** + `DESIGN.md` + `ARCHITECTURE.md` + `MIGRATION_PLAN.md`
  + `CLAUDE.md` se mantienen actualizados con cada PR que cambie un
  comportamiento descrito.

---

## 4. Criterios de aceptación globales

La migración se considera **terminada** cuando:

1. Todos los requerimientos `[L]` del listado anterior están en estado
   `Completo`.
2. Existe un set de datos de prueba (`scripts/seed-dev.ts`) con ≥ 3 cementerios,
   10 bloques, 100 bóvedas, 50 personas, 30 contratos.
3. La migración desde `CATASTRO_FINAL.xlsx` corre limpia y produce los mismos
   conteos que el legado.
4. Hay paridad visual y funcional con las pantallas listadas en §1 (validación
   manual sobre el legado en ejecución vs el nuevo sistema).
5. Los 5 reportes generan PDFs equivalentes (mismas columnas, mismos totales).
6. Swagger expone todos los endpoints listados en §1.
7. CI verde: lint + tests + build frontend + build backend.
8. `MIGRATION_STATUS.md` actualizado con la matriz en `Completo` para todos los
   módulos.

---

## 5. Glosario

| Término | Definición |
|---------|-----------|
| **Cementerio** | Entidad raíz, suele haber una sola. |
| **Bloque** | Sector físico del cementerio. Contiene pisos. |
| **Piso** | Nivel dentro de un bloque. Contiene bóvedas/nichos. |
| **Bóveda** | Espacio físico individual donde se inhuma. Puede ser bóveda o nicho según `tipo`. |
| **Difunto** | Persona inhumada. Pertenece a una bóveda. |
| **Persona** | Registro de un individuo (vivo) que puede ser propietario, responsable o ambos. |
| **Propietario** | Persona dueña de una bóveda. Una bóveda tiene ≤ 1 propietario activo. |
| **Responsable** | Persona vinculada a un contrato; recibe notificaciones de cobro. |
| **Contrato** | Documento de arrendamiento de una bóveda por un periodo. |
| **Renovación** | Contrato derivado de uno previo (`esRenovacion=true`, `contratoOrigenId`). |
| **Contrato relacionado** | Vínculo lateral entre dos contratos que comparten una bóveda con difuntos distintos. |
| **Cuota** | Pago programado dentro de un contrato. |
| **Pago** | Transacción que cubre una o más cuotas. Tiene `numeroRecibo` único anual. |
| **Catastro** | Inventario inicial del cementerio (Excel del legado). |
