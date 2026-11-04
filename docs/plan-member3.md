# Kế hoạch triển khai — Member 3 (Long)

Phiên bản: **1.1.0**. Ngày: 04/11/2026. Cập nhật: đánh dấu trạng thái Giai đoạn 0–3; bổ sung Giai đoạn 5 (việc không cần board khi board chưa về).

Phạm vi: refactor code hiện có sang kiến trúc đã thống nhất trong [architecture.md](architecture.md) (giữ nguyên hành vi), dựng hạ tầng contract/test theo [development.md](development.md), và phần cứng thuộc phạm vi chính thức. **Không viết tính năng mới** — phần logic chưa có (đèn/relay, RFID) chỉ để skeleton + TODO.

## Giai đoạn 0 — Neo hiện trạng ✅ (trừ 2 mục chờ board)

1. ✅ Commit toàn bộ docs + code hiện tại làm mốc so sánh (commit `ad791ca`).
2. ⏳ Thêm `monitor_filters = esp32_exception_decoder, time` vào `platformio.ini` — chờ chốt khi flash board.
3. ⏳ Lập smoke checklist 5 tình huống làm chuẩn đối chiếu: `ON`/`OFF`, `OPEN`/`CLOSE`, PIR tự mở cửa + đóng sau 2s, LWT `OFFLINE` khi mất kết nối đột ngột, reconnect khi broker quay lại. Khi có board: chụp log serial + trình tự MQTT (MQTTX) làm "bằng chứng vàng".

## Giai đoạn 1 — Refactor giữ nguyên hành vi ✅

Mỗi bước = 1 commit riêng, build pass, đối chiếu lại smoke checklist:

1. Tách `core/network` (Wi-Fi, event, reconnect) khỏi `main.cpp`.
2. Tách `core/mqtt_service` (connect/LWT/reconnect/dispatch); nhân tiện bỏ nối `String` trong callback → buffer `char` tĩnh.
3. Tách `devices/door` (servo) và `devices/motion` (PIR); logic thuần (cạnh LOW→HIGH, validate payload) tách sang `*_logic.h` không include `Arduino.h`.
4. Tách `automation/motion_door`: mở cửa khi PIR, đóng sau 2s bằng `millis()` không chặn.
5. `main.cpp` còn lại chỉ nối dây (~50 dòng).
6. Bước riêng: sửa state payload đúng contract — `ON`/`OFF`/`OPEN`/`CLOSED`, bỏ `"ESP32 SEND ON"`. Đây là sửa lỗi hợp đồng, không phải tính năng mới.

## Giai đoạn 2 — Contract & test (không cần board) ✅ (mục 4 CI đã bỏ theo quyết định 03/11)

1. ✅ Thêm `[env:native]` + Unity vào `platformio.ini`; chạy được `pio test -e native` (26 test).
2. ✅ Test tối thiểu: validate payload bốn lệnh; `CLOSE` ⇒ state `CLOSED`; PIR chỉ tính cạnh lên, giữ HIGH không lặp; motion_door mở → 2s → đóng với `millis()` giả.
3. ✅ `scripts/fake_esp32.py`: subscribe `smarthome/cmd/+`, validate theo `docs/mqtt-contract.json`, publish state retain đúng, mô phỏng LWT, chế độ `--replay`. Đã kiểm thử live trên broker EMQX (9/9 bước); chờ Member 5 review.
4. ~~CI GitHub Actions: `pio run` + `pio test -e native` mỗi push~~ — bỏ, thấy thừa với quy mô đội.

## Giai đoạn 3 — Skeleton cho người khác (chỉ giao diện, không logic) ✅

- ✅ `devices/light`: khung `init`/`loop`/`handleCommand` + TODO phần relay/LED (commit `e73d8ce`) — Member 3 tự hoàn thiện khi đi dây xong (nếu muốn), hoặc để người khác.
- ✅ `devices/rfid`: khung publish JSON `event/access` (đủ ràng buộc ≤128 byte, không retain) + TODO đọc thẻ cho Member 2.

## Giai đoạn 4 — Phần cứng (phạm vi chính thức Member 3) — chờ board

Mục 1–2 soạn được sẵn khi chưa có board (xem Giai đoạn 5.2); chỉ mục 3–4 cần board.

