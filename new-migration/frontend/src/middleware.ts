import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || 'cementerio_auth';

/**
 * Rutas públicas que no requieren autenticación.
 *   - /auth/*            (login, forgot, reset)
 *   - /api/auth/*        (rutas BFF de auth)
 *   - Recursos estáticos
 */
const PUBLIC_PATHS = ['/auth', '/api/auth'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token) {
    return NextResponse.next();
  }

  // Si no hay token: las rutas /api/* devuelven 401 JSON; las páginas
  // redirigen al login conservando el destino original en `?from=`.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { message: 'No autenticado' },
      { status: 401 },
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = '/auth/login';
  url.search = `?from=${encodeURIComponent(pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

// El `matcher` ignora estáticos para no cargar el middleware en cada asset.
export const config = {
  matcher: [
    /*
     * Todo excepto:
     *   - _next/static, _next/image, favicon
     *   - archivos servidos desde /public (images, css, js, fonts, logo, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|css|js|fonts|logo.png|Manual_de_Usuario.pdf).*)',
  ],
};
