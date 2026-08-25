# DTS - Sprint 13.8 State / Workflow / Exploratory Testing

## Amaç

Sprint 13.8'in amacı, DTS uygulamasında Sprint 13.7 sistem testlerini tamamlayıcı olacak şekilde state-based testing, workflow testing ve exploratory testing tasarımlarını oluşturmaktır.

Bu doküman test koşullarını ve test adaylarını tanımlar. Testler bu sprint kapsamında çalıştırılmamıştır; tüm çalışma durumu `NOT RUN` olarak işaretlenmiştir. Üretim kodunda, test kodunda veya bağımlılıklarda değişiklik yapılmamıştır.

## Kapsam

İncelenen kaynaklar:

- SRS, ER diyagramı, veri sözlüğü ve README üzerinden sistem kapsamı.
- Sprint 13.1 requirement analysis, Sprint 13.2 test strategy, Sprint 13.3 test data, Sprint 13.4 unit test, Sprint 13.6 integration test ve Sprint 13.7 system test dokümanları.
- Backend entity, enum, DTO, controller, service ve security yapıları.
- Frontend routing, role guard, auth store, axios interceptor, schedule/course/floor ekran akışları.

Kapsama alınan ana alanlar:

- Kimlik doğrulama ve yetkilendirme durumu.
- Kullanıcı aktif/pasif durumu.
- Şifre sıfırlama token durumu.
- Akademik dönem aktif/pasif geçişleri.
- Ders aktif/pasif durumu.
- Haftalık program doluluk/tamamlanma durumu.
- Ders istisnaları: iptal, telafi, ek ders.
- Derslik uygunluk durumu.
- Kat planı ve yerleşim durumu.
- Bildirim okunma durumu.

Kapsam dışı bırakılanlar:

- Yeni backend veya frontend otomasyon kodu yazımı.
- Üretim davranışının değiştirilmesi.
- Var olmayan roller, entity'ler veya iş kurallarına göre test tasarımı.
- Çalıştırılmış PASS/FAIL raporlaması.

## İncelenen State Yapıları

| State Yapısı | Gerçek Kaynak | Durumlar | Not |
| --- | --- | --- | --- |
| Auth session | Frontend `useAuthStore`, `ProtectedRoute`, `PublicRoute`, axios 401 interceptor | `ANONYMOUS`, `AUTHENTICATED`, `SESSION_CLEARED`, `FORBIDDEN_REDIRECT` | Frontend state + HTTP cevabı birlikte değerlendirilir. |
| Kullanıcı hesabı | `User.active` | `ACTIVE`, `INACTIVE` | Login ve listeleme davranışı aktif kullanıcı varsayımına bağlıdır. |
| Şifre sıfırlama tokenı | `PasswordResetToken.used`, `expiresAt` | `UNUSED`, `USED`, `EXPIRED`, `SUPERSEDED` | Yeni forgot-password isteği önceki kullanılmamış tokenları kullanılmış hale getirir. |
| Akademik dönem | `AcademicPeriod.isActive` | `ACTIVE`, `INACTIVE` | Sistemde en az bir aktif dönem kuralı servis seviyesinde korunur. |
| Ders | `Course.active` | `ACTIVE`, `INACTIVE` | Ders pasifleştirme ve silme etkileri sistem testleriyle tamamlanmalıdır. |
| Program tamamlanma durumu | `CourseService` schedule status | `NOT_SCHEDULED`, `INCOMPLETE`, `COMPLETE`, `OVER_SCHEDULED` | Akademisyen detayında hesaplanan durumdur. |
| Ders istisnası | `ScheduleExceptionType` | `NO_EXCEPTION`, `CANCELLED`, `MAKEUP`, `EXTRA` | Exception kayıtları akademisyen tarafından oluşturulur. |
| Derslik uygunluğu | `ClassroomAvailabilityStatus` | `AVAILABLE`, `STARTING_SOON`, `OCCUPIED` | Public snapshot ve programlama ekranı için kritik. |
| Kat plan modu | `PlanMode` | `FLOOR_PLAN`, `SLOT_LAYOUT` | Kat görseli ve slot yerleşimi farklı doğrulama riskleri taşır. |
| Kroki nesne durumu | `SpaceObjectStatus` | `EMPTY`, `OCCUPIED`, `RESERVED`, `MAINTENANCE` | Nesne kaydedilirken boş değer `EMPTY` olur. |
| Bildirim | `Notification.readAt` | `UNREAD`, `READ` | Okunduya alma idempotent davranır. |

