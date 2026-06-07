'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from './DashboardLayout';

type NavItem =
  | { type: 'item'; label: string; href: string; icon: string; roles?: string[]; match?: 'exact' | 'prefix' | 'contracts-list' }
  | { type: 'section'; label: string };

const navigation: NavItem[] = [
  { type: 'item', label: 'Dashboard', href: '/', icon: 'ti-dashboard', match: 'exact' },

  { type: 'section', label: 'Contratos' },
  { type: 'item', label: 'Nuevo', href: '/contratos/create', icon: 'ti-folder-plus', match: 'prefix' },
  { type: 'item', label: 'Listado', href: '/contratos', icon: 'ti-list-search', match: 'contracts-list' },

  { type: 'section', label: 'Gestión' },
  { type: 'item', label: 'Personas', href: '/personas', icon: 'ti-users' },
  { type: 'item', label: 'Bloques', href: '/bloques', icon: 'ti-building' },
  { type: 'item', label: 'Bóvedas', href: '/bovedas', icon: 'ti-box-multiple' },
  { type: 'item', label: 'Cobros', href: '/cobros', icon: 'ti-coin' },
  { type: 'item', label: 'Difuntos', href: '/difuntos', icon: 'ti-cloud' },

  { type: 'section', label: 'Administración' },
  { type: 'item', label: 'Mi Cuenta', href: '/cuenta', icon: 'ti-user' },
  {
    type: 'item',
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: 'ti-users',
    roles: ['Admin', 'Administrador'],
  },
  {
    type: 'item',
    label: 'Roles',
    href: '/admin/roles',
    icon: 'ti-shield-check',
    roles: ['Admin', 'Administrador'],
  },

  { type: 'section', label: 'Configuración' },
  { type: 'item', label: 'Ajustes', href: '/configuracion', icon: 'ti-settings' },
  { type: 'item', label: 'Reportes', href: '/reportes', icon: 'ti-chart-dots' },

  { type: 'section', label: 'Ayuda' },
  { type: 'item', label: 'Manual de usuario', href: '/manual', icon: 'ti-book' },
];

interface SidebarProps {
  user: SessionUser | null;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: Extract<NavItem, { type: 'item' }>) => {
    const href = item.href;
    const mode = item.match ?? 'prefix';
    if (!pathname) return false;
    if (mode === 'exact') return pathname === href;
    if (mode === 'contracts-list') {
      if (pathname === '/contratos') return true;
      return /^\/contratos\/\d+(?:\/.*)?$/.test(pathname);
    }
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  const userRoles = user?.roles ?? [];

  const visibleNav = navigation.filter((item) => {
    if (item.type === 'section') return true;
    if (!item.roles) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Menú principal"
      >
        {/* Branding */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
          <Link
            href="/"
            className="flex items-center gap-1"
            onClick={onClose}
          >
            <img
              src="/logo.png"
              alt="Cementerio GAD Checa"
              className="h-10 w-10 object-contain"
            />
            <span className="font-display text-xl font-bold lowercase tracking-tight text-brand-dark">
              cementer<span className="text-brand-accent">io</span>
            </span>
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="m-0 list-none space-y-0.5 p-0">
            {visibleNav.map((item, idx) => {
              if (item.type === 'section') {
                return (
                  <li
                    key={`s-${idx}`}
                    className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:mt-0"
                  >
                    {item.label}
                  </li>
                );
              }
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    {...(active ? { 'aria-current': 'page' as const } : {})}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary-50 font-semibold text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center text-base ${
                        active
                          ? 'text-primary-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <i className={`ti ${item.icon}`} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-primary-500"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer del sidebar */}
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>v1.0.0</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Operativo
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
