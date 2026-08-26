-- Coluna de controle do re-check diário do CV (último re-check automático).
-- Usada pelo endpoint /api/cron/cv-recheck para rodar em lotes, ~1x por dia.
-- Status: PENDENTE — rodar no phpMyAdmin uma única vez.
ALTER TABLE Visita ADD COLUMN cvVerificadoEm DATETIME NULL;
CREATE INDEX Visita_cvVerificadoEm_idx ON Visita (cvVerificadoEm);