Toplam state yapısı: 11  
Toplam dokümante edilen state: 34

## State Transition Table

| ID | State Yapısı | Başlangıç | Olay | Hedef | Beklenen Sonuç |
| --- | --- | --- | --- | --- | --- |
| STT-001 | Auth session | `ANONYMOUS` | Başarılı login | `AUTHENTICATED` | Kullanıcı rol dashboard'una yönlenir. |
| STT-002 | Auth session | `AUTHENTICATED` | Logout | `SESSION_CLEARED` | Store, storage ve query cache temizlenir. |
| STT-003 | Auth session | `AUTHENTICATED` | API 401 | `SESSION_CLEARED` | Axios interceptor oturumu temizler. |
| STT-004 | Auth session | `AUTHENTICATED` | Yetkisiz route | `FORBIDDEN_REDIRECT` | Kullanıcı kendi dashboard'una yönlenir. |
| STT-005 | Password reset | `UNUSED` | Geçerli reset | `USED` | Şifre güncellenir, token tekrar kullanılamaz. |
| STT-006 | Password reset | `UNUSED` | Yeni token talebi | `SUPERSEDED` | Önceki kullanılmamış tokenlar geçersizleşir. |
| STT-007 | Password reset | `UNUSED` | Süre dolumu | `EXPIRED` | Reset reddedilir. |
| STT-008 | Academic period | `INACTIVE` | Activate | `ACTIVE` | Diğer dönemler pasif yapılır. |
| STT-009 | Academic period | `ACTIVE` | Create/update active period | `ACTIVE` | Yeni/işaretlenen dönem aktif, diğerleri pasif olur. |
| STT-010 | Academic period | `ACTIVE` | Pasifleştirme isteği | `INACTIVE` | Sadece başka aktif dönem varsa geçerlidir. |
| STT-011 | Course | `ACTIVE` | Toggle inactive | `INACTIVE` | Ders listesinde pasif olarak görünür. |
| STT-012 | Course | `INACTIVE` | Toggle active | `ACTIVE` | Ders tekrar aktif olur. |
| STT-013 | Schedule status | `NOT_SCHEDULED` | İlk haftalık program | `INCOMPLETE` | Ders saatleri kısmen planlanmış olur. |
| STT-014 | Schedule status | `INCOMPLETE` | Kalan saatleri planla | `COMPLETE` | Planlanan saat ders saatine eşitlenir. |
| STT-015 | Schedule status | `COMPLETE` | Fazla slot ekle | `OVER_SCHEDULED` | Aşırı planlama durumu hesaplanır. |
| STT-016 | Schedule exception | `NO_EXCEPTION` | Cancel oluştur | `CANCELLED` | İlgili ders için iptal işareti oluşur. |
| STT-017 | Schedule exception | `NO_EXCEPTION` | Makeup oluştur | `MAKEUP` | Telafi kaydı oluşur. |
| STT-018 | Schedule exception | `NO_EXCEPTION` | Extra oluştur | `EXTRA` | Ek ders kaydı oluşur. |
| STT-019 | Classroom availability | `AVAILABLE` | Ders başlangıcı yaklaştı | `STARTING_SOON` | Snapshot yaklaşan ders bilgisini döner. |
| STT-020 | Classroom availability | `STARTING_SOON` | Ders başladı | `OCCUPIED` | Derslik dolu görünür. |
| STT-021 | Classroom availability | `OCCUPIED` | Ders bitti | `AVAILABLE` | Derslik tekrar uygun görünür. |
| STT-022 | Floor plan | `FLOOR_PLAN` | Plan mode update | `SLOT_LAYOUT` | Kat farklı plan modunda kaydedilir. |
| STT-023 | Space object | null status | Save layout | `EMPTY` | Servis varsayılan durum atar. |
| STT-024 | Notification | `UNREAD` | Mark as read | `READ` | `readAt` set edilir. |

## Valid Transition Testleri

