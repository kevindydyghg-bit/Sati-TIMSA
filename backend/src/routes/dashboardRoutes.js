const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [
      totals,
      byStatus,
      byLocation,
      byType,
      warranty,
      recentChanges,
      maintenance,
      stock
    ] = await Promise.all([
      db.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'activo')::int AS active,
                COUNT(*) FILTER (WHERE status = 'mantenimiento')::int AS maintenance,
                COUNT(*) FILTER (WHERE status IN ('baja', 'resguardo'))::int AS inactive,
                COUNT(*) FILTER (WHERE image_path IS NOT NULL)::int AS with_images
         FROM equipment
         WHERE deleted_at IS NULL`
      ),
      db.query(
        `SELECT status, COUNT(*)::int AS total
         FROM equipment
         WHERE deleted_at IS NULL
         GROUP BY status
         ORDER BY total DESC`
      ),
      db.query(
        `SELECT l.name AS location, COUNT(*)::int AS total
         FROM equipment e
         JOIN locations l ON l.id = e.location_id
         WHERE e.deleted_at IS NULL
         GROUP BY l.name
         ORDER BY total DESC, l.name
         LIMIT 8`
      ),
      db.query(
        `SELECT et.name AS equipment_type, COUNT(*)::int AS total
         FROM equipment e
         JOIN equipment_types et ON et.id = e.equipment_type_id
         WHERE e.deleted_at IS NULL
         GROUP BY et.name
         ORDER BY total DESC, et.name
         LIMIT 8`
      ),
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE warranty_until < CURRENT_DATE)::int AS expired,
           COUNT(*) FILTER (WHERE warranty_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::int AS next_30,
           COUNT(*) FILTER (WHERE warranty_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days')::int AS next_90
         FROM equipment
         WHERE deleted_at IS NULL`
      ),
      db.query(
        `SELECT h.id, h.event_type, h.created_at, e.serial_number,
                COALESCE(h.new_data->>'assigned_user', e.assigned_user) AS assigned_user,
                h.previous_data->>'assigned_user' AS previous_assigned_user,
                u.username
         FROM equipment_history h
         JOIN equipment e ON e.id = h.equipment_id
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE e.deleted_at IS NULL
         ORDER BY h.created_at DESC
         LIMIT 8`
      ),
      db.query(
        `SELECT mo.phase, COUNT(*)::int AS total
         FROM maintenance_orders mo
         JOIN equipment e ON e.id = mo.equipment_id
         WHERE e.deleted_at IS NULL
         GROUP BY mo.phase
         ORDER BY mo.phase`
      ),
      db.query(
        `SELECT COUNT(*)::int AS total_items,
                COALESCE(SUM(quantity), 0)::int AS total_quantity,
                COUNT(*) FILTER (WHERE image_path IS NOT NULL)::int AS with_images
         FROM stock_items`
      )
    ]);

    res.json({
      totals: totals.rows[0],
      by_status: byStatus.rows,
      by_location: byLocation.rows,
      by_type: byType.rows,
      warranty: warranty.rows[0],
      recent_changes: recentChanges.rows,
      maintenance: maintenance.rows,
      stock: stock.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
