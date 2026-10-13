# M5-01 — Broker EMQX và kiểm tra kết nối

Người phụ trách: member 5 (Khoa). Theo PDF phân công, M5-01 dự kiến 3 giờ; kết quả cần đạt là MQTTX, điện thoại và ESP32 truy cập được broker. Broker chạy trên laptop để chuyển tiếp tin nhắn giữa các client.

Tình trạng cập nhật ngày 13/10/2026: EMQX 6.3.1 đang chạy trên laptop. Ngày 12/10, bộ kiểm tra tự động đã gửi và nhận đủ bốn lệnh, đạt 4/4; lịch sử MQTTX Observer ghi đủ payload chính xác lúc 23:02:48 (UTC+7). [Báo cáo kiểm tra](test-results/m5-01-local-broker.json). Ngày 13/10, rule firewall đã được tạo và xác minh cho IP Wi-Fi `192.168.88.173`; người dùng xác nhận Android và laptop đã nhận tin ở cả hai chiều. Board ESP32 đang ở member 1, còn chờ kiểm tra; khả năng khôi phục sau restart cũng chưa được thử. M5-01 chưa đánh dấu hoàn thành toàn bộ.

## 1. Chuẩn bị ứng dụng

| Thiết bị | Ứng dụng | Công việc |
|---|---|---|
| Laptop Windows | Docker Desktop, Linux containers | Chạy broker EMQX |
| Laptop Windows | MQTTX Desktop | Gửi và nhận MQTT để kiểm tra broker |
| Android | MyMQTT | Kiểm tra kết nối qua Wi-Fi/hotspot |

Mở Docker Desktop, đợi Engine khởi động, rồi mở PowerShell:

```powershell
docker version
```

Kết quả phải có cả phần `Client` và `Server`. Nếu chỉ thấy `Client` cùng lỗi kết nối Engine, xử lý Docker Desktop trước khi tiếp tục.

## 2. Tạo broker một lần

Nếu container `smart-home-emqx` đã tồn tại và đang chạy, chuyển đến bước 3. Có thể kiểm tra bằng:

```powershell
docker ps -a --filter "name=smart-home-emqx"
```

