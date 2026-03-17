import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonListQueryDto } from './dto/person-list-query.dto';
import { ResolveContractResponsibleDto } from './dto/resolve-contract-responsible.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonRepository } from './person.repository';

@Injectable()
export class PersonService {
  constructor(private readonly personRepository: PersonRepository) {}

  async list(query: PersonListQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const { items, total } = await this.personRepository.listPaginated(query.resolvedSearch, query.resolvedType, skip, limit);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async search(term: string) {
    return this.personRepository.search(term);
  }

  async getById(id: string) {
    const person = await this.personRepository.findById(id);
    if (!person || person.isActive === false) {
      throw new NotFoundException('Person not found');
    }

    return person;
  }

  async create(data: CreatePersonDto) {
    return this.personRepository.create(data);
  }

  async resolveResponsiblePartyForContract(tx: Prisma.TransactionClient, data: ResolveContractResponsibleDto) {
    if (data.isExisting) {
      if (!data.id) {
        throw new BadRequestException('Responsible person id is required.');
      }

      const person = await this.personRepository.findActiveByIdInTransaction(tx, data.id);

      if (!person) {
        throw new NotFoundException('Responsible person not found');
      }

      const relationship = data.relationship ?? null;
      const existingResponsible = await this.personRepository.findResponsiblePartyInTransaction(
        tx,
        person.id,
        relationship,
      );

      if (existingResponsible) {
        return existingResponsible;
      }

      return this.personRepository.createResponsiblePartyInTransaction(tx, {
        personId: person.id,
        relationship,
      });
    }

    const identificationNumber = data.identificationNumber?.trim();
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();

    if (!identificationNumber) {
      throw new BadRequestException('Responsible identification number is required.');
    }

    if (!firstName) {
      throw new BadRequestException('Responsible first name is required.');
    }

    if (!lastName) {
      throw new BadRequestException('Responsible last name is required.');
    }

    const person = await this.personRepository.createInTransaction(tx, {
      firstName,
      lastName,
      identificationNumber,
      identificationType: data.identificationType ?? 'Cedula',
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      personType: 'Responsible',
      isActive: true,
    });

    return this.personRepository.createResponsiblePartyInTransaction(tx, {
      personId: person.id,
      relationship: data.relationship ?? null,
    });
  }

  async update(id: string, data: UpdatePersonDto) {
    await this.getById(id);
    return this.personRepository.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    return this.personRepository.update(id, { isActive: false });
  }
}
