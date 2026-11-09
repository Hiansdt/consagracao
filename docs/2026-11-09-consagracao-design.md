# App da Consagração Total — design

## Intenção

Um PWA (app web instalável, com ícone e uso offline), publicado no Vercel, que guia a preparação de 33 dias para a Consagração Total a Jesus por Maria segundo São Luís Maria Grignion de Montfort, até o dia da festa mariana escolhida. Quem usa (o usuário) ainda não fez a consagração e vai começar por este app. O uso diário é: abrir, ver a leitura e as orações do dia, rezar, marcar como feito, ver o progresso.

**Exigência central do usuário:** todos os textos verbatim, de fonte real, sem correções nem modernizações minhas.

## Objetivos

- Escolher a festa mariana e derivar o calendário da preparação (Dia 1 = festa − 33 dias; Dia 34 = dia da festa = consagração).
- Tela "Hoje" como entrada: dia N de 33, fase, leitura(s) e orações do dia, cada item marcável; tocar abre o texto completo.
- Calendário com as fases coloridas, dias concluídos, dias pendentes e a festa destacada.
- Aba "Orações" com todas as orações, inclusive as opcionais.
- Progresso que não se perde: salvo no aparelho com armazenamento persistente, mais backup exportável/importável.
- Instalável na tela inicial, funciona offline depois da primeira abertura.

## Não-objetivos

- App nativo / loja.
- Login, servidor, sincronização entre aparelhos (a troca de aparelho é pelo backup).
- Notificações/lembretes.
- Conteúdo pós-consagração além da jaculatória diária e do lembrete de renovação anual.

## Anti-objetivos (falharia mesmo funcionando)

- Qualquer texto alterado: grafia "corrigida", acentuação moderna, oração trocada por outra versão, trecho resumido.
- Estética "cara de IA": bege + serifa + dourado, kit de cards genérico.
- Perder o progresso por carregamento falho, cache limpo ou outro aparelho.

## Fontes dos textos (decididas com o usuário)

| Conteúdo | Fonte | Situação |
|---|---|---|
| Orações e trechos do Tratado | *Tratado da Verdadeira Devoção*, 2ª ed., Vozes, 1943 (tradução anônima). Scan: Google Drive via alexandriacatolica.blogspot.com | Domínio público (obra anônima, 70 anos da publicação) |
| Evangelho | Bíblia do Pe. Antonio Pereira de Figueiredo, ed. Londres 1828 (archive.org `santabibliaconte00pere`) | Domínio público |
| Imitação de Cristo | Trad. E. L. de Souza Campos, Valdemar Teodoro Editor, 2023 (archive.org `tomas-de-kempis-imitacao-de-cristo`), "Toda cópia e divulgação são permitidas, desde que citada a fonte" | Cópia livre com crédito; o app exibe o crédito |
| Segredo de Maria (Dia 21) | — | Sem tradução em domínio público: o app mostra só a referência e um aviso |

Regra de transcrição: o scan de 1943 e o scan de 1828 são a verdade. A transcrição de valde.com.br serve só de rascunho de OCR (ela moderniza a grafia e trocou o Magnificat). Cada bloco é conferido contra a imagem da página. Manter grafia de época ("Jesús", "satanaz"), 15 mistérios do rosário, ladainha de Loreto como em 1943. No apêndice bilíngue, só a coluna em português.

## Roteiro (decidido)

- **Leituras:** roteiro tradicional (edição TAN / St. Timothy Toronto), aplicado de ponta a ponta. Onde a referência é um capítulo inteiro ("continued"), o dia mostra o capítulo inteiro, não um recorte meu.
- **Orações por fase:** Tratado nº 227–231 / apêndice de 1943.
  - 12 dias: Veni Creator, Ave Maris Stella.
  - 1ª semana: Ladainha do Espírito Santo (com a oração que segue), Ave Maris Stella, Ladainha de Nossa Senhora.
  - 2ª semana: Ladainha do Espírito Santo, Ave Maris Stella, rosário ou terço (com o método de São Luís).
  - 3ª semana: Ladainha do Espírito Santo, Ave Maris Stella, Oração de Santo Agostinho (nº 67), Ladainha do SS. Nome de Jesus.
  - Opcionais, na aba Orações: Magnificat, Ó Jesus vivendo em Maria, Oração a Jesus, Oração a Maria, Pequena Coroa, Sub tuum, Ladainha do S. Coração.
