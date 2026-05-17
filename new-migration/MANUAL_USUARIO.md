# Manual de Usuario — Sistema de Gestión del Cementerio

**GAD Parroquial de Checa** · Versión 1.0 · Mayo 2026

---

## 1. Introducción

El Sistema de Gestión del Cementerio permite al GAD Parroquial de Checa
administrar:
- Catastro de bóvedas, nichos y tumbas
- Contratos de arriendo
- Cobranza de cuotas
- Personas, difuntos y responsables
- Reportes operativos y financieros

---

## 2. Acceso al sistema

1. Abrir el navegador en la URL del sistema.
2. Iniciar sesión con su correo electrónico y contraseña.
3. Si olvidó su contraseña, use el enlace **"¿Olvidaste tu contraseña?"**.

### Roles de usuario

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso total: crear/editar/eliminar registros, gestionar usuarios, importar catastro, anular pagos. |
| **Usuario** | Operaciones diarias: crear contratos, registrar pagos, consultar bóvedas y personas. |

---

## 3. Pantalla principal (Dashboard)

Al iniciar sesión verá el **Dashboard** con:
- **Resumen financiero**: ingresos del período actual.
- **Bóvedas disponibles**: conteo por tipo.
- **Contratos activos** y próximos a vencer.
- **Accesos rápidos** a los módulos principales.

---

## 4. Módulos del sistema

### 4.1 Contratos

**Ruta**: `Contratos` en la barra lateral.

El contrato de arriendo es el documento central. Vincula una bóveda,
un difunto y uno o más responsables.

#### 4.1.1 Crear contrato (Wizard)

1. Ir a **Contratos → Nuevo contrato**.
2. **Paso 1 — Bóveda**: seleccionar el bloque y la bóveda disponible.
3. **Paso 2 — Difunto**: ingresar los datos del difunto.
4. **Paso 3 — Responsables**: buscar o crear personas responsables del pago.
5. **Paso 4 — Pago**: seleccionar método de pago, banco, descuento (si aplica).
6. **Confirmar**: revisar el resumen y guardar.

El sistema genera automáticamente:
- Número secuencial del contrato.
- Cuotas mensuales según los años de arriendo configurados.
- Recibo de pago inicial.

#### 4.1.2 Renovar contrato

1. Abrir el detalle del contrato.
2. Clic en **Renovar**.
3. El sistema valida que no exceda el máximo de renovaciones permitidas.
4. Confirmar. Se crea un nuevo contrato vinculado al original.

#### 4.1.3 Listado y búsqueda

- Use la barra de búsqueda para filtrar por número de contrato, difunto o responsable.
- Los contratos vencidos se marcan en rojo.
- Clic en una fila para ver el detalle completo.

---

### 4.2 Cobros

**Ruta**: `Cobros` en la barra lateral.

#### 4.2.1 Realizar un cobro

1. Seleccionar el contrato.
2. El sistema muestra las cuotas pendientes con mora calculada.
3. Marcar las cuotas a pagar.
4. Seleccionar método de pago, banco y descuento.
5. **Cobrar**. El sistema genera el recibo.

#### 4.2.2 Anular un pago (solo Administrador)

1. Ir al detalle del pago.
2. Clic en **Anular**.
3. Confirmar. Las cuotas vuelven a estado pendiente.

---

### 4.3 Bóvedas

**Ruta**: `Bóvedas` en la barra lateral.

- **Listado**: muestra todas las bóvedas activas, filtrables por bloque.
- **Detalle**: historial de contratos, difuntos asociados.
- **Crear**: defina número, capacidad, tipo (bóveda/nicho/tumba), precio y bloque.
- **Cambiar propietario**: desde el detalle de la bóveda.

---

### 4.4 Personas

**Ruta**: `Personas` en la barra lateral.

- **Listado**: todas las personas registradas (propietarios y responsables).
- **Crear**: número de identificación, nombres, apellidos, datos de contacto.
- **Detalle**: bóvedas que posee, contratos donde es responsable, pagos asociados.

