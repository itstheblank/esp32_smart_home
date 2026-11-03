# Quy trình phát triển & debug — làm việc được khi không có board

Phiên bản: **1.0.0**. Người soạn: member 1. Ngày: 02/11/2026.

Nguyên tắc: **đừng debug trên board**. Lỗi phải tái lập được trên máy tính; board chỉ dùng để xác nhận lần cuối. Đi kèm [architecture.md](architecture.md).

## 1. Unit test trên máy (`env:native`)

- Thêm `[env:native]` (`platform = native`, framework Unity) vào `platformio.ini`; chạy `pio test -e native` — không cần board, ai cũng chạy được.
- Chỉ test logic thuần **không include `Arduino.h`** — vào/ra qua `char*`, `millis()` nhận tham số `now` thay vì gọi trực tiếp. Đặt ở `*_logic.h` (architecture §2).
- Danh sách test tối thiểu theo contract:

| Nhóm | Test |
|---|---|
| Light | `ON`/`OFF` hợp lệ; `on`, có `\n`, có ngoặc kép bị từ chối; lệnh sai ⇒ state giữ nguyên |
| Door | `OPEN`/`CLOSE` hợp lệ; state publish là `CLOSED` (khác chữ lệnh `CLOSE`) |
| Motion | Chỉ cạnh LOW→HIGH tính; giữ HIGH không lặp sự kiện |
| RFID | JSON đủ `uid` + `result`; uid hex in hoa không dấu cách; ≤ 128 byte |
| motion_door | Detect ⇒ mở; sau 2s ⇒ đóng; không chặn vòng loop |

- Phần gọi phần cứng (`pinMode`, `servo.write`, …) nằm trong `.cpp` thiết bị, chỉ kiểm tra trên board.

## 2. Giả lập ESP32 (`scripts/fake_esp32.py`)

Mở rộng từ `mqtt_smoke_test.py`, đọc thẳng `docs/mqtt-contract.json` để không lệch contract:

- Subscribe `smarthome/cmd/+`, validate payload; lệnh sai chỉ log, đúng thì publish state retain (`CLOSE` ⇒ `CLOSED`).
- Mô phỏng online/offline và LWT `OFFLINE`; client id riêng, không trùng `ESP32_SmartHome_Core`.
- **Chế độ replay**: phát lại trình tự tin đã ghi từ phiên thật (MQTTX export) — tái lập lỗi của board ngay trên laptop.
- Ai dùng: member 4 phát triển app không cần board; member 2/3 chạy logic mới trước lượt board; ai làm sai contract bị từ chối ngay (vd `"ESP32 SEND ON"`).

Bắt trình tự tin thật: MQTTX lưu hội thoại, hoặc dashboard EMQX.

## 3. Khi có board: tận dụng Serial

- Thêm `monitor_filters = esp32_exception_decoder, time` vào `platformio.ini`: crash tự dịch ra `file:dòng`, log có timestamp đối chiếu được với timeline MQTT.
- Log theo `TAG + mức` (`NET`, `MQTT`, `LIGHT`, `DOOR`, `MOTION`, `RFID`, `AUTO`), thay cho `println` rải rác; mỗi lệnh đọc được trọn vòng đời `RX → hợp lệ → actuator → TX state`.
- Dòng sức khỏe ~30s: heap free, RSSI, `mqttClient.state()` — heap giảm dần ⇒ rò rỉ, phát hiện trước khi crash.
- Quy tắc cứng: **không nối `String` trong callback** — dùng buffer `char` tĩnh. `String` gây phân mảnh heap ⇒ crash muộn, xa chỗ gây lỗi, khó truy vết nhất trên ESP32.

## 4. Vòng debug 5 bước

1. Chụp trình tự tin MQTT + trace Serial.
2. Phát lại bằng `fake_esp32.py --replay` hoặc smoke test.
3. Viết test native thất bại tái hiện đúng lỗi.
4. Sửa đến khi test xanh; giữ test lại để không tái diễn.
5. Xác nhận trên board một lần cuối.

Thường chỉ cần board ở bước 1 và 5. JTAG/ESP-Prog là lựa chọn cuối — hầu hết lỗi thuộc logic/truyền tin.

## 5. CI và board dự phòng

- GitHub Actions: mỗi push chạy `pio run` (build firmware) + `pio test -e native` — không ai phá build mà không biết, không cần board.
- DevKit ESP32 rẻ (~5$) làm board dự phòng: firmware nguyên, chỉ khác số chân trong config; không ai phải chờ wt32-eth01 luân chuyển. Lưu ý wt32-eth01 không có USB, cần adapter USB-TTL; DevKit cắm thẳng.

## Tham khảo

[architecture.md](architecture.md) · [Contract MQTT v1.0.0](mqtt-contract.md) · [PubSubClient 2.8](https://pubsubclient.knolleary.net/api)
