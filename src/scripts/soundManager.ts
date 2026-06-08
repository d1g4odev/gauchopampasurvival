// GERENCIADOR DE SOM PROCEDURAL (Web Audio API — sem arquivos de áudio)
// Gera todos os efeitos por código e toca uma trilha de fundo simples em loop.

export class SoundManager {

    ctx        : AudioContext;
    masterGain : GainNode;
    sfxGain    : GainNode;
    musicGain  : GainNode;
    musicStep  : number = 0;
    musicTimer : number | null = null;
    muted      : boolean = false;

    constructor() {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new Ctx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.9;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.6;
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.18;
        this.musicGain.connect(this.masterGain);
    }

    // Retoma o contexto (browsers exigem gesto do usuário para iniciar áudio)
    resume() : void {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() : boolean {
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 0.9;
        return this.muted;
    }

    // --- Tom simples com envelope ---
    private blip(freq : number, duration : number, type : OscillatorType = 'square', gain : number = 0.5, target : GainNode = this.sfxGain) : void {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(gain, now + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(env);
        env.connect(target);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    // --- Varredura de frequência (para tiros/whoosh) ---
    private sweep(fromFreq : number, toFreq : number, duration : number, type : OscillatorType = 'sawtooth', gain : number = 0.4) : void {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(fromFreq, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), now + duration);
        env.gain.setValueAtTime(gain, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    // --- Ruído (para impactos/explosões) ---
    private noise(duration : number, gain : number = 0.4, hp : number = 800) : void {
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = hp;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(gain, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);
        src.connect(filter);
        filter.connect(env);
        env.connect(this.sfxGain);
        src.start(now);
        src.stop(now + duration);
    }

    // ===== EFEITOS DO JOGO =====
    shoot(weapon : string) : void {
        switch (weapon) {
            case 'shotgun': this.noise(0.12, 0.35, 500); this.sweep(300, 80, 0.12, 'square', 0.3); break;
            case 'rifle':   this.sweep(900, 300, 0.07, 'sawtooth', 0.25); break;
            case 'whip':    this.sweep(200, 600, 0.12, 'sine', 0.3); break;
            case 'knife':   this.blip(700, 0.05, 'triangle', 0.2); break;
            default:        this.sweep(600, 200, 0.08, 'square', 0.3); break;  // revólver
        }
    }
    hit()      : void { this.noise(0.05, 0.25, 1200); }
    death()    : void { this.noise(0.18, 0.4, 300); this.sweep(220, 50, 0.18, 'square', 0.3); }
    hurt()     : void { this.sweep(160, 60, 0.25, 'sawtooth', 0.5); }
    gem()      : void { this.blip(1200, 0.06, 'sine', 0.25); }
    levelUp()  : void {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.blip(f, 0.18, 'square', 0.4), i * 90);
        });
    }
    gameOver() : void {
        [392, 330, 262, 196].forEach((f, i) => {
            setTimeout(() => this.blip(f, 0.35, 'triangle', 0.45), i * 180);
        });
    }

    // ===== TRILHA DE FUNDO (loop simples, clima de faroeste) =====
    startMusic() : void {
        if (this.musicTimer !== null) return;
        // Escala menor pentatônica — baixo + melodia
        const bass    = [110, 110, 146.83, 110, 130.81, 110, 146.83, 164.81];
        const melody  = [440, 0, 523.25, 0, 392, 0, 440, 587.33, 523.25, 0, 392, 0, 440, 0, 329.63, 0];
        const stepMs  = 260;

        this.musicTimer = window.setInterval(() => {
            if (this.muted) { this.musicStep++; return; }
            const b = bass[this.musicStep % bass.length];
            const m = melody[this.musicStep % melody.length];
            if (b > 0) this.blip(b, 0.22, 'triangle', 0.5, this.musicGain);
            if (m > 0) this.blip(m, 0.18, 'sine', 0.35, this.musicGain);
            this.musicStep++;
        }, stepMs);
    }
    stopMusic() : void {
        if (this.musicTimer !== null) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

// Instância única compartilhada entre as cenas
let _instance : SoundManager | null = null;
export function getSound() : SoundManager {
    if (_instance === null) {
        _instance = new SoundManager();
    }
    return _instance;
}
