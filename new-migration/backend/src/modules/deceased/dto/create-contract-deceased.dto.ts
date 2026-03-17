export class CreateContractDeceasedDto {
  firstName?: string | null;
  lastName?: string | null;
  identificationNumber?: string | null;
  birthDate?: Date | null;
  deathDate?: Date | null;
  vaultId!: string;
}