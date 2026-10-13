# M5-03 — Topic/payload MQTT dùng chung

Phiên bản: **1.0.0**. Người phụ trách: member 5. Ngày chuẩn bị: 13/10/2026.

Đây là bộ quy ước để member 1, 2 và 4 dùng khi ghép firmware với app. Cần các thành viên review và xác nhận dùng cùng bản. Firmware hiện chưa có đầy đủ các chức năng bên dưới.

## 1. Hiểu nhanh

- `topic`: địa chỉ gửi tin, ví dụ `smarthome/cmd/light`.
- `payload`: nội dung tin, ví dụ `ON`.
- `cmd`: app yêu cầu ESP32 điều khiển thiết bị.
- `state`: ESP32 báo trạng thái lại cho app.
- `event`: ESP32 báo một sự kiện, ở đây là kết quả quẹt thẻ RFID.

App gửi lệnh thành công chưa có nghĩa thiết bị đã thực hiện. App cập nhật đèn/cửa từ topic `state`.

## 2. Bảng topic/payload

| Topic | Ai gửi → ai nhận | Payload | Retain |
|---|---|---|---|
| `smarthome/cmd/light` | App → ESP32 | `ON`, `OFF` | false |
| `smarthome/cmd/door` | App → ESP32 | `OPEN`, `CLOSE` | false |
| `smarthome/state/light` | ESP32 → App | `ON`, `OFF` | true |
| `smarthome/state/door` | ESP32 → App | `OPEN`, `CLOSED` | true |
| `smarthome/state/motion` | ESP32 → App | `DETECTED`, `CLEAR` | true |
| `smarthome/state/online` | ESP32/broker → App | `ONLINE`, `OFFLINE` | true |
| `smarthome/event/access` | ESP32 → App | JSON `uid` và `result` | false |

**Lệnh đóng cửa là `CLOSE`. Trạng thái cửa đã đóng là `CLOSED`.**

Sáu topic đầu giữ nguyên tên đã có trong `src/config.cpp`. Topic `smarthome/event/access` là phần bổ sung, chưa có trong firmware hiện tại.

Tất cả tin dùng **QoS 0**. Command và state dùng chữ thuần, viết hoa, không có dấu ngoặc kép, khoảng trắng hay xuống dòng đầu/cuối. `ON` hợp lệ; `on`, `ON\n`, `"ON"` và `{"light":"ON"}` không hợp lệ cho lệnh bật đèn.

Lệnh sai: firmware bỏ qua, ghi log và giữ nguyên trạng thái thiết bị.

## 3. Ví dụ gửi tin

App yêu cầu bật đèn:

```text
Topic:   smarthome/cmd/light
Payload: ON
Retain:  false
```

Sau khi áp dụng lệnh, ESP32 báo lại:

```text
Topic:   smarthome/state/light
Payload: ON
Retain:  true
```

App gửi `CLOSE` vào `smarthome/cmd/door`; sau khi đóng cửa, firmware gửi `CLOSED` vào `smarthome/state/door`.

RFID gửi vào `smarthome/event/access`, Retain false:

```json
{"uid":"A1B2C3D4","result":"GRANTED"}
```

```json
{"uid":"11223344","result":"DENIED"}
```

- `uid`: mã thẻ dạng hex chữ hoa, không có dấu cách hoặc dấu phân cách.
- `GRANTED`: thẻ có trong whitelist; `DENIED`: thẻ không được chấp nhận.
- JSON phải có `uid` và `result`, tối đa 128 byte. App bỏ qua tin thiếu/sai các trường này; có thể bỏ qua trường bổ sung.
- `GRANTED` chỉ báo thẻ hợp lệ. App vẫn đọc state cửa để biết trạng thái điều khiển. App gắn thời gian nhận cho log, không cần ESP32 có NTP.

## 4. Các quy tắc dùng chung

