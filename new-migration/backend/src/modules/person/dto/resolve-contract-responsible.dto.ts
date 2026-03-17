export class ResolveContractResponsibleDto {
  id?: string | null;
  isExisting!: boolean;
  relationship?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  identificationNumber?: string | null;
  identificationType?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}