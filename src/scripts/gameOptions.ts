// CONFIGURABLE GAME OPTIONS
// changing these values will affect gameplay

export const GameOptions : any = {

    gameSize : {
        width               : 800,      // width of the game, in pixels
        height              : 800       // height of the game, in pixels
    },
    gameBackgroundColor     : 0x222222, // game background color

    playerSpeed             : 100,      // player speed, in pixels per second (mutável via upgrades)
    basePlayerSpeed         : 100,      // valor base restaurado a cada partida
    enemySpeed              : 50,       // enemy speed base, in pixels per second
    bulletSpeed             : 200,      // bullet speed, in pixels per second
    bulletRate              : 1000,     // bullet rate, in milliseconds per bullet
    enemyRate               : 800,      // enemy spawn rate base, in milliseconds
    enemyBaseHP             : 6,        // vida base: 2 tiros de revólver ou 2 chicotadas

    // --- VIDA DO JOGADOR ---
    playerMaxHP             : 100,      // vida máxima do jogador
    enemyDamage             : 10,       // dano que cada inimigo causa ao tocar
    invincibilityMs         : 800,      // tempo de invencibilidade após levar dano
    knockbackMs             : 180,      // duração do empurrão ao levar dano
    knockbackForce          : 260,      // força do empurrão

    // --- PONTUAÇÃO / XP ---
    scorePerKill            : 10,       // pontos por inimigo morto
    xpPerKill               : 1,        // xp (gema) por inimigo morto
    baseXpToLevel           : 5,        // xp necessário para o primeiro nível
    xpGrowth                : 1.4,      // multiplicador de xp por nível
    gemMagnetRange          : 90        // distância em que a gema é atraída pelo jogador

}
