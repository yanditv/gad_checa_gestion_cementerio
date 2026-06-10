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

> **Lenguaje visual: CRM profesional** (referencia Linear / HubSpot, pero
> institucional). Se conserva la **esencia** — azul `primary #1890ff`, neutros
> `slate`, los seis tonos semánticos, fuente Inter — y se sale del **diseño
> plano**: profundidad sutil con sombras en capas, radios `xl`, jerarquía
> tipográfica clara y micro-interacciones de 150–200 ms. Solo tema claro por
> ahora; los tokens quedan preparados para dark mode.

La **fuente única de verdad** de tokens es `frontend/tailwind.config.js`. Los
CSS del template (`style.css`, `style-preset.css`) siguen cargados para
compatibilidad, pero **no** son la referencia para autorar UI nueva.

### 3.1 Color

**Tonos semánticos** — siempre vía utilidades Tailwind del repo
(`bg-primary-500`, `text-secondary-600`, `ring-success-200`, `bg-danger-50`,
…). Cada tono tiene rampa completa `50→900`. Convención de "pill" / fondo
suave: `bg-{tono}-50 text-{tono}-700 ring-1 ring-{tono}-200`.

| Token | `500` | Uso | Pill suave |
|-------|-------|-----|-----------|
| `primary` | `#1890ff` | Acción principal, enlaces, navegación activa, KPIs financieros. | `bg-primary-50 text-primary-700 ring-primary-200` |
| `success` | `#1de9b6` | Estado positivo: activo, disponible, "Conectado". | `bg-success-50 text-success-700 ring-success-200` |
| `info` | `#13c2c2` | Información contextual, segundas acciones. | `bg-info-50 text-info-700 ring-info-200` |
| `warning` | `#faad14` | Avisos, "Por vencer", alertas. | `bg-warning-50 text-warning-700 ring-warning-200` |
| `danger` | `#ff4d4f` | Errores, eliminación, vencido, cerrar sesión. | `bg-danger-50 text-danger-700 ring-danger-200` |
| `secondary` | `#64748b` | Acciones neutras, "Cancelar", "Volver", datos auxiliares. Alias de `slate`. | `bg-secondary-100 text-secondary-700 ring-secondary-200` |

**Neutros: escala `slate`.** Es la columna vertebral del look CRM. Mapa de uso:

| Rol | Token |
|-----|-------|
| Fondo de aplicación | `surface-DEFAULT` (`#f8fafc`, = slate-50) |
| Zona sutilmente hundida (header de tabla, filtros) | `surface-muted` / `slate-100` |
| Superficie de tarjeta / panel | `surface-card` (`#ffffff`) |
| Borde de tarjeta / separador | `slate-200` |
| Separador interno fino | `slate-100` |
| Texto principal | `slate-900` |
| Texto cuerpo | `slate-700` |
| Texto auxiliar / subtítulo | `slate-500` |
| Texto deshabilitado / overline | `slate-400` |

`secondary-*` es un **alias** de `slate-*` para nombrar el sexto tono canónico
sin perder la familia neutra; ambos pueden usarse indistintamente.

**Acento de marca** (solo wordmark del logo): `brand-dark #1a237e`,
`brand-accent #43a047`. No usar fuera del logotipo.

**Paleta de gráficos (ApexCharts)** — reutilizar estos tonos al añadir series:

| Color | Hex | Asignación habitual |
|-------|-----|---------------------|
| Azul | `#1890ff` | Ingresos / serie primaria. |
| Verde claro | `#52c41a` | Disponibles / activos. |
| Cian | `#13c2c2` | Bóvedas ocupadas. |
| Púrpura | `#722ed1` | Nichos disponibles. |
| Naranja | `#fa8c16` | Nichos ocupados. |
| Amarillo | `#faad14` | Por vencer. |
| Rojo | `#ff4d4f` | Deudas / vencidos. |

**No usar:** colores hardcodeados en estilos inline (salvo el wordmark de marca
y anchos puntuales de barra de progreso). Cualquier color nuevo pasa por una
clase utilitaria semántica.

