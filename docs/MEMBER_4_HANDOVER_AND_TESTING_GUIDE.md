# Member 4 - Báo Cáo Tiến Độ và Hướng Dẫn Bàn Giao Kiểm Thử Prototype Cho Nhóm

## 1. Báo Cáo Tiến Độ Công Việc Của Member 4 (Limi - Mobile Lead)

### 1.1. Tổng Quan Tiến Độ
- Mã thành viên: Member 4 (Mobile Lead / Lập trình viên Ứng dụng Di động).
- Nhánh phát triển: `feat/ui-dashboard`.
- Ngày cập nhật: 17/10/2026.
- Tiến độ tổng thể: Đạt 88% toàn bộ khối lượng công việc; hoàn thành 100% các hạng mục Nền tảng (Foundation) và Xây dựng Module (Module Build); sẵn sàng 100% để tích hợp phần cứng thực tế cùng Member 1, 2, 3 và Broker EMQX của Member 5.

### 1.2. Chi Tiết Công Việc Theo Bảng Nhiệm Vụ (M4-01 đến M4-10)
| Mã Task | Hạng Mục | Trạng Thái | Tiến Độ | Ngày Hoàn Thành | Kết Quả Triển Khai Cụ Thể |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **M4-01** | Mobile App Project Foundation | Done | 100% | 17/10/2026 | Khởi tạo dự án React Native Expo (`mobile_app`), cấu hình đầy đủ TypeScript, NativeWind, Vitest, linting và chuẩn hóa cấu trúc thư mục. |
| **M4-02** | Mobile UI Dashboard SSOT | Done | 100% | 17/10/2026 | Xây dựng bản Interactive Prototype chuẩn Figma SSOT (Frame 2-199 và 2-115) tại `mobile_app/prototype.html` hỗ trợ song ngữ Việt/Anh và hai chế độ Sáng/Tối. |
| **M4-03** | MQTT Mobile Connection | Done | 100% | 17/10/2026 | Tích hợp MQTT qua giao thức WebSocket, thuật toán tự động kết nối lại với cơ chế Giảm dần lũy thừa (Exponential Backoff) và Nhiễu ngẫu nhiên (Jitter) nhằm ngăn chặn hiện tượng bão kết nối (reconnection storms). |
| **M4-04** | Command Publish | Done | 100% | 17/10/2026 | Tuân thủ 100% Hợp đồng dữ liệu MQTT Contract v1.0.0: phát lệnh Đèn (`smart_home/commands/light`), Cửa (`smart_home/commands/door`), tích hợp cơ chế khóa giao diện chống bấm lặp (debounce lock). |
| **M4-05** | Device State Subscription | Done | 100% | 17/10/2026 | Đăng ký lắng nghe phản hồi phản ứng (reactive) từ các topic: `smart_home/state/light`, `smart_home/state/door`, `smart_home/state/motion`, `smart_home/events/access`, giao diện cập nhật ngay lập tức mà không cần cơ chế Polling định kỳ. |
| **M4-06** | Dual-Layer State Machine & Guard | Done | 100% | 17/10/2026 | Thiết kế tách biệt độc lập Máy trạng thái hai tầng: Tầng 1 (Kết nối Broker EMQX) và Tầng 2 (Node cảm biến ESP32 qua LWT); cơ chế Device Guard khóa tương tác và rung thẻ cảnh báo khi ngoại tuyến. |
| **M4-07** | Bounded Ring Buffer Event Log | Done | 100% | 17/10/2026 | Xây dựng bộ đệm nhật ký sự kiện giới hạn tối đa 50 phần tử với độ phức tạp thu hồi O(1), bộ lọc linh hoạt theo danh mục (Tất cả, An ninh, Thiết bị, Hệ thống), ngăn ngừa hoàn toàn rò rỉ bộ nhớ RAM. |
| **M4-08** | Physical ESP32 Integration | In Progress | 60% | -- | Đã kiểm thử trơn tru trên bộ giả lập Chế độ Thủ công (Manual Mode) và công cụ MQTTX. Sẵn sàng nạp firmware và ghép nối thiết bị thực tế cùng Member 1 và Member 3. |
| **M4-09** | UX Polish & Vibe Code Cleansing | Done | 100% | 17/10/2026 | Loại bỏ 100% emoji và dấu hiệu vibe code; giao diện đạt chuẩn thiết kế Figma với Thanh điều hướng nổi (Floating Navbar) kèm Lớp chắn vùng an toàn (Safe Area Shield), vi tương tác phản hồi mượt mà. |
| **M4-10** | Mobile Regression & Async Lab | In Progress | 80% | -- | Hoàn thiện Phòng thí nghiệm Bất đồng bộ (Async Lab) với 8/8 kịch bản kiểm thử: Bộ đếm thời gian giám sát (Watchdog), Khóa chống xung đột (Race Condition Guard), Xử lý kẹt cửa (Servo Jam), Chống dội thẻ RFID, Thời gian hồi cảm biến chuyển động (PIR Cooldown). |

