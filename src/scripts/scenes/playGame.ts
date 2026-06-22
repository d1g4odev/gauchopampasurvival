// THE GAME ITSELF

// modules to import
import { GameOptions } from '../gameOptions';   // game options
import { getSound } from '../soundManager';     // procedural sound

// --- DEFINIÇÃO DAS ARMAS ---
// Cada arma tem um comportamento de disparo distinto e sobe de nível.
const WEAPONS : any = {
    revolver : {
        name: 'Revólver',   desc: 'Tiro único certeiro',
        sheet: 'gaucho_walk_revolver', proj: 'proj_revolver', behavior: 'single',
        fireRate: 650, damage: 3, bulletSpeed: 280,
    },
    shotgun : {
        name: 'Espingarda', desc: 'Leque de chumbo',
        sheet: 'gaucho_walk_shotgun', proj: 'proj_shotgun', behavior: 'spread',
        fireRate: 1100, damage: 2, bulletSpeed: 250, pellets: 5, spreadDeg: 38,
    },
    rifle : {
        name: 'Rifle',      desc: 'Rápido e perfurante',
        sheet: 'gaucho_walk_rifle', proj: 'proj_rifle', behavior: 'pierce',
        fireRate: 320, damage: 2, bulletSpeed: 420, pierce: 3,
    },
    knife : {
        name: 'Faca',       desc: 'Lâminas orbitais',
        sheet: 'gaucho_walk_knife', behavior: 'orbit',
        damage: 2, orbitCount: 3, orbitRadius: 72, orbitSpeed: 0.07,
    },
    whip : {
        name: 'Chicote',    desc: 'Golpe em área',
        sheet: 'gaucho_walk_whip', behavior: 'cone',
        fireRate: 800, damage: 4, range: 135, coneDeg: 90,
    },
};

// PlayGame class extends Phaser.Scene class
export class PlayGame extends Phaser.Scene {

    constructor() {
        super({
            key : 'PlayGame'
        });
    }

    controlKeys      : any;
    player           : Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    enemyGroup       : Phaser.Physics.Arcade.Group;
    bulletGroup      : Phaser.Physics.Arcade.Group;
    enemyBulletGroup : Phaser.Physics.Arcade.Group;
    obstacleGroup    : Phaser.Physics.Arcade.StaticGroup;

    // --- ESTADO DO JOGO ---
    playerHP      : number;
    playerMaxHP   : number;
    score         : number;
    kills         : number;
    level         : number;
    xp            : number;
    xpToNext      : number;
    elapsedMs     : number;
    lastSpawn     : number;
    knockbackUntil: number;
    isInvincible  : boolean;
    isGameOver    : boolean;
    isPaused      : boolean;
    upgradeActive : boolean;
    lastDir       : string;

    // --- ARMAS (uma ativa por vez) ---
    currentWeapon   : string;
    unlockedWeapons : string[];
    weaponLevels    : { [key : string] : number };
    lastFired       : number;
    damageMult      : number;
    fireRateMult    : number;
    bulletSpeedMult : number;
    orbitals        : Phaser.GameObjects.Image[];
    orbitAngle      : number;

    // --- PODERES / ATRIBUTOS DO PERSONAGEM ---
    critChance      : number;   // chance de dano crítico (x2)
    lifestealOnKill : number;   // vida recuperada por abate
    hpRegenPerSec   : number;   // regeneração passiva de vida por segundo
    thornsDamage    : number;   // dano refletido a quem encosta no jogador
    dodgeChance     : number;   // chance de esquivar de um dano
    offArrows       : Phaser.GameObjects.Triangle[];   // setas de inimigos fora da tela

    // --- HUD ---
    xpDisplayRatio : number;
    xpBarBg    : Phaser.GameObjects.Rectangle;
    hpBarFill  : Phaser.GameObjects.Rectangle;
    hpText     : Phaser.GameObjects.Text;
    xpBarFill  : Phaser.GameObjects.Rectangle;
    levelText  : Phaser.GameObjects.Text;
    timeText   : Phaser.GameObjects.Text;
    scoreText  : Phaser.GameObjects.Text;
    killsText  : Phaser.GameObjects.Text;
    weaponText : Phaser.GameObjects.Text;
    pauseElems : Phaser.GameObjects.GameObject[];

