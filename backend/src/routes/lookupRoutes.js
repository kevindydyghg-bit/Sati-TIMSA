const express = require('express');
const { z } = require('zod');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireWriteAccess } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();

const simpleCatalogSchema = z.object({
  name: z.string().trim().min(2).max(80)
});

const modelSchema = z.object({
  brand_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120)
});

const locationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).optional().nullable(),
  area_name: z.string().trim().min(2).max(120).default('General')
});

const areaSchema = z.object({
  location_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120)
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [types, brands, models, locations, areas] = await Promise.all([
      db.query('SELECT id, name FROM equipment_types ORDER BY name'),
      db.query('SELECT id, name FROM brands ORDER BY name'),
      db.query('SELECT id, brand_id, name FROM equipment_models ORDER BY name'),
      db.query('SELECT id, name, address FROM locations ORDER BY name'),
      db.query('SELECT id, location_id, name FROM areas ORDER BY name')
    ]);

    res.json({
      types: types.rows,
      brands: brands.rows,
      models: models.rows,
      locations: locations.rows,
      areas: areas.rows
    });
  } catch (error) {
    next(error);
  }
});

router.post('/types', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = simpleCatalogSchema.parse(req.body);
    const type = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO equipment_types (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [data.name]
      );
      await writeAudit(client, req, 'CREATE', 'equipment_type', rows[0].id, rows[0]);
      return rows[0];
    });

    res.status(201).json({ type });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de tipo invalidos.' });
    }
    next(error);
  }
});

router.post('/brands', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = simpleCatalogSchema.parse(req.body);
    const brand = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO brands (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [data.name]
      );
      await writeAudit(client, req, 'CREATE', 'brand', rows[0].id, rows[0]);
      return rows[0];
    });

    res.status(201).json({ brand });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de marca invalidos.' });
    }
    next(error);
  }
});

router.post('/models', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = modelSchema.parse(req.body);
    const model = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO equipment_models (brand_id, name)
         VALUES ($1, $2)
         ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, brand_id, name`,
        [data.brand_id, data.name]
      );
      await writeAudit(client, req, 'CREATE', 'equipment_model', rows[0].id, rows[0]);
      return rows[0];
    });

    res.status(201).json({ model });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de modelo invalidos.' });
    }
    next(error);
  }
});

router.post('/locations', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = locationSchema.parse(req.body);
    const result = await db.withTransaction(async (client) => {
      const locationResult = await client.query(
        `INSERT INTO locations (name, address)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET address = COALESCE(EXCLUDED.address, locations.address)
         RETURNING id, name, address`,
        [data.name, data.address || null]
      );

      const areaResult = await client.query(
        `INSERT INTO areas (location_id, name)
         VALUES ($1, $2)
         ON CONFLICT (location_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, location_id, name`,
        [locationResult.rows[0].id, data.area_name || 'General']
      );

      await writeAudit(client, req, 'CREATE', 'location', locationResult.rows[0].id, {
        location: locationResult.rows[0],
        area: areaResult.rows[0]
      });

      return { location: locationResult.rows[0], area: areaResult.rows[0] };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de ubicacion invalidos.' });
    }
    next(error);
  }
});

router.post('/areas', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = areaSchema.parse(req.body);
    const area = await db.withTransaction(async (client) => {
      const exists = await client.query('SELECT id FROM locations WHERE id = $1', [data.location_id]);
      if (!exists.rows[0]) {
        const error = new Error('Ubicacion no encontrada.');
        error.status = 404;
        throw error;
      }

      const { rows } = await client.query(
        `INSERT INTO areas (location_id, name)
         VALUES ($1, $2)
         ON CONFLICT (location_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, location_id, name`,
        [data.location_id, data.name]
      );
      await writeAudit(client, req, 'CREATE', 'area', rows[0].id, rows[0]);
      return rows[0];
    });

    res.status(201).json({ area });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos de area invalidos.' });
    }
    next(error);
  }
});

module.exports = router;
