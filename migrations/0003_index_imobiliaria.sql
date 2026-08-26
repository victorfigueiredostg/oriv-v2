-- Índice em Visita.imobiliaria: acelera filtro e agrupamento por imobiliária
-- (Dashboard, Relatórios, aba Imobiliárias e análise de cobrança).
-- Status: PENDENTE — rodar no phpMyAdmin uma única vez.
CREATE INDEX Visita_imobiliaria_idx ON Visita (imobiliaria);
