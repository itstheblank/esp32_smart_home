# ESP32 Smart Home

Hệ thống IoT kết nối các thiết bị gia đình qua mạng nội bộ để giám sát và điều khiển từ một ứng dụng duy nhất — automation chạy local nên vẫn hoạt động khi mất mạng. Mọi tin nhắn đi qua một MQTT broker (EMQX) theo [contract v1.0.0](docs/mqtt-contract.md).

Chạy broker: `docker compose up -d` (dashboard `http://localhost:18083`, user `admin` / `public`).

## Cài đặt (Setup)
1. Cài đặt **VSCode** và extension **PlatformIO IDE**.
2. Mở thư mục này bằng PlatformIO.
3. Mở file `src/config.cpp` và thay đổi `WIFI_SSID`, `WIFI_PASSWORD` bằng thông tin mạng Wi-Fi của bạn (hoặc mạng hotspot dùng để test). Không commit credential thật.
4. Cắm mạch ESP32 vào máy tính qua cáp USB.
5. Bấm nút **Upload** (biểu tượng mũi tên phải ➔ ở góc dưới bên trái VSCode) để biên dịch và nạp code.
6. Bấm nút **Serial Monitor** (biểu tượng phích cắm 🔌) để xem log kết nối. Chắc chắn rằng baudrate được đặt là `115200`.

## 1. Vấn đề (Problem)

- **Bất tiện hằng ngày** — quản lý hàng chục công tắc, núm vặn, remote riêng lẻ bằng tay; khó khăn và thiếu an toàn với người lớn tuổi hoặc người hạn chế vận động.
- **Cảnh báo nguy hiểm bị chậm** — báo khói/rò rỉ chỉ kêu trong nhà; khi không có ai ở nhà, ứng cứu đến sau khi thiệt hại đã xảy ra.
- **Thiếu thông tin hữu ích** — chỉ thấy tổng hóa đơn điện hàng tháng, không xác định được thiết bị nào đang lãng phí điện.

## 2. Giải pháp (Solution)

- **Giám sát và điều khiển tập trung** — một dashboard trên app hiển thị trạng thái thời gian thực của mọi thiết bị, bật/tắt từ mọi nơi, thay thế công tắc và remote rời rạc.
- **Automation theo quy tắc** — dữ liệu cảm biến + logic chạy local tự hành động không cần con người: tắt đèn khi không có chuyển động, phát hiện khói/khí gas tăng đột biến thì ngắt điện/van nước và đẩy thông báo khẩn cấp lên điện thoại.
- **Message brokering** — broker MQTT phân phối lệnh JSON giữa thiết bị (ESP32), client debug (MQTTX) và database; còn dư địa tích hợp giọng nói/NLP ("hands-free").

## 3. Phần cứng (HARDWARE)

| Thiết bị | Vai trò | Trạng thái |
|---|---|---|
| ESP32 WT-01 (ethernet + wireless) | Board chính, kết nối broker | Đang dùng |
| Breadboard | Thí nghiệm và đi dây | Đang dùng |
| Servo SG90 | Mở/đóng cửa (IO2) | Đang dùng |
| PIR HC-SR501 hoặc RCWL-0516 | Phát hiện chuyển động (IO39) | Đang dùng |
| Module RFID | Ghi log ra vào (event/access) | Kế hoạch |
| Relay 5V | Đóng/ngắt đèn/thiết bị | Kế hoạch |
| Module LED | Điều khiển đèn | Kế hoạch |
| Buck Converter LM2596 | Giảm áp cấp nguồn relay/LED | Kế hoạch |

## 4. Yêu cầu (REQUIREMENTS)

### Chức năng (Functional)

- [x] Message brokering: broker EMQX phân phối JSON tới ESP32, client debug và app; Last Will, state retain, tự reconnect (contract v1.0.0).
- [x] Điều khiển từ xa (cửa): lệnh `OPEN`/`CLOSE` → servo, báo state lại; lệnh sai bị bỏ qua an toàn.
- [x] Telemetry (chuyển động): PIR → `smarthome/state/motion` (debounce 250ms, publish `DETECTED`/`CLEAR`).
- [x] Automation local: PIR ổn định → bật đèn; tự tắt sau 10s không chuyển động; lệnh manual có ưu tiên đến lần chuyển trạng thái PIR kế tiếp.
- [ ] Điều khiển từ xa (đèn): relay bật/tắt từ app (Member 3).
- [x] RFID: quẹt thẻ → JSON event vào `smarthome/event/access`; UID trong whitelist mở cửa (firmware xong, chờ test trên board).
- [ ] Dashboard app (Member 4): gửi lệnh, hiển thị state thời gian thực, log ra vào.
- [ ] Cảnh báo và thông báo: đẩy thông báo khi có sự kiện nguy hiểm (chuyển động khi vắng nhà, xâm nhập).
- [ ] Mở rộng telemetry: node nhiệt độ/độ ẩm/khí gas, lưu và hiển thị trên app.
- [ ] Quy tắc automation: bật quạt hút khi nồng độ gas cao.
- [ ] Xử lý lệnh giọng nói: thu âm + Speech-to-Text → lệnh dạng text/JSON.
- [ ] State payload đúng contract (`ON`/`OFF`/`OPEN`/`CLOSED`) — firmware vẫn publish `"ESP32 SEND ON"`.

