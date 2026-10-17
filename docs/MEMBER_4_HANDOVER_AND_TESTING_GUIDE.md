# Member 4 - Progress Report and Cross-Team Prototype Review Guide

## 1. Bao Cao Tien Do Cong Viec Member 4 (Limi - Mobile Lead)

### 1.1. Tong Quan Tien Do
- Ma thanh vien: Member 4 (Mobile Lead / App Developer).
- Nhanh phat trien: `feat/ui-dashboard`.
- Ngay cap nhat: 17/10/2026.
- Tien do tong the: 88% cac hang muc Foundation va Module Build; san sang 100% de tich hop phan cung that voi Member 1, 2, 3 va Broker EMQX cua Member 5.

### 1.2. Chi Tiet Cong Viec Theo Task Tracker (M4-01 den M4-10)
| Ma Task | Hang Muc | Trang Thai | Tien Do | Ngay Hoan Thanh | Ket Qua Cu The |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **M4-01** | Mobile App Project Foundation | Done | 100% | 17/10/2026 | Khoi tao du an React Native Expo (`mobile_app`), cau hinh TypeScript, NativeWind, Jest, linting va quy chuan code. |
| **M4-02** | Mobile UI Dashboard SSOT | Done | 100% | 17/10/2026 | Xay dung ban Interactive Prototype chuan Figma SSOT (Frame 2-199 & 2-115) tai `.scratch/docs/figma/prototype.html` ho tro song ngu VI/EN va Dark/Light mode. |
| **M4-03** | MQTT Mobile Connection | Done | 100% | 17/10/2026 | Tich hop MQTT over WebSocket (Client paho/mqttws), co che tu dong ket noi lai voi exponential backoff va jitter de phong chong reconnection storms. |
| **M4-04** | Command Publish | Done | 100% | 17/10/2026 | Tuan thu 100% MQTT Contract v1.0.0: publish lenh Light (`smart_home/commands/light`), Door (`smart_home/commands/door`), co che lock UI chong bam lap. |
| **M4-05** | Device State Subscription | Done | 100% | 17/10/2026 | Lang nghe phan hoi reactive tu cac topic: `smart_home/state/light`, `smart_home/state/door`, `smart_home/state/motion`, `smart_home/events/access`, cap nhat UI khong can polling. |
| **M4-06** | Dual-Layer State Machine & Guard | Done | 100% | 17/10/2026 | Phan tach doc lap Trang thai Ket noi Broker (Layer 1) va Trang thai ESP32 Node (Layer 2); co che Device Guard khoa thao tac va rung the bao loi khi mat ket noi. |
| **M4-07** | Bounded Ring Buffer Event Log | Done | 100% | 17/10/2026 | Bo dem lich su su kien gioi han dung luong 50 logs (O(1) pop), loc theo danh muc (All, Security, Device, System), khong gay ro ri bo nho. |
| **M4-08** | Physical ESP32 Integration | In Progress | 60% | -- | Da tich hop va kiem thu xong tren ban gia lap (Manual Mode) va MQTTX. San sang flash ESP32 that cung Member 1 va Member 3. |
| **M4-09** | UX Polish & Vibe Code Cleansing | Done | 100% | 17/10/2026 | Loai bo 100% emoji va vibe code; UI dat chuan Figma voi Safe Area Shield, micro-interactions, layout responsive. |
| **M4-10** | Mobile Regression & Async Lab | In Progress | 80% | -- | Hoan thien Async Lab voi 8/8 kiem thu bat dong bo: Watchdog, Race Condition Guard, Servo 2-Phase Jam, RFID Debounce, PIR Cooldown. |

---

## 2. Huong Dan Trai Nghiem Prototype (Danh Cho Members 1, 2, 3 va 5)

Ban Prototype tuong tac duoc luu tai file:
`file:///.scratch/docs/figma/prototype.html`

Cac thanh vien co the mo file truc tiep bang trinh duyet Chrome/Edge hoac chay Live Server.

### 2.1. Cac Khu Vuc Giao Dien Chinh
1. **Top Bar**:
   - Header bieu dien thuong hieu "Limi Smart Home".
   - Chip trang thai song (Live Status Dot): Chuyen xanh la khi Online, vang khi Connecting/Warning, do khi Security Alert / Offline, xam khi Broker Disconnected.
   - Nut chuyen doi Ngon ngu (VI / EN) va che do Sang/Toi (Dark / Light).
