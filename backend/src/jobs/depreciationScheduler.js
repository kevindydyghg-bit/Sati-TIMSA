const db = require('../config/db');

const AVG_DAYS_PER_MONTH = 30.4375;

async function runDepreciation() {
  const { rows } = await db.query(
    `SELECT ds.*, e.assigned_user, e.status
     FROM depreciation_schedule ds
     JOIN equipment e ON e.id = ds.equipment_id
     WHERE e.deleted_at IS NULL
       AND e.status NOT IN ('baja', 'donado')
       AND (ds.last_depreciation_date IS NULL OR ds.last_depreciation_date < CURRENT_DATE)
       AND ds.current_book_value > ds.salvage_value
     ORDER BY ds.last_depreciation_date NULLS FIRST`,
    []
  );

  if (rows.length === 0) return;

  const today = new Date().toISOString().slice(0, 10);

  for (const row of rows) {
    const lastDate = row.last_depreciation_date
      ? new Date(row.last_depreciation_date)
      : new Date(row.start_date);
    const todayDate = new Date(today);
    const daysElapsed = Math.max(0, Math.floor((todayDate - lastDate) / 86400000));
    if (daysElapsed === 0) continue;

    const cost = Number(row.acquisition_cost);
    const salvage = Number(row.salvage_value);
    const months = Number(row.useful_life_months);
    const bookValue = Number(row.current_book_value);
    const depreciableBase = cost - salvage;

    if (depreciableBase <= 0 || months <= 0) continue;

    let dailyRate;
    if (row.method === 'declining_balance') {
      const annualRate = 2 / (months / 12);
      dailyRate = annualRate / 365;
    } else {
      dailyRate = depreciableBase / (months * AVG_DAYS_PER_MONTH);
    }

    let depreciation = bookValue - salvage;
    let newBookValue;
    if (row.method === 'declining_balance') {
      const totalDepreciation = bookValue * (1 - Math.pow(1 - dailyRate, daysElapsed));
      newBookValue = Math.max(salvage, bookValue - totalDepreciation);
    } else {
      const totalDepreciation = dailyRate * daysElapsed;
      newBookValue = Math.max(salvage, cost - totalDepreciation);
    }
    newBookValue = Math.round(newBookValue * 100) / 100;

    if (newBookValue >= bookValue && bookValue > salvage) {
      newBookValue = Math.max(salvage, bookValue - 0.01);
    }

    await db.query(
      `UPDATE depreciation_schedule
       SET current_book_value = $1, last_depreciation_date = $2, updated_at = NOW()
       WHERE id = $3`,
      [newBookValue, today, row.id]
    );
  }
}

module.exports = { runDepreciation };