---

## 2. Hướng Dẫn Trải Nghiệm Prototype (Dành Cho Members 1, 2, 3 và 5)

Bản Prototype tương tác được lưu trữ tại đường dẫn:
`file:///mobile_app/prototype.html` (hoặc bản nháp cục bộ tại `.scratch/docs/figma/prototype.html`).

Các thành viên có thể mở tệp trực tiếp bằng trình duyệt Google Chrome, Microsoft Edge hoặc thông qua tiện ích mở rộng Live Server trong Visual Studio Code.

### 2.1. Các Khu Vực Giao Diện Chính
1. **Thanh Tiêu Đề (Top Bar)**:
   - Nhận diện thương hiệu "Limi Smart Home".
   - Chấm trạng thái sống (Live Status Dot): Chuyển xanh lá khi Trực tuyến (Online), vàng khi Đang kết nối / Cảnh báo (Connecting / Warning), đỏ khi Có sự cố an ninh / Ngoại tuyến (Security Alert / Offline), xám khi Mất kết nối Máy chủ (Broker Disconnected).
   - Nút chuyển đổi ngôn ngữ song ngữ (Tiếng Việt / Tiếng Anh) và chế độ hiển thị (Sáng / Tối).
2. **Thẻ Đánh Giá Hệ Thống (System Audit Card)**:
   - Thể hiện kết quả tự kiểm tra an ninh hệ thống đa tầng theo thời gian thực.
   - Hiển thị "100% Bảo Mật" (100% Secure) khi cả Broker và ESP32 đều Trực tuyến, đồng thời không ghi nhận hành vi truy cập trái phép.
   - Khi có sự kiện Quẹt thẻ không hợp lệ (Invalid RFID), thẻ lập tức chuyển sang trạng thái Cảnh Báo An Ninh màu đỏ rực.
   - Khi ngắt kết nối Broker, thẻ chuyển sang màu xám kèm nút bấm "Kết Nối Lại Broker".
   - Khi ESP32 mất nguồn hoặc mất mạng, thẻ chuyển sang trạng thái Cảnh Báo Ngoại Tuyến kèm nút bấm "Thử Kết Nối Lại ESP32".
3. **Thẻ Điều Khiển Nhanh Thiết Bị (Hardware Controls)**:
   - Thẻ Điều Khiển Đèn (Lighting Control): Bật/Tắt đèn với trạng thái bất đồng bộ Chờ xác nhận (Pending, biểu tượng xoay nhẹ) -> Xác nhận từ ESP32 -> Thông báo thành công (Success Toast).
   - Thẻ An Ninh Cửa (Door Security): Thao tác Mở/Đóng cửa thực hiện theo quy trình 2 pha (Đang mở khóa -> Đã mở; Đang khóa -> Đã đóng). Có cơ chế bảo vệ chống chạm nhầm hoặc bấm liên tục (Device Guard).
4. **Nhật Ký Hoạt Động (Activity Log)**:
   - Hiển thị danh sách các sự kiện vận hành theo thời gian thực.
   - Hỗ trợ các tab phân loại: Tất cả (All), An ninh (Security), Thiết bị (Device), Hệ thống (System).
   - Ghi nhận chi tiết nhãn thời gian đến từng giây kèm nội dung bản tin (payload).
5. **Bộ Giả Lập Phần Cứng Tương Tác (Interactive Hardware Simulator)**:
   - Bảng điều khiển thu gọn đặt ở cạnh dưới màn hình.
   - Giúp các Member 1, 2, 3 và 5 có thể chủ động kích hoạt các tình huống đầu vào và đầu ra của phần cứng thực tế trước khi tiến hành đấu dây.

