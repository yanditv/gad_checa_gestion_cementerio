const backendRoot = '/Users/Danny/Documents/GitHub/gad_checa_gestion_cementerio2/new-migration/backend';
const { PrismaService } = require(`${backendRoot}/dist/src/prisma/prisma.service.js`);
const { AuditService } = require(`${backendRoot}/dist/src/common/services/audit.service.js`);
const { CadastralImportService } = require(`${backendRoot}/dist/src/bootstrap/catastro-import.service.js`);
const { SeedService } = require(`${backendRoot}/dist/src/bootstrap/seed.service.js`);

(async () => {
  const prisma = new PrismaService();
  await prisma.$connect();

  const audit = new AuditService(prisma);
  const config = {
    catastroImport: {
      enabled: true,
      filePath: `${backendRoot}/CATASTRO_FINAL.xlsx`,
      force: true,
    },
  };

  const importService = new CadastralImportService(prisma, audit, config);
  const seedService = new SeedService(prisma, audit, importService);

  try {
    await seedService.run();
    const counts = {
      blocks: await prisma.block.count(),
      vaults: await prisma.vault.count(),
      contracts: await prisma.contract.count(),
      deceased: await prisma.deceased.count(),
      persons: await prisma.person.count(),
      owners: await prisma.owner.count(),
      responsibleParties: await prisma.responsibleParty.count(),
      installments: await prisma.installment.count(),
      payments: await prisma.payment.count(),
    };
    console.log('FORCED_SEED_AND_IMPORT_OK');
    console.log(JSON.stringify(counts, null, 2));
  } catch (error) {
    console.error('FORCED_SEED_AND_IMPORT_FAILED');
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();