# Sistema de Diseño — Gestión Cementerio GAD Checa

Documento de referencia del sistema de diseño visual y de interacción del frontend.
Se basa en el código presente en `frontend/src/` y en los activos estáticos de `frontend/public/`.

---

## 1. Fundamento del sistema

El frontend reutiliza la plantilla **Able Pro – Bootstrap Admin Template** (CodedThemes) como capa visual base, sobre la que se añaden componentes propios en **React 19 / Next.js 15**.

Pila visual real:

| Capa | Tecnología | Rol |
|------|------------|-----|
| Estilos base | Bootstrap 5 (vía `public/css/style.css`, ~23 kLOC) | Grid, utilidades, componentes (card, btn, alert, badge, form-control, modal, dropdown, table). |
| Tema | `public/css/style-preset.css` (preset-1) | Tokens de color de marca, variantes de botón, `bg-light-*`, `btn-light-*`. |
| Utilidades propias | `public/css/site.css` | `.stepper`, `.section-title`, `.hover-lift`, transición de `.card`. |
| Tailwind | `tailwind.config.js` | Solo está cargado para futuras utilidades; **no se usa para el layout actual** (todas las páginas usan clases Bootstrap). |
| Iconos | Tabler Icons (principal) + Feather + FontAwesome + Material | Familia única visible en UI: `ti ti-*`. |
| Gráficos | ApexCharts (cargado por `<Script>` global) | Dashboard. |

Atributos del `<body>` que activan el preset (definidos en `app/layout.tsx`):

```html
<body data-pc-preset="preset-1" data-pc-direction="ltr" data-pc-theme="light">
```

Cambiar el preset o `data-pc-theme` reemplaza los tokens — no se deben sobrescribir variables `--bs-*` ni `--pc-*` desde componentes.

---

## 2. Marca

### Logotipo

- Imagen: `public/logo.png` (escalada a 70 × 70 dentro del sidebar).
- Wordmark adjunto: **"cementer" + "io"** (las dos últimas letras en verde).
  - Tipografía: `Montserrat`, peso 700.
  - Color base: `#1a237e` (azul índigo profundo).
  - Acento "io": `#43a047` (verde).
  - Capitalización: `text-transform: lowercase`.

```tsx
<span style={{ color: '#1a237e' }}>
  cementer<span style={{ color: '#43a047' }}>io</span>
</span>
```

### Voz institucional

- Cliente: **GAD Parroquial de Checa**.
- Producto: **Sistema de Gestión de Cementerio**.
- Idioma de la UI: español (Ecuador). Atributo `lang="es"` en `<html>`.

---

## 3. Tokens

### 3.1 Color

**Paleta semántica (Bootstrap + preset-1)** — usar siempre vía clases utilitarias (`text-{tono}`, `bg-{tono}`, `bg-light-{tono}`, `btn-{tono}`, `btn-outline-{tono}`, `badge bg-{tono}`, `alert alert-{tono}`).

| Token | Hex | Variante claro (`bg-light-*`) | Uso |
|-------|-----|--------------------------------|-----|
| `primary` | `#1890ff` | `#e8f4ff` | Acción principal, enlaces, KPIs financieros, navegación activa. |
| `success` | (Bootstrap) `#1de9b6` / verde | — | Estado positivo: contratos activos, disponibilidad, "Conectado". |
| `info` | (Bootstrap) cian | — | Información contextual, segundas acciones. |
| `warning` | (Bootstrap) ámbar | — | Avisos (contratos por vencer, alertas). |
| `danger` | (Bootstrap) rojo | — | Errores, eliminación, contratos vencidos, cerrar sesión. |
| `secondary` | (Bootstrap) gris | — | Acciones neutras, "Cancelar", "Volver". |

**Superficies y texto** (de `style-preset.css`):

| Variable | Valor | Uso |
|----------|-------|-----|
| `--bs-body-bg` | `#fafafb` | Fondo de aplicación. |
| `--pc-heading-color` | `#343a40` | Color de títulos. |
| `--pc-sidebar-background` | `#fff` | Fondo del sidebar. |
| `--pc-sidebar-color` | `#141414` | Texto del sidebar. |
| `--pc-header-background` | `#fff` | Fondo del header. |
| `--pc-sidebar-caption-color` | `#495057` | Captions de sección del sidebar. |

