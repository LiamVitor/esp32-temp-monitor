// Ponto de entrada: liga os módulos e os botões
import { state, load, save, resetLive } from "./state.js";
import { $ } from "./utils.js";
import { renderAll, renderConn } from "./ui.js";
import { initChart } from "./chart.js";
import { toggleSound } from "./sound.js";
import { exportReadings, exportAlerts } from "./export.js";
import { initMqtt } from "./mqtt.js";

load();
state.prefs.sound = false;  // o navegador exige um clique para liberar o áudio
initChart();
renderAll();

$("btnSound").onclick = toggleSound;
$("btnCsvR").onclick = exportReadings;
$("btnCsvA").onclick = exportAlerts;
$("btnClear").onclick = () => {
    if (!confirm("Apagar todas as leituras e alertas guardados neste navegador?")) return;
    state.readings = []; state.alerts = []; resetLive(); save(); renderAll();
};

setInterval(renderConn, 1000);
initMqtt();
