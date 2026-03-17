import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import appConfig from '../config/appConfig';
import { CadastralImportPersistenceService } from './cadastral-import.persistence.service';
import {
  extractCadastralRecord,
  getContractDates,
  isLikelyHeaderRow,
  isOccupiedRecord,
  isTargetWorksheet,
  resolveBlockName,
  resolveCadastralExcelPath,
} from './cadastral-import.utils';

@Injectable()
export class CadastralImportService {
  private readonly logger = new Logger(CadastralImportService.name);

  constructor(
    private readonly persistence: CadastralImportPersistenceService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async run(adminUserId: string) {
    const enabled = this.config.cadastralImport.enabled;
    if (!enabled) {
      this.logger.log('Cadastral import disabled (CADASTRAL_IMPORT_ENABLED != 1)');
      return;
    }

    const excelPath = resolveCadastralExcelPath(this.config.cadastralImport.filePath);

    if (!fs.existsSync(excelPath)) {
      this.logger.warn(`Cadastral file not found: ${excelPath}`);
      return;
    }

    const force = this.config.cadastralImport.force;
    const contractCount = await this.persistence.countContracts();
    if (contractCount > 0 && !force) {
      this.logger.log(
        `Cadastral import skipped: ${contractCount} contracts already exist. Use CADASTRAL_IMPORT_FORCE=1 to force reimport.`,
      );
      return;
    }

    if (force) {
      this.logger.warn('Force-clearing existing data before cadastral reimport...');
      await this.persistence.clearExistingData();
    }

    await this.importFromExcel(excelPath, adminUserId);
  }

  private async importFromExcel(excelPath: string, adminUserId: string) {
    this.logger.log(`Starting cadastral import from ${excelPath}`);

    const workbook = XLSX.readFile(excelPath, { cellDates: true });

    let processedRecords = 0;
    let createdContracts = 0;

    for (const sheetName of workbook.SheetNames) {
      let lastResolvedBlockName = '';
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json<any[]>(ws, {
        header: 1,
        blankrows: false,
        raw: false,
      });
      if (!rows.length) continue;

      if (!isTargetWorksheet(sheetName, rows[0] || [])) {
        this.logger.log(`Skipping worksheet: ${sheetName}`);
        continue;
      }

      this.logger.log(`Processing worksheet: ${sheetName} (${rows.length} rows)`);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (isLikelyHeaderRow(row)) continue;

        const record = extractCadastralRecord(row);
        record.blockName = this.resolveBlockName(record.blockName, record.vaultType, lastResolvedBlockName);
        lastResolvedBlockName = record.blockName;

        if (!record.excelId && !record.rawVaultNumber) {
          continue;
        }

        const contractCreated = await this.importRecord(record, adminUserId);
        processedRecords++;

        if (contractCreated) {
          createdContracts++;
        }
      }
    }

    this.logger.log(`Cadastral import completed. Records: ${processedRecords}, contracts: ${createdContracts}`);
  }

  private async importRecord(record: ReturnType<typeof extractCadastralRecord>, adminUserId: string): Promise<boolean> {
    const block = await this.persistence.upsertBlock(record.blockName, adminUserId);
    const floor = await this.persistence.upsertFloor(block.id);
    const vault = await this.persistence.upsertVault(record, block.id, floor.id, adminUserId);

    if (!isOccupiedRecord(record)) {
      await this.persistence.markVaultAsAvailable(vault.id);
      return false;
    }

    const deceased = await this.persistence.upsertDeceased(record, vault.id, adminUserId);
    const responsiblePerson = await this.persistence.upsertResponsiblePerson(record, adminUserId);
    const owner = await this.persistence.upsertOwner(responsiblePerson.id);
    const responsibleParty = await this.persistence.upsertResponsibleParty(responsiblePerson.id, owner.id);
    const { startDate, endDate } = getContractDates(record);

    const contract = await this.persistence.createContract({
      vaultId: vault.id,
      deceasedId: deceased.id,
      responsiblePartyId: responsibleParty.id,
      startDate,
      endDate,
      notes: record.notes || 'Imported from cadastral registry',
      adminUserId,
    });

    await this.persistence.createInstallmentsAndInitialPayment(
      contract.id,
      contract.totalAmount,
      responsiblePerson.id,
      contract.startDate,
    );
    await this.persistence.markVaultAsOccupied(vault.id, owner.id);

    return true;
  }

  private resolveBlockName(rawBlockName: string, vaultType: string, previousBlockName: string): string {
    return resolveBlockName(rawBlockName, vaultType, previousBlockName);
  }
}