| ID | Öncelik | Geçiş | Test Verisi | Beklenen | Durum |
| --- | --- | --- | --- | --- | --- |
| VTT-001 | P0 | `ANONYMOUS -> AUTHENTICATED` | TD-VALID-001 | Login başarılı, super admin dashboard. | NOT RUN |
| VTT-002 | P0 | `ANONYMOUS -> AUTHENTICATED` | TD-VALID-002 | Department admin dashboard. | NOT RUN |
| VTT-003 | P0 | `AUTHENTICATED -> SESSION_CLEARED` | TD-VALID-003 | Logout sonrası protected route login'e döner. | NOT RUN |
| VTT-004 | P0 | `AUTHENTICATED -> FORBIDDEN_REDIRECT` | TD-VALID-003 | Akademisyen admin route'a giremez, kendi dashboard'una döner. | NOT RUN |
| VTT-005 | P0 | `UNUSED -> USED` | TD-VALID-001 | Geçerli reset tokenı tek kullanımda kapanır. | NOT RUN |
| VTT-006 | P1 | `UNUSED -> SUPERSEDED` | TD-VALID-001 | Yeni forgot-password eski tokenı kullanılmaz yapar. | NOT RUN |
| VTT-007 | P0 | `INACTIVE -> ACTIVE` | TD-VALID-010 | Akademik dönem aktiflenir, diğerleri pasiflenir. | NOT RUN |
| VTT-008 | P0 | `ACTIVE -> ACTIVE` | TD-VALID-010 | Aktif dönem tekrar aktiflenirse sistem tutarlı kalır. | NOT RUN |
| VTT-009 | P0 | `ACTIVE -> INACTIVE` | TD-VALID-010 | Başka aktif dönem varsa pasifleştirme kabul edilir. | NOT RUN |
| VTT-010 | P1 | `ACTIVE -> INACTIVE` | TD-VALID-010 | Ders pasife alınır ve filtrelerde beklenen şekilde görünür. | NOT RUN |
| VTT-011 | P1 | `INACTIVE -> ACTIVE` | TD-VALID-010 | Ders yeniden aktiflenir. | NOT RUN |
| VTT-012 | P0 | `NOT_SCHEDULED -> INCOMPLETE` | TD-VALID-011 | İlk program kaydı kısmi durum oluşturur. | NOT RUN |
| VTT-013 | P0 | `INCOMPLETE -> COMPLETE` | TD-VALID-013 | Tüm saatler planlanınca tamamlanır. | NOT RUN |
| VTT-014 | P1 | `COMPLETE -> OVER_SCHEDULED` | TD-BOUNDARY-007 | Fazla planlama doğru sınıflanır. | NOT RUN |
| VTT-015 | P0 | `NO_EXCEPTION -> CANCELLED` | TD-SPECIAL-005 | İptal kaydı oluşturulur. | NOT RUN |
| VTT-016 | P0 | `NO_EXCEPTION -> MAKEUP` | TD-SPECIAL-005 | Telafi kaydı oluşturulur. | NOT RUN |
| VTT-017 | P1 | `AVAILABLE -> STARTING_SOON -> OCCUPIED` | TD-VALID-004, TD-VALID-011 | Public uygunluk snapshot'ı zamana göre değişir. | NOT RUN |
| VTT-018 | P2 | `UNREAD -> READ` | TD-VALID-002 | Bildirim okundu işaretlenir. | NOT RUN |

## Invalid Transition Testleri

| ID | Öncelik | Geçiş | Test Verisi | Beklenen | Durum |
| --- | --- | --- | --- | --- | --- |
| ITT-001 | P0 | `ANONYMOUS -> AUTHENTICATED` | TD-INVALID-001 | Hatalı parola login olamaz. | NOT RUN |
| ITT-002 | P0 | `ANONYMOUS -> AUTHENTICATED` | TD-INVALID-002 | Eksik login alanları reddedilir. | NOT RUN |
| ITT-003 | P0 | `ANONYMOUS -> protected` | TD-INVALID-014 | 401 veya login yönlendirmesi alınır. | NOT RUN |
| ITT-004 | P0 | `ACADEMICIAN -> admin action` | TD-INVALID-015 | 403 veya role redirect. | NOT RUN |
| ITT-005 | P0 | `USED -> USED` | TD-VALID-001 | Reset token tekrar kullanılamaz. | NOT RUN |
| ITT-006 | P0 | `EXPIRED -> USED` | TD-VALID-001 | Süresi dolan token reset yapamaz. | NOT RUN |
| ITT-007 | P0 | `ACTIVE academic period -> deleted` | TD-INVALID-012 | Aktif dönem silinemez. | NOT RUN |
| ITT-008 | P0 | `ACTIVE academic period -> inactive` | TD-INVALID-012 | Sistemde başka aktif dönem yoksa reddedilir. | NOT RUN |
| ITT-009 | P1 | `inactive period with courses -> deleted` | TD-VALID-010 | Ders ilişkisi varsa silme reddedilir. | NOT RUN |
| ITT-010 | P0 | `schedule create -> invalid classroom` | TD-INVALID-013 | Var olmayan derslik reddedilir. | NOT RUN |
| ITT-011 | P0 | `physical schedule -> no classroom` | TD-INVALID-011 | Yüz yüze ders için derslik zorunludur. | NOT RUN |
| ITT-012 | P0 | `schedule create -> out of scope` | TD-INVALID-010 | Farklı fakülte/bölüm kapsamı reddedilir. | NOT RUN |
| ITT-013 | P1 | `duplicate exception -> duplicate exception` | TD-SPECIAL-005 | Aynı ders/saat için tekrar kayıt reddedilmelidir. | NOT RUN |
| ITT-014 | P1 | `layout save -> duplicate classroom placement` | TD-VALID-004 | Aynı derslik kat planına iki kez yerleştirilemez. | NOT RUN |

