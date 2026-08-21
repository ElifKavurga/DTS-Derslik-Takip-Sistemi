# Sprint 12.4 Test Senaryoları

Sprint 12.4 kayıtları `weekly_schedules.source_note` alanındaki `[S12.4]` etiketiyle ayrıştırılır. Fiziksel kayıtlar, Mühendislik Fakültesindeki mevcut dersliklerden kapasite ve koda göre deterministik olarak seçilen ilk iki dersliği kullanır.

| Senaryo | Kaynak | Beklenen durum | Seed durumu |
|---|---|---|---|
| Aynı derslik / aynı slot | Derslik | ÇAKIŞMA | Veritabanındaki `uk_weekly_schedules_classroom_day_time` kısıtı nedeniyle ikinci kayıt eklenmez; API reddiyle test edilir. |
| Aynı akademisyen / aynı slot | Akademisyen | ÇAKIŞMA | Pazartesi `08:15-09:00`, iki farklı derslikte oluşturuldu. |
| Aynı zorunlu sınıf / aynı slot | Bölüm + sınıf seviyesi | ÇAKIŞMA | CENG 1-A için Pazartesi `08:15-09:00` oluşturuldu. Öğrenci entity ilişkisi bulunmadığından sistemin mevcut sınıf-seviyesi kuralı kullanıldı. |
| Kısmi zaman çakışması | Akademisyen + sınıf | ÇAKIŞMA | Çarşamba iki çoklu-slot grup bir ortak slot paylaşır. |
| Tam kapsama | Akademisyen | ÇAKIŞMA | Perşembe üç slotluk dış grup ile ortadaki tek slotluk iç grup oluşturuldu. |
| Aynı başlangıç | Akademisyen | ÇAKIŞMA | Cuma iki grup `08:15-09:00` slotunda birlikte başlar. |
| Aynı bitiş | Akademisyen | ÇAKIŞMA | Salı iki grup `09:10-09:55` slotunda birlikte biter. |
| Arka arkaya ders | Derslik | ÇAKIŞMA YOK | Pazartesi aynı derslikte `08:15-09:00` ve sonraki üretilmiş `09:10-09:55` slotları kullanıldı. |
| Aynı akademisyen / farklı slot | Akademisyen | ÇAKIŞMA YOK | Pazartesi farklı üretilmiş slotlarda oluşturuldu. |
| Kapasite aşımı | Derslik kapasitesi | UYARI | `S124EC1` test dersi 999 öğrenciyle mevcut düşük kapasiteli dersliğe bağlandı. Mevcut servis bunu engel değil kapasite uyarısı olarak değerlendirir. |
| Online ders | Fiziksel kaynak | ÇAKIŞMA YOK | Salı `13:30-14:15`, `delivery_type=ONLINE`, `classroom_id=NULL`. |
| Fiziksel ders | Derslik → kat → bina → fakülte | NORMAL | Mevcut Mühendislik Fakültesi derslik zinciri kullanıldı. |
| Farklı hafta | Derslik | DESTEKLENMİYOR | `WeeklySchedule` modelinde hafta veya tarih alanı yoktur; yeni model eklenmedi. |
| Serbest zaman aralığı kesişimi | Zaman | DESTEKLENMİYOR | Sistem serbest başlangıç/bitiş aralığı yerine üretilmiş ayrık `time_slot` değerlerini karşılaştırır. Senaryolar slot gruplarıyla temsil edildi. |
| Fiziksel derslik bilgisi eksik | Fiziksel kaynak | DESTEKLENMİYOR | Oluşturma DTO’sunda `classroomId` zorunludur; doğrudan geçersiz kayıt eklenmedi. |
| Akademisyen bilgisi eksik ders | Ders | DESTEKLENMİYOR | `courses.academician_id` `NOT NULL` olduğundan constraint ihlal edilmedi. |

Not: Bu branch’te Sprint 12.2’ye ait `weekly_schedules` insert kayıtları bulunmadığından mevcut normal program satırları değiştirilememiştir. V25 yalnızca yeni ve açıkça etiketli test satırları ekler.