### Phi chức năng (Non-functional)

- [ ] Độ trễ: cảm biến/lệnh người dùng → thiết bị hành động dưới 500 ms (cần đo).
- [x] Xử lý tại biên (edge): automation core chạy local trên ESP32, hoạt động khi mất internet.
- [x] Độ tin cậy: reconnect Wi-Fi/MQTT không chặn, vòng loop chính luôn phản hồi.
- [ ] Unit test trên máy (`env:native`) + giả lập ESP32 trong CI mỗi push.

## Kiến trúc firmware

Mỗi thiết bị (`src/devices/`) tự quản lý logic và phần cứng của mình; `src/main.cpp` chỉ nối dây dependency và gọi `loop()`. Logic thuần (parse payload, debounce, timer) tách riêng để chạy unit test trên máy — xem [docs/architecture.md](docs/architecture.md) và [docs/development.md](docs/development.md).

## Member 2: Sensors & Automation

Nhánh Member 2 thêm PIR debounce, RC522, whitelist RFID và automation đèn; vẫn dùng đúng MQTT contract có sẵn. Logic đã được tích hợp vào các device module (`devices/motion`, `devices/light`, `devices/rfid`) thay vì class riêng. Xem [hướng dẫn wiring, rule ưu tiên manual và các bước test](docs/member2-sensors-automation.md).

## Member 5: broker và kiểm tra kết nối

Xem [hướng dẫn M5-01](docs/m5-01-broker-setup.md) để chạy EMQX, cấu hình MQTTX và kiểm tra Android/ESP32 trên mạng nội bộ.

Từ thư mục project, kiểm tra bốn lệnh MQTT bằng Python, không cần cài thêm thư viện:

```powershell
python scripts/mqtt_smoke_test.py --output docs/test-results/m5-01-local-broker.json
```

Script dùng hai client riêng để gửi và nhận chính xác `ON`, `OFF`, `OPEN`, `CLOSE`, QoS 0 và Retain tắt. Payload không có khoảng trắng hoặc ký tự xuống dòng. [Báo cáo kiểm tra broker local](docs/test-results/m5-01-local-broker.json) ghi nhận 4/4 lệnh đạt ngày 12/10/2026; kiểm tra này xác nhận chuyển tiếp MQTT, còn ESP32 và điều khiển phần cứng cần bằng chứng riêng.

Ngày 13/10/2026: firewall MQTT đã được cấu hình cho mạng Wi-Fi hiện tại; người dùng xác nhận Android và laptop gửi/nhận hai chiều thành công. Board đang ở member 1, còn chờ kiểm tra ESP32.

Để cho Android truy cập MQTT qua Wi-Fi, chạy `scripts/open_mqtt_firewall.ps1` trong PowerShell Administrator. Script chỉ cấu hình cổng TCP 1883 tại IP laptop, cho subnet và adapter chỉ định; kiểm tra lại IP bằng `ipconfig` trước khi chạy.

## MQTT contract cho nhóm (M5-03)

[Contract v1.0.0](docs/mqtt-contract.md) có bảng 7 topic, mẫu payload và quy tắc gửi/nhận cho nhóm. [Bản JSON dùng chung](docs/mqtt-contract.json) được script kiểm tra đọc trực tiếp. Member 1, 2 và 4 cần review và xác nhận dùng cùng bản; phần firmware còn thiếu được ghi rõ trong tài liệu.

Khi đưa M5-03 lên Git, đưa cùng `README.md`, `docs/mqtt-contract.md`, `docs/mqtt-contract.json`, `scripts/mqtt_smoke_test.py` và báo cáo `docs/test-results/m5-03-contract-broker.json`. Sáu topic firmware hiện có giữ nguyên.

## Tài liệu

[Kiến trúc firmware](docs/architecture.md) · [Quy trình phát triển & debug](docs/development.md) · [Contract MQTT v1.0.0](docs/mqtt-contract.md)
