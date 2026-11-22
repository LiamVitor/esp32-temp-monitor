// Tudo que escreve no DOM (cards, banner, log, conexão)
import { state } from "./state.js";
import { TEMP_MIN, TEMP_MAX, TOL_S, STALE_MS, LABEL } from "./config.js";
import { $, f1, hhmmss, dur, isCrit } from "./utils.js";
import { draw } from "./chart.js";

// ---- Conexão e "dispositivo offline" ----
export function renderConn() {
    const age = state.lastMsg ? Date.now() - state.lastMsg : 0;
    let cls = "dot", txt;
    if (!state.connected) txt = "Desconectado (tentando reconectar)";
    else if (state.lastMsg && age > STALE_MS) { cls += " warn"; txt = "Broker conectado · sem dados do dispositivo há " + dur(Math.round(age / 1000)); }
    else { cls += " on"; txt = "Conectado ao broker"; }
    $("dot").className = cls; $("connTxt").textContent = txt;
    if (state.lastMsg) $("last").textContent = "Última leitura: " + hhmmss(state.lastMsg) + (age > 3000 ? " (há " + dur(Math.round(age / 1000)) + ")" : "");
}

export function renderPrefs() {
    $("btnSound").textContent = "Som: " + (state.prefs.sound ? "ligado" : "desligado");
    $("btnSound").setAttribute("aria-pressed", state.prefs.sound);
}

// ---- Cards ----
const badgeClass = s => s === "OK" ? "ok" : isCrit(s) ? "bad" : "warn";

function trendText() {
    const v = state.readings.filter(r => r.temp !== null);
    if (v.length < 2) return "";
    const last = v[v.length - 1];
    let ref = null;
    for (let i = v.length - 2; i >= 0; i--) { ref = v[i]; if (last.ts - ref.ts >= 20000) break; }
    const dt = (last.ts - ref.ts) / 60000;
    if (dt * 60 < 8) return "Calculando tendência…";
    const rate = (last.temp - ref.temp) / dt;
    if (Math.abs(rate) < 0.1) return "→ Estável";
    return (rate > 0 ? "↑ Subindo " : "↓ Caindo ") + f1(Math.abs(rate)) + " °C/min";
}

export function renderCurrent(r) {
    const falha = r.status === "FALHA_SENSOR";
    $("temp").textContent = falha ? "ERRO" : f1(r.temp) + " °C";
    $("status").textContent = LABEL[r.status];
    $("status").className = "badge " + badgeClass(r.status);
    $("bat").textContent = r.bat + "%";
    $("batBar").style.width = Math.max(0, Math.min(100, r.bat)) + "%";
    $("batBar").style.background = r.bat <= 20 ? "var(--bad)" : "var(--info)";
    $("trend").textContent = falha ? "" : trendText();

    const fora = r.status.startsWith("FORA") || r.status.startsWith("ALERTA");
    if (fora) {
        if (state.foraStart === null || r.t < state.foraStart) state.foraStart = r.t;
        const s = Math.round((r.t - state.foraStart) / 1000), crit = r.status.startsWith("ALERTA");
        $("fora").textContent = dur(s);
        $("tolWrap").hidden = false;
        $("tolBar").style.width = (crit ? 100 : Math.min(100, s / TOL_S * 100)) + "%";
        $("tolBar").style.background = crit ? "var(--bad)" : "var(--warn)";
        $("tolTxt").textContent = crit ? "Tolerância esgotada – alerta crítico ativo" : "Tolerância: " + s + " de " + TOL_S + " s para o alerta crítico";
    } else {
        state.foraStart = null;
        $("fora").textContent = "–";
        $("tolWrap").hidden = true; $("tolTxt").textContent = "";
    }

    const b = $("banner");
    if (isCrit(r.status) || r.status === "BATERIA_BAIXA") {
        b.hidden = false; b.className = "banner wide " + (isCrit(r.status) ? "bad" : "warn");
        b.textContent = LABEL[r.status] + (falha ? "" : " – " + f1(r.temp) + " °C") + " – bateria " + r.bat + "%";
    } else b.hidden = true;

    document.title = (isCrit(r.status) ? "🔴 ALERTA · " : "") + (falha ? "Sensor com falha" : f1(r.temp) + " °C") + " – ColdChain Monitor";
}

export function renderStats() {
    const names = { sMin: "Mínima", sMax: "Máxima", sAvg: "Média", sOk: "Dentro da faixa" };
    const set = (id, val) => { $(id).textContent = val; const s = document.createElement("small"); s.textContent = names[id]; $(id).appendChild(s); };
    const v = state.readings.filter(r => r.temp !== null);
    if (!v.length) {
        Object.keys(names).forEach(id => set(id, "–"));
        $("sInfo").textContent = "Sem leituras"; return;
    }
    const t = v.map(r => r.temp), ok = t.filter(x => x >= TEMP_MIN && x <= TEMP_MAX).length;
    set("sMin", f1(Math.min(...t)) + " °C");
    set("sMax", f1(Math.max(...t)) + " °C");
    set("sAvg", f1(t.reduce((a, b) => a + b, 0) / t.length) + " °C");
    set("sOk", Math.round(ok / t.length * 100) + "%");
    $("sInfo").textContent = v.length + " leituras desde " + hhmmss(v[0].ts);
}

export function renderLog() {
    const ul = $("log"); ul.innerHTML = "";
    $("nAlert").textContent = state.alerts.length;
    if (!state.alerts.length) { ul.innerHTML = '<li class="empty">Nenhum alerta recebido.</li>'; return; }
    state.alerts.forEach(a => {
        const li = document.createElement("li"), l = document.createElement("span"), r = document.createElement("span");
        const b = document.createElement("b"); b.textContent = LABEL[a.status];
        l.append(b, " – " + (a.temp === null ? "sensor com falha" : f1(a.temp) + " °C") + " – bat " + a.bat + "%");
        if (a.count > 1) { const c = document.createElement("span"); c.className = "cnt"; c.textContent = "×" + a.count; l.append(c); }
        r.textContent = a.count > 1 ? hhmmss(a.first) + " → " + hhmmss(a.last) : hhmmss(a.first);
        li.append(l, r); ul.append(li);
    });
}

export function renderAll() {
    const last = state.readings[state.readings.length - 1];
    if (last) { renderCurrent(last); if (!state.lastMsg) state.lastMsg = last.ts; }
    else {
        $("temp").textContent = "--"; $("trend").textContent = ""; $("status").textContent = "Aguardando dados"; $("status").className = "badge";
        $("bat").textContent = "--"; $("batBar").style.width = "0"; $("fora").textContent = "–"; $("tolWrap").hidden = true; $("tolTxt").textContent = "";
        $("banner").hidden = true; $("last").textContent = "Nenhuma leitura ainda"; document.title = "ColdChain Monitor – Dashboard";
    }
    renderStats(); renderLog(); draw(); renderPrefs(); renderConn();
}
