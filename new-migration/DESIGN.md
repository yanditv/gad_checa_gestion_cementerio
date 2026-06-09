# Sistema de Diseño — Gestión Cementerio GAD Checa

Documento de referencia del sistema de diseño visual y de interacción del frontend.
Se basa en el código presente en `frontend/src/` y en los activos estáticos de `frontend/public/`.

---

## 1. Fundamento del sistema

El frontend reutiliza activos estáticos de **Able Pro** (fuentes, CSS global,
scripts del template) como capa base, pero la UI propia actual está escrita en
**Tailwind + React 19 / Next.js 15**.

Pila visual real:

| Capa | Tecnología | Rol |
|------|------------|-----|
| Estilos base | Able Pro / Bootstrap 5 (vía `public/css/style.css`) | Activos globales heredados del template, tipografía y compatibilidad visual. |
| Tema | `public/css/style-preset.css` (preset-1) | Tokens de color de marca, variantes de botón, `bg-light-*`, `btn-light-*`. |
| Utilidades propias | `public/css/site.css` | `.stepper`, `.section-title`, `.hover-lift`, transición de `.card`. |
| Tailwind | `tailwind.config.js` | Fuente real para layout, spacing, cards, tablas, formularios y estados de la app actual. |
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

**Paleta semántica** — en código nuevo usar siempre las utilidades Tailwind del
repo (`bg-primary-500`, `text-slate-700`, `ring-primary-200`, `bg-danger-50`,
etc.). Los CSS del template siguen cargados, pero no son la referencia para
autorar componentes nuevos.

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

`tailwind.config.js` ya está alineado con el azul institucional vigente:
`primary-500 = #1890ff`.

### 3.2 Tipografía

| Familia | Pesos | Uso |
|---------|-------|-----|
| **Public Sans** | 300, 400, 500, 600, 700 | Texto general de la aplicación (cargada desde Google Fonts en `layout.tsx`; declarada también en `tailwind.config.js` como `font-sans`). |
| **Montserrat** | 700 | Wordmark del logo. |
| **Segoe UI / Arial** | — | Fallback del wordmark. |

Convenciones tipográficas observadas en las páginas:

| Elemento | Estilo |
|----------|--------|
| Título de página | `<h1>` o `<h2>` con `text-2xl font-bold text-slate-900` + subtítulo `text-sm text-slate-500`. |
| Subtítulo de página | `text-muted small`. |
| Título de sección | `.section-title` — 1.1rem / 600 / `#495057` / borde inferior `2px #e9ecef`. |
| Encabezado de card | `<h5 className="card-title">` o `<h5 className="mb-0">` precedido de icono. |
| Texto auxiliar | `<small className="text-muted">`. |
| Cifra KPI | `<h3 className="text-{tono}">`. |
| Etiquetas de formulario | `<label className="form-label">`. Asterisco textual `*` en obligatorios. |

### 3.3 Espaciado, radio y elevación

- Sistema de espaciado: utilidades Tailwind (`space-y-*`, `gap-*`, `px-*`, `py-*`).
- Radios: `rounded-md`, `rounded-lg`, `rounded-xl` según jerarquía visual.
- Sombras del template:
  - `shadow-sm` para todas las cards informativas del dashboard.
  - Hover de card: `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` (transición 0.3s, definido en `site.css`).
  - `.hover-lift` para énfasis interactivo: `translateY(-2px)` + sombra más profunda.

### 3.4 Tokens Tailwind (Fase 2.5+)

Tailwind convive con los assets globales de Able Pro. Los tokens reflejan los
mismos colores semánticos visibles para mantener continuidad con el sistema
legado.

| Bootstrap | Tailwind | Hex |
|-----------|----------|-----|
| `primary` | `primary` (`primary-500`) | `#1890ff` |
| `bg-light-primary` | `primary-50` | `#e8f4ff` |
| `success` | `success` | `#1de9b6` |
| `info` | `info` | `#13c2c2` |
| `warning` | `warning` | `#faad14` |
| `danger` | `danger` | `#ff4d4f` |
| Brand wordmark base | `brand-dark` | `#1a237e` |
| Brand wordmark acento | `brand-accent` | `#43a047` |
| `--bs-body-bg` | `surface-DEFAULT` | `#fafafb` |
| Sombras `shadow-sm` / hover | `shadow-soft` / `shadow-lifted` | — |

Fuentes registradas:

- `font-sans` → Public Sans (cuerpo).
- `font-display` → Montserrat (marca, encabezados especiales).

`preflight` está desactivado (`tailwind.config.js`): Tailwind no aplica reset
global para no chocar con el reset de Bootstrap. Las pantallas Tailwind aplican
normalización vía clases utilitarias (`box-border`, `m-0`, etc.) cuando hace
falta.

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
│  │   - items     │ │     encabezado de página     │    │
│  │               │ │     [contenido de la página] │    │
│  │               │ ├──────────────────────────────┤    │
│  │               │ │ Footer (.pc-footer)          │    │
│  └───────────────┘ └──────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

