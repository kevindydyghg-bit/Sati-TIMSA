-- ============================================================================
-- CLEANUP - SATI-TIMSA
-- Mantiene solo 3 registros de ejemplo por tabla para reducir almacenamiento
-- ============================================================================

-- Desactivar FK temporalmente
SET session_replication_role = replica;

-- 1. Tablas hijas (referencian a otras)
DELETE FROM equipment_history WHERE id NOT IN (SELECT id FROM equipment_history ORDER BY id LIMIT 3);
DELETE FROM maintenance_orders WHERE id NOT IN (SELECT id FROM maintenance_orders ORDER BY id LIMIT 3);
DELETE FROM stock_items WHERE id NOT IN (SELECT id FROM stock_items ORDER BY id LIMIT 3);
DELETE FROM audit_logs WHERE id NOT IN (SELECT id FROM audit_logs ORDER BY id LIMIT 3);

-- 2. equipment (referencia tipos, marcas, modelos, ubicaciones, areas, usuarios)
DELETE FROM equipment WHERE id NOT IN (SELECT id FROM equipment ORDER BY id LIMIT 3);

-- 3. equipment_models referencia brands
DELETE FROM equipment_models WHERE id NOT IN (SELECT id FROM equipment_models ORDER BY id LIMIT 3);
DELETE FROM brands WHERE id NOT IN (SELECT id FROM brands ORDER BY id LIMIT 3);
DELETE FROM equipment_types WHERE id NOT IN (SELECT id FROM equipment_types ORDER BY id LIMIT 3);
DELETE FROM areas WHERE id NOT IN (SELECT id FROM areas ORDER BY id LIMIT 3);
DELETE FROM locations WHERE id NOT IN (SELECT id FROM locations ORDER BY id LIMIT 3);
DELETE FROM users WHERE id NOT IN (SELECT id FROM users ORDER BY id LIMIT 3);

-- Reactivar FK
SET session_replication_role = origin;

-- 4. Limpiar blacklist completamente
DELETE FROM token_blacklist;

-- 5. Resetear secuencias (solo tablas con serial/bigserial, no UUID)
SELECT setval('public.brands_id_seq', COALESCE((SELECT MAX(id) FROM public.brands), 0) + 1, false);
SELECT setval('public.equipment_models_id_seq', COALESCE((SELECT MAX(id) FROM public.equipment_models), 0) + 1, false);
SELECT setval('public.equipment_types_id_seq', COALESCE((SELECT MAX(id) FROM public.equipment_types), 0) + 1, false);
SELECT setval('public.locations_id_seq', COALESCE((SELECT MAX(id) FROM public.locations), 0) + 1, false);
SELECT setval('public.areas_id_seq', COALESCE((SELECT MAX(id) FROM public.areas), 0) + 1, false);

SELECT setval('public.audit_logs_id_seq', COALESCE((SELECT MAX(id) FROM public.audit_logs), 0) + 1, false);
