# Pin contract

## 1. ESP32 WT32-ETH01
| Pin | Target | Note |
|---|---|---|
| IO2 | Servo signal | Strapping — safe: the servo does not pull the pin during reset |
| IO4 | Light signal (LED / relay IN) | Assumed active-HIGH — relay modules are often inverted |
| IO14 | RFID SCK | — |
| IO17 | RFID MOSI | — |
| IO32 | RFID SS | — |
| IO33 | RFID RST | — |
| IO35 | RFID MISO | Read-only pin |
| IO39 | PIR OUT | Read-only pin |

## 2. Sensor — PIR (HC-SR501 / RCWL-0516)

| Pin | Target | Note |
|---|---|---|
| VCC | 5V | Module has its own regulator (RCWL accepts 4–28 V) |
| OUT | GPIO39 (`PIR_PIN`) | Input-only GPIO: no internal pull-up — the module actively drives the level, which fits |
| GND | Common ground | — |

## 3. Sensor — RFID MFRC522

| Pin | Target | Note |
|---|---|---|
| VCC | 3V3 from the board | **Never 5V** — destroys the module |
| RST | GPIO33 (`RFID_RST_PIN`) | — |
| GND | Common ground | — |
| MISO | GPIO35 (`RFID_MISO_PIN`) | Module → ESP32; GPIO35 is input-only — exactly the MISO role |
| MOSI | GPIO17 (`RFID_MOSI_PIN`) | ESP32 → module |
| SCK | GPIO14 (`RFID_SCK_PIN`) | Clock |
| SDA (SS) | GPIO32 (`RFID_SS_PIN`) | Chip select |
| IRQ | Not connected | Code uses polling (`PICC_IsNewCardPresent`) |

## 4. Actuator — Servo SG90 (door)

| Pin | Target | Note |
|---|---|---|
| VCC (red) | Dedicated 5V rail from LM2596 | Never from the board: ≥650 mA peaks when the mechanism stalls |
| GND (brown) | Common ground | Shared with board, buck, relay |
| Signal (orange) | GPIO2 (`SERVO_PIN`) | Strapping pin — safe: the servo does not pull the pin during reset |

## 5. Actuator — Light (LED module / signal relay)

| Pin | Target | Note |
|---|---|---|
| IN / + (signal) | GPIO4 (`LIGHT_PIN`) | Direct `digitalWrite`; series resistor if a bare LED |
| VCC | 5V | Bare LED via resistor; relay takes 5V |
| GND | Common ground | — |