2. **System Audit Card**:
   - Bieu dien ket qua kiem tra an ninh he thong da tang.
   - Hien thi 100% Secure khi Broker Online, ESP32 Online va khong co canh bao truy cap trai phep.
   - Khi co su kien Invalid Card, the chuyen thanh Canh Bao Do (Security Alert).
   - Khi Broker ngat, the chuyen xam kem nut "Ket Noi Lai Broker".
   - Khi ESP32 mat nguon/offline, the chuyen sang trang thai Ngoai Tuyen kem nut "Thu Ket Noi Lai ESP32".
3. **Hardware Controls (Quick Controls)**:
   - The Den (Lighting Control): Toggle ON/OFF voi trang thai bat dong bo Pending (xoay spinner) -> Confirmed -> Success Toast.
   - The Cua (Door Security): Thao tac Mo/Dong co che bat dong bo 2 pha (Unlocking -> Open, Locking -> Closed). Co che bao ve chong cham nut (Guard).
4. **Activity Log (Lich Su Hoat Dong)**:
   - Hien thi danh sach su kien thoi gian thuc.
   - Bo loc tag: Tat ca (All), An ninh (Security), Thiet bi (Device), He thong (System).
   - Nhan gio phut giay va payload chi tiet.
5. **Interactive Hardware Simulator (Khu Vuc Giup Team Kiem Thu)**:
   - Nằm ở dưới cùng man hinh (co the collapse/expand).
   - Cho phep Member 1, 2, 3, 5 gia lap tat ca cac input/output cua phan cung that truoc khi cam day dien.

### 2.2. Huong Dan Thuc Hien Cac Kich Ban Kiem Thu
1. **Kich ban 1: Dieu khien Den bat dong bo**:
   - Bam vao the Den tren Dashboard.
   - Quan sat: The chuyen sang trang thai Pending (Dang gui lenh...), icon spinner xoay nhe, nut bam bi disable tam thoi.
   - Sau khi ESP32 tra ve state qua topic `smart_home/state/light`, the Den chuyen sang On/Off hoan tat va Popup thong bao xac nhan.
2. **Kich ban 2: The RFID Hop le vs The La (Security Breach)**:
   - Mo Hardware Simulator -> Bam "Quet RFID Hop le": The cua mo ra, Log ghi nhan The hop le, System Audit giu nguyen 100% Secure.
   - Bam "Quet The Khong Hop Le (Invalid RFID)": System Audit lap tuc doi sang Canh Bao An Ninh (Do), coi chip gia lap keu, Popup Canh bao xuat hien, the Cua bi khoa.
   - Bam nut "Khoi Phuc An Ninh (Resolve Alert)" de reset trang thai an ninh ve 100% Secure.
3. **Kich ban 3: Mat Nguon ESP32 (Power Loss) va Tu Dong Retry**:
   - Mo Hardware Simulator -> Bam "Mat Nguon (Trigger Power Loss)".
   - Quan sat: He thong phat hien ESP32 mat ket noi. Dashboard tu dong kich hoat chu trinh 5 lan Retry (Attempts 1 to 5) voi chu ky 3 giay.
   - Neu thu cong tat ca 5 lan that bai: The chuyen sang Offline, xuat hien nut "Ket Noi Lai Thu Cong".
   - Neu chon "Thu Ket Noi Lai (Random Success)": He thong se ket noi lai thanh cong o lan thu n va tra ve trang thai Binh Thuong.
4. **Kich ban 4: Ngat Ket Noi Broker MQTT (Broker Disconnect)**:
   - Vao tab Cai Dat (Settings) tren Bottom Navigation.
   - Bam nut "Ngat Ket Noi".
   - Quan sat: System Audit chuyen sang xam "Mat Ket Noi May Chu / Broker Disconnected".
   - Thu bam vao the Den hoac Cua tren Dashboard: The se rung lac (Card Shake animation), chan lenh khong cho gui, ban popup thong bao loi.
   - Bam "Ket Noi Lai" de tai lap socket MQTT.

---

## 3. Danh Muc 8 Co Che Bat Dong Bo (Async Mechanisms) Trong Prototype

He thong khong su dung cach tiep can UI dong bo (bam nut la doi UI ngay), ma ap dung kien truc Bat dong bo huong su kien (Event-Driven Asynchronous Architecture) voi 8 co che nghiem ngat:

1. **Watchdog Rollback cho Lenh Thiet Bi (Relay / Light Watchdog)**:
   - Khi nguoi dung toggle Den, UI chuyen sang trang thai Pending va khoi dong timer Watchdog 3000ms.
   - Neu ESP32 khong phan hoi qua MQTT state trong 3000ms, UI tu dong Rollback ve trang thai cu va bao loi timeout, ngan chan hien tuong desynchronization giua app va den that.
2. **Co Che Khoa Cua 2 Pha va Xu Ly Ket Cua (Door Servo 2-Phase Jam Loop)**:
   - Cua hoat dong qua 2 giai doan: Sending -> Unlocking/Locking -> Open/Closed.
   - Neu servo bi ket co hoc hoac gap vat can khong the hoan tat hanh trinh sau 4000ms, he thong kich hoat trang thai Ket Cua (Door Jammed), huong dan nguoi dung kiem tra truc tiep.
3. **Chong Doi Nhieu The RFID (RFID Reader Debounce & Lockout - 1500ms)**:
   - Khi quet the, he thong khoa tam thoi dau doc RFID trong 1.5 giay de tranh doc lap the 10-20 lan lien tuc gay nghen mang Broker va tran bo nho ESP32.
4. **Hang Doi Ha Nhiet Cam Bien Chuyen Dong (PIR Cooldown & Queue Filter - 5000ms)**:
   - Cam bien PIR phan cung thuong giu muc HIGH trong vai giay. He thong tren app ap dung filter cooldown 5 giay de tranh ban hang loat event Motion ve Broker.
5. **Tu Dong Ket Noi Lai Bang Exponential Backoff & Jitter**:
   - Khi Broker bi ngat, app khong reconnect dong loat gay ra hien tuong DDOS / Reconnection Storm len Broker, ma tinh toan thoi gian cho tang dan kem do lech ngau nhien (jitter).
6. **Zero-Polling LWT Socket Drop Detector**:
   - App hoan toan khong su dung `setInterval` hay HTTP Polling de hoi trang thai ESP32.
   - Trang thai song con cua ESP32 duoc Broker phat hien thong qua Last Will and Testament (LWT) topic `smart_home/status = offline` ngay khi mat tin hieu Keep-Alive.
7. **Bo Dem Su Kien Bounded Ring Buffer (Gioi Han 50 Logs)**:
   - Ngan ngua tran RAM tren thiet bi di dong bang cach gioi han bo nho dem su kien o muc 50 phan tu, tu dong loai bo phan tu cu nhat khi vuot nguong voi do phuc tap O(1).
8. **Finite State Machine Race Condition Guard**:
   - Ngan chan xung dot khi nhieu nguoi dung cung bam dieu khien hoac khi nguoi dung bam lien tiep (rapid tapping). Khi mot lenh dang o trang thai Pending, moi thao tac toggle tiep theo bi chan tai tang UI.

---

## 4. Ke Hoach Xay Dung Chinh Thuc React Native (`mobile_app`)

Sau khi team thong nhat ban Prototype, ma nguon se duoc chuyen giao truc tiep sang thu muc `mobile_app` theo kien truc:

```text
mobile_app/
├── src/
│   ├── config/
│   │   ├── mqtt.config.ts          # Broker host, ports (1883 TCP / 8083 WS), LWT configs
│   │   └── topics.contract.ts      # Topic mapping tuan thu Contract v1.0.0
│   ├── context/
│   │   ├── MqttContext.tsx         # WebSocket MQTT provider quan ly ket noi toan cuc
│   │   ├── DeviceContext.tsx       # State machine quan ly Den, Cua, An ninh
│   │   └── SettingsContext.tsx     # Luu tru AsyncStorage cho cac tuy chon thong bao
│   ├── hooks/
│   │   ├── useMqttCommand.ts       # Hook gui lenh bat dong bo voi Watchdog timeout
│   │   └── useRingBufferLogs.ts    # Hook quan ly mang lich su su kien bounded
│   ├── screens/
│   │   ├── DashboardScreen.tsx     # Man hinh Home chuan Figma SSOT
│   │   ├── ActivityLogScreen.tsx   # Man hinh Lich su chi tiet
│   │   └── SettingsScreen.tsx      # Man hinh Cau hinh Broker va Thong bao
│   └── components/
│       ├── cards/                  # LightCard, DoorCard, SystemAuditCard
│       └── common/                 # SafeShield, ToastNotification, LiveStatusDot
```

