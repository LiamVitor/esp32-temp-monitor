// Gráfico em canvas com tooltip
import { state } from "./state.js";
import { TEMP_MIN, TEMP_MAX, MAX_PTS, LABEL } from "./config.js";
import { $, f1, hhmmss } from "./utils.js";

let L = null,
    hov = -1;

export function draw() {
    const cv = $("chart"),
        dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth,
        h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const c = cv.getContext("2d");
    c.scale(dpr, dpr);
    c.clearRect(0, 0, w, h);
    const view = state.readings.filter((r) => r.temp !== null).slice(-MAX_PTS),
        pts = view.map((r) => r.temp);
    L = null;
    if (!pts.length) return;

    const padL = 40,
        padR = 12,
        padT = 12,
        padB = 24;
    const lo = Math.min(TEMP_MIN, ...pts) - 2,
        hi = Math.max(TEMP_MAX, ...pts) + 2;
    const y = (v) => padT + ((hi - v) / (hi - lo)) * (h - padT - padB);
    const x = (i) =>
        padL + (pts.length < 2 ? 0 : (i / (MAX_PTS - 1)) * (w - padL - padR));
    L = { w, padL, padR, view, x, y };

    c.fillStyle = "rgba(46,204,113,.12)";
    c.fillRect(padL, y(TEMP_MAX), w - padL - padR, y(TEMP_MIN) - y(TEMP_MAX));
    c.strokeStyle = "#2a3a4a";
    c.fillStyle = "#8aa0b4";
    c.font = "11px system-ui";
    c.lineWidth = 1;
    [TEMP_MIN, TEMP_MAX].forEach((v) => {
        c.beginPath();
        c.setLineDash([4, 4]);
        c.moveTo(padL, y(v));
        c.lineTo(w - padR, y(v));
        c.stroke();
        c.setLineDash([]);
        c.fillText(v + "°", 8, y(v) + 4);
    });
    c.textAlign = "left";
    c.fillText(hhmmss(view[0].ts), padL, h - 6);
    if (view.length > 1) {
        c.textAlign = "right";
        c.fillText(hhmmss(view[view.length - 1].ts), x(view.length - 1), h - 6);
    }
    c.textAlign = "left";

    c.strokeStyle = "#4da3ff";
    c.lineWidth = 2;
    c.beginPath();
    pts.forEach((v, i) => (i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v))));
    c.stroke();
    pts.forEach((v, i) => {
        c.fillStyle = v < TEMP_MIN || v > TEMP_MAX ? "#ff4d4f" : "#2ecc71";
        c.beginPath();
        c.arc(x(i), y(v), i === hov ? 6 : 3, 0, 7);
        c.fill();
    });
    if (hov >= 0 && hov < pts.length) {
        c.strokeStyle = "#8aa0b4";
        c.lineWidth = 1;
        c.setLineDash([2, 3]);
        c.beginPath();
        c.moveTo(x(hov), padT);
        c.lineTo(x(hov), h - padB);
        c.stroke();
        c.setLineDash([]);
    }
}

function hover(ev) {
    if (!L) return;
    const rect = $("chart").getBoundingClientRect(),
        mx = ev.clientX - rect.left;
    let i = Math.round(((mx - L.padL) / (L.w - L.padL - L.padR)) * (MAX_PTS - 1));
    i = Math.max(0, Math.min(L.view.length - 1, i));
    if (Math.abs(L.x(i) - mx) > 24) return leave();
    hov = i;
    draw();
    const r = L.view[i],
        tip = $("tip");
    tip.hidden = false;
    tip.textContent =
        f1(r.temp) + " °C · " + hhmmss(r.ts) + " · " + LABEL[r.status];
    tip.style.left =
        Math.max(0, Math.min(L.x(i) + 12, L.w - tip.offsetWidth)) + "px";
    tip.style.top = Math.max(0, L.y(r.temp) - 36) + "px";
}

function leave() {
    hov = -1;
    $("tip").hidden = true;
    draw();
}

export function initChart() {
    $("chart").addEventListener("pointermove", hover);
    $("chart").addEventListener("pointerleave", leave);
    window.addEventListener("resize", draw);
}
