import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

const config = {
  type: 'postgres',
  // host: '',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dropSchema: true,
  synchronize: true,
  logging: ['error'], // ["error"], <= solo muestre errores de la DB
  subscribers: [],
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/src/migrations/*{.ts,.js}'],
  timestamp: 'timestamp-z',
};
// para el load: [typeormConfig] del module main
export default registerAs('typeorm', () => config);

// export const connectionSource = new DataSource(config as DataSourceOptions);

// Configuración especial para CLI de TypeORM
// export const connectionSource = new DataSource({
//   ...config,
//   entities: ['src/**/*.entity.ts'],
//   migrations: ['src/migrations/*.ts'],
// } as DataSourceOptions);
