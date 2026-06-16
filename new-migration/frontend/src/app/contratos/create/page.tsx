'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FilePlus,
  Info,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button, DatePicker, Modal } from '@/components/ui';
import { contratosApi, personasApi } from '@/lib/api';
import { clearWizard, loadWizard, saveWizard } from '@/lib/wizardStorage';

const WIZARD_KEY = 'contrato:v1';

type PlanCuota = 'unico' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

const PLAN_OPTIONS: { value: PlanCuota; label: string }[] = [
  { value: 'unico', label: 'Pago único (al contado)' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual (paridad legado)' },
];

function addMonths(dateValue: string, months: number): string {
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const stepTitles = [
  'Datos del contrato',
  'Datos del difunto',
  'Datos de los responsables',
  'Pago',
  'Verificación',
];

type ResponsableWizard = {
  localId: string;
  id?: number;
  esExistente: boolean;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  parentesco?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

type CuotaWizard = {
  numero: number;
  monto: number;
  fechaVencimiento: string;
  pagada: boolean;
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addYears(dateValue: string, years: number) {
  const date = new Date(dateValue);
  date.setFullYear(date.getFullYear() + years);
  return toInputDate(date);
}

function getYearDiff(fechaInicio: string, fechaFin: string) {
  if (!fechaInicio || !fechaFin) return 0;
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  if (end <= start) return 0;
  let years = end.getFullYear() - start.getFullYear();
  const endBeforeStartAnniversary =
    end.getMonth() < start.getMonth() ||
    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());
  if (endBeforeStartAnniversary) years -= 1;
  return years > 0 ? years : 0;
}

// =============================================================================
// Tailwind UI primitives (locales)
// =============================================================================

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
    >
      {children}
    </label>
  );
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:bg-slate-50 disabled:text-slate-600 read-only:bg-slate-50';

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft ${className}`}
    >
      {title && (
        <header className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

// =============================================================================
// Página
// =============================================================================

export default function CreateContratoPage() {
  const router = useRouter();
  const today = toInputDate(new Date());

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [metadata, setMetadata] = useState<any>({
    descuentos: [],
    bancos: [],
    tiposPago: ['Efectivo', 'Transferencia', 'Banco'],
  });
  const [personas, setPersonas] = useState<any[]>([]);
  const [responsableSearch, setResponsableSearch] = useState('');
  const [showResponsableModal, setShowResponsableModal] = useState(false);
  const [showBovedaModal, setShowBovedaModal] = useState(false);
  const [bovedaSearch, setBovedaSearch] = useState('');
  const [bovedaTipo, setBovedaTipo] = useState('');
  const [bovedasDisponibles, setBovedasDisponibles] = useState<any[]>([]);
  const [bovedasMeta, setBovedasMeta] = useState<any>(null);
  const [bovedasPage, setBovedasPage] = useState(1);
  const [bovedasPageInput, setBovedasPageInput] = useState('1');
  const [showContratosModal, setShowContratosModal] = useState(false);
  const [contratoSearch, setContratoSearch] = useState('');
  const [contratosList, setContratosList] = useState<any[]>([]);
  const [contratosMeta, setContratosMeta] = useState<any>(null);
  const [contratosPage, setContratosPage] = useState(1);

  const [newResponsable, setNewResponsable] = useState<ResponsableWizard>({
    localId: '',
    esExistente: false,
    nombres: '',
    apellidos: '',
    tipoIdentificacion: 'Cedula',
    numeroIdentificacion: '',
    telefono: '',
    email: '',
    direccion: '',
    parentesco: '',
    fechaInicio: today,
    fechaFin: '',
  });

  const [form, setForm] = useState({
    contrato: {
      numeroSecuencial: '',
      bovedaId: 0,
      bovedaLabel: '',
      fechaInicio: today,
      fechaFin: addYears(today, 5),
      numeroDeMeses: 5,
      montoTotal: 0,
      observaciones: '',
      esRenovacion: false,
      contratoOrigenId: null as number | null,
      contratoRelacionadoId: null as number | null,
    },
    difunto: {
      numeroIdentificacion: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      fechaFallecimiento: '',
      descuentoId: 0,
    },
    responsables: [] as ResponsableWizard[],
    pago: {
      plan: 'anual' as PlanCuota,
      tipoPago: 'Efectivo',
      numeroComprobante: '',
      monto: 0,
      fechaPago: today,
      bancoId: '',
      observacion: '',
      cuotasSeleccionadas: [] as number[],
    },
    cuotas: [] as CuotaWizard[],
  });

  const descuentoSeleccionado =
    metadata.descuentos?.find(
      (item: any) => item.id === Number(form.difunto.descuentoId),
    ) || null;
  const descuentoPorcentaje = descuentoSeleccionado
    ? Number(descuentoSeleccionado.porcentaje || 0)
    : 0;
  const montoDescuento =
    Number(form.contrato.montoTotal || 0) * (descuentoPorcentaje / 100);
  const montoFinalConDescuento =
    Number(form.contrato.montoTotal || 0) - montoDescuento;

  const hydrated = useRef(false);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [createMetadata, personasResult, numeroPreview] = await Promise.all([
          contratosApi.getCreateMetadata(),
          personasApi.findPage({ page: 1, limit: 100, search: '' }),
          contratosApi.getNumeroSecuencial(),
        ]);

        setMetadata(createMetadata);
        setPersonas(personasResult.data || []);

        const draft = loadWizard<typeof form>(WIZARD_KEY);
        if (draft) {
          setForm(draft);
          setForm((prev) => ({
            ...prev,
            contrato: {
              ...prev.contrato,
              numeroSecuencial:
                numeroPreview.numeroSecuencial || prev.contrato.numeroSecuencial,
            },
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            contrato: {
              ...prev.contrato,
              numeroSecuencial: numeroPreview.numeroSecuencial || '',
              numeroDeMeses: Number(
                createMetadata.numeroDeMesesDefault || prev.contrato.numeroDeMeses || 5,
              ),
              fechaFin: addYears(
                prev.contrato.fechaInicio,
                Number(createMetadata.numeroDeMesesDefault || prev.contrato.numeroDeMeses || 5),
              ),
            },
          }));
        }
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la configuración del formulario');
      } finally {
        hydrated.current = true;
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveWizard(WIZARD_KEY, form);
  }, [form]);

  useEffect(() => {
    setBovedasPageInput(String(bovedasPage));
  }, [bovedasPage]);

  useEffect(() => {
    if (!showBovedaModal) return;
    async function loadBovedasDisponibles() {
      try {
        const result = await contratosApi.getBovedasDisponibles({
          page: bovedasPage,
          limit: 10,
          search: bovedaSearch,
          tipo: bovedaTipo || undefined,
        });
        setBovedasDisponibles(result.data || []);
        setBovedasMeta(result.meta);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la lista de bóvedas');
      }
    }
    loadBovedasDisponibles();
  }, [showBovedaModal, bovedasPage, bovedaSearch, bovedaTipo]);

  async function refreshNumeroSecuencial(bovedaId: number, esRenovacion: boolean) {
    if (!bovedaId) return;
    try {
      const preview = await contratosApi.getNumeroSecuencial(bovedaId, esRenovacion);
      setForm((prev) => ({
        ...prev,
        contrato: {
          ...prev.contrato,
          numeroSecuencial: preview.numeroSecuencial,
          montoTotal: Number(preview.montoTotal || 0),
        },
      }));
    } catch (err: any) {
      console.error('Error refreshing sequential number:', err);
    }
  }

  useEffect(() => {
    if (!showContratosModal) return;
    async function loadContratos() {
      try {
        const result = await contratosApi.findPage({
          page: contratosPage,
          limit: 10,
          search: contratoSearch,
          estado: 'activos',
        });
        setContratosList(result.data || []);
        setContratosMeta(result.meta);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la lista de contratos');
      }
    }
    loadContratos();
  }, [showContratosModal, contratosPage, contratoSearch]);

  useEffect(() => {
    const years = Number(form.contrato.numeroDeMeses) || 0;
    const cuotas = generateCuotas(
      form.pago.plan,
      form.contrato.fechaInicio,
      years,
      Number(form.contrato.montoTotal),
      Number(form.difunto.descuentoId),
    );

    setForm((prev) => {
      const cuotasSeleccionadasPrev = new Set(prev.pago.cuotasSeleccionadas);
      const cuotasSeleccionadas = cuotas
        .filter(
          (cuota) =>
            cuotasSeleccionadasPrev.size === 0 ||
            cuotasSeleccionadasPrev.has(cuota.numero),
        )
        .map((cuota) => cuota.numero);
      const monto = cuotas
        .filter((cuota) => cuotasSeleccionadas.includes(cuota.numero))
        .reduce((sum, cuota) => sum + cuota.monto, 0);

      return {
        ...prev,
        cuotas,
        pago: { ...prev.pago, cuotasSeleccionadas, monto },
      };
    });
  }, [
    form.pago.plan,
    form.contrato.fechaInicio,
    form.contrato.numeroDeMeses,
    form.contrato.montoTotal,
    form.difunto.descuentoId,
  ]);

  function generateCuotas(
    plan: PlanCuota,
    fechaInicio: string,
    years: number,
    montoTotal: number,
    descuentoId: number,
  ): CuotaWizard[] {
    if (!fechaInicio || years <= 0 || montoTotal <= 0) return [];

    const descuento = metadata.descuentos?.find((item: any) => item.id === descuentoId);
    const porcentaje = descuento ? Number(descuento.porcentaje) : 0;
    const montoFinal = round2(montoTotal - montoTotal * (porcentaje / 100));

    if (plan === 'unico') {
      return [
        { numero: 1, monto: montoFinal, fechaVencimiento: fechaInicio, pagada: false },
      ];
    }

    const totalCuotas =
      plan === 'mensual'
        ? years * 12
        : plan === 'trimestral'
          ? years * 4
          : plan === 'semestral'
            ? years * 2
            : years;
    const mesesEntreCuotas =
      plan === 'mensual'
        ? 1
        : plan === 'trimestral'
          ? 3
          : plan === 'semestral'
            ? 6
            : 12;

    const cuotaBase = round2(montoFinal / totalCuotas);
    let acumulado = 0;
    return Array.from({ length: totalCuotas }, (_, index) => {
      const isUltima = index === totalCuotas - 1;
      const monto = isUltima ? round2(montoFinal - acumulado) : cuotaBase;
      acumulado += monto;
      return {
        numero: index + 1,
        monto,
        fechaVencimiento: addMonths(fechaInicio, (index + 1) * mesesEntreCuotas),
        pagada: false,
      };
    });
  }

  async function selectBoveda(boveda: any) {
    try {
      const preview = await contratosApi.getNumeroSecuencial(boveda.id, form.contrato.esRenovacion);
      setForm((prev) => ({
        ...prev,
        contrato: {
          ...prev.contrato,
          bovedaId: boveda.id,
          bovedaLabel: `${boveda.numero} - ${boveda.bloque?.nombre || 'Sin bloque'}`,
          numeroSecuencial: preview.numeroSecuencial,
          montoTotal: Number(preview.montoTotal || 0),
        },
      }));
      setShowBovedaModal(false);
    } catch (err: any) {
      setError(err.message || 'No se pudo seleccionar la bóveda');
    }
  }

  async function selectContratoOrigen(origenContrato: any) {
    try {
      const fullContrato = await contratosApi.findOne(origenContrato.id);
      const difunto = fullContrato.difunto ?? {};
      const responsables = (fullContrato.responsables ?? []).map((r: any) => ({
        localId: `existing-${r.responsable.persona.id}`,
        id: r.responsable.persona.id,
        esExistente: true,
        nombres: r.responsable.persona.nombre,
        apellidos: r.responsable.persona.apellido,
        tipoIdentificacion: r.responsable.persona.tipoIdentificacion || 'Cedula',
        numeroIdentificacion: r.responsable.persona.numeroIdentificacion,
        telefono: r.responsable.persona.telefono || '',
        email: r.responsable.persona.email || '',
        direccion: r.responsable.persona.direccion || '',
        parentesco: r.parentesco || '',
        fechaInicio: today,
        fechaFin: '',
      }));

      const boveda = fullContrato.boveda ?? {};
      const preview = await contratosApi.getNumeroSecuencial(boveda.id, true);

      setForm((prev) => ({
        ...prev,
        contrato: {
          ...prev.contrato,
          bovedaId: boveda.id,
          bovedaLabel: `${boveda.numero} - ${boveda.bloque?.nombre || 'Sin bloque'}`,
          numeroSecuencial: preview.numeroSecuencial,
          montoTotal: Number(preview.montoTotal || 0),
          contratoOrigenId: fullContrato.id,
        },
        difunto: {
          numeroIdentificacion: difunto.numeroIdentificacion || '',
          nombres: difunto.nombre || '',
          apellidos: difunto.apellido || '',
          fechaNacimiento: difunto.fechaNacimiento ? difunto.fechaNacimiento.slice(0, 10) : '',
          fechaFallecimiento: difunto.fechaDefuncion ? difunto.fechaDefuncion.slice(0, 10) : '',
          descuentoId: fullContrato.descuentoId || 0,
        },
        responsables,
      }));
      setShowContratosModal(false);
    } catch (err: any) {
      setError(err.message || 'No se pudo seleccionar el contrato de origen');
    }
  }

  function addExistingResponsable(persona: any) {
    if (form.responsables.some((item) => item.id === persona.id && item.esExistente)) return;
    setForm((prev) => ({
      ...prev,
      responsables: [
        ...prev.responsables,
        {
          localId: `existing-${persona.id}`,
          id: persona.id,
          esExistente: true,
          nombres: persona.nombre,
          apellidos: persona.apellido,
          tipoIdentificacion: persona.tipoIdentificacion,
          numeroIdentificacion: persona.numeroIdentificacion,
          telefono: persona.telefono || '',
          email: persona.email || '',
          direccion: persona.direccion || '',
          parentesco: '',
          fechaInicio: today,
          fechaFin: '',
        },
      ],
    }));
  }

  function addNewResponsable() {
    if (!newResponsable.nombres || !newResponsable.apellidos || !newResponsable.numeroIdentificacion) {
      setError('Complete al menos nombres, apellidos y número de identificación del responsable');
      return;
    }
    setForm((prev) => ({
      ...prev,
      responsables: [
        ...prev.responsables,
        { ...newResponsable, localId: `new-${Date.now()}` },
      ],
    }));
    setNewResponsable({
      localId: '',
      esExistente: false,
      nombres: '',
      apellidos: '',
      tipoIdentificacion: 'Cedula',
      numeroIdentificacion: '',
      telefono: '',
      email: '',
      direccion: '',
      parentesco: '',
      fechaInicio: today,
      fechaFin: '',
    });
    setShowResponsableModal(false);
  }

  function updateResponsable(localId: string, field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      responsables: prev.responsables.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeResponsable(localId: string) {
    setForm((prev) => ({
      ...prev,
      responsables: prev.responsables.filter((item) => item.localId !== localId),
    }));
  }

  function toggleCuota(numero: number, checked: boolean) {
    setForm((prev) => {
      const cuotasSeleccionadas = checked
        ? [...new Set([...prev.pago.cuotasSeleccionadas, numero])]
        : prev.pago.cuotasSeleccionadas.filter((item) => item !== numero);
      const monto = prev.cuotas
        .filter((cuota) => cuotasSeleccionadas.includes(cuota.numero))
        .reduce((sum, cuota) => sum + cuota.monto, 0);
      return {
        ...prev,
        pago: {
          ...prev.pago,
          cuotasSeleccionadas,
          monto: Number(monto.toFixed(2)),
        },
      };
    });
  }

  function toggleAllCuotas(checked: boolean) {
    setForm((prev) => {
      const cuotasSeleccionadas = checked
        ? prev.cuotas.map((cuota) => cuota.numero)
        : [];
      const monto = checked
        ? prev.cuotas.reduce((sum, cuota) => sum + cuota.monto, 0)
        : 0;
      return {
        ...prev,
        pago: {
          ...prev.pago,
          cuotasSeleccionadas,
          monto: Number(monto.toFixed(2)),
        },
      };
    });
  }

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      if (!form.contrato.bovedaId) return 'Debe seleccionar una bóveda.';
      if (!form.contrato.fechaInicio || !form.contrato.fechaFin)
        return 'Debe definir las fechas del contrato.';
      if (new Date(form.contrato.fechaInicio) >= new Date(form.contrato.fechaFin))
        return 'La fecha de inicio debe ser anterior a la fecha de fin.';
      return '';
    }
    if (currentStep === 1) {
      if (!form.difunto.nombres || !form.difunto.apellidos)
        return 'Debe completar los datos del difunto.';
      if (form.difunto.fechaNacimiento && form.difunto.fechaFallecimiento) {
        if (
          new Date(form.difunto.fechaNacimiento) >=
          new Date(form.difunto.fechaFallecimiento)
        ) {
          return 'La fecha de fallecimiento debe ser posterior a la fecha de nacimiento.';
        }
      }
      return '';
    }
    if (currentStep === 2) {
      if (form.responsables.length === 0) return 'Debe agregar al menos un responsable.';
      return '';
    }
    if (currentStep === 3) {
      if (!form.pago.tipoPago) return 'Debe seleccionar un tipo de pago.';
      if (form.pago.cuotasSeleccionadas.length === 0)
        return 'Debe seleccionar al menos una cuota.';
      return '';
    }
    return '';
  }

  async function handleNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, stepTitles.length - 1));
  }

  async function handleSave() {
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        contrato: {
          bovedaId: Number(form.contrato.bovedaId),
          fechaInicio: form.contrato.fechaInicio,
          numeroDeMeses: Number(form.contrato.numeroDeMeses),
          esRenovacion: !!form.contrato.esRenovacion,
          contratoOrigenId: form.contrato.contratoOrigenId ?? undefined,
          contratoRelacionadoId: form.contrato.contratoRelacionadoId ?? undefined,
          descuentoId: form.difunto.descuentoId ? Number(form.difunto.descuentoId) : undefined,
          observaciones: form.contrato.observaciones || undefined,
        },
        difunto: {
          nombres: form.difunto.nombres,
          apellidos: form.difunto.apellidos,
          numeroIdentificacion: form.difunto.numeroIdentificacion || undefined,
          fechaNacimiento: form.difunto.fechaNacimiento || undefined,
          fechaFallecimiento: form.difunto.fechaFallecimiento || undefined,
        },
        responsables: form.responsables.map((r) => ({
          id: r.esExistente ? r.id : undefined,
          esExistente: r.esExistente,
          nombres: r.nombres,
          apellidos: r.apellidos,
          tipoIdentificacion: r.tipoIdentificacion,
          numeroIdentificacion: r.numeroIdentificacion,
          telefono: r.telefono || undefined,
          email: r.email || undefined,
          direccion: r.direccion || undefined,
          parentesco: r.parentesco || undefined,
        })),
        pago: {
          plan: form.pago.plan,
          tipoPago: form.pago.tipoPago,
          bancoId: form.pago.bancoId ? Number(form.pago.bancoId) : undefined,
          numeroComprobante: form.pago.numeroComprobante || undefined,
          observacion: form.pago.observacion || undefined,
          cuotasSeleccionadas: form.pago.cuotasSeleccionadas,
          fechaPago: form.pago.fechaPago,
        },
      };

      const result = await contratosApi.create(payload);
      clearWizard(WIZARD_KEY);
      router.push(`/contratos/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el contrato');
    } finally {
      setSaving(false);
    }
  }

  const filteredPersonas = personas.filter((persona) => {
    const fullName = `${persona.nombre || ''} ${persona.apellido || ''}`.toLowerCase();
    const search = responsableSearch.toLowerCase();
    return (
      fullName.includes(search) ||
      String(persona.numeroIdentificacion || '').toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    if (descuentoPorcentaje >= 100) {
      setForm((prev) => ({
        ...prev,
        pago: { ...prev.pago, numeroComprobante: 'S/N' },
      }));
    }
  }, [descuentoPorcentaje]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Banner superior */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft">
        <div className="flex flex-col items-start justify-between gap-3 px-5 py-4 text-white sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <FilePlus className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">
                Contrato de servicio de arrendamiento
              </h2>
              <p className="text-sm text-white/80">
                {form.contrato.numeroSecuencial || 'Generando número de contrato…'}
              </p>
            </div>
          </div>
          <Link
            href="/contratos"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
          >
            <List className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Ver todos
          </Link>
        </div>
      </div>

      {/* Stepper */}
      <Card>
        <ol className="flex flex-wrap gap-3">
          {stepTitles.map((title, index) => {
            const completed = index < step;
            const active = index === step;
            return (
              <li
                key={title}
                className="flex min-w-[170px] flex-1 items-center gap-2"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    completed
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {completed ? (
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${
                    active ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {title}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Banner de renovación */}
      {form.contrato.esRenovacion && form.contrato.contratoOrigenId ? (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          <p className="font-semibold">
            <Info
              className="mr-1 inline h-4 w-4 align-text-bottom"
              strokeWidth={2}
              aria-hidden="true"
            />{' '}
            Este es un contrato de renovación
          </p>
          <p className="mt-1">
            Renueva el contrato original con ID:{' '}
            <strong>{form.contrato.contratoOrigenId}</strong>
          </p>
        </div>
      ) : null}

      {/* Errores / loading */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          Cargando configuración del contrato…
        </div>
      ) : null}

      <Card title={stepTitles[step]}>
        {step === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Label htmlFor="contrato-numero-secuencial">Número secuencial</Label>
              <input
                id="contrato-numero-secuencial"
                className={INPUT_CLS}
                value={form.contrato.numeroSecuencial}
                readOnly
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="contrato-boveda">Bóveda</Label>
              <div className="flex gap-2">
                <input
                  id="contrato-boveda"
                  className={`${INPUT_CLS} flex-1`}
                  value={form.contrato.bovedaLabel || 'Seleccionar bóveda'}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowBovedaModal(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                >
                  <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Buscar
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2 py-2">
              <input
                id="contrato-es-renovacion"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                checked={form.contrato.esRenovacion}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setForm((prev) => ({
                    ...prev,
                    contrato: {
                      ...prev.contrato,
                      esRenovacion: checked,
                      ...(!checked ? { contratoOrigenId: null } : {}),
                    },
                  }));
                  if (form.contrato.bovedaId) {
                    await refreshNumeroSecuencial(form.contrato.bovedaId, checked);
                  }
                }}
              />
              <label
                htmlFor="contrato-es-renovacion"
                className="text-sm font-medium text-slate-700 select-none cursor-pointer"
              >
                ¿Es una renovación de contrato?
              </label>
            </div>

            {form.contrato.esRenovacion && (
              <div className="sm:col-span-2">
                <Label htmlFor="contrato-origen">Contrato anterior (Origen)</Label>
                <div className="flex gap-2">
                  <input
                    id="contrato-origen"
                    className={`${INPUT_CLS} flex-1`}
                    value={
                      form.contrato.contratoOrigenId
                        ? `Contrato #${form.contrato.contratoOrigenId}`
                        : 'Seleccionar contrato anterior'
                    }
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setShowContratosModal(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                  >
                    <Search className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Buscar contrato
                  </button>
                </div>
              </div>
            )}

            <DatePicker
              id="contrato-fecha-inicio"
              label="Fecha de inicio"
              value={form.contrato.fechaInicio}
              onChange={(fechaInicio) =>
                setForm((prev) => ({
                  ...prev,
                  contrato: {
                    ...prev.contrato,
                    fechaInicio,
                    numeroDeMeses: getYearDiff(fechaInicio, prev.contrato.fechaFin),
                  },
                }))
              }
            />
            <DatePicker
              id="contrato-fecha-fin"
              label="Fecha de fin"
              value={form.contrato.fechaFin}
              onChange={(fechaFin) =>
                setForm((prev) => ({
                  ...prev,
                  contrato: {
                    ...prev.contrato,
                    fechaFin,
                    numeroDeMeses: getYearDiff(prev.contrato.fechaInicio, fechaFin),
                  },
                }))
              }
            />

            <div>
              <Label htmlFor="contrato-numero-anos">Número de años</Label>
              <input
                id="contrato-numero-anos"
                type="number"
                className={INPUT_CLS}
                value={form.contrato.numeroDeMeses}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="contrato-monto-total">Monto total</Label>
              <input
                id="contrato-monto-total"
                type="number"
                step="0.01"
                className={INPUT_CLS}
                value={form.contrato.montoTotal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contrato: { ...prev.contrato, montoTotal: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contrato-observaciones">Observaciones</Label>
              <textarea
                id="contrato-observaciones"
                className={INPUT_CLS}
                rows={3}
                value={form.contrato.observaciones}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contrato: { ...prev.contrato, observaciones: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="difunto-cedula">Identificación</Label>
              <input
                id="difunto-cedula"
                className={INPUT_CLS}
                value={form.difunto.numeroIdentificacion}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    difunto: { ...prev.difunto, numeroIdentificacion: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="difunto-nombres">Nombres</Label>
              <input
                id="difunto-nombres"
                className={INPUT_CLS}
                value={form.difunto.nombres}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    difunto: { ...prev.difunto, nombres: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="difunto-apellidos">Apellidos</Label>
              <input
                id="difunto-apellidos"
                className={INPUT_CLS}
                value={form.difunto.apellidos}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    difunto: { ...prev.difunto, apellidos: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="difunto-descuento">Descuento</Label>
              <select
                id="difunto-descuento"
                className={INPUT_CLS}
                value={form.difunto.descuentoId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    difunto: { ...prev.difunto, descuentoId: Number(e.target.value) },
                  }))
                }
              >
                <option value={0}>Sin descuento</option>
                {metadata.descuentos?.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} — {Number(item.porcentaje).toFixed(2)}%
                  </option>
                ))}
              </select>
            </div>
            <DatePicker
              id="difunto-fecha-nacimiento"
              label="Fecha de nacimiento"
              value={form.difunto.fechaNacimiento}
              onChange={(fechaNacimiento) =>
                setForm((prev) => ({
                  ...prev,
                  difunto: { ...prev.difunto, fechaNacimiento },
                }))
              }
            />
            <DatePicker
              id="difunto-fecha-defuncion"
              label="Fecha de defunción"
              value={form.difunto.fechaFallecimiento}
              onChange={(fechaFallecimiento) =>
                setForm((prev) => ({
                  ...prev,
                  difunto: { ...prev.difunto, fechaFallecimiento },
                }))
              }
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Buscar responsable existente…"
                  value={responsableSearch}
                  onChange={(e) => setResponsableSearch(e.target.value)}
                  className={INPUT_CLS.replace('px-3', 'pl-9 pr-3')}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowResponsableModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                Nuevo
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="rounded-lg border border-slate-200 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">
                    Personas existentes
                  </h4>
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {filteredPersonas.map((persona) => (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => addExistingResponsable(persona)}
                        className="w-full rounded-md border border-slate-200 bg-slate-50/40 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 hover:border-primary-200"
                      >
                        <div className="font-medium text-slate-800">
                          {persona.nombre} {persona.apellido}
                        </div>
                        <div className="text-xs text-slate-500">
                          {persona.numeroIdentificacion}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-lg border border-slate-200 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">
                    Responsables agregados
                  </h4>
                  {form.responsables.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-600">
                      No hay responsables agregados.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {form.responsables.map((r) => (
                        <div
                          key={r.localId}
                          className="rounded-lg border border-slate-200 bg-slate-50/40 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-slate-800">
                                {r.nombres} {r.apellidos}
                              </div>
                              <div className="text-xs text-slate-500">
                                {r.tipoIdentificacion}: {r.numeroIdentificacion}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeResponsable(r.localId)}
                              className="rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
                              title="Quitar"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                            </button>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div>
                              <Label>Parentesco</Label>
                              <input
                                className={INPUT_CLS}
                                value={r.parentesco || ''}
                                onChange={(e) =>
                                  updateResponsable(
                                    r.localId,
                                    'parentesco',
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <DatePicker
                              label="Fecha inicio"
                              value={r.fechaInicio || ''}
                              onChange={(iso) =>
                                updateResponsable(r.localId, 'fechaInicio', iso)
                              }
                            />
                            <DatePicker
                              label="Fecha fin"
                              value={r.fechaFin || ''}
                              onChange={(iso) =>
                                updateResponsable(r.localId, 'fechaFin', iso)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            {Number(form.difunto.descuentoId) > 0 ? (
              <div className="rounded-lg border border-info-200 bg-info-50 p-3 text-sm text-info-700">
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-4">
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-info-600/70">
                      Descuento
                    </span>
                    <strong>{descuentoPorcentaje.toFixed(2)}%</strong>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-info-600/70">
                      Antes descuento
                    </span>
                    <strong>
                      ${Number(form.contrato.montoTotal || 0).toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-info-600/70">
                      Descontado
                    </span>
                    <strong>${montoDescuento.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wide text-info-600/70">
                      Total a pagar
                    </span>
                    <strong>${montoFinalConDescuento.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="pago-plan">Plan de cuotas</Label>
                <select
                  id="pago-plan"
                  className={INPUT_CLS}
                  value={form.pago.plan}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pago: {
                        ...prev.pago,
                        plan: e.target.value as PlanCuota,
                        cuotasSeleccionadas: [],
                      },
                    }))
                  }
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-600">
                  Define cuántas cuotas se generan y su frecuencia.
                </p>
              </div>
              <div>
                <Label htmlFor="pago-tipo">Tipo de pago</Label>
                <select
                  id="pago-tipo"
                  className={INPUT_CLS}
                  value={form.pago.tipoPago}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pago: { ...prev.pago, tipoPago: e.target.value },
                    }))
                  }
                >
                  {metadata.tiposPago?.map((tipo: string) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pago-comprobante">Número de comprobante</Label>
                <input
                  id="pago-comprobante"
                  className={INPUT_CLS}
                  value={form.pago.numeroComprobante}
                  readOnly={descuentoPorcentaje >= 100}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pago: { ...prev.pago, numeroComprobante: e.target.value },
                    }))
                  }
                />
              </div>
              <DatePicker
                id="pago-fecha"
                label="Fecha de pago"
                value={form.pago.fechaPago}
                onChange={(fechaPago) =>
                  setForm((prev) => ({
                    ...prev,
                    pago: { ...prev.pago, fechaPago },
                  }))
                }
              />
              <div className="sm:col-span-2">
                <Label htmlFor="pago-monto">Monto a cobrar (seleccionadas)</Label>
                <input
                  id="pago-monto"
                  className={INPUT_CLS}
                  value={form.pago.monto.toFixed(2)}
                  readOnly
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">
                  Cuotas por pagar
                </h4>
                <div className="text-sm font-semibold text-slate-700">
                  Total: ${form.pago.monto.toFixed(2)}
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="w-12 px-3 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                          checked={
                            form.cuotas.length > 0 &&
                            form.pago.cuotasSeleccionadas.length === form.cuotas.length
                          }
                          onChange={(e) => toggleAllCuotas(e.target.checked)}
                        />
                      </th>
                      <th className="px-3 py-2">Cuota</th>
                      <th className="px-3 py-2">Fecha de vencimiento</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.cuotas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-sm text-slate-600"
                        >
                          No hay cuotas generadas. Verifica monto, fechas y plan.
                        </td>
                      </tr>
                    ) : (
                      form.cuotas.map((c) => (
                        <tr key={c.numero}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-300"
                              checked={form.pago.cuotasSeleccionadas.includes(c.numero)}
                              onChange={(e) =>
                                toggleCuota(c.numero, e.target.checked)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-700">
                            Cuota {c.numero}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {c.fechaVencimiento}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
                              ${c.monto.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200">
              <header className="border-b border-slate-100 px-4 py-2">
                <strong className="text-sm text-slate-700">Contrato</strong>
              </header>
              <div className="space-y-1.5 p-4 text-sm">
                <p>
                  <strong>Número:</strong> {form.contrato.numeroSecuencial}
                </p>
                <p>
                  <strong>Bóveda:</strong> {form.contrato.bovedaLabel}
                </p>
                <p>
                  <strong>Vigencia:</strong> {form.contrato.fechaInicio} al{' '}
                  {form.contrato.fechaFin}
                </p>
                <p>
                  <strong>Subtotal:</strong> ${Number(form.contrato.montoTotal).toFixed(2)}
                </p>
                {descuentoPorcentaje > 0 && (
                  <p className="text-green-600 font-medium">
                    <strong>Descuento ({descuentoPorcentaje}%):</strong> -${montoDescuento.toFixed(2)}
                  </p>
                )}
                <p className="text-slate-900 font-bold">
                  <strong>Total Neto:</strong> ${montoFinalConDescuento.toFixed(2)}
                </p>
                <p>
                  <strong>Observaciones:</strong>{' '}
                  {form.contrato.observaciones || '—'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <header className="border-b border-slate-100 px-4 py-2">
                <strong className="text-sm text-slate-700">Difunto</strong>
              </header>
              <div className="space-y-1.5 p-4 text-sm">
                <p>
                  <strong>Nombre:</strong> {form.difunto.nombres}{' '}
                  {form.difunto.apellidos}
                </p>
                <p>
                  <strong>Identificación:</strong>{' '}
                  {form.difunto.numeroIdentificacion || '—'}
                </p>
                <p>
                  <strong>Nacimiento:</strong>{' '}
                  {form.difunto.fechaNacimiento || '—'}
                </p>
                <p>
                  <strong>Defunción:</strong>{' '}
                  {form.difunto.fechaFallecimiento || '—'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 lg:col-span-1">
              <header className="border-b border-slate-100 px-4 py-2">
                <strong className="text-sm text-slate-700">Responsables</strong>
              </header>
              <div className="space-y-2 p-4 text-sm">
                {form.responsables.length === 0 ? (
                  <p className="text-slate-600">Sin responsables.</p>
                ) : (
                  form.responsables.map((r) => (
                    <div
                      key={r.localId}
                      className="rounded border border-slate-200 bg-slate-50/40 p-2"
                    >
                      <div className="font-medium text-slate-800">
                        {r.nombres} {r.apellidos}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.numeroIdentificacion}
                        {r.parentesco ? ` · ${r.parentesco}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 lg:col-span-1">
              <header className="border-b border-slate-100 px-4 py-2">
                <strong className="text-sm text-slate-700">Pago</strong>
              </header>
              <div className="space-y-1.5 p-4 text-sm">
                <p>
                  <strong>Plan:</strong>{' '}
                  {PLAN_OPTIONS.find((p) => p.value === form.pago.plan)?.label}
                </p>
                <p>
                  <strong>Tipo:</strong> {form.pago.tipoPago}
                </p>
                <p>
                  <strong>Comprobante:</strong>{' '}
                  {form.pago.numeroComprobante || '—'}
                </p>
                <p>
                  <strong>Fecha:</strong> {form.pago.fechaPago}
                </p>
                <p>
                  <strong>Total cobrado:</strong> ${form.pago.monto.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer del card */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            disabled={step === 0 || saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Atrás
          </button>
          {step < stepTitles.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Siguiente{' '}
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {saving ? 'Guardando…' : 'Finalizar y guardar'}
            </button>
          )}
        </div>
      </Card>

      {/* Modal: Buscar contrato anterior */}
      <Modal
        open={showContratosModal}
        title="Seleccionar contrato anterior"
        size="lg"
        onClose={() => setShowContratosModal(false)}
      >
        <div className="space-y-3">
          <div>
            <input
              className={INPUT_CLS}
              placeholder="Buscar por número o difunto…"
              value={contratoSearch}
              onChange={(e) => {
                setContratosPage(1);
                setContratoSearch(e.target.value);
              }}
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2">Secuencial</th>
                  <th className="px-3 py-2">Bóveda</th>
                  <th className="px-3 py-2">Difunto</th>
                  <th className="px-3 py-2">Fin Contrato</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contratosList.length > 0 ? (
                  contratosList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-700">
                        {c.numeroSecuencial}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {c.boveda?.numero || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {c.difunto ? `${c.difunto.nombre} ${c.difunto.apellido}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-EC') : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => selectContratoOrigen(c)}
                          className="rounded-md bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600"
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-slate-400"
                    >
                      No se encontraron contratos activos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {contratosMeta && contratosMeta.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Página <strong>{contratosMeta.page}</strong> de{' '}
                <strong>{contratosMeta.totalPages}</strong>
              </span>
              <div className="inline-flex gap-1">
                <button
                  type="button"
                  disabled={!contratosMeta.hasPrevPage}
                  onClick={() => setContratosPage(contratosMeta.page - 1)}
                  className="rounded-md border border-slate-200 px-2 py-1 enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!contratosMeta.hasNextPage}
                  onClick={() => setContratosPage(contratosMeta.page + 1)}
                  className="rounded-md border border-slate-200 px-2 py-1 enabled:hover:bg-slate-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Buscar bóveda */}
      <Modal
        open={showBovedaModal}
        onClose={() => setShowBovedaModal(false)}
        title="Seleccionar bóveda"
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <input
                  className={INPUT_CLS}
                  placeholder="Buscar por número…"
                  value={bovedaSearch}
                  onChange={(e) => {
                    setBovedasPage(1);
                    setBovedaSearch(e.target.value);
                  }}
                />
              </div>
              <div>
                <select
                  className={INPUT_CLS}
                  value={bovedaTipo}
                  onChange={(e) => {
                    setBovedasPage(1);
                    setBovedaTipo(e.target.value);
                  }}
                >
                  <option value="">Todos los tipos</option>
                  <option value="Boveda">Bóveda</option>
                  <option value="Nicho">Nicho</option>
                  <option value="Tumulo">Tumulo</option>
                </select>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    <th className="px-3 py-2">Número</th>
                    <th className="px-3 py-2">Bloque</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Propietario</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bovedasDisponibles.length > 0 ? (
                    bovedasDisponibles.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-700">
                          {b.numero}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {b.bloque?.nombre || '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {b.tipo || '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {b.propietario?.persona
                            ? `${b.propietario.persona.nombre} ${b.propietario.persona.apellido}`
                            : 'Sin propietario'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button size="sm" onClick={() => selectBoveda(b)}>
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-sm text-slate-600"
                      >
                        No se encontraron bóvedas disponibles.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {bovedasMeta && bovedasMeta.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span>
                    Página <strong>{bovedasMeta.page}</strong> de{' '}
                    <strong>{bovedasMeta.totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Ir a:</span>
                    <input
                      type="number"
                      min={1}
                      max={bovedasMeta.totalPages}
                      value={bovedasPageInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBovedasPageInput(val);
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed) && parsed >= 1 && parsed <= bovedasMeta.totalPages) {
                          setBovedasPage(parsed);
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseInt(bovedasPageInput, 10);
                        if (isNaN(parsed) || parsed < 1 || parsed > bovedasMeta.totalPages) {
                          setBovedasPageInput(String(bovedasPage));
                        }
                      }}
                      className="w-12 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-center text-xs text-slate-700 placeholder:text-slate-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    disabled={!bovedasMeta.hasPrevPage}
                    onClick={() => setBovedasPage(bovedasMeta.page - 1)}
                    className="rounded-md border border-slate-200 px-2 py-1 enabled:hover:bg-slate-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={!bovedasMeta.hasNextPage}
                    onClick={() => setBovedasPage(bovedasMeta.page + 1)}
                    className="rounded-md border border-slate-200 px-2 py-1 enabled:hover:bg-slate-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
        </div>
      </Modal>

      {/* Modal: Nuevo responsable */}
      <Modal
        open={showResponsableModal}
        onClose={() => setShowResponsableModal(false)}
        title="Crear nuevo responsable"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowResponsableModal(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={addNewResponsable}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="responsable-nombres">Nombres</Label>
                <input
                  id="responsable-nombres"
                  className={INPUT_CLS}
                  value={newResponsable.nombres}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({ ...prev, nombres: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="responsable-apellidos">Apellidos</Label>
                <input
                  id="responsable-apellidos"
                  className={INPUT_CLS}
                  value={newResponsable.apellidos}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({
                      ...prev,
                      apellidos: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="responsable-tipo-identificacion">
                  Tipo de identificación
                </Label>
                <select
                  id="responsable-tipo-identificacion"
                  className={INPUT_CLS}
                  value={newResponsable.tipoIdentificacion}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({
                      ...prev,
                      tipoIdentificacion: e.target.value,
                    }))
                  }
                >
                  <option value="Cedula">Cédula</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>
              <div>
                <Label htmlFor="responsable-numero-identificacion">
                  Número de identificación
                </Label>
                <input
                  id="responsable-numero-identificacion"
                  className={INPUT_CLS}
                  value={newResponsable.numeroIdentificacion}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({
                      ...prev,
                      numeroIdentificacion: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="responsable-telefono">Teléfono</Label>
                <input
                  id="responsable-telefono"
                  className={INPUT_CLS}
                  value={newResponsable.telefono}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({
                      ...prev,
                      telefono: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="responsable-email">Email</Label>
                <input
                  id="responsable-email"
                  className={INPUT_CLS}
                  value={newResponsable.email}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="responsable-direccion">Dirección</Label>
                <input
                  id="responsable-direccion"
                  className={INPUT_CLS}
                  value={newResponsable.direccion}
                  onChange={(e) =>
                    setNewResponsable((prev) => ({
                      ...prev,
                      direccion: e.target.value,
                    }))
                  }
                />
              </div>
        </div>
      </Modal>
    </div>
  );
}