## Workflow Listesi

| ID | Workflow | Roller | Ana Kaynak |
| --- | --- | --- | --- |
| WF-001 | Super admin kullanıcı ve organizasyon yönetimi | `SUPER_ADMIN` | User/faculty/building/floor/classroom yönetimi |
| WF-002 | Department admin ders yönetimi | `DEPARTMENT_ADMIN` | Course controller/page |
| WF-003 | Department admin haftalık program oluşturma | `DEPARTMENT_ADMIN` | Weekly schedule controller/page |
| WF-004 | Akademisyen kendi ders programını görüntüleme | `ACADEMICIAN` | Schedule read-only akış |
| WF-005 | Akademisyen ders iptali oluşturma | `ACADEMICIAN` | Schedule exception |
| WF-006 | Akademisyen telafi/ek ders oluşturma | `ACADEMICIAN` | Schedule exception |
| WF-007 | Public derslik uygunluğu görüntüleme | Public | Public classroom routes |
| WF-008 | Kat planı ve derslik yerleşimi yönetimi | `SUPER_ADMIN` | Floor layout service/page |
| WF-009 | Bildirim görüntüleme ve okunduya alma | Authenticated users | Notification service |
| WF-010 | Şifre sıfırlama | Public + authenticated account | Auth service |

## Happy Path'ler

| ID | Workflow | Test Verisi | Beklenen | Durum |
| --- | --- | --- | --- | --- |
| HP-001 | WF-001 | TD-VALID-001 | Super admin kullanıcı oluşturur/günceller. | NOT RUN |
| HP-002 | WF-002 | TD-VALID-002, TD-VALID-010 | Department admin ders oluşturur. | NOT RUN |
| HP-003 | WF-002 | TD-VALID-010 | Ders aktif/pasif filtresi doğru çalışır. | NOT RUN |
| HP-004 | WF-003 | TD-VALID-011 | Yüz yüze ders uygun dersliğe planlanır. | NOT RUN |
| HP-005 | WF-003 | TD-VALID-012 | Online ders dersliksiz planlanır. | NOT RUN |
| HP-006 | WF-004 | TD-VALID-003 | Akademisyen kendi programını okur. | NOT RUN |
| HP-007 | WF-005 | TD-SPECIAL-005 | Akademisyen kendi dersi için iptal oluşturur. | NOT RUN |
| HP-008 | WF-006 | TD-SPECIAL-005 | Akademisyen telafi/ek ders oluşturur. | NOT RUN |
| HP-009 | WF-007 | TD-VALID-004, TD-VALID-011 | Public derslik uygunluk ekranı doğru snapshot gösterir. | NOT RUN |
| HP-010 | WF-008 | TD-VALID-004 | Kat planına derslik yerleştirilir. | NOT RUN |

## Alternative Path'ler

