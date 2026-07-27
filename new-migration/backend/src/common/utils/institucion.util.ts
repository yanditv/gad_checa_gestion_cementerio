export interface InstitucionPdf {
  nombre: string;
  subtitulo?: string;
  logoKey?: string | null;
}

/**
 * Obtiene el nombre del GAD y del cementerio desde la base de datos para parametrizar PDFs.
 */
export async function getInstitucionPdf(
  prisma: any,
  subtitulo = 'Sistema de Gestión de Cementerio',
): Promise<InstitucionPdf> {
  const [gad, cementerio] = await prisma.$transaction([
    prisma.gADInformacion.findFirst({
      orderBy: { id: 'asc' },
      select: { nombre: true, logo: true },
    }),
    prisma.cementerio.findFirst({
      where: { estado: true },
      orderBy: { id: 'asc' },
      select: { nombre: true },
    }),
  ]);

  const nombre = gad?.nombre?.trim() || cementerio?.nombre?.trim();
  return {
    nombre: nombre || 'GAD Parroquial de Checa',
    subtitulo,
    logoKey: gad?.logo ?? null,
  };
}
