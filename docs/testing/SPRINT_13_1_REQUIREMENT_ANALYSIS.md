# Sprint 13.1 – Gereksinim Doğrulama

## 1. Kapsam

Bu doküman DTS projesinde Sprint 13 test hazırlığı için gereksinimlerin test edilebilirliğini ve mevcut implementasyonla uyumunu analiz eder. Bu sprintte test kodu yazılmadı, test case oluşturulmadı ve test çalıştırılmadı. Analiz, proje dokümanlarını ana referans kabul eder; kod yalnızca gereksinimlerin mevcut karşılığını görmek için incelenmiştir.

## 2. Kullanılan Kaynaklar

| Kaynak | Kullanım amacı |
|---|---|
| `SRS 2.md` | SRS, use case listesi, mantıksal veri modeli ve veri sözlüğü |
| `docs/SPRINT_12_4_TEST_SCENARIOS.md` | Önceki sprintte belirlenmiş çakışma ve edge-case notları |
| `README.md` | Proje yapısı, auth ve çalışma mimarisi |
| `backend/src/main/java/com/dts/dersliktakip/entity/*` | Entity ve enum karşılıkları |
| `backend/src/main/java/com/dts/dersliktakip/controller/*` | Endpoint ve role bazlı erişim karşılıkları |
| `backend/src/main/java/com/dts/dersliktakip/service/*` | İş kuralları, veri izolasyonu ve çakışma kontrolleri |
| `backend/src/main/resources/db/migration/*` | ER/veri sözlüğünün fiziksel şema karşılıkları |
| `frontend/src/router/index.tsx`, `frontend/src/router/ProtectedRoute.tsx`, `frontend/src/router/roleRoutes.ts` | Frontend rol akışları ve public/protected sayfalar |
| `frontend/src/pages/**`, `frontend/src/services/**`, `frontend/src/types/**` | Kullanıcı akışları ve API kullanım karşılıkları |

## 3. Gereksinim Listesi

Toplam 36 SRS use case gereksinimi incelendi.