| ID | Workflow | Varyasyon | Beklenen | Durum |
| --- | --- | --- | --- | --- |
| AP-001 | WF-003 | Kapasitesi yetersiz fakat müsait derslik | Uyarı ile alternatif olarak gösterilir. | NOT RUN |
| AP-002 | WF-003 | Çakışan derslik | Busy gruba düşer ve seçilemez. | NOT RUN |
| AP-003 | WF-003 | Ardışık ders slotları | TD-VALID-013 ile kesintisiz planlama doğrulanır. | NOT RUN |
| AP-004 | WF-003 | Hafta sonu slotu | TD-SPECIAL-004 ile destek/engel davranışı netleştirilir. | NOT RUN |
| AP-005 | WF-004 | Akademisyen filtre değiştirir | Read-only program filtreleri veri bozmaz. | NOT RUN |
| AP-006 | WF-007 | Ders başlangıcına kısa süre kala | `STARTING_SOON` görünür. | NOT RUN |
| AP-007 | WF-008 | Plan mode `FLOOR_PLAN` yerine `SLOT_LAYOUT` | Mod değişimi kaydedilir. | NOT RUN |
| AP-008 | WF-010 | Aynı kullanıcı tekrar forgot-password ister | Eski token geçersizleşir, yeni token geçerli olur. | NOT RUN |

## Error Path'ler

| ID | Workflow | Hata | Test Verisi | Beklenen | Durum |
| --- | --- | --- | --- | --- | --- |
| EP-001 | WF-010 | Hatalı login | TD-INVALID-001 | Login reddedilir. | NOT RUN |
| EP-002 | WF-010 | Eksik login alanları | TD-INVALID-002 | Validasyon hatası. | NOT RUN |
| EP-003 | WF-003 | Dersliksiz yüz yüze ders | TD-INVALID-011 | Program kaydı reddedilir. | NOT RUN |
| EP-004 | WF-003 | Aktif dönem yok | TD-INVALID-012 | Program/ders işlemi reddedilir. | NOT RUN |
| EP-005 | WF-003 | Var olmayan derslik | TD-INVALID-013 | 404/validasyon hatası. | NOT RUN |
| EP-006 | WF-003 | Geçersiz slot count | TD-BOUNDARY-009 | Validasyon hatası. | NOT RUN |
| EP-007 | WF-005 | Duplicate exception | TD-SPECIAL-005 | Duplicate kayıt reddedilir. | NOT RUN |
| EP-008 | WF-008 | Geçersiz base64 kroki | TD-SPECIAL-008 | Layout kaydı reddedilir. | NOT RUN |
| EP-009 | WF-008 | Aynı classroom iki nesneye bağlanır | TD-VALID-004 | Layout kaydı reddedilir. | NOT RUN |
| EP-010 | WF-009 | Başkasının bildirimi okundu yapılır | TD-INVALID-015 | Bildirim bulunamadı/erişim reddi. | NOT RUN |

## Unauthorized Path'ler

| ID | Aktör | Deneme | Test Verisi | Beklenen | Durum |
| --- | --- | --- | --- | --- | --- |
| UP-001 | Anonymous | Protected API | TD-INVALID-014 | 401 JSON cevabı. | NOT RUN |
| UP-002 | Anonymous | Protected frontend route | TD-INVALID-014 | `/giris` yönlendirmesi. | NOT RUN |
| UP-003 | `ACADEMICIAN` | Ders oluşturma | TD-VALID-003 | 403 veya dashboard redirect. | NOT RUN |
| UP-004 | `ACADEMICIAN` | Haftalık program mutate | TD-VALID-003 | Read-only UI ve/veya 403. | NOT RUN |
| UP-005 | `DEPARTMENT_ADMIN` | User management | TD-VALID-002 | 403. | NOT RUN |
| UP-006 | `DEPARTMENT_ADMIN` | Kapsam dışı fakülte/bölüm işlemi | TD-INVALID-010 | Access scope reddi. | NOT RUN |

## Exploratory Testing Charter'ları

| ID | Öncelik | Charter | Odak | Süre | Durum |
| --- | --- | --- | --- | --- | --- |
| EXC-001 | P0 | Role switching ve stale session keşfi | Logout, 401 interceptor, persisted store | 45 dk | NOT RUN |
| EXC-002 | P0 | Program çakışması ve derslik uygunluğu keşfi | Busy/alternative/suitable sınıflandırması | 60 dk | NOT RUN |
| EXC-003 | P0 | Akademik dönem tek aktif dönem kuralı | Activate, update, delete varyasyonları | 45 dk | NOT RUN |
| EXC-004 | P1 | Ders istisnası tekrarları | Cancel/makeup/extra duplicate ve tarih/saat sınırları | 45 dk | NOT RUN |
| EXC-005 | P1 | Kat planı veri bütünlüğü | Duplicate classroom, büyük/bozuk görsel, mod değişimi | 60 dk | NOT RUN |
| EXC-006 | P1 | Public ekranlarda canlı zaman durumu | Available/starting soon/occupied geçişleri | 45 dk | NOT RUN |
| EXC-007 | P1 | Bildirim okundu davranışı | Idempotent mark-as-read, count unread | 30 dk | NOT RUN |
| EXC-008 | P2 | Frontend filtre ve modal state dayanıklılığı | Schedule/course filtreleri, modal kapat-aç | 45 dk | NOT RUN |

