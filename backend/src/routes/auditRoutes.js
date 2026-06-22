const express = require('express');
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('ADMIN', 'TI'), async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
    const page = Math.max(Number(req.query.page || 1), 1);
    const offset = (page - 1) * limit;
    const action = req.query.action ? String(req.query.action).trim() : null;
    const entity = req.query.entity ? String(req.query.entity).trim() : null;
    const username = req.query.username ? `%${String(req.query.username).trim()}%` : null;
    const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
    const dateFrom = req.query.date_from ? String(req.query.date_from).trim() : null;
    const dateTo = req.query.date_to ? String(req.query.date_to).trim() : null;

    const params = [action || null, entity || null, username, search, dateFrom || null, dateTo || null];
    const where = `
      WHERE ($1::text IS NULL OR al.action = $1)
        AND ($2::text IS NULL OR al.entity = $2)
        AND ($3::text IS NULL OR u.username ILIKE $3 OR u.name ILIKE $3)
        AND ($4::text IS NULL OR al.action ILIKE $4 OR al.entity ILIKE $4 OR al.entity_id::text ILIKE $4 OR al.metadata::text ILIKE $4 OR u.username ILIKE $4 OR u.name ILIKE $4)
        AND ($5::date IS NULL OR al.created_at >= $5::date)
        AND ($6::date IS NULL OR al.created_at < ($6::date + INTERVAL '1 day'))
    `;

    const [items, total] = await Promise.all([
      db.query(
        `SELECT al.id, al.action, al.entity, al.entity_id, al.metadata, al.ip_address, al.user_agent, al.created_at,
                u.name AS user_name, u.username
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ${where}
         ORDER BY al.created_at DESC
         LIMIT $7 OFFSET $8`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ${where}`,
        params
      )
    ]);

    res.json({
      items: items.rows,
      meta: {
        page,
        limit,
        total: total.rows[0].total,
        total_pages: Math.max(Math.ceil(total.rows[0].total / limit), 1)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/export.xlsx', authenticate, requireRole('ADMIN', 'TI'), async (req, res, next) => {
  try {
    const action = req.query.action ? String(req.query.action).trim() : null;
    const entity = req.query.entity ? String(req.query.entity).trim() : null;
    const username = req.query.username ? `%${String(req.query.username).trim()}%` : null;
    const search = req.query.search ? `%${String(req.query.search).trim()}%` : null;
    const dateFrom = req.query.date_from ? String(req.query.date_from).trim() : null;
    const dateTo = req.query.date_to ? String(req.query.date_to).trim() : null;
    const params = [action || null, entity || null, username, search, dateFrom || null, dateTo || null];
    const { rows } = await db.query(
      `SELECT al.action, al.entity, al.entity_id, COALESCE(u.username, 'sistema') AS username,
              al.created_at, al.ip_address, al.metadata
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ($1::text IS NULL OR al.action = $1)
         AND ($2::text IS NULL OR al.entity = $2)
         AND ($3::text IS NULL OR u.username ILIKE $3 OR u.name ILIKE $3)
         AND ($4::text IS NULL OR al.action ILIKE $4 OR al.entity ILIKE $4 OR al.entity_id::text ILIKE $4 OR al.metadata::text ILIKE $4 OR u.username ILIKE $4 OR u.name ILIKE $4)
         AND ($5::date IS NULL OR al.created_at >= $5::date)
         AND ($6::date IS NULL OR al.created_at < ($6::date + INTERVAL '1 day'))
       ORDER BY al.created_at DESC
       LIMIT 5000`,
      params
    );

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SATI-TIMSA';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Auditoria', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    worksheet.columns = [
      { header: 'Accion', key: 'action', width: 18 },
      { header: 'Entidad', key: 'entity', width: 18 },
      { header: 'ID de entidad', key: 'entity_id', width: 20 },
      { header: 'Usuario', key: 'username', width: 22 },
      { header: 'Fecha', key: 'created_at', width: 24 },
      { header: 'Direccion IP', key: 'ip_address', width: 18 },
      { header: 'Metadatos', key: 'metadata', width: 50 }
    ];

    rows.forEach((row) => {
      worksheet.addRow({
        action: row.action,
        entity: row.entity,
        entity_id: String(row.entity_id ?? ''),
        username: row.username,
        created_at: row.created_at ? new Date(row.created_at).toLocaleString('es-MX') : '',
        ip_address: row.ip_address,
        metadata: JSON.stringify(row.metadata || {})
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B2D57' } };
      cell.alignment = { vertical: 'middle' };
    });
    worksheet.autoFilter = {
      from: 'A1',
      to: `G${Math.max(rows.length + 1, 1)}`
    };

    const fileName = `sati-timsa-auditoria-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