### 3.2 Tipografía

**Inter** es la fuente del cuerpo del CRM (cargada en `layout.tsx` junto a
Public Sans como fallback; declarada como `font-sans`). **Montserrat 700** solo
para el wordmark (`font-display`).

| Familia | Pesos | Uso |
|---------|-------|-----|
| **Inter** | 400, 500, 600, 700 | Texto general de la aplicación. |
| **Public Sans** | 300–700 | Fallback compatible con el template. |
| **Montserrat** | 700 | Wordmark del logo (`font-display`). |

**Escala tipográfica** (definida en `fontSize` del config; cuerpo base = 14 px,
`line-height` 1.5–1.6):

| Clase | Tamaño | Uso |
|-------|--------|-----|
| `text-caption` | 11px / `tracking` ancho | Overlines, etiquetas KPI, captions de sidebar. |
| `text-xs` | 12px | Metadatos, badges, ayudas. |
| `text-sm` | 13px | Texto secundario, celdas densas. |
| `text-base` | 14px | Cuerpo por defecto. |
| `text-md` | 15px | Énfasis de cuerpo. |
| `text-lg` | 16px | Subtítulos de sección. |
| `text-xl` | 18px | Encabezado de card. |
| `text-2xl` | 22px / `tracking` negativo | **Título de página**. |
| `text-3xl` | 28px | Cifras grandes. |
| `text-4xl` | 34px | Display / KPI hero. |

Convenciones por elemento:

| Elemento | Estilo |
|----------|--------|
| Título de página | `text-2xl font-bold text-slate-900` (+ subtítulo `text-sm text-slate-500`). |
| Encabezado de card | `text-base font-semibold text-slate-900`, opcional con icono. |
| Overline / etiqueta KPI | `text-caption font-medium uppercase text-slate-400`. |
| Cifra KPI | `text-3xl font-bold text-{tono}-600 tabular-nums`. |
| Cifras de dinero / tablas numéricas | añadir `tabular-nums`. |
| Etiqueta de formulario | `text-sm font-medium text-slate-700`; asterisco `*` en obligatorios. |
| Texto de ayuda / error de campo | `text-xs text-slate-500` / `text-xs text-danger-600`. |

### 3.3 Espaciado, radio y elevación

- **Espaciado**: utilidades Tailwind (`space-y-*`, `gap-*`, `px-*`, `py-*`).
  Densidad CRM cómoda pero eficiente — padding de card `p-5`/`p-6`, celdas de
  tabla `px-4 py-3`, gaps de grid `gap-4`/`gap-6`.
- **Radios** (`borderRadius` del config): tarjetas y paneles → `rounded-xl`;
  botones/inputs/badges → `rounded-lg`; modales → `rounded-2xl`; pills → `rounded-full`.
- **Sombras en capas** (`boxShadow` del config) — esto es lo que saca al sistema
  del plano:

  | Clase | Uso |
  |-------|-----|
  | `shadow-xs` | Borde elevado mínimo (inputs, chips). |
  | `shadow-soft` | **Tarjetas/paneles por defecto** (dos capas suaves). |
  | `shadow-md` | Hover de tarjeta interactiva, KPI destacado. |
  | `shadow-lifted` | Drawers, popovers, dropdowns. |
  | `shadow-overlay` | Modales / diálogos centrados. |
  | `shadow-focus` | Anillo de foco azul (`0 0 0 3px rgba(24,144,255,.25)`). |

- **Micro-interacciones**: `transition-colors`/`transition` con duración por
  defecto 150 ms; hover de fila de tabla (`hover:bg-slate-50`); elevación al
  hover (`hover:shadow-md`); animaciones `animate-fade-in` / `animate-scale-in`
  para overlays. Todo respeta `prefers-reduced-motion` (apagado en `globals.css`).
- **Foco accesible**: `focus-visible` global en `[data-app-surface]` aplica el
  anillo azul; los componentes pueden reforzar con `focus-visible:ring-2`.

### 3.4 Resumen de tokens Tailwind

