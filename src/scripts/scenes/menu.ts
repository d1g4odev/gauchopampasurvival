// MENU INICIAL

import { GameOptions } from '../gameOptions';
import { getSound } from '../soundManager';

export class Menu extends Phaser.Scene {

    constructor() {
        super({ key: 'Menu' });
    }

    create() : void {
        const { width, height } = GameOptions.gameSize;

        // Fundo no clima do pampa
        this.cameras.main.setBackgroundColor('#1a1410');
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc4a265, 1);
        gfx.fillRect(0, height * 0.62, width, height * 0.38);   // chão
        gfx.fillStyle(0x6b4a2a, 0.4);
        gfx.fillEllipse(width / 2, height * 0.62, width * 1.2, 120);

        // Sol poente
        gfx.fillStyle(0xe8a04a, 0.9);
        gfx.fillCircle(width / 2, height * 0.40, 90);

        // Gaúcho do menu (sprite parado)
        const hero = this.add.sprite(width / 2, height * 0.60, 'gaucho_walk_revolver', 0);
        hero.setScale(1.0);
        hero.setOrigin(0.5, 1);

        // Título
        this.add.text(width / 2, 130, 'GAÚCHO', {
            fontFamily: 'monospace', fontSize: '72px', color: '#ffdd44', fontStyle: 'bold',
        }).setOrigin(0.5).setShadow(4, 4, '#000000', 4);
        this.add.text(width / 2, 200, 'PAMPA SURVIVAL', {
            fontFamily: 'monospace', fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setShadow(3, 3, '#000000', 3);

        // Controles
        this.add.text(width / 2, height - 170,
            'WASD para mover   •   Tiro automático\nESC para pausar   •   M para mudo', {
            fontFamily: 'monospace', fontSize: '18px', color: '#dddddd', align: 'center',
        }).setOrigin(0.5);

        // Chamada para começar
        const start = this.add.text(width / 2, height - 90, '► Pressione ESPAÇO para começar ◄', {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.tweens.add({ targets: start, scale: 1.08, duration: 700, yoyo: true, repeat: -1 });

        // Inicia o jogo (gesto do usuário libera o áudio)
        const begin = () => {
            const snd = getSound();
            snd.resume();
            snd.startMusic();
            this.scene.start('PlayGame');
        };
        this.input.keyboard!.once('keydown-SPACE', begin);
        this.input.once('pointerdown', begin);
    }
}
