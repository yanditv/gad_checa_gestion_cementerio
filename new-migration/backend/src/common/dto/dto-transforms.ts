export function trimString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.trim();
}

export function trimOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function normalizeEmail(value: unknown) {
  const trimmedValue = trimString(value);

  if (typeof trimmedValue !== 'string') {
    return trimmedValue;
  }

  return trimmedValue.toLowerCase();
}

export function normalizeOptionalEmail(value: unknown) {
  const trimmedValue = trimOptionalString(value);

  if (typeof trimmedValue !== 'string') {
    return trimmedValue;
  }

  return trimmedValue.toLowerCase();
}

export function toOptionalBoolean(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue.length === 0) {
      return undefined;
    }

    if (['true', '1', 'yes', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  return value;
}

export function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return value;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : value;
}

export function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return undefined;
  }

  return toNumber(value);
}

export function toTrimmedStringArray(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const normalizedValues = value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter(Boolean);

    return normalizedValues.length > 0 ? normalizedValues : undefined;
  }

  if (typeof value === 'string') {
    const normalizedValues = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return normalizedValues.length > 0 ? normalizedValues : undefined;
  }

  return value;
}