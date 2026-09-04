# Carbona

Site da Carbona — chá preto gaseificado em três sabores — implementado a partir do
arquivo do Figma.

## Stack

- **Next.js 15** (App Router, React 19) — as três páginas saem estáticas no build
- **TypeScript** em modo strict
- **Tailwind CSS v4** — tokens declarados em `app/globals.css` via `@theme`
- **Motion** (`motion/react`) — só onde o movimento precisa de estado; o resto é CSS

## Rodando

```bash
npm run dev
```

Outros comandos: `npm run build`, `npm start`, `npm run typecheck`.

## Estrutura

```
app/
  layout.tsx          fontes, metadata, header, gate `.js`
  page.tsx            Home — hero com carrossel de sabores (tela cheia, sem footer)
  shop/page.tsx       Shop — grid, packs, kit, "o que tem dentro", dúvidas
  contato/page.tsx    Contato — canais + formulário
  contato/actions.ts  Server Action do formulário
  checkout/actions.ts Server Action do checkout (pasta sem page — não é rota)
components/           header, footer, carrossel, cards, acordeão, formulários
  cart-*.tsx          provider, drawer, painel, linha, formulário de checkout
lib/
  flavors.ts          os três sabores — cor, gradiente, imagens, copy
  products.ts         avulsos, packs, kit, FAQ, canais de contato, preços
  shipping.ts         faixas de frete grátis, prazo por CEP, parcelas
  validation.ts       e-mail e CEP — compartilhado entre as duas actions
  asset-sizes.json    gerado — dimensões reais de cada arte
assets/               FONTE da arte: cans/, fruits/, packs/ — nunca escrita
public/cans/          GERADO a partir de assets/cans/
public/fruits/        GERADO — guarnição do hero
public/packs/         GERADO — opcional, fotos de pack de três latas
public/textures/      GERADO — gotas d'água e névoa do rodapé
scripts/
  prepare-assets.mjs  assets/ -> public/ + lib/asset-sizes.json
  lib/white-key.mjs   remoção de fundo branco
  keyer.test.mjs      valida o keyer contra ground truth
```

`lib/flavors.ts` é a fonte única: o carrossel, o grid da Shop, os packs e o
footer leem tudo dele. Um sabor novo é um objeto novo, nada mais.

Não existe arte separada para os packs — `components/can-stack.tsx` compõe
três latas sobrepostas a partir dos mesmos PNGs.

## Footer e o landmark `contentinfo`

A Home é uma tela cheia só, sem footer e sem scroll. Por isso o layout raiz
**não** renderiza `<main>` nem o footer: quem faz isso é
`components/page-shell.tsx`, usado pelas páginas de conteúdo.

Não dá para resolver isso com um route group. O layout do grupo renderiza
dentro do `<main>` do layout pai, e um `<footer>` aninhado em `<main>` deixa
de ser exposto como landmark `contentinfo` pelos leitores de tela. O
`PageShell` mantém `<footer>` irmão de `<main>`, os dois filhos diretos de
`<body>`.

## Escala das imagens

O hero é dimensionado a partir da lata: 64% da altura da viewport, com o
wordmark e as frutas em proporção. Nenhuma dessas medidas pode ter teto em
pixel — um `max-height` para de escalar enquanto o resto continua, e a lata
desabava para 50% da altura em 1440p e 33% em 4K.

O que existe no lugar é um `min()` de dois eixos:

```
h-[min(52vh,105vw)] sm:h-[min(58vh,70vw)] lg:h-[min(64vh,47vw)]
```

O termo em `vh` manda em telas largas (mantendo os 64% do Figma em qualquer
resolução); o termo em `vw` só entra em viewport estreita, onde 64vh deixaria
a lata com 70% da largura da tela. Medido: 64% em 1400×900, 1080p, 1440p e
4K; 52% no tablet e 48% no mobile, sem overflow horizontal.

O wordmark e a guarnição do canto precisam da mesma escada, e por um motivo
que não é óbvio: a lata é dimensionada por `vh` nas telas largas, então
qualquer coisa ao lado dela presa a um `vw` fixo diverge no celular. Em 375px
o wordmark media ~188px atrás de uma lata de 199px — invisível — e a guarnição
"grande" do canto saía com 101px contra os 119px da guarnição que deveria ser
um detalhe atrás da lata.

O `overflow-x: clip` no `body` (não `hidden`, que forçaria o outro eixo a
`auto` e transformaria o body em contêiner de rolagem) existe por causa do
rail dos packs: ele sangra até a borda com margem negativa que cancela o
gutter da página, e assim que a viewport passa dos 1600px do contêiner as duas
param de se cancelar — entre ~1600 e ~1680px o rail empurrava 20px para fora
de cada lado.

## Trocando a arte dos produtos