1. Dùng MQTT 3.1.1, TCP 1883, UTF-8, QoS 0. MQTTX/MyMQTT dùng MQTT 5.0 vẫn có thể thử với broker hiện tại. Mạng lab hiện không dùng SSL hoặc MQTT username/password.
2. Broker IP lấy từ laptop đang chạy EMQX. Điện thoại và ESP32 phải cùng LAN. Cách xem IP và mở firewall nằm trong [hướng dẫn M5-01](m5-01-broker-setup.md).
3. Mỗi client dùng ID riêng. ESP32 hiện dùng `ESP32_SmartHome_Core`; app/MQTTX không dùng trùng ID này.
4. Command Retain false để board reconnect không nhận lại lệnh cũ được lưu. State Retain true để app mới mở nhận được trạng thái gần nhất. Event Retain false để không phát lại một lần quẹt thẻ cũ.
5. Sau khi xử lý lệnh hợp lệ, firmware gửi state tương ứng, kể cả lệnh lặp. Khi PIR hoặc timeout làm đổi đèn, cũng gửi state đèn. Nếu actuator báo lỗi thì giữ state cũ. State cửa phản ánh điều khiển đã áp dụng; mô hình hiện chưa có cảm biến xác nhận vị trí cửa.
6. ESP32 dùng Clean Session, Keep Alive 30 giây. Sau reconnect: subscribe lại hai command topics, gửi lại state đèn/cửa/PIR, rồi gửi `ONLINE`. App chưa nhận state thì hiển thị chưa biết.
7. Khi kết nối, ESP32 đăng ký Last Will là `OFFLINE`, topic `smarthome/state/online`, QoS 0, Retain true. Broker gửi khi phát hiện kết nối mất bất thường; tin này có thể tới chậm. Khi ngắt chủ động, firmware tự gửi `OFFLINE` trước DISCONNECT. App mất broker thì báo disconnected và ngừng gửi lệnh.
8. App subscribe `smarthome/state/+` và `smarthome/event/access`. MQTTX Observer dùng `smarthome/#`. Event bị bỏ lỡ khi app offline không có cơ chế lưu/replay trong core.

Retained state là trạng thái cuối đã biết. Khi kiểm thử board online, đối chiếu Dashboard và tin mới từ board; không chỉ dựa vào một tin `ONLINE` còn lưu. Quy tắc ưu tiên thao tác tay/PIR là M2-09, member 2 và 4 cần thống nhất riêng.

## 5. Ai cần làm gì

| Member | Phần cần dùng/triển khai |
|---|---|
| 1 | Dùng đúng topic, gọi actuator, gửi state, thêm Last Will và giao diện publish event |
| 2 | Báo motion và kết quả RFID qua giao diện member 1 |
| 3 | Cung cấp actuator đèn/cửa và trạng thái điều khiển |
| 4 | Gửi command, nhận state/event và cập nhật giao diện |
| 5 | Giữ contract chung và kiểm thử giao tiếp |

Firmware hiện đã subscribe và parse bốn lệnh, nhưng actuator còn TODO. State đèn/cửa/PIR chưa publish; chỉ có `ONLINE` retained, chưa có `OFFLINE`/Last Will.

Member 1 cần thêm constant `TOPIC_EVENT_ACCESS = "smarthome/event/access"` khi triển khai event. Tài liệu này chưa sửa source của các member.

## 6. File dùng chung và kiểm thử

[mqtt-contract.json](mqtt-contract.json) lưu cùng bảng trên để script đọc. `payloads` trong file chỉ liệt kê giá trị cho phép; lúc gửi MQTT chọn một giá trị, không gửi cả mảng JSON.

Chạy tại thư mục project:

```powershell
python scripts/mqtt_smoke_test.py --output docs/test-results/m5-03-contract-broker.json
```

Script đọc command từ JSON và kiểm tra gửi/nhận qua broker. [Báo cáo kết quả](test-results/m5-03-contract-broker.json) chỉ xác nhận bốn command; không chứng minh board, state, RFID hay Last Will hoạt động.

Trước khi ghép app/firmware:

- [ ] Member 1 xác nhận tên topic, payload và phản hồi state.
- [ ] Member 2 xác nhận motion và JSON RFID.
- [ ] Member 4 xác nhận publish/subscribe đúng, đặc biệt `CLOSE`/`CLOSED`.
- [ ] Khi có board, kiểm tra state, Last Will và reconnect thực tế.

Nếu đổi giao tiếp, sửa tài liệu và JSON cùng lúc, đổi version và báo nhóm để tránh mỗi người dùng một bản.

Tham khảo: [PubSubClient 2.8](https://pubsubclient.knolleary.net/api), [QoS của PubSubClient](https://github.com/knolleary/pubsubclient/blob/master/README.md), [Retain và Last Will](https://docs.emqx.com/en/emqx/latest/get-started/mqtt-advanced.html).