| ID | Gereksinim | Modül | Test edilebilirlik | Belirsizlik / eksiklik | Kaynak |
|---|---|---|---|---|---|
| REQ-3.1.1 | Sisteme giriş yapma | Auth | Yüksek | Aktif oturum davranışı opsiyonel ifade edilmiş | SRS 3.1 |
| REQ-3.1.2 | Profil görüntüleme | Profil | Yüksek | Görüntülenecek alan seti net değil | SRS 3.1 |
| REQ-3.1.3 | Profil güncelleme | Profil | Orta | Hangi alanların güncellenebilir olduğu net değil | SRS 3.1 |
| REQ-3.1.4 | Şifre değiştirme | Profil/Auth | Orta | Şifre kuralları ölçülebilir tanımlanmamış | SRS 3.1 |
| REQ-3.1.5 | Çıkış yapma | Auth | Orta | JWT/session sonlandırma beklentisi net değil | SRS 3.1 |
| REQ-3.2.1 | Anlık boş sınıfları görüntüleme | Public campus | Orta | "Anlık" hesaplama penceresi net değil | SRS 3.2 |
| REQ-3.2.2 | Bir sonraki ders saatinde boşalacak sınıfları görüntüleme | Public campus | Orta | "Bir sonraki ders saati" tanımı ve eşik net değil | SRS 3.2 |
| REQ-3.2.3 | Kat planını görüntüleme | Floor layout | Yüksek | Plan yoksa beklenen hata/empty state net değil | SRS 3.2 |
| REQ-3.2.4 | Sınıf konumunu görüntüleme | Floor layout | Yüksek | Vurgulama davranışının UI kriteri net değil | SRS 3.2 |
| REQ-3.2.5 | Sınıf bilgilerini görüntüleme | Classroom | Orta | Ekipman veri modeli SRS ile kodda farklı | SRS 3.2 |
| REQ-3.3.1 | Kayıt listeleme | Ortak yönetim | Yüksek | Hangi kayıt tipleri için ortak davranış olduğu ayrıntılanmamış | SRS 3.3 |
| REQ-3.3.2 | Yeni kayıt ekleme | Ortak yönetim | Yüksek | Alan bazlı doğrulama veri sözlüğünde eksik | SRS 3.3 |
| REQ-3.3.3 | Kayıt güncelleme | Ortak yönetim | Yüksek | Alan bazlı izinler net değil | SRS 3.3 |
| REQ-3.3.4 | Kayıt silme | Ortak yönetim | Orta | İlişkili kayıt kısıtları entity bazında ayrıntılanmamış | SRS 3.3 |
| REQ-3.3.5 | Kayıt arama | Ortak yönetim | Orta | Arama kriterleri/alanları net değil | SRS 3.3 |
| REQ-3.3.6 | Kayıt filtreleme | Ortak yönetim | Orta | Filtre kriterleri modül bazında net değil | SRS 3.3 |
| REQ-3.4.1 | Fakülte yönetimi | Campus admin | Yüksek | Aynı isim dışında code zorunluluğu SRS'de yok | SRS 3.4 |
| REQ-3.4.2 | Bina yönetimi | Campus admin | Yüksek | Bina kodu SRS veri sözlüğünde yok | SRS 3.4 |
| REQ-3.4.3 | Kat yönetimi | Campus admin | Yüksek | Kat adı/kodu davranışı SRS veri sözlüğünde sınırlı | SRS 3.4 |
| REQ-3.4.4 | Kat planı yönetimi | Floor layout | Orta | SRS PNG/JPG/PDF yükleme der; kod base64/layout modeline kaymış | SRS 3.4 |
| REQ-3.4.5 | Sınıf yönetimi | Classroom | Orta | Koordinatlar SRS'de Classroom alanı, kodda SpaceObject üzerinden tutuluyor | SRS 3.4 |
| REQ-3.4.6 | Bölüm yönetimi | Department | Yüksek | Bölüm code alanı SRS veri sözlüğünde yok | SRS 3.4 |
| REQ-3.4.7 | Bölüm admini yönetimi | User/role | Düşük | "Eğer bu iş kuralını koyacaksan" ifadesi gereksinim netliğini düşürüyor | SRS 3.4 |
| REQ-3.4.8 | Bölüm-sınıf yetkilendirme | Authorization/scope | Düşük | SRS entity var, mevcut kodda ayrı DepartmentClassroom karşılığı görülmedi | SRS 3.4 |
| REQ-3.5.1 | Akademisyen yönetimi | Department admin | Yüksek | SRS başlığı "Süper Admin İşlevleri" iken aktör Bölüm Admini | SRS 3.5 |
| REQ-3.5.2 | Ders yönetimi | Course | Yüksek | Ders alanları SRS ve kodda farklılaşmış | SRS 3.5 |
| REQ-3.5.3 | Haftalık ders programı yönetimi | Weekly schedule | Yüksek | Dönem modeli SRS'de basit metin, kodda AcademicPeriod | SRS 3.5 |
| REQ-3.5.4 | Dersi sınıfa yerleştirme | Weekly schedule | Yüksek | Bölümün kullanabileceği sınıflar kuralı kodda fakülte kapsamı olarak uygulanıyor | SRS 3.5 |
| REQ-3.6.1 | Sınıf rezervasyonu oluşturma | Schedule exceptions | Orta | Kodda Reservation entity yerine ScheduleException modeli var | SRS 3.6 |
| REQ-3.6.2 | Rezervasyonlarını görüntüleme | Schedule exceptions | Orta | "Rezervasyon" ile "istisna ders" terminolojisi ayrışmış | SRS 3.6 |
| REQ-3.6.3 | Rezervasyonu iptal etme | Schedule exceptions | Düşük | Başlamış/iptaline izin verilmeyen rezervasyon kuralı ölçülebilir değil | SRS 3.6 |
| REQ-3.7.1 | Misafir anlık boş sınıf görüntüleme | Public campus | Orta | REQ-3.2.1 ile tekrar ediyor | SRS 3.7 |
| REQ-3.7.2 | Misafir sonraki saatte boşalacak sınıfları görüntüleme | Public campus | Orta | REQ-3.2.2 ile tekrar ediyor | SRS 3.7 |
| REQ-3.7.3 | Misafir kat planı görüntüleme | Public campus | Yüksek | REQ-3.2.3 ile tekrar ediyor | SRS 3.7 |
| REQ-3.7.4 | Misafir sınıf konumu görüntüleme | Public campus | Yüksek | REQ-3.2.4 ile tekrar ediyor | SRS 3.7 |
| REQ-3.7.5 | Misafir sınıf bilgileri görüntüleme | Public campus | Orta | REQ-3.2.5 ile tekrar ediyor | SRS 3.7 |

