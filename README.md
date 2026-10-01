# ESP32 Smart Home Firmware

Dự án Firmware cho hệ thống nhà thông minh.

## Cài đặt (Setup)
1. Cài đặt **VSCode** và extension **PlatformIO IDE**.
2. Mở thư mục này bằng PlatformIO.
3. Mở file `src/config.cpp` và thay đổi `WIFI_SSID`, `WIFI_PASSWORD` bằng thông tin mạng Wi-Fi của bạn (hoặc mạng hotspot dùng để test).
4. Cắm mạch ESP32 vào máy tính qua cáp USB.
5. Bấm nút **Upload** (biểu tượng mũi tên phải ➔ ở góc dưới bên trái VSCode) để biên dịch và nạp code.
6. Bấm nút **Serial Monitor** (biểu tượng phích cắm 🔌) để xem log kết nối. Chắc chắn rằng baudrate được đặt là `115200`.

## Tính năng đã hoàn thành
- [x] **M1-01**: Cấu trúc project PlatformIO, setup Serial logging.
- [x] **M1-03**: Khởi tạo kết nối Wi-Fi, tự động reconnect (không dùng delay chặn luồng chính quá lâu).
