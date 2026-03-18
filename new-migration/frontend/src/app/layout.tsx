import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { DashboardLayout } from '@/components/DashboardLayout';
import { QueryProvider } from '@/components/providers/QueryProvider';

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap"
          id="main-font-link"
        />
        <link rel="stylesheet" href="/fonts/tabler-icons.min.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tabler-icons@2.1.0/fonts/tabler-icons.min.css" />
        <link rel="stylesheet" href="/fonts/feather.css" />
        <link rel="stylesheet" href="/fonts/fontawesome.css" />
        <link rel="stylesheet" href="/fonts/material.css" />
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/style-preset.css" />
        <link rel="stylesheet" href="/css/site.css" />
        <link rel="icon" href="/images/favicon.svg" type="image/x-icon" />
      </head>
      <body data-pc-preset="preset-1" data-pc-direction="ltr" data-pc-theme="light">
        <div className="loader-bg">
          <div className="loader-track">
            <div className="loader-fill"></div>
          </div>
        </div>

        <QueryProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </QueryProvider>

        <Script src="/js/plugins/popper.min.js" strategy="afterInteractive" />
        <Script src="/js/plugins/simplebar.min.js" strategy="afterInteractive" />
        <Script src="/js/plugins/bootstrap.min.js" strategy="afterInteractive" />
        <Script src="/js/plugins/apexcharts.min.js" strategy="afterInteractive" />
        <Script src="/js/plugins/feather.min.js" strategy="afterInteractive" />
        <Script src="/js/pcoded.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
