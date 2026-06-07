// MAIN GAME FILE

// modules to import
import Phaser from 'phaser';                                    // Phaser
import { PreloadAssets } from './scenes/preloadAssets';         // preloadAssets scene
import { PlayGame } from './scenes/playGame';                   // playGame scene
import { GameOptions } from './gameOptions';                    // game options

// object to initialize the Scale Manager
const scaleObject : Phaser.Types.Core.ScaleConfig = {
    mode        : Phaser.Scale.FIT,                             // adjust size to automatically fit
    autoCenter  : Phaser.Scale.CENTER_BOTH,                     // center the game horizontally and vertically
    parent      : 'thegame',                                    // DOM id where to render the game
    width       : GameOptions.gameSize.width,                   // game width, in pixels
    height      : GameOptions.gameSize.height                   // game height, in pixels
}

// game configuration object
const configObject : Phaser.Types.Core.GameConfig = {
    type           : Phaser.CANVAS,                             // CORRIGIDO: Usa Canvas 2D nativo para não dar erro de WebGL
    backgroundColor: GameOptions.gameBackgroundColor,           // game background color
    scale          : scaleObject,                               // scale settings
    scene          : [
        PreloadAssets,                                          // PreloadAssets scene
        PlayGame                                                // PlayGame scene
    ],
    physics : {
        default : 'arcade'                                      // physics engine used is arcade
    }
}

// the game itself
new Phaser.Game(configObject);