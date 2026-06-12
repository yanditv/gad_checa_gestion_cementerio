# Requerimientos Mínimos Funcionales — TDR GAD Parroquial El Valle

> **Origen:** `TDR_Sistema_Informatico_v3 (1).pdf` — *Términos de Referencia para
> la contratación del servicio de desarrollo e implementación de sistemas de
> gestión administrativa para el GAD Parroquial El Valle (Cuenca)*.
>
> **Relación con este repositorio:** el sistema de gestión de cementerio
> desarrollado para el **GAD Checa** (`new-migration/`) cubre la mayor parte del
> alcance del TDR de El Valle. Este documento define los **requerimientos mínimos
> funcionales** que exige el TDR y marca, para cada uno, si ya está cubierto por la
> migración de Checa o si constituye una **brecha nueva** a construir.
>
> Documento base para la oferta técnica y el control de alcance del contrato.
> Para la matriz funcional detallada del cementerio ver `REQUIREMENTS.md`.

---

## Convenciones

- **`[TDR §x]`** — cláusula del TDR que origina el requerimiento.
- **Cobertura** respecto al sistema actual (Checa):
  - **🆕** funcionalidad nueva, no existe en la migración.
  - **⚠️** existe parcialmente o requiere extensión para cumplir el TDR.
  - **✅** ya cubierto.

---

## 0. Alcance del TDR

- **Cliente:** GAD Parroquial Rural de El Valle (Cuenca, Ecuador).
- **Producto:** plataforma web modular de gestión administrativa, **on-premise**.
- **Plazo de ejecución:** 30 días (§6).
- **Módulos mínimos obligatorios (§4.2):** cuatro, completamente integrados.
- **Decisiones de alcance fijadas con el cliente (2026-06-09):**
  - La **inhumación** (sepultar) se registra de forma implícita vía
    Difunto/Contrato, como en Checa, apoyada en el campo `Difunto.fechaInhumacion`
    ya existente en la migración. **No** se crea una entidad separada para el
    ingreso.
  - La **exhumación/traslado** (retiro de restos) **sí** debe registrarse como
    acto administrativo (acta, fecha, motivo, autorización) porque libera la
    plaza y deja constancia auditable. Es una **brecha** respecto a Checa
    (ver CAT-R4b…R4d). Se resuelve como extensión acotada del Difunto, no como
    módulo nuevo.
  - La **depreciación de activos fijos** usa el método de **línea recta** con
    valor residual y vidas útiles según **Norma de Control Interno CGE 406-03**.

---

## 1. Módulo 1 — Inventario de Bienes Institucionales `[TDR §4.2-M1]`

**Cobertura global: 🆕 módulo nuevo completo.** No existe en la migración de Checa;
es el grueso del trabajo del contrato. Anclado a CGE Norma 406-01 (Propiedad,
Planta y Equipo) y 406-03 (depreciación).

| ID | Tag | Descripción | Cobertura |
|----|-----|-------------|-----------|
| INV-R1 | [TDR §4.2] | Registro de bien con: código/placa, descripción, marca, modelo, serie, fecha de adquisición, valor de adquisición, fuente de financiamiento, estado de conservación (bueno/regular/malo). | 🆕 |
| INV-R2 | [TDR §4.2] | Catálogo configurable de **categorías y clases de activo** (mueble, equipo informático, vehículo, etc.) con alta/baja lógica, vida útil y % de depreciación por defecto por categoría (tabla CGE 406-03). | 🆕 |
| INV-R3 | [TDR §4.2] | **Control de custodios y responsables**: asignación de un bien a un custodio (funcionario) con fecha de asignación e **historial de reasignaciones**. | 🆕 |
| INV-R4 | [TDR §4.2] | **Ubicación física**: registro y cambio de ubicación (dependencia/oficina) con historial. | 🆕 |
| INV-R5 | [TDR §4.2] | **Alta de bien**: incorporación al inventario con documento/acta de respaldo. | 🆕 |
| INV-R6 | [TDR §4.2] | **Baja de bien**: registro de baja (obsolescencia, robo, venta, donación) con motivo, fecha, documento de respaldo y autorización. **Baja lógica**, nunca borrado físico (regla §2.1 de `CLAUDE.md`). | 🆕 |
| INV-R7 | [TDR §4.2 / §10.1] | **Depreciación de activos fijos** por **línea recta CGE 406-03**: valor residual y vida útil por categoría; cálculo de depreciación acumulada y **valor en libros** a una fecha de corte; recálculo masivo por periodo. Los cálculos deben mantenerse precisos y alineados con la configuración inicial aprobada (garantía §10.1). | 🆕 |
| INV-R8 | [TDR §4.2] | **Historial completo de movimientos por bien**: cronología unificada de alta, reasignaciones de custodio, cambios de ubicación, depreciaciones y baja. | 🆕 |
| INV-R9 | [TDR §4.2] | Listado paginado de bienes con búsqueda (código, descripción, serie) y filtros (categoría, custodio, ubicación, estado activo/dado de baja). Paginación obligatoria (default 15, cap 100). | 🆕 |
| INV-R10 | [TDR §4.2 / §4.2-M4] | Reportes del módulo: inventario por custodio, por ubicación y por categoría; reporte de depreciación; acta de entrega-recepción de bienes. Export **PDF/XLSX/CSV**. | 🆕 |