| Categoría | Tokens |
|-----------|--------|
| Tonos | `primary` `success` `info` `warning` `danger` `secondary` (rampas `50→900`) |
| Neutros | `slate-*` (alias `secondary-*`) |
| Superficies | `surface-DEFAULT` `surface-muted` `surface-card` |
| Marca | `brand-dark` `brand-accent` (solo logo) |
| Fuentes | `font-sans` (Inter) · `font-display` (Montserrat) |
| Tamaños | `text-caption` … `text-4xl` |
| Radios | `rounded-md` `lg` `xl` `2xl` `full` |
| Sombras | `shadow-xs` `soft` `md` `lifted` `overlay` `focus` |
| Animaciones | `animate-fade-in` `animate-scale-in` `animate-shimmer` |

`preflight` está **desactivado** (`tailwind.config.js`) para no chocar con el
reset de Bootstrap. La UI nueva normaliza vía clases utilitarias; la tipografía
Inter, el suavizado y el foco accesible se aplican desde `globals.css` sobre
`.pc-container` / `[data-app-surface]`.

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

- **Familia única**: **Tabler Icons** (SVG vía webfont). Sintaxis siempre
  `<i className="ti ti-{nombre}" aria-hidden="true"></i>`. **Nunca emojis** como
  iconos.
- **Tamaños canónicos**: `text-base` (16px) en acciones de fila, `text-lg`/`text-xl`
  en headers de card y triggers, `text-2xl` en KPIs/empty states. Un icono y un
  solo significado consistente en toda la app (ver tabla abajo).
- **Accesibilidad**: iconos decorativos llevan `aria-hidden="true"` y van junto a
  texto. Los botones icon-only exigen `aria-label` (o `title`) descriptivo — sin
  excepción en la columna de **Acciones** de las tablas.
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

## 6. Librería de componentes (`components/ui/`)

> **Decisión vigente (2026-06-10):** se **reintroduce** `frontend/src/components/ui/`
> como librería curada, tipada y accesible (antes prohibida en CLAUDE.md §6; la
> regla se revirtió). Es la pieza central del lenguaje CRM: encapsula tokens,
> variantes y estados para que las pantallas se compongan con primitivas
> consistentes en vez de repetir Tailwind inline. Tailwind sigue siendo **puro**
> (sin Bootstrap) dentro de los componentes.

**Reglas de la librería**

- Tailwind puro, sin clases Bootstrap (`btn`, `card`, `form-control`, `col-*`,
  `pc-*`, `badge bg-*`, …).
- Tipados en TypeScript estricto; props con valores por defecto sensatos.
- Accesibles: `focus-visible`, `aria-*`, roles correctos, `disabled`/`aria-busy`
  en estado loading, `prefers-reduced-motion` respetado por las animaciones.
- Variantes derivadas de los tokens de §3 (los seis tonos, sombras en capas,
  radios `xl`). Sin colores hardcodeados.
- Una sola fuente de iconos (Tabler) con `aria-hidden`/`aria-label` según §5.
- Composición sobre configuración: preferir `children` y subcomponentes a
  cascadas de props booleanas.

### 6.1 Catálogo

El catálogo se construye en fases (ver `PLAN_frontend_ux.md`). Contrato de cada
componente:

**Primitivos (`Fase 1`)**

| Componente | Props clave | Variantes / notas |
|------------|-------------|-------------------|
| `Button` | `variant`, `size`, `loading`, `leftIcon`/`rightIcon`, `as`/`href` | `variant`: `primary` `secondary` `ghost` `danger` `subtle`; `size`: `sm` `md` `lg`. `loading` muestra spinner y aplica `aria-busy`/`disabled`. |
| `IconButton` | `icon`, `label` (obligatorio → `aria-label`), `variant`, `size` | Icon-only accesible; `tooltip` opcional. |
| `Input` / `Field` | `label`, `hint`, `error`, `leftIcon`, `required` | `Field` envuelve label + control + hint/error con `aria-describedby`/`aria-invalid`. |
| `Textarea` | `label`, `hint`, `error`, `rows` | Mismo contrato que `Field`. |
| `Select` | `label`, `options`, `error`, `placeholder` | Nativo estilizado; chevron Tabler. |
| `Checkbox` / `Switch` | `label`, `checked`, `onChange` | `Switch` con transición 150 ms y `role="switch"`. |
| `Badge` | `tone`, `size`, `dot` | `tone`: los seis + `neutral`. Pill `bg-{tono}-50 text-{tono}-700 ring-{tono}-200`. |
| `Avatar` | `src`, `name` (iniciales fallback), `size` | Tamaños `xs→lg`; círculo; `alt` desde `name`. |
| `Spinner` | `size`, `label` | `role="status"`, `aria-label`. |
| `Skeleton` | `className`, `lines` | Usa `.skeleton-shimmer`; respeta motion-reduce. |
| `Tooltip` | `content`, `side` | Hover/focus, `role="tooltip"`. |

