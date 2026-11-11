# ESP32 Smart Home

Hệ thống IoT điều khiển và giám sát thiết bị trong nhà qua mạng LAN: ESP32 đọc cảm biến (PIR, RFID) và điều khiển thiết bị (đèn, cửa servo), mọi tin nhắn đi qua broker **EMQX** theo [MQTT contract v2.0.0](docs/contracts/mqtt-contract.md). Người dùng điều khiển bằng **app mobile** (React Native/Expo) hoặc **web dashboard** (Python), kèm **rules engine** để tự động hoá.

> **Trạng thái: Checkpoint 1** — nhánh `checkpoint1` gộp phần cứng/firmware/server (`member3/hardware-integration`) và app mobile (`member4/mobile-ui-implement`), app đã được chuyển sang contract v2 của firmware.

## Kiến trúc

```text
 PIR / RFID / Đèn / Servo                  Web dashboard + Rules engine (server/, :5000)
          │                                        ▲
     ESP32 WT32-ETH01 ── MQTT TCP 1883 ──► EMQX broker ◄── MQTT WebSocket 8083 ── App mobile (mobile/)
                         smarthome/cmd  ◄── lệnh JSON (app, dashboard, rule)
                         smarthome/logs ──► log JSON (trạng thái + sự kiện)
```

| Topic | Chiều | Payload |
|---|---|---|
| `smarthome/cmd` | App / server → ESP32 | `{"device":"LIGHT","id":1,"action":"ON","data":{}}` |
| `smarthome/logs` | ESP32 → App / server | `{"device":"DOOR","id":1,"action":"OPEN","success":true,"data":{}}` |

QoS 0, retain `false` cho cả hai. Last Will: log `SYSTEM`/`OFFLINE` trên `smarthome/logs`. Chi tiết: [mqtt-contract.md](docs/contracts/mqtt-contract.md) · [mqtt-contract.json](docs/contracts/mqtt-contract.json).

## Cấu trúc repo

| Thư mục | Nội dung |
|---|---|
| `src/` | Firmware ESP32 (PlatformIO, Arduino): `core/` (Wi-Fi, MQTT, log, command dispatcher), `devices/` (light, door, motion, rfid), `automation/` (mô hình rule) |
| `server/` | Web dashboard + rules engine (Python, Paho MQTT), xem [server/README.md](server/README.md) |
| `mobile/` | **Toàn bộ phần app mobile** (pnpm workspace riêng, tách khỏi phần cứng): `mobile_app/` (app React Native/Expo: dashboard, điều khiển đèn/cửa, radar chuyển động, RFID, nhật ký, cài đặt broker), `packages/` (`contracts`, `validators`, `design-tokens`, config ESLint/TS), `docs/` (hướng dẫn Member 4, TDD, CSV tracker) |
| `scripts/` | Công cụ Python: `periodic_toggle.py` (gửi lệnh JSON liên tục), `discover_devices.py` (dò thiết bị/cổng 1883 trong LAN), `fake_esp32.py` + `golden_runner.py` (*còn theo contract v1, cần cập nhật*) |
| `docs/` | [contracts](docs/contracts/) (MQTT, chân pin, rule), [kiến trúc firmware](docs/architecture.md), [quy trình phát triển](docs/development.md), [báo cáo tiến độ](docs/reports/progress-report/) |

## Chạy hệ thống

### 1. Broker + web dashboard

```bash
docker compose up -d
```

- EMQX: MQTT TCP `1883`, WebSocket `8083` (cho app), dashboard `http://localhost:18083` (`admin` / `public`).
- Web dashboard: `http://localhost:5000`, rules engine: `http://localhost:5000/rules`. Rule được lưu ở `server/data/rules.json`.
- Chạy server không dùng Docker: `python3 server/main.py --broker <IP broker> --port 1883 --web-port 5000`.

### 2. Firmware ESP32

1. Cài **VSCode** + extension **PlatformIO IDE**, mở thư mục repo.
2. Sửa `src/config.cpp`: `WIFI_SSID`, `WIFI_PASSWORD`, `MQTT_BROKER` (IP laptop chạy broker). Không commit mật khẩu thật.
3. Cắm board qua USB–TTL, bấm **Upload** (env `wt32-eth01`), mở **Serial Monitor** ở `115200`.
4. Khi kết nối thành công, ESP32 publish `SYSTEM`/`ONLINE` rồi trạng thái ban đầu của đèn, cửa, PIR lên `smarthome/logs`.

### 3. App mobile

```bash
cd mobile
pnpm install          # pnpm workspace của phần mobile
pnpm dev:mobile       # = expo start trong mobile/mobile_app/
```

Trong app, vào **Cài đặt** để nhập IP broker (mặc định `192.168.137.1`, cổng `8083`, path `/mqtt`). Điện thoại, laptop và ESP32 phải cùng mạng LAN.

### 4. Kiểm thử

```bash
cd mobile && pnpm test               # vitest: contracts, validators, mobile_app (gồm mqttLogAdapter)
cd mobile && pnpm validate:contract  # kiểm tra app dùng đúng contract v2, không còn topic v1
python3 scripts/periodic_toggle.py   # bật/tắt đèn và mở/đóng cửa định kỳ qua smarthome/cmd
```