**Reglas de negocio**

- Toda escritura es auditada (`usuarioCreador/Actualizador/Eliminador`) y la
  eliminación es lógica, conforme a las reglas de dominio del proyecto.
- La depreciación no altera el valor de adquisición histórico; se calcula y
  almacena como saldos derivados a fecha de corte.

---

## 2. Módulo 2 — Catastro del Cementerio Parroquial `[TDR §4.2-M2]`

**Cobertura global: ✅ mayormente cubierto por la migración de Checa; ⚠️ falta el registro de exhumación/traslado (CAT-R4b…R4d).**

| ID | Tag | Descripción | Cobertura |
|----|-----|-------------|-----------|
| CAT-R1 | [TDR §4.2] | Registro digital de bóvedas, nichos y espacios funerarios con control de disponibilidad. | ✅ (§1.4 `REQUIREMENTS.md`) |
| CAT-R2 | [TDR §4.2] | Administración de titulares, responsables y beneficiarios. | ✅ (§1.5) |
| CAT-R3 | [TDR §4.2] | Gestión de **arriendos, renovaciones e historial de ocupación**. | ⚠️ — Contratos (§1.3) cubierto; renovación (`CONTRA-R8`) y relación de contratos (`CONTRA-R9/R10`) aún Pendiente. |
| CAT-R4a | [TDR §4.2 / §5] | **Inhumación** (registro del sepelio): cubierto implícitamente vía Difunto + Contrato, con `Difunto.fechaInhumacion` (campo ya existente) y datos del certificado de defunción. | ✅ (Difuntos §1.6) |
| CAT-R4b | [TDR §4.2 / §5] | **Registro de exhumación/traslado** sobre un difunto ya inhumado: `fechaExhumacion`, **motivo** (vencimiento de arriendo / traslado a otro cementerio / orden judicial / a osario común), **destino** de los restos, número/entidad de **autorización**, y observaciones. Escritura **auditada** (usuario, fecha) y **lógica** (no borra al difunto; lo marca como exhumado). | 🆕 |
| CAT-R4c | [TDR §4.2] | **Efecto sobre la plaza**: al registrar la exhumación, la bóveda/nicho queda **disponible** nuevamente y el difunto deja de contar como ocupante activo. | 🆕 |
| CAT-R4d | [TDR §4.2 / §4.2-M4] | **Acta/reporte de exhumación** exportable (PDF) y consulta del **historial de exhumaciones** por bóveda y por periodo. | 🆕 |
| CAT-R5 | [TDR §4.2] | Consultas y reportes operativos del catastro. | ⚠️ (Reportes §1.8 parcialmente Pendiente) |

---

## 3. Módulo 3 — Seguridad y Administración del Sistema `[TDR §4.2-M3, §4.3]`

**Cobertura global: ✅ cubierto, con una extensión menor de auditoría.**

| ID | Tag | Descripción | Cobertura |
|----|-----|-------------|-----------|
| SEG-R1 | [TDR §4.2] | Gestión de usuarios, roles y permisos diferenciados por perfil. | ✅ (Auth §1.1 + Admin §1.9) |
| SEG-R2 | [TDR §4.2] | **Registro de auditoría con trazabilidad** de accesos, modificaciones y eventos del sistema. | ⚠️ — la migración audita escrituras; el TDR pide además trazar **accesos y eventos** (login, acciones sensibles). Extensión requerida. |
| SEG-R3 | [TDR §4.2] | Administración centralizada de sesiones y credenciales. | ✅ (JWT + cookie httpOnly) |
| SEG-R4 | [TDR §4.3] | Autenticación con **cifrado de contraseñas** y protección frente a vulnerabilidades web habituales (OWASP). | ✅ (hash de password; DTOs validados, rechazo de propiedades no declaradas) |
| SEG-R5 | [TDR §4.3] | Respaldo automático de información y procedimientos documentados de recuperación ante fallos. | ⚠️ — operativo/infra; debe documentarse (entregable §6 nº6). |

