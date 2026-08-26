-- Motivo de "lost" por visita + tabela de opções gerenciáveis.
-- Status: PENDENTE — rodar no phpMyAdmin uma única vez.

-- Coluna na visita (texto livre; opções vêm de MotivoLost)
ALTER TABLE Visita ADD COLUMN motivoLost VARCHAR(191) NULL;
CREATE INDEX Visita_motivoLost_idx ON Visita (motivoLost);

-- Tabela de opções do dropdown
CREATE TABLE MotivoLost (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nome     VARCHAR(191) NOT NULL UNIQUE,
  ativo    TINYINT(1) NOT NULL DEFAULT 1,
  criadoEm DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
