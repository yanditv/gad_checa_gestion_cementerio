import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { DashboardLayout } from '@/components/DashboardLayout';

export const metadata: Metadata = {
  title: 'Gad Checa - Gestión Cementerio',
  description: 'Sistema de gestión del cementerio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Public+Sans:wght@300;400;500;600;700&display=swap"
          id="main-font-link"
        />
        <link rel="stylesheet" href="/fonts/tabler-icons.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabler-icons@2.1.0/fonts/tabler-icons.min.css" />
        <link rel="stylesheet" href="/fonts/feather.css" />
        <link rel="stylesheet" href="/fonts/fontawesome.css" />
        <link rel="stylesheet" href="/fonts/material.css" />
        {/* style.css / style-preset.css (Able Pro · Bootstrap) eliminados:
            sus utilidades homónimas (.p-5, .mb-3, …) con !important pisaban
            a las de Tailwind. El reset lo provee el preflight de Tailwind. */}
        <link rel="stylesheet" href="/css/site.css" />
        <link rel="icon" href="/images/favicon.svg" type="image/x-icon" />
      </head>
      <body
        data-app-surface=""
        data-pc-preset="preset-1"
        data-pc-direction="ltr"
        data-pc-theme="light"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Saltar al contenido principal
        </a>

        <DashboardLayout>
          {children}
        </DashboardLayout>

        <Script src="/js/plugins/apexcharts.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