`assets/` é a fonte da verdade e nunca é escrita. `public/cans`,
`public/fruits` e `public/packs` são **gerados** e podem ser apagados à
vontade. Ler e escrever o mesmo arquivo tornaria o processo destrutivo — cada
execução recortaria a saída da anterior e a arte encolheria com o tempo.

Coloque a arte nova em `assets/{cans,fruits,packs}/<sabor>.png` e rode:

```bash
node scripts/prepare-assets.mjs && rm -rf .next/cache/images
```

O script **precisa** rodar — um export cru tem quatro problemas que quebram o
layout:

1. **Fundo branco**, quando o exportador não escreve transparência (é recurso
   pago em vários, Canva incluso). Resolvido em `scripts/lib/white-key.mjs`.
2. **Halo retangular.** Uma sombra de ambiente de ~7% de alpha cobre o frame
   inteiro até as bordas. Sobre um fundo colorido isso vira um retângulo
   cinza em volta do produto, e nenhum recorte resolve — o canal alpha tem
   que ser rebaixado.
3. **Espaço morto.** ~28% da altura abaixo da lata é transparente, então
   `h-[64vh]` renderiza uma lata com metade da altura, flutuando.
4. **Peso.** ~2,7 MB por arquivo.

Cada grupo é recortado pela **união** das bounding boxes, não arquivo a
arquivo: um recorte independente daria enquadramento diferente para cada
sabor, e aí o carrossel pula a cada troca e os cards da Shop ficam fora de
linha de base.

O script também escreve `lib/asset-sizes.json`, que o `next/image` usa para
reservar espaço — assim ninguém precisa sincronizar dimensões na mão.

### Fundo branco

`scripts/lib/white-key.mjs` detecta arte achatada sobre branco e remove o
fundo com um **flood fill a partir da borda** — não um color key. A diferença
importa: o "CARBONA" branco e os realces da tampa são exatamente o mesmo
branco do fundo, e um color key abriria buracos neles. Só pixel *conectado à
borda* é fundo.

Na faixa de 3px junto ao recorte a cobertura vem da distância até o branco, e
o branco é desmisturado da cor — sem isso a borda brilha quando a lata cai
sobre o gradiente escuro.

`node scripts/keyer.test.mjs` valida contra ground truth (achata uma lata já
recortada, key de volta, compara): IoU 99,99%, zero fundo restante, zero
buracos no lettering.

### Texturas do hero

`assets/textures/` não é recortado nem cortado — as texturas cobrem o frame
inteiro. O que elas precisam é de **ganho de alpha**: a textura de gotas tem
pico de alpha 41 de 255 (97% dela abaixo de 26), então na força original ela
é literalmente invisível sobre o gradiente.

Amplificar no arquivo (ganho 6×) é melhor que empilhar cópias no CSS. A
versão anterior empilhava três cópias em 100%/62%/38% com `brightness(2.4)`,
e as cópias menores liam como chuvisco, não como água — as gotas precisam
continuar grandes.

A névoa do rodapé é uma camada fotográfica, não um `radial-gradient`: o alpha
dela já sobe de zero no topo para 71% embaixo, e é isso que dá a dissolvida.
Ela vai esticada (`100% 100%`), não em `cover` — `cover` corta tudo acima da
parte densa e o resultado é uma nuvem branca com borda visível no topo.

### Packs

Se existir `assets/packs/<sabor>.png`, os cards da Shop usam essa foto. Sem
ela, `components/can-stack.tsx` compõe três latas sobrepostas em CSS — o que
funciona, mas as latas de trás são cópias escaladas da mesma lata frontal.
Uma foto real, com as latas de trás giradas e iluminadas como objetos
próprios, sempre ganha.

## Carrinho e checkout

O botão do header abre um drawer lateral com três passos: lista → entrega e
pagamento → confirmação. Ele fica montado no layout raiz, e não no `PageShell`,
porque a Home não passa pelo `PageShell` mas mostra o badge do carrinho — badge
que não abre nada é pior que badge nenhum.

O drawer é um **`<dialog>` nativo com `showModal()`**. Isso resolve de graça
quatro coisas que não existem em lugar nenhum do código: o focus trap, a
devolução do foco ao botão do carrinho, o Escape, e ficar acima do header
`z-50` — um dialog modal vive na top layer, então z-index não entra na
conversa. Também torna `role="dialog"` e `aria-modal` redundantes.

Duas armadilhas de mecânica, ambas comentadas no arquivo:

- `close()` tira o elemento da top layer na hora, o que cortaria a animação de
  saída. Então fechar é: o estado vira, o `AnimatePresence` roda o exit, e só o
  `onExitComplete` chama `close()`.
- Os filhos do `AnimatePresence` têm que ser componentes do Motion
  **diretamente**. Embrulhados numa `<div>` comum, o exit nunca toca.

### Persistência

