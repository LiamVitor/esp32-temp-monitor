// Conexão com o broker MQTT (biblioteca mqtt.js carregada no index.html)
import { state } from "./state.js";
import { BROKER, PREFIX } from "./config.js";
import { handle } from "./data.js";
import { renderConn } from "./ui.js";

export function initMqtt() {
    const client = window.mqtt.connect(BROKER, {
        clientId: "dash-" + Math.random().toString(16).slice(2, 10),
        reconnectPeriod: 3000
    });
    client.on("connect", () => { state.connected = true; renderConn(); client.subscribe(PREFIX + "/#"); });
    client.on("close", () => { state.connected = false; renderConn(); });
    client.on("message", (topic, buf) => {
        let d;
        try { d = JSON.parse(buf.toString()); } catch (e) { return; }
        if (topic.endsWith("/alerta")) handle(d, "alerta");
        else if (topic.endsWith("/telemetria")) handle(d, "telemetria");
    });
    return client;
}