## 4. Test Edilebilirlik Analizi

| Seviye | Sayı | Gereksinimler |
|---|---:|---|
| Yüksek | 16 | REQ-3.1.1, REQ-3.1.2, REQ-3.2.3, REQ-3.2.4, REQ-3.3.1, REQ-3.3.2, REQ-3.3.3, REQ-3.4.1, REQ-3.4.2, REQ-3.4.3, REQ-3.4.6, REQ-3.5.1, REQ-3.5.2, REQ-3.5.3, REQ-3.5.4, REQ-3.7.3 |
| Orta | 17 | REQ-3.1.3, REQ-3.1.4, REQ-3.1.5, REQ-3.2.1, REQ-3.2.2, REQ-3.2.5, REQ-3.3.4, REQ-3.3.5, REQ-3.3.6, REQ-3.4.4, REQ-3.4.5, REQ-3.6.1, REQ-3.6.2, REQ-3.7.1, REQ-3.7.2, REQ-3.7.4, REQ-3.7.5 |
| Düşük | 3 | REQ-3.4.7, REQ-3.4.8, REQ-3.6.3 |

Test edilebilirliği düşük veya netleştirme gerektiren ana noktalar:

| ID | Sorun | Önerilen netleştirme notu |
|---|---|---|
| REQ-3.1.4 | Şifre kuralları "kurallara uymuyorsa" şeklinde geçiyor | Minimum uzunluk, karakter sınıfları, tekrar kontrolü ve hata kodları tanımlanmalı |
| REQ-3.1.5 | Çıkış yapma JWT tabanlı sistemde sunucu tarafı oturum sonlandırması mı, istemci token temizleme mi belirsiz | Beklenen teknik sonuç belirtilmeli |
| REQ-3.2.1 | Anlık boşluk için zaman kaynağı ve durum değerleri net değil | Uygulama saat dilimi, dolu/boş/yakında dolacak eşikleri belirtilmeli |
| REQ-3.2.2 | "Bir sonraki ders saati" program konfigürasyonu ile mi, sabit saatle mi hesaplanacak belirsiz | Slot üretim kuralı ve eşik belirtilmeli |
| REQ-3.3.5 | Arama alanları belirtilmemiş | Her modül için aranabilir alanlar listelenmeli |
| REQ-3.3.6 | Filtre kriterleri belirtilmemiş | Fakülte/bina/kat/dönem/rol gibi kriterler modül bazında ayrılmalı |
| REQ-3.4.4 | PDF yükleme SRS'de var; kodda base64 arka plan görüntüsü var | Desteklenen format ve saklama biçimi kararlaştırılmalı |
| REQ-3.4.7 | "Eğer bu iş kuralını koyacaksan" ifadesi gereksinim değil koşullu not | Tek aktif bölüm admini kuralı kesinleştirilmeli |
| REQ-3.4.8 | Bölüm-sınıf yetkilendirme gereksinimi var; kapsam kuralı kodda fakülte bazında | Yetkilendirme entity/endpoint beklentisi netleşmeli |
| REQ-3.6.1 | Rezervasyon modeli SRS'de ayrı; kodda ek/telafi/iptal ScheduleException olarak uygulanmış | Terminoloji ve kalıcı model eşleştirilmeli |
| REQ-3.6.3 | Başlamış rezervasyon iptali kuralı ölçülebilir değil | İptal son zamanı ve durum geçişleri tanımlanmalı |
| SRS NFR | Performans/responsive gibi maddeler ölçülebilir kabul kriteri içermiyor | Örn. yanıt süresi, viewport seti, erişilebilirlik seviyesi belirtilmeli |

## 5. SRS – ER Tutarsızlıkları

Toplam 9 ana tutarsızlık tespit edildi.