**Compuestos (`Fase 2`)**

| Componente | Props clave | Notas |
|------------|-------------|-------|
| `Card` | `padding`, `header`, `footer` | `rounded-xl border-slate-200 bg-white shadow-soft`; subcomponentes `Card.Header` / `Card.Body` / `Card.Footer`. |
| `PageHeader` | `title`, `subtitle`, `actions`, `backHref` | Encabezado inline de página (título `text-2xl` + CTA). |
| `DataTable` | `columns`, `rows`, `loading`, `empty`, `onSort`, `rowKey` | Header `bg-slate-50` sticky, hover de fila, estados loading (skeleton) / empty (`EmptyState`), columna de acciones. |
| `Pagination` | `page`, `pageCount`, `total`, `onChange` | Resumen textual + ventana ±2; `aria-current` en página activa. |
| `Modal` / `Dialog` | `open`, `onClose`, `title`, `size` | Focus-trap, cierre con `Esc`/overlay, `shadow-overlay`, `animate-scale-in`, `role="dialog"` `aria-modal`. |
| `DropdownMenu` | `trigger`, `items`, `align` | React-controlado (sin Bootstrap JS), un solo abierto, navegable por teclado, `shadow-lifted`. |
| `Tabs` | `tabs`, `value`, `onChange` | `role="tablist"`, foco por flechas. |
| `EmptyState` | `icon`, `title`, `description`, `action` | Icono Tabler grande + copy centrado + CTA opcional. |
| `Toast` | `tone`, `title`, `description`, `duration` | Feedback no bloqueante; `aria-live="polite"`. |
| `SearchFilters` | `search`, `onSearch`, children (filtros) | Buscador con icono + filtros compactos dentro de la card. |
| `FormSection` | `title`, `description`, children | Agrupa campos con título y separador. |
| `KpiCard` | `label`, `value`, `icon`, `tone`, `progress`, `trend` | Tarjeta KPI del dashboard (overline + cifra `tabular-nums` + chip de icono + barra opcional). |
| `StatusPill` | `tone`, `label` | Atajo de `Badge` para estados de dominio (Activo/Vencido/Disponible…). |
| `ImageUpload` / `AvatarUpload` | `value`, `onChange`, `onRemove` | **Opcional** (`Fase 4`): preview, quitar, drag&drop; fallback a iniciales en avatar. |

### 6.2 Patrones de composición de referencia

Mientras se construye el catálogo, estos son los patrones canónicos que cada
componente encapsula (se conservan como contrato visual):

- **Encabezado de página** (`PageHeader`): `flex` responsivo con `h1 text-2xl
  font-bold text-slate-900` + subtítulo `text-sm text-slate-500` y CTA primaria
  a la derecha.
- **Card** (`Card`): `rounded-xl border border-slate-200 bg-white shadow-soft`;
  header `border-b border-slate-100 px-5 py-3`; cuerpo `p-5`/`p-6`.
- **Inputs y filtros** (`Field`/`SearchFilters`): borde `slate-200`, fondo claro,
  foco con anillo `primary`; buscador con icono absoluto a la izquierda; filtros
  dentro de la card, arriba de la tabla.
