export const CONTRACT_CREATION_PAYMENT_TYPES = ['Cash', 'Transfer', 'Bank'] as const;
export const DEFAULT_CONTRACT_MONTH_COUNT = 5;
export const CONTRACT_NUMBER_OWNER_CODE = 'GADCHECA';

export const CONTRACT_NUMBER_PREFIX = {
  default: 'CTR',
  niche: 'NCH',
  tomb: 'TML',
  renewal: 'RNV',
} as const;

export type ContractTypeKey = Exclude<keyof typeof CONTRACT_NUMBER_PREFIX, 'renewal'>;