Lệnh sau dùng một phiên bản cố định, hostname cố định và hai volume lưu dữ liệu/log, để đồng đội dựng lại cùng cấu hình. Image `emqx/emqx-enterprise:6.3.1` được tài liệu triển khai chính thức dùng làm ví dụ. [Tài liệu Docker của EMQX](https://docs.emqx.com/en/emqx/latest/get-started/deploy/install-docker.html).

```powershell
docker run -d `
  --name smart-home-emqx `
  --hostname broker.smart-home.local `
  --restart unless-stopped `
  -e "EMQX_NODE_NAME=emqx@broker.smart-home.local" `
  -e "EMQX_SECURITY_PROFILE=legacy" `
  -p 1883:1883 `
  -p 127.0.0.1:18083:18083 `
  -v smart-home-emqx-data:/opt/emqx/data `
  -v smart-home-emqx-log:/opt/emqx/log `
  emqx/emqx-enterprise:6.3.1
```

Copy nguyên khối vào PowerShell. Dấu `` ` `` cuối dòng nối các dòng thành một lệnh; không thêm khoảng trắng sau dấu đó. Docker tự tải image trong lần đầu.

Gói EMQX này có sẵn Community License cho một node; không cần xin Trial License cho bước dựng broker đồ án này. [Tài liệu license EMQX](https://docs.emqx.com/en/emqx/latest/get-started/deploy/license.html).

Profile `legacy` được chọn để dùng cấu hình thử nghiệm MQTT không có username/password, tương thích với firmware hiện tại chỉ gửi Client ID khi kết nối. Đây là cấu hình cho mạng nội bộ của nhóm. [Security profiles EMQX](https://docs.emqx.com/en/emqx/latest/guides/access-control/security-profile.html).

| Cổng laptop | Mục đích |
|---|---|
| TCP `1883` | MQTTX, điện thoại và ESP32 truy cập MQTT |
| `127.0.0.1:18083` | Dashboard, chỉ mở từ chính laptop |

Kiểm tra trạng thái:

```powershell
docker ps --filter "name=smart-home-emqx"
docker exec smart-home-emqx emqx ctl status
```

Container cần có trạng thái `Up`, và lệnh `status` báo node đang chạy. Nếu chưa đạt:

```powershell
docker logs --tail 50 smart-home-emqx
```

## 3. Mở Dashboard

Mở [Dashboard trên laptop](http://localhost:18083). Lần đăng nhập đầu tiên dùng username `admin`, password `public`, rồi đổi mật khẩu theo yêu cầu. Nếu đã đổi, dùng mật khẩu quản trị đã đặt. Tài khoản Dashboard quản lý broker, còn MQTTX ở cấu hình này để trống username/password. [Hướng dẫn Dashboard EMQX](https://docs.emqx.com/en/emqx/latest/guides/dashboard/introduction.html).

Trong phần Clients của Dashboard, kiểm tra các Client ID đang kết nối. Không ghi mật khẩu quản trị hoặc mật khẩu Wi-Fi vào tài liệu được commit.

## 4. Tạo hai kết nối trong MQTTX

| Trường | M5 Observer | M5 Sender |
|---|---|---|
| Name | `M5 Observer` | `M5 Sender` |
| Client ID | `m5observer` | `m5sender` |
| Ô chọn giao thức trước Host | `mqtt://` | `mqtt://` |
| Ô địa chỉ Host bên phải | `127.0.0.1` | `127.0.0.1` |
| Port | `1883` | `1883` |
| MQTT Version | `3.1.1` | `3.1.1` |
| Username / Password | Để trống | Để trống |
| SSL/TLS | Tắt | Tắt |

**Nếu MQTTX có ô chọn `mqtt://` riêng, ô địa chỉ chỉ nhập `127.0.0.1`.** Nhập thêm `mqtt://` vào ô địa chỉ sẽ lặp giao thức và có thể gây lỗi `getaddrinfo ENOTFOUND mqtt`.

MQTTX hỗ trợ MQTT 3.1.1 và 5.0; chọn 3.1.1 để thống nhất với firmware. EMQX cũng có thể nhận client MQTT 5.0 nên không cần đổi phiên bản nếu mục tiêu chỉ là xác nhận broker hoạt động. Các Client ID phải khác nhau; dành `ESP32_SmartHome_Core` cho board. [Hướng dẫn MQTTX](https://github.com/emqx/MQTTX/blob/main/docs/manual.md).

Nhấn **Connect** cho cả hai kết nối. Chọn **M5 Observer**, bấm **New Subscription**, nhập `smarthome/#`, chọn QoS `0`, rồi xác nhận. Observer sẽ nhận các topic bắt đầu bằng `smarthome/`.

## 5. Gửi đủ bốn lệnh từ Sender

Chọn **M5 Sender** ở danh sách bên trái. Trong khung soạn tin ở cuối cửa sổ, chọn **Plaintext**, **QoS 0**, bỏ chọn **Retain**. Nhập Topic và nội dung rồi bấm nút gửi màu xanh ở góc dưới bên phải, từng lần một.

| Lần gửi | Topic | Nội dung payload chính xác |
|---|---|---|
| 1 | `smarthome/cmd/light` | `ON` |
| 2 | `smarthome/cmd/light` | `OFF` |
| 3 | `smarthome/cmd/door` | `OPEN` |
| 4 | `smarthome/cmd/door` | `CLOSE` |

**Chỉ nhập chữ viết hoa trong ô nội dung. Không thêm dấu ngoặc kép, JSON, khoảng trắng hoặc xuống dòng sau lệnh.** Ví dụ, `ON` chỉ gồm hai ký tự `O` và `N`; `ON` có thêm ký tự xuống dòng sẽ không khớp với điều kiện so sánh trong [main.cpp](../src/main.cpp).

Sau mỗi lần gửi, chuyển sang **M5 Observer** để xác nhận nhận đúng Topic và nội dung. Các tin màu xanh trong Sender là lịch sử gửi; bằng chứng broker chuyển tiếp là tin nhận được tại Observer. Giữ Retain tắt cho lệnh điều khiển để client kết nối sau không nhận lại lệnh cũ được lưu.

Kết quả đạt ở bước này: Observer nhận đủ `ON`, `OFF`, `OPEN`, `CLOSE` trên đúng hai topic. Đây là kiểm tra chuyển tiếp MQTT trên laptop. Firmware hiện chỉ ghi log `EXECUTE` và còn TODO ở chỗ gọi điều khiển đèn/servo, nên chưa xác nhận thiết bị vật lý hoạt động.

### Chạy kiểm tra tự động trên laptop

Tại thư mục gốc project, chạy:

```powershell
python scripts/mqtt_smoke_test.py --output docs/test-results/m5-01-local-broker.json
```

Đọc báo cáo JSON và kết quả trên terminal. Báo cáo này xác nhận những trường hợp script đã thực sự kiểm tra; kiểm tra điện thoại, ESP32 và phần cứng cần bằng chứng riêng. Lệnh gửi các lệnh điều khiển MQTT, vì vậy chạy trong phiên thử nghiệm mà nhóm đang chủ động kiểm tra.

## 6. Chuẩn bị mạng chung cho điện thoại và ESP32

Chọn một trong hai cách:

- Laptop, Android và ESP32 cùng kết nối một router Wi-Fi của nhóm.
- Laptop bật **Settings → Network & internet → Mobile hotspot**, rồi Android và ESP32 kết nối hotspot đó. [Hướng dẫn hotspot Windows của Microsoft](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/use-your-windows-device-as-a-mobile-hotspot). Chọn băng tần 2.4 GHz cho ESP32 đang dùng trong dự án. [Thông số ESP32 của Espressif](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf).

Trên laptop, chạy:

```powershell
ipconfig
```

Lấy IPv4 của adapter thuộc mạng mà điện thoại sẽ kết nối. Nếu dùng router, lấy adapter Wi-Fi/Ethernet nối router đó; nếu dùng hotspot, lấy adapter hotspot. Không lấy IP adapter Docker/WSL.

| Client | Địa chỉ Host |
|---|---|
| MQTTX trên laptop chạy broker | `127.0.0.1` |
| MyMQTT trên Android | IPv4 thực tế của laptop trong mạng chung |
| ESP32 | Cùng IPv4 đó |

Trong lần kiểm tra ngày 13/10/2026, Wi-Fi laptop có IPv4 **`192.168.88.173`**, subnet mask `255.255.255.0`, gateway `192.168.88.1`; adapter hotspot đang ngắt kết nối. Android đã thử thành công trên cùng mạng Wi-Fi. IP cũ ngày 12/10 là `192.168.0.102`, không dùng cho mạng hiện tại. IP có thể thay đổi do DHCP; kiểm tra lại `ipconfig` nếu đổi mạng hoặc kết nối lại. `127.0.0.1` trên Android trỏ về chính điện thoại, không trỏ về laptop.

### Cho phép cổng MQTT qua Windows Firewall

Windows yêu cầu quyền Administrator để tạo rule. Ngày 13/10, helper đã được chạy với quyền này và rule đã được xác minh đang bật. Khi cần cấu hình lại, mở PowerShell bằng **Run as administrator**, chuyển đến thư mục project và truyền đúng thông số mạng hiện tại:

```powershell
.\scripts\open_mqtt_firewall.ps1 -LocalIPAddress "192.168.88.173" -RemoteSubnet "192.168.88.0/24" -InterfaceAlias "Wi-Fi"
```

Rule hiện tại cho phép TCP 1883 đến `192.168.88.173`, chỉ từ subnet `192.168.88.0/24` qua adapter `Wi-Fi`, profile `Public`. Helper kiểm tra IP có thực sự thuộc adapter và dùng đúng profile mạng; rule cùng tên sẽ được cập nhật thay vì tạo trùng. Giá trị mặc định trong script là mạng thử ngày 12/10, nên luôn truyền thông số hiện tại như lệnh trên. [Tài liệu New-NetFirewallRule của Microsoft](https://learn.microsoft.com/en-us/powershell/module/netsecurity/new-netfirewallrule).

Khi IP hoặc mạng thay đổi, xác định lại IPv4, subnet và adapter rồi truyền thông số mới. Ví dụ dưới đây chỉ áp dụng nếu `ipconfig` thực sự cho thấy Wi-Fi laptop đổi sang `192.168.0.103` với subnet `/24`:

```powershell
.\scripts\open_mqtt_firewall.ps1 -LocalIPAddress "192.168.0.103" -RemoteSubnet "192.168.0.0/24" -InterfaceAlias "Wi-Fi"
```

## 7. Kiểm tra Android gửi và nhận

Cài [MyMQTT trên Google Play](https://play.google.com/store/apps/details?id=at.tripwire.mqtt.client), rồi kết nối Android vào mạng chung đã chọn. Cấu hình ứng dụng:

| Trường | Giá trị |
|---|---|
| Host / Broker | IPv4 thực tế của laptop; lần kiểm tra ngày 13/10 là `192.168.88.173` |
| Port | `1883` |
| Transport, nếu có | MQTT TCP |
| Client ID, nếu có | `m5phone` |
| MQTT Version, nếu có | `3.1.1` |
| Username / Password | Để trống |
| SSL/TLS | Tắt |

Kết nối, rồi subscribe `smarthome/test/m5` trên điện thoại. Observer trên laptop đã subscribe `smarthome/#`, nên cũng nhận được topic thử này.

1. Điện thoại publish `HELLO_PHONE` vào `smarthome/test/m5`, QoS `0`, Retain tắt. **M5 Observer** trên laptop phải nhận được.
2. **M5 Sender** trên laptop publish `HELLO_PC` vào cùng topic, QoS `0`, Retain tắt. Điện thoại phải nhận được.
3. Trong Dashboard trên laptop, kiểm tra client điện thoại đang kết nối.

Đạt khi nhận đủ tin theo cả hai chiều. Chụp ảnh kết quả trên laptop và điện thoại để lưu bằng chứng. Đây là phần làm tiếp theo sau khi bốn lệnh trên laptop đã đạt.

## 8. Kiểm tra ESP32 khi có board

Phối hợp member 1 nhập SSID, mật khẩu Wi-Fi và IPv4 broker thực tế vào cấu hình dùng để nạp board, giữ port `1883`. Bảo quản mật khẩu ngoài tài liệu công khai. Mở Serial Monitor ở baudrate `115200`.

Kết quả cần kiểm tra:

- Serial báo có IP Wi-Fi và MQTT `connected`.
- Dashboard có client `ESP32_SmartHome_Core` đang kết nối.
- Observer nhận topic `smarthome/state/online` với payload `ONLINE` khi board kết nối.
- Gửi bốn lệnh ở bước 5 và đối chiếu log `Message arrived` cùng `EXECUTE` tương ứng trên Serial Monitor.

`ONLINE` được firmware gửi retained; tin còn lưu không chứng minh board đang online. Đối chiếu trạng thái client trong Dashboard. Các hàm bật/tắt đèn và đóng/mở cửa hiện còn TODO, nên ghi kết quả của bước này là **board kết nối và xử lý lệnh**, chưa ghi đèn/cửa hoạt động thật.

## 9. Lưu kết quả và khởi động cho buổi sau

| Kiểm tra | Bằng chứng cần có | Tiến độ |
|---|---|---|
| EMQX chạy trên laptop | Container `Up`, node status và Dashboard | Đã xác nhận container EMQX 6.3.1 đang chạy, cổng 1883 được publish |
| MQTTX kết nối local | Hai Client ID khác nhau cùng kết nối | Người dùng đã báo kết nối thành công |
| Chuyển tiếp bốn lệnh | Observer nhận đúng topic và payload, hoặc báo cáo test tự động | Đạt 4/4; MQTTX Observer nhận đủ lúc 23:02:48 ngày 12/10/2026 |
| Firewall cho Android | Rule TCP 1883 giới hạn IP, subnet và adapter | Đã tạo và xác minh ngày 13/10: `192.168.88.173`, nguồn `/24`, Wi-Fi, Public |
| Android hai chiều | `HELLO_PHONE` ở laptop và `HELLO_PC` ở điện thoại | Đạt theo xác nhận người dùng ngày 13/10; chưa lưu ảnh bằng chứng |
| ESP32 | Dashboard client và Serial log bốn lệnh | Board đang ở member 1; chờ kiểm tra cùng mạng |
| Khôi phục sau restart | Broker chạy lại và client kết nối lại | Chờ kiểm tra trong phiên phù hợp |

Lưu ảnh kiểm tra và báo cáo test; không đưa mật khẩu vào ảnh hoặc file được commit. Chỉ đánh dấu toàn bộ M5-01 `Done` sau khi MQTTX, Android và ESP32 đã truy cập thành công.

Buổi sau, mở Docker Desktop. Nếu container đã dừng, chạy:

```powershell
docker start smart-home-emqx
```

Khi chủ động thử khả năng khôi phục, chạy:

```powershell
docker restart smart-home-emqx
```

Sau đó kết nối lại các client và kiểm tra gửi/nhận. IP laptop có thể đổi khi đổi mạng, nên kiểm tra lại `ipconfig` và cập nhật cấu hình điện thoại, ESP32 cùng rule firewall.

## Xử lý lỗi thường gặp

| Biểu hiện | Kiểm tra và cách xử lý |
|---|---|
| Tin demo chạy liên tục | Client đang dùng `broker.emqx.io`; đổi cả hai client về `127.0.0.1`, port `1883` |
| `getaddrinfo ENOTFOUND mqtt` | Ô Host bên phải có thừa `mqtt://`; giữ giao thức ở ô chọn bên trái, nhập lại địa chỉ thuần, ngắt rồi kết nối lại |
| `ECONNREFUSED 127.0.0.1:1883` | Kiểm tra Docker Engine, container và publish port 1883 |
| Hai client lần lượt bị ngắt | Kiểm tra Client ID khác nhau |
| Sender có lịch sử gửi nhưng Observer không có tin mới | Cả hai phải kết nối cùng broker; Observer phải subscribe `smarthome/#` trước khi gửi |
| Android không kết nối được | Kiểm tra cùng mạng, Host là IP laptop, port 1883, rule firewall đúng IP; nếu dùng router, kiểm tra chế độ cách ly client |
| ESP32 nhận tin nhưng báo lệnh không hợp lệ | Payload phải đúng chữ hoa, không có khoảng trắng hoặc xuống dòng |
