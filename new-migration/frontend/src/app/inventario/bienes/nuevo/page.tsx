'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Check,
  ClipboardList,
  CircleDollarSign,
  Clock,
  Info,
  Package,
  Receipt,
  Tag,
  UserCheck,
} from 'lucide-react';
import {
  inventarioBienesApi,
  inventarioCategoriasApi,
  inventarioCustodiosApi,
} from '@/lib/api';
import {
  Button,
  Card,
  DatePicker,
  FormSection,
  ImageUpload,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';

const ESTADOS_CONSERVACION = [
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'malo', label: 'Malo' },
];

interface FormState {
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  serie: string;
  fechaAdquisicion: string;
  valorAdquisicion: string;
  fuenteFinanciamiento: string;
  estadoConservacion: string;
  ubicacion: string;
  valorResidual: string;
  vidaUtilMesesOverride: string;
  categoriaId: string;
  custodioId: string;
}

const INITIAL: FormState = {
  codigo: '',
  descripcion: '',
  marca: '',
  modelo: '',
  serie: '',
  fechaAdquisicion: '',
  valorAdquisicion: '',
  fuenteFinanciamiento: '',
  estadoConservacion: 'bueno',
  ubicacion: '',
  valorResidual: '',
  vidaUtilMesesOverride: '',
  categoriaId: '',
  custodioId: '',
};

function toOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

