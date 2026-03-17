import { Module } from '@nestjs/common';
import { InstallmentService } from './installment.service';
import { InstallmentController } from './installment.controller';
import { InstallmentRepository } from './installment.repository';

@Module({
  providers: [InstallmentService, InstallmentRepository],
  controllers: [InstallmentController],
  exports: [InstallmentService],
})
export class InstallmentModule {}