| No | Tespit | Etki |
|---|---|---|
| ER-01 | SRS Role entity `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `LECTURER` der; uygulama `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `ACADEMICIAN` enumunu kullanır. | Rol bazlı test datası ve yetki testleri yanlış rol adıyla kurulabilir |
| ER-02 | Kullanıcı talebindeki STUDENT, ASSISTANT, HOD rolleri SRS 2.2/3.0 ve kodda karşılanmıyor. | Bu roller için test senaryosu üretmek için gereksinim yok |
| ER-03 | SRS Role için ayrı `Role` tablosu tanımlar; kodda rol enum/set alanı olarak tutulur, ayrı role tablosu yoktur. | ER ile fiziksel şema uyuşmuyor |
| ER-04 | SRS `Equipment` ve `ClassroomEquipment` entityleri tanımlar; uygulamada `classrooms.equipment` metin alanı var. | Ekipman bazlı ilişki ve filtre testleri desteklenmez |
| ER-05 | SRS `DepartmentClassroom` entitysi tanımlar; migration/entity/controller seviyesinde ayrı karşılık görülmedi. | Bölüm-derslik yetkilendirme gereksinimi eksik veya farklı uygulanıyor |
| ER-06 | SRS `Reservation` entitysi tanımlar; uygulama `schedule_exceptions` ile `EXTRA`, `MAKEUP`, `CANCELLED` modelini kullanır. | Rezervasyon CRUD/durum testleri doğrudan karşılık bulmaz |
| ER-07 | SRS Classroom koordinatlarını doğrudan Classroom üzerinde gösterir; uygulamada yerleşim `space_objects` ve `slot_layout` ile ayrılmıştır. | ER ve implementasyon yerleşim modeli farklı |
| ER-08 | SRS `WeeklySchedule.classroomId` zorunlu gibi görünür; uygulama online ders için `classroom_id` nullable yapmıştır. | Online ders senaryolarında SRS veri modeli yetersiz kalır |
| ER-09 | SRS veri modeli int ID'ler kullanır; uygulama tüm ana entitylerde UUID kullanır. | Test datası ve API payload tipleri SRS'den farklıdır |

## 6. SRS – Veri Sözlüğü Tutarsızlıkları

Toplam 11 ana tutarsızlık tespit edildi.

| No | Alan / kural | SRS | Mevcut uygulama |
|---|---|---|---|
| DD-01 | Faculty | `facultyName` | `id`, `name`, `code`, `createdAt`, `updatedAt` |
| DD-02 | Building | `buildingName`, `facultyId` | Ek olarak `code`, timestamp alanları |
| DD-03 | Floor | `floorNumber`, `floorPlanImage`, `imageWidth`, `imageHeight` | `name`, `level`; layout görseli `floor_layout` içinde |
| DD-04 | Classroom | Koordinat ve boyut alanları Classroom içinde | `name`, `code`, `capacity`, `type`, `equipment`; koordinat `space_objects` içinde |
| DD-05 | Equipment | Ayrı entity | Metinsel `equipment` alanı |
| DD-06 | User | `fullName`, `institutionalEmail`, `roleId` | `firstName`, `lastName`, `email`, `roles`, `phone`, `title`, `department`, `faculty`, `active` |
| DD-07 | Course | `academicTerm`, `lecturerId` | `semester`, `academicPeriod`, `academician`, `grade`, `courseType`, saat ve öğrenci sayısı alanları |
| DD-08 | WeeklySchedule | `courseId`, `classroomId`, `dayOfWeek`, `timeSlot` | Ek olarak `scheduleGroupId`, `deliveryType`, `classLevel`, `section`, `studentGroup`, `sourceNote` |
| DD-09 | Reservation | Ayrı tablo | `schedule_exceptions` ile temsil ediliyor |
| DD-10 | Enum değerleri | Derslik/Laboratuvar/Amfi metni | `CLASSROOM`, `LABORATORY`, `AMPHITHEATER` |
| DD-11 | Zorunluluklar | Zorunlu/opsiyonel alanlar çoğunlukla belirtilmemiş | DTO/entity validation daha ayrıntılı, SRS ile birebir izlenemiyor |

## 7. SRS – Implementasyon Karşılaştırması

Toplam 15 önemli implementasyon uyumu/gap tespiti yapıldı.

