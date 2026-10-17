# 🚦 Quy Trình Kỹ Nghệ TDD & Các Cổng Quyết Định (Decision Gates) — ESP32 Smart Home

> **Dự án:** ESP32 Smart Home IoT System  
> **Phạm vi áp dụng:** Phân hệ Mobile App (`mobile_app/`), Firmware C++ (`src/`), Broker Integration (`docs/mqtt-contract.json`)  
> **Tính chất:** **TÙY CHỌN & LINH HOẠT (Optional & Adaptive)** — Thành viên/nhánh có thể linh hoạt áp dụng quy trình TDD hoặc Code-first tùy theo module và phong cách làm việc.  
> **Nguyên tắc bất biến:** Bất kể lựa chọn phương pháp phát triển nào, **Quy chuẩn chất lượng test (Test Quality Standards)** là **NGHIÊM NGẶT & KHÔNG THƯƠNG LƯỢNG (Strict & Non-negotiable)**. Nghiêm cấm sinh test giả lập kết quả để đối phó CI.

---

## 1. Bản Chất Quy Trình: Linh Hoạt Lựa Chọn, Nghiêm Ngặt Nghiệm Thu

Trong dự án IoT **ESP32 Smart Home**, sự tương tác giữa phần cứng (ESP32, cảm biến DHT11/PIR, Relay đèn, Servo khóa cửa, còi Buzzer) và phần mềm (Mobile App, MQTT Broker) đòi hỏi tính chính xác tuyệt đối ở tầng giao tiếp dữ liệu.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PHƯƠNG ÁN PHÁT TRIỂN                           │
│                                                                        │
│   [LỰA CHỌN A: TDD-First]              [LỰA CHỌN B: Code-First]        │
│   Micro-Plan ──> Test ĐỎ ──> Code       Code ──> Viết Unit/Contract     │
│   (Khuyên dùng cho Logic nghiệp vụ,     (Phù hợp cho tinh chỉnh UI,     │
│    State Machine, Parser, Contract)      Animation, Prototype nhanh)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             CHỐT CHẶN CHẤT LƯỢNG NGHIÊM NGẶT (BẮT BUỘC CHO TẤT CẢ)    │
│  - Không Tautology (Không test tự xưng, không fake kết quả)            │
│  - Không Deceptive Fallback (Không dùng ?? 0 che giấu lỗi cảm biến)    │
│  - Đúng Hợp đồng MQTT v1.0.0 (cmd/door là CLOSE, state/door là CLOSED) │
│  - Vượt qua 100% npm run check:all (Doctor, Lint, Prettier, Contract)  │
└────────────────────────────────────────────────────────────────────────┘
```

Mỗi thành viên khi phụ trách module (đặc biệt là Member 4 trên nhánh `feat/ui-dashboard`) có thể linh hoạt:
- **Áp dụng TDD (Test-Driven Development)** khi xây dựng các tầng tính toán, xử lý gói tin MQTT, chuyển đổi trạng thái cửa/đèn, bộ lọc nhật ký sự kiện hoặc cơ chế rollback khi timeout.
- **Áp dụng Code-First/Prototype-First** khi dựng layout giao diện, căn chỉnh animation Mặt trời / Mặt trăng, style Figma.
- **NHƯNG:** Trước khi tạo Pull Request hoặc hoàn tất task, toàn bộ logic nghiệp vụ phải được bọc trong các bộ test thực chất, phản ánh đúng hành vi vận hành của hệ thống IoT.

---

## 2. Chu Trình 5 Chốt Chặn Quyết Định (5 Decision Gates) Khi Áp Dụng TDD

Nếu thành viên lựa chọn tiếp cận theo TDD, chu trình chuẩn gồm 5 Gates:

```text
[BƯỚC 1: ĐẶC TẢ] ──> 🛑 GATE 1: Duyệt Micro-Plan (< 60 dòng)
      │
[BƯỚC 2: VIẾT TEST] ─> 🛑 GATE 2: Xác nhận Test ĐỎ hợp lệ (Red Test)
      │
[BƯỚC 3: MÃ NGUỒN] ──> Triển khai Minimum Green Code (Code vừa đủ xanh)
      │
[BƯỚC 4: RÀ SOÁT] ──> 🛑 GATE 3: Soi Diff chống 4 bẫy kiểm thử
      │
[BƯỚC 5: NGHIỆM THU] ─> 🛑 GATE 4: Nghiệm thu thực chứng (MQTT + State)
      │
[BƯỚC 6: TỰ ĐỘNG] ──> 🛑 GATE 5: Đồng bộ Checkpoint & Guard tự động
```

---

### 🛑 GATE 1: Duyệt Kế Hoạch Vi Mô (1-Page Micro-Plan)
* **Mục tiêu:** Định hình chính xác phạm vi thay đổi trước khi gõ phím. Tránh lan man sang các module khác của firmware hoặc broker.
* **Quy chuẩn Micro-Plan (< 60 dòng):**
  1. **Nghiệp vụ IoT:** Tính năng điều khiển đèn, cảm biến nhiệt ẩm, khóa cửa RFID, hay bộ lọc sự kiện?
  2. **MQTT Contract Scope:** Tác động đến topic nào (`smarthome/cmd/*`, `smarthome/state/*`, `smarthome/event/*`)?
  3. **Tập tin tác động (Impacted Files):** Tối đa 3–5 file (Headless Service, Hook, Thin UI, Test file).
  4. **Kịch bản Test đối kháng:** Ca test biên (Edge case), ca lỗi mạng, ca nhận gói tin rác.
* **Quyết định Gatekeeper:** Duyệt nếu kế hoạch ngắn gọn, bám sát `docs/mqtt-contract.json`. Từ chối nếu viết kế hoạch chung chung không gắn với thiết bị IoT.

---

### 🛑 GATE 2: Xác Nhận Test ĐỎ Hợp Lệ (Red Test Verification)
* **Mục tiêu:** Đảm bảo test được chạy và **thất bại đúng lý do nghiệp vụ** (thiếu logic xử lý) chứ không phải thất bại do lỗi cú pháp (SyntaxError, ImportNotFound).
* **Quy tắc bất biến:**
  - Viết test mô tả hành vi mong đợi: ví dụ *"gửi lệnh đóng cửa phải phát ra topic smarthome/cmd/door với payload 'CLOSE'"*.
  - Chạy `npm test` trong `mobile_app` $\rightarrow$ Test **BẮT BUỘC PHẢI THẤT BẠI (FAIL/RED)**.
  - Log terminal phải chỉ rõ assertion không đạt (ví dụ: `expected 'CLOSE' but received undefined`).
* **Cảnh báo gian lận:** Nếu test chạy mà XANH ngay khi chưa viết code nghiệp vụ $\rightarrow$ Bài test vô giá trị (Tautology), lập tức loại bỏ!

---

### 🟢 GIAI ĐOẠN IMPLEMENTATION: Quy Tắc "Minimum Green"
* Chỉ viết lượng code logic vừa đủ để biến các bài test ĐỎ thành **XANH (GREEN)**.
* **Phân tách 3 tầng (Clean 3-Tier Headless):**
  - **Tier 1 (Contracts):** Khai báo topics, hằng số payload (`ON`, `OFF`, `OPEN`, `CLOSE`, `CLOSED`, `DETECTED`, `CLEAR`, `ONLINE`, `OFFLINE`).
  - **Tier 2 (Headless Logic):** Hooks, Mappers, State Machines, MQTT Service thuần JavaScript (100% testable trong Vitest không cần màn hình).
  - **Tier 3 (Thin UI):** Các component React Native (`< 200 dòng`), chỉ nhận ViewModel và gọi hàm hành động, tuyệt đối không chứa logic parse MQTT hay math phức tạp.

---

### 🛑 GATE 3: Soi Diff 60 Giây — Kiểm Tra Tự Thân (Self-Audit)
Trước khi commit, thành viên phải tự soi lại git diff dựa trên **IoT Sanity Checklist**:

- [ ] **1. No Tautology:** Test có assert trên hàm sản xuất thật không? Có assert trên biến giả tự khai báo không?
- [ ] **2. MQTT Contract Compliance:** Lệnh đóng cửa có đúng là `"CLOSE"` không? Trạng thái đóng có đúng là `"CLOSED"` không? Có bị nhầm lẫn giữa hai chữ này không?
- [ ] **3. No Deceptive Fallback:** Cảm biến mất kết nối có bị ép về `?? 0` hoặc `?? ""` để che giấu lỗi không? Cảm biến hỏng phải báo `DISCONNECTED` / `null` / `ERROR`.
- [ ] **4. Optimistic Rollback:** Thao tác bật/tắt thiết bị có cơ chế rollback về trạng thái cũ nếu sau timeout (ví dụ 5s) board ESP32 không phản hồi không?
- [ ] **5. Thin UI Compliance:** File UI có bị phình to (> 200 dòng) hay nhét mã kết nối MQTT trực tiếp vào component không?
- [ ] **6. Quality Suite Passed:** Đã chạy `npm run check:all` đạt 100% xanh chưa?

---

### 🛑 GATE 4: Nghiệm Thu Thực Chứng (IoT Trinity Evidence)
Nghiệm thu không dựa trên việc "giao diện trông đẹp" mà phải dựa trên **Bộ Ba Bằng Chứng Thực Chứng**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   BỘ BA BẰNG CHỨNG THỰC CHỨNG (TRINITY)                │
│                                                                        │
│  1. MQTT Wire Evidence:                                                │
│     - Log tin nhắn trên broker (MQTTX hoặc Mosquitto log):             │
│       Thấy rõ topic và payload được gửi đi/nhận về đúng định dạng.     │
│                                                                        │
│  2. Hardware / Firmware State Evidence:                                │
│     - Trạng thái ESP32 (Relay bật/tắt, Servo quay, LED phản hồi).      │
│     - Board gửi gói tin `smarthome/state/*` tương ứng với Retain=true. │
│                                                                        │
│  3. UI Synchronization Evidence:                                       │
│     - UI cập nhật đúng từ topic `state`, không phụ thuộc vào việc tự    │
│       suy đoán trạng thái khi chỉ vừa gửi `cmd`.                       │
│     - Khi ngắt nguồn ESP32, Last Will gửi `OFFLINE` $\rightarrow$ UI   │
│       chuyển ngay sang cảnh báo thiết bị ngoại tuyến.                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 🛑 GATE 5: Đồng Bộ Tri Thức & Khóa Guard Tự Động
* Cập nhật tiến độ vào file theo dõi dự án (`checkpoint.md` hoặc Task Tracker).
* Nếu phát hiện lỗi mới (ví dụ: payload cảm biến trả về chuỗi thay vì số, hoặc mã thẻ RFID có khoảng trắng): Lập tức bổ sung case kiểm thử vào [contract.test.js](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/src/__tests__/contract.test.js) hoặc [scripts/validate-contract.js](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/mobile_app/scripts/validate-contract.js) để biến nó thành chốt chặn tự động bảo vệ toàn bộ các lần phát triển sau.

