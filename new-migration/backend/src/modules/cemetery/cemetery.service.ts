import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CemeteryRepository } from './cemetery.repository';
import { Cemetery } from './cemetery.entity';
import { CreateCemeteryDto } from './create-cemetery.dto';
import { UpdateCemeteryDto } from './update-cemetery.dto';

@Injectable()
export class CemeteryService {
  constructor(private readonly cemeteryRepository: CemeteryRepository) {
  }


  protected detailRelations() {
    return {
      blocks: { where: { isActive: true }, include: { vaults: true } },
    };
  }

  async list() {
    return this.cemeteryRepository.findActive();
  }

  async getById(id: string) {
    return this.cemeteryRepository.findById(id);
  }

  async create(data: CreateCemeteryDto) {
    const cemetery = Cemetery.create(data)
    return this.cemeteryRepository.create(cemetery);
  }

  async update(id: string, data: UpdateCemeteryDto) {
    return this.cemeteryRepository.update(id, data);
  }

  async remove(id: string) {
    //TODO: return this.cemeteryRepository.softDelete(id);
  }
}