1. Chốt pin map (servo IO2, PIR IO39, relay/LED/RFID chân nào) → ghi `docs/pin-map.md`, thống nhất với Member 1 trước khi khoá.
2. Nguồn: buck LM2596 cấp relay/LED; servo SG90 phải có nguồn riêng, không lấy từ chân 3V3/5V của board (kẹt cơ có thể kéo >500mA, gây reset board — đúng kiểu lỗi khó truy vết).
3. Đi dây breadboard, mount linh kiện lên khung nhà, đặt PIR/RFID theo thống nhất với Member 2.
4. Tài liệu đi dây cuối: bảng chân + ảnh. Đích đến (DoD): hệ vật lý chạy 30 phút không reset/không chảy dây, mở cửa/bật đèn lặp lại được.

## Giai đoạn 5 — Việc không cần board (nhận thêm từ đồng đội, làm khi board chưa về)

Thứ tự ưu tiên; mỗi mục = 1 bước review + commit riêng. Nguyên tắc: chỉ làm phần logic thuần và script, người sở hữu miền đó review và giữ quyền sở hữu; không đụng Android (Member 4).

1. **`devices/rfid_logic.h` (thuần, cho Member 2)** — format UID byte → chuỗi hex `A1B2C3D4`; bảng whitelist + hàm tra cứu trả `GRANTED`/`DENIED`; test native đủ case (UID rỗng, quá dài, thường/hoa). Trước khi làm: thông báo Member 2. Sau khi xong: Member 2 chỉ còn đọc thẻ + gọi 2 hàm.
2. ✅ Bản thảo `docs/pin-map.md` + dự toán nguồn (thuộc Giai đoạn 4.1–4.2, soạn trước được, commit `07574a8`) — bảng chân đề xuất: servo IO2, PIR IO39, relay, LED, RFID SPI (SCK/MISO/MOSI/SS/RST); sơ đồ nguồn buck LM2596, servo nguồn riêng, common ground; rủi ro số 1: SPI mặc định trùng chân Ethernet, có 3 phương án thay thế. Chốt với Member 1 khi board về, rồi mới đi dây.
3. **Check lệch contract** — script đọc `docs/mqtt-contract.json`, đối chiếu mọi hằng `TOPIC_*` và payload chữ trong `src/`; lệch ⇒ báo lỗi. Cần Member 5 đồng ý trước vì thuộc miền contract. Mục tiêu: đổi topic trong firmware mà quên đổi app ⇒ fail ngay, không âm thầm.
4. ✅ Golden-trace runner (`scripts/golden_runner.py`) — một lệnh pass/fail gom toàn bộ kiểm tra `fake_esp32.py`: lệnh hợp lệ, từ chối lệnh sai, retained readback, replay, Ctrl+C sạch, LWT khi kill; cờ `--board` để chạy lại làm checklist bán tự động cho Giai đoạn 0.3 khi board về; `--record`/`--trace FILE` để ghim "bằng chứng vàng".
5. **(Tùy chọn, cần Member 5 đồng ý)** runbook broker: sao lưu/khôi phục cấu hình EMQX, kịch bản stress test viết sẵn để chạy khi hệ đủ cả.

## Phối hợp

| Người | Việc |
|---|---|
| Member 1 (Nguyễn) | ✅ Đã nhận bàn giao `core/` sau refactor; chốt pin map (G5.2) khi board về |
| Member 2 | Vị trí PIR/RFID trên khung; nhận `rfid_logic.h` (G5.1) — bạn chỉ review, giữ quyền sở hữu phần đọc thẻ |
| Member 4 | Không đụng miền Android; liên lạc qua contract |
| Member 5 | ✅ Review `fake_esp32.py` (chờ); duyệt check lệch contract (G5.3) và golden-trace runner (G5.4) trước khi làm |

## Ràng buộc

- Refactor và tính năng mới không chung branch; refactor xong mới nhận tính năng.
- Không đổi contract khi refactor; mọi lệch contract phát hiện được ghi lại, sửa trong bước riêng (Giai đoạn 1.6).
- Việc nhận thêm (Giai đoạn 5): chỉ logic thuần + script, người sở hữu review; không đụng miền Android; đổi contract thì dừng và hỏi Member 5.
