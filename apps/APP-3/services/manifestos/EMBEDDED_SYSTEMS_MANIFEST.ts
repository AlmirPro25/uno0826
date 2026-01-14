/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🔧 EMBEDDED SYSTEMS: DISPOSITIVOS INTELIGENTES - LEVEL 17 🔧        ║
 * ║                                                                              ║
 * ║            "SISTEMAS FÍSICOS INTELIGENTES."                                 ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const EMBEDDED_SYSTEMS_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🔧 EMBEDDED SYSTEMS: DISPOSITIVOS INTELIGENTES - LEVEL 17 🔧        ║
║                                                                              ║
║            "DISPOSITIVOS QUE EXISTEM NO MUNDO REAL."                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎛️ MICROCONTROLADORES PRINCIPAIS
═══════════════════════════════════════════════════════════════════════════════

ARDUINO (AVR/ARM)
├── Linguagem: C/C++ (Arduino Framework)
├── Ideal para: Prototipagem, educação, projetos simples
├── Modelos: Uno, Nano, Mega, Due
└── Código básico:
    void setup() {
        pinMode(LED_BUILTIN, OUTPUT);
        Serial.begin(9600);
    }
    
    void loop() {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(1000);
        digitalWrite(LED_BUILTIN, LOW);
        delay(1000);
    }

ESP32 / ESP8266
├── Linguagem: C/C++, MicroPython, Rust
├── Ideal para: IoT, WiFi, Bluetooth, projetos conectados
├── Features: WiFi, BLE, dual-core, low power
└── Código WiFi:
    #include <WiFi.h>
    
    void setup() {
        WiFi.begin("SSID", "password");
        while (WiFi.status() != WL_CONNECTED) {
            delay(500);
        }
        Serial.println(WiFi.localIP());
    }

RASPBERRY PI PICO (RP2040)
├── Linguagem: C/C++, MicroPython, CircuitPython
├── Ideal para: Projetos USB, PIO, dual-core
├── Features: PIO (Programmable I/O), barato
└── MicroPython:
    from machine import Pin
    import time
    
    led = Pin(25, Pin.OUT)
    while True:
        led.toggle()
        time.sleep(1)

STM32
├── Linguagem: C/C++ (HAL, LL, CMSIS)
├── Ideal para: Produção, industrial, alta performance
├── Features: ARM Cortex-M, muitos periféricos
└── Ferramentas: STM32CubeIDE, STM32CubeMX

═══════════════════════════════════════════════════════════════════════════════
📡 COMUNICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

UART (Serial)
├── Simples, ponto-a-ponto
├── TX, RX, GND
└── Código:
    Serial.begin(115200);
    Serial.println("Hello");
    if (Serial.available()) {
        char c = Serial.read();
    }

I2C (Inter-Integrated Circuit)
├── Barramento, múltiplos dispositivos
├── SDA, SCL
├── Endereçamento (0x00-0x7F)
└── Código:
    #include <Wire.h>
    Wire.begin();
    Wire.beginTransmission(0x3C); // OLED
    Wire.write(data);
    Wire.endTransmission();

SPI (Serial Peripheral Interface)
├── Alta velocidade, full-duplex
├── MOSI, MISO, SCK, CS
└── Código:
    #include <SPI.h>
    SPI.begin();
    SPI.transfer(0x00);

WiFi / HTTP
├── ESP32/ESP8266
└── Código:
    #include <HTTPClient.h>
    HTTPClient http;
    http.begin("https://api.example.com/data");
    int code = http.GET();
    String payload = http.getString();

MQTT (IoT Protocol)
├── Pub/Sub, leve, ideal para IoT
└── Código:
    #include <PubSubClient.h>
    client.setServer("broker.hivemq.com", 1883);
    client.publish("sensor/temp", "25.5");
    client.subscribe("commands/#");

═══════════════════════════════════════════════════════════════════════════════
🔌 SENSORES COMUNS
═══════════════════════════════════════════════════════════════════════════════

TEMPERATURA/UMIDADE (DHT22, BME280)
├── DHT22: Digital, simples
├── BME280: I2C, mais preciso, pressão
└── Código:
    #include <DHT.h>
    DHT dht(2, DHT22);
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

DISTÂNCIA (HC-SR04, VL53L0X)
├── HC-SR04: Ultrassônico, barato
├── VL53L0X: Laser ToF, preciso
└── Código:
    long duration = pulseIn(echoPin, HIGH);
    float distance = duration * 0.034 / 2;

