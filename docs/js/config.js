// Configuração (use o mesmo prefixo do código do ESP32)
export const BROKER = "wss://broker.hivemq.com:8884/mqtt";
export const PREFIX = "esp32-temp-monitor/coldchain";
export const TEMP_MIN = 2, TEMP_MAX = 8, MAX_PTS = 60;
export const TOL_S = 10;       // tolerância do firmware (s)
export const STALE_MS = 6000;  // sem dados do dispositivo há mais que isso = aviso
export const KEEP = 500;       // leituras guardadas neste navegador
export const GAP_MS = 15000;   // alertas iguais dentro desse intervalo são agrupados
export const LS = "coldchain:v1";

export const LABEL = {
    OK: "OK", FORA_TOLERANCIA: "Fora da faixa – aguardando",
    ALERTA_MIN_CRITICO: "ALERTA – abaixo do mínimo", ALERTA_MAX_CRITICO: "ALERTA – acima do máximo",
    BATERIA_BAIXA: "Bateria baixa", FALHA_SENSOR: "Falha no sensor"
};
