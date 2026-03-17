import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { Persona } from './persona.entity';
import { PersonaRepository } from './persona.repository';

@Injectable()
export class PersonaService {
  constructor(private readonly personaRepository: PersonaRepository) {}

  async list(query: PaginationQueryDto, type?: string) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim() || query.busqueda?.trim();
    const resolvedType = type || query.type || query.tipo;

    const { items, total } = await this.personaRepository.listPaginated(search, resolvedType, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async search(term: string) {
    return this.personaRepository.search(term);
  }

  async getById(id: number) {
    const person = await this.personaRepository.findById(id);
    if (!person || person.estado === false) {
      throw new NotFoundException('Person not found');
    }

    return person;
  }

  async create(data: Persona) {
    const person = Persona.create(data);
    return this.personaRepository.create(person);
  }

  async update(id: number, data: any) {
    await this.getById(id);
    const person = Persona.create(data);
    return this.personaRepository.update(id, person);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.personaRepository.update(id, Persona.create({ estado: false }));
  }
}
