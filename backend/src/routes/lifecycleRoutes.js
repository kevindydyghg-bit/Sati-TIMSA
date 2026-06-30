const express = require('express');
const { z } = require('zod');
const db = require('../config/db');
const { authenticate, requireWriteAccess } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();

let runtimeSchemaPromise;

function ensureSoftwareRuntimeSchema() {
  if (!runtimeSchemaPromise) {
    runtimeSchemaPromise = db.query(`
      CREATE TABLE IF NOT EXISTS installed_software (
        id BIGSERIAL PRIMARY KEY,
        equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        version VARCHAR(80),
        publisher VARCHAR(200),
        install_date DATE,
        license_key VARCHAR(200),
        is_authorized BOOLEAN NOT NULL DEFAULT true,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_installed_software_equipment ON installed_software(equipment_id);
      CREATE INDEX IF NOT EXISTS idx_installed_software_name ON installed_software(name);
    `);
  }
  return runtimeSchemaPromise;
}

// -- Zod schemas

const statusSchema = z.enum(['almacen', 'asignado', 'reparacion', 'donado', 'baja']);

const allowedTransitions = {
  almacen:    ['asignado', 'reparacion', 'donado', 'baja'],
  asignado:   ['almacen', 'reparacion', 'baja'],
  reparacion: ['almacen', 'asignado', 'baja'],
  donado:     [],
  baja:       []
};

const statusChangeSchema = z.object({
  status: statusSchema,
  reason: z.string().trim().max(500).optional().nullable(),
  assigned_user: z.string().trim().max(140).optional().nullable()
}).strict();

const hardwareSchema = z.object({
  component_type: z.enum(['cpu', 'ram', 'disk', 'gpu']),
  manufacturer: z.string().trim().max(140).optional().nullable(),
  model: z.string().trim().max(140).optional().nullable(),
  serial_number: z.string().trim().max(140).optional().nullable(),
  capacity: z.string().trim().max(80).optional().nullable(),
  form_factor: z.string().trim().max(40).optional().nullable(),
  slot_designation: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable()
});

const softwareSchema = z.object({
  name: z.string().trim().min(1).max(200),
  version: z.string().trim().max(80).optional().nullable(),
  publisher: z.string().trim().max(200).optional().nullable(),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  license_key: z.string().trim().max(200).optional().nullable(),
  is_authorized: z.boolean().optional().default(true),
  notes: z.string().trim().max(500).optional().nullable()
});