**Paleta de gráficos (ApexCharts)** — definida en el dashboard (`app/page.tsx`); reutilizar estos tonos al añadir nuevas series para mantener coherencia:

| Color | Hex | Asignación habitual |
|-------|-----|---------------------|
| Azul | `#1890ff` | Ingresos / serie primaria. |
| Verde claro | `#52c41a` | Disponibles / activos. |
| Cian | `#13c2c2` | Bóvedas ocupadas. |
| Púrpura | `#722ed1` | Nichos disponibles. |
| Naranja | `#fa8c16` | Nichos ocupados. |
| Amarillo | `#faad14` | Por vencer. |
| Rojo | `#ff4d4f` | Deudas / vencidos. |

**No usar:** colores hardcodeados en estilos inline (excepto el wordmark de marca y el rojo `#ef4444` específico del item "Cerrar Sesión"). Cualquier color nuevo debe pasar por una clase utilitaria semántica.

> ⚠️ `tailwind.config.js` declara `primary: '#6366f1'`. Ese token **no está vigente** en la UI actual (toda la interfaz usa `#1890ff` del preset-1 de Bootstrap). Si en algún momento se introducen utilidades de Tailwind, alinear ese valor con `#1890ff` antes de mezclarlos.

### 3.2 Tipografía

| Familia | Pesos | Uso |
|---------|-------|-----|
| **Public Sans** | 300, 400, 500, 600, 700 | Texto general de la aplicación (cargada desde Google Fonts en `layout.tsx`; declarada también en `tailwind.config.js` como `font-sans`). |
| **Montserrat** | 700 | Wordmark del logo. |
| **Segoe UI / Arial** | — | Fallback del wordmark. |

Convenciones tipográficas observadas en las páginas:

| Elemento | Estilo |
|----------|--------|
| Título de página (`PageHeader`) | `<h2>` 1.5rem / 600 / margen inferior 0.25rem. |
| Subtítulo de página | `text-muted small`. |
| Título de sección | `.section-title` — 1.1rem / 600 / `#495057` / borde inferior `2px #e9ecef`. |
| Encabezado de card | `<h5 className="card-title">` o `<h5 className="mb-0">` precedido de icono. |
| Texto auxiliar | `<small className="text-muted">`. |
| Cifra KPI | `<h3 className="text-{tono}">`. |
| Etiquetas de formulario | `<label className="form-label">`. Asterisco textual `*` en obligatorios. |

### 3.3 Espaciado, radio y elevación

- Sistema de espaciado: **utilidades Bootstrap** (`m{Side}-{0..5}`, `p{Side}-{0..5}`, `g-{n}`, `gap-{n}`). No usar valores arbitrarios salvo en casos excepcionales.
- Radios: heredados de Bootstrap (`rounded`, `rounded-circle`, radio implícito de `.card`, `.btn`, `.badge`).
- Sombras del template:
  - `shadow-sm` para todas las cards informativas del dashboard.
  - Hover de card: `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` (transición 0.3s, definido en `site.css`).
  - `.hover-lift` para énfasis interactivo: `translateY(-2px)` + sombra más profunda.

---

## 4. Layout

Estructura global (montada en `app/layout.tsx` → `components/DashboardLayout.tsx`):

