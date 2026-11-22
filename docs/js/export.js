// Exportação CSV (separador ; e decimal , para abrir direto no Excel BR)
import { state } from "./state.js";
import { num, stamp } from "./utils.js";

const dt = ts => new Date(ts).toLocaleString("pt-BR");

function download(name, rows) {
    const blob = new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportReadings() {
    download("coldchain-leituras-" + stamp() + ".csv",
        ["data_hora;tempo_dispositivo_ms;temperatura_c;bateria_pct;status"].concat(
            state.readings.map(r => [dt(r.ts), r.t, num(r.temp), r.bat, r.status].join(";"))));
}

export function exportAlerts() {
    download("coldchain-alertas-" + stamp() + ".csv",
        ["primeiro_registro;ultimo_registro;status;temperatura_c;bateria_pct;ocorrencias"].concat(
            state.alerts.map(a => [dt(a.first), dt(a.last), a.status, num(a.temp), a.bat, a.count].join(";"))));
}
