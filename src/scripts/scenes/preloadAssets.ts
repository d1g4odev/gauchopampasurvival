// CLASS TO PRELOAD ASSETS

// modules to import
import Phaser from 'phaser';

// PreloadAssets class extends Phaser.Scene class
export class PreloadAssets extends Phaser.Scene {

    // constructor
    constructor() {
        super({
            key: 'PreloadAssets'
        });
    }

    // method to be called during class preloading
    preload(): void {
        // --- CARREGANDO AS ANIMAÇÕES DE CAMINHADA (WALK) ---
        // Mapped to 182x179 to evenly divide a 728x716 .png spritesheet
        this.load.spritesheet('gaucho_walk', './assets/Gaucho_Walk.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_revolver', './assets/Gaucho_Walk_Revolver.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        // O sheet da faca tem 726px de largura; frameWidth 182 só renderia 3 colunas (12 frames) e quebraria a animação "left" (frames 12-15). 181 garante 4 colunas = 16 frames.
        this.load.spritesheet('gaucho_walk_knife', './assets/Gaucho_Walk_Knife.png', { frameWidth: 181, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_rifle', './assets/Gaucho_Walk_Rifle.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_shotgun', './assets/Gaucho_Walk_Shotgun.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_whip', './assets/Gaucho_Walk_Whip.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });

        // --- CARREGANDO AS ANIMAÇÕES DE ATAQUE (ATTACK) ---
        this.load.spritesheet('gaucho_attack_revolver', './assets/Gaucho_Attack_Revolver.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_knife', './assets/Gaucho_Attack_Knife.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_rifle', './assets/Gaucho_Attack_Rifle.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_shotgun', './assets/Gaucho_Attack_Shotgun.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_whip', './assets/Gaucho_Attack_Whip.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });

        // Carregando os spritesheets dos inimigos
        this.load.spritesheet('inimigo1_walk',   './assets/enemies/Inimigo1_Walk.png',   { frameWidth: 183, frameHeight: 179 });
        this.load.spritesheet('inimigo1_attack', './assets/enemies/Inimigo1_Attack.png', { frameWidth: 181, frameHeight: 177 });
        this.load.spritesheet('inimigo2_walk',   './assets/enemies/Inimigo2_Walk.png',   { frameWidth: 182, frameHeight: 179 });
        this.load.spritesheet('inimigo2_attack', './assets/enemies/Inimigo2_Attack.png', { frameWidth: 183, frameHeight: 175 });
        this.load.spritesheet('inimigo3_walk',   './assets/enemies/Inimigo3_Walk.png',   { frameWidth: 183, frameHeight: 179 });
        this.load.spritesheet('inimigo3_attack', './assets/enemies/Inimigo3_Attack.png', { frameWidth: 183, frameHeight: 178 });
        this.load.spritesheet('inimigo4_walk',   './assets/enemies/Inimigo4_Walk.png',   { frameWidth: 182, frameHeight: 172 });
        this.load.spritesheet('inimigo5_walk',   './assets/enemies/Inimigo5_Walk.png',   { frameWidth: 181, frameHeight: 179 });
        this.load.spritesheet('inimigo5_attack', './assets/enemies/Inimigo5_Attack.png', { frameWidth: 183, frameHeight: 179 });

        // Carregando os assets de tiros
        this.load.image('bullet', './assets/sprites/bullet.png');
    }

    // method to be executed when the scene is created
    create(): void {
        // start Menu scene
        this.scene.start('Menu');
    }
}