```
┌────────────────────────────────────────────────────────┐
│  Sidebar (.pc-sidebar, fijo)                           │
│  ┌───────────────┐ ┌──────────────────────────────┐    │
│  │ Logo + marca  │ │ Header (.pc-header, sticky)  │    │
│  │               │ ├──────────────────────────────┤    │
│  │ Navigation    │ │ Main (.pc-container)         │    │
│  │   - secciones │ │   .pc-content                │    │
│  │   - items     │ │     PageHeader               │    │
│  │               │ │     [contenido de la página] │    │
│  │               │ ├──────────────────────────────┤    │
│  │               │ │ Footer (.pc-footer)          │    │
│  └───────────────┘ └──────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

- **Grid de contenido**: `.container-fluid` + `row` + `col-{breakpoint}-{n}` (Bootstrap). Breakpoints estándar: `sm`, `md`, `lg`, `xl`.
- **Altura mínima** del área de contenido: `calc(100vh - 160px)` (definida en `globals.css`).
- **Loader inicial**: `.loader-bg` se oculta tras 500 ms para evitar parpadeo en la primera navegación (manejado dentro de `DashboardLayout`).

### Sidebar

- Listado en `components/Sidebar.tsx`. Estructura: secciones (`pc-caption`) + items con icono Tabler.
- Marcado activo: clase `active` se aplica al `.pc-item` cuyo `href` coincide con `pathname` (raíz exacta para `/`, `startsWith` para el resto).
- Secciones actuales:
  - Dashboard
  - Contratos
  - Gestión
  - Administración
  - Configuración
  - Ayuda

### Header

- Iconos a la izquierda para colapsar el sidebar (desktop) y abrir el sidebar móvil.
- A la derecha: notificaciones (`ti-mail`) + perfil con avatar + nombre + menú.
- Dropdowns implementados con estado React local (no Bootstrap JS) — un solo dropdown abierto a la vez.

### Footer

- Tres bloques (4-4-4 en desktop):
  1. Marca y descripción del sistema.
  2. Estados rápidos: Sistema Activo, Base de Datos, Seguro (avatares circulares en variante `subtle`).
  3. Crédito de desarrollador (badge `bg-primary-subtle text-primary`).
- Fila inferior: estado de conexión (`Conectado`) + versión y copyright.

---

## 5. Iconografía

- **Familia principal**: Tabler Icons. Sintaxis siempre `<i className="ti ti-{nombre}"></i>`.
- Convenciones de mapeo en uso:

| Dominio | Icono |
|---------|-------|
| Dashboard | `ti-dashboard`, `ti-layout-dashboard`, `ti-chart-bar` |
| Contratos | `ti-file-plus`, `ti-files`, `ti-list-search`, `ti-folder-plus`, `ti-file-text` |
| Personas | `ti-users`, `ti-user`, `ti-user-check` |
| Bóvedas / nichos | `ti-building`, `ti-box`, `ti-box-multiple` |
| Cobros / pagos | `ti-coin`, `ti-receipt`, `ti-currency-dollar` |
| Difuntos | `ti-cloud`, `ti-user` |
| Configuración | `ti-settings`, `ti-shield-check` |
| Reportes | `ti-chart-dots`, `ti-chart-bar`, `ti-chart-line`, `ti-pie-chart`, `ti-donut` |
| Acciones tabla | `ti-eye` (ver), `ti-edit` (editar), `ti-trash` (eliminar) |
| Navegación | `ti-arrow-left` (volver), `ti-plus` (crear), `ti-menu-2` (menú), `ti-x` (cerrar), `ti-refresh` (actualizar) |
| Estado | `ti-check`, `ti-circle-check`, `ti-alert-triangle`, `ti-alert-circle`, `ti-bell` |
| Sesión | `ti-power` (cerrar sesión), `ti-lock` (contraseña) |

- Las otras familias (Feather, FontAwesome, Material) están cargadas pero **no se usan** en componentes propios — reservadas para piezas heredadas de Able Pro.

---

## 6. Componentes UI propios

Los wrappers viven en `src/components/ui/` y encapsulan el uso recomendado de Bootstrap.
**Regla general:** preferir estos wrappers sobre escribir clases Bootstrap directamente en las páginas.

### 6.1 `<PageHeader />`

Encabezado consistente para cada vista.

```tsx
<PageHeader
  title="Lista de Personas"
  subtitle="Gestión de propietarios y responsables"
  actions={<Button href="/personas/create" icon="ti-plus">Nueva Persona</Button>}
