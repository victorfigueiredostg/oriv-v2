-- Faixa etária do lead (substitui a digitação de idade numérica no cadastro).
-- Registros antigos mantêm idadeCliente; o Dashboard deriva a faixa da idade.
-- Status: PENDENTE — rodar no phpMyAdmin uma única vez.
ALTER TABLE Visita ADD COLUMN faixaEtaria VARCHAR(191) NULL;
