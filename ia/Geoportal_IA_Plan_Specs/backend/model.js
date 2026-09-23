import SequelizePackage from 'sequelize';

const { DataTypes } = SequelizePackage;
export function definirLugar(sequelize) {
  return sequelize.define('Lugar', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    categoria: { type: DataTypes.STRING(30), allowNull: false },
    descripcion: { type: DataTypes.STRING(500), allowNull: true },
    geom: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
  }, { tableName: 'lugares', timestamps: false });
}
