export class Contrato {
  id?: string;
  sequentialNumber?: string;
  startDate?: Date;
  endDate?: Date | null;
  monthCount?: number;
  totalAmount?: number;
  isActive?: boolean;
  notes?: string;
  isRenewal?: boolean;
  renewalCount?: number;
  signedDocumentPath?: string;
  vaultId?: string;
  deceasedId?: string;
  sourceContractId?: string | null;
  relatedContractId?: string | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  deletedByUserId?: string | null;

  constructor(data?: Partial<Contrato>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static create(data: Partial<Contrato>): Contrato {
    return new Contrato(data);
  }
}