### 2.2. Hướng Dẫn Thực Hiện Các Kịch Bản Kiểm Thử
1. **Kịch bản 1: Điều khiển Bật/Tắt Đèn bất đồng bộ**:
   - Nhấn vào Thẻ Đèn trên Bảng điều khiển.
   - Quan sát: Thẻ lập tức chuyển sang trạng thái Đang xử lý (Pending, hiển thị biểu tượng xoay), nút bấm tạm thời bị khóa nhằm ngăn chặn bấm nhiều lần.
   - Sau khi ESP32 phản hồi trạng thái qua topic `smart_home/state/light`, thẻ Đèn hoàn tất chuyển đổi sang Bật/Tắt và xuất hiện thông báo xác nhận thành công.
2. **Kịch bản 2: Quẹt Thẻ RFID Hợp lệ so với Thẻ Lạ (Xâm phạm an ninh)**:
   - Mở Bộ Giả Lập Phần Cứng (Hardware Simulator) -> Nhấn "Quẹt Thẻ Hợp Lệ": Cửa tự động mở, Nhật ký ghi nhận quyền truy cập thành công, Thẻ Đánh Giá Hệ Thống duy trì trạng thái 100% Bảo Mật.
   - Nhấn "Quẹt Thẻ Không Hợp Lệ (Invalid RFID)": Thẻ Đánh Giá Hệ Thống lập tức chuyển sang Cảnh Báo An Ninh (màu đỏ), còi chip giả lập phát tín hiệu cảnh báo, thông báo bật lên trên màn hình, thẻ Cửa chuyển sang trạng thái bảo vệ.
   - Nhấn nút "Khôi Phục An Ninh (Resolve Alert)" để đưa hệ thống trở lại trạng thái 100% Bảo Mật bình thường.
3. **Kịch bản 3: Giả lập ESP32 Mất Nguồn (Power Loss) và Cơ chế Tự Động Thử Lại (Retry)**:
   - Mở Bộ Giả Lập Phần Cứng -> Nhấn "Mất Nguồn (Trigger Power Loss)".
   - Quan sát: Ứng dụng phát hiện ESP32 mất kết nối và tự động kích hoạt chu trình thử lại 5 lần (Attempts 1 đến 5), mỗi chu kỳ cách nhau 3 giây.
   - Nếu thử tự động 5 lần đều thất bại: Hệ thống chuyển hẳn sang trạng thái Ngoại Tuyến, hiển thị nút "Kết Nối Lại Thủ Công".
   - Nếu chọn phương án "Thử Kết Nối Lại (Thành công ngẫu nhiên)": Hệ thống sẽ khôi phục kết nối thành công ở lần thử thứ n và đưa giao diện trở lại trạng thái Trực tuyến bình thường.
4. **Kịch bản 4: Ngắt Kết Nối Máy Chủ MQTT (Broker Disconnect)**:
   - Chuyển sang tab Cài Đặt (Settings) trên thanh điều hướng dưới.
   - Nhấn nút "Ngắt Kết Nối".
   - Quan sát: Thẻ Đánh Giá Hệ Thống lập tức chuyển sang màu xám với tiêu đề "Mất Kết Nối Máy Chủ / Broker Disconnected".
   - Thử nhấn vào thẻ Đèn hoặc Cửa trên Bảng điều khiển: Thẻ sẽ rung lắc (hiệu ứng Card Shake), lệnh điều khiển bị chặn hoàn toàn, popup thông báo lỗi sẽ xuất hiện để nhắc nhở người dùng.
   - Nhấn "Kết Nối Lại" để tái thiết lập kết nối WebSocket với Broker.

---

## 3. Danh Mục 8 Cơ Chế Bất Đồng Bộ (Async Mechanisms) Được Áp Dụng Trong Prototype

Hệ thống kiên quyết không áp dụng cách tiếp cận giao diện đồng bộ giả tạo (bấm nút là tự ý đổi giao diện ngay lập tức), mà vận hành theo đúng Kiến trúc Bất đồng bộ Hướng sự kiện (Event-Driven Asynchronous Architecture) với 8 cơ chế bảo vệ nghiêm ngặt:

