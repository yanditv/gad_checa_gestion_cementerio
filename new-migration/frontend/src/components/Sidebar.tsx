'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { label: 'Dashboard', href: '/', icon: 'ti-dashboard' },
  { section: 'Contratos' },
  { label: 'Nuevo', href: '/contratos/create', icon: 'ti-folder-plus' },
  { label: 'Listado', href: '/contratos', icon: 'ti-list-search' },
  { section: 'Gestión' },
  { label: 'Personas', href: '/personas', icon: 'ti-users' },
  { label: 'Bloques', href: '/bloques', icon: 'ti-building' },
  { label: 'Bóvedas', href: '/bovedas', icon: 'ti-box-multiple' },
  { label: 'Cobros', href: '/cobros', icon: 'ti-coin' },
  { label: 'Difuntos', href: '/difuntos', icon: 'ti-cloud' },
  { section: 'Administración' },
  { label: 'Mi Cuenta', href: '/cuenta', icon: 'ti-user' },
  { label: 'Gestión de Usuarios', href: '/admin/usuarios', icon: 'ti-users' },
  { label: 'Gestión de Roles', href: '/admin/roles', icon: 'ti-shield-check' },
  { section: 'Configuración' },
  { label: 'Ajustes', href: '/configuracion', icon: 'ti-settings' },
  { label: 'Reportes', href: '/reportes', icon: 'ti-chart-dots' },
  { section: 'Ayuda' },
  { label: 'Manual de Usuario', href: '/manual', icon: 'ti-book' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="pc-sidebar">
      <div className="navbar-wrapper">
        <div className="m-header">
          <Link href="/" className="b-brand text-primary d-flex align-items-center" style={{ gap: '0.1rem' }}>
            <img
              src="/logo.png"
              className="img-fluid logo-lg"
              width={70}
              height={70}
              alt="logo"
              style={{ background: 'none', borderRadius: 0, boxShadow: 'none', objectFit: 'contain' }}
            />
            <span
              className="fw-bold"
              style={{
                fontSize: '1.4rem',
                color: '#1a237e',
                letterSpacing: 0,
                fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
                textTransform: 'lowercase',
              }}
            >
              cementer<span style={{ color: '#43a047' }}>io</span>
            </span>
          </Link>
        </div>
        <div className="navbar-content">
          <ul className="pc-navbar">
            {navigation.map((item, index) => {
              if ('section' in item) {
                return (
                  <li key={index} className="pc-item pc-caption">
                    <label>{item.section}</label>
                    <i className="ti ti-dashboard"></i>
                  </li>
                );
              }
              return (
                <li key={index} className={`pc-item ${isActive(item.href) ? 'active' : ''}`}>
                  <Link href={item.href} className="pc-link">
                    <span className="pc-micon"><i className={`ti ${item.icon}`}></i></span>
                    <span className="pc-mtext">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