- **Grid de contenido**: `max-w-7xl` centrado, `px-4 sm:px-6 lg:px-8`, cards y
  grids Tailwind (`grid-cols-*`, `lg:grid-cols-3`, etc.).
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

## 6. Patrones UI actuales

No existe `src/components/ui/`. La app actual compone la UI directamente en
las páginas y solo extrae componentes cuando el patrón ya está repetido.

### 6.1 Encabezado de página

Patrón actual en listados y formularios:

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold text-slate-900">Lista de Personas</h1>
    <p className="mt-1 text-sm text-slate-500">Gestión de propietarios y responsables.</p>
  </div>
  <Link className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-soft hover:bg-primary-600">
    <i className="ti ti-plus" />
    Nueva Persona
  </Link>
</div>
```

### 6.2 Cards y contenedores

- Contenedor principal: `rounded-xl border border-slate-200 bg-white shadow-soft`.
- Header de card: `border-b border-slate-100 px-5 py-3`.
- Cuerpo: `p-4` o `p-5`.

### 6.3 Inputs y filtros

- `input` / `select` usan borde `slate-200`, fondo claro y foco
  `focus:ring-2 focus:ring-primary-200`.
- Los buscadores con icono usan `relative` + icono absoluto a la izquierda.
- Los filtros de listados viven dentro de la card, arriba de la tabla.

### 6.4 Tablas y paginación

- Tabla: `min-w-full divide-y divide-slate-100 text-sm`.
- Header: `bg-slate-50`, títulos `text-xs uppercase tracking-wider`.
- Estado vacío: icono Tabler + copy centrado.
- Estado de carga: spinner SVG inline dentro de una fila o bloque centrado.
- Paginación: resumen textual + botones inline con ventana ±2 páginas.

### 6.5 KPI cards y dashboard

Patrón reutilizable:

```tsx
<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
  <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Título</p>
        <p className="mt-1 text-2xl font-bold text-primary-600">Valor</p>
        <p className="mt-0.5 text-xs text-slate-500">Subtítulo</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg ring-1 bg-primary-50 text-primary-600 ring-primary-200">
        <i className="ti ti-{icono} text-xl"></i>
      </span>
    </div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full bg-primary-500" style={{ width: '75%' }}></div>
    </div>
