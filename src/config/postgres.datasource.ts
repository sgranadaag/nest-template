import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENV } from '../constants/environment.constant';

export const PostgresDataSource = new DataSource({
  type: 'postgres',
  host: process.env[ENV.POSTGRES_HOST],
  port: Number(process.env[ENV.POSTGRES_PORT]),
  username: process.env[ENV.POSTGRES_USER],
  password: process.env[ENV.POSTGRES_PASSWORD],
  database: process.env[ENV.POSTGRES_DATABASE],
  migrations: ['src/migrations/postgres/*.ts'],
});
