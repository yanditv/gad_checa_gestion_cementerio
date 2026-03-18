import { z } from 'zod';
import { BOVEDA_TYPES, type BlockOption, type CreateBovedaFormValues, type CreateBovedaPayload } from './types';

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value !== '', `${label} es obligatorio`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} debe ser numérico`);

const optionalMoneyString = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      `${label} debe ser un monto válido`,
    );

export const createBovedaFormSchema = z.object({
  numero: z.string().trim().min(1, 'El número de bóveda es obligatorio').max(50, 'El número es demasiado largo'),
  bloqueId: z.string().trim().min(1, 'Seleccione un bloque'),
  tipo: z.enum(BOVEDA_TYPES),
  capacidad: numericString('La capacidad')
    .refine((value) => Number.isInteger(Number(value)), 'La capacidad debe ser un entero')
    .refine((value) => Number(value) > 0, 'La capacidad debe ser mayor a 0'),
  precio: optionalMoneyString('El precio de venta'),
  precioArrendamiento: optionalMoneyString('El precio de arrendamiento'),
  ubicacion: z.string().trim().max(160, 'La ubicación es demasiado larga'),
  observaciones: z.string().trim().max(500, 'Las observaciones son demasiado largas'),
  estado: z.boolean(),
});

export const createBovedaPayloadSchema = createBovedaFormSchema.transform<CreateBovedaPayload>((values) => ({
  number: values.numero.trim(),
  blockId: values.bloqueId,
  type: values.tipo,
  capacity: Number(values.capacidad),
  price: values.precio === '' ? 0 : Number(values.precio),
  rentalPrice: values.precioArrendamiento === '' ? 0 : Number(values.precioArrendamiento),
  location: values.ubicacion.trim() || undefined,
  notes: values.observaciones.trim() || undefined,
  isActive: values.estado,
}));

const rawBlockOptionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  nombre: z.string().optional(),
  description: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  estado: z.boolean().optional(),
  cemeteryId: z.string().nullable().optional(),
  cementerioId: z.string().nullable().optional(),
});

export const blockOptionSchema = rawBlockOptionSchema.transform<BlockOption>((block) => ({
  id: block.id,
  name: block.name ?? block.nombre ?? '',
  description: block.description ?? block.descripcion ?? null,
  isActive: block.isActive ?? block.estado ?? true,
  cemeteryId: block.cemeteryId ?? block.cementerioId ?? null,
}));

export const blockOptionListSchema = z.array(blockOptionSchema);

export function mapCreateBovedaFieldErrors(
  error: z.ZodError,
): Partial<Record<keyof CreateBovedaFormValues, string>> {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    numero: fieldErrors.numero?.[0],
    bloqueId: fieldErrors.bloqueId?.[0],
    tipo: fieldErrors.tipo?.[0],
    capacidad: fieldErrors.capacidad?.[0],
    precio: fieldErrors.precio?.[0],
    precioArrendamiento: fieldErrors.precioArrendamiento?.[0],
    ubicacion: fieldErrors.ubicacion?.[0],
    observaciones: fieldErrors.observaciones?.[0],
    estado: fieldErrors.estado?.[0],
  };
}