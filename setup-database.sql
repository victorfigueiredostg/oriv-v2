-- ORIV 2.0 - Setup do Banco de Dados
-- Execute este SQL no phpMyAdmin da Hostinger

-- Tabela Empreendimento
CREATE TABLE IF NOT EXISTS `Empreendimento` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `logoUrl` VARCHAR(191) NULL,
  `iconeUrl` VARCHAR(191) NULL,
  `slug` VARCHAR(191) NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Empreendimento_slug_key`(`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela Usuario
CREATE TABLE IF NOT EXISTS `Usuario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario` VARCHAR(191) NOT NULL,
  `senhaHash` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'STAND') NOT NULL DEFAULT 'STAND',
  `empreendimentoId` INT NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Usuario_usuario_key`(`usuario`),
  INDEX `Usuario_empreendimentoId_fkey`(`empreendimentoId`),
  CONSTRAINT `Usuario_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela Visita
CREATE TABLE IF NOT EXISTS `Visita` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empreendimentoId` INT NOT NULL,
  `usuarioId` INT NOT NULL,
  `nomeCliente` VARCHAR(191) NOT NULL,
  `comoChegou` ENUM('AGENDADO_CORRETOR', 'CLIENTE_PASSANTE') NOT NULL,
  `corretor` VARCHAR(191) NOT NULL,
  `imobiliaria` VARCHAR(191) NOT NULL,
  `comoSoube` ENUM('INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'CORRETOR', 'PANFLETO', 'TV', 'RADIO', 'STAND_CENTRAL_VENDAS', 'INDICACAO', 'OUTDOOR', 'OBRA') NOT NULL,
  `salvoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Visita_empreendimentoId_idx`(`empreendimentoId`),
  INDEX `Visita_salvoEm_idx`(`salvoEm`),
  INDEX `Visita_corretor_idx`(`corretor`),
  INDEX `Visita_comoSoube_idx`(`comoSoube`),
  INDEX `Visita_empreendimentoId_fkey`(`empreendimentoId`),
  INDEX `Visita_usuarioId_fkey`(`usuarioId`),
  CONSTRAINT `Visita_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Visita_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuário admin (senha: admin123)
-- Hash gerado com bcryptjs (10 rounds)
INSERT INTO `Usuario` (`usuario`, `senhaHash`, `role`, `empreendimentoId`)
VALUES ('admin', '$2b$10$Upj9Qwv4H8crzynkhqexUeM0pMLSA3AxsaIowyjXC6q.DeXOl454u', 'ADMIN', NULL)
ON DUPLICATE KEY UPDATE `usuario` = `usuario`;