---

### 4.5 Difuntos

**Ruta**: `Difuntos` en la barra lateral.

- **Listado**: difuntos registrados, filtrables por bóveda.
- **Crear**: nombres, fecha de nacimiento, fecha de defunción, edad.
- **Editar**: modificar datos del difunto.

---

### 4.6 Bloques

**Ruta**: `Bloques` en la barra lateral.

- Agrupan bóvedas. Un bloque tiene N pisos.
- **Crear bloque**: nombre, cementerio, cantidad de pisos.

---

### 4.7 Reportes

**Ruta**: `Reportes` en la barra lateral.

| Reporte | Descripción |
|---------|-------------|
| **Ingresos** | Pagos en un rango de fechas. Exportable a PDF y Excel. |
| **Cuentas por cobrar** | Cuotas vencidas no pagadas. |
| **Bóvedas** | Estado de ocupación por tipo y bloque. |
| **Bloques** | Ocupación agregada por bloque. |
| **Comparativa mensual** | Ingresos mes a mes del año. |

---

### 4.8 Configuración

**Ruta**: `Configuración` en la barra lateral (solo Administrador).

#### Pestañas:
- **Descuentos**: crear/editar/eliminar tipos de descuento (%).
- **Bancos**: registrar entidades bancarias para pagos.
- **Cementerio**: editar datos del cementerio (nombre, tarifas, años de arriendo, datos bancarios) e información del GAD.

#### Importar catastro
- **Configuración → Importar catastro**: subir un archivo Excel con datos de bóvedas, difuntos y contratos.
- El sistema muestra un resumen con conteos y errores por fila.
- Solo disponible para **Administrador**.

---

### 4.9 Administración (solo Administrador)

#### Usuarios
- **Listado**: todos los usuarios del sistema.
- **Crear/Editar**: datos personales, estado (activo/inactivo).
- **Asignar roles**: Administrador o Usuario.
- **Resetear contraseña**: fuerza un cambio de contraseña.

#### Roles
- **Listado**: roles disponibles.
- **Crear/Editar**: nombre y permisos.

---

### 4.10 Notificaciones

- **Campanita en el header**: badge con conteo de notificaciones no leídas.
- **Página `/notify`**: lista completa de notificaciones.
- El sistema genera notificaciones automáticas para:
  - Contratos por vencer en 30 días.
  - Cuotas vencidas no pagadas.

---

## 5. Flujos comunes

### 5.1 Registrar un nuevo contrato

1. **Persona**: si el responsable no existe, créelo en **Personas → Nueva**.
2. **Difunto**: si el difunto no existe, créelo en **Difuntos → Nuevo**.
3. **Contrato**: use el wizard de **Contratos → Nuevo contrato**.
4. **Cobro**: el pago inicial se registra en el paso 4 del wizard.

### 5.2 Cobrar cuotas mensuales

1. Vaya a **Cobros**.
2. Seleccione el contrato (busque por número o difunto).
3. Revise las cuotas pendientes y marque las que va a pagar.
4. Seleccione método de pago y complete el cobro.

### 5.3 Consultar estado de una bóveda

1. Vaya a **Bóvedas**.
2. Busque por número o bloque.
3. Clic en la bóveda para ver detalle: propietario, contratos activos, difuntos.

---

## 6. Preguntas frecuentes

**¿Puedo borrar un contrato?**
No se borra físicamente. Se marca como inactivo (eliminación lógica). Solo Administrador.

**¿Qué pasa si me equivoco en un cobro?**
Un Administrador puede anular el pago desde el detalle del mismo. Las cuotas vuelven a "pendiente".

**¿Cómo cambio al propietario de una bóveda?**
Desde el detalle de la bóveda, use la opción **Cambiar propietario**.

**¿El sistema envía correos?**
Sí, para recuperación de contraseña y notificaciones de vencimientos (si está configurado el SMTP).