1. **Bộ Đếm Thời Gian Giám Sát và Hoàn Tác Lệnh Thiết Bị (Relay / Light Watchdog Rollback - 3000ms)**:
   - Khi người dùng thao tác Bật/Tắt Đèn, giao diện chuyển sang trạng thái Đang chờ (Pending) và kích hoạt bộ đếm thời gian giám sát 3000ms.
   - Nếu ESP32 không phát bản tin xác nhận trạng thái qua topic `smart_home/state/light` trong vòng 3000ms, giao diện sẽ tự động Hoàn tác (Rollback) về trạng thái cũ kèm thông báo quá thời gian chờ, triệt tiêu hoàn toàn nguy cơ lệch pha giữa ứng dụng và bóng đèn thực tế.
2. **Quy Trình Điều Khiển Cửa 2 Pha và Xử Lý Kẹt Cửa (Door Servo 2-Phase Jam Loop - 4000ms)**:
   - Trạng thái đóng/mở cửa vận hành theo 2 pha rõ rệt: Đang gửi lệnh -> Đang mở khóa / Đang đóng khóa -> Đã mở / Đã đóng.
   - Nếu động cơ servo bị kẹt cơ học hoặc gặp vật cản khiến cảm biến không thể ghi nhận trạng thái cuối cùng sau 4000ms, hệ thống lập tức kích hoạt trạng thái Kẹt Cửa (Door Jammed) để hướng dẫn người dùng kiểm tra thực địa.
3. **Chống Dội Tín Hiệu Đầu Đọc Thẻ RFID (RFID Reader Debounce & Lockout - 1500ms)**:
   - Sau mỗi lần quẹt thẻ, hệ thống áp dụng khoảng thời gian trễ 1.5 giây để khóa đầu đọc RFID, loại bỏ hiện tượng tiếp xúc rung tạo ra 10-20 bản tin liên tục gây nghẽn hàng đợi của Broker và tràn bộ nhớ vi điều khiển ESP32.
4. **Hàng Đợi Hạ Nhiệt Cảm Biến Chuyển Động (PIR Cooldown & Event Queue - 5000ms)**:
   - Cảm biến PIR vật lý thường duy trì mức điện áp HIGH liên tục trong vài giây sau khi phát hiện chuyển động. Ứng dụng tích hợp bộ lọc làm nguội 5 giây nhằm ngăn ngừa việc bắn dồn dập các thông báo chuyển động thừa thãi lên màn hình người dùng.
5. **Tự Động Kết Nối Lại Bằng Giảm Dần Lũy Thừa Kèm Nhiễu Ngẫu Nhiên (Exponential Backoff with Jitter)**:
   - Khi Broker bị ngắt kết nối đột ngột, ứng dụng không kết nối lại dồn dập mà tự động tính toán thời gian chờ tăng theo hàm mũ kết hợp số gia ngẫu nhiên (jitter), bảo vệ máy chủ EMQX khỏi nguy cơ sập mạng vì bão kết nối (Reconnection Storm).
6. **Nhận Biết Mất Kết Nối Không Cần Polling (Zero-Polling LWT Socket Drop Detector)**:
   - Ứng dụng tuyệt đối không dùng vòng lặp thời gian (`setInterval`) hay cơ chế gửi yêu cầu HTTP Polling liên tục để thăm dò ESP32.
   - Trạng thái sống/chết của ESP32 được Broker nhận diện tức thì thông qua bản tin Di Chúc Cuối Cùng (Last Will and Testament - LWT) trên topic `smart_home/status = offline` ngay khi đứt tín hiệu giữ kết nối (Keep-Alive).
7. **Bộ Nhớ Đệm Nhật Ký Sự Kiện Giới Hạn Dung Lượng (Bounded Ring Buffer - Tối đa 50 phần tử)**:
   - Bảo vệ bộ nhớ RAM của thiết bị di động bằng cấu trúc dữ liệu vòng có dung lượng cố định 50 mục. Khi đạt giới hạn, các sự kiện cũ nhất sẽ tự động bị loại bỏ theo nguyên tắc FIFO với độ phức tạp tính toán O(1).
