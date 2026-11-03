# Kiến trúc firmware — core / devices / automation

Phiên bản: **1.0.0**. Người soạn: member 1. Ngày: 02/11/2026.

Thống nhất tổ chức `src/` để member 1, 2, 3 làm song song không đụng file nhau. Topic/payload vẫn theo [contract v1.0.0](mqtt-contract.md).

## 1. Nguyên tắc

Phụ thuộc một chiều: `main → automation → devices → core`.

- `main.cpp`: nơi duy nhất biết tất cả — khởi tạo module, nối handler, gọi `loop()` từng module.
- `automation/`: quy tắc ghép thiết bị (vd: PIR → mở cửa).
- `devices/`: module phần cứng "ngu", mỗi thiết bị tự lo đúng topic của mình.
- `core/`: hạ tầng Wi-Fi/MQTT, không biết thiết bị cụ thể.

Ba quy tắc:

1. `core/` không include `devices/` hay `automation/`.
2. Thiết bị không include thiết bị khác; cần tương tác ⇒ tách thành quy tắc trong `automation/`.
3. Thiết bị không tự đụng `WiFi.h`/`PubSubClient.h`; nhận interface `IMqtt` truyền từ `main`.

## 2. Cây thư mục

```text
src/
├── main.cpp                 // nối dây
├── config.h/.cpp            // giữ nguyên: topic, client id, mạng (contract)
├── core/                    // member 1: network, log, mqtt_service
├── devices/                 // light (M3), door (M3), motion (M2), rfid (M2)
└── automation/              // motion_door (M2, thống nhất với M4)
```

Tuỳ chọn: logic đáng test (phát hiện cạnh PIR, validate payload) tách thành `*_logic.h` thuần, không include `Arduino.h` (xem [development.md](development.md)).

## 3. Giao diện

- **`IMqtt` (core)**: interface mỏng — `publishState` (retain true) và `publishEvent` (retain false) đúng quy tắc contract §2. `MqttService` cài đặt interface này, thêm: connect kèm Last Will `OFFLINE` (M1-04), reconnect 5s/lần, `onCommand(topic, handler)` để dispatch tin `smarthome/cmd/+` (M1-05). Thiết bị chỉ gọi qua `IMqtt`, không đụng PubSubClient; khi test native thay bằng bản giả lập.
- **Khung thiết bị**: `init(IMqtt&)` (publish state ban đầu), `loop()` (nhịp riêng nếu cần), `handleCommand()` cho thiết bị có topic cmd. Lệnh sai do thiết bị tự loại, giữ state nguyên (M1-06).
- **Automation**: `setup()` nhận thiết bị cần dùng + `loop()` dùng `millis()`, không chặn — thay cho vòng chờ 2s hiện tại.

## 4. Sở hữu file

| Thành viên | Sở hữu | Không được sửa |
|---|---|---|
| Member 1 | `main.cpp`, `config.*`, `core/*` | `devices/*`, `automation/*` |
| Member 2 | `motion.*`, `rfid.*`, `automation/motion_door.*` | `core/*`, `light.*`, `door.*` |
| Member 3 | `light.*`, `door.*` | `core/*`, `motion.*` |
| Member 4 | App Android (repo khác) | — |
| Member 5 | contract + script kiểm thử | `src/` |

Đổi gì qua ranh giới (vd thêm hàm vào `IMqtt`): thống nhất trên nhóm, member 1 thực hiện.

## 5. Việc cần sửa khi tách `main.cpp` hiện tại

1. State payload đúng contract §2: `ON`/`OFF`/`OPEN`/`CLOSED`, không phải `"ESP32 SEND ON"`.
2. Bỏ nối `String` trong callback — dùng buffer `char` tĩnh (nguyên nhân crash muộn, xem development.md §3).
3. Vòng chờ 2s chuyển vào `automation/motion_door`, dùng `millis()` không chặn.
4. Giữ `TOPIC_EVENT_ACCESS` đã khai báo trong `config.h` cho RFID.

## 6. Tách dần — mỗi bước build chạy được

network → mqtt_service → door + motion → automation/motion_door → light (M3) → bật native test.

## Tham khảo

[Contract MQTT v1.0.0](mqtt-contract.md) · [Quy trình phát triển & debug](development.md)
