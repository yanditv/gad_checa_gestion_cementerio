import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type AuditLogInput = {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityName: string;
  entityId: string | number;
  actorId?: string | null;
  details?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log({ action, entityName, entityId, actorId, details }: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityName,
        entityId: String(entityId),
        actorId,
        details,
      },
    });
  }
}
