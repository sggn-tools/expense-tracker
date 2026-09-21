-- ─────────────────────────────────────────
-- docker/mysql-init.sql
-- Se ejecuta automáticamente la primera vez
-- que el contenedor MySQL arranca.
-- ─────────────────────────────────────────

-- Asegurar charset UTF-8 para emojis y caracteres especiales
ALTER DATABASE expense_tracker
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Timezone configuration
SET time_zone = '-06:00'; -- UTC-6 (El Salvador / CST)
