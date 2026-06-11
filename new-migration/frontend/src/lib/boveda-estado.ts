export interface ContratoInfo {
  id?: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface EstadoBoveda {
  label: string;
  color: string;
  bg: string;
}

const TONES = {
  disponible: { label: 'Disponible', color: 'bg-green-500', bg: 'bg-green-50 ring-green-200 text-green-700' },
  ocupada: { label: 'Ocupada', color: 'bg-red-500', bg: 'bg-red-50 ring-red-200 text-red-700' },
  porLiberar: { label: 'Por liberar', color: 'bg-yellow-400', bg: 'bg-yellow-50 ring-yellow-200 text-yellow-700' },
} as const;

export function getEstadoBoveda(contratos: ContratoInfo[] | undefined | null): EstadoBoveda {
  if (!contratos || contratos.length === 0) return TONES.disponible;

  const now = new Date();
  const vigente = contratos.find((c) => !c.fechaFin || new Date(c.fechaFin) >= now);

  if (vigente) {
    const fechaFin = vigente.fechaFin ? new Date(vigente.fechaFin) : null;
    if (fechaFin && (fechaFin.getTime() - now.getTime()) < 90 * 24 * 60 * 60 * 1000) {
      return TONES.porLiberar;
    }
    return TONES.ocupada;
  }

  return TONES.porLiberar;
}
