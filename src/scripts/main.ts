// MAIN GAME FILE

// modules to import
import Phaser from 'phaser';                                    // Phaser
import { PreloadAssets } from './scenes/preloadAssets';         // preloadAssets scene
import { Menu } from './scenes/menu';                           // menu scene
import { PlayGame } from './scenes/playGame';                   // playGame scene
import { GameOptions } from './gameOptions';                    // game options

// object to initialize the Scale Manager
const scaleObject : Phaser.Types.Core.ScaleConfig = {
    mode        : Phaser.Scale.RESIZE,                          // canvas ocupa toda a janela (sem barras)
    autoCenter  : Phaser.Scale.CENTER_BOTH,                     // centraliza
    parent      : 'thegame',                                    // DOM id where to render the game
    width       : window.innerWidth,                            // largura inicial = janela
    height      : window.innerHeight                            // altura inicial = janela
}

// game configuration object
const configObject : Phaser.Types.Core.GameConfig = {
    type           : Phaser.CANVAS,                             // CORRIGIDO: Usa Canvas 2D nativo para não dar erro de WebGL
    backgroundColor: GameOptions.gameBackgroundColor,           // game background color
    scale          : scaleObject,                               // scale settings
    scene          : [
        PreloadAssets,                                          // PreloadAssets scene
        Menu,                                                   // Menu scene
        PlayGame                                                // PlayGame scene
    ],
    physics : {
        default : 'arcade'                                      // physics engine used is arcade
    }
}

// the game itself
new Phaser.Game(configObject);