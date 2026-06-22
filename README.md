<div align="center">

# 🤠 Gaúcho Pampa Survival

### Sobreviva às hordas do pampa com seu gaúcho armado até os dentes

[![Phaser](https://img.shields.io/badge/Phaser-3.87-8e44ad?logo=phaser&logoColor=white)](https://phaser.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Webpack](https://img.shields.io/badge/Webpack-5-8dd6f9?logo=webpack&logoColor=black)](https://webpack.js.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://gauchopampasurvival.vercel.app)

**▶️ Jogue agora:** [gauchopampasurvival.vercel.app](https://gauchopampasurvival.vercel.app)

</div>

---

## 📖 Sobre o projeto

**Gaúcho Pampa Survival** é um jogo *survivor-like* (estilo _Vampire Survivors_) ambientado nos pampas gaúchos. Você controla um gaúcho que precisa sobreviver a ondas crescentes de inimigos, coletando XP, evoluindo armas e usando o cenário como cobertura.

Projeto desenvolvido para a disciplina de **Desenvolvimento de Jogos**.

| | |
|---|---|
| 🎓 **Disciplina** | Desenvolvimento de Jogos |
| 👨‍🏫 **Professor** | Gustavo Girardon |
| 👥 **Alunos** | Henrique Prestes · Paulo Baisch · Rodrigo Ribeiro |

---

## 🎮 O jogo

Você acorda no meio do pampa cercado de criaturas. Sozinho, com seu revólver, precisa **resistir o máximo de tempo possível** enquanto a dificuldade aumenta. A cada inimigo abatido você ganha experiência; a cada nível, escolhe um aprimoramento. Quanto mais longe chegar, mais forte fica — e mais perigoso o campo se torna.

- 🌅 **Mundo aberto** de 3000×3000 com câmera que segue o jogador
- 🌊 **Ondas progressivas** — inimigos ficam mais rápidos, mais numerosos e mais resistentes com o tempo
- 🔫 **5 armas** com comportamentos distintos e evolução por nível
- 🪨 **Cenário interativo** — pedras, cercas, barris e arbustos como cobertura
- 🤠 **Inimigo atirador** que força o uso tático de obstáculos
- 🎵 **Áudio 100% procedural** — efeitos e trilha gerados por código (Web Audio)

---

## 🕹️ Como jogar

| Ação | Comando |
|------|---------|
| Mover | **W A S D** |
| Mirar | **Mouse** (mira 360°) |
| Atirar | **Clique esquerdo** ou **Espaço** |
| Pausar | **ESC** |
| Mudo | **M** |
| Reiniciar / Menu | **Espaço** / **ESC** (na tela de game over) |

> 💡 O gaúcho sempre encara o cursor — o tiro sai exatamente na direção do mouse.

---

## ⚔️ Mecânicas

### Armas
Você equipa **uma arma por vez** (a escolha vem no level up). Cada uma tem identidade própria:

| Arma | Comportamento |
|------|---------------|
| 🔫 **Revólver** | Tiro único certeiro (ganha projéteis extras ao subir de nível) |
| 💥 **Espingarda** | Leque de chumbos, dano alto de perto |
| 🎯 **Rifle** | Tiro rápido e **perfurante** (atravessa vários inimigos) |
| 🗡️ **Faca** | **Lâminas orbitais** que ferem por contato (passiva) |
| 🪢 **Chicote** | Golpe em **área/cone**, sem projétil |

### Progressão
- Cada inimigo abatido solta **XP** (balãozinho `+5 / +10 XP`) que enche a barra do topo
- Ao subir de nível, escolha entre **trocar de arma**, **evoluir a arma atual** ou **melhorar atributos** (dano, cadência, vida, velocidade…)
- A cada **3 abates**, o gaúcho recupera vida automaticamente

### Inimigos & cenário
- 5 tipos de inimigos corpo-a-corpo perseguem o jogador, cada um com **barra de vida**
- A partir de certo tempo surgem **pistoleiros** que param à distância e atiram
- **Obstáculos** bloqueiam movimento e projéteis — esconda-se atrás de uma pedra para cortar a linha de tiro inimiga
- **Barris e arbustos** são destrutíveis e soltam cura ou XP

---

## 🛠️ Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Motor de jogo | [Phaser 3](https://phaser.io/) (Arcade Physics, Canvas 2D) |
| Linguagem | [TypeScript](https://www.typescriptlang.org/) |
| Bundler | [Webpack 5](https://webpack.js.org/) + ts-loader |
| Áudio | Web Audio API (síntese procedural, sem arquivos) |
| Sprites & arte | Spritesheets do gaúcho e dos inimigos + sprites de cenário (chão, pedras, cercas, barris, arbustos) e projéteis, em PNG |
| Deploy | [Vercel](https://vercel.com/) |

---

## 🚀 Como rodar localmente

**Pré-requisitos:** [Node.js](https://nodejs.org/) (v18+) e npm.

```bash
# clone o repositório
git clone https://github.com/d1g4odev/gauchopampasurvival.git
cd gauchopampasurvival

# instale as dependências
npm install

# rode em modo desenvolvimento (hot reload em http://localhost:8080)
npm run development
```

### Build de produção

```bash
# gera a versão otimizada na pasta dist/
npm run distribution
```

---

## 📁 Estrutura do projeto

```
src/
├── index.html              # página que hospeda o canvas
├── style.css               # tela cheia responsiva
├── assets/                 # sprites: gaúcho, inimigos, cenário e projéteis
│   ├── enemies/            # spritesheets dos inimigos
│   ├── scenery/            # sprites de chão e obstáculos (chão, pedra, cerca, barril, arbusto)
│   └── projectiles/        # sprites de projéteis (revólver, espingarda, rifle, faca, bala inimiga)
└── scripts/
    ├── main.ts             # configuração do Phaser (cenas, escala, física)
    ├── gameOptions.ts      # parâmetros de jogo (vida, XP, dificuldade…)
    ├── soundManager.ts     # efeitos e trilha procedurais (Web Audio)
    └── scenes/
        ├── preloadAssets.ts  # carregamento dos assets
        ├── menu.ts           # menu inicial
        └── playGame.ts       # lógica principal do jogo
```

---

## 🌐 Deploy

O jogo é publicado na Vercel a partir do build estático (`npm run distribution` → `dist/`):

```bash
vercel deploy --prod
```

**Produção:** [gauchopampasurvival.vercel.app](https://gauchopampasurvival.vercel.app)

---

<div align="center">

### 👥 Equipe

**Henrique Prestes** · **Paulo Baisch** · **Rodrigo Ribeiro**

Desenvolvimento de Jogos — Prof. Gustavo Girardon

<sub>Feito com 🧉 no pampa</sub>

</div>
