# 🤖 Hướng Dẫn Kỹ Thuật Dành Cho AI Agents & Developers — Nhánh `feat/ui-dashboard`

> **Dự án:** ESP32 Smart Home IoT System  
> **Nhánh làm việc:** `feat/ui-dashboard`  
> **Phân hệ:** `mobile_app/` (React Native 0.88, Expo SDK 58)  
> **Người phụ trách:** Member 4 (Mobile & UI/UX Developer)  
> **Mục tiêu cốt lõi:** Hiện thực hóa 100% ứng dụng Mobile Smart Home Dashboard theo thiết kế Figma, kết nối thời gian thực với ESP32 qua MQTT Broker, tuân thủ nghiêm ngặt Hợp đồng MQTT v1.0.0 và đạt chuẩn công nghiệp về kiểm thử chất lượng cao.

---

## 1. Định Vị Dự Án & Trách Nhiệm Nhánh `feat/ui-dashboard`

Nhánh `feat/ui-dashboard` chịu trách nhiệm toàn bộ giao diện điều khiển và giám sát người dùng cuối của ngôi nhà thông minh. Toàn bộ mã nguồn phải phản ánh chân thực thiết kế từ bản Figma và giao tiếp chuẩn xác với phần cứng ESP32.

### 5 Màn Hình / Khối Chức Năng Bắt Buộc:

1. **Màn hình Khởi động Gateway (Stash/Splash Screen):**
   - Điểm chạm đầu tiên khi mở app; animation mượt mà mô phỏng quá trình kết nối tới Gateway/Broker.
2. **Màn hình Dashboard Chính (Main Dashboard):**
   - Bộ chọn phòng (Living Room, Bedroom, Kitchen, v.v.).
   - Card điều khiển thiết bị: Đèn (Light Relay), Khóa cửa (Smart Door Lock), Cảm biến chuyển động (PIR Motion).
   - Đồng hồ đo cảm biến môi trường (Nhiệt độ °C/°F, Độ ẩm %, Mức sáng Lux).
   - **Header Bar cao cấp:**
     - Toggle chuyển đổi **Dark Mode / Light Mode** với animation chuyển hóa mượt mà giữa icon **Mặt Trời và Mặt Trăng**.
     - Toggle chuyển đổi ngôn ngữ **Tiếng Anh / Tiếng Việt (kèm cờ EN / VI)** đồng bộ toàn hệ thống.
3. **Màn hình Nhật Kí Sự Kiện Thời Gian Thực (Real-Time Event Tracking Screen):**
   - Chuyển đổi thành một trang độc lập chuyên biệt.
   - Luồng sự kiện cập nhật thời gian thực (RFID access granted/denied, Door opened/closed, Motion detected, Board online/offline).
   - Bộ lọc chuyên sâu: Theo mức độ nghiêm trọng (**INFO, WARN, CRITICAL**), theo loại thiết bị, theo khoảng thời gian và ô tìm kiếm thẻ UID.
4. **Màn hình Cài Đặt (Settings Screen):**
   - Trang độc lập có tiêu đề và phân mục rõ ràng.
   - Hướng dẫn cấu hình chi tiết dành cho người mới truy cập lần đầu (First-time setup guide).
   - Cấu hình kết nối MQTT Broker: Host IP (mạng LAN/EMQX), Cổng 1883, Client ID, Keep-alive.
   - **Notification Settings:** Cấu hình thông báo thông minh (Cảnh báo mở cửa bất thường, Cảnh báo nhiệt độ cao/nguy cơ cháy, Phát hiện chuyển động khi vắng nhà).
5. **Cơ Chế Hợp Nhất Ngôn Ngữ Nhật Ký (i18n Log Synchronization):**
   - Dữ liệu nhật ký sự kiện bắt buộc lưu dưới dạng cấu trúc chìa khóa (Key-based localization: `events.access.granted`, `events.door.opened`).
   - Tuyệt đối không lưu chuỗi văn bản tĩnh để khi người dùng đổi ngôn ngữ EN $\leftrightarrow$ VI, toàn bộ lịch sử log chuyển đổi đồng bộ 100%, không xảy ra hiện tượng tiếng Anh - tiếng Việt trộn lẫn lộn xộn.

---

## 2. Ngăn Xếp Công Nghệ & Quy Chuẩn Công Cụ

