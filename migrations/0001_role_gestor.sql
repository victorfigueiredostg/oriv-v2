-- Adiciona o papel GESTOR (usuário de acesso restrito a 1 empreendimento).
-- Status: APLICADA.
ALTER TABLE Usuario
  MODIFY COLUMN role ENUM('ADMIN','STAND','GESTOR') NOT NULL DEFAULT 'STAND';