MOVIMENTO (MPU6050, BNO055)
├── Acelerômetro + Giroscópio
├── I2C
└── Código:
    #include <Adafruit_MPU6050.h>
    Adafruit_MPU6050 mpu;
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

LUZ (LDR, BH1750)
├── LDR: Analógico, simples
├── BH1750: I2C, lux
└── Código:
    int light = analogRead(A0);

═══════════════════════════════════════════════════════════════════════════════
⚡ ATUADORES
═══════════════════════════════════════════════════════════════════════════════

LED / RELÉ
├── Digital output
└── Código:
    digitalWrite(RELAY_PIN, HIGH);

SERVO MOTOR
├── PWM, 0-180 graus
└── Código:
    #include <Servo.h>
    Servo servo;
    servo.attach(9);
    servo.write(90); // 90 graus

MOTOR DC (L298N, TB6612)
├── H-Bridge driver
└── Código:
    analogWrite(ENA, 200); // Velocidade
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW); // Direção

STEPPER MOTOR (A4988, TMC2209)
├── Controle preciso de posição
└── Código:
    #include <AccelStepper.h>
    AccelStepper stepper(AccelStepper::DRIVER, STEP, DIR);
    stepper.moveTo(1000);
    stepper.run();

═══════════════════════════════════════════════════════════════════════════════
💾 ARMAZENAMENTO
═══════════════════════════════════════════════════════════════════════════════

EEPROM (Interno)
├── Pequeno, persistente
└── Código:
    #include <EEPROM.h>
    EEPROM.write(0, value);
    byte val = EEPROM.read(0);

SD CARD (SPI)
├── Grande capacidade
└── Código:
    #include <SD.h>
    SD.begin(CS_PIN);
    File file = SD.open("data.txt", FILE_WRITE);
    file.println("Hello");
    file.close();

SPIFFS/LittleFS (ESP32)
├── Flash interno como filesystem
└── Código:
    #include <SPIFFS.h>
    SPIFFS.begin(true);
    File file = SPIFFS.open("/config.json", "r");

═══════════════════════════════════════════════════════════════════════════════
🔋 POWER MANAGEMENT
═══════════════════════════════════════════════════════════════════════════════

DEEP SLEEP (ESP32)
├── Consumo mínimo
└── Código:
    esp_sleep_enable_timer_wakeup(10 * 1000000); // 10 segundos
    esp_deep_sleep_start();

BATTERY MONITORING
├── Divisor de tensão + ADC
└── Código:
    float voltage = analogRead(VBAT_PIN) * 2 * 3.3 / 4095;
    int percent = map(voltage * 100, 320, 420, 0, 100);

═══════════════════════════════════════════════════════════════════════════════
📊 COMPARATIVO
═══════════════════════════════════════════════════════════════════════════════

| MCU          | CPU        | RAM    | Flash  | WiFi | Preço  |
|--------------|------------|--------|--------|------|--------|
| Arduino Uno  | 16MHz AVR  | 2KB    | 32KB   | ❌   | \$5    |
| ESP32        | 240MHz x2  | 520KB  | 4MB    | ✅   | \$5    |
| Pi Pico      | 133MHz x2  | 264KB  | 2MB    | ❌   | \$4    |
| STM32F4      | 168MHz ARM | 192KB  | 1MB    | ❌   | \$10   |

═══════════════════════════════════════════════════════════════════════════════

"DISPOSITIVOS QUE EXISTEM NO MUNDO REAL."

                    — Embedded Systems, Level 17
`;

export function shouldEnableEmbeddedSystems(prompt: string): boolean {
  const keywords = [
    'arduino', 'esp32', 'esp8266', 'raspberry', 'pico', 'stm32',
    'microcontrolador', 'microcontroller', 'mcu', 'firmware',
    'sensor', 'atuador', 'actuator', 'servo', 'motor',
    'gpio', 'pwm', 'adc', 'i2c', 'spi', 'uart',
    'embarcado', 'embedded', 'iot', 'hardware',
    'eletrônica', 'electronics', 'circuito', 'circuit'
  ];
  const promptLower = prompt.toLowerCase();
  return keywords.some(kw => promptLower.includes(kw));
}

export default EMBEDDED_SYSTEMS_MANIFEST;