---

## 4. Módulo 4 — Reportes y Exportación de Información `[TDR §4.2-M4]`

**Cobertura global: ⚠️ parcial.**

| ID | Tag | Descripción | Cobertura |
|----|-----|-------------|-----------|
| REP-R1 | [TDR §4.2] | Reportes administrativos, históricos y operativos de **ambos** dominios (bienes + cementerio). | ⚠️ — cementerio cubierto (§1.8); faltan reportes del módulo de bienes (INV-R10). |
| REP-R2 | [TDR §4.2] | **Exportación en PDF, Excel (XLSX) y CSV** — los tres formatos son obligatorios. | ⚠️ — verificar que cada reporte exporte los tres, no solo PDF. |
| REP-R3 | [TDR §4.2] | Consultas consolidadas para control administrativo y auditoría interna. | ⚠️ |

---

## 5. Requerimientos transversales mínimos `[TDR §4.1, §4.4]`

| ID | Tag | Descripción | Cobertura |
|----|-----|-------------|-----------|
| GEN-R1 | [TDR §4.1] | Plataforma **web** compatible con navegadores modernos (Chrome/Firefox/Edge). | ✅ |
| GEN-R2 | [TDR §4.1, §4.4] | **On-premise**: opera 100 % en la infraestructura local del GAD, sin nube ni suscripciones de terceros. Despliegue autocontenido (Docker local). | ⚠️ — el stack lo permite; el empaquetado de despliegue local es entregable. |
| GEN-R3 | [TDR §4.1] | Interfaz en **español**, navegación para personal administrativo no técnico. | ✅ |
| GEN-R4 | [TDR §4.1] | **Arquitectura modular** que permita incorporar módulos futuros sin afectar la operación existente. | ✅ (módulos NestJS / App Router) |
| GEN-R5 | [TDR §4.1] | **BD relacional con integridad referencial**, capacidad de crecimiento y respaldo automático. | ✅ (PostgreSQL + Prisma) |
| GEN-R6 | [TDR §4.1] | **Entornos separados** de desarrollo, pruebas y producción. | ⚠️ — definir y documentar en despliegue. |
| GEN-R7 | [TDR §4.4] | **Soberanía de datos**: entrega de la BD completa exportable (SQL/CSV/Excel) y del **código fuente documentado**; el GAD es propietario exclusivo y con acceso administrativo total. | ⚠️ — obligación de entrega final. |
| GEN-R8 | [TDR §6, §10] | **Migración de datos**: inventario de bienes y catastro existentes, cargados y **verificados** por el contratista (el GAD no carga datos). | ⚠️ — incluye el relevamiento físico de bienes (Semana 1–2). |

---

## 6. Restricciones contractuales que condicionan el "mínimo"

No son requerimientos funcionales, pero el sistema y el servicio deben permitirlos:

- **SLA de soporte (§10.2):** crítica → respuesta 4 h / solución 24 h; mayor →
  24 h / 48 h; consulta de operación → 72 h.
- **Garantía técnica 24 meses (§11):** corrección de bugs sin costo y exactitud
  garantizada de los cálculos de **depreciación** y de **tasas por servicios
  funerarios**; alineación ante reformas CGE/COOTAD.
- **Entregables obligatorios (§6):** sistema instalado y configurado; datos
  migrados; manual de usuario por módulo; manual técnico e instalación;
  **diccionario de datos**; procedimientos de respaldo; código fuente
  documentado; **8 h de capacitación**; acta de entrega-recepción.
- **Plazo 30 días:** ajustado. La reutilización del catastro de Checa es lo que
  hace viable construir el módulo de Inventario dentro del plazo.

---

## 7. Resumen de la brecha vs. sistema de Checa

| Módulo | Esfuerzo sobre lo existente |
|--------|------------------------------|
| 1 · Inventario de Bienes | **🆕 Construir completo** — 10 RF, incluye depreciación línea recta CGE 406-03. Núcleo del contrato. |
| 2 · Catastro | ✅ Reutilizar Checa; cerrar pendientes de renovación/relación de contratos (CAT-R3) y **añadir registro de exhumación/traslado** como extensión del Difunto (CAT-R4b…R4d). |
| 3 · Seguridad | ✅ Reutilizar; ⚠️ extender auditoría a **accesos/eventos** (SEG-R2). |
| 4 · Reportes | ⚠️ Reutilizar + garantizar **XLSX y CSV** y añadir reportes de bienes (REP-R1/R2). |
| Transversal | ⚠️ Empaquetado **on-premise**, entornos separados, entregables de soberanía. |