const depreciationSchema = z.object({
  acquisition_cost: z.coerce.number().min(0).max(999999999.99),
  salvage_value: z.coerce.number().min(0).optional().default(0),
  useful_life_months: z.coerce.number().int().min(1).max(240),
  method: z.enum(['straight_line', 'declining_balance']).optional().default('straight_line'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// -- Helpers

function transitionErrorMessage(from, to) {
  const allowed = allowedTransitions[from];
  if (!allowed || allowed.length === 0) {
    return `El estado "${from}" es terminal. No se permiten mas transiciones.`;
  }
  return `Transicion invalida: de "${from}" a "${to}". Permitidas: ${allowed.join(', ')}.`;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value + 'T00:00:00Z');
  return date.toISOString().slice(0, 10);
}

// -- Status transition

async function validateAndTransition(client, equipmentId, data, userId) {
  const { rows: existing } = await client.query(
    'SELECT * FROM equipment WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
    [equipmentId]
  );
  if (existing.length === 0) {
    const err = new Error('Equipo no encontrado.');
    err.status = 404;
    throw err;
  }

  const current = existing[0];

  if (current.status === data.status) {
    if (data.assigned_user !== undefined && data.assigned_user !== current.assigned_user) {
      const { rows: updated } = await client.query(
        `UPDATE equipment SET assigned_user = $1, updated_by = $2
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [data.assigned_user || null, userId, equipmentId]
      );
      await client.query(
        `INSERT INTO equipment_history (equipment_id, changed_by, event_type, previous_data, new_data)
         VALUES ($1, $2, 'ASSIGNMENT_CHANGED', $3::jsonb, $4::jsonb)`,
        [equipmentId, userId,
         JSON.stringify({ assigned_user: current.assigned_user }),
         JSON.stringify({ assigned_user: updated.rows[0].assigned_user })]
      );
      return updated.rows[0];
    }
    return current;
  }

  const allowed = allowedTransitions[current.status];
  if (!allowed || !allowed.includes(data.status)) {
    const err = new Error(transitionErrorMessage(current.status, data.status));
    err.status = 409;
    throw err;
  }

  if (data.status === 'asignado' && !data.assigned_user && !current.assigned_user) {
    const err = new Error('Debe especificar el usuario asignado para cambiar al estado "asignado".');
    err.status = 400;
    throw err;
  }

  const finalAssignedUser = (data.status === 'reparacion' || data.status === 'baja' || data.status === 'donado')
    ? null
    : (data.assigned_user !== undefined ? data.assigned_user : current.assigned_user);

  const { rows: updated } = await client.query(
    `UPDATE equipment
     SET status = $1, assigned_user = $2, updated_by = $3
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [data.status, finalAssignedUser, userId, equipmentId]
  );

  if (data.status === 'asignado' && finalAssignedUser) {
    await client.query(
      `INSERT INTO equipment_assignments (equipment_id, assigned_to, assigned_by, reason)
       VALUES ($1, $2, $3, $4)`,
      [equipmentId, finalAssignedUser, userId, data.reason || null]
    );
  }

  if (current.status === 'asignado' && data.status !== 'asignado') {
    await client.query(
      `UPDATE equipment_assignments
       SET returned_at = NOW()
       WHERE equipment_id = $1 AND returned_at IS NULL`,
      [equipmentId]
    );
  }

  return updated.rows[0];
}

// -- Routes

// PATCH /api/equipment/:id/status -- Change equipment status
router.patch('/:id/status', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = statusChangeSchema.parse(req.body);

    const result = await db.withTransaction(async (client) => {
      const previous = await client.query(
        'SELECT status, assigned_user FROM equipment WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
        [req.params.id]
      );
      if (previous.rows.length === 0) {
        const err = new Error('Equipo no encontrado.');
        err.status = 404;
        throw err;
      }

      const updated = await validateAndTransition(client, req.params.id, data, req.user.id);

      await writeAudit(client, req, 'STATUS_CHANGE', 'equipment', req.params.id, {
        from: previous.rows[0].status,
        to: updated.status,
        reason: data.reason || null
      });

      return updated;
    });

    res.json({ item: result });
  } catch (error) {
    if (error.name === 'ZodError') {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(400).json({ message: `Datos invalidos: ${messages}` });
    }
    if (error.code === '23514') {
      return res.status(409).json({ message: error.message || 'Transicion de estado no permitida por la base de datos.' });
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
});

// GET /api/equipment/:id/timeline -- Full lifecycle timeline
router.get('/:id/timeline', authenticate, async (req, res, next) => {
  try {
    const [history, assignments] = await Promise.all([
      db.query(
        `SELECT h.id, h.event_type,
                h.previous_data, h.new_data, h.created_at,
                u.name AS changed_by
         FROM equipment_history h
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE h.equipment_id = $1
         ORDER BY h.created_at DESC
         LIMIT 200`,
        [req.params.id]
      ),
      db.query(
        `SELECT ea.id, ea.assigned_to,
                u.name AS assigned_by_name,
                ea.assigned_at, ea.returned_at, ea.reason, ea.notes
         FROM equipment_assignments ea
         LEFT JOIN users u ON u.id = ea.assigned_by
         WHERE ea.equipment_id = $1
         ORDER BY ea.assigned_at DESC`,
        [req.params.id]
      )
    ]);

    res.json({ history: history.rows, assignments: assignments.rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/equipment/:id/hardware -- List hardware components
router.get('/:id/hardware', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM hardware_components
       WHERE equipment_id = $1
       ORDER BY component_type, id`,
      [req.params.id]
    );
    res.json({ components: rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/equipment/:id/hardware -- Add hardware component
router.post('/:id/hardware', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = hardwareSchema.parse(req.body);
    const { rows } = await db.query(
      `INSERT INTO hardware_components
       (equipment_id, component_type, manufacturer, model, serial_number,
        capacity, form_factor, slot_designation, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.params.id,
        data.component_type,
        data.manufacturer || null,
        data.model || null,
        data.serial_number || null,
        data.capacity || null,
        data.form_factor || null,
        data.slot_designation || null,
        data.notes || null
      ]
    );
    res.status(201).json({ component: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join('; ') });
    }
    next(error);
  }
});

// PUT /api/equipment/:id/hardware/:componentId -- Update hardware component
router.put('/:id/hardware/:componentId', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = hardwareSchema.partial().parse(req.body);
    const { rows } = await db.query(
      `UPDATE hardware_components
       SET component_type = COALESCE($1, component_type),
           manufacturer = COALESCE($2, manufacturer),
           model = COALESCE($3, model),
           serial_number = COALESCE($4, serial_number),
           capacity = COALESCE($5, capacity),
           form_factor = COALESCE($6, form_factor),
           slot_designation = COALESCE($7, slot_designation),
           notes = COALESCE($8, notes)
       WHERE id = $9 AND equipment_id = $10
       RETURNING *`,
      [
        data.component_type || null,
        data.manufacturer || null,
        data.model || null,
        data.serial_number || null,
        data.capacity || null,
        data.form_factor || null,
        data.slot_designation || null,
        data.notes || null,
        req.params.componentId,
        req.params.id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Componente no encontrado.' });
    res.json({ component: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join('; ') });
    }
    next(error);
  }
});

// DELETE /api/equipment/:id/hardware/:componentId
router.delete('/:id/hardware/:componentId', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM hardware_components WHERE id = $1 AND equipment_id = $2',
      [req.params.componentId, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Componente no encontrado.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.use('/:id/software', authenticate, async (req, res, next) => {
  try {
    await ensureSoftwareRuntimeSchema();
    next();
  } catch (error) {
    next(error);
  }
});

// GET /api/equipment/:id/software -- List installed software
router.get('/:id/software', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM installed_software
       WHERE equipment_id = $1
       ORDER BY name`,
      [req.params.id]
    );
    res.json({ software: rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/equipment/:id/software -- Add installed software
router.post('/:id/software', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = softwareSchema.parse(req.body);
    const { rows } = await db.query(
      `INSERT INTO installed_software
       (equipment_id, name, version, publisher, install_date, license_key, is_authorized, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.params.id,
        data.name,
        data.version || null,
        data.publisher || null,
        normalizeDate(data.install_date),
        data.license_key || null,
        data.is_authorized,
        data.notes || null
      ]
    );
    res.status(201).json({ software: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join('; ') });
    }
    next(error);
  }
});

// PATCH /api/equipment/:id/software/:swId -- Toggle authorization
router.patch('/:id/software/:swId', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const schema = z.object({
      is_authorized: z.boolean(),
      notes: z.string().trim().max(500).optional().nullable()
    });
    const data = schema.parse(req.body);
    const { rows } = await db.query(
      `UPDATE installed_software
       SET is_authorized = $1, notes = COALESCE($2, notes)
       WHERE id = $3 AND equipment_id = $4
       RETURNING *`,
      [data.is_authorized, data.notes || null, req.params.swId, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Software no encontrado.' });
    res.json({ software: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join('; ') });
    }
    next(error);
  }
});

// PUT /api/equipment/:id/software/:swId -- Update software entry
router.put('/:id/software/:swId', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = softwareSchema.parse(req.body);
    const { rows } = await db.query(
      `UPDATE installed_software
       SET name = $1, version = $2, publisher = $3, install_date = $4, license_key = $5, is_authorized = $6, notes = $7
       WHERE id = $8 AND equipment_id = $9
       RETURNING *`,
      [
        data.name,
        data.version || null,
        data.publisher || null,
        normalizeDate(data.install_date),
        data.license_key || null,
        data.is_authorized,
        data.notes || null,
        req.params.swId,
        req.params.id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Software no encontrado.' });
    res.json({ software: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join('; ') });
    }
    next(error);
  }
});

