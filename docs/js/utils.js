// Funções pequenas e sem estado, usadas por vários módulos
export const $ = (id) => document.getElementById(id);
export const f1 = (v) => Number(v).toFixed(1).replace(".", ",");
export const hhmmss = (ts) => new Date(ts).toLocaleTimeString("pt-BR");
export const dur = (s) =>
    s < 60 ? s + " s" : Math.floor(s / 60) + " min " + (s % 60) + " s";
export const isCrit = (s) => s.startsWith("ALERTA") || s === "FALHA_SENSOR";
export const num = (v) => (v === null ? "" : String(v).replace(".", ","));
export const stamp = () =>
    new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