- **Nền tảng:** React Native 0.88, Expo SDK 58 (Expo Go & EAS Development Build).
- **Trình quản lý gói:** Sử dụng duy nhất **`npm`**. _(Tuyệt đối KHÔNG dùng bun, yarn hay pnpm trong nhánh này)_.
- **Hệ thống Linter & Formatter:**
  - **ESLint v9 Flat Config:** Cấu hình tại [mobile_app/eslint.config.js](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/eslint.config.js), chạy qua `@eslint/js` với tốc độ quét ~3 giây.
  - **Prettier:** Cấu hình tại [mobile_app/.prettierrc](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/.prettierrc).
- **Công cụ Kiểm thử:** **Vitest** runner hiện đại cấu hình tại [mobile_app/vitest.config.mjs](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/vitest.config.mjs), tốc độ chạy test < 500ms.
- **Hợp đồng IoT:** [docs/mqtt-contract.json](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/docs/mqtt-contract.json) và script thẩm định [mobile_app/scripts/validate-contract.js](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/scripts/validate-contract.js).
- **Đóng gói ứng dụng:** Expo Application Services (EAS Build) qua [mobile_app/eas.json](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/eas.json).

---

## 3. Kiến Trúc 3 Tầng Headless (Pragmatic Clean Architecture)

Để ứng dụng vừa mượt mà trên điện thoại, vừa có thể chạy kiểm thử tự động 100% trong môi trường Node.js mà không cần mở máy ảo Android, mọi mã nguồn trong `mobile_app/src/` phải tuân thủ nghiêm ngặt 3 tầng:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CONTRACTS & SHARED SCHEMAS (SSOT)                                   │
│    - Thư mục: src/contracts/                                           │
│    - Hằng số topic, payload types chuẩn hóa từ docs/mqtt-contract.json │
│    - JavaScript thuần: KHÔNG chứa React/JSX, KHÔNG phụ thuộc UI        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 2. APPLICATION / HEADLESS LOGIC (100% TESTABLE TRONG VITEST)           │
│    - Thư mục: src/services/, src/hooks/, src/utils/                    │
│    - State Machines (Đèn, Cửa, Trạng thái Board Online/Offline)        │
│    - Optimistic Actions & Timeout Rollback (5s Timer)                  │
│    - Event Log Parser & i18n Translation Resolver                      │
│    - 100% file .js thuần, test trực tiếp bằng Vitest siêu tốc          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ 3. THIN PRESENTATION LAYER (DUMB REACT NATIVE COMPONENTS)              │
│    - Thư mục: src/components/, src/screens/                            │
│    - Mỗi component/screen < 200 dòng                                   │
│    - Chỉ nhận dữ liệu ViewModel và truyền sự kiện onClick/onToggle     │
│    - CẤM: Viết mã kết nối MQTT, parse JSON hay logic nghiệp vụ tại đây│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Quy Chuẩn Kiểm Thử Nghiêm Ngặt — Tôn Chỉ Chống Test Giả Mạo

> **Lưu ý về quy trình:** Quy trình TDD (Test-Driven Development) chi tiết trong [docs/TDD/TDD-WORKFLOW-GATES.md](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/docs/TDD/TDD-WORKFLOW-GATES.md) là **tùy chọn phương án phát triển**. Thành viên có thể linh hoạt chọn TDD-first hoặc Code-first tùy theo module (ví dụ: viết test trước cho logic MQTT, nhưng dựng code trước cho layout UI).  
> **TUY NHIÊN:** Dù áp dụng phương pháp nào, **Quy chuẩn chất lượng test là TUYỆT ĐỐI NGHIÊM NGẶT**.

### 🚫 CÁC HÀNH VI KIỂM THỬ BỊ CẤM TRIỆT ĐỂ:

1. **Nghiêm cấm Tautological Tests (Test tự xưng):**
   - Cấm khai báo object mock rồi assert chính object mock đó (`expect(mock.val).toBe('val')`).
   - Mọi assertion bắt buộc phải gọi qua hàm sản xuất thực tế (`pure functions`, `reducers`, `parsers`).
2. **Nghiêm cấm Mock logic nghiệp vụ đang được kiểm thử:**
   - Chỉ được phép mock I/O ngoại vi (mạng MQTT client, AsyncStorage).
   - Tuyệt đối cấm mock chính hàm reducer hoặc hàm xử lý payload.
