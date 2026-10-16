# Member 2 — Sensors & Automation

This branch adds PIR motion automation and RC522 RFID access control while keeping
Member 3 actuator code behind a small bridge. It follows MQTT contract v1.0.0.

## Wiring assumptions (WT32-ETH01)

Confirm these pins with Member 3 before wiring; they are centralized in
`src/config.cpp`.

| Module | Module pin | WT32-ETH01 pin | Notes |
|---|---|---:|---|
| PIR | OUT | GPIO39 | Input-only GPIO; use the PIR's logic-level-safe output. |
| PIR | VCC | 5V | Check the particular PIR module's supply label. |
| PIR | GND | GND | Shared ground is required. |
| RC522 | SDA / SS | GPIO32 | SPI chip-select. |
| RC522 | RST | GPIO33 | Reset. |
| RC522 | SCK | GPIO14 | SPI clock. |
| RC522 | MOSI | GPIO17 | SPI controller-to-reader. |
| RC522 | MISO | GPIO35 | Input-only GPIO; appropriate for MISO. |
| RC522 | 3.3V | 3.3V | **Never connect RC522 VCC to 5V.** |
| RC522 | GND | GND | Shared ground is required. |
| RC522 | IRQ | not connected | Not used; firmware polls non-blockingly. |

## Behaviour

- PIR samples continuously and accepts a transition only after `PIR_STABLE_MS`
  (250 ms by default). It publishes retained `DETECTED` or `CLEAR` on
  `smarthome/state/motion`.
- A stable motion transition switches the light on through `actuator::setLight`
  and publishes retained light state. A stable clear transition starts the
  configurable `MOTION_NO_MOTION_TIMEOUT_MS` timer (10 s by default); expiry
  switches the light off.
- Manual MQTT `ON`/`OFF` works immediately, cancels the pending automation
  timer, and takes priority until the **next stable PIR transition**. That
  transition returns control to automation. This makes manual-vs-automation
  behaviour deterministic without an extra mode topic.
- RC522 sends non-retained `{"uid":"A1B2C3D4","result":"GRANTED"}` or
  `DENIED` on `smarthome/event/access`. UIDs are uppercase hex with no spaces.
  Only a whitelisted UID invokes `actuator::openDoor`; an unknown card never
  invokes it. A successful bridge call publishes retained `OPEN` door state.

## Before hardware demo

1. Replace the example `RFID_ALLOWED_UIDS` entry in `src/config.cpp` with each
   actual authorized UID printed by Serial Monitor.
2. Verify no Member 3 device uses GPIO 14, 17, 32, 33, 35, or 39. If it does,
   update all relevant constants together before wiring.
3. Replace the logging-only bodies in `src/actuator_bridge.cpp` with the real
   LED/relay/servo actions, retaining the three bridge function signatures.

## Build and bench test

Run `pio run`, then `pio run --target upload` and open a 115200-baud monitor.
Use an MQTT client subscribed to `smarthome/#`:

1. Confirm board publishes `state/motion` and `state/light` after MQTT reconnect.
2. Trigger PIR: expect `DETECTED`, then light `ON`.
3. Stop motion: expect `CLEAR`; after 10 seconds expect light `OFF`.
4. During the timer, publish `OFF` to `smarthome/cmd/light`; expect no later
   automatic action until the PIR changes state again.
5. Present an allowed then an unknown RFID card; confirm `GRANTED`/`DENIED`
   events and that only the allowed card uses the door bridge.

The default bridge deliberately logs success, so these flows can be verified
before Member 3's electronics are present. It is not proof that physical
actuators work.
