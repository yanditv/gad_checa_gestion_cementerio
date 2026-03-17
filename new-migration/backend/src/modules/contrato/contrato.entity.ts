export class Contrato {
  id?: number;
  sequentialNumber?: string;
  startDate?: Date;
  endDate?: Date | null;
  monthCount?: number;
  totalAmount?: number;
  estado?: boolean;
  notes?: string;
  isRenewal?: boolean;
  renewalCount?: number;
  signedDocumentPath?: string;
  vaultId?: number;
  deceasedId?: number;
  sourceContractId?: number | null;
  relatedContractId?: number | null;
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