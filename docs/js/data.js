// Recebe mensagens do MQTT, valida e atualiza estado + interface
import { state, save } from "./state.js";
import { LABEL, KEEP, GAP_MS } from "./config.js";
import { isCrit } from "./utils.js";
import { alertSound } from "./sound.js";
import { renderCurrent, renderStats, renderLog, renderConn } from "./ui.js";
import { draw } from "./chart.js";

function parse(raw) {
    const d = { t: Number(raw.t), temp: Number(raw.temp), bat: Number(raw.bat), status: String(raw.status) };
    if (!LABEL[d.status] || !isFinite(d.t) || !isFinite(d.bat)) return null;
    if (d.status !== "FALHA_SENSOR" && !isFinite(d.temp)) return null;
    return d;
}

function addLog(d) {
    const now = Date.now(), a = state.alerts[0];
    if (a && a.status === d.status && now - a.last < GAP_MS) {
        a.count++; a.last = now; a.temp = d.temp; a.bat = d.bat;
    } else {
        state.alerts.unshift({ status: d.status, temp: d.status === "FALHA_SENSOR" ? null : d.temp, bat: d.bat, first: now, last: now, count: 1 });
        if (state.alerts.length > 30) state.alerts.pop();
    }
    renderLog(); save();
}

export function handle(raw, kind) {
    const d = parse(raw);
    if (!d) return;
    if (kind === "alerta") return addLog(d);

    const now = Date.now(), rs = state.readings;
    state.lastMsg = now;
    rs.push({ ts: now, t: d.t, temp: d.status === "FALHA_SENSOR" ? null : d.temp, bat: d.bat, status: d.status });
    if (rs.length > KEEP) rs.shift();
    if (isCrit(d.status) && d.status !== state.lastStatus) alertSound();
    state.lastStatus = d.status;
    renderCurrent(rs[rs.length - 1]); renderStats(); draw(); renderConn(); save();
}
