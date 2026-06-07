// THE GAME ITSELF

// modules to import
import { GameOptions } from '../gameOptions';   // game options   

// PlayGame class extends Phaser.Scene class
export class PlayGame extends Phaser.Scene {

    constructor() {
        super({
            key : 'PlayGame'
        });
    }

    controlKeys : any;                                                  // keys used to move the player
    player      : Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;    // the player
    enemyGroup  : Phaser.Physics.Arcade.Group;                          // group with all enemies

    // method to be called once the instance has been created
    create() : void {

        // --- ROW MAPPING CONFIGURATION ---
        // Based on a 4x4 grid (4 columns, 4 rows). Total 16 frames.
        
        // Row 1: Frames 0 to 3
        this.anims.create({ key: 'gaucho_down',  frames: this.anims.generateFrameNumbers('gaucho_walk_revolver', { start: 0, end: 3 }),  frameRate: 8, repeat: -1 });
        
        // Row 2: Frames 4 to 7
        this.anims.create({ key: 'gaucho_up',    frames: this.anims.generateFrameNumbers('gaucho_walk_revolver', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
        
        // Row 3: Frames 8 to 11
        this.anims.create({ key: 'gaucho_right', frames: this.anims.generateFrameNumbers('gaucho_walk_revolver', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
        
        // Row 4: Frames 12 to 15
        this.anims.create({ key: 'gaucho_left',  frames: this.anims.generateFrameNumbers('gaucho_walk_revolver', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });

        // Adiciona o Gaúcho no centro da tela usando a folha correta e frame 0 inicial
        this.player = this.physics.add.sprite(GameOptions.gameSize.width / 2, GameOptions.gameSize.height / 2, 'gaucho_walk_revolver', 0);
        // Aumenta a escala para visibilidade e define origem para alinhar aos pés
        this.player.setScale(1.5);
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);
        
        this.enemyGroup = this.physics.add.group();
        const bulletGroup : Phaser.Physics.Arcade.Group = this.physics.add.group();

        // Configura os controles no teclado para usar WASD
        const keyboard : Phaser.Input.Keyboard.KeyboardPlugin = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin; 
        this.controlKeys = keyboard.addKeys({
            'up'    : Phaser.Input.Keyboard.KeyCodes.W,
            'left'  : Phaser.Input.Keyboard.KeyCodes.A,
            'down'  : Phaser.Input.Keyboard.KeyCodes.S,
            'right' : Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Configuração das áreas retangulares de spawn dos inimigos
        const outerRectangle : Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(-100, -100, GameOptions.gameSize.width + 200, GameOptions.gameSize.height + 200);
        const innerRectangle : Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(-50, -50, GameOptions.gameSize.width + 100, GameOptions.gameSize.height + 100);

        // Evento cíclico para criar novos inimigos
        this.time.addEvent({
            delay       : GameOptions.enemyRate,
            loop        : true,
            callback    : () => {
                const spawnPoint : Phaser.Geom.Point = Phaser.Geom.Rectangle.RandomOutside(outerRectangle, innerRectangle);
                const enemy : Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'enemy'); 
                this.enemyGroup.add(enemy); 
            },
        });

        // Evento cíclico para disparar projéteis automaticamente no inimigo mais próximo
        this.time.addEvent({
            delay       : GameOptions.bulletRate,
            loop        : true,
            callback    : () => {
                const closestEnemy : any = this.physics.closest(this.player, this.enemyGroup.getMatching('visible', true));
                if (closestEnemy != null) {
                    const bullet : Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.physics.add.sprite(this.player.x, this.player.y, 'bullet'); 
                    bulletGroup.add(bullet); 
                    this.physics.moveToObject(bullet, closestEnemy, GameOptions.bulletSpeed);
                }
            },
        });

        // Colisão entre Projéteis Vs Inimigos
        this.physics.add.collider(bulletGroup, this.enemyGroup, (bullet : any, enemy : any) => {
            bulletGroup.killAndHide(bullet);
            bullet.body.checkCollision.none = true;
            this.enemyGroup.killAndHide(enemy);
            enemy.body.checkCollision.none = true;
        });

        // Colisão entre Jogador Vs Inimigos (Reinicia a cena caso seja tocado)
        this.physics.add.collider(this.player, this.enemyGroup, () => {
            this.scene.restart();
        });  
    }

    // Método executado a cada frame do jogo
    update() {   
        
        // Calcula o vetor de direção com base no teclado
        let movementDirection : Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);  
        if (this.controlKeys.right.isDown) {
            movementDirection.x ++;  
        }
        if (this.controlKeys.left.isDown) {
            movementDirection.x --;
        }
        if (this.controlKeys.up.isDown) {
            movementDirection.y --;    
        }
        if (this.controlKeys.down.isDown) {
            movementDirection.y ++;    
        }
        
        // Aplica velocidade e corrige aceleração diagonal dividindo pela raiz de 2
        this.player.setVelocity(0, 0);
        if (movementDirection.x == 0 || movementDirection.y == 0) {
            this.player.setVelocity(movementDirection.x * GameOptions.playerSpeed, movementDirection.y * GameOptions.playerSpeed);
        }
        else {
            this.player.setVelocity(movementDirection.x * GameOptions.playerSpeed / Math.sqrt(2), movementDirection.y * GameOptions.playerSpeed / Math.sqrt(2));    
        } 

        // --- GERENCIADOR DINÂMICO DE ANIMAÇÃO DO MOVIMENTO ---
        if (movementDirection.x > 0) {
            this.player.anims.play('gaucho_right', true);
        } else if (movementDirection.x < 0) {
            this.player.anims.play('gaucho_left', true);
        } else if (movementDirection.y > 0) {
            this.player.anims.play('gaucho_down', true);
        } else if (movementDirection.y < 0) {
            this.player.anims.play('gaucho_up', true);
        } else {
            // Caso o personagem pare de andar, congela a animação
            this.player.anims.stop();
            // Retorna ao frame neutro inicial da linha de caminhada para baixo
            this.player.setFrame(0); 
        }

        // Faz os inimigos ativos perseguirem a posição do jogador
        this.enemyGroup.getMatching('visible', true).forEach((enemy : any) => {
            this.physics.moveToObject(enemy, this.player, GameOptions.enemySpeed);
        });
    }
}
