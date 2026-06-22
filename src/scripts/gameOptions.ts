// CONFIGURABLE GAME OPTIONS
// changing these values will affect gameplay

export const GameOptions : any = {

    gameSize : {
        width               : 800,      // largura da janela/câmera, em pixels
        height              : 800       // altura da janela/câmera, em pixels
    },
    worldSize : {
        width               : 3000,     // largura do mundo (campo) — maior que telas desktop
        height              : 3000      // altura do mundo
    },
    gameBackgroundColor     : 0x222222, // game background color

    playerSpeed             : 100,      // player speed, in pixels per second (mutável via upgrades)
    basePlayerSpeed         : 100,      // valor base restaurado a cada partida
    enemySpeed              : 50,       // enemy speed base, in pixels per second
    bulletSpeed             : 200,      // bullet speed, in pixels per second
    bulletRate              : 1000,     // bullet rate, in milliseconds per bullet
    enemyRate               : 800,      // enemy spawn rate base, in milliseconds
    maxEnemies              : 30,       // máximo de inimigos vivos ao mesmo tempo
    enemyBaseHP             : 6,        // vida base: 2 tiros de revólver ou 2 chicotadas

    // --- INIMIGO ATIRADOR (pistoleiro) ---
    enemyShootRange         : 280,      // distância em que o pistoleiro para e atira
    enemyShootRate          : 1600,     // intervalo entre tiros do pistoleiro (ms)
    enemyBulletSpeed        : 220,      // velocidade do projétil inimigo
    enemyBulletDamage       : 8,        // dano do projétil inimigo no jogador

    // --- VIDA DO JOGADOR ---
    playerMaxHP             : 100,      // vida máxima do jogador
    enemyDamage             : 10,       // dano que cada inimigo causa ao tocar
    invincibilityMs         : 800,      // tempo de invencibilidade após levar dano
    knockbackMs             : 180,      // duração do empurrão ao levar dano
    knockbackForce          : 260,      // força do empurrão

    // --- PONTUAÇÃO ---
    scorePerKill            : 10,       // pontos por inimigo morto
    healPerKills            : 5,        // a cada N abates, cura um pouco o jogador
    healAmount              : 5,        // quantidade de vida curada (reduzida p/ ter tensão)

    // --- PROGRESSÃO POR ABATES ---
    // Subir de nível exige matar uma quantidade mínima de mobs (cresce a cada nível)
    baseKillsToLevel        : 5,        // abates para subir do nível 1 para o 2
    killsGrowthPerLevel     : 3,        // abates extras exigidos a cada nível seguinte

    // --- POPULAÇÃO DE INIMIGOS POR NÍVEL ---
    // O teto de inimigos vivos cresce com o NÍVEL (não com o tempo) — evita 30 mobs no nível 2
    baseMaxEnemies          : 6,        // teto de inimigos vivos no nível 1
    enemiesPerLevel         : 2         // +inimigos no teto a cada nível (limitado por maxEnemies)

}