## Phần cứng

Sơ đồ chân đầy đủ: [pin-contract.md](docs/contracts/pin-contract.md).

| Thiết bị | Chân ESP32 | Trạng thái |
|---|---|---|
| ESP32 WT32-ETH01 (Wi-Fi) | — | Đang dùng |
| Servo SG90 (cửa) | IO2, nguồn 5V riêng từ LM2596 | Đang dùng |
| Đèn LED / relay 5V | IO4 | Đang dùng |
| PIR HC-SR501 / RCWL-0516 | IO39 | Đang dùng |
| RFID RC522 (SPI, 3V3) | SCK IO14, MOSI IO17, MISO IO35, SS IO32, RST IO33 | Đang dùng |
| Buck LM2596, adapter 12V 2A | Rail 5V cho servo, chung GND | Đang dùng |

## Tiến độ Checkpoint 1

### Đã hoàn thành

- [x] Firmware gộp một bản duy nhất: Wi-Fi + MQTT (keep-alive 30s, reconnect 5s, Last Will), command dispatcher JSON, từ chối lệnh sai và log `success:false`.
- [x] Đèn `ON`/`OFF` và cửa servo `OPEN`/`CLOSE` điều khiển qua `smarthome/cmd`, trạng thái báo lại trên `smarthome/logs`.
- [x] PIR có debounce (`PIR_STABLE_MS = 250`), log `MOTION_DETECTED` / `MOTION_CLEAR` khi đổi trạng thái.
- [x] RFID RC522 đọc UID thật, log `RFID_TAG_DETECTED` kèm `tagId`.
- [x] Web dashboard: gửi lệnh, xem luồng log thời gian thực (SSE, 300 sự kiện gần nhất).
- [x] Rules engine trên server: điều kiện → hành động, có hẹn giờ tắt (`durationSec`), lưu trong `rules.json`. Đã chạy trên phần cứng: thẻ master `C44E0307` mở cửa 5s + bật đèn; thẻ lạ chỉ bật đèn 2s, cửa vẫn đóng.
- [x] App mobile: dashboard đèn/cửa/chuyển động/RFID, kết nối broker qua WebSocket với reconnect backoff + jitter, khoá điều khiển khi broker/ESP32 offline, cảnh báo LWT, đa ngôn ngữ, giao diện sáng/tối.
- [x] App dùng contract v2: gửi JSON lên `smarthome/cmd`, đọc `smarthome/logs` (`mobile/mobile_app/src/services/mqttLogAdapter.ts`); nếu ESP32 từ chối lệnh thì nút quay về trạng thái đã xác nhận.
- [x] Tài liệu contract: MQTT v2.0.0 (md + json), sơ đồ chân pin, rule; BOM và báo cáo tiến độ.

### Đang làm / còn lại

- [ ] Test app mobile với ESP32 thật trên mô hình (lệnh + trạng thái hai chiều).
- [ ] Automation PIR → bật đèn, tự tắt sau khi hết chuyển động: chưa có rule trong `rules.json` (đã có `MOTION_NO_MOTION_TIMEOUT_MS` trong config). Cũng chưa quyết định cách xử lý khi người dùng tắt đèn tay lúc PIR đang phát hiện chuyển động.
- [ ] Firmware chưa tự đánh giá thẻ RFID: `RFID_ALLOWED_UIDS` vẫn là UID mẫu, việc cho phép/từ chối đang do rule server quyết định. App tạm coi `success:true` là `GRANTED`.
- [ ] Bảng rule trong firmware (`src/automation/`) đang trống; rule chạy trên server nên cần server hoạt động.
- [ ] Màn nhật ký của app mới ghi cảnh báo; chưa ghi các sự kiện đèn/cửa/chuyển động.
- [ ] Đưa test native firmware (`env:native`) quay lại, cập nhật `fake_esp32.py` / `golden_runner.py` sang contract v2.
- [ ] Hoàn thiện cơ cấu cửa, mô hình nhà, lắp đặt cảm biến; test nguồn/nhiễu 30 phút; sơ đồ đi dây và ảnh cuối.
- [ ] Checklist nghiệm thu end-to-end, kịch bản demo, đo độ trễ (mục tiêu < 500 ms).
- [ ] Mở rộng (sau khi phần cốt lõi đạt): lệnh giọng nói, lưu lịch sử sự kiện vào database.

## Nhóm

| Thành viên | Phụ trách |
|---|---|
| M1 — Trần Sỹ Nguyên | Wi-Fi/MQTT core, giao diện firmware |
| M2 — Lăng Hồng Nguyệt Anh | PIR, RFID, automation |
| M3 — Lương Ngọc Vũ Long | Nguồn, đi dây, actuator, mô hình |
| M4 — Hà Đức Dương | App mobile, điều khiển MQTT, giao diện sự kiện |
| M5 — Nguyễn Vũ Anh Khoa | Broker, tích hợp, QA, báo cáo |