| No | Gereksinim alanı | Durum | İlgili kod |
|---|---|---|---|
| IMPL-01 | Login/refresh/me | Karşılanıyor | `AuthController`, `AuthService`, `SecurityConfig` |
| IMPL-02 | Şifremi unuttum/sıfırlama | Karşılanıyor | `AuthController`, `PasswordResetToken` |
| IMPL-03 | Profil görüntüleme/güncelleme/şifre değiştirme | Karşılanıyor | `ProfileController`, `ProfileService`, `UpdateProfileRequest`, `ChangePasswordRequest` |
| IMPL-04 | Public görüntüleme | Kısmen karşılanıyor | `PublicCampusController`, `PublicCampusService`, public frontend pages |
| IMPL-05 | Anlık durum | Kısmen karşılanıyor | `PublicCampusService.resolveClassroomStatuses`; "bir sonraki ders saatinde boşalacak" ayrı endpoint olarak değil durum etiketiyle yakın |
| IMPL-06 | Fakülte/bina/kat/bölüm yönetimi | Büyük ölçüde karşılanıyor | `FacultyController`, `BuildingController`, `FloorController`, `DepartmentController` |
| IMPL-07 | Kat planı editörü | Karşılanıyor ama model farklı | `FloorController`, `FloorLayoutService`, `SlotLayoutService`, `SpaceObject` |
| IMPL-08 | Sınıf yönetimi | Kısmen karşılanıyor | Sınıf oluşturma daha çok slot/layout akışında; bağımsız ClassroomController yok |
| IMPL-09 | Bölüm-sınıf yetkilendirme | Eksik / farklı | `AccessScopeService` fakülte/bölüm kapsamı uygular; `DepartmentClassroom` modeli yok |
| IMPL-10 | Akademisyen yönetimi | Karşılanıyor | `AcademicianController`, `AcademicianService`, department-admin routes |
| IMPL-11 | Ders yönetimi | Karşılanıyor, SRS'den geniş | `CourseController`, `CourseService`, `Course` |
| IMPL-12 | Haftalık ders programı | Karşılanıyor, SRS'den geniş | `WeeklyScheduleController`, `WeeklyScheduleService`, `WeeklyScheduleRepository` |
| IMPL-13 | Çakışma kontrolü | Karşılanıyor | Derslik, akademisyen, zorunlu sınıf seviyesi, kapasite uyarısı kontrolleri `WeeklyScheduleService` ve `ScheduleExceptionService` içinde |
| IMPL-14 | Rezervasyon | Kısmen/farklı karşılanıyor | SRS Reservation yerine `ScheduleExceptionController` ile cancel/makeup/extra akışı |
| IMPL-15 | Frontend rol akışları | Kısmen karşılanıyor | `roleRoutes.ts`, `ProtectedRoute.tsx`, `router/index.tsx`; yalnızca SUPER_ADMIN, DEPARTMENT_ADMIN, ACADEMICIAN var |

## 8. Rol ve Yetki Gereksinimleri

| Rol | SRS durumu | Implementasyon durumu | Test edilebilirlik |
|---|---|---|---|
| STUDENT | SRS'de tanımlı değil | Kodda yok | Gereksinim olmadığı için test girdisi hazır değil |
| ACADEMICIAN | SRS'de Akademisyen olarak var | Kodda `ACADEMICIAN`; kendi dersleri ve schedule exception işlemleri var | Yüksek |
| ASSISTANT | SRS'de tanımlı değil | Kodda yok | Gereksinim olmadığı için test girdisi hazır değil |
| DEPARTMENT_ADMIN | SRS'de Bölüm Admini olarak var | Kodda `DEPARTMENT_ADMIN`; bölüm/fakülte kapsamı var | Orta-yüksek |
| HOD | SRS'de tanımlı değil | Kodda yok | Gereksinim olmadığı için test girdisi hazır değil |
| SUPER_ADMIN | SRS'de var | Kodda `SUPER_ADMIN`; kampüs, kullanıcı, dönem yönetimi var | Yüksek |
| Misafir | SRS'de giriş yapmayan kullanıcı olarak var | `/api/public/**` ve public frontend routes var | Orta |

Yetki ve veri izolasyonu bulguları:

| No | Tespit |
|---|---|
| AUTH-01 | Backend genel güvenlikte `/api/public/**` public, diğer endpointler JWT gerektiriyor. |
| AUTH-02 | Method-level `@PreAuthorize` kullanılıyor; controller bazlı test edilebilir. |
| AUTH-03 | Department admin scope, kullanıcının `faculty` ve `department` metin alanları üzerinden `AccessScopeService` ile çözülüyor. Bu ilişki FK tabanlı değil. |
| AUTH-04 | Akademisyen kendi dersleri/istisnaları için e-posta ile `Academician` kaydına bağlanıyor. |
| AUTH-05 | Bölüm-derslik yetkilendirme SRS'de ayrı kural; kodda classroom erişimi genellikle aynı fakülte kontrolüyle yapılıyor. |
| AUTH-06 | Frontend route guard yalnızca üç rolü destekliyor; kullanıcı isteğindeki STUDENT/ASSISTANT/HOD için akış yok. |

