#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define ONE_WIRE_BUS 4
#define PIN_BUZZER 15

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

const float TEMP_MIN = 2.0;
const float TEMP_MAX = 8.0;
const unsigned long TEMPO_TOLERANCIA_MS = 10000; // 10s fora da faixa para tocar alarme

unsigned long inicio_fora_faixa = 0;
bool esta_fora_faixa = false;

// Simulacao de bateria (0 a 100%)
int bateria_pct = 100;
const int BATERIA_BAIXA_LIMIAR = 20;

struct Registro {
  unsigned long tempo_ms;
  float temp_c;
  int bat_pct;
  const char* status;
};

const int MAX_HIST = 40;
Registro historico[MAX_HIST];
int total_hist = 0;
int idx_hist = 0;

void registrar(float temp, const char* status) {
  historico[idx_hist] = { millis(), temp, bateria_pct, status };
  idx_hist = (idx_hist + 1) % MAX_HIST;
  if (total_hist < MAX_HIST) total_hist++;
}

void imprimirHistorico() {
  Serial.println("\n--- HISTORICO ---");
  Serial.println("tempo_ms,temp_c,bat_pct,status");
  int inicio = (total_hist < MAX_HIST) ? 0 : idx_hist;
  for (int i = 0; i < total_hist; i++) {
    int pos = (inicio + i) % MAX_HIST;
    Serial.print(historico[pos].tempo_ms);
    Serial.print(",");
    Serial.print(historico[pos].temp_c, 2);
    Serial.print(",");
    Serial.print(historico[pos].bat_pct);
    Serial.print(",");
    Serial.println(historico[pos].status);
  }
  Serial.println("-----------------\n");
}

// Padrao 1: Temp fora da faixa por tempo excessivo -> 3 bips agudos curtos
void toqueTemperaturaCritica() {
  for (int i = 0; i < 3; i++) {
    tone(PIN_BUZZER, 2200, 100);
    delay(160);
  }
  noTone(PIN_BUZZER);
}

// Padrao 2: Bateria descarregando -> 1 tom mais grave e prolongado
void toqueBateriaBaixa() {
  tone(PIN_BUZZER, 650, 450);
  delay(500);
  noTone(PIN_BUZZER);
}

void atualizarTela(float temp, const char* status_curto, bool falha) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.print("STATUS: ");
  display.println(status_curto);

  display.setCursor(0, 18);
  display.setTextSize(2);
  if (falha) {
    display.println("ERRO SENS");
  } else {
    display.print(temp, 1);
    display.println(" C");
  }

  display.setTextSize(1);
  display.setCursor(0, 46);
  display.print("Bat: ");
  display.print(bateria_pct);
  display.print("%");

  if (esta_fora_faixa && !falha) {
    unsigned long decorrido = millis() - inicio_fora_faixa;
    display.setCursor(64, 46);
    display.print("Fora:");
    display.print(decorrido / 1000);
    display.print("s");
  }

  display.display();
}

void lerComandos() {
  while (Serial.available()) {
    String linha = Serial.readStringUntil('\n');
    linha.trim();
    String upper = linha;
    upper.toUpperCase();

    if (upper == "HIST") {
      imprimirHistorico();
    } else if (upper.startsWith("BAT ")) {
      int val = linha.substring(4).toInt();
      bateria_pct = constrain(val, 0, 100);
      Serial.print("[CMD] Bateria definida para ");
      Serial.print(bateria_pct);
      Serial.println("%");
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BUZZER, OUTPUT);
  sensors.begin();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("Falha ao iniciar OLED SSD1306");
    while (true);
  }

  display.clearDisplay();
  display.display();
  Serial.println("Pronto. Comandos: BAT <0-100> | HIST");
}

void loop() {
  lerComandos();

  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);
  unsigned long agora = millis();

  bool falha_sensor = (temp == DEVICE_DISCONNECTED_C) || (temp < -55.0 || temp > 125.0);
  bool bat_baixa = (bateria_pct <= BATERIA_BAIXA_LIMIAR);

  const char* status_display = "NORMAL";
  const char* status_log = "OK";
  bool disparar_alerta_temp = false;

  if (falha_sensor) {
    esta_fora_faixa = false;
    inicio_fora_faixa = 0;
    status_display = "FALHA SENS";
    status_log = "FALHA_SENSOR";
    registrar(-999.0, status_log);
  } else {
    bool fora_agora = (temp < TEMP_MIN) || (temp > TEMP_MAX);

    if (fora_agora) {
      if (!esta_fora_faixa) {
        esta_fora_faixa = true;
        inicio_fora_faixa = agora;
      }
      unsigned long tempo_fora = agora - inicio_fora_faixa;

      if (tempo_fora >= TEMPO_TOLERANCIA_MS) {
        disparar_alerta_temp = true;
        status_display = (temp < TEMP_MIN) ? "ALR MIN!" : "ALR MAX!";
        status_log = (temp < TEMP_MIN) ? "ALERTA_MIN_CRITICO" : "ALERTA_MAX_CRITICO";
      } else {
        status_display = "FORA (AGUARD)";
        status_log = "FORA_TOLERANCIA";
      }
    } else {
      esta_fora_faixa = false;
      inicio_fora_faixa = 0;
      status_display = bat_baixa ? "BAT BAIXA" : "NORMAL";
      status_log = bat_baixa ? "BATERIA_BAIXA" : "OK";
    }

    registrar(temp, status_log);
  }

  atualizarTela(temp, status_display, falha_sensor);

  Serial.print("{\"t\":");
  Serial.print(agora);
  Serial.print(",\"temp\":");
  Serial.print(falha_sensor ? -999.0 : temp, 2);
  Serial.print(",\"bat\":");
  Serial.print(bateria_pct);
  Serial.print(",\"status\":\"");
  Serial.print(status_log);
  Serial.println("\"}");

  // Aciona padroes distintos no buzzer
  if (disparar_alerta_temp) {
    toqueTemperaturaCritica();
  }
  if (bat_baixa) {
    toqueBateriaBaixa();
  }

  delay(1200);
}