3. **Nghiêm cấm Deceptive Fallback (Nuốt lỗi bằng số liệu giả):**
   - Khi cảm biến ngắt kết nối hoặc gói tin lỗi, test phải khẳng định trạng thái trả về là `DISCONNECTED` / `null` / `UNKNOWN`.
   - Tuyệt đối cấm dùng `?? 0` để che giấu lỗi khiến app hiển thị 0°C.
4. **Nghiêm cấm test không có Assertion hoặc Assertion luôn đúng:**
   - Cấm `expect(true).toBe(true)` hoặc các bài test rỗng không có giá trị phát hiện lỗi.

### ✅ CÁC KHÍA CẠNH KIỂM THỬ BẮT BUỘC PHẢI COVER:

Chi tiết xem tại [docs/TDD/ADVERSARIAL-TDD-GUIDE.md](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/docs/TDD/ADVERSARIAL-TDD-GUIDE.md):

- **Contract Boundary:** Lệnh đóng cửa phát ra đúng `"CLOSE"`, trạng thái cửa đóng nhận đúng `"CLOSED"`. Lệnh đèn `"ON"`/`"OFF"`.
- **Optimistic Update & Timeout Rollback:** Bấm nút mở cửa $\rightarrow$ UI chuyển sang Pending $\rightarrow$ Nếu sau 5s ESP32 không phản hồi hoặc báo OFFLINE $\rightarrow$ UI tự động rollback về trạng thái cũ và báo lỗi.
- **Concurrency & Rapid Click:** Bấm liên tục không gây bão gói tin; gói tin cũ (stale packet) không ghi đè trạng thái mới.
- **Network Resilience:** Nhận gói tin Last Will `smarthome/state/online` = `"OFFLINE"` $\rightarrow$ UI chuyển ngay sang banner ngắt kết nối, vô hiệu hóa nút bấm điều khiển.
- **Event Log i18n:** Lưu trữ key-based, chuyển đổi ngôn ngữ EN $\leftrightarrow$ VI hiển thị chính xác, phân loại đúng severity (`INFO`, `WARN`, `CRITICAL`).
- **Sensor Anomaly:** Cảm biến gửi dữ liệu ngoài dải (ví dụ > 60°C hoặc null) được gắn cờ lỗi và hiển thị an toàn.

---

## 5. Bảng Lệnh Kiểm Tra Chất Lượng Cục Bộ (Local Quality Commands)

Mọi thay đổi trên nhánh `feat/ui-dashboard` phải vượt qua các lệnh kiểm tra trước khi commit hoặc đẩy lên remote:

```bash
# 1. Kiểm tra toàn diện 5 chốt chặn trong 1 lệnh duy nhất (Doctor, Lint, Prettier, Contract, Unit Test)
npm run check:all

# 2. Kiểm tra tính tương thích Expo SDK (Bắt buộc đạt 20/20 checks)
npm run doctor

# 3. Quét tĩnh mã nguồn bằng ESLint 9 Flat Config (0 errors, 0 warnings)
npm run lint

# 4. Tự động sửa lỗi cú pháp & định dạng theo Prettier
npm run format

# 5. Kiểm tra Hợp đồng MQTT IoT so với docs/mqtt-contract.json
npm run validate:contract

# 6. Chạy toàn bộ Unit Tests với Vitest
npm test

# 7. Đóng gói file APK gửi nhóm cài lên điện thoại thật
npm run build:apk
```

---

## 6. Quy Tắc Quản Lý Nhánh & Commit Git

- **Tên nhánh:** Phải luôn là `feat/ui-dashboard` (hoặc nhánh con dạng `feat/*`).
- **Bảo vệ Trunk:** Tuyệt đối không push trực tiếp vào `main` hoặc `dev`. Pre-push hook sẽ tự động chặn hành động này.
- **Quy chuẩn Conventional Commits:** Bắt buộc có tiền tố phân loại:
  ```bash
  git commit -m "feat(ui): add sun moon animated theme toggle"
  git commit -m "fix(mqtt): ensure door command payload is CLOSE"
  git commit -m "test(event): add i18n key-based log localization probe"
  git commit -m "style(card): update device card border radius and shadow"
  ```
- **Path Filtering:** Hook pre-commit và pre-push chỉ kiểm tra mobile khi có thay đổi trong `mobile_app/**` hoặc file hợp đồng, giữ cho tốc độ commit của toàn bộ monorepo luôn nhanh nhất.
