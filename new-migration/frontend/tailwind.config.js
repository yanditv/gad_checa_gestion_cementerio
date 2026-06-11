/**
 * Tailwind coexiste con el template Able Pro (Bootstrap) durante la
 * migración gradual. Para evitar conflictos de reset:
 *   - `corePlugins.preflight = false` → Tailwind no aplica reset global.
 *     Las pantallas Bootstrap conservan su reset propio; las pantallas
 *     migradas a Tailwind aplican normalización vía clases utilitarias.
 *
 * Lenguaje visual: CRM profesional (Linear / HubSpot, pero institucional).
 * Esencia preservada — azul `primary #1890ff`, neutros `slate`, los seis
 * tonos semánticos (primary/success/info/warning/danger/secondary), fuente
 * Inter. Profundidad sutil mediante sombras en capas y radios `xl`.
 *
 * Este archivo es la fuente única de verdad para tonos, sombras, radios,
 * espaciado y tipografía de la UI Tailwind. Sincronizar con DESIGN.md §3.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Acción principal, navegación activa, KPIs financieros.
        primary: {
          DEFAULT: '#1890ff',
          50: '#e8f4ff',
          100: '#d1e9ff',
          200: '#a3d3ff',
          300: '#75bdff',
          400: '#47a7ff',
          500: '#1890ff',
          600: '#1373cc',
          700: '#0e5699',
          800: '#093a66',
          900: '#041d33',
        },
        // Estado positivo: activo, disponible, conectado.
        success: {
          DEFAULT: '#1de9b6',
          50: '#e8fbf4',
          100: '#d2f8ea',
          200: '#b6f5e2',
          300: '#7eeecb',
          400: '#46e7b4',
          500: '#1de9b6',
          600: '#16ba92',
          700: '#108b6d',
          800: '#0a5d49',
          900: '#052e24',
        },
        // Información contextual, segundas acciones.
        info: {
          DEFAULT: '#13c2c2',
          50: '#e8f9f9',
          100: '#d1f3f3',
          200: '#b0ebeb',
          300: '#7fdede',
          400: '#4dd0d0',
          500: '#13c2c2',
          600: '#0f9b9b',
          700: '#0b7474',
          800: '#084e4e',
          900: '#042727',
        },
        // Avisos, alertas, por vencer.
        warning: {
          DEFAULT: '#faad14',
          50: '#fff8e8',
          100: '#fef0c8',
          200: '#fde7a8',
          300: '#fcd673',
          400: '#fbc23e',
          500: '#faad14',
          600: '#c88a10',
          700: '#96680c',
          800: '#644508',
          900: '#322304',
        },
        // Errores, eliminación, vencido, cerrar sesión.
        danger: {
          DEFAULT: '#ff4d4f',
          50: '#fff1f1',
          100: '#ffe0e1',
          200: '#ffc9ca',
          300: '#ffa3a4',
          400: '#ff787a',
          500: '#ff4d4f',
          600: '#cc3e3f',
          700: '#993e3f',
          800: '#661f20',
          900: '#330f10',
        },
        // Acciones neutras: cancelar, volver, datos secundarios.
        // Alias semántico de la escala `slate` para el sexto tono canónico.
        secondary: {
          DEFAULT: '#64748b',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Acento institucional del logo (cementerio + GAD).
        brand: {
          dark: '#1a237e',
          accent: '#43a047',
        },
        // Superficies de la aplicación.
        surface: {
          DEFAULT: '#f8fafc', // fondo de app (slate-50)
          muted: '#f1f5f9', // zona sutilmente hundida (slate-100)
          card: '#ffffff', // tarjetas / paneles
        },
      },
      fontFamily: {
        // Inter como cuerpo del CRM; Public Sans permanece como fallback
        // por compatibilidad con assets del template.
        sans: [
          'Inter',
          'Public Sans',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        display: ['Montserrat', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Escala tipográfica afinada [size, { lineHeight, letterSpacing }].
        caption: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }], // 11px overlines/labels
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.5rem' }], // cuerpo CRM (14px)
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1rem', { lineHeight: '1.6rem' }],
        xl: ['1.125rem', { lineHeight: '1.6rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.85rem', letterSpacing: '-0.01em' }], // título de página
        '3xl': ['1.75rem', { lineHeight: '2.1rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.125rem', { lineHeight: '2.4rem', letterSpacing: '-0.02em' }], // display / KPI grande
      },
      borderRadius: {
        // Radios consistentes; tarjetas y paneles → `xl`.
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        // Sombras en capas (CRM con profundidad sutil, no plano).
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        soft: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)',
        md: '0 2px 4px -1px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
        lifted:
          '0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 12px 24px -4px rgba(15, 23, 42, 0.10)',
        overlay:
          '0 8px 16px -4px rgba(15, 23, 42, 0.12), 0 24px 48px -12px rgba(15, 23, 42, 0.18)',
        // Realce de foco para anillos accesibles.
        focus: '0 0 0 3px rgba(24, 144, 255, 0.25)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in 180ms ease-out',
        'scale-in': 'scale-in 160ms ease-out',
      },
    },
  },
  plugins: [],
};
