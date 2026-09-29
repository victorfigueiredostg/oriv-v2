# Migrações de banco (manuais)

Este projeto **não usa** o sistema de migrations do Prisma. Toda alteração de
schema é aplicada à mão no **phpMyAdmin da Hostinger** (aba SQL → Executar).

Para não esquecer nenhum passo em produção (e não subir código que usa uma
coluna/ENUM que o banco ainda não tem), **toda mudança de schema vira um arquivo
SQL numerado aqui**, versionado junto com o código.

## Regra

1. Alterou o `prisma/schema.prisma`? Crie um arquivo `NNNN_descricao.sql` nesta
   pasta com o(s) comando(s) `ALTER`/`CREATE` correspondentes.
2. **Antes** de fazer o deploy (ou junto), rode o SQL pendente no phpMyAdmin.
3. Só depois faça o `git push` (que dispara o deploy). Assim o banco sempre está
   pronto para o código novo.
4. Marque abaixo como **aplicada** quando rodar.

> Observação: os `ALTER ... MODIFY ENUM` e `CREATE INDEX` do MySQL não são
> idempotentes (dão erro se rodar duas vezes). Rode cada arquivo **uma vez**.

## Histórico

| Arquivo | Descrição | Status |
|---|---|---|
| `0001_role_gestor.sql` | Adiciona `GESTOR` ao ENUM `Usuario.role` | ✅ aplicada |
| `0002_como_chegou_selena_e_como_soube_site.sql` | Adiciona `AGENDAMENTO_SELENA` e `SITE` aos ENUMs de `Visita` | ✅ aplicada |
| `0003_index_imobiliaria.sql` | Índice em `Visita.imobiliaria` (filtro/agrupamento por imobiliária) | ⬜ **pendente — rodar agora** |
| `0004_cv_verificado_em.sql` | Coluna `Visita.cvVerificadoEm` + índice (re-check diário do CV) | ⬜ **pendente — rodar agora** |
| `0005_motivo_lost.sql` | Coluna `Visita.motivoLost` + índice + tabela `MotivoLost` | ⬜ **pendente — rodar agora** |
| `0006_faixa_etaria.sql` | Coluna `Visita.faixaEtaria` (faixa etária no cadastro) | ⬜ **pendente — rodar agora** |
