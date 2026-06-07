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
        this.load.spritesheet('gaucho_walk_knife', './assets/Gaucho_Walk_Knife.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_rifle', './assets/Gaucho_Walk_Rifle.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_shotgun', './assets/Gaucho_Walk_Shotgun.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_walk_whip', './assets/Gaucho_Walk_Whip.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });

        // --- CARREGANDO AS ANIMAÇÕES DE ATAQUE (ATTACK) ---
        this.load.spritesheet('gaucho_attack_revolver', './assets/Gaucho_Attack_Revolver.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_knife', './assets/Gaucho_Attack_Knife.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_rifle', './assets/Gaucho_Attack_Rifle.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_shotgun', './assets/Gaucho_Attack_Shotgun.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });
        this.load.spritesheet('gaucho_attack_whip', './assets/Gaucho_Attack_Whip.png', { frameWidth: 182, frameHeight: 179, margin: 0, spacing: 0 });

        // Carregando os assets de inimigos e tiros
        this.load.image('enemy', './assets/sprites/enemy.png');
        this.load.image('bullet', './assets/sprites/bullet.png');
    }

    // method to be executed when the scene is created
    create(): void {
        // start PlayGame scene
        this.scene.start('PlayGame');
    }
}