- **Dia da festa:** confissão, comunhão, fórmula de consagração (rezar e assinar), tributo (nº 231–232); leitura Tratado nº 231–233.
- **Depois:** jaculatória "Tuus totus…" (nº 233) diária e lembrete de renovação anual na mesma data.

## Comportamento (decidido)

- Dia perdido: as datas não andam; o dia fica pendente e pode ser completado depois.
- Trocar de festa é permitido e zera o progresso (com confirmação).
- Progresso salvo no aparelho; o app pede `navigator.storage.persist()` para o navegador não apagar sozinho.
- Backup: botão "Exportar backup" baixa um arquivo `.json`; "Importar backup" restaura. Importar substitui o progresso atual, com confirmação.
- Datas pelo fuso local do aparelho.

## Visual (decidido)

- "Quadro inteiro": pintura em domínio público ocupando a metade de cima da tela "Hoje", com o dia escrito sobre ela; abaixo, barra de 33 segmentos e lista de itens com marcadores circulares.
- Pintura muda por fase. Crédito da obra sob a lista.
- Claro e escuro seguindo o tema do celular; no escuro, a pintura se dissolve num fundo azul-grafite.
- Sans-serif moderna (Hanken Grotesk); três abas: Hoje, Calendário, Orações.

## Deixado ao construtor (decisões minhas, marcadas)

- *Minha decisão:* festas listadas: Mãe de Deus (1/1), Apresentação do Senhor (2/2), Lourdes (11/2), Anunciação (25/3), Fátima (13/5), Visitação (31/5), Imaculado Coração (sábado após o Sagrado Coração, móvel), Carmo (16/7), Assunção (15/8), Natividade (8/9), Dores (15/9), Rosário (7/10), Aparecida (12/10), Apresentação de N. Sra. (21/11), Imaculada Conceição (8/12), Guadalupe (12/12). Datas calculadas por ano, com as transferências litúrgicas no Brasil conferidas contra fonte (Anunciação na Semana Santa, Assunção no domingo, Imaculada em domingo). Datas cuja preparação já começou aparecem como indisponíveis.
- *Minha decisão:* uma pintura por fase: 12 dias, Fra Angelico, Anunciação (San Marco); 1ª semana, Sassoferrato, Virgem em oração; 2ª semana, Murillo, Imaculada de Soult; 3ª semana, Bellini, Madonna del Prato; dia da festa, Fra Angelico, Coroação da Virgem (Louvre). Imagens baixadas e publicadas junto da página.
- *Minha decisão:* persistência em localStorage (os dados são pequenos), com versão de esquema no JSON; se a leitura falhar ou vier corrompida, o app não sobrescreve nada e oferece importar backup.
- *Minha decisão:* lembrete discreto para exportar backup no fim de cada fase e antes do dia da festa.
- *Minha decisão:* cada leitura tem a referência visível e a fonte citada no rodapé do texto.
- *Minha decisão:* stack: Vite + TypeScript sem framework, `vite-plugin-pwa` para manifest e service worker, Vitest para a lógica de calendário e para conferir os textos. Fontes tipográficas e pinturas empacotadas no app (nada de rede depois da instalação).
- *Minha decisão:* repositório novo em `~/projects/consagracao`, fora do Vita.

## Restrições

- Hospedagem estática no Vercel. Quem conecta o repositório ao Vercel e publica é o usuário; eu deixo pronto para publicar.