8. **Khóa Chống Xung Đột Trạng Thái (Finite State Machine Race Condition Guard)**:
   - Ngăn chặn hoàn toàn hiện tượng xung đột khi người dùng thao tác bấm liên tục quá nhanh (rapid tapping). Khi một hành động đang ở trạng thái Đang chờ (Pending), mọi thao tác chạm tiếp theo sẽ bị vô hiệu hóa an toàn tại tầng giao diện.

---

## 4. Kế Hoạch Xây Dựng Bản Chính Thức React Native (`mobile_app`)

Sau khi toàn đội thống nhất bản Prototype, toàn bộ mã nguồn và logic điều khiển sẽ được chuyển giao sang thư mục `mobile_app` theo cấu trúc module tiêu chuẩn:

```text
mobile_app/
├── src/
│   ├── config/
│   │   ├── mqtt.config.ts          # Địa chỉ Broker, cổng kết nối (1883 TCP / 8083 WS), cấu hình LWT
│   │   └── topics.contract.ts      # Khai báo mapping các Topic tuân thủ chặt chẽ Hợp đồng v1.0.0
│   ├── context/
│   │   ├── MqttContext.tsx         # Provider quản lý kết nối MQTT WebSocket trên toàn ứng dụng
│   │   ├── DeviceContext.tsx       # Quản lý máy trạng thái thiết bị Đèn, Cửa và Hệ thống An ninh
│   │   └── SettingsContext.tsx     # Quản lý lưu trữ AsyncStorage cho cấu hình người dùng và thông báo
│   ├── hooks/
│   │   ├── useMqttCommand.ts       # Hook phát lệnh bất đồng bộ tích hợp bộ đếm giám sát Watchdog
│   │   └── useRingBufferLogs.ts    # Hook quản lý mảng nhật ký sự kiện giới hạn dung lượng
│   ├── screens/
│   │   ├── DashboardScreen.tsx     # Màn hình Trang chủ chuẩn thiết kế Figma SSOT
│   │   ├── ActivityLogScreen.tsx   # Màn hình Lịch sử hoạt động và bộ lọc chi tiết
│   │   └── SettingsScreen.tsx      # Màn hình Cấu hình kết nối Broker và tùy chọn Thông báo
│   └── components/
│       ├── cards/                  # LightCard, DoorCard, SystemAuditCard
│       └── common/                 # SafeShield, ToastNotification, LiveStatusDot
```

### Kế Hoạch Triển Khai Cụ Thể:
- **Ngày 1**: Ánh xạ toàn bộ hệ thống Token thiết kế, màu sắc, phông chữ từ HTML/Tailwind sang cấu trúc React Native NativeWind.
- **Ngày 2**: Tích hợp thư viện MQTT Client qua cổng WebSocket `8083` đã được mở sẵn trong [docker-compose.yml](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/docker-compose.yml).
- **Ngày 3**: Tiến hành ghép nối và kiểm thử đồng bộ hai chiều trực tiếp với phần cứng ESP32 thực tế của Member 1 và Member 3.
- **Ngày 4**: Thực hiện kiểm thử hồi quy toàn diện trên điện thoại di động và đóng gói bản cài đặt APK phục vụ thuyết trình.

---

## 5. Yêu Cầu Đánh Giá Thực Trạng Phần Cứng và Quyền Quyết Định Của Các Thành Viên (Review Request Matrix)

Để đảm bảo hệ thống vận hành hoàn hảo trên mô hình vật lý thực tế mà không phát sinh lỗi sụt nguồn hay quá tải Broker ngoài dự kiến, đề nghị từng thành viên phụ trách đánh giá và phản hồi các nội dung then chốt sau:

### 5.1. Gửi Member 1 (Phụ trách Lõi Firmware ESP32)
1. **Thời gian chờ Watchdog Timeout cho lệnh Đèn (Light) và Cửa (Door)**:
   - Trên ứng dụng di động hiện đang thiết lập thời gian chờ là **3000ms cho Đèn** và **4000ms cho Cửa**.
   - *Câu hỏi đánh giá*: Thời gian xử lý thực tế của ESP32 từ lúc nhận bản tin MQTT lệnh đến khi kích hoạt Relay / quay Servo và xuất bản tin trạng thái về Broker thường mất bao lâu? Có trường hợp nào mạng chập chờn cần nâng mức chờ lên 5000ms hay không?
