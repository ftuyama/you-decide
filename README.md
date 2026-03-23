<div align="center">

**Um jogo de texto onde cada clique pesa como uma lâmina.**

[Jogar online](#jogar-online-github-pages) · [Como jogar](#como-jogar) · [O que te espera](#o-que-te-espera-lá-embaixo) · [Dicas](#dicas-de-sobrevivência)

</div>

---

## Por baixo da cidade, a pedra não perdoa

O **pulso verde** não cessa — sobe pela garganta da cidade como vómito de luar envenenado. Sob os fundamentos, o antigo **complexo funerário** abre a boca: pedra húmida, ferro oxidado, e um cheiro a cobre que não deveria ter temperatura.

Seja por honra, ganância ou desespero, o primeiro passo é sempre o mesmo: **descer**.

```
////////////////////////////////////////////////////////////////
///// # /// # /// # /// # /// # /// # /// # /// # /// # /// # ///
////////////////////////////////////////////////////////////////

                    *        .        *       .
           /\      /\       /\       /\       /\
      /\  //\  /\ //\  /\ //\  /\ //\  /\ //\
     /  ^\/  ^\/  ^\/  ^\/  ^\/  ^\/  ^\/  ^\/  ^\
    /^ ^  ^\^ ^  ^/^ ^  ^\^ ^  ^/^ ^  ^\^ ^  ^/^ ^\
   / ^    ^ \/ ^    ^ /\ ^    ^ \/ ^    ^ /\ ^    ^ \
  /__________________________________________________\
        ~^~^~^~  C A L V Á R I O  ~^~^~^~
  ~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~
      _..._         _..._         _..._         _
     |     |_.---._|     |_.---._|     |      .' '.
     |     |' lua  |'     |'verde|'     |     /     \
     |     |  · ·  |     |  · ·  |     |    |       |
     '---'         '---'         '---'         '...'
||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
oooooooooooooooooooooooooooooooooooooooooooooooooooooo
   ░░ pedra húmida — o pulso sobe da garganta da cidade ░░
```

*Arte ASCII usada no jogo — trecho da abertura.*

---

## Jogar online (GitHub Pages)

O projeto está preparado para **GitHub Pages** (URLs relativas na build; não dependes do nome do repositório para os assets).

1. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Faz push para `main` (ou `master`). O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) corre `npm ci`, `npm run build` e publica a pasta `dist`.
3. O jogo fica disponível em `https://<teu-utilizador>.github.io/<nome-do-repo>/` (ex.: `https://ftuyama.github.io/you-decide/`).

Se o repositório tiver outro nome, o mesmo URL relativo continua a funcionar — não é preciso alterar o `base` do Vite.

---

## Como jogar

1. **Clone** este repositório (ou baixe o ZIP).
2. Na pasta do projeto, instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o jogo no navegador:

   ```bash
   npm run dev
   ```

4. Abra o endereço que o Vite mostrar (em geral `http://localhost:5173`) e **jogue no teclado e no rato** — lê com calma; o texto é o cenário.

Para gerar uma build estática e pré-visualizar:

```bash
npm run build && npm run preview
```

---

## O que te espera lá embaixo

| | |
|:---|:---|
| **Escolhas com peso** | Cada decisão abre caminhos — e fecha outros. |
| **Atmosfera de masmorra** | Catacumbas, rituais, bocas de pedra e o que rasteja nos cantos. |
| **Encontros** | Nem tudo que se move quer conversar. |
| **Uma campanha em capítulos** | A história avança em atos; o fim depende de ti. |

> *Conteúdo de fantasia sombria. Se fores sensível a temas de morte, culto ou violência implícita, joga com critério.*

---

## Dicas de sobrevivência

- **Lê tudo.** Pistas escondem-se em descrições longas e em detalhes aparentemente inúteis.
- **Não tenhas pressa.** O jogo recompensa quem imagina o espaço antes de clicar.
- **Se morreres, não é bug — é consequência.** Volta, experimenta outro ângulo.

---

## Sobre o projeto

**You Decide** é um motor de narrativa interativa em **TypeScript** + **Vite**: cenas em Markdown com frontmatter, motor de estado e UI web. A campanha principal é **Calvário Subterrâneo**.

Se quiseres contribuir com texto, correções ou ideias, abre um *issue* ou envia um *pull request*.

---

<div align="center">

*“Sob a cidade, só há escadas.”*

</div>