## 9. Kritik DTS İş Kuralları

Sprint 13 test senaryolarına temel olacak kritik iş kuralları:

| No | İş kuralı | Kaynak / karşılık | Öncelik |
|---|---|---|---|
| BR-01 | Aynı derslik aynı gün/zaman slotunda iki fiziksel derse atanamaz | `uk_weekly_schedules_classroom_day_time`, `WeeklyScheduleService` | High |
| BR-02 | Aynı akademisyen aynı gün/zaman slotunda iki derse atanamaz | `WeeklyScheduleService.findAcademicianConflict` | High |
| BR-03 | Aynı bölüm ve zorunlu sınıf seviyesi aynı slotta çakışmamalı | `findGradeConflict`, Sprint 12.4 notları | High |
| BR-04 | Çoklu slot dersler tüm seçili slotlar için çakışma kontrolünden geçmeli | `slotCount`, `scheduleGroupId` | High |
| BR-05 | Online ders fiziksel dersliğe bağlanmamalı | `DeliveryType.ONLINE`, DB check constraint | High |
| BR-06 | Derslik kapasitesi öğrenci sayısından düşükse uyarı üretir | `CAPACITY_CONFLICT`; mevcut haftalık programda engel değil uyarı | Medium |
| BR-07 | Bölüm admini yalnızca kendi bölüm/fakülte kapsamındaki verilerle işlem yapmalı | `AccessScopeService` | High |
| BR-08 | Akademisyen yalnızca kendi dersi için ek/telafi/iptal oluşturmalı | `ScheduleExceptionService.resolveOwnedSchedule/resolveOwnedCourse` | High |
| BR-09 | Hafta sonu ders istisnası oluşturulamaz | `ScheduleExceptionService.toScheduleDay` | Medium |
| BR-10 | Telafi aynı kaynak ders/tarih için ikinci kez oluşturulamaz | `DUPLICATE_EXCEPTION` | High |
| BR-11 | İptal aynı kaynak ders/tarih için ikinci kez oluşturulamaz | `DUPLICATE_EXCEPTION` | High |
| BR-12 | Kat planı yalnızca Super Admin tarafından düzenlenebilir | `FloorController` `@PreAuthorize` | High |
| BR-13 | Public kullanıcılar yalnızca görüntüleme endpointlerine erişebilir | `SecurityConfig.PUBLIC_ENDPOINTS` | High |
| BR-14 | Aktif akademik dönem yoksa program sorguları hata verir | `WeeklyScheduleService.getSchedules` | Medium |

## 10. Requirement → Test Scenario İzlenebilirliği

Bu bölüm test case değildir; yalnızca ileride senaryo üretilebilirliğini gösterir.

| Requirement | Scenario üretilebilir mi? | İlgili modül | Öncelik |
|---|---|---|---|
| REQ-3.1.1 | Evet | Auth | High |
| REQ-3.1.2 | Evet | Profile | Medium |
| REQ-3.1.3 | Evet | Profile | Medium |
| REQ-3.1.4 | Evet, şifre kuralı netleşirse | Profile/Auth | Medium |
| REQ-3.1.5 | Kısmen | Auth frontend/session | Low |
| REQ-3.2.1 | Evet, zaman kuralı sabitlenirse | Public campus | High |
| REQ-3.2.2 | Kısmen | Public campus | Medium |
| REQ-3.2.3 | Evet | Floor layout | High |
| REQ-3.2.4 | Evet | Floor layout | Medium |
| REQ-3.2.5 | Evet | Classroom | Medium |
| REQ-3.3.1-3.3.6 | Evet, modül bazlı ayrıştırılarak | CRUD/list/search/filter | Medium |
| REQ-3.4.1 | Evet | Faculty | High |
| REQ-3.4.2 | Evet | Building | High |
| REQ-3.4.3 | Evet | Floor | High |
| REQ-3.4.4 | Evet, format kuralı netleşirse | Floor layout | High |
| REQ-3.4.5 | Evet | Classroom/SpaceObject | High |
| REQ-3.4.6 | Evet | Department | High |
| REQ-3.4.7 | Kısmen | User/role | Medium |
| REQ-3.4.8 | Hayır, implementasyon karşılığı netleşmeli | DepartmentClassroom | High |
| REQ-3.5.1 | Evet | Academician management | High |
| REQ-3.5.2 | Evet | Course | High |
| REQ-3.5.3 | Evet | Weekly schedule | High |
| REQ-3.5.4 | Evet | Schedule placement/conflict | High |
| REQ-3.6.1 | Kısmen | Schedule exceptions | High |
| REQ-3.6.2 | Evet | Schedule exceptions | Medium |
| REQ-3.6.3 | Kısmen | Schedule exceptions | Medium |
| REQ-3.7.1-3.7.5 | Evet, REQ-3.2 ile birleştirilerek | Public campus | Medium |