- **Tabla** (`DataTable`): `min-w-full divide-y divide-slate-100 text-sm`, header
  `bg-slate-50` `text-caption uppercase`, hover de fila `hover:bg-slate-50`,
  estados loading (skeleton) y empty (`EmptyState`), paginación al pie.
- **KPI card** (`KpiCard`): overline `text-caption uppercase text-slate-400` +
  cifra `text-3xl font-bold text-{tono}-600 tabular-nums` + chip de icono con
  `ring-1` + barra de progreso opcional.

### 6.3 QuickCard

Atajo navegable del dashboard: superficie `bg-{tono}-50`, icono grande y
etiqueta corta. Útil como shortcut; no reemplaza el menú principal. (Candidato a
absorberse en `KpiCard`/`Card` durante la migración.)

### 6.4 Stepper / Wizard

El wizard de contratos se maqueta con pills circulares Tailwind (sin Bootstrap).
Mantener el orden de pasos: *Datos del contrato → Datos del difunto → Datos de
los responsables → Pago → Verificación*. Candidato a componente `Stepper` si se
reutiliza.

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
3. **No reintroducir Bootstrap en `src/app` o `src/components`**. Las clases `btn`, `card`, `form-control`, `row`, `col-*`, `pc-*`, `badge bg-*` quedan reservadas para assets heredados, no para UI nueva.
4. Tailwind tiene `corePlugins.preflight = false` para no resetear los estilos globales heredados.
5. Tokens compartidos en `tailwind.config.js` (primary `#1890ff`, fuente Inter). Si cambian aquí, sincronizar §3 de este documento.
6. **Tonos**: usar siempre los seis tonos canónicos (`primary`, `success`, `info`, `warning`, `danger`, `secondary`) y neutrales `slate-*` del repo.
7. **Cards**: por defecto `rounded-xl border border-slate-200 bg-white shadow-soft`.
8. **Iconos**: una sola familia visible en componentes propios: Tabler. Mantener el mismo icono para el mismo significado (ver tabla §5).
9. **Páginas Client**: marcar con `'use client'` cuando usen `useState`, `useEffect` o hooks de cliente. La mayor parte de la UI actual es client-rendered.
10. **Librería de componentes**: la UI nueva se compone con `components/ui/` (ver §6). Si un patrón no existe aún en la librería y se repite 3+ veces, créalo allí (Tailwind puro, tipado, accesible) en vez de duplicar inline.
11. **Estilos inline**: aceptables solo para valores puntuales (por ejemplo ancho de barra de progreso). Si se repite, moverlo a utilidades o componente.
12. **Spinner inicial**: respetar los 500 ms de `loader-bg`; no añadir loaders globales adicionales.

---

## 13. Mapa de archivos clave

| Archivo | Contenido |
|---------|-----------|
| `frontend/src/app/layout.tsx` | Carga de fuentes (Inter + Public Sans), CSS global, scripts, atributos del preset. |
| `frontend/src/app/globals.css` | Tipografía Inter + foco accesible + skeleton + `prefers-reduced-motion` para la app. |
| `frontend/src/components/ui/` | Librería de componentes CRM (Tailwind puro, tipada, accesible). Ver §6. |
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
- [ ] Compón con `components/ui/` (§6); no duplicar Tailwind inline si existe el componente.
- [ ] No introduzcas clases Bootstrap en la UI nueva.
- [ ] Tonos solo dentro del set canónico (los seis).
- [ ] Iconos Tabler con el significado de la tabla §5 (`aria-hidden`/`aria-label`).
- [ ] Profundidad: tarjetas con `shadow-soft` + `rounded-xl`; hover en filas/acciones.
- [ ] Estados: loading (skeleton) / vacío (`EmptyState`) / error cubiertos.
- [ ] Foco visible (`focus-visible`) y `prefers-reduced-motion` respetados.
- [ ] Listados: 15 por página, búsqueda/filtros inline, paginación inline.
- [ ] Formularios: layout `lg:grid-cols-3`, alertas dentro del form, botones Cancelar + Guardar al pie.
- [ ] Si introduces un patrón nuevo repetido, créalo en `components/ui/`.
