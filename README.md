# ESP32 Smart Home Firmware

Dự án Firmware cho hệ thống nhà thông minh.

## Cài đặt (Setup)
1. Cài đặt **VSCode** và extension **PlatformIO IDE**.
2. Mở thư mục này bằng PlatformIO.
3. Mở file `src/config.cpp` và thay đổi `WIFI_SSID`, `WIFI_PASSWORD` bằng thông tin mạng Wi-Fi của bạn (hoặc mạng hotspot dùng để test). Không commit credential thật.
4. Cắm mạch ESP32 vào máy tính qua cáp USB.
5. Bấm nút **Upload** (biểu tượng mũi tên phải ➔ ở góc dưới bên trái VSCode) để biên dịch và nạp code.
6. Bấm nút **Serial Monitor** (biểu tượng phích cắm 🔌) để xem log kết nối. Chắc chắn rằng baudrate được đặt là `115200`.

## Tiến độ Firmware (Member 1)
- [x] **M1-01**: Thiết lập cấu trúc project PlatformIO, cấu hình board, Serial logging (115200) và file config dùng chung.
- [x] **M1-02**: Định nghĩa tập trung danh sách topic/payload trong `config.h` và `config.cpp`, khớp 100% với MQTT Contract v1.0.0 (`docs/mqtt-contract.md`).
- [x] **M1-03**: Khởi tạo kết nối Wi-Fi (WIFI_STA), bắt sự kiện mạng (`WiFiEvent`) và tự động reconnect định kỳ không chặn luồng chính (non-blocking).
- [x] **M1-04**: Kết nối tới MQTT Broker (EMQX), cấu hình Keep Alive 30s, tự động reconnect và đăng ký Last Will & Testament (`OFFLINE`, Retain true).
- [x] **M1-05**: Đăng ký (Subscribe) các topic nhận lệnh điều khiển ngay sau khi kết nối/reconnect: `smarthome/cmd/light` và `smarthome/cmd/door`.
- [x] **M1-06**: Phân tích cú pháp và kiểm tra tính hợp lệ của payload (`ON`/`OFF`, `OPEN`/`CLOSE`), ghi log thực thi và lọc bỏ lệnh không hợp lệ an toàn, chống crash firmware.

## Member 2: Sensors & Automation

Nhánh Member 2 thêm PIR, RC522, whitelist RFID và automation đèn; vẫn dùng
đúng MQTT contract có sẵn. Xem [hướng dẫn wiring, rule ưu tiên manual và các
bước test](docs/member2-sensors-automation.md). Phần LED/relay/servo hiện đi
qua `src/actuator_bridge.cpp` dạng stub để build được trước khi Member 3 hoàn
thiện hardware.

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