    create() : void {

        // Reinicializa todo o estado (importante no restart da cena)
        this.playerMaxHP    = GameOptions.playerMaxHP;
        this.playerHP       = this.playerMaxHP;
        this.score          = 0;
        this.kills          = 0;
        this.level          = 1;
        this.xp             = 0;                              // abates acumulados no nível atual
        this.xpToNext       = GameOptions.baseKillsToLevel;   // abates necessários para o próximo nível
        this.xpDisplayRatio = 0;
        this.elapsedMs      = 0;
        this.lastSpawn      = 0;
        this.knockbackUntil = 0;
        this.isInvincible   = false;
        this.isGameOver     = false;
        this.isPaused       = false;
        this.upgradeActive  = false;
        this.lastDir        = 'down';

        this.currentWeapon   = 'revolver';
        this.unlockedWeapons = ['revolver'];
        this.weaponLevels    = { revolver: 1 };
        this.lastFired       = 0;
        this.damageMult      = 1;
        this.fireRateMult    = 1;
        this.bulletSpeedMult = 1;
        this.orbitals        = [];
        this.orbitAngle      = 0;
        this.pauseElems      = [];

        this.critChance      = 0;
        this.lifestealOnKill = 0;
        this.hpRegenPerSec   = 0;
        this.thornsDamage    = 0;
        this.dodgeChance     = 0;
        this.offArrows       = [];

        GameOptions.playerSpeed = GameOptions.basePlayerSpeed;

        // Garante áudio ativo e trilha tocando (idempotente)
        const snd = getSound();
        snd.resume();
        snd.startMusic();

        this.createBackground();

        // Animações de caminhada de cada arma (grade 4x4: down/up/right/left)
        Object.keys(WEAPONS).forEach(w => {
            const sheet = WEAPONS[w].sheet;
            ['down', 'up', 'right', 'left'].forEach((dir, i) => {
                const key = `gaucho_${w}_${dir}`;
                if (!this.anims.exists(key)) {
                    this.anims.create({ key, frames: this.anims.generateFrameNumbers(sheet, { start: i * 4, end: i * 4 + 3 }), frameRate: 8, repeat: -1 });
                }
            });
        });

        // Mundo grande com câmera seguindo o jogador
        const worldW = GameOptions.worldSize.width;
        const worldH = GameOptions.worldSize.height;
        this.physics.world.setBounds(0, 0, worldW, worldH);
        this.cameras.main.setBounds(0, 0, worldW, worldH);

        // Gaúcho no centro do mundo
        this.player = this.physics.add.sprite(worldW / 2, worldH / 2, WEAPONS.revolver.sheet, 0);
        this.player.setScale(0.6);
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(this.player.width * 0.4, this.player.height * 0.4);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Animações de caminhada dos inimigos
        ['inimigo1', 'inimigo2', 'inimigo3', 'inimigo4', 'inimigo5'].forEach(type => {
            const key = `${type}_walk`;
            ['down', 'up', 'right', 'left'].forEach((dir, i) => {
                const animKey = `${type}_${dir}`;
                if (!this.anims.exists(animKey)) {
                    this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(key, { start: i * 4, end: i * 4 + 3 }), frameRate: 8, repeat: -1 });
                }
            });
        });

        // Animações de ataque do pistoleiro (inimigo5)
        ['down', 'up', 'right', 'left'].forEach((dir, i) => {
            const animKey = `inimigo5_attack_${dir}`;
            if (!this.anims.exists(animKey)) {
                this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers('inimigo5_attack', { start: i * 4, end: i * 4 + 3 }), frameRate: 8, repeat: -1 });
            }
        });

        this.enemyGroup       = this.physics.add.group();
        this.bulletGroup      = this.physics.add.group();
        this.enemyBulletGroup = this.physics.add.group();
        this.obstacleGroup    = this.physics.add.staticGroup();
        this.createObstacles();

        const keyboard : Phaser.Input.Keyboard.KeyboardPlugin = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
        this.controlKeys = keyboard.addKeys({
            'up'    : Phaser.Input.Keyboard.KeyCodes.W,
            'left'  : Phaser.Input.Keyboard.KeyCodes.A,
            'down'  : Phaser.Input.Keyboard.KeyCodes.S,
            'right' : Phaser.Input.Keyboard.KeyCodes.D,
            'fire'  : Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // ESC pausa, M muta
        keyboard.on('keydown-ESC', () => this.togglePause());
        keyboard.on('keydown-M',   () => getSound().toggleMute());

        // Cursor de mira
        this.input.setDefaultCursor('crosshair');

        // Projétil x Inimigo (com perfuração e lista de já-atingidos)
        this.physics.add.collider(this.bulletGroup, this.enemyGroup, (bullet : any, enemy : any) => {
            const hitList : any[] = bullet.getData('hitList') || [];
            if (hitList.includes(enemy)) return;
            hitList.push(enemy);
            bullet.setData('hitList', hitList);

            this.damageEnemy(enemy, bullet.getData('damage') || 1);

            const pierce = (bullet.getData('pierce') || 1) - 1;
            bullet.setData('pierce', pierce);
            if (pierce <= 0) {
                this.bulletGroup.killAndHide(bullet);
                bullet.body.checkCollision.none = true;
                bullet.body.enable = false;
            }
        });

        // Jogador x Inimigo (dano por contato; Espinhos reflete dano de volta no toque)
        this.physics.add.overlap(this.player, this.enemyGroup, (_p : any, enemy : any) => {
            const willHit = !this.isInvincible && !this.isGameOver;
            this.damagePlayer(enemy.x, enemy.y, GameOptions.enemyDamage);
            if (willHit && this.thornsDamage > 0 && enemy.active) this.damageEnemy(enemy, this.thornsDamage);
        });
        // Jogador e inimigos colidem com os obstáculos (bloqueio de movimento)
        this.physics.add.collider(this.player, this.obstacleGroup);
        this.physics.add.collider(this.enemyGroup, this.obstacleGroup);

        // Projétil do jogador x Obstáculo (some; se for destrutível, leva dano)
        this.physics.add.collider(this.bulletGroup, this.obstacleGroup, (bullet : any, obs : any) => {
            this.hitObstacle(obs, bullet.getData('damage') || 1);
            this.bulletGroup.killAndHide(bullet);
            bullet.body.checkCollision.none = true;
            bullet.body.enable = false;
        });

        // Projétil inimigo x Jogador (dano) — a cobertura corta a linha de tiro
        this.physics.add.overlap(this.player, this.enemyBulletGroup, (_p : any, bullet : any) => {
            this.damagePlayer(bullet.x, bullet.y, GameOptions.enemyBulletDamage);
            this.enemyBulletGroup.killAndHide(bullet);
            bullet.body.enable = false;
        });
        // Projétil inimigo x Obstáculo (some — é o escudo funcionando)
        this.physics.add.collider(this.enemyBulletGroup, this.obstacleGroup, (bullet : any) => {
            this.enemyBulletGroup.killAndHide(bullet);
            bullet.body.enable = false;
        });

        this.createHUD();
        this.equipWeapon('revolver');
    }

    update(_time : number, delta : number) {

        if (this.isGameOver || this.isPaused) {
            return;
        }

        this.elapsedMs += delta;
        this.updateHUD();
        this.cleanupEnemyBullets();
        this.updateOffscreenIndicators();

        // Regeneração passiva de vida (upgrade)
        if (this.hpRegenPerSec > 0 && this.playerHP < this.playerMaxHP) {
            this.playerHP = Math.min(this.playerMaxHP, this.playerHP + this.hpRegenPerSec * delta / 1000);
        }

        // Spawna respeitando o teto de inimigos vivos do nível atual
        if (this.time.now > this.lastSpawn + this.spawnRate() && this.enemyGroup.countActive(true) < this.maxEnemiesForLevel()) {
            this.spawnEnemy();
            this.lastSpawn = this.time.now;
        }

        this.handleWeaponFire();

        // Direção pelo teclado
        let movementDirection : Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
        if (this.controlKeys.right.isDown) movementDirection.x ++;
        if (this.controlKeys.left.isDown)  movementDirection.x --;
        if (this.controlKeys.up.isDown)    movementDirection.y --;
        if (this.controlKeys.down.isDown)  movementDirection.y ++;

        // Durante knockback, mantém o empurrão
        if (this.time.now < this.knockbackUntil) {
            this.updateMovementAnimation(movementDirection);
            this.updateEnemies();
            this.updateOrbitals();
            return;
        }

        this.player.setVelocity(0, 0);
        if (movementDirection.x == 0 || movementDirection.y == 0) {
            this.player.setVelocity(movementDirection.x * GameOptions.playerSpeed, movementDirection.y * GameOptions.playerSpeed);
        } else {
            this.player.setVelocity(movementDirection.x * GameOptions.playerSpeed / Math.sqrt(2), movementDirection.y * GameOptions.playerSpeed / Math.sqrt(2));
        }

        this.updateMovementAnimation(movementDirection);
        this.updateEnemies();
        this.updateOrbitals();
    }

    // --- DIFICULDADE PROGRESSIVA (escala com o NÍVEL, com leve componente de tempo) ---
    difficulty() : number { return (this.level - 1) + Math.floor(this.elapsedMs / 60000); }
    spawnRate() : number { return Math.max(300, GameOptions.enemyRate - (this.level - 1) * 70 - Math.floor(this.elapsedMs / 60000) * 40); }

    // Teto de inimigos vivos ao mesmo tempo — cresce com o nível, limitado por maxEnemies
    maxEnemiesForLevel() : number {
        return Math.min(GameOptions.maxEnemies, GameOptions.baseMaxEnemies + this.level * GameOptions.enemiesPerLevel);
    }

    // Abates necessários para subir do nível atual
    killsNeeded() : number {
        return GameOptions.baseKillsToLevel + (this.level - 1) * GameOptions.killsGrowthPerLevel;
    }

    spawnEnemy() : void {
        // Inimigos nascem logo fora da área visível (ao redor do jogador), não nas bordas do mundo
        const view = this.cameras.main.worldView;
        const outer = new Phaser.Geom.Rectangle(view.x - 120, view.y - 120, view.width + 240, view.height + 240);
        const inner = new Phaser.Geom.Rectangle(view.x - 40,  view.y - 40,  view.width + 80,  view.height + 80);
        const spawnPoint = Phaser.Geom.Rectangle.RandomOutside(outer, inner);

        // A partir do nível 2, parte dos inimigos são atiradores (pistoleiros) — chance cresce com o nível
        const shooterChance = Math.min(0.35, 0.08 + (this.level - 1) * 0.03);
        const isShooter = this.level >= 2 && Math.random() < shooterChance;

        let type : string;
        if (isShooter) {
            type = 'inimigo5';
        } else {
            const names = ['inimigo1', 'inimigo2', 'inimigo3', 'inimigo4', 'inimigo5'];
            type = names[Phaser.Math.Between(0, names.length - 1)];
        }

        const enemy : any = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, `${type}_walk`, 0);
        enemy.setScale(0.5);
        const maxHp = GameOptions.enemyBaseHP + this.difficulty();
        enemy.setData('type', type);
        enemy.setData('role', isShooter ? 'ranged' : 'melee');
        enemy.setData('hp', maxHp);
        enemy.setData('maxHp', maxHp);
        enemy.setData('bladeCd', 0);
        enemy.setData('shootCd', this.time.now + GameOptions.enemyShootRate);
        enemy.body.setSize(enemy.width * 0.5, enemy.height * 0.5);
        enemy.anims.play(`${type}_down`, true);
        if (isShooter) enemy.setTint(0xffcc88);   // leve destaque dourado no pistoleiro
        this.enemyGroup.add(enemy);

        // Barra de vida abaixo do inimigo
        const barBg   = this.add.rectangle(enemy.x, enemy.y + 24, 40, 6, 0x000000, 0.7).setDepth(8);
        const barFill = this.add.rectangle(enemy.x - 19, enemy.y + 24, 38, 4, 0x33dd44).setOrigin(0, 0.5).setDepth(9);
        enemy.setData('barBg', barBg);
        enemy.setData('barFill', barFill);
    }

    updateMovementAnimation(movementDirection : Phaser.Math.Vector2) : void {
        const w = this.currentWeapon;
        // O gaúcho sempre encara o cursor (mira)
        const dir = this.angleToDir(this.aimAngle());
        this.lastDir = dir;
        const moving = movementDirection.x !== 0 || movementDirection.y !== 0;
        if (moving) {
            this.player.anims.play(`gaucho_${w}_${dir}`, true);
        } else {
            // Parado: congela no primeiro frame da direção encarada
            this.player.anims.stop();
            const idleFrame : any = { down: 0, up: 4, right: 8, left: 12 };
            this.player.setFrame(idleFrame[dir]);
        }
    }

    updateEnemies() : void {
        const speed = GameOptions.enemySpeed + this.difficulty() * 6;
        this.enemyGroup.getMatching('visible', true).forEach((enemy : any) => {
            const type = enemy.getData('type') as string;
            const role = enemy.getData('role') as string;
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (role === 'ranged' && dist < GameOptions.enemyShootRange) {
                // Pistoleiro: para na distância de tiro e dispara
                enemy.setVelocity(0, 0);
                if (this.time.now > enemy.getData('shootCd')) {
                    enemy.setData('shootCd', this.time.now + GameOptions.enemyShootRate);
                    this.fireEnemyBullet(enemy);
                }
            } else {
                this.physics.moveToObject(enemy, this.player, speed);
            }

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const attackSuffix = (role === 'ranged' && dist < GameOptions.enemyShootRange && enemy.getData('type') === 'inimigo5') ? '_attack' : '';
            const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            enemy.anims.play(`${type}${attackSuffix}_${dir}`, true);

            // Acompanha a barra de vida abaixo do inimigo
            const barBg   = enemy.getData('barBg');
            const barFill = enemy.getData('barFill');
            if (barBg && barFill) {
                const by = enemy.y + 24;
                barBg.setPosition(enemy.x, by);
                barFill.setPosition(enemy.x - 19, by);
                const ratio = Phaser.Math.Clamp(enemy.getData('hp') / enemy.getData('maxHp'), 0, 1);
                barFill.width = 38 * ratio;
                barFill.setFillStyle(ratio > 0.5 ? 0x33dd44 : ratio > 0.25 ? 0xddaa33 : 0xdd3333);
            }
        });
    }

    // --- O PISTOLEIRO ATIRA NO JOGADOR ---
    fireEnemyBullet(enemy : any) : void {
        getSound().shoot('rifle');
        const bullet : any = this.enemyBulletGroup.get(enemy.x, enemy.y, 'enemy_bullet');
        if (!bullet) return;
        bullet.setTexture('enemy_bullet');
        bullet.setActive(true).setVisible(true);
        bullet.body.enable = true;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        bullet.setVelocity(Math.cos(angle) * GameOptions.enemyBulletSpeed, Math.sin(angle) * GameOptions.enemyBulletSpeed);
        bullet.setRotation(angle);
    }

    // Recolhe projéteis inimigos que saíram da área visível
    cleanupEnemyBullets() : void {
        const view = this.cameras.main.worldView;
        this.enemyBulletGroup.getMatching('visible', true).forEach((b : any) => {
            if (b.x < view.x - 60 || b.x > view.right + 60 || b.y < view.y - 60 || b.y > view.bottom + 60) {
                this.enemyBulletGroup.killAndHide(b);
                b.body.enable = false;
            }
        });
    }

    // --- DANO A UM OBSTÁCULO DESTRUTÍVEL ---
    hitObstacle(obs : any, dmg : number) : void {
        if (!obs.getData('destructible')) return;
        const hp = obs.getData('hp') - dmg;
        obs.setData('hp', hp);
        obs.setTintFill(0xffffff);
        this.time.delayedCall(60, () => { if (obs.active) obs.clearTint(); });
        if (hp <= 0) {
            const ox = obs.x, oy = obs.y;
            const drop = obs.getData('drop');
            obs.destroy();
            this.spawnDeathPuff(ox, oy);
            if (drop === 'heal') {
                this.playerHP = Math.min(this.playerMaxHP, this.playerHP + 20);
                this.showFloatText('+20', ox, oy - 20, '#44ff66');
                this.updateHUD();
            } else if (drop === 'xp') {
                // Arbusto dá progresso de nível (equivale a um abate)
                this.showFloatText('+1', ox, oy - 20, '#7ddcff', 14);
                this.gainLevelProgress();
                this.updateHUD();
            }
        }
    }

    // --- ESPALHA OBSTÁCULOS PELO CENÁRIO ---
    createObstacles() : void {
        const { width, height } = GameOptions.worldSize;
        const cx = width / 2, cy = height / 2;
        const placed : { x : number, y : number }[] = [];

        // Tipos: rock/fence sólidos; barrel/bush destrutíveis com loot
        const kinds = [
            { tex: 'rock',   destructible: false, hp: 0,  drop: ''     },
            { tex: 'fence',  destructible: false, hp: 0,  drop: ''     },
            { tex: 'barrel', destructible: true,  hp: 8,  drop: 'heal' },
            { tex: 'bush',   destructible: true,  hp: 4,  drop: 'xp'   },
        ];

        let attempts = 0;
        const target = Math.floor((width * height) / 120000);   // densidade proporcional à área
        while (placed.length < target && attempts < 1000) {
            attempts++;
            const x = Phaser.Math.Between(70, width - 70);
            const y = Phaser.Math.Between(70, height - 70);
            // Evita o centro (spawn do jogador) e sobreposição com outros obstáculos
            if (Phaser.Math.Distance.Between(x, y, cx, cy) < 160) continue;
            if (placed.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < 90)) continue;
            placed.push({ x, y });

            const k = kinds[Phaser.Math.Between(0, kinds.length - 1)];
            const obs : any = this.obstacleGroup.create(x, y, k.tex);
            obs.setDepth(1);
            obs.setData('destructible', k.destructible);
            obs.setData('hp', k.hp);
            obs.setData('drop', k.drop);
        }
    }

    // ==========================================================
    //  SISTEMA DE ARMAS (múltiplas simultâneas)
    // ==========================================================

    // Equipa uma arma (substitui a atual). Desbloqueia se for a primeira vez.
    equipWeapon(w : string) : void {
        if (!this.unlockedWeapons.includes(w)) {
            this.unlockedWeapons.push(w);
            this.weaponLevels[w] = 1;
        }
        this.currentWeapon = w;
        this.player.setTexture(WEAPONS[w].sheet, 0);
        this.lastFired = this.time.now;
        this.rebuildOrbitals();   // cria lâminas se for a faca, limpa caso contrário
        this.updateWeaponHUD();
    }

    levelUpWeapon(w : string) : void {
        this.weaponLevels[w] += 1;
        if (w === this.currentWeapon) this.rebuildOrbitals();
        this.updateWeaponHUD();
    }

    effDamage(key : string) : number {
        const lvl = this.weaponLevels[key];
        return WEAPONS[key].damage * (1 + 0.3 * (lvl - 1)) * this.damageMult;
    }

    // Recria as lâminas orbitais — só existem quando a arma atual é a faca
    rebuildOrbitals() : void {
        this.orbitals.forEach(o => o.destroy());
        this.orbitals = [];
        if (this.currentWeapon !== 'knife') return;
        const lvl = this.weaponLevels['knife'];
        const count = Math.min(8, WEAPONS.knife.orbitCount + Math.floor((lvl - 1) / 2));
        for (let i = 0; i < count; i++) {
            this.orbitals.push(this.add.image(this.player.x, this.player.y, 'blade').setDepth(7));
        }
    }

    // Dispara a arma atual no ESPAÇO, na direção que o gaúcho está virado
    handleWeaponFire() : void {
        const key = this.currentWeapon;
        const w = WEAPONS[key];
        if (w.behavior === 'orbit') return;   // faca: dano contínuo em updateOrbitals (passiva, sem tiro)

        // Atira com clique esquerdo ou ESPAÇO
        const firing = this.input.activePointer.leftButtonDown() || this.controlKeys.fire.isDown;
        if (!firing) return;

        const effFireRate = w.fireRate * this.fireRateMult;
        if (this.time.now <= this.lastFired + effFireRate) return;   // cooldown entre tiros

        const angle = this.aimAngle();   // mira na direção do cursor (360°)

        if (w.behavior === 'cone') {
            // chicote: golpe em área, NENHUM projétil
            this.fireCone(key, angle);
        } else {
            const lvl = this.weaponLevels[key];
            if (w.behavior === 'spread') {
                this.fireSpreadN(key, angle, w.pellets + (lvl - 1));
            } else if (w.behavior === 'pierce') {
                this.fireProjectile(key, angle, w.pierce + Math.floor((lvl - 1) / 2), 0);
            } else {
                // revólver: ganha projéteis extras com o nível
                const shots = 1 + Math.floor((lvl - 1) / 2);
                if (shots === 1) {
                    this.fireProjectile(key, angle, 1, 0);
                } else {
                    const spread = 14 * (shots - 1);
                    for (let i = 0; i < shots; i++) {
                        this.fireProjectile(key, angle, 1, -spread / 2 + (spread / (shots - 1)) * i);
                    }
                }
            }
        }
        this.lastFired = this.time.now;
        getSound().shoot(key);
        this.muzzleFlash(angle);
    }

    // Clarão rápido na direção do tiro (feedback visual)
    muzzleFlash(angle : number) : void {
        const fx = this.player.x + Math.cos(angle) * 26;
        const fy = this.player.y - 18 + Math.sin(angle) * 26;
        const flash = this.add.circle(fx, fy, 7, 0xfff2a8, 0.95).setDepth(7);
        this.tweens.add({
            targets: flash, scale: 1.8, alpha: 0, duration: 110,
            onComplete: () => flash.destroy(),
        });
    }

    fireProjectile(weaponKey : string, baseAngle : number, pierce : number, angleOffsetDeg : number) : void {
        const w = WEAPONS[weaponKey];
        const bullet : any = this.bulletGroup.get(this.player.x, this.player.y, w.proj);
        if (!bullet) return;
        bullet.setTexture(w.proj);
        bullet.setActive(true).setVisible(true);
        bullet.body.checkCollision.none = false;
        bullet.body.enable = true;
        bullet.setData('damage', this.effDamage(weaponKey));
        bullet.setData('pierce', pierce);
        bullet.setData('hitList', []);

        const angle = baseAngle + Phaser.Math.DegToRad(angleOffsetDeg);
        const speed = w.bulletSpeed * this.bulletSpeedMult;
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setRotation(angle);
    }

    fireSpreadN(weaponKey : string, baseAngle : number, n : number) : void {
        const spread = WEAPONS[weaponKey].spreadDeg;
        for (let i = 0; i < n; i++) {
            const offset = -spread / 2 + (spread / (n - 1)) * i;
            this.fireProjectile(weaponKey, baseAngle, 1, offset);
        }
    }

    fireCone(weaponKey : string, angle : number) : void {
        const w = WEAPONS[weaponKey];
        const half = Phaser.Math.DegToRad(w.coneDeg / 2);

        const g = this.add.graphics().setDepth(6);
        g.fillStyle(0xffffff, 0.22);
        g.slice(this.player.x, this.player.y, w.range, angle - half, angle + half, false);
        g.fillPath();
        this.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });

        const dmg = this.effDamage(weaponKey);
        this.enemyGroup.getMatching('visible', true).forEach((enemy : any) => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (d <= w.range) {
                const a = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (Math.abs(Phaser.Math.Angle.Wrap(a - angle)) <= half) {
                    this.damageEnemy(enemy, dmg);
                }
            }
        });
    }

    updateOrbitals() : void {
        if (this.orbitals.length === 0) return;
        const w = WEAPONS.knife;
        this.orbitAngle += w.orbitSpeed;
        const count = this.orbitals.length;
        const dmg = this.effDamage('knife');

        this.orbitals.forEach((blade, i) => {
            const a = this.orbitAngle + (i / count) * Math.PI * 2;
            blade.x = this.player.x + Math.cos(a) * w.orbitRadius;
            blade.y = this.player.y + Math.sin(a) * w.orbitRadius;
            blade.setRotation(a);

            this.enemyGroup.getMatching('visible', true).forEach((enemy : any) => {
                if (this.time.now > enemy.getData('bladeCd')) {
                    if (Phaser.Math.Distance.Between(blade.x, blade.y, enemy.x, enemy.y) < 26) {
                        this.damageEnemy(enemy, dmg);
                        enemy.setData('bladeCd', this.time.now + 350);
                    }
                }
            });
        });
    }

    dirToAngle(dir : string) : number {
        switch (dir) {
            case 'right': return 0;
            case 'left':  return Math.PI;
            case 'up':    return -Math.PI / 2;
            default:      return Math.PI / 2;
        }
    }

    // Ângulo do jogador até o cursor, em coordenadas do mundo (câmera segue o jogador)
    aimAngle() : number {
        const p = this.input.activePointer;
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        return Phaser.Math.Angle.Between(this.player.x, this.player.y, wp.x, wp.y);
    }

    // Converte um ângulo na direção cardeal mais próxima (para o sprite de 4 direções)
    angleToDir(angle : number) : string {
        const deg = Phaser.Math.RadToDeg(angle);
        if (deg >= -45 && deg < 45)  return 'right';
        if (deg >= 45 && deg < 135)  return 'down';
        if (deg >= -135 && deg < -45) return 'up';
        return 'left';
    }

    // ==========================================================
    //  COMBATE / PROGRESSÃO
    // ==========================================================

    damageEnemy(enemy : any, dmg : number) : void {
        if (!enemy.active) return;

        // Crítico: chance de dobrar o dano
        const isCrit = this.critChance > 0 && Math.random() < this.critChance;
        const finalDmg = isCrit ? dmg * 2 : dmg;

        const hp = enemy.getData('hp') - finalDmg;
        enemy.setData('hp', hp);
        getSound().hit();

        // Número de dano subindo (amarelo/maior no crítico)
        const shown = Math.max(1, Math.round(finalDmg));
        this.showFloatText(isCrit ? `${shown}!` : `${shown}`, enemy.x + Phaser.Math.Between(-6, 6), enemy.y - 14,
            isCrit ? '#ffd23f' : '#ffffff', isCrit ? 22 : 15);

        enemy.setTintFill(0xffffff);
        this.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); });

        if (hp <= 0) this.killEnemy(enemy);
    }

    killEnemy(enemy : any) : void {
        const ex = enemy.x, ey = enemy.y;
        this.enemyGroup.killAndHide(enemy);
        enemy.clearTint();
        enemy.body.checkCollision.none = true;
        enemy.body.enable = false;

        // Remove a barra de vida do inimigo morto
        const barBg = enemy.getData('barBg');   if (barBg)   barBg.destroy();
        const barFill = enemy.getData('barFill'); if (barFill) barFill.destroy();
        enemy.setData('barBg', null);
        enemy.setData('barFill', null);

        this.score += GameOptions.scorePerKill;
        this.kills += 1;
        getSound().death();
        this.spawnDeathPuff(ex, ey);

        // Progressão: cada abate conta para subir de nível
        this.gainLevelProgress();

        // Sede de Sangue (upgrade): cura por abate
        if (this.lifestealOnKill > 0 && this.playerHP < this.playerMaxHP) {
            this.playerHP = Math.min(this.playerMaxHP, this.playerHP + this.lifestealOnKill);
            this.showFloatText(`+${this.lifestealOnKill}`, ex, ey - 28, '#44ff66', 14);
        }

        // Auto-cura leve a cada N abates (se não estiver com a vida cheia)
        if (this.kills % GameOptions.healPerKills === 0 && this.playerHP < this.playerMaxHP) {
            this.playerHP = Math.min(this.playerMaxHP, this.playerHP + GameOptions.healAmount);
            this.showFloatText(`+${GameOptions.healAmount}`, this.player.x, this.player.y - 40, '#44ff66');
        }
        this.updateHUD();
    }

    // Balãozinho de texto subindo e sumindo (minimalista)
    showFloatText(text : string, x : number, y : number, color : string, size : number = 18) : void {
        const t = this.add.text(x, y, text, {
            fontFamily: 'monospace', fontSize: `${size}px`, color, fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(50);
        t.setStroke('#000000', 3);
        this.tweens.add({
            targets: t, y: y - 34, alpha: 0, duration: 750, ease: 'Cubic.easeOut',
            onComplete: () => t.destroy(),
        });
    }

    // Cada abate conta como 1 ponto de progresso; ao atingir o necessário, sobe de nível
    gainLevelProgress() : void {
        this.xp += 1;
        if (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.levelUp();
        }
    }

    levelUp() : void {
        this.level += 1;
        this.xpToNext = this.killsNeeded();   // próximo nível exige mais abates
        getSound().levelUp();
        this.cameras.main.flash(220, 255, 240, 180);   // clarão de level up (juice)
        this.showUpgradeMenu();
    }

    damagePlayer(srcX : number, srcY : number, dmg : number) : void {
        if (this.isInvincible || this.isGameOver) return;

        // Esquiva (upgrade): chance de ignorar o dano por completo
        if (this.dodgeChance > 0 && Math.random() < this.dodgeChance) {
            this.showFloatText('ESQUIVA', this.player.x, this.player.y - 40, '#9adfff', 14);
            return;
        }

        this.playerHP -= dmg;
        this.isInvincible = true;
        getSound().hurt();

        const angle = Phaser.Math.Angle.Between(srcX, srcY, this.player.x, this.player.y);
        this.player.setVelocity(Math.cos(angle) * GameOptions.knockbackForce, Math.sin(angle) * GameOptions.knockbackForce);
        this.knockbackUntil = this.time.now + GameOptions.knockbackMs;

        this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true, repeat: 3 });
        this.cameras.main.shake(120, 0.008);

        this.time.delayedCall(GameOptions.invincibilityMs, () => {
            this.isInvincible = false;
            this.player.setAlpha(1);
        });

        this.updateHUD();
        if (this.playerHP <= 0) {
            this.playerHP = 0;
            this.gameOver();
        }
    }

    spawnDeathPuff(x : number, y : number) : void {
        for (let i = 0; i < 6; i++) {
            const p = this.add.rectangle(x, y, 4, 4, 0xc4a265).setDepth(5);
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 18;
            this.tweens.add({
                targets : p,
                x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
                alpha: 0, duration: 350, onComplete: () => p.destroy(),
            });
        }
    }

    // --- PAUSA (ESC) ---
    togglePause() : void {
        if (this.isGameOver || this.upgradeActive) return;

        if (this.isPaused) {
            this.isPaused = false;
            this.physics.resume();
            this.pauseElems.forEach(e => e.destroy());
            this.pauseElems = [];
        } else {
            this.isPaused = true;
            this.physics.pause();
            const width = this.scale.width, height = this.scale.height;
            this.pauseElems.push(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setScrollFactor(0).setDepth(2500));
            this.pauseElems.push(this.add.text(width / 2, height / 2 - 20, 'PAUSADO', {
                fontFamily: 'monospace', fontSize: '54px', color: '#ffffff', fontStyle: 'bold',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(2501));
            this.pauseElems.push(this.add.text(width / 2, height / 2 + 40, 'ESC para continuar', {
                fontFamily: 'monospace', fontSize: '20px', color: '#ffcc44',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(2501));
        }
    }

    gameOver() : void {
        this.isGameOver = true;
        this.physics.pause();
        this.orbitals.forEach(o => o.setVisible(false));
        this.player.setTint(0xff4444);
        this.player.anims.stop();
        const snd = getSound();
        snd.stopMusic();
        snd.gameOver();

        const width = this.scale.width, height = this.scale.height;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setScrollFactor(0).setDepth(2000);
        this.add.text(width / 2, height / 2 - 80, 'VOCÊ TOMBOU', {
            fontFamily: 'monospace', fontSize: '52px', color: '#ff5555', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        const min = Math.floor(this.elapsedMs / 60000);
        const sec = Math.floor((this.elapsedMs % 60000) / 1000);
        const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

        // Recorde persistente (localStorage) — compara por pontuação
        const best = this.loadBest();
        const isNewRecord = this.score > best.score;
        if (isNewRecord) {
            this.saveBest({ score: this.score, kills: this.kills, level: this.level, timeMs: this.elapsedMs });
        }
        const bestNow = isNewRecord
            ? { score: this.score, kills: this.kills, level: this.level, timeMs: this.elapsedMs }
            : best;
        const bestMin = Math.floor(bestNow.timeMs / 60000);
        const bestSec = Math.floor((bestNow.timeMs % 60000) / 1000);
        const bestTimeStr = `${bestMin.toString().padStart(2, '0')}:${bestSec.toString().padStart(2, '0')}`;

        this.add.text(width / 2, height / 2 + 10,
            `Tempo: ${timeStr}\nAbates: ${this.kills}\nPontos: ${this.score}\nNível: ${this.level}`, {
            fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', align: 'center',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        if (isNewRecord) {
            const rec = this.add.text(width / 2, height / 2 + 95, '★ NOVO RECORDE! ★', {
                fontFamily: 'monospace', fontSize: '26px', color: '#ffdd44', fontStyle: 'bold',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
            this.tweens.add({ targets: rec, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
        } else {
            this.add.text(width / 2, height / 2 + 95,
                `Recorde: ${bestNow.score} pts · ${bestTimeStr} · Nv ${bestNow.level}`, {
                fontFamily: 'monospace', fontSize: '18px', color: '#aaaaaa',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
        }

        const hint = this.add.text(width / 2, height / 2 + 140, 'ESPAÇO joga de novo  •  ESC volta ao menu', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ffcc44',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
        this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

        this.input.keyboard!.once('keydown-SPACE', () => this.scene.restart());
        this.input.keyboard!.once('keydown-ESC',   () => this.scene.start('Menu'));
    }

    // --- RECORDE PERSISTENTE (localStorage) ---
    loadBest() : { score : number, kills : number, level : number, timeMs : number } {
        const empty = { score: 0, kills: 0, level: 0, timeMs: 0 };
        try {
            const raw = localStorage.getItem('gaucho_best');
            return raw ? { ...empty, ...JSON.parse(raw) } : empty;
        } catch (e) {
            return empty;
        }
    }

    saveBest(best : { score : number, kills : number, level : number, timeMs : number }) : void {
        try { localStorage.setItem('gaucho_best', JSON.stringify(best)); } catch (e) { /* ignora */ }
    }

    // --- MENU DE UPGRADE NO LEVEL UP ---
    showUpgradeMenu() : void {
        this.isPaused = true;
        this.upgradeActive = true;
        this.physics.pause();

        const width = this.scale.width, height = this.scale.height;

        // Trocar para outra arma (substitui a atual). Marca "(nova)" se ainda não desbloqueada.
        const switchChoices = Object.keys(WEAPONS).filter(w => w !== this.currentWeapon).map(w => {
            const isNew = !this.unlockedWeapons.includes(w);
            return {
                title: `${isNew ? 'Nova arma' : 'Trocar p/'}: ${WEAPONS[w].name}`,
                desc : isNew ? WEAPONS[w].desc : `${WEAPONS[w].desc} (Nv ${this.weaponLevels[w]})`,
                weapon: true,
                apply: () => this.equipWeapon(w),
            };
        });

        // Subir o nível da arma atualmente equipada
        const cur = this.currentWeapon;
        const levelUpCurrent = {
            title: `${WEAPONS[cur].name} Nv ${this.weaponLevels[cur] + 1}`,
            desc : 'Aprimora a arma equipada', weapon: true,
            apply: () => this.levelUpWeapon(cur),
        };

        const statChoices = [
            { title: 'Gatilho Rápido', desc: '+20% cadência',           weapon: false, apply: () => { this.fireRateMult *= 0.8; } },
            { title: 'Pólvora Forte',  desc: '+25% dano',                weapon: false, apply: () => { this.damageMult *= 1.25; } },
            { title: 'Couro Curtido',  desc: '+25 vida máx. e cura',     weapon: false, apply: () => { this.playerMaxHP += 25; this.playerHP = Math.min(this.playerMaxHP, this.playerHP + 25); } },
            { title: 'Pés Ligeiros',   desc: '+15% velocidade',          weapon: false, apply: () => { GameOptions.playerSpeed *= 1.15; } },
            { title: 'Bala Veloz',     desc: '+25% vel. do projétil',    weapon: false, apply: () => { this.bulletSpeedMult *= 1.25; } },
            { title: 'Pampa Restaura', desc: 'Cura 40 de vida',          weapon: false, apply: () => { this.playerHP = Math.min(this.playerMaxHP, this.playerHP + 40); } },
            // --- Novos poderes ---
            { title: 'Olho de Águia',   desc: '+15% chance de crítico (x2 dano)', weapon: false, apply: () => { this.critChance = Math.min(0.85, this.critChance + 0.15); } },
            { title: 'Sede de Sangue',  desc: '+4 de vida por abate',             weapon: false, apply: () => { this.lifestealOnKill += 4; } },
            { title: 'Sangue do Pampa', desc: '+1.5 vida/seg (regeneração)',      weapon: false, apply: () => { this.hpRegenPerSec += 1.5; } },
            { title: 'Couro de Espinho',desc: 'Inimigos levam 6 ao te tocar',     weapon: false, apply: () => { this.thornsDamage += 6; } },
            { title: 'Corpo Mole',      desc: '+12% de esquiva',                  weapon: false, apply: () => { this.dodgeChance = Math.min(0.6, this.dodgeChance + 0.12); } },
        ];

        // Monta 3 opções: 1 relacionada a arma (evoluir a atual OU trocar) + 2 atributos/poderes
        const weaponOption = (switchChoices.length > 0 && Math.random() < 0.5)
            ? Phaser.Utils.Array.GetRandom(switchChoices)
            : levelUpCurrent;
        const pool : any[] = [weaponOption];
        const rest = Phaser.Utils.Array.Shuffle([...statChoices]);
        for (const r of rest) {
            if (pool.length >= 3) break;
            pool.push(r);
        }
        Phaser.Utils.Array.Shuffle(pool);
        const choices = pool.slice(0, 3);

        const elements : Phaser.GameObjects.GameObject[] = [];
        elements.push(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setScrollFactor(0).setDepth(3000));
        elements.push(this.add.text(width / 2, 150, `NÍVEL ${this.level}!`, {
            fontFamily: 'monospace', fontSize: '46px', color: '#ffdd44', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(3001));
        elements.push(this.add.text(width / 2, 205, 'Escolha um upgrade  (1 / 2 / 3)', {
            fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(3001));

        const cardW = 200, cardH = 240, gap = 30;
        const totalW = cardW * 3 + gap * 2;
        const startX = (width - totalW) / 2 + cardW / 2;
        const cardY  = height / 2 + 30;

        choices.forEach((choice, i) => {
            const cx = startX + i * (cardW + gap);
            const stroke = choice.weapon ? 0xff8844 : 0xffdd44;
            const card = this.add.rectangle(cx, cardY, cardW, cardH, 0x2a2118).setStrokeStyle(3, stroke).setScrollFactor(0).setDepth(3001).setInteractive({ useHandCursor: true });
            const num  = this.add.text(cx, cardY - 85, `[${i + 1}]`, { fontFamily: 'monospace', fontSize: '26px', color: Phaser.Display.Color.IntegerToColor(stroke).rgba }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);
            const ttl  = this.add.text(cx, cardY - 30, choice.title, { fontFamily: 'monospace', fontSize: '19px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: cardW - 24 } }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);
            const dsc  = this.add.text(cx, cardY + 45, choice.desc, { fontFamily: 'monospace', fontSize: '15px', color: '#cccccc', align: 'center', wordWrap: { width: cardW - 24 } }).setOrigin(0.5).setScrollFactor(0).setDepth(3002);
            elements.push(card, num, ttl, dsc);
            card.on('pointerover', () => card.setFillStyle(0x3d3020));
            card.on('pointerout',  () => card.setFillStyle(0x2a2118));
            card.on('pointerdown', () => this.applyUpgrade(choice, elements, keyHandler));
        });

        const keyHandler = (event : KeyboardEvent) => {
            const idx = parseInt(event.key, 10) - 1;
            if (idx >= 0 && idx < choices.length) {
                this.applyUpgrade(choices[idx], elements, keyHandler);
            }
        };
        this.input.keyboard!.on('keydown', keyHandler);
    }

    applyUpgrade(choice : any, elements : Phaser.GameObjects.GameObject[], keyHandler : any) : void {
        this.input.keyboard!.off('keydown', keyHandler);
        choice.apply();
        elements.forEach(e => e.destroy());
        this.isPaused = false;
        this.upgradeActive = false;
        this.physics.resume();
        this.lastFired = this.time.now;   // evita rajada acumulada
        this.updateHUD();
    }

    // --- HUD ---
    createHUD() : void {
        const width = this.scale.width;
        const d = 1000;

        this.xpBarBg = this.add.rectangle(0, 0, width, 8, 0x000000, 0.5).setOrigin(0, 0).setScrollFactor(0).setDepth(d);
        this.xpBarFill = this.add.rectangle(0, 0, 0, 8, 0x33ccff).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1);

        this.add.rectangle(20, 24, 220, 22, 0x000000, 0.6).setOrigin(0, 0).setScrollFactor(0).setDepth(d).setStrokeStyle(2, 0xffffff, 0.4);
        this.hpBarFill = this.add.rectangle(22, 26, 216, 18, 0x44dd55).setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1);
        this.hpText    = this.add.text(132, 35, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2);

        this.levelText  = this.add.text(20, 54, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffdd44', fontStyle: 'bold' }).setScrollFactor(0).setDepth(d);
        this.weaponText = this.add.text(20, 76, '', { fontFamily: 'monospace', fontSize: '15px', color: '#ff8844', fontStyle: 'bold' }).setScrollFactor(0).setDepth(d);

        this.timeText  = this.add.text(width / 2, 30, '', { fontFamily: 'monospace', fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(d);
        this.scoreText = this.add.text(width - 20, 24, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(1, 0).setScrollFactor(0).setDepth(d);
        this.killsText = this.add.text(width - 20, 48, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffaaaa' }).setOrigin(1, 0).setScrollFactor(0).setDepth(d);

        // Setas indicando pistoleiros fora da tela (apontam para a ameaça)
        this.offArrows = [];
        for (let i = 0; i < 8; i++) {
            const arrow = this.add.triangle(0, 0, 7, 0, 0, 14, 14, 14, 0xff5544)
                .setScrollFactor(0).setDepth(d + 5).setVisible(false).setAlpha(0.9).setStrokeStyle(2, 0x550000, 0.8);
            this.offArrows.push(arrow);
        }

        this.updateHUD();
    }

    // Posiciona setas na borda da tela apontando os pistoleiros que estão fora da área visível
    updateOffscreenIndicators() : void {
        if (!this.offArrows || this.offArrows.length === 0) return;
        const view = this.cameras.main.worldView;
        const sw = this.scale.width, sh = this.scale.height;
        const cxs = sw / 2, cys = sh / 2;
        const margin = 34;
        let idx = 0;
        const enemies = this.enemyGroup.getMatching('active', true) as any[];
        for (const e of enemies) {
            if (idx >= this.offArrows.length) break;
            if (e.getData('role') !== 'ranged') continue;                  // só pistoleiros
            if (Phaser.Geom.Rectangle.Contains(view, e.x, e.y)) continue;  // já está visível
            const ex = e.x - view.x, ey = e.y - view.y;
            const ang = Math.atan2(ey - cys, ex - cxs);
            const hw = cxs - margin, hh = cys - margin;
            const tx = Math.cos(ang), ty = Math.sin(ang);
            const reach = Math.min(Math.abs(hw / (tx || 1e-6)), Math.abs(hh / (ty || 1e-6)));
            const arrow = this.offArrows[idx++];
            arrow.setVisible(true).setPosition(cxs + tx * reach, cys + ty * reach).setRotation(ang + Math.PI / 2);
        }
        for (; idx < this.offArrows.length; idx++) this.offArrows[idx].setVisible(false);
    }

    updateWeaponHUD() : void {
        const w = this.currentWeapon;
        this.weaponText.setText(`Arma: ${WEAPONS[w].name} Nv ${this.weaponLevels[w]}`);
    }

    updateHUD() : void {
        const hpRatio = Phaser.Math.Clamp(this.playerHP / this.playerMaxHP, 0, 1);
        this.hpBarFill.width = 216 * hpRatio;
        this.hpBarFill.setFillStyle(hpRatio > 0.5 ? 0x44dd55 : hpRatio > 0.25 ? 0xddaa33 : 0xdd3333);
        this.hpText.setText(`${Math.ceil(this.playerHP)} / ${this.playerMaxHP}`);

        // Mantém o HUD ancorado às bordas em qualquer resolução
        const sw = this.scale.width;
        this.xpBarBg.setSize(sw, 8);
        this.timeText.setX(sw / 2);
        this.scoreText.setX(sw - 20);
        this.killsText.setX(sw - 20);

        // Barra de XP sobe suavemente (lerp) em vez de pular
        const xpRatio = Phaser.Math.Clamp(this.xp / this.xpToNext, 0, 1);
        this.xpDisplayRatio = Phaser.Math.Linear(this.xpDisplayRatio, xpRatio, 0.15);
        this.xpBarFill.width = sw * this.xpDisplayRatio;

        const faltam = Math.max(0, this.xpToNext - this.xp);
        this.levelText.setText(`Nível ${this.level}  (faltam ${faltam} p/ subir)`);

        const min = Math.floor(this.elapsedMs / 60000);
        const sec = Math.floor((this.elapsedMs % 60000) / 1000);
        this.timeText.setText(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);

        this.scoreText.setText(`Pontos: ${this.score}`);
        this.killsText.setText(`Abates: ${this.kills}`);
    }

    // Monta o cenário do mundo (terra, grade e tufos de grama) a partir dos assets de chão.
    createBackground() : void {
        const width  = GameOptions.worldSize.width;
        const height = GameOptions.worldSize.height;
        const gfx = this.add.graphics();

        // Base de terra seca cobrindo todo o mundo
        gfx.fillStyle(0xc4a265);
        gfx.fillRect(0, 0, width, height);

        // Manchas de variação de cor (proporcional à área)
        const patchColors = [0xb8954f, 0xd4b478, 0xb09040, 0xcaa055, 0xc4a060, 0xd0ac6a];
        const patchCount = Math.floor((width * height) / 24000);
        for (let i = 0; i < patchCount; i++) {
            const px = Phaser.Math.Between(0, width);
            const py = Phaser.Math.Between(0, height);
            gfx.fillStyle(patchColors[Phaser.Math.Between(0, patchColors.length - 1)]);
            gfx.fillEllipse(px, py, Phaser.Math.Between(70, 140), Phaser.Math.Between(40, 65));
        }

        // Grade sutil de terra
        gfx.lineStyle(1, 0xa88848, 0.22);
        const tileSize = 40;
        for (let x = 0; x <= width; x += tileSize) gfx.lineBetween(x, 0, x, height);
        for (let y = 0; y <= height; y += tileSize) gfx.lineBetween(0, y, width, y);

        // Tufos de grama espalhados
        const grassColor = 0x8a9a3a;
        const tuftCount = Math.floor((width * height) / 26000);
        for (let i = 0; i < tuftCount; i++) {
            const tx = Phaser.Math.Between(10, width - 10);
            const ty = Phaser.Math.Between(10, height - 20);
            gfx.fillStyle(grassColor, 0.7);
            gfx.fillTriangle(tx, ty, tx - 6, ty + 14, tx + 6, ty + 14);
            gfx.fillTriangle(tx + 8, ty + 4, tx + 2, ty + 16, tx + 14, ty + 16);
            gfx.fillTriangle(tx - 8, ty + 4, tx - 14, ty + 16, tx - 2, ty + 16);
        }

        gfx.setDepth(-10);
    }
}