## 11. Açık Noktalar / Netleştirilmesi Gereken Gereksinimler

1. DTS mi STS mi? SRS başlığı ve kapsam metni STS adını kullanırken repo DTS adını kullanıyor.
2. Rol seti kesinleşmeli: SRS ve kod üç ana rol kullanıyor; kullanıcı talebinde STUDENT, ASSISTANT, HOD de geçiyor.
3. `LECTURER` ile `ACADEMICIAN` aynı rol mü, yoksa ayrı rol mü?
4. Bölüm-derslik yetkilendirme için ayrı veri modeli ve endpoint olacak mı, yoksa mevcut fakülte kapsamı yeterli mi?
5. Reservation entity gereksinimi korunacak mı, yoksa `ScheduleException` modeli resmi gereksinim olarak kabul mü edilecek?
6. Ekipman ayrı entity olarak mı, metin alanı olarak mı yönetilecek?
7. Kat planı dosya formatları ve saklama biçimi netleşmeli: PNG/JPG/PDF dosya yolu mu, base64 arka plan mı?
8. Anlık boş/boşalacak sınıf hesaplamasında eşik ve zaman kaynağı netleşmeli.
9. Şifre kuralları ve validation kabul kriterleri netleşmeli.
10. Silme işlemlerinde ilişkili kayıt kısıtları entity bazında listelenmeli.
11. Performans ve responsive gereksinimleri ölçülebilir hale getirilmeli.
12. Akademik dönem ve hafta/tarih kapsamı SRS veri modeline işlenmeli.

## 12. Sprint 13.2 İçin Hazır Girdiler

Hazır test girdisi olarak kullanılabilecek başlıklar:

| Girdi | İlgili gereksinimler | Öncelik |
|---|---|---|
| Auth başarılı/başarısız login, me, refresh, forgot/reset password | REQ-3.1.1, REQ-3.1.4 | High |
| Profil görüntüleme/güncelleme/şifre değiştirme | REQ-3.1.2-3.1.4 | Medium |
| Super Admin kampüs CRUD: fakülte, bina, kat, bölüm | REQ-3.4.1-3.4.3, REQ-3.4.6 | High |
| Kat planı ve derslik yerleşimi | REQ-3.2.3, REQ-3.2.4, REQ-3.4.4, REQ-3.4.5 | High |
| Department Admin akademisyen ve ders yönetimi | REQ-3.5.1, REQ-3.5.2 | High |
| Haftalık ders programı CRUD ve program tamamlama | REQ-3.5.3 | High |
| Derslik, akademisyen, zorunlu sınıf seviyesi ve çoklu slot çakışmaları | REQ-3.5.4, BR-01-BR-04 | High |
| Online/fiziksel ders ayrımı | BR-05 | High |
| Kapasite uyarısı | BR-06 | Medium |
| Akademisyen ek ders/telafi/iptal akışları | REQ-3.6.1-3.6.3 | High |
| Public kampüs görüntüleme ve program sayfaları | REQ-3.2.1-3.2.5, REQ-3.7.1-3.7.5 | Medium |
| Rol ve erişim kontrolü negatif senaryoları | AUTH-01-AUTH-06 | High |

Özet sayılar:

| Metrik | Sayı |
|---|---:|
| İncelenen SRS use case gereksinimi | 36 |
| Test edilebilirliği yüksek gereksinim | 16 |
| Test edilebilirliği orta gereksinim | 17 |
| Test edilebilirliği düşük gereksinim | 3 |
| SRS-ER tutarsızlığı | 9 |
| SRS-Veri Sözlüğü tutarsızlığı | 11 |
| SRS-Implementasyon tespiti | 15 |
| Kritik DTS iş kuralı | 14 |

