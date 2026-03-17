import { Module } from '@nestjs/common';
import { DeceasedModule } from '../deceased/deceased.module';
import { InstallmentModule } from '../installment/installment.module';
import { PaymentModule } from '../payment/payment.module';
import { PersonModule } from '../person/person.module';
import { VaultModule } from '../vault/vault.module';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { ContractRepository } from './contract.repository';

@Module({
  imports: [DeceasedModule, PersonModule, InstallmentModule, PaymentModule, VaultModule],
  providers: [ContractService, ContractRepository],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule {}
