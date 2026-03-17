import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type AuditDetails = Record<string, unknown>;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  logCreate(entityName: string, entityId: string | number, actorId?: string | null, details?: AuditDetails) {
    return this.log('CREATE', entityName, entityId, actorId, details);
  }

  logUpdate(entityName: string, entityId: string | number, actorId?: string | null, details?: AuditDetails) {
    return this.log('UPDATE', entityName, entityId, actorId, details);
  }

  logDelete(entityName: string, entityId: string | number, actorId?: string | null, details?: AuditDetails) {
    return this.log('DELETE', entityName, entityId, actorId, details);
  }

  private log(
    action: string,
    entityName: string,
    entityId: string | number,
    actorId?: string | null,
    details?: AuditDetails,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityName,
        entityId: String(entityId),
        actorId: actorId ?? null,
        details,
      },
    });
  }
}