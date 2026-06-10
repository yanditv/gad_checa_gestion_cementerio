/**
 * Tailwind coexiste con el template Able Pro (Bootstrap) durante la
 * migración gradual. Para evitar conflictos de reset:
 *   - `corePlugins.preflight = false` → Tailwind no aplica reset global.
 *     Las pantallas Bootstrap conservan su reset propio; las pantallas
 *     migradas a Tailwind aplican normalización vía clases utilitarias.
 *
 * Tokens alineados con DESIGN.md §3.1 (Bootstrap preset-1 azul `#1890ff`).
 * Cuando migremos a Stitch + Tailwind puro, este archivo es la fuente única
 * de verdad para tonos, espaciados y fuentes.
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
        success: {
          DEFAULT: '#1de9b6',
          50: '#e8fbf4',
          200: '#b6f5e2',
          500: '#1de9b6',
          600: '#16ba92',
          700: '#108b6d',
        },
        info: {
          DEFAULT: '#13c2c2',
          50: '#e8f9f9',
          200: '#b0ebeb',
          500: '#13c2c2',
          600: '#0f9b9b',
          700: '#0b7474',
        },
        warning: {
          DEFAULT: '#faad14',
          50: '#fff8e8',
          200: '#fde7a8',
          500: '#faad14',
          600: '#c88a10',
          700: '#96680c',
        },
        danger: {
          DEFAULT: '#ff4d4f',
          50: '#fff1f1',
          200: '#ffc9ca',
          500: '#ff4d4f',
          600: '#cc3e3f',
          700: '#993e3f',
        },
        // Acento institucional del logo (cementerio + GAD).
        brand: {
          dark: '#1a237e',
          accent: '#43a047',
        },
        surface: {
          DEFAULT: '#fafafb',
          card: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Public Sans', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'Public Sans', 'sans-serif'],
      },
      boxShadow: {
        // Sombras del template para mantener coherencia visual.
        soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
        lifted: '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
