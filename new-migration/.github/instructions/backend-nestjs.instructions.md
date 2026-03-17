---
applyTo: "backend/src/**/*.ts,backend/prisma/schema.prisma"
description: "Use when creating or editing NestJS backend modules, DTOs, services, controllers, repositories, or Prisma models in this workspace."
---

# Backend Workspace Rules

## Architecture

- Follow the NestJS feature-module pattern already used in `backend/src/modules/usuario`: module, controller, service, repositories, and entities stay inside the same feature folder.
- Keep controllers thin. Controllers should receive params, query, and body values, then delegate to the service.
- Keep business rules in services.
- Keep Prisma access and database-shape mapping in repositories.
- Export the service from the module when the feature is consumed elsewhere.