export default function NuevoBienPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormState>(INITIAL);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [custodios, setCustodios] = useState<{ id: number; nombre: string }[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const categoriaSeleccionada = categorias.find((c) => c.id === Number(formData.categoriaId));
  const custodioSeleccionado = custodios.find((c) => c.id === Number(formData.custodioId));

  useEffect(() => {
    inventarioCategoriasApi
      .findAll()
      .then((rows) => setCategorias(rows ?? []))
      .catch(() => undefined);
    inventarioCustodiosApi
      .findAll()
      .then((rows) => setCustodios(rows ?? []))
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoriaId) {
      setError('Debe seleccionar una categoría.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const creado = await inventarioBienesApi.create({
        codigo: toOptional(formData.codigo),
        descripcion: formData.descripcion.trim(),
        marca: toOptional(formData.marca),
        modelo: toOptional(formData.modelo),
        serie: toOptional(formData.serie),
        fechaAdquisicion: formData.fechaAdquisicion,
        valorAdquisicion: Number(formData.valorAdquisicion),
        fuenteFinanciamiento: toOptional(formData.fuenteFinanciamiento),
        estadoConservacion: formData.estadoConservacion,
        ubicacion: toOptional(formData.ubicacion),
        valorResidual: formData.valorResidual.trim()
          ? Number(formData.valorResidual)
          : undefined,
        vidaUtilMesesOverride: formData.vidaUtilMesesOverride.trim()
          ? Number(formData.vidaUtilMesesOverride)
          : undefined,
        categoriaId: Number(formData.categoriaId),
        custodioId: formData.custodioId ? Number(formData.custodioId) : undefined,
      });
      // El bien ya quedó creado; la foto es opcional y tolerante a fallos.
      if (fotoFile && creado?.id) {
        try {
          await inventarioBienesApi.uploadFoto(creado.id, fotoFile);
        } catch {
          /* no-op: el bien se creó; la foto puede subirse luego desde la ficha */
        }
      }
      router.push('/inventario/bienes');
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el bien');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Nuevo bien"
        subtitle="Registrar (dar de alta) un bien institucional en el inventario."
        backHref="/inventario/bienes"
        icon={<Package className="h-5 w-5" strokeWidth={2} aria-hidden="true" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          padding="none"
          className="lg:col-span-2"
          header={<Card.Title icon={<ClipboardList className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>Datos del bien</Card.Title>}
        >
          <form onSubmit={handleSubmit} className="space-y-6 px-5">
            {error && (
              <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-inset ring-danger-200">
                {error}
              </div>
            )}
            <FormSection divided={false}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Código (placa)"
                  placeholder="Se autogenera si se deja vacío"
                  value={formData.codigo}
                  onChange={(e) => set('codigo', e.target.value)}
                />
                <Select
                  label="Categoría"
                  required
                  placeholder="Seleccione…"
                  value={formData.categoriaId}
                  onChange={(e) => set('categoriaId', e.target.value)}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Descripción"
                  required
                  wrapperClassName="sm:col-span-2"
                  placeholder="Computadora de escritorio HP"
                  value={formData.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                />
                <Input
                  label="Marca"
                  placeholder="HP"
                  value={formData.marca}
                  onChange={(e) => set('marca', e.target.value)}
                />
                <Input
                  label="Modelo"
                  placeholder="ProDesk 600 G6"
                  value={formData.modelo}
                  onChange={(e) => set('modelo', e.target.value)}
                />
                <Input
                  label="Serie"
                  placeholder="SN-123456"
                  value={formData.serie}
                  onChange={(e) => set('serie', e.target.value)}
                />
                <Select
                  label="Estado de conservación"
                  value={formData.estadoConservacion}
                  onChange={(e) => set('estadoConservacion', e.target.value)}
                  options={ESTADOS_CONSERVACION}
                />
              </div>
            </FormSection>
            <FormSection title="Fotografía" icon={<Camera className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
              <ImageUpload
                shape="square"
                label="Foto (opcional)"
                hint="JPG, PNG o WEBP, máx. 5 MB"
                onChange={setFotoFile}
              />
            </FormSection>
            <FormSection
              title="Adquisición y depreciación"
              description="Datos contables del bien (CGE 406-03)."
              icon={<Receipt className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePicker
                  label="Fecha de adquisición"
                  required
                  value={formData.fechaAdquisicion}
                  onChange={(v) => set('fechaAdquisicion', v)}
                />
                <Input
                  label="Valor de adquisición"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="850.00"
                  value={formData.valorAdquisicion}
                  onChange={(e) => set('valorAdquisicion', e.target.value)}
                />
                <Input
                  label="Fuente de financiamiento"
                  placeholder="Recursos propios"
                  value={formData.fuenteFinanciamiento}
                  onChange={(e) => set('fuenteFinanciamiento', e.target.value)}
                />
                <Input
                  label="Ubicación"
                  placeholder="Secretaría"
                  value={formData.ubicacion}
                  onChange={(e) => set('ubicacion', e.target.value)}
                />
                <Input
                  label="Valor residual (override)"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Por defecto: % de la categoría"
                  value={formData.valorResidual}
                  onChange={(e) => set('valorResidual', e.target.value)}
                />
                <Input
                  label="Vida útil en meses (override)"
                  type="number"
                  min="1"
                  placeholder="Por defecto: vida útil de la categoría"
                  value={formData.vidaUtilMesesOverride}
                  onChange={(e) => set('vidaUtilMesesOverride', e.target.value)}
                />
              </div>
            </FormSection>

            <FormSection title="Responsable" icon={<UserCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>
              <Select
                label="Custodio"
                wrapperClassName="sm:max-w-sm"
                value={formData.custodioId}
                onChange={(e) => set('custodioId', e.target.value)}
              >
                <option value="">Sin custodio</option>
                {custodios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </FormSection>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 pb-5">
              <Button
                variant="secondary"
                onClick={() => router.push('/inventario/bienes')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
                leftIcon={<Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              >
                Guardar
              </Button>
            </div>
          </form>
        </Card>

        <Card
          padding="none"
          className="self-start"
          header={<Card.Title icon={<Info className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}>Información</Card.Title>}
        >
          <div className="space-y-4 p-5 text-sm text-slate-600">
            <div className="rounded-lg border border-primary-100 bg-primary-50/70 p-3">
              <div className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" strokeWidth={2} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {formData.descripcion.trim() || 'Bien sin descripción'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {formData.codigo.trim() || 'El código se autogenera al guardar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Tag className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Categoría
                </div>
                <p className="mt-2 truncate font-semibold text-slate-800">
                  {categoriaSeleccionada?.nombre || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <UserCheck className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Custodio
                </div>
                <p className="mt-2 truncate font-semibold text-slate-800">
                  {custodioSeleccionado?.nombre || 'Sin asignar'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <CircleDollarSign className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Valor
                </div>
                <p className="mt-2 font-semibold text-slate-800">
                  {formatCurrency(formData.valorAdquisicion)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Clock className="h-4 w-4 text-slate-500" strokeWidth={2} aria-hidden="true" />
                  Fecha
                </div>
                <p className="mt-2 font-semibold text-slate-800">
                  {formData.fechaAdquisicion || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                Al guardar se crea automáticamente un movimiento de
                <strong className="text-slate-700"> alta</strong> en el historial.
              </p>
              <p>
                La depreciación usa la vida útil y el valor residual de la categoría,
                salvo que indiques valores override.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
