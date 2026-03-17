import { Injectable, NotFoundException } from '@nestjs/common';
import { CemeteryRepository } from './cemetery.repository';
import { CreateCemeteryDto } from './dto/create-cemetery.dto';
import { UpdateCemeteryDto } from './dto/update-cemetery.dto';

@Injectable()
export class CemeteryService {
  constructor(private readonly cemeteryRepository: CemeteryRepository) {}

  async list() {
    return this.cemeteryRepository.findActive();
  }

  async getById(id: string) {
    const cemetery = await this.cemeteryRepository.findById(id);

    if (!cemetery || cemetery.isActive === false) {
      throw new NotFoundException('Cemetery not found');
    }

    return cemetery;
  }

  async create(data: CreateCemeteryDto) {
    return this.cemeteryRepository.create(data);
  }

  async update(id: string, data: UpdateCemeteryDto) {
    await this.getById(id);
    return this.cemeteryRepository.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.cemeteryRepository.update(id, { isActive: false });
  }
}
