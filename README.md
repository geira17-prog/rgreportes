# RG Reportes Web V5

Inclui o separador **Atualizações**.

- Reportes com ID por ano: `1/2026`, `2/2026` e reinício em `1/2027`.
- Técnico automático.
- Estados: Aguardar, Resolvido, Stand By.
- Alteração do estado por lista.
- Dashboard, pesquisa e filtros.
- Atualizações programadas com data, hora inicial/final, serviço, motivo, observações e estado.
- Modelo de email editável para atualizações.
- Campos automáticos no email: `{ID_ATUALIZACAO}`, `{DATA}`, `{HORA_INICIAL}`, `{HORA_FINAL}`, `{SERVICO}`, `{MOTIVO}`, `{OBSERVACOES}`.
- Opção de guardar lembretes de 3 dias e 1 dia antes. A automatização real dos lembretes será ligada no backend/Supabase.
- Histórico de atualizações.

Esta V2 é uma demonstração local. A próxima fase é ligar Supabase/Auth/PostgreSQL para acesso por vários locais.

## V3 — visual
- Interface clara com fundo branco.
- Fundo tecnológico/circuitos em CSS, sem esconder os dados.
- Identidade RG REPORTES com “by Ricardo Gingeira”.
- Cards e menus com estilo moderno e azul.

## V4 — lembretes no Dashboard
- O separador Atualizações fica por defeito com **MEDIDATA**, **09:00** e **17:30**, mas os campos são editáveis.
- Dois modelos de email independentes: **3 dias antes** e **véspera**.
- O Dashboard mostra os avisos pendentes.
- Botão “Preparar Email” abre o cliente de email com o modelo correto.
- O aviso fica marcado como preparado/enviado na aplicação depois de o preparar.
- O histórico mostra o estado de cada lembrete.
- Os campos `{DIAS}`, `{DATA}`, `{HORA_INICIAL}`, `{HORA_FINAL}`, `{SERVICO}`, `{MOTIVO}`, `{OBSERVACOES}` podem ser usados nos modelos.

## V5
- Botão Sobre com RG REPORTES / by Ricardo Gingeira.
- Para, CC e BCC.
- Reportes: editar, apagar, email e procurar no Outlook.
- Atualizações: editar e apagar.
