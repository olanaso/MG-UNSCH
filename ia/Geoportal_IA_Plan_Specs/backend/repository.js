import SequelizePackage from 'sequelize';
import { definirLugar } from './model.js';
import { aDto } from './domain.js';

const { QueryTypes } = SequelizePackage;

export function crearRepository(sequelize) {
  const Lugar = definirLugar(sequelize);
  return {
    async listar({ categoria = null } = {}) {
      const rows = await Lugar.findAll({
        where: categoria ? { categoria } : {}, order: [['id', 'ASC']], limit: 200,
      });
      return rows.map(aDto);
    },
    async crear(valor) {
      return aDto(await Lugar.create(valor));
    },
    async obtener(id) {
      const row = await Lugar.findByPk(id);
      return row ? aDto(row) : null;
    },
    async cercanos({ longitud, latitud, radio }) {
      const rows = await sequelize.query(
        `SELECT id, nombre, categoria, descripcion,
                ST_AsGeoJSON(geom)::json AS geom,
                ROUND(ST_Distance(geom::geography,
                  ST_SetSRID(ST_MakePoint($longitud, $latitud), 4326)::geography
                )::numeric, 1) AS distancia_m
         FROM lugares
         WHERE ST_DWithin(geom::geography,
           ST_SetSRID(ST_MakePoint($longitud, $latitud), 4326)::geography, $radio)
         ORDER BY ST_Distance(geom::geography,
           ST_SetSRID(ST_MakePoint($longitud, $latitud), 4326)::geography) ASC, id ASC
         LIMIT 200`,
        { bind: { longitud, latitud, radio }, type: QueryTypes.SELECT },
      );
      return rows.map(aDto);
    },
    async comprobarBase() { await sequelize.authenticate(); },
  };
}
