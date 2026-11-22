// Alerta sonoro (3 bips) para alertas críticos
import { state, save } from "./state.js";
import { renderPrefs } from "./ui.js";

let actx = null;

function beep() {
    if (!actx) return;
    for (let i = 0; i < 3; i++) {
        const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * .2;
        o.frequency.value = 880; g.gain.value = .15;
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + .1);
    }
}

export function toggleSound() {
    state.prefs.sound = !state.prefs.sound;
    if (state.prefs.sound) {  // navegadores só liberam áudio após um clique
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        actx.resume(); beep();
    }
    renderPrefs(); save();
}

export function alertSound() { if (state.prefs.sound) beep(); }
