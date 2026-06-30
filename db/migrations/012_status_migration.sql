-- ═══════════════════════════════════════════════════════════════════════
-- 012_status_migration.sql
-- Lifecycle state machine: 5 estados corporativos con trigger de
-- validacion de transiciones + registro automatico en equipment_history
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Eliminar el CHECK constraint antiguo primero
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_status_check;

-- 2. Migrar estados legacy -> nuevos (ahora sin constraint estorbando)
--    activo       -> asignado
--    mantenimiento -> reparacion
--    baja         -> baja
--    resguardo    -> almacen
UPDATE equipment
SET status = CASE
  WHEN status = 'activo'       THEN 'asignado'
  WHEN status = 'mantenimiento' THEN 'reparacion'
  WHEN status = 'resguardo'    THEN 'almacen'
  ELSE status
END
WHERE deleted_at IS NULL;

-- Tambien migrar equipos eliminados (soft-delete)
UPDATE equipment
SET status = CASE
  WHEN status = 'activo'       THEN 'asignado'
  WHEN status = 'mantenimiento' THEN 'reparacion'
  WHEN status = 'resguardo'    THEN 'almacen'
  ELSE status
END
WHERE deleted_at IS NOT NULL;

-- 3. Nuevo CHECK constraint para los 5 estados del ciclo de vida
ALTER TABLE equipment ADD CONSTRAINT equipment_status_check
  CHECK (status IN ('almacen', 'asignado', 'reparacion', 'donado', 'baja'));

-- 3. Funcion de validacion de transiciones (maquina de estados)
--    almacen    -> asignado, reparacion, donado, baja
--    asignado   -> almacen, reparacion, baja
--    reparacion -> almacen, asignado, baja
--    donado     -> terminal
--    baja       -> terminal
CREATE OR REPLACE FUNCTION check_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'almacen'   AND NEW.status IN ('asignado', 'reparacion', 'donado', 'baja')) OR
    (OLD.status = 'asignado'  AND NEW.status IN ('almacen', 'reparacion', 'baja')) OR
    (OLD.status = 'reparacion' AND NEW.status IN ('almacen', 'asignado', 'baja'))
  ) THEN
    RAISE EXCEPTION 'Transicion de estado invalida: de % a %', OLD.status, NEW.status
      USING HINT = format('Transiciones permitidas desde %s: %s',
        OLD.status,
        CASE OLD.status
          WHEN 'almacen' THEN 'asignado, reparacion, donado, baja'
          WHEN 'asignado' THEN 'almacen, reparacion, baja'
          WHEN 'reparacion' THEN 'almacen, asignado, baja'
          WHEN 'donado' THEN 'ninguna (terminal)'
          WHEN 'baja' THEN 'ninguna (terminal)'
          ELSE 'consulte la documentacion'
        END
      );
  END IF;

  -- Regla: asignado requiere assigned_user
  IF NEW.status = 'asignado' AND trim(COALESCE(NEW.assigned_user, '')) = '' THEN
    RAISE EXCEPTION 'No se puede asignar un equipo sin especificar el usuario'
      USING HINT = 'Proporcione assigned_user al cambiar el estado a asignado';
  END IF;

  -- Regla: reparacion/baja/donado limpian assigned_user
  IF NEW.status IN ('reparacion', 'baja', 'donado') THEN
    NEW.assigned_user = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_equipment_check_status_transition ON equipment;
CREATE TRIGGER trg_equipment_check_status_transition
BEFORE UPDATE ON equipment
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION check_status_transition();

-- 4. Registro automatico de cambios de estado en equipment_history
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO equipment_history (
      equipment_id, changed_by, event_type, previous_data, new_data
    ) VALUES (
      NEW.id,
      NEW.updated_by,
      'STATUS_CHANGE',
      jsonb_build_object(
        'status', OLD.status,
        'assigned_user', OLD.assigned_user
      ),
      jsonb_build_object(
        'status', NEW.status,
        'assigned_user', NEW.assigned_user
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_equipment_log_status_change ON equipment;
CREATE TRIGGER trg_equipment_log_status_change
AFTER UPDATE ON equipment
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_status_change();