/>
```

- `title`: `<h2>` 1.5rem / 600.
- `subtitle`: opcional, `text-muted small`.
- `actions`: nodo React libre — habitualmente un `Button` primario.

### 6.2 `<Button />`

Botón polimórfico (renderiza `<a>` si recibe `href`, `<button>` si no).

| Prop | Valores | Notas |
|------|---------|-------|
| `variant` | `primary` \| `secondary` \| `outline-primary` \| `outline-secondary` \| `danger` | Por defecto `primary`. |
| `href` | string | Si está presente, se renderiza con `next/link`. |
| `icon` | nombre Tabler sin prefijo `ti-` requerido (se concatena tal cual) | Aparece a la izquierda con `me-1`. |

Reglas:

- Acción principal por página → un único botón `primary`.
- Cancelar / Volver → `secondary` o `outline-secondary`.
- Eliminar → `danger`.
- Tamaños pequeños en listados / filtros: `className="btn-sm"` adicional.

### 6.3 `<TextInput />`

Input controlado. Si recibe `icon` se envuelve en `.search-box` (input con icono interno).

```tsx
<TextInput icon="ti-search" placeholder="Buscar..." value={q} onChange={...} />
```

### 6.4 `<SelectInput />`

`<select className="form-select">` que recibe `options: { value, label }[]`.
La primera opción suele ser un sentinel `{ value: '', label: 'Todos…' }`.

### 6.5 `<SearchFilters />`

Contenedor flex horizontal para filtros, anclado como `card-header` con `gap-3` y `flex-wrap`.

```tsx
<SearchFilters>
  <TextInput icon="ti-search" ... />
  <SelectInput options={...} ... />
</SearchFilters>
```

### 6.6 `<DataGrid />`

Tabla genérica con tipado por columna.

```tsx
const columns: DataGridColumn<Persona>[] = [
  { key: 'nombre', title: 'Nombre', render: (row) => `${row.nombre} ${row.apellido}` },
  { key: 'acciones', title: 'Acciones', render: (row) => (...) },
];
<DataGrid columns={columns} rows={data} rowKey={(r) => r.id} loading={loading} />
```

Convenciones:

- Última columna `acciones` con `<div className="actions">` y `<a className="action-btn">` o `<button className="action-btn">` (rojo: `action-btn danger`) para ver / editar / eliminar.
- Estado vacío: `emptyMessage` por defecto `"No hay registros"`.
- Estado de carga: muestra fila `"Cargando..."` centrada.

### 6.7 `<PaginationNav />`

- Solo se renderiza si `totalPages > 1`.
- Muestra ventana ±2 alrededor de la página actual, más botones "Anterior / Siguiente".
- Resumen a la izquierda: `Página X de Y - Total: N`.
- Botones: `btn btn-sm btn-outline-secondary`, activo `btn-primary`.

### 6.8 KPI Cards (definidas in-line en el dashboard)

Patrón reutilizable:

```tsx
<div className="card h-100 border-0 shadow-sm">
  <div className="card-body">
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <h6 className="text-muted">Título</h6>
        <h3 className="text-{tono}">Valor</h3>
        <small className="text-muted">Subtítulo</small>
      </div>
      <div className="avatar bg-light-{tono} text-{tono}">
        <i className="ti ti-{icono} f-24"></i>
      </div>
    </div>
    <div className="progress mt-3" style={{ height: '4px' }}>
      <div className="progress-bar bg-{tono}" style={{ width: '{n}%' }}></div>
    </div>
  </div>
</div>
```

Si este patrón se reutiliza fuera del dashboard, **extraerlo a `components/ui/KpiCard.tsx`** antes de duplicar.

### 6.9 QuickCard

Atajo navegable en el dashboard. Se renderiza con `bg-light-{tono}`, ícono grande (1.8rem) y etiqueta corta. Útil para shortcuts; no usar como reemplazo de un menú principal.

### 6.10 Stepper / Wizard

Definido en `public/css/site.css`. Usado en `app/contratos/create/page.tsx`.

- `.stepper` (contenedor flex), `.step` (cada nodo), `.circle` (40 × 40 px).
- Estados: `.step.active .circle` → azul `#007bff`; `.step.completed .circle` → verde `#28a745`.
- Pasos actuales del wizard de contrato: *Datos del contrato → Datos del difunto → Datos de los responsables → Pago → Verificación*.

---

## 7. Patrones de página

### 7.1 Listado (CRUD)

Estructura canónica (`app/personas/page.tsx`, `app/bovedas/page.tsx`):

1. `<PageHeader>` con botón **Nueva …** como acción principal.
2. `<div className="card">` que contiene:
   - `<SearchFilters>` con `<TextInput icon="ti-search">` + filtros tipo `<SelectInput>`.
   - `<DataGrid>`.
   - `<PaginationNav>`.
3. Paginación servidor: `limit: 15`. Reset de `page` a `1` al cambiar filtros/búsqueda.

### 7.2 Formulario de creación / edición

Estructura canónica (`app/personas/create/page.tsx`):

