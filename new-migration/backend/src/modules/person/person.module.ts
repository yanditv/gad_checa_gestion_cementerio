import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { PersonRepository } from './person.repository';

@Module({
  providers: [PersonService, PersonRepository],
  controllers: [PersonController],
  exports: [PersonService],
})
export class PersonModule {}