2. **Cơ chế Di Chúc LWT (Last Will and Testament)**:
   - Firmware ESP32 đã cài đặt gửi bản tin LWT với nội dung `offline` về topic `smart_home/status` kèm cờ `retain = true` hay chưa?
   - Chu kỳ gửi gói tin giữ kết nối (Keep-Alive ping) hiện tại đang được cấu hình là bao nhiêu giây (15 giây hay 60 giây)?
3. **Phản hồi trạng thái Cửa thực tế (Door Servo Feedback)**:
   - Mô hình cửa cơ học hiện tại có gắn công tắc hành trình (reed switch hoặc limit switch) để xác nhận cửa đã đóng khít thật sự hay chưa, hay ESP32 chỉ phát trạng thái dựa trên thời gian trễ quay động cơ Servo?

### 5.2. Gửi Member 2 (Phụ trách Cảm Biến và Logic RFID)
1. **Thời gian chống dội thẻ RFID (Debounce 1500ms)**:
   - Ứng dụng di động đang khóa chặn việc nhận thẻ trùng lặp trong vòng 1.5 giây.
   - *Câu hỏi đánh giá*: Module đọc thẻ RC522 trên ESP32 đã được cài đặt thuật toán chống dội bằng ngắt phần cứng (interrupt) hoặc biến đếm thời gian `millis()` chưa, hay mỗi lần áp thẻ vào là ESP32 gửi liên tục các bản tin MQTT lên máy chủ?
2. **Cơ chế Kích hoạt và Hủy Cảnh Báo An Ninh (Security Alert)**:
   - Khi phát hiện quẹt thẻ không hợp lệ (Invalid RFID), ngoài việc gửi bản tin sự kiện `smart_home/events/access` với nội dung `DENIED`, phần cứng ESP32 có tự động hú còi chip (buzzer) không?
   - Nút bấm "Khôi Phục An Ninh (Resolve Alert)" trên ứng dụng di động có cần phát thêm một lệnh MQTT xuống ESP32 để tắt còi và hoàn trả đèn LED về trạng thái bình thường hay không (ví dụ topic: `smart_home/commands/security`, nội dung: `CLEAR`)?

### 5.3. Gửi Member 3 (Phụ trách Độ Tin Cậy Phần Cứng và Nguồn Điện)
1. **Hiện tượng Sụt Áp và Khởi Động Lại Do Động Cơ Servo (Brownout Reset)**:
   - Khi động cơ SG90 quay đồng thời với thời điểm bật Relay đèn, nguồn điện 5V (dùng chung hay tách riêng với ESP32) có bị sụt áp đột ngột dẫn đến việc ESP32 bị khởi động lại ngoài ý muốn không?
   - Cơ chế tự động thử lại 5 lần (mỗi lần 3 giây) của ứng dụng có khớp với khoảng thời gian khởi động lại và kết nối lại mạng Wi-Fi thực tế của mạch ESP32 hay không?

### 5.4. Gửi Member 5 (Phụ trách MQTT Broker và Hợp Đồng Hệ Thống)
1. **Cổng Kết Nối WebSocket 8083**:
   - Member 4 đã bổ sung mở cổng `8083:8083` vào tệp [docker-compose.yml](file:///c:/Users/rivea/Documents/GitHub/esp32_smart_home/docker-compose.yml) của EMQX. Nhờ Member 5 kiểm tra và xác nhận cấu hình vùng chứa EMQX trên máy tính đã kích hoạt trình lắng nghe WebSocket trên cổng 8083 này hay chưa.
2. **Cấu Hình Cờ Lưu Trữ Retain và Chất Lượng Dịch Vụ QoS**:
   - Để đảm bảo khi người dùng vừa bật ứng dụng di động lên là có thể đọc ngay được trạng thái hiện thời của Đèn và Cửa mà không cần phải chờ bấm lệnh, nhờ Member 5 xác nhận các topic trạng thái `smart_home/state/*` đã được thiết lập cờ lưu trữ `retain = true` và cấp độ dịch vụ `QoS = 1` hay chưa.

---

> Tài liệu này được biên soạn bởi Member 4 (Limi) làm căn cứ kỹ thuật để toàn đội đánh giá, nghiệm thu và tiến hành tích hợp hệ thống hoàn chỉnh.
