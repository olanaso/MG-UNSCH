import SequelizePackage from 'sequelize';
import { leerConfig } from './config.js';

const { Sequelize } = SequelizePackage;
export const config = leerConfig();
export const sequelize = new Sequelize(
  config.database.name, config.database.user, config.database.password,
  { host: config.database.host, port: config.database.port, dialect: 'postgres', logging: false },
);