</div>
```

Si el patrón se repite 3+ veces fuera del dashboard, extraer un componente
compartido en `src/components/`.

### 6.6 QuickCard

Atajo navegable en el dashboard. Se renderiza con `bg-light-{tono}`, ícono grande (1.8rem) y etiqueta corta. Útil para shortcuts; no usar como reemplazo de un menú principal.

### 6.7 Stepper / Wizard

El wizard de contratos ya no depende de clases Bootstrap o wrappers: está
maquetado inline con pills circulares Tailwind. Mantener el orden actual de
pasos: *Datos del contrato → Datos del difunto → Datos de los responsables →
Pago → Verificación*.

---

## 7. Patrones de página

### 7.1 Listado (CRUD)

Estructura canónica (`app/personas/page.tsx`, `app/bovedas/page.tsx`):

1. Encabezado inline con `h1` + subtítulo + CTA principal.
2. Card Tailwind con:
   - buscador inline con icono,
   - filtros compactos (`select`, toggles o tabs según módulo),
   - tabla propia,
   - paginación inline.
3. Paginación servidor: `limit: 15`. Reset de `page` a `1` al cambiar filtros/búsqueda.

### 7.2 Formulario de creación / edición

Estructura canónica (`app/personas/create/page.tsx`):

1. Encabezado inline con botón **Volver** secundario.
2. Grid `grid grid-cols-1 gap-6 lg:grid-cols-3`:
   - `lg:col-span-2`: card principal con el formulario.
   - columna restante: card de información contextual.
3. Campos en `grid grid-cols-1 gap-4 sm:grid-cols-2`.
4. Error del formulario en bloque rojo suave al inicio.
5. Pie del formulario alineado a la derecha con **Cancelar** + **Guardar**.

### 7.3 Detalle

- Sigue el patrón de encabezado inline + cards informativas.
- Las acciones (editar / eliminar) viven junto al título o en la cabecera de la card principal.

### 7.4 Dashboard

- Sección **Indicadores Principales**: grid Tailwind responsivo (`sm:grid-cols-2`, `lg:grid-cols-4`).
- Sección **Resumen Operativo**: cards con ApexCharts (pie, donut, bar, area).
- Sección **Alertas**: `alert alert-{tono} border-0` con icono + descripción.
- Sección **Accesos Rápidos**: grid de `QuickCard`.
- Estado de carga global: spinner SVG inline centrado.

---

## 8. Estados, feedback y mensajería

| Situación | Patrón |
|-----------|--------|
| Cargando (página completa) | Spinner SVG inline centrado con `min-h-[20vh]` o `min-h-[40vh]`. |
| Cargando (botón) | Botón deshabilitado con spinner SVG pequeño + texto `Guardando…`. |
| Cargando (fila de tabla) | Fila o bloque con spinner + copy `Cargando ...`. |
| Error de formulario | `rounded-lg bg-red-50 ... text-red-700 ring-red-200` al inicio del form. |
| Éxito sin redirección | Bloque verde suave (`bg-green-50`, `text-green-700`). |
| Aviso preventivo | Bloque ámbar suave (`bg-amber-50`, `text-amber-700`). |
| Error crítico | Bloque rojo suave (`bg-red-50`, `text-red-700`). |
| Sin datos en lista | Icono Tabler + copy gris centrado dentro de la card o tabla. |
| Sin notificaciones | `"No hay notificaciones nuevas"` dentro del dropdown del header. |

### Badges de estado

| Estado | Clase | Texto típico |
|--------|-------|--------------|
| Activo / disponible / OK | `inline-flex ... bg-success-50 text-success-700 ring-success-200` | "Activo", "Disponible", "Conectado". |
| Pendiente / advertencia | `bg-warning-50 text-warning-700 ring-warning-200` | "Por vencer". |
| Inactivo / error | `bg-danger-50 text-danger-700 ring-danger-200` | "Vencido", "Ocupada". |
| Informativo | `bg-primary-50 text-primary-700 ring-primary-200` | "Renovación", "Nuevo". |
| Neutral | `bg-slate-100 text-slate-600 ring-slate-200` | "Borrador", "Sin datos". |

---

## 9. Modales y overlays

- Los dropdowns del header se controlan con estado React local; solo uno abierto a la vez.
- Cuando se necesite un nuevo overlay, mantener el patrón `useState` + render condicional + `aria-label` en triggers.
- No invocar APIs JS de Bootstrap para dropdowns o modales nuevos.

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

- Breakpoints consumidos en código: `sm`, `md`, `lg` vía utilidades Tailwind.
- El sidebar móvil se controla desde React (`sidebarOpen`) y el header expone el toggle.
- Tablas: envueltas en `overflow-x-auto` para evitar desbordes.
- Ajustes propios (en `site.css`) para ≤576 px: padding lateral del container y tamaño de `.section-title`.

---

## 12. Convenciones de implementación

1. **Idioma de la UI**: español; textos en código fuente también en español (variables permanecen en español/inglés según campo de dominio).
2. **No introducir nuevas dependencias UI** sin discutir. La pila visible es Tailwind + Tabler Icons + ApexCharts, apoyada en assets globales de Able Pro.
3. **No reintroducir Bootstrap en `src/app` o `src/components`**. Las clases `btn`, `card`, `form-control`, `row`, `col-*`, `pc-*` quedan reservadas para assets heredados, no para UI nueva.
4. Tailwind tiene `corePlugins.preflight = false` para no resetear los estilos globales heredados.
5. Tokens compartidos en `tailwind.config.js` (primary `#1890ff`). Si cambian aquí, sincronizar este documento.
6. **Tonos**: usar siempre los tonos canónicos (`primary`, `success`, `info`, `warning`, `danger`) y neutrales `slate-*` del repo.
7. **Cards**: por defecto `rounded-xl border border-slate-200 bg-white shadow-soft`.
8. **Iconos**: una sola familia visible en componentes propios: Tabler. Mantener el mismo icono para el mismo significado (ver tabla §5).
9. **Páginas Client**: marcar con `'use client'` cuando usen `useState`, `useEffect` o hooks de cliente. La mayor parte de la UI actual es client-rendered.
10. **Extracción de componentes**: si un patrón Tailwind se repite 3+ veces, extraerlo en `src/components/`; si no, dejarlo inline.
11. **Estilos inline**: aceptables solo para valores puntuales (por ejemplo ancho de barra de progreso). Si se repite, moverlo a utilidades o componente.
12. **Spinner inicial**: respetar los 500 ms de `loader-bg`; no añadir loaders globales adicionales.

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
| `frontend/src/lib/api.ts` | Cliente HTTP principal para recursos de dominio. |
| `frontend/public/css/style.css` | Bootstrap + tema Able Pro completo. |
| `frontend/public/css/style-preset.css` | Tokens del preset-1 (paleta azul `#1890ff`). |
| `frontend/public/css/site.css` | Utilidades propias (stepper, section-title, hover-lift). |
| `frontend/tailwind.config.js` | Declaración real de tokens Tailwind usados por la UI actual. |

---

## 14. Checklist al añadir una vista nueva

- [ ] Marca `'use client'` si necesita hooks.
- [ ] Usa encabezado inline con título, subtítulo y acción principal.
- [ ] Estructura con grids y spacing Tailwind responsivos.
- [ ] No introduzcas clases Bootstrap en la UI nueva.
- [ ] Tonos solo dentro del set canónico.
- [ ] Iconos Tabler con el significado de la tabla §5.
- [ ] Estados: loading / vacío / error cubiertos.
- [ ] Listados: 15 por página, búsqueda/filtros inline, paginación inline.
- [ ] Formularios: layout `lg:grid-cols-3`, alertas dentro del form, botones Cancelar + Guardar al pie.
- [ ] Si introduces un patrón nuevo repetido, extráelo a `src/components/`.
