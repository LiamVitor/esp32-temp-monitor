// Estado único da aplicação + persistência no navegador
import { LS, KEEP } from "./config.js";

export const state = {
    readings: [], alerts: [], prefs: { sound: false },
    foraStart: null, lastMsg: 0, lastStatus: "", connected: false
};

export function save() {
    try {
        localStorage.setItem(LS, JSON.stringify({
        readings: state.readings.slice(-KEEP),
        alerts: state.alerts.slice(0, 30),
        prefs: state.prefs }));
    } catch (e) {}
}

export function load() {
    try {
        const s = JSON.parse(localStorage.getItem(LS) || "null");
        if (!s) return;
        state.readings = Array.isArray(s.readings) ? s.readings : [];
        state.alerts = Array.isArray(s.alerts) ? s.alerts : [];
        Object.assign(state.prefs, s.prefs);
    } catch (e) {}
}

export function resetLive() {
    state.lastMsg = 0; state.lastStatus = ""; state.foraStart = null;
}