1. `<PageHeader>` con botón **Volver** (`btn-secondary`).
2. Grid `row` con **dos columnas**:
   - `col-md-8`: card principal con el formulario.
     - `card-header` → `<h5 className="card-title">`.
     - `card-body` → `<form>` con:
       - Alert de error condicional: `<div className="alert alert-danger">`.
       - Filas `row` con `col-md-6` para campos en pareja.
       - `.form-group` → `<label className="form-label">` (con `*` para obligatorios) → `form-control` / `form-select`.
       - Pie del formulario: `d-flex justify-content-end gap-2 mt-3` con **Cancelar** (`btn-secondary`) + **Guardar** (`btn-primary` con spinner en estado de carga).
   - `col-md-4`: card de **información contextual** (texto auxiliar con `text-muted small`).

### 7.3 Detalle

- Sigue el patrón "PageHeader + cards" con bloques de información en `col-md-{n}`.
- Las acciones (editar / eliminar) van en `actions` del `<PageHeader>`.

### 7.4 Dashboard

- Sección **Indicadores Principales**: grid de `KpiCard` (col-sm-6 / col-md-4 / col-lg-3).
- Sección **Resumen Operativo**: cards con ApexCharts (pie, donut, bar, area).
- Sección **Alertas**: `alert alert-{tono} border-0` con icono + descripción.
- Sección **Accesos Rápidos**: grid de `QuickCard`.
- Estado de carga global: `<div className="spinner-border text-primary" />` centrado.

---

## 8. Estados, feedback y mensajería

| Situación | Patrón |
|-----------|--------|
| Cargando (página completa) | Spinner Bootstrap `spinner-border text-primary` centrado, `min-height: 40vh`. |
| Cargando (botón) | Mismo botón, `disabled`, contenido reemplazado por `spinner` pequeño + texto "Guardando…". |
| Cargando (fila de tabla) | Fila única `Cargando...` en `DataGrid`. |
| Error de formulario | `<div className="alert alert-danger">` al inicio del form. |
| Éxito sin redirección | `alert alert-success border-0`. |
| Aviso preventivo | `alert alert-warning border-0` (ej. contratos por vencer). |
| Error crítico | `alert alert-danger border-0` (ej. contratos vencidos). |
| Sin datos en lista | Mensaje gris centrado dentro del `DataGrid` (`emptyMessage`). |
| Sin notificaciones | `"No hay notificaciones nuevas"` dentro del dropdown del header. |

### Badges de estado

| Estado | Clase | Texto típico |
|--------|-------|--------------|
| Activo / disponible / OK | `badge bg-success` (o `badge-success`) | "Activo", "Disponible", "Conectado". |
| Pendiente / advertencia | `badge bg-warning text-dark` | "Por Vencer". |
| Inactivo / error | `badge bg-danger` (o `badge-danger`) | "Vencido", "Ocupada". |
| Informativo | `badge bg-info` o `badge bg-primary` | "Renovación", "Nuevo". |
| Versión / neutral | `badge bg-light-secondary text-secondary` | "v1.0.0". |

---

## 9. Modales y overlays

- Modales Bootstrap (`.modal`, `.modal-dialog`, `.modal-content`) controlados manualmente con estado React local (ej. `showResponsableModal`, `showBovedaModal` en el wizard de contratos).
- Dropdowns del header (`.dropdown-menu.show`) también controlados por estado React, **no** por el JS de Bootstrap. Solo un dropdown abierto a la vez.
- Cuando se necesite un nuevo overlay, mantener este patrón (`useState` + condicional + `aria-label` en triggers) en vez de invocar la API de Bootstrap.

---

## 10. Accesibilidad

Reglas mínimas en uso:

- `lang="es"` en `<html>`.
- Atributos `alt` en imágenes (logo, avatar).
- `aria-label` en triggers icónicos del header.
- Spinners con `role="status"`.
- Asterisco `*` textual en labels obligatorios (acompañar siempre con validación nativa `required`).
- Iconos puramente decorativos van junto a texto; no se usan icon-only sin tooltip / título salvo en la columna de **Acciones** (`title="Ver"`, `title="Editar"`, etc.).

A reforzar en futuras iteraciones: foco visible consistente (Bootstrap por defecto en `#1890ff`), navegación por teclado en dropdowns React-controlados, `aria-current="page"` en sidebar activo, `aria-live` en alertas dinámicas.