### Ke Hoach Trien Khai:
- **Ngay 1**: Mapping giao dien tu HTML/Tailwind sang React Native NativeWind.
- **Ngay 2**: Ket noi `sp-react-native-mqtt` hoac `paho-mqtt` qua port WebSocket `8083` da duoc mo trong `docker-compose.yml`.
- **Ngay 3**: Tich hop dong bo hai chieu voi ESP32 that cua Member 1 & Member 3.
- **Ngay 4**: Kiem thu hoi quy va dong goi ban build APK cho buoi thuyet trinh.

---

## 5. Yeu Cau Danh Gia Va Quyen Quyet Dinh Cua Cac Thanh Vien (Review Request Matrix)

De dam bao du an hoat dong tron tru tren phan cung that ma khong gap cac loi vat ly hay tai Broker ngoai du tinh, de nghi tung thanh vien danh gia va dua ra y kien:

### 5.1. Gui Member 1 (Firmware Core Lead)
1. **Watchdog Timeout cho Lenh Den (Light) & Cua (Door)**:
   - App dang de Watchdog cho la **3000ms cho Den** va **4000ms cho Cua**.
   - *Cau hoi danh gia*: Thoi gian xu ly cua ESP32 tu khi nhan MQTT lenh den khi keo relay / quay servo va publish state ve co thuong mat bao lau? Co truong hop nao can tang len 5000ms khong?
2. **Co che LWT (Last Will and Testament)**:
   - ESP32 da cau hinh gui payload `offline` ve topic `smart_home/status` voi retain = true chua?
   - Chu ky ping / keep-alive timeout duoc set la bao nhieu giay (15s hay 60s)?
3. **Phan hoi trang thai Cua (Door Servo Feedback)**:
   - Hien tai phan cung co cam bien hanh trinh (reed switch / limit switch) de bao ve trang thai thuc cua Cua khong, hay ESP32 chi publish trang thai sau khi delay quay servo?

### 5.2. Gui Member 2 (Sensor & RFID Logic Lead)
1. **Thoi gian Debounce The RFID (1500ms)**:
   - App dang de debounce chan spam the la 1.5 giay.
   - *Cau hoi danh gia*: Dau doc RC522 tren ESP32 co duoc debounce bang ngat (hardware interrupt) hoac timer millis khong? Hay moi lan que the la ESP32 phat luon ban tin MQTT?
2. **Kich hoat Canh Bao An Ninh (Security Alert)**:
   - Khi quet the la (Invalid Card), ngoai viec ESP32 publish event `smart_home/events/access` payload `DENIED`, ESP32 co bat coi chip khong?
   - Nut "Khoi Phuc An Ninh (Resolve Alert)" tren App co can publish mot topic de ESP32 tat coi va reset trang thai led khong (vi du: `smart_home/commands/security` payload `CLEAR`)?

### 5.3. Gui Member 3 (Hardware Reliability & Power Lead)
1. **Hien tuong Drop Ap / Reset do Servo (Brownout)**:
   - Khi servo cua quay dong thoi voi Den bat, he thong nguon (nguon 5V rieng hay chung ESP32) co bi sut ap gay reset ESP32 khong?
   - Co che 5 lan Retry cua App co phu hop voi thoi gian khoi dong lai sau reset cua ESP32 khong (thuong mat khoang 3-5s de boot va ket noi WiFi)?

### 5.4. Gui Member 5 (MQTT Broker & Contract Lead)
1. **Port WebSocket 8083**:
   - Member 4 da bo sung port `8083:8083` vao `docker-compose.yml` cua EMQX. Member 5 xac nhan cau hinh EMQX da bat listener WebSocket tai port 8083 tren may laptop chu hay chua.
2. **QoS va Retain Flag tren cac Topic State**:
   - De dam bao khi mo App len la doc duoc ngay trang thai hien tai ma khong can doi bam lenh, Member 5 xac nhan cac topic `smart_home/state/*` da duoc thiet lap `retain = true` va `QoS = 1` chua?

---

> Tai lieu nay duoc lap boi Member 4 (Limi) de lam co so danh gia, nghiem thu va tien hanh tich hop he thong toan dien.