## Risk Önceliklendirmesi

| Risk | Öncelik | Gerekçe | İlgili Testler |
| --- | --- | --- | --- |
| Yetkisiz işlem yapılabilmesi | P0 | Rol tabanlı erişim DTS'nin ana güvenlik kontrolüdür. | UP-001..UP-006, ITT-003, ITT-004 |
| Tek aktif akademik dönem kuralının bozulması | P0 | Program ve ders işlemleri dönem durumuna bağlıdır. | VTT-007..VTT-009, ITT-007, ITT-008 |
| Derslik/program çakışması | P0 | Sistem amacının merkezindeki iş kuralıdır. | VTT-012..VTT-017, EP-003..EP-006 |
| Şifre reset tokenının tekrar kullanılabilmesi | P0 | Hesap güvenliği riski oluşturur. | VTT-005, VTT-006, ITT-005, ITT-006 |
| Exception kayıtlarının tekrarlanması | P1 | Program görünümünde yanlış iptal/telafi bilgisi oluşturabilir. | VTT-015, VTT-016, ITT-013, EP-007 |
| Kat planı veri bütünlüğünün bozulması | P1 | Derslik haritası yanlış sınıf eşleşmelerine yol açabilir. | HP-010, ITT-014, EP-008, EP-009 |
| Frontend filtre/modal state karmaşası | P2 | Veri kaybından çok kullanılabilirlik riski taşır. | EXC-008 |

Planlanan test/charter öncelik dağılımı:

- P0: 36
- P1: 30
- P2: 8

## Requirement Traceability

