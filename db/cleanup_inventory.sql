BEGIN;

WITH keep_ids AS (
  SELECT id
  FROM (
    SELECT id, equipment_type_id,
           ROW_NUMBER() OVER (PARTITION BY equipment_type_id ORDER BY created_at DESC) AS rn
    FROM equipment
    WHERE deleted_at IS NULL
  ) ranked
  WHERE rn <= 2
)
DELETE FROM equipment
WHERE deleted_at IS NULL
  AND id NOT IN (SELECT id FROM keep_ids);

WITH keep_ids AS (
  SELECT id
  FROM (
    SELECT id, location_id,
           ROW_NUMBER() OVER (PARTITION BY location_id ORDER BY created_at DESC) AS rn
    FROM stock_items
  ) ranked
  WHERE rn <= 2
)
DELETE FROM stock_items
WHERE id NOT IN (SELECT id FROM keep_ids);

COMMIT;
