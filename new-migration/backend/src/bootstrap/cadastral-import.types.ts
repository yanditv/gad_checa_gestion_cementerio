export type CadastralRecord = {
  excelId: string;
  rawVaultNumber: string;
  deceasedName: string;
  vaultType: string;
  blockName: string;
  contractDate?: Date;
  expirationDate?: Date;
  isOwned: boolean;
  isLeased: boolean;
  representativeName: string;
  contactNumber: string;
  email: string;
  notes: string;
};

export type CreateImportedContractParams = {
  vaultId: string;
  deceasedId: string;
  responsiblePartyId: string;
  startDate: Date;
  endDate: Date;
  notes: string;
  adminUserId: string;
};