| Requirement / İş Kuralı | Kaynak Durum | İlgili Testler | Trace Durumu |
| --- | --- | --- | --- |
| Rol bazlı erişim: `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `ACADEMICIAN` | Sprint 13.1, backend security | VTT-001..VTT-004, UP-001..UP-006 | COVERED |
| Aktif/pasif kullanıcı | Entity ve auth akışı | VTT-001, ITT-001 | PARTIAL |
| Şifre sıfırlama | Auth service | VTT-005, VTT-006, ITT-005, ITT-006, WF-010 | COVERED |
| Tek aktif akademik dönem | AcademicPeriodService | VTT-007..VTT-009, ITT-007..ITT-009 | COVERED |
| Ders aktif/pasif yönetimi | CourseService/Page | VTT-010, VTT-011, HP-002, HP-003 | COVERED |
| Yüz yüze ders için derslik zorunluluğu | Sprint 13.1 BR-07, backend DTO/service | EP-003, ITT-011 | COVERED |
| Online dersin dersliksiz planlanabilmesi | Sprint 13.1 BR-07 | HP-005 | COVERED |
| Derslik çakışması ve uygunluk | Weekly schedule/public services | AP-001, AP-002, VTT-017, EXC-002 | COVERED |
| Program tamamlanma durumu | CourseService hesaplama | VTT-012..VTT-014 | COVERED |
| Exception kayıtları | ScheduleExceptionService | VTT-015, VTT-016, ITT-013, EP-007 | COVERED |
| Kat planı ve yerleşim | FloorLayoutService | HP-010, ITT-014, EP-008, EP-009 | COVERED |
| Bildirim okundu durumu | NotificationService | VTT-018, EP-010, EXC-007 | COVERED |
| Başlamış dersin iptali | Sprint 13.3 TD-SPECIAL-006 | EXC-004 | UNCLEAR |
| Status threshold dakikaları | Sprint 13.3 TD-SPECIAL-007 | EXC-006 | UNCLEAR |
| Kat plan görsel format detayları | Sprint 13.3 TD-SPECIAL-008, service validation | EP-008, EXC-005 | PARTIAL |

## Test Data Traceability

| Test Verisi | Kullanım | İlgili Testler |
| --- | --- | --- |
| TD-VALID-001 | Super admin login ve reset | VTT-001, VTT-005, VTT-006, HP-001 |
| TD-VALID-002 | Department admin akışları | VTT-002, HP-002, HP-003, UP-005 |
| TD-VALID-003 | Akademisyen read-only ve exception | VTT-003, VTT-004, HP-006..HP-008, UP-003, UP-004 |
| TD-VALID-004 | Kampüs/derslik/kat planı | VTT-017, HP-009, HP-010, ITT-014 |
| TD-VALID-010 | Ders ve akademik dönem | VTT-007..VTT-011, HP-002 |
| TD-VALID-011 | Yüz yüze program | VTT-012, HP-004, HP-009 |
| TD-VALID-012 | Online program | HP-005 |
| TD-VALID-013 | Ardışık program | VTT-013, AP-003 |
| TD-INVALID-001 | Hatalı parola | ITT-001, EP-001 |
| TD-INVALID-002 | Eksik login | ITT-002, EP-002 |
| TD-INVALID-010 | Scope dışı erişim | ITT-012, UP-006 |
| TD-INVALID-011 | Dersliksiz fiziksel ders | ITT-011, EP-003 |
| TD-INVALID-012 | Aktif dönem yok/tek aktif dönem | ITT-007, ITT-008, EP-004 |
| TD-INVALID-013 | Var olmayan derslik | ITT-010, EP-005 |
| TD-INVALID-014 | Unauthenticated protected route | ITT-003, UP-001, UP-002 |
| TD-INVALID-015 | Akademisyen başkasının/kısıtlı kaynağı | ITT-004, EP-010 |
| TD-BOUNDARY-007 | Üst sınıra yakın slot sayısı | VTT-014 |
| TD-BOUNDARY-009 | Geçersiz slot sayısı | EP-006 |
| TD-SPECIAL-004 | Hafta sonu istisnası | AP-004 |
| TD-SPECIAL-005 | Duplicate makeup/cancellation | VTT-015, VTT-016, ITT-013, EP-007 |
| TD-SPECIAL-006 | Başlamış ders iptali belirsizliği | EXC-004 |
| TD-SPECIAL-007 | Status threshold belirsizliği | EXC-006 |
| TD-SPECIAL-008 | Floor plan format belirsizliği | EP-008, EXC-005 |

Yeni test datası tanımlanmadı. Mevcut Sprint 13.3 TD-* seti yeterli görünmektedir. Gerektiğinde Sprint 13.9'da aşağıdaki formatla yeni veri eklenebilir:

| ID | Veri | Amaç | Beklenen |
| --- | --- | --- | --- |
| TD-SPECIAL-009 | Aynı classroomId ile iki farklı floor object | Kat planı duplicate yerleşim doğrulaması | Layout save reddedilir. |
| TD-SPECIAL-010 | Okunmamış ve okunmuş bildirim seti | Bildirim unread count doğrulaması | Sadece unread kayıtlar sayılır. |

## Sprint 13.7 ile İlişki

Sprint 13.7 sistem testleri uçtan uca senaryoları ve sistem davranışlarını tanımlamıştır. Sprint 13.8 bu senaryoları üç yönden derinleştirir:

- State-based testing: 13.7'deki auth, course, schedule, classroom ve exception senaryolarının durum geçişleri ayrıştırıldı.
- Workflow testing: 13.7'deki sistem senaryoları rol bazlı iş akışlarına bağlandı.
- Exploratory testing: 13.7'de listelenen riskli alanlar için zaman kutulu charter'lar oluşturuldu.

13.7'de çalıştırılmayan E2E/sistem testleri bu sprintte de çalıştırılmadı. Bu doküman, Sprint 13.9 otomasyon ve manuel keşif oturumları için giriş niteliğindedir.

## Belirsizlikler / Test Edilemeyen Alanlar

| Alan | Belirsizlik | Etki | Öneri |
| --- | --- | --- | --- |
| Başlamış dersin iptali | Başladıktan sonra `CANCELLED` oluşturma kuralı net değil. | Exception testlerinin beklenen sonucu kesinleşmez. | Ürün kuralı Sprint 13.9 öncesi netleştirilmeli. |
| `STARTING_SOON` threshold | Kaç dakika kala bu state'e geçildiği dokümanda açık değil. | Public availability testlerinde zaman verisi belirsiz kalır. | Threshold dokümante edilmeli ve test verisine eklenmeli. |
| Duplicate exception kuralı | Service davranışı incelenmeli/kanıtlanmalı; iş kuralı dokümanda sınırlı. | ITT-013/EP-007 beklenen sonucu netleşmeyebilir. | Integration test ile gerçek davranış sabitlenmeli. |
| User inactive login davranışı | Entity state var; tüm auth path'lerinde beklenen sonuç açık değil. | Aktif/pasif kullanıcı testi partial kalır. | Auth service kuralı requirement'a eklenmeli. |
| Kat plan görsel formatı | Backend PNG/JPEG ve 5 MB kuralı var; frontend doğrulama kapsamı ayrı net değil. | UI hata mesajı ve backend hata uyumu test edilemez. | UI/backend kabul kriterleri eşleştirilmeli. |
| E2E altyapısı | Frontend package içinde Playwright/Cypress bulunmuyor. | Workflow testleri otomatik çalıştırılamaz. | Sprint 13.9'da E2E aracı kararı verilmeli. |

## Otomasyon Adayları

| Aday | Test Seviyesi | Öncelik | Gerekçe |
| --- | --- | --- | --- |
| Auth 401/logout/session clear | Frontend + integration | P0 | Yetkisiz erişim güvenlik riski. |
| Academic period active/inactive transitions | Integration | P0 | Servis kuralı net ve otomasyona uygun. |
| Password reset token lifecycle | Integration | P0 | Tek kullanımlık token davranışı kritik. |
| Weekly schedule completion states | Integration/system | P0 | `NOT_SCHEDULED/INCOMPLETE/COMPLETE/OVER_SCHEDULED` hesaplaması regresyona açık. |
| Physical/online schedule validation | Integration/system | P0 | Ana iş kuralı. |
| Schedule exception create/duplicate | Integration/system | P1 | Akademisyen akışında kullanıcıya görünür risk. |
| Classroom availability snapshot | Integration/system | P1 | Zaman bağımlı davranış test datası ile sabitlenmeli. |
| Floor layout duplicate placement and image validation | Integration | P1 | Servis validasyonları açık ve otomasyona uygun. |
| Notification read/unread count | Integration | P2 | Düşük riskli, hızlı regresyon testi. |
| Frontend route guard matrix | E2E | P0 | Roller arası yetki matrisi taranmalı. |

## Sprint 13.9'a Aktarılacak Konular

- E2E test altyapısı seçimi ve kurulumu: Playwright veya Cypress.
- 13.8'deki P0 transition ve unauthorized path'lerin otomasyona alınması.
- Public classroom availability için zaman kontrollü test verisi hazırlanması.
- Başlamış ders iptali ve status threshold kurallarının requirement seviyesinde netleştirilmesi.
- Duplicate schedule exception davranışının integration test ile sabitlenmesi.
- Frontend role guard matrix testlerinin eklenmesi.
- Kat planı görsel validasyonu için pozitif/negatif fixture dosyaları hazırlanması.

## Sonuç

Sprint 13.8 kapsamında DTS için state-based, workflow ve exploratory test tasarımı tamamlanmıştır. Gerçek uygulama kodunda bulunan enum, state ve role değerleri temel alınmış; SRS veya ER dokümanlarında geçse bile uygulamada bulunmayan roller ve entity'ler teste dahil edilmemiştir.

Final metrikler:

| Metrik | Değer |
| --- | --- |
| State yapısı sayısı | 11 |
| Toplam state sayısı | 34 |
| Valid transition test sayısı | 18 |
| Invalid transition test sayısı | 14 |
| Workflow sayısı | 10 |
| Happy path sayısı | 10 |
| Alternative path sayısı | 8 |
| Error path sayısı | 10 |
| Unauthorized path sayısı | 6 |
| Exploratory charter sayısı | 8 |
| P0/P1/P2 dağılımı | 36 / 30 / 8 |
| Requirement traceability | 11 COVERED, 2 PARTIAL, 2 UNCLEAR |
| Test data traceability | Mevcut TD-* verileriyle izlenebilir; 2 yeni aday önerildi |
| Çalıştırılan test sayısı | 0 |
| NOT RUN test/charter sayısı | 74 |
| Production code değişikliği | Yok |
| Dependency değişikliği | Yok |