// DELETE /api/equipment/:id/software/:swId
router.delete('/:id/software/:swId', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM installed_software WHERE id = $1 AND equipment_id = $2',
      [req.params.swId, req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Software no encontrado.' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/equipment/:id/depreciation -- Get depreciation schedule
router.get('/:id/depreciation', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM depreciation_schedule WHERE equipment_id = $1',
      [req.params.id]
    );
    if (rows.length === 0) return res.json({ depreciation: null });
    res.json({ depreciation: rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST /api/equipment/:id/depreciation -- Set depreciation schedule
router.post('/:id/depreciation', authenticate, requireWriteAccess, async (req, res, next) => {
  try {
    const data = depreciationSchema.parse(req.body);
    const initialValue = data.method === 'straight_line'
      ? data.acquisition_cost
      : data.acquisition_cost;

    const result = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO depreciation_schedule
         (equipment_id, acquisition_cost, salvage_value, useful_life_months, method, start_date, current_book_value, last_depreciation_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $6)
         ON CONFLICT (equipment_id) DO UPDATE
         SET acquisition_cost = EXCLUDED.acquisition_cost,
             salvage_value = EXCLUDED.salvage_value,
             useful_life_months = EXCLUDED.useful_life_months,
             method = EXCLUDED.method,
             start_date = EXCLUDED.start_date,
             current_book_value = EXCLUDED.current_book_value,
             last_depreciation_date = EXCLUDED.last_depreciation_date
         RETURNING *`,
        [
          req.params.id,
          data.acquisition_cost,
          data.salvage_value,
          data.useful_life_months,
          data.method,
          data.start_date,
          initialValue
        ]
      );

      await writeAudit(client, req, 'DEPRECIATION_SET', 'equipment', req.params.id, {
        cost: data.acquisition_cost,
        method: data.method
      });

      return rows[0];
    });

    res.status(201).json({ depreciation: result });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join('; ') });
    }
    next(error);
  }
});

// GET /api/equipment/alerts/warranty -- Warranty expiry alerts
router.get('/alerts/warranty', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT e.id, e.serial_number, e.asset_tag, e.assigned_user,
              et.name AS equipment_type, b.name AS brand, em.name AS model,
              e.warranty_until,
              EXTRACT(DAY FROM e.warranty_until - CURRENT_DATE)::int AS days_remaining
       FROM equipment e
       JOIN equipment_types et ON et.id = e.equipment_type_id
       JOIN brands b ON b.id = e.brand_id
       JOIN equipment_models em ON em.id = e.model_id
       WHERE e.deleted_at IS NULL
         AND e.warranty_until IS NOT NULL
         AND e.warranty_until <= CURRENT_DATE + INTERVAL '90 days'
         AND e.warranty_until >= CURRENT_DATE
       ORDER BY e.warranty_until`,
      []
    );
    res.json({ alerts: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/equipment/alerts/software -- Unauthorized software alerts
router.get('/alerts/software', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT s.id, s.name, s.version, s.publisher, s.install_date,
              s.license_key, s.notes,
              e.id AS equipment_id, e.serial_number, e.asset_tag, e.assigned_user,
              et.name AS equipment_type, b.name AS brand, em.name AS model
       FROM installed_software s
       JOIN equipment e ON e.id = s.equipment_id
       JOIN equipment_types et ON et.id = e.equipment_type_id
       JOIN brands b ON b.id = e.brand_id
       JOIN equipment_models em ON em.id = e.model_id
       WHERE s.is_authorized = FALSE
         AND e.deleted_at IS NULL
       ORDER BY s.name, e.serial_number`,
      []
    );
    res.json({ alerts: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