---

## 11. Responsive

- Breakpoints Bootstrap estándar (`sm` 576, `md` 768, `lg` 992, `xl` 1200, `xxl` 1400).
- El sidebar se colapsa en móvil (manejado por `pcoded.js`); el header expone un trigger específico (`#mobile-collapse`).
- Tablas: envueltas en `overflow-x: auto` dentro de `DataGrid` para evitar desbordes.
- Ajustes propios (en `site.css`) para ≤576 px: padding lateral del container y tamaño de `.section-title`.

---

## 12. Convenciones de implementación

1. **Idioma de la UI**: español; textos en código fuente también en español (variables permanecen en español/inglés según campo de dominio).
2. **No introducir nuevas dependencias UI** (component libraries) sin migrar el resto. La pila visible es Bootstrap + Tabler Icons + ApexCharts; añadir otra duplica criterios.
3. **No mezclar Tailwind y Bootstrap en un mismo componente.** Hoy todo el UI activo usa Bootstrap; si se introduce Tailwind, hacerlo aislado por componente y nunca para sobreescribir Bootstrap.
4. **Tonos**: usar siempre los seis tonos canónicos (`primary`, `success`, `info`, `warning`, `danger`, `secondary`). No inventar nuevos.
5. **Cards**: por defecto `card border-0 shadow-sm`. La sombra en hover es global — no añadir sombras inline.
6. **Iconos**: una sola familia visible en componentes propios: Tabler. Mantener el mismo icono para el mismo significado (ver tabla §5).
7. **Páginas Client**: marcar con `'use client'` cuando usen `useState`, `useEffect` o hooks de cliente. Toda la UI actual es client-rendered.
8. **Wrappers `components/ui/`**: si se repite un patrón Bootstrap >2 veces, promoverlo a un wrapper aquí antes de duplicarlo.
9. **Estilos inline**: aceptables solo para valores realmente puntuales (anchos de filtros, `style={{ height: '8px' }}` de una barra de progreso específica). Si se repite, crear utilidad CSS en `site.css`.
10. **Spinner inicial**: respetar los 500 ms de `loader-bg`; no añadir loaders globales adicionales.

---

## 13. Mapa de archivos clave

| Archivo | Contenido |
|---------|-----------|
| `frontend/src/app/layout.tsx` | Carga de fuentes, CSS global, scripts, atributos del preset. |
| `frontend/src/app/globals.css` | Reset mínimo + ajustes de altura del template. |
| `frontend/src/components/DashboardLayout.tsx` | Composición Sidebar + Header + Main + Footer. |
| `frontend/src/components/Sidebar.tsx` | Definición de navegación. |
| `frontend/src/components/Header.tsx` | Barra superior + dropdowns de notificaciones y usuario. |
| `frontend/src/components/Footer.tsx` | Pie con estados del sistema y crédito. |
| `frontend/src/components/ui/*` | Wrappers reutilizables (Button, PageHeader, DataGrid, PaginationNav, TextInput, SelectInput, SearchFilters). |
| `frontend/public/css/style.css` | Bootstrap + tema Able Pro completo. |
| `frontend/public/css/style-preset.css` | Tokens del preset-1 (paleta azul `#1890ff`). |
| `frontend/public/css/site.css` | Utilidades propias (stepper, section-title, hover-lift). |
| `frontend/tailwind.config.js` | Declaración de Tailwind (preparada, sin uso activo). |

---

## 14. Checklist al añadir una vista nueva

- [ ] Marca `'use client'` si necesita hooks.
- [ ] Usa `<PageHeader>` con título, subtítulo y acción principal.
- [ ] Estructura en `.container-fluid` + `.row` + `.col-*`.
- [ ] Reutiliza wrappers de `components/ui/` antes que clases Bootstrap directas.
- [ ] Tonos solo dentro del set canónico.
- [ ] Iconos Tabler con el significado de la tabla §5.
- [ ] Estados: loading / vacío / error cubiertos.
- [ ] Listados: 15 por página, búsqueda + filtros en `SearchFilters`, paginación con `PaginationNav`.
- [ ] Formularios: layout 8/4, alertas dentro del form, botones Cancelar + Guardar al pie.
- [ ] Si introduces un patrón nuevo repetido, créalo como wrapper en `components/ui/`.
