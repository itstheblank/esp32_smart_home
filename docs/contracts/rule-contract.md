# Rule contract — quy tắc automation động

Phiên bản: **0.1.0 (Phase 0)**. Người soạn: member 3. Ngày: 05/11/2026.

Tài liệu này đóng băng **từ vựng và ngữ nghĩa** của hệ thống quy tắc động, thay cho 2 quy tắc cứng `automation/light_motion` và `automation/rfid_door`. Topic/payload vẫn theo [mqtt-contract.md](mqtt-contract.md) — engine **không thêm topic MQTT mới** ở giai đoạn này. Nguyên tắc kiến trúc [architecture.md](architecture.md) giữ nguyên: phụ thuộc một chiều `main → automation → devices → core`, thiết bị không include thiết bị khác.

## 1. Khái niệm

| Khái niệm | Định nghĩa |
|---|---|
| **Device** | Modul phần cứng trong `devices/`. Có **định danh** (`light`, `door`, `motion`, `rfid`) |
| **State** | Giá trị hiện tại của thiết bị, publish retained (contract §2). State = "điều gì ĐÚNG lúc này" |
| **Event** | Sự việc xảy ra một lần, publish không retain. Event = "điều gì ĐÃ XẢY RA", không có khái niệm stale |
| **Rule** | `{id, tên, enabled, trigger, actions[]}` — mô tả "khi X thì làm Y", là **dữ liệu**, không phải code |
| **Trigger** | Điều kiện khởi phát rule, theo một trong 3 kiểu ở §3 |
| **Action** | Lệnh gửi cho một thiết bị đích, dạng chuỗi payload như tin MQTT cmd |

Vai trò thiết bị:

- **Source**: phát state/event cho engine (`motion`, `rfid`)
- **Sink**: nhận action (`light`, `door`)
- Thiết bị có thể vừa source vừa sink trong tương lai (vd `door` sau này có cảm biến cửa)

## 2. Từ vựng thiết bị (đóng băng)

| Device | State (topic) | Giá trị state | Nhận lệnh | Event phát ra |
|---|---|---|---|---|
| `light` | `smarthome/state/light` | `ON`, `OFF` | `ON`, `OFF` | — |
| `door` | `smarthome/state/door` | `OPEN`, `CLOSED` | `OPEN`, `CLOSE` | — |
| `motion` | `smarthome/state/motion` | `DETECTED`, `CLEAR` | — (source thuần) | — |
| `rfid` | — (source thuần) | — | — | `smarthome/event/access` JSON `{"uid","result"}`, `result ∈ {GRANTED, DENIED}` |

Lưu ý bất đối xứng có chủ ý: `door` nhận lệnh `CLOSE` nhưng state là `CLOSED` — engine phải dùng đúng bảng này, không tự "chuẩn hoá".

## 3. Kiểu trigger (đóng băng ngữ nghĩa)

### 3.1. `ChangedTo`
- Kích hoạt **đúng một lần** mỗi lần state của thiết bị chuyển **thành** giá trị chỉ định.
- Không kích hoạt lại khi state đã ở giá trị đó (không có cạnh ở ↔ ở).
- **Ngữ nghĩa boot**: lần publish state đầu tiên sau khởi động (initial state trong `init()`) **không** tính là chuyển đổi — engine khởi động với state hiện có, không bắn rule lúc boot.

### 3.2. `IsForMs`
- Kích hoạt khi state **giữ liên tục** giá trị chỉ định ít nhất `stableMs` mili-giây.
- Đo bằng `millis()` do engine inject; reset về 0 mỗi khi state rời khỏi giá trị.
- Kích hoạt **đúng một lần** mỗi khoảng giữ liên tục; nếu state quay lại giá trị đó thì đếm lại từ đầu.

### 3.3. `EventEquals`
- Kích hoạt theo **từng lần event** xảy ra, khi trường chỉ định của event bằng giá trị chỉ định (vd `event access`, trường `result` = `GRANTED`).
- Không retain, không replay: event xảy ra khi engine/app offline thì mất (theo đúng contract §4.8).

## 4. Ngữ nghĩa action

- Action được dispatch **theo thứ tự** trong mảng, **đồng bộ ngay trong `loop()`**, không xếp hàng chờ qua vòng lặp.
- Action gửi payload qua **`handleCommand()` sẵn có của thiết bị** — thiết bị tự kiểm tra, payload sai bị bỏ, state giữ nguyên (M1-06). Engine không nhân bản/không chuẩn hoá payload.
- Giới hạn tĩnh: `MAX_ACTIONS_PER_RULE = 2`, `MAX_RULES = 8` (chống phình RAM ESP32).
- Nếu nhiều rule cùng kích hoạt trong một vòng `loop()`: thực hiện theo **thứ tự khai báo** trong bảng rule. Không có độ ưu tiên — cần phân biệt thì sắp thứ tự.

## 5. Quy tắc built-in (Phase 2 port từ code cứng)

| ID | Trigger | Action | Ghi chú |
|---|---|---|---|
| `motion-light-on` | `ChangedTo(motion, DETECTED)` | `light` ← `ON` | R1 |
| `motion-light-off` | `IsForMs(motion, CLEAR, 10000)` | `light` ← `OFF` | R2 — **tạm giữ trong `LightAutomation`** vì ràng buộc với manual override (xem §7) |
| `rfid-door-open` | `EventEquals(access, result, GRANTED)` | `door` ← `OPEN` | R3 — **protected rule**, xem §6 |

## 6. Protected rule

`rfid-door-open` là quy tắc **bảo vệ**: chỉ được định nghĩa sẵn trong firmware, không được tắt/ghi đè bởi rule động sau này. Lý do an ninh: nếu cho phép rule runtime kiểu `motion DETECTED → door OPEN` thì cơ chế whitelist RFID trở nên vô nghĩa. Mọi action trỏ tới `door` ← `OPEN` từ nguồn động phải bị engine từ chối.

## 7. Ngoài phạm vi phiên bản 0.1.0

- Lịch/timestamp (chạy lúc 19h), biểu thức điều kiện, điều kiện AND nhiều thiết bị
- Rule runtime qua MQTT/file flash (Decision 1B/1C trong kế hoạch) — Phase 3
- Chuyển R2 (no-motion timeout) vào engine — phải dựng lại ngữ nghĩa manual override kèm test riêng trước khi dời
- Đổi `mqtt-contract.md` — engine chỉ tiêu thụ topic hiện có

## 8. Hiện thực hoá kế hoạch (mốc kiểm tra)

| Phase | Sản phẩm | Kiểm chứng |
|---|---|---|
| 0 | Tài liệu này | Review nhóm |
| 1 | `automation/rule_contract.h`, `automation/rule_engine_logic.h` (thuần, không Arduino) + test Unity | `pio test -e native` xanh |
| 2 | `automation/rule_engine.{h,cpp}`, getter `light.isOn()`/`door.isOpen()`, bảng rule trong `config/`, nối `main.cpp`, xoá `light_motion.*`, `rfid_door.*` | Build + smoke test + golden runner ≥ 9/10 |
| 3 | Rule runtime / file flash, dời R2 | Theo Decision 1B/1C |
