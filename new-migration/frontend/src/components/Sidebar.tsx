'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Archive,
  ArrowLeftRight,
  BookOpen,
  Boxes,
  Building2,
  ChartScatter,
  Cloud,
  Coins,
  FileBarChart,
  FolderPlus,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  TextSearch,
  TrendingDown,
  User,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { SessionUser } from './DashboardLayout';

type NavItem =
  | { type: 'item'; label: string; href: string; icon: LucideIcon; roles?: string[]; match?: 'exact' | 'prefix' | 'contracts-list' }
  | { type: 'section'; label: string };

const navigation: NavItem[] = [
  { type: 'item', label: 'Dashboard', href: '/', icon: LayoutDashboard, match: 'exact' },

  { type: 'section', label: 'Contratos' },
  { type: 'item', label: 'Nuevo', href: '/contratos/create', icon: FolderPlus, match: 'prefix' },
  { type: 'item', label: 'Listado', href: '/contratos', icon: TextSearch, match: 'contracts-list' },

  { type: 'section', label: 'Gestión' },
  { type: 'item', label: 'Personas', href: '/personas', icon: Users },
  { type: 'item', label: 'Bloques', href: '/bloques', icon: Building2 },
  { type: 'item', label: 'Bóvedas', href: '/bovedas', icon: Boxes },
  { type: 'item', label: 'Cobros', href: '/cobros', icon: Coins },
  { type: 'item', label: 'Difuntos', href: '/difuntos', icon: Cloud },
  { type: 'item', label: 'Exhumaciones', href: '/exhumaciones', icon: ArrowLeftRight },

  { type: 'section', label: 'Inventario' },
  { type: 'item', label: 'Bienes', href: '/inventario/bienes', icon: Package },
  { type: 'item', label: 'Categorías', href: '/inventario/categorias', icon: Archive },
  { type: 'item', label: 'Custodios', href: '/inventario/custodios', icon: UserCheck },
  { type: 'item', label: 'Depreciación', href: '/inventario/depreciacion', icon: TrendingDown },
  { type: 'item', label: 'Reportes', href: '/inventario/reportes', icon: FileBarChart },

  { type: 'section', label: 'Administración' },
  { type: 'item', label: 'Mi Cuenta', href: '/cuenta', icon: User },
  {
    type: 'item',
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    roles: ['Admin', 'Administrador'],
  },
  {
    type: 'item',
    label: 'Roles',
    href: '/admin/roles',
    icon: ShieldCheck,
    roles: ['Admin', 'Administrador'],
  },

  { type: 'section', label: 'Configuración' },
  { type: 'item', label: 'Ajustes', href: '/configuracion', icon: Settings },
  { type: 'item', label: 'Reportes', href: '/reportes', icon: ChartScatter },

  { type: 'section', label: 'Ayuda' },
  { type: 'item', label: 'Manual de usuario', href: '/manual', icon: BookOpen },
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 transition-transform duration-200 lg:translate-x-0 ${
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
                    className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 first:mt-0"
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
                        ? 'bg-white font-semibold text-primary-700 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center ${
                        active
                          ? 'text-primary-600'
                          : 'text-slate-600 group-hover:text-slate-600'
                      }`}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
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
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
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
