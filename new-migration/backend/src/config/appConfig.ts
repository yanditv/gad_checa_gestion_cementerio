import { registerAs } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import type { StringValue } from 'ms';
import { z } from 'zod';

const booleanFlagSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'off'].includes(v)) return false;
  }

  return value;
}, z.boolean());

const envVarsSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3001),
	FRONTEND_URL: z.string().url().default('http://localhost:3000'),
	JWT_SECRET: z.string().min(1).default('cemetery-secret-key'),
	JWT_EXPIRES_IN: z.string().min(1).default('24h'),
	CADASTRAL_IMPORT_ENABLED: booleanFlagSchema.default(false),
	CADASTRAL_FILE_PATH: z.string().trim().min(1).optional(),
	CADASTRAL_IMPORT_FORCE: booleanFlagSchema.default(false),
});

const parsedEnvVars = envVarsSchema.safeParse(process.env);

if (!parsedEnvVars.success) {
	const formattedErrors = parsedEnvVars.error.issues
		.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
		.join(', ');

	throw new Error(`Invalid environment configuration: ${formattedErrors}`);
}

const envVars = parsedEnvVars.data;

export default registerAs('app', () => ({
	port: envVars.PORT,
	frontendUrl: envVars.FRONTEND_URL,
	cors: {
		credentials: true,
	},
	jwt: {
		secret: envVars.JWT_SECRET,
		expiresIn: envVars.JWT_EXPIRES_IN as StringValue,
	},
	swagger: {
		path: 'api/docs',
		title: 'GAD Checa Cemetery API',
		description: 'API for cemetery management',
		version: '1.0',
	},
	cadastralImport: {
		enabled: envVars.CADASTRAL_IMPORT_ENABLED,
		filePath: envVars.CADASTRAL_FILE_PATH,
		force: envVars.CADASTRAL_IMPORT_FORCE,
	},
}));

export type AppConfig = ConfigType<typeof import('./appConfig').default>;