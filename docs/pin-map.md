# Bản thảo pin map + dự toán nguồn

## 1. Bảng phân bổ chân

| Thiết bị | Chân | Trạng thái | Ghi chú |
|---|---|---|---|
| Servo SG90 (cửa) | IO2 | Đang dùng (code) | Strapping pin: servo không kéo chân lúc reset nên an toàn; cắm sau khi flash |
| PIR HC-SR501/RCWL-0516 | IO39 | Đang dùng (code) | Input-only, đọc digital, không cần trở |
| Relay 5V (tín hiệu IN) | Đề xuất IO5 (dự phòng IO4) | Cần kiểm tra header | Đa số module opto active-LOW — thử trước khi coi là lỗi firmware |
| Module LED | Đề xuất IO4 (dự phòng IO32/33) | Cần kiểm tra header | Qua trở phù hợp |
| RFID MFRC522 | SPI + RST — xem mục 3 | **Rủi ro số 1** | Cần chân SPI khác mặc định vì ETH chiếm VSPI |

## 2. Chân đã bị chiếm trên WT32-ETH01

| Nhóm | Chân | Lý do |
|---|---|---|
| Ethernet LAN8720 (RMII) | IO19, IO21, IO22, IO25, IO26, IO27 | Cố định bởi EMAC, không di chuyển được |
| Ethernet (quản lý PHY) | IO18 (MDIO), IO23 (MDC) | Cố định |
| Ethernet (clock + nguồn PHY) | IO0 (clock vào), IO16 | Oscillator 50MHz ngoài đưa vào IO0 |
| UART0 — flash/debug | IO1 (TX0), IO3 (RX0) | Board không có USB, flash qua adapter USB-TTL |
| Flash nội bộ | IO6–IO11 | Không bao giờ dùng |
| Input-only | IO34, IO35, IO36, IO39 | Chỉ đọc được, không pull-up nội bộ (34/35) |
| Strapping — thận trọng | IO0, IO2, IO12, IO15 | Tránh IO12 cho ngoại vi kéo HIGH lúc reset |

Kho chân ứng viên cho relay/LED/SPI: IO4, IO5, IO12, IO13, IO14, IO15, IO17, IO32, IO33 (+ IO34/35/36 chỉ đọc). **Chân nào thật sự có trên header — chụp ảnh board và điền lại bảng mục 1.**

## 3. Rủi ro số 1 — SPI cho RFID

- SPI mặc định (VSPI: SCK=IO18, MISO=IO19, MOSI=IO23) **trùng chân Ethernet** — không dùng được.
- Phương án A: HSPI (SCK=IO14, MISO=IO12, MOSI=IO13, SS=IO15, RST=IO32/33) — nếu header có đủ.
- Phương án B: định tuyến SPI sang chân khác qua GPIO matrix (thư viện MFRC522 hỗ trợ khai báo chân riêng) — MFRC522 chạy clock thấp nên chấp nhận được.
- Phương án C nếu cả hai bế tắc: đổi module PN532 (I2C, chân 32/33) hoặc dồn RFID sang board DevKit dự phòng.
- Kết luận: kiểm tra header ngay khi có board, chọn phương án trước khi mua/đi dây.

## 4. Dự toán nguồn

| Nhánh | Rail | Idle | Đỉnh | Ghi chú |
|---|---|---|---|---|
| WT32-ETH01 | 5V → 3V3 (LDO) | ~80 mA | ~300 mA | Wi-Fi phát + LAN8720 |
| Servo SG90 | **5V riêng** | ~10 mA | ≥650 mA | Kẹt cơ kéo dòng đỉnh — không lấy từ 5V/3V3 board |
| Relay 5V 1 kênh | 5V | 0 | ~80 mA | Cuộn coil + LED báo |
| Module LED | 5V | 0 | ~20 mA | Qua trở |
| MFRC522 | **3V3 từ board** | ~13 mA | ~30 mA | Chỉ 3.3V — không bao giờ 5V |
| PIR | 5V | <1 mA | <1 mA | Module có regulator riêng |
| **Tổng rail 5V** | | ~100 mA | **~1.1 A** | LM2596 ≥2A |

Quy tắc đi nguồn:

1. Adapter 12V → LM2596 chỉnh **đúng 5.0V đo bằng đồng hồ trước khi cắm bất cứ thứ gì** → rail 5V: board (chân 5V), servo, relay, LED.
2. MFRC522 lấy 3V3 từ board; PIR có thể lấy 5V (module tự hạ).
3. Common ground: buck, board, servo, relay nối đất chung.
4. Tụ 470–1000µF trên rail 5V cạnh servo — chống sụt áp lúc kẹt cơ gây reset board (đúng kiểu lỗi khó truy vết nêu trong kế hoạch).
5. Servo không dùng chung dây nguồn với board; mỗi nhánh dài dùng dây đủ tiết diện.

## 5. Checklist khi có board (~15 phút, quyết định luôn)

1. Chụp ảnh hai hàng header, đối chiếu chữ trên board → điền lại bảng mục 1, chọn phương án SPI (mục 3).
2. Đo điện áp buck: chỉnh 5.0V khi chưa tải.
3. Thử relay: kích IN qua trở, xác nhận active-LOW hay active-HIGH.
4. Flash một firmware rỗng qua USB-TTL để chốt quy trình (IO0 xuống GND khi reset để vào flash mode — xác nhận trên board thật).
5. Chạy thử MFRC522 đọc số hiệu phiên bản để xác nhận bus SPI đã chọn.

Sau checklist: chốt bảng chân, cập nhật `src/config.h`/device .cpp theo đúng bảng, mới bắt đầu Giai đoạn 4.

## 6. Liên kết

- Giai đoạn 4 trong [plan-member3.md](plan-member3.md): mục 1–2 của đó chính là tài liệu này.
- DoD cuối: chạy 30 phút không reset/không chảy dây, mở cửa/bật đèn lặp lại được.
