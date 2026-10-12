import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ENV } from '../constants/environment.constant';

export const MongoDataSource = new DataSource({
  type: 'mongodb',
  url: process.env[ENV.MONGO_URI],
  database: process.env[ENV.MONGO_DATABASE],
  migrations: ['src/migrations/mongo/*.ts'],
});
