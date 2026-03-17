import * as path from 'path';
import { CadastralRecord } from './cadastral-import.types';

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));

export const CADASTRAL_IMPORT_SOURCE = 'cadastral-import';
export const DEFAULT_BLOCK_NAME = 'General Block';
export const DEFAULT_VAULT_TYPE = 'Vault';
export const DEFAULT_CONTRACT_YEARS = 5;
export const DEFAULT_INSTALLMENT_COUNT = 5;
export const DEFAULT_VAULT_AMOUNT = 240;

const TARGET_SHEET_NAMES = ['tabla nichos', 'tabla tumulos', 'tabla bovedas', 'nichos', 'tumulos', 'bovedas'];

export function resolveCadastralExcelPath(configuredPath?: string): string {
  const defaultPath = path.resolve(process.cwd(), '../gad_checa_gestion_cementerio/CATASTRO_FINAL.xlsx');
  return configuredPath ? path.resolve(configuredPath) : defaultPath;
}

export function isTargetWorksheet(sheetName: string, headerRow: unknown[]): boolean {
  const normalizedHeader = headerRow
    .map((cell) => stringifyCell(cell).toLowerCase())
    .join('|');
  const normalizedSheetName = sheetName.toLowerCase().replace(/[_-]/g, ' ').trim();

  return TARGET_SHEET_NAMES.some(
    (targetSheetName) =>
      normalizedHeader.includes(targetSheetName) || normalizedSheetName.includes(targetSheetName),
  );
}

export function extractCadastralRecord(row: unknown[]): CadastralRecord {
  return {
    excelId: stringifyCell(row[0]),
    rawVaultNumber: stringifyCell(row[1]),
    deceasedName: stringifyCell(row[2]),
    vaultType: stringifyCell(row[3]) || DEFAULT_VAULT_TYPE,
    blockName: stringifyCell(row[4]) || DEFAULT_BLOCK_NAME,
    contractDate: parseDate(row[5]),
    expirationDate: parseDate(row[6]),
    isOwned: isTrueValue(row[7]),
    isLeased: isTrueValue(row[8]),
    representativeName: stringifyCell(row[10]),
    contactNumber: stringifyCell(row[11]),
    email: stringifyCell(row[12]),
    notes: stringifyCell(row[13]),
  };
}

export function isLikelyHeaderRow(row: unknown[]): boolean {
  const probe = [row[0], row[1], row[2]]
    .map((value) => stringifyCell(value).toLowerCase())
    .join('|');

  return (
    probe.includes('id') ||
    probe.includes('number') ||
    probe.includes('deceased') ||
    probe.includes('type')
  );
}

export function resolveBlockName(rawBlockName: string, vaultType: string, previousBlockName: string): string {
  const trimmedBlockName = rawBlockName.trim();
  if (!trimmedBlockName) {
    return previousBlockName || `Block ${vaultType || 'General'}`;
  }

  const normalizedBlockName = trimmedBlockName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalizedBlockName.startsWith('logico ')) {
    return previousBlockName || `Block ${vaultType || 'General'}`;
  }

  return trimmedBlockName;
}

export function isOccupiedRecord(record: CadastralRecord): boolean {
  return Boolean(record.deceasedName) || record.isOwned || record.isLeased;
}

export function getContractDates(record: CadastralRecord): { startDate: Date; endDate: Date } {
  const startDate = record.contractDate ?? new Date();
  const endDate = record.expirationDate ?? addYears(startDate, DEFAULT_CONTRACT_YEARS);
  return { startDate, endDate };
}

export function splitFullName(fullName: string, fallbackFirstName: string, fallbackLastName: string) {
  const [firstName, ...remainingNames] = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: firstName || fallbackFirstName,
    lastName: remainingNames.join(' ') || fallbackLastName,
  };
}

export function buildMigrationId(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `MIG${Math.abs(hash % 1000000)
    .toString()
    .padStart(6, '0')}`;
}

export function addYears(date: Date, years: number): Date {
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + years);
  return nextDate;
}

export function calculateMonthCount(startDate: Date, endDate: Date): number {
  return Math.max(
    1,
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()),
  );
}

export function getVaultNumber(record: CadastralRecord): string {
  return record.rawVaultNumber || record.excelId || `VAULT-${Date.now()}`;
}

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(EXCEL_EPOCH.getTime() + value * 24 * 60 * 60 * 1000);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const stringValue = stringifyCell(value);
  if (!stringValue) return undefined;

  const normalized = stringValue.replace(/\s+/g, '');
  const dayMonthYearMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (dayMonthYearMatch) {
    const [, dayRaw, monthRaw, yearRaw] = dayMonthYearMatch;
    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
    const parsed = new Date(year, month - 1, day);

    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  const parsed = new Date(stringValue);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isTrueValue(value: unknown): boolean {
  return ['x', 'yes', '1', 'true'].includes(stringifyCell(value).toLowerCase());
}