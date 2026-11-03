# ESP32 Smart Home

Hệ thống IoT kết nối các thiết bị gia đình qua mạng nội bộ để giám sát và điều khiển từ một ứng dụng duy nhất — automation chạy local nên vẫn hoạt động khi mất mạng. Mọi tin nhắn đi qua một MQTT broker (EMQX) theo [contract v1.0.0](docs/mqtt-contract.md).

Chạy broker: `docker compose up -d` (dashboard `http://localhost:18083`, user `admin` / `public`).

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
- [x] Telemetry (chuyển động): PIR → `smarthome/state/motion`.
- [x] Automation local: phát hiện chuyển động → tự mở cửa, tự đóng sau 2s.
- [ ] Điều khiển từ xa (đèn): relay bật/tắt từ app (Member 3).
- [ ] RFID: quẹt thẻ → JSON event vào `smarthome/event/access` (Member 2).
- [ ] Dashboard app (Member 4): gửi lệnh, hiển thị state thời gian thực, log ra vào.
- [ ] Cảnh báo và thông báo: đẩy thông báo khi có sự kiện nguy hiểm (chuyển động khi vắng nhà, xâm nhập).
- [ ] Mở rộng telemetry: node nhiệt độ/độ ẩm/khí gas, lưu và hiển thị trên app.
- [ ] Quy tắc automation: tắt đèn sau thời gian không có chuyển động; bật quạt hút khi nồng độ gas cao.
- [ ] Xử lý lệnh giọng nói: thu âm + Speech-to-Text → lệnh dạng text/JSON.
- [ ] State payload đúng contract (`ON`/`OFF`/`OPEN`/`CLOSED`) — firmware vẫn publish `"ESP32 SEND ON"`.

### Phi chức năng (Non-functional)

- [ ] Độ trễ: cảm biến/lệnh người dùng → thiết bị hành động dưới 500 ms (cần đo).
- [x] Xử lý tại biên (edge): automation core chạy local trên ESP32, hoạt động khi mất internet.
- [x] Độ tin cậy: reconnect Wi-Fi/MQTT không chặn, vòng loop chính luôn phản hồi.
- [ ] Unit test trên máy (`env:native`) + giả lập ESP32 trong CI mỗi push.

## Tài liệu

[Kiến trúc firmware](docs/architecture.md) · [Quy trình phát triển & debug](docs/development.md) · [Contract MQTT v1.0.0](docs/mqtt-contract.md)