`cart-provider.tsx` grava em `localStorage` por um efeito, e não dentro do
updater do `setState` — updater tem que ser puro. O guard de "só depois de
hidratar" é **state de render, não ref**: refs sobrevivem ao unmount que o
StrictMode simula, então um ref de "pula a primeira execução" apagaria o
carrinho a cada mount em desenvolvimento.

Os valores lidos do storage são validados um a um. O cast direto era inofensivo
enquanto o carrinho só era contado, mas o painel multiplica quantidade por
preço — uma entrada corrompida ali vira "R$ NaN" no subtotal inteiro.

`findCartProduct` em `lib/products.ts` **não lança**, ao contrário de
`getFlavor` e `sizeOf`. Aqueles leem ids vindos do código; este lê ids vindos
do `localStorage`, que podem nomear um produto já retirado do catálogo. Isso
tem que virar linha descartada, não página quebrada.

### Frete

`lib/shipping.ts` é importado pelo cliente e pela Server Action, então o valor
que o medidor promete não consegue divergir do que o pedido cobra.

O frete grátis é regional — R$ 150 no Sudeste, R$ 250 no resto — mas a região
só aparece com o CEP, no passo 2, e o medidor fica no passo 1. Ele mostra os
**dois** níveis: supor o menor prometeria frete que o cliente talvez não tenha,
e supor o maior contradiria o próprio FAQ.

Os prefixos de CEP 01–39 são exatamente SP, RJ, ES e MG — o Sudeste inteiro;
a Bahia começa em 40. Uma comparação no lugar de uma tabela de estados.

## Tokens de design

Tudo em `app/globals.css`, dentro de `@theme`:

- **Superfícies** — `ink` (#050505), `ink-raised`, `ink-card`, `ink-hairline`
- **Texto** — `chalk`, `chalk-dim`, `chalk-faint`
- **Sabores** — `limao` (#8ed600), `pessego` (#f5871f), `morango` (#e4002b),
  cada um com uma variante `-bright` usada no rótulo e nos dots

O wordmark gigante usa **Archivo** no eixo `wdth` 125 (o máximo da fonte) e
ainda leva `scaleX(1.35)` por cima — sem isso as letras ficam altas demais
para a largura e não batem com o Figma. O peso é rebaixado para 820 porque o
esticão engorda todas as hastes verticais.

## Sistema de movimento

Personalidade **Energetic**: rápido, decidido, com um pouco de overshoot.

- **Curva assinatura** `cubic-bezier(0.16, 1, 0.3, 1)` — carrega ~80% do site
- **Durações** — 160ms (interação), 320ms (padrão), 560ms (troca de sabor)
- **Drift do hero** — a lata sobe 14px e gira 0,7° em 6,5s; a fruta do canto
  sobe 9px em 9s. Os períodos não são múltiplos de propósito: 9 contra 6,5
  faz com que os dois nunca voltem a coincidir, que é a diferença entre
  respirar e balançar no metrônomo
- **Três camadas no hero** — a lata (primária), o wordmark que entra 80ms
  depois (secundária) e o gradiente + gotas + frutas (ambiente)
- **Reveal no scroll** — 18px de deslocamento, 320ms, stagger de 70ms

O estado escondido do reveal vive atrás de uma classe `.js` que um script
inline adiciona antes do primeiro paint. Sem JavaScript o conteúdo
simplesmente aparece — o HTML do servidor não tem nenhum `opacity: 0`.
`prefers-reduced-motion` desliga tudo.

**Divisão de responsabilidade:** o Motion cuida do que depende de estado — a
troca de sabor, o pill da navegação, o acordeão. Os loops ambientes
(`.can-drift`, `.garnish-drift`) são CSS: não dependem de estado nenhum, e
um loop em JS cobraria trabalho de main thread enquanto a página estiver
aberta, em troca de nada.

O drift fica sempre num **elemento embrulho**, nunca na lata ou na fruta em
si. As duas já têm `transform` animado pela troca de sabor, e dois
`transform` no mesmo elemento significa que o último declarado ganha.

## O que ainda falta

- **Entrega do formulário.** `app/contato/actions.ts` valida e tipa, mas não
  envia nada ainda — falta plugar Resend/SendGrid/webhook e rate limiting.
- **Copy das dúvidas 2, 3 e 4.** No Figma só a primeira estava aberta; as
  outras três respostas em `lib/products.ts` foram escritas no mesmo tom e
  precisam de revisão.
- **Checkout de verdade.** O fluxo do drawer valida, reprecifica no servidor e
  formata, mas não cobra nada e não grava pedido nenhum — falta um provedor de
  pagamento, rate limiting e uma chave de idempotência.
- **Página `/privacidade`**, linkada no footer.
- **Marca d'água.** O PNG do morango é um comp do Pngtree e tem marca d'água
  — precisa da arte licenciada antes de publicar.
