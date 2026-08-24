# Sprint 13.2 – Test Senaryosu ve Test Case Tasarımı

## 1. Kapsam

Bu doküman Sprint 13.1 gereksinim doğrulama çıktısından hareketle DTS için yüksek seviyeli test senaryolarını ve ayrıntılı test case tasarımlarını tanımlar. Bu sprintte otomasyon kodu yazılmaz, test çalıştırılmaz, actual result ve status alanları doldurulmaz.

Tasarım, yalnızca dokümanlarda ve mevcut implementasyonda karşılığı görülen rolleri ve iş kurallarını kapsar: `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `ACADEMICIAN` ve public/misafir kullanıcı. Sprint 13.1'de karşılığı bulunmayan `STUDENT`, `ASSISTANT` ve `HOD` rolleri için test case üretilmemiştir.

## 2. Kullanılan Kaynaklar

| Kaynak | Kullanım amacı |
|---|---|
| `docs/testing/SPRINT_13_1_REQUIREMENT_ANALYSIS.md` | Requirement ID, business rule, tutarsızlık ve Sprint 13.2 hazır girdileri |
| `SRS 2.md` | Use case akışları, aktörler, veri sözlüğü |
| `docs/SPRINT_12_4_TEST_SCENARIOS.md` | Çakışma edge-case notları |
| `backend/src/main/java/com/dts/dersliktakip/controller/*` | Endpoint ve `@PreAuthorize` karşılıkları |
| `backend/src/main/java/com/dts/dersliktakip/service/*` | Çakışma, kapasite, veri izolasyonu, istisna ders kuralları |
| `backend/src/main/java/com/dts/dersliktakip/dto/*` | Zorunlu alan, uzunluk, format ve sınır doğrulamaları |
| `backend/src/main/java/com/dts/dersliktakip/entity/*` | Role, derslik türü, online/fiziksel, program ve istisna veri modeli |
| `frontend/src/router/index.tsx`, `ProtectedRoute.tsx`, `roleRoutes.ts` | Frontend role route ve public/protected akışları |

## 3. Test Tasarım Yaklaşımı

Bu dokümanda 24 test senaryosu ve 72 test case tasarlandı. Test case sayısı, her gereksinime mekanik olarak test üretmek yerine risk, iş etkisi ve Sprint 13.1'deki kritik iş kurallarına göre sınırlandırıldı.

Kullanılan teknikler:

| Teknik | Kullanım alanı | Neden uygun |
|---|---|---|
| Eşdeğer Sınıflandırma | Rol türleri, derslik türleri, online/fiziksel ders, geçerli/geçersiz form verileri, filtreler | Aynı davranışı üretmesi beklenen çok sayıda veri tek temsilci değerle kapsanabilir |
| Sınır Değer Analizi | Şifre min 8, isim/kod uzunlukları, slot count 1-12, saat formatı, kapasite eşit/alt/üst durumu | Sistem bazı sayısal veya uzunluk sınırlarını açıkça tanımlar |
| Karar Tablosu | Program oluşturma, çakışma kontrolü, online/fiziksel ders, rol + kapsam + işlem, istisna ders | Birden fazla koşul birlikte beklenen sonucu belirler |

Notlar:

| Konu | Yaklaşım |
|---|---|
| Belirsiz gereksinimler | Varsayım eklenmedi; test case içinde "netleştirilmeli" olarak işaretlendi |
| Çakışma testleri | Sprint 12.4 notlarındaki desteklenen/desteklenmeyen durumlar korunarak tasarlandı |
| Actual Result | Her test case için "Test yürütme sırasında doldurulacak" |
| Status | Her test case için "Test yürütme sırasında doldurulacak" |

## 4. Test Senaryoları

| Scenario ID | Test senaryosu | Requirement / BR | Modül | Öncelik |
|---|---|---|---|---|
| TS-001 | Kullanıcı sisteme geçerli/geçersiz kimlik bilgileriyle giriş yapabilmelidir veya reddedilmelidir | REQ-3.1.1 | Auth | High |
| TS-002 | Kullanıcı profilini görüntüleyebilmeli, güncelleyebilmeli ve şifresini değiştirebilmelidir | REQ-3.1.2, REQ-3.1.3, REQ-3.1.4 | Profile | Medium |
| TS-003 | Super Admin fakülte kayıtlarını yönetebilmelidir | REQ-3.4.1 | Faculty | High |
| TS-004 | Super Admin bina kayıtlarını ilgili fakülte altında yönetebilmelidir | REQ-3.4.2 | Building | High |
| TS-005 | Super Admin kat kayıtlarını ilgili bina altında yönetebilmelidir | REQ-3.4.3 | Floor | High |
| TS-006 | Super Admin kat planı ve derslik yerleşimi yönetebilmelidir | REQ-3.4.4, REQ-3.4.5, BR-12 | Floor layout | High |
| TS-007 | Derslik türü, kapasite ve ekipman bilgileri geçerli veri sınıflarıyla yönetilmelidir | REQ-3.2.5, REQ-3.4.5 | Classroom | Medium |
| TS-008 | Super Admin bölüm kayıtlarını yönetebilmelidir | REQ-3.4.6 | Department | High |
| TS-009 | Bölüm Admini kendi kapsamındaki akademisyenleri yönetebilmelidir | REQ-3.5.1, BR-07 | Academician | High |
| TS-010 | Bölüm Admini kendi kapsamındaki dersleri yönetebilmelidir | REQ-3.5.2, BR-07 | Course | High |
| TS-011 | Haftalık ders programı geçerli ön koşullarla oluşturulabilmelidir | REQ-3.5.3, REQ-3.5.4 | Weekly schedule | High |
| TS-012 | Aynı derslik aynı slotta ikinci derse atanamamalıdır | REQ-3.5.4, BR-01 | Conflict | High |
| TS-013 | Aynı akademisyen aynı slotta ikinci derse atanamamalıdır | REQ-3.5.4, BR-02 | Conflict | High |
| TS-014 | Aynı bölüm ve zorunlu sınıf seviyesi çakışması engellenmelidir | REQ-3.5.4, BR-03 | Conflict | High |
| TS-015 | Çoklu slot dersler tüm seçili slotlarda çakışma kontrolünden geçmelidir | REQ-3.5.4, BR-04 | Conflict | High |
| TS-016 | Arka arkaya dersler çakışma sayılmamalı, desteklenmeyen hafta/aralık durumları ayrılmalıdır | REQ-3.5.4 | Conflict | Medium |
| TS-017 | Online ve fiziksel ders kaynak ilişkisi doğru uygulanmalıdır | BR-05 | Schedule | High |
| TS-018 | Derslik kapasitesi öğrenci sayısına göre uyarı üretmelidir | BR-06 | Capacity | Medium |
| TS-019 | Akademisyen ek ders oluştururken sahiplik, tarih, slot ve çakışma kuralları uygulanmalıdır | REQ-3.6.1, BR-08, BR-09 | Schedule exceptions | High |
| TS-020 | Akademisyen telafi oluştururken kaynak ders ve hedef slot kuralları uygulanmalıdır | REQ-3.6.1, BR-08, BR-10 | Schedule exceptions | High |
| TS-021 | Akademisyen ders iptali oluştururken sahiplik ve tekrar kuralı uygulanmalıdır | REQ-3.6.3, BR-08, BR-11 | Schedule exceptions | High |
| TS-022 | Public kullanıcı fakülte/bina/kat/derslik/program bilgilerini görüntüleyebilmelidir | REQ-3.2.1-REQ-3.2.5, REQ-3.7.1-REQ-3.7.5, BR-13 | Public | Medium |
| TS-023 | Rol bazlı erişim ve frontend route guard yetkisiz erişimi engellemelidir | AUTH-01, AUTH-02, AUTH-06 | Authorization | High |
| TS-024 | Veri izolasyonu bölüm/fakülte/akademisyen kapsamını korumalıdır | AUTH-03, AUTH-04, AUTH-05, BR-07, BR-08 | Authorization | High |

## 5. Test Case'ler

| Test Case ID | Req/BR | Scenario | Test case açıklaması | Teknik | Tekniğin seçilme nedeni | Ön koşullar | Test adımları | Test verisi | Beklenen sonuç | Öncelik | Severity | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-001-01 | REQ-3.1.1 | TS-001 | Aktif kullanıcı geçerli e-posta ve şifreyle giriş yapar | Eşdeğer Sınıflandırma | Geçerli kimlik bilgileri aynı başarı davranışını üretir | Aktif kullanıcı vardır | Login ekranı açılır; e-posta/şifre girilir; giriş yapılır | `admin@dts.local`, geçerli şifre | Token döner ve rolüne uygun dashboard'a yönlenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-001-02 | REQ-3.1.1 | TS-001 | Hatalı şifreyle giriş reddedilir | Eşdeğer Sınıflandırma | Geçersiz kimlik bilgileri aynı ret davranışını üretir | Kullanıcı vardır | Login ekranı açılır; doğru e-posta/hatalı şifre girilir | Geçerli e-posta, hatalı şifre | Giriş reddedilir ve kullanıcı bilgilendirilir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-001-03 | REQ-3.1.1 | TS-001 | Eksik e-posta veya şifreyle giriş formu reddedilir | Eşdeğer Sınıflandırma | Eksik zorunlu alanlar aynı validation sınıfındadır | Yok | Login formu boş/eksik gönderilir | Boş e-posta veya boş şifre | Form/API doğrulaması hata üretir | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-002-01 | REQ-3.1.2 | TS-002 | Giriş yapan kullanıcı profilini görüntüler | Eşdeğer Sınıflandırma | Geçerli oturumlu tüm roller profil görüntüleme davranışını paylaşır | Kullanıcı giriş yapmış | Profil sayfası açılır | SUPER_ADMIN veya DEPARTMENT_ADMIN veya ACADEMICIAN | Profil bilgileri görüntülenir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-002-02 | REQ-3.1.3 | TS-002 | Profilde zorunlu ad/soyad boş bırakıldığında güncelleme reddedilir | Eşdeğer Sınıflandırma | Boş zorunlu alanlar geçersiz veri sınıfıdır | Kullanıcı giriş yapmış | Profil düzenlenir; ad veya soyad boş bırakılır; kaydedilir | `firstName=""` veya `lastName=""` | Güncelleme yapılmaz, validation hatası gösterilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-002-03 | REQ-3.1.4 | TS-002 | Yeni şifre 7 karakter olduğunda reddedilir | Sınır Değer Analizi | Kodda minimum şifre uzunluğu 8 olarak tanımlıdır; sınırın hemen altı kontrol edilir | Kullanıcı giriş yapmış | Şifre değiştirme açılır; yeni şifre 7 karakter girilir | `Abc123*` | Şifre değişmez, minimum uzunluk hatası alınır | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-002-04 | REQ-3.1.4 | TS-002 | Yeni şifre 8 karakter olduğunda kabul edilebilir sınıra girer | Sınır Değer Analizi | Minimum sınır değeri doğrulanır | Kullanıcı giriş yapmış, mevcut şifre doğru | Şifre değiştirme açılır; 8 karakterli yeni şifre girilir | `Abc123**` | Şifre değişikliği kabul edilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-003-01 | REQ-3.4.1 | TS-003 | Super Admin geçerli fakülte oluşturur | Eşdeğer Sınıflandırma | Geçerli ad ve kod aynı başarı sınıfındadır | SUPER_ADMIN giriş yapmış | Fakülte ekleme formu doldurulur; kaydedilir | `name=Test Fakültesi`, `code=TFK` | Fakülte oluşturulur ve listede görünür | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-003-02 | REQ-3.4.1 | TS-003 | Fakülte adı 255 karakter sınırında kabul edilir | Sınır Değer Analizi | DTO `name` için 255 üst sınır tanımlar | SUPER_ADMIN giriş yapmış | 255 karakter ad ile fakülte oluşturulur | 255 karakterlik ad, geçerli code | Kayıt kabul edilir | Medium | Minor | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-003-03 | REQ-3.4.1 | TS-003 | Fakülte adı 256 karakter olduğunda reddedilir | Sınır Değer Analizi | Üst sınırın hemen üstü validation davranışını gösterir | SUPER_ADMIN giriş yapmış | 256 karakter ad ile fakülte oluşturulur | 256 karakterlik ad | Kayıt reddedilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-004-01 | REQ-3.4.2 | TS-004 | Super Admin geçerli bina oluşturur | Eşdeğer Sınıflandırma | Geçerli fakülteye bağlı geçerli bina verisi başarı sınıfıdır | SUPER_ADMIN giriş yapmış, fakülte var | Fakülte altında bina eklenir | `name=A Blok Test`, `code=A-TST` | Bina oluşturulur | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-004-02 | REQ-3.4.2 | TS-004 | Olmayan fakülte altında bina oluşturma reddedilir | Negatif Eşdeğer Sınıflandırma | Tanımsız FK/geçersiz kayıt aynı hata sınıfındadır | SUPER_ADMIN giriş yapmış | Geçersiz fakülte ID ile bina eklenir | Var olmayan `facultyId` | Kayıt oluşturulmaz, hata döner | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-005-01 | REQ-3.4.3 | TS-005 | Super Admin geçerli kat oluşturur | Eşdeğer Sınıflandırma | Geçerli bina ve kat bilgisi başarı sınıfıdır | SUPER_ADMIN giriş yapmış, bina var | Bina detayında kat eklenir | `name=1. Kat`, `level=1` | Kat oluşturulur | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-005-02 | REQ-3.4.3 | TS-005 | Kat adı 101 karakter olduğunda reddedilir | Sınır Değer Analizi | DTO `name` için 100 karakter üst sınırı vardır | SUPER_ADMIN giriş yapmış | 101 karakter kat adı ile kaydet | 101 karakterlik `name` | Kayıt reddedilir | Medium | Minor | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-006-01 | REQ-3.4.4, BR-12 | TS-006 | Super Admin kat planı düzenleyebilir | Karar Tablosu | Rol ve işlem tipi birlikte sonucu belirler | SUPER_ADMIN giriş yapmış, kat var | Kat editörüne gidilir; layout kaydedilir | Geçerli layout nesneleri | Layout kaydedilir | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-006-02 | BR-12 | TS-006 | Department Admin kat planı düzenleyemez | Karar Tablosu | Aynı işlem farklı rolle farklı sonuç üretir | DEPARTMENT_ADMIN giriş yapmış | Kat planı kaydetme denenir | Geçerli layout payload | İşlem yetki hatasıyla reddedilir | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-006-03 | REQ-3.4.4 | TS-006 | Desteklenmeyen kat planı formatı için gereksinim netleştirilmelidir | Sınır/Belirsizlik Analizi | SRS PNG/JPG/PDF der; implementasyon base64 modelinde format ayrımı net değildir | SUPER_ADMIN giriş yapmış | PDF veya desteklenmeyen format yükleme beklenir | PDF veya farklı MIME | Beklenen sonuç gereksinim netleştirmesine bağlıdır | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-007-01 | REQ-3.4.5 | TS-007 | Derslik türü geçerli enum değerlerinden biri olduğunda kabul edilir | Eşdeğer Sınıflandırma | `CLASSROOM`, `LABORATORY`, `AMPHITHEATER` geçerli sınıflardır | SUPER_ADMIN giriş yapmış, kat var | Derslik ekleme formunda tür seçilir | `CLASSROOM` | Derslik oluşturulur | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-007-02 | REQ-3.4.5 | TS-007 | Geçersiz derslik türü reddedilir | Eşdeğer Sınıflandırma | Enum dışı tüm değerler aynı geçersiz sınıftadır | SUPER_ADMIN giriş yapmış | API/form ile enum dışı tür gönderilir | `OFFICE` | Kayıt reddedilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-007-03 | REQ-3.4.5 | TS-007 | Derslik kapasitesi boş olduğunda reddedilir | Eşdeğer Sınıflandırma | Zorunlu kapasite alanı eksik veri sınıfıdır | SUPER_ADMIN giriş yapmış | Derslik kapasitesi boş kaydedilir | `capacity=null` | Kayıt reddedilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-008-01 | REQ-3.4.6 | TS-008 | Super Admin geçerli bölüm oluşturur | Eşdeğer Sınıflandırma | Geçerli fakülte, ad ve code başarı sınıfındadır | SUPER_ADMIN giriş yapmış, fakülte var | Bölüm ekleme formu doldurulur | `name=Bilgisayar Test`, `code=CENGT` | Bölüm oluşturulur | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-008-02 | REQ-3.4.6 | TS-008 | Bölüm kodu boş olduğunda reddedilir | Eşdeğer Sınıflandırma | Boş zorunlu alan geçersiz sınıftır | SUPER_ADMIN giriş yapmış | Bölüm kodu boş gönderilir | `code=""` | Kayıt reddedilir | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-009-01 | REQ-3.5.1, BR-07 | TS-009 | Bölüm Admini kendi bölümüne akademisyen ekler | Karar Tablosu | Rol ve bölüm kapsamı sonucu belirler | DEPARTMENT_ADMIN giriş yapmış, bölüm scope'u var | Akademisyen ekleme formu doldurulur | Geçerli ad, soyad, e-posta, unvan | Akademisyen kendi bölümünde oluşturulur | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-009-02 | REQ-3.5.1, BR-07 | TS-009 | Bölüm Admini başka bölüm akademisyenini yönetemez | Karar Tablosu | Rol yeterli olsa bile veri kapsamı sonucu değiştirir | İki farklı bölüm vardır | Başka bölüm akademisyen kaydı güncellenir/silinir | Farklı bölüm akademisyen ID | İşlem erişim hatasıyla reddedilir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-009-03 | REQ-3.5.1 | TS-009 | Aynı e-posta ile ikinci akademisyen oluşturulamaz | Eşdeğer Sınıflandırma | Duplicate unique alan sınıfı yönetilir | Aynı e-postalı akademisyen vardır | Aynı e-posta ile yeni kayıt gönderilir | Mevcut e-posta | Kayıt reddedilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-010-01 | REQ-3.5.2 | TS-010 | Bölüm Admini kendi bölümünde ders oluşturur | Karar Tablosu | Rol, bölüm scope'u, akademisyen ve dönem birlikte sonucu belirler | DEPARTMENT_ADMIN, akademisyen ve dönem var | Ders formu kaydedilir | Geçerli ders kodu, ad, akademisyen, dönem | Ders oluşturulur | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-010-02 | REQ-3.5.2, BR-07 | TS-010 | Akademisyen kendi dersini görüntüler fakat yönetim işlemi yapamaz | Karar Tablosu | Rol ve işlem tipi birlikte sonucu belirler | ACADEMICIAN giriş yapmış | Ders listeleme ve ders oluşturma denenir | Akademisyene ait ders | Listeleme başarılı, yönetim işlemi yetkiyle reddedilir | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-011-01 | REQ-3.5.3, REQ-3.5.4 | TS-011 | Bölüm Admini geçerli ders, gün, slot ve derslik ile haftalık program oluşturur | Karar Tablosu | Ders, derslik, gün, slot ve scope koşulları birlikte sonucu belirler | Ders, akademisyen, derslik ve aktif dönem var | Program ekranında derslik atanır | Pazartesi `08:15-09:00`, uygun derslik | Program kaydı oluşturulur | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-011-02 | REQ-3.5.3, BR-14 | TS-011 | Aktif akademik dönem yoksa program sorgusu hata verir | Karar Tablosu | Aktif dönem var/yok koşulu sonucu belirler | Aktif dönem bulunmaz | Program listesi veya oluşturma öncesi durum sorgulanır | `periodId=null` | "Aktif dönem bulunamadı" benzeri hata alınır | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-011-03 | REQ-3.5.4 | TS-011 | Geçersiz gün değeri program oluşturmayı reddeder | Eşdeğer Sınıflandırma | MONDAY-FRIDAY dışındaki günler geçersiz sınıftadır | DEPARTMENT_ADMIN giriş yapmış | Program oluşturma isteği gönderilir | `dayOfWeek=SATURDAY` | Geçersiz gün hatası alınır | High | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-011-04 | REQ-3.5.4 | TS-011 | `slotCount=0` haftalık programda reddedilir | Sınır Değer Analizi | Kod haftalık program için 1-12 sınırını uygular; hemen alt sınır kontrol edilir | DEPARTMENT_ADMIN giriş yapmış | Program oluşturma isteği gönderilir | `slotCount=0` | Hata alınır | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-011-05 | REQ-3.5.4 | TS-011 | `slotCount=12` haftalık programda üst sınır olarak değerlendirilir | Sınır Değer Analizi | 12 açıkça üst sınırdır | DEPARTMENT_ADMIN giriş yapmış, yeterli ardışık slot varsayılamaz | 12 slotluk program oluşturma denenir | `slotCount=12` | Yeterli slot varsa kabul edilir, program bitişini aşarsa reddedilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-011-06 | REQ-3.5.4 | TS-011 | `slotCount=13` haftalık programda reddedilir | Sınır Değer Analizi | Üst sınırın hemen üstü validation/servis hatasını gösterir | DEPARTMENT_ADMIN giriş yapmış | Program oluşturma isteği gönderilir | `slotCount=13` | Hata alınır | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-012-01 | BR-01 | TS-012 | Aynı derslik aynı gün ve aynı slotta ikinci programa atanamaz | Karar Tablosu | Derslik, gün ve slot aynı olduğunda sonuç çatışmadır | İlk program kaydı vardır | Aynı derslik/gün/slot için ikinci kayıt denenir | D101, MONDAY, `08:15-09:00` | İşlem `CLASSROOM_CONFLICT` ile reddedilir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-012-02 | BR-01 | TS-012 | Aynı derslik farklı gün aynı slotta kullanılabilir | Karar Tablosu | Gün farklı olduğunda aynı derslik/slot farklı davranış üretir | İlk program pazartesi vardır | Salı aynı slot ve derslik atanır | D101, TUESDAY, `08:15-09:00` | Çakışma oluşmaz | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-013-01 | BR-02 | TS-013 | Aynı akademisyen aynı gün ve slotta iki derse atanamaz | Karar Tablosu | Akademisyen, gün ve slot aynıysa çakışma doğar | Akademisyenin ilk dersi vardır | Aynı akademisyen için ikinci ders atanır | Aynı akademisyen, MONDAY, `08:15-09:00` | `ACADEMICIAN_CONFLICT` beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-013-02 | BR-02 | TS-013 | Aynı akademisyen farklı slotta ikinci derse atanabilir | Karar Tablosu | Slot farklılığı çakışma koşulunu kaldırır | Akademisyenin ilk dersi vardır | Farklı slotta ikinci ders atanır | `09:10-09:55` | Çakışma oluşmaz | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-014-01 | BR-03 | TS-014 | Aynı bölümde aynı zorunlu sınıf seviyesi aynı slotta çakışır | Karar Tablosu | Course type, bölüm, grade ve slot birlikte sonucu belirler | CENG 1. sınıf zorunlu ders vardır | CENG 1. sınıf başka zorunlu ders aynı slota atanır | `courseType=ZORUNLU`, `grade=1` | `STUDENT_GROUP_CONFLICT` beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-014-02 | BR-03 | TS-014 | Seçmeli ders için aynı sınıf seviyesi kuralı uygulanmaz | Karar Tablosu | Course type farklı olduğunda grade çakışması sonucu değişir | Aynı bölüm/grade dersi vardır | Seçmeli ders aynı slota atanır | `courseType=SEÇMELI` | Sınıf seviyesi çakışması beklenmez | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-015-01 | BR-04 | TS-015 | Çoklu slot dersin herhangi bir slotu doluysa atama reddedilir | Karar Tablosu | Çoklu slotta her alt slot ayrı koşuldur | İkinci slotta mevcut çakışma vardır | 2 slotluk ders birinci slottan başlatılır | `slotCount=2`, ikinci slot dolu | İşlem çakışma ile reddedilir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-015-02 | BR-04 | TS-015 | Tam kapsama çakışması reddedilir | Karar Tablosu | Bir program başka program aralığını kapsadığında ortak slot vardır | İç slotta mevcut ders vardır | Dış program 3 slot olarak atanır | Perşembe 3 slot | Ortak slot nedeniyle çakışma beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-015-03 | BR-04 | TS-015 | Aynı başlangıçlı çoklu slot çakışması reddedilir | Karar Tablosu | Başlangıç slotu ortak olduğundan aynı davranış üretir | Başlangıç slotunda ders vardır | Aynı başlangıçla yeni çoklu slot atanır | Cuma `08:15-09:00` başlangıç | Çakışma beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-015-04 | BR-04 | TS-015 | Aynı bitişli çoklu slot çakışması reddedilir | Karar Tablosu | Bitiş slotu ortak olduğunda ortak slot vardır | Bitiş slotunda ders vardır | Aynı bitişe gelen yeni çoklu slot atanır | Salı bitiş `09:55` | Çakışma beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-016-01 | REQ-3.5.4 | TS-016 | Arka arkaya ders aynı derslikte çakışma sayılmaz | Sınır Değer Analizi | Bitiş ve bir sonraki başlangıç sınırındaki ayrık slotlar kontrol edilir | İlk ders `08:15-09:00` vardır | Aynı dersliğe `09:10-09:55` atanır | Ardışık slotlar | Çakışma oluşmaz | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-016-02 | REQ-3.5.4 | TS-016 | Farklı hafta senaryosu desteklenmiyor olarak işaretlenir | Belirsizlik Analizi | WeeklySchedule modelinde hafta/tarih alanı yoktur | Yok | Haftaya özel tekrar eden program beklenir | Farklı hafta | Test otomasyonu öncesi gereksinim/model netleştirilmeli | Low | Minor | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-017-01 | BR-05 | TS-017 | Online ders derslik olmadan geçerli kabul edilir | Karar Tablosu | Delivery type ve classroom var/yok birlikte sonucu belirler | Online ders kaydı destekleyen veri hazırlanır | Online program kaydı değerlendirilir | `deliveryType=ONLINE`, `classroomId=null` | Fiziksel kaynak çakışması oluşmaz | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-017-02 | BR-05 | TS-017 | Online ders fiziksel derslikle verildiğinde reddedilir | Karar Tablosu | Online + classroom kombinasyonu DB check kuralına aykırıdır | Online ders payload'ı hazırlanır | Derslik ID ile online kayıt denenir | `deliveryType=ONLINE`, `classroomId=D101` | İşlem reddedilir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-017-03 | BR-05 | TS-017 | Fiziksel ders derslikle geçerli kabul edilir | Karar Tablosu | Fiziksel + classroom beklenen normal kombinasyondur | Uygun derslik vardır | Fiziksel ders atanır | `deliveryType=FACE_TO_FACE`, `classroomId=D101` | Program oluşturulur | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-017-04 | BR-05 | TS-017 | Fiziksel ders dersliksiz olduğunda haftalık program DTO'su açısından reddedilir | Karar Tablosu | Fiziksel ders için classroom zorunluluğu mevcut DTO/modelde beklenir | DEPARTMENT_ADMIN giriş yapmış | Classroom ID olmadan fiziksel program oluşturulur | `classroomId=null` | Validation veya servis hatası beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-018-01 | BR-06 | TS-018 | Derslik kapasitesi öğrenci sayısına eşitse kapasite uyarısı çıkmaz | Sınır Değer Analizi | Kapasite kararında eşitlik sınır değerdir | Ders ve derslik vardır | Uygun derslik sorgulanır | `capacity=studentCount` | Kapasite yeterli kabul edilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-018-02 | BR-06 | TS-018 | Derslik kapasitesi öğrenci sayısından 1 eksikse uyarı çıkar | Sınır Değer Analizi | Sınırın hemen altı yetersizlik davranışını tetikler | Ders ve derslik vardır | Uygun derslik sorgulanır | `capacity=studentCount-1` | Kapasite uyarısı üretilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-018-03 | BR-06 | TS-018 | Derslik kapasitesi öğrenci sayısından 1 fazlaysa uyarı çıkmaz | Sınır Değer Analizi | Sınırın hemen üstü yeterlilik davranışını doğrular | Ders ve derslik vardır | Uygun derslik sorgulanır | `capacity=studentCount+1` | Kapasite uyarısı çıkmaz | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-019-01 | REQ-3.6.1, BR-08 | TS-019 | Akademisyen kendi dersine ek ders oluşturur | Karar Tablosu | Sahiplik, tarih, slot, derslik ve çakışma birlikte sonucu belirler | ACADEMICIAN giriş yapmış, kendi dersi var | Ek ders oluşturulur | Geçerli tarih, slot, derslik | Ek ders kaydı oluşur | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-019-02 | BR-08 | TS-019 | Akademisyen başkasının dersi için ek ders oluşturamaz | Karar Tablosu | Rol doğru olsa bile sahiplik yoksa işlem reddedilir | Başka akademisyene ait ders var | Ek ders oluşturma denenir | Başkasına ait `courseId` | Erişim hatası beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-019-03 | BR-09 | TS-019 | Hafta sonu ek ders/telafi oluşturulamaz | Eşdeğer Sınıflandırma | Cumartesi/Pazar hafta sonu geçersiz tarih sınıfıdır | ACADEMICIAN giriş yapmış | Hafta sonuna istisna oluşturulur | Cumartesi tarih | İşlem reddedilir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-019-04 | REQ-3.6.1 | TS-019 | Ek ders `slotCount=13` için mevcut DTO tarafından reddedilir | Sınır Değer Analizi | DTO `@Min(1) @Max(12)` sınırını açıkça tanımlar | ACADEMICIAN giriş yapmış | Ek ders payload'ı gönderilir | `slotCount=13` | Validation hatası beklenir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-020-01 | REQ-3.6.1, BR-10 | TS-020 | Akademisyen kendi dersinden telafi oluşturur | Karar Tablosu | Kaynak ders sahipliği, orijinal tarih, hedef tarih ve slot sonucu belirler | ACADEMICIAN giriş yapmış, kendi weekly schedule kaydı var | Telafi oluşturulur | Geçerli `scheduleId`, `originalDate`, `makeupDate` | Telafi kaydı oluşur | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-020-02 | BR-10 | TS-020 | Aynı kaynak ders/tarih için ikinci telafi reddedilir | Karar Tablosu | Duplicate telafi koşulu özel sonuç üretir | İlk telafi kaydı vardır | Aynı kaynak/tarih için tekrar telafi denenir | Aynı `scheduleId`, aynı `originalDate` | `DUPLICATE_EXCEPTION` beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-020-03 | REQ-3.6.1 | TS-020 | Telafi hedef slotu başka dersle çakışırsa reddedilir | Karar Tablosu | Hedef tarih/slot, derslik, akademisyen ve sınıf seviyesi birlikte sonucu belirler | Hedef slotta çakışma vardır | Telafi aynı hedef slota alınır | Dolu derslik veya akademisyen | Çakışma hatası beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-021-01 | REQ-3.6.3, BR-11 | TS-021 | Akademisyen kendi dersini geçerli tarihte iptal eder | Karar Tablosu | Sahiplik ve tarih-gün eşleşmesi sonucu belirler | ACADEMICIAN giriş yapmış, kendi schedule kaydı var | İptal oluşturulur | Schedule günüyle eşleşen tarih | İptal kaydı oluşur | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-021-02 | BR-11 | TS-021 | Aynı ders/tarih için ikinci iptal reddedilir | Karar Tablosu | Duplicate iptal özel hata üretir | İlk iptal kaydı vardır | Aynı ders/tarih için iptal tekrar edilir | Aynı `scheduleId`, aynı tarih | `DUPLICATE_EXCEPTION` beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-021-03 | REQ-3.6.3 | TS-021 | Başlamış dersin iptali için beklenen davranış netleştirilmeli | Belirsizlik Analizi | SRS kuralı var, ölçülebilir zaman sınırı yok | Ders başlamış kabul edilir | İptal denenir | Geçmiş/başlamış ders tarihi | Gereksinim netleştirmesi gerekir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-022-01 | BR-13 | TS-022 | Misafir kullanıcı fakülte, bina ve kat listesini görüntüler | Eşdeğer Sınıflandırma | Public listeleme endpointleri aynı görüntüleme sınıfındadır | Sistem çalışır | Public sayfa açılır; fakülte/bina/kat seçilir | Geçerli public seçimler | Veriler listelenir, auth gerekmez | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-022-02 | REQ-3.2.3, REQ-3.7.3 | TS-022 | Misafir kullanıcı kat planını ve derslik konumlarını görüntüler | Eşdeğer Sınıflandırma | Tanımlı kat planları aynı başarı sınıfındadır | Kat planı tanımlı | Kat planı sayfası açılır | Geçerli building/floor ID | Plan ve derslik nesneleri görünür | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-022-03 | REQ-3.2.5, REQ-3.7.5 | TS-022 | Var olmayan derslik için public program isteği hata döndürür | Negatif Eşdeğer Sınıflandırma | Olmayan kayıtlar aynı hata sınıfıdır | Yok | Public derslik programı istenir | Var olmayan `classroomId` | Not found/hata mesajı beklenir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-022-04 | REQ-3.2.1 | TS-022 | Anlık durum değerleri görünür fakat eşik gereksinimi netleştirilmelidir | Belirsizlik Analizi | SRS "anlık" ve "boşalacak" eşiğini ölçülebilir tanımlamaz | Public kat görünümü var | Kat görünümü açılır | Şu an dolu/boş/yakında dolacak derslik | Durum etiketi görünür; kesin eşik için gereksinim netleşmeli | Medium | Minor | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-023-01 | AUTH-01, AUTH-02 | TS-023 | Kimlik doğrulanmamış kullanıcı protected endpoint'e erişemez | Karar Tablosu | Auth var/yok ve endpoint tipi sonucu belirler | Kullanıcı login değildir | Protected endpoint/sayfa açılır | `/api/schedules` veya dashboard | 401 veya login yönlendirmesi beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-023-02 | AUTH-02, BR-12 | TS-023 | Department Admin Super Admin işlemine erişemez | Karar Tablosu | Rol ve işlem tipi birlikte sonucu belirler | DEPARTMENT_ADMIN giriş yapmış | Fakülte oluşturma veya layout kaydetme denenir | Super Admin endpoint | 403/route redirect beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-023-03 | AUTH-06 | TS-023 | Frontend route guard yetkisiz rolü kendi dashboard'una yönlendirir | Karar Tablosu | Role ve allowedRoles birlikte route sonucunu belirler | ACADEMICIAN giriş yapmış | `/department-admin/ders-programi` açılır | ACADEMICIAN oturumu | Akademisyen dashboard'una yönlenir | Medium | Major | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-024-01 | AUTH-03, BR-07 | TS-024 | Department Admin kendi bölüm programını görüntüler | Karar Tablosu | Rol ve scope eşleşince erişim verilir | DEPARTMENT_ADMIN scope'u tanımlı | Program listesi açılır | Kendi bölüm ID | Program listesi döner | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-024-02 | AUTH-03, BR-07 | TS-024 | Department Admin başka fakülte/bölüm dersliğini programa atayamaz | Karar Tablosu | Scope dışı derslik yetki hatası üretir | İki fakülte/bölüm vardır | Scope dışı derslik ile program oluşturulur | Başka fakülte `classroomId` | Erişim hatası beklenir | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |
| TC-024-03 | AUTH-04, BR-08 | TS-024 | Akademisyen yalnızca kendi ders ve istisnalarını görüntüler | Karar Tablosu | E-posta ile akademisyen sahipliği sonucu belirler | ACADEMICIAN giriş yapmış | Ders/istisna listesi açılır | Kendi akademisyen hesabı | Sadece kendi kayıtları görünür | High | Critical | Test yürütme sırasında doldurulacak | Test yürütme sırasında doldurulacak |

## 6. Eşdeğer Sınıflandırma

| Alan | Geçerli sınıflar | Geçersiz sınıflar | Temsilci değerler | İlgili TC |
|---|---|---|---|---|
| Login bilgileri | Kayıtlı aktif e-posta + doğru şifre | Hatalı şifre, boş e-posta, boş şifre, pasif hesap | `admin@dts.local` / hatalı şifre / boş alan | TC-001-01, TC-001-02, TC-001-03 |
| Roller | `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `ACADEMICIAN` | Tanımsız roller | `SUPER_ADMIN`, `ACADEMICIAN`, `STUDENT` | TC-023-01, TC-023-02, TC-023-03 |
| Derslik türü | `CLASSROOM`, `LABORATORY`, `AMPHITHEATER` | Enum dışı değerler | `CLASSROOM`, `OFFICE` | TC-007-01, TC-007-02 |
| Online/fiziksel ders | `ONLINE` + derslik yok; `FACE_TO_FACE` + derslik var | `ONLINE` + derslik var; fiziksel + derslik yok | `ONLINE/null`, `ONLINE/D101`, `FACE_TO_FACE/D101` | TC-017-01-TC-017-04 |
| Form zorunlu alanları | Dolu zorunlu alanlar | Boş ad, boş kod, boş capacity, boş classroomId | Boş `code`, boş `capacity` | TC-002-02, TC-007-03, TC-008-02 |
| Public filtreler | Var olan fakülte/bina/kat/derslik | Var olmayan ID | Geçerli UUID, rastgele UUID | TC-022-01, TC-022-03 |
| Schedule sahipliği | Kendi ders/program kaydı | Başkasının ders/program kaydı | Kendi `courseId`, başka `courseId` | TC-019-01, TC-019-02 |
| Tarih sınıfı | Hafta içi | Hafta sonu | Pazartesi, Cumartesi | TC-019-03 |

## 7. Sınır Değer Analizi

| Alan | Tanımlı sınır | Hemen altı | Sınır | Hemen üstü | Beklenen davranış | İlgili TC |
|---|---|---|---|---|---|---|
| Yeni şifre uzunluğu | Min 8 | 7 karakter | 8 karakter | 9 karakter | 7 reddedilir, 8+ kabul edilir | TC-002-03, TC-002-04 |
| Fakülte adı | Max 255 | 254 | 255 | 256 | 256 reddedilir | TC-003-02, TC-003-03 |
| Bina kodu | Max 50 | 49 | 50 | 51 | 51 reddedilmelidir; ayrıca tasarlanabilir | TC-004-01 kapsamında, ek test girdisi |
| Kat adı | Max 100 | 99 | 100 | 101 | 101 reddedilir | TC-005-02 |
| Derslik kodu | Max 100 | 99 | 100 | 101 | 101 reddedilmelidir; ayrıca tasarlanabilir | TS-007 ek girdisi |
| Ekipman metni | Max 500 | 499 | 500 | 501 | 501 reddedilmelidir; ayrıca tasarlanabilir | TS-007 ek girdisi |
| Haftalık program `slotCount` | 1-12 | 0 | 1 ve 12 | 13 | 0/13 reddedilir, 1/12 koşula göre kabul edilir | TC-011-04, TC-011-05, TC-011-06 |
| Ek/telafi `slotCount` | 1-12 | 0 | 1 ve 12 | 13 | 13 DTO validation ile reddedilir | TC-019-04 |
| Kapasite yeterliliği | `capacity >= studentCount` | `studentCount-1` | `studentCount` | `studentCount+1` | Alt değer uyarı, sınır/üst değer yeterli | TC-018-01-TC-018-03 |
| Zaman formatı | `HH:mm-HH:mm` veya `HH:mm` alanları | Bilinmiyor | Geçerli format | Geçersiz format | Geçersiz format reddedilir | Sprint 13.3 ek girdisi |
| Farklı hafta | Sınır yok | Bilinmiyor | Bilinmiyor | Bilinmiyor | WeeklySchedule modelinde desteklenmiyor | TC-016-02 |

## 8. Karar Tabloları

### 8.1 Program Oluşturma ve Çakışma Karar Tablosu

| Koşul / Kural | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| Kullanıcı `DEPARTMENT_ADMIN` mı? | E | E | E | E | E | H |
| Ders kendi bölümünde mi? | E | E | E | E | H | - |
| Derslik scope içinde mi? | E | E | E | E | - | - |
| Derslik aynı slotta dolu mu? | H | E | H | H | - | - |
| Akademisyen aynı slotta dolu mu? | H | - | E | H | - | - |
| Zorunlu sınıf seviyesi çakışıyor mu? | H | - | - | E | - | - |
| Beklenen sonuç | Program oluşur | `CLASSROOM_CONFLICT` | `ACADEMICIAN_CONFLICT` | `STUDENT_GROUP_CONFLICT` | AccessDenied | Yetkisiz |
| Temsilci TC | TC-011-01 | TC-012-01 | TC-013-01 | TC-014-01 | TC-024-02 | TC-023-01 |

Benzer davranış üreten kombinasyonlar, örneğin hem derslik hem akademisyen çakışmasının aynı anda olması, ayrı bir smoke case yerine `SCHEDULE_CONFLICT` ek girdisi olarak Sprint 13.3'e bırakılmıştır.

### 8.2 Online/Fiziksel Ders Karar Tablosu

| Koşul / Kural | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| Delivery type | ONLINE | ONLINE | FACE_TO_FACE | FACE_TO_FACE |
| Classroom ID var mı? | H | E | E | H |
| Beklenen sonuç | Geçerli | Reddedilir | Geçerli | Reddedilir |
| Temsilci TC | TC-017-01 | TC-017-02 | TC-017-03 | TC-017-04 |

Not: Haftalık program oluşturma DTO'su mevcut durumda `classroomId` zorunlu tanımladığı için online ders oluşturma API akışı SRS/implementasyon netleştirmesi gerektirebilir. DB ve entity kuralı yine de test tasarımında izlenebilir tutuldu.

### 8.3 Rol + Kapsam Karar Tablosu

| Koşul / Kural | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Rol | SUPER_ADMIN | DEPARTMENT_ADMIN | DEPARTMENT_ADMIN | ACADEMICIAN | Misafir |
| İşlem | Campus CRUD | Kendi bölüm programı | Başka bölüm/fakülte verisi | Kendi ders istisnası | Public görüntüleme |
| Kapsam eşleşiyor mu? | E | E | H | E | - |
| Beklenen sonuç | İzin verilir | İzin verilir | Reddedilir | İzin verilir | İzin verilir |
| Temsilci TC | TC-003-01 | TC-024-01 | TC-024-02 | TC-019-01 | TC-022-01 |

### 8.4 İstisna Ders Karar Tablosu

| Koşul / Kural | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Akademisyen dersin sahibi mi? | E | H | E | E | E |
| Tarih hafta içi mi? | E | E | H | E | E |
| Hedef slot çakışmasız mı? | E | E | E | H | E |
| Aynı kaynak/tarih duplicate mi? | H | H | H | H | E |
| Beklenen sonuç | Kayıt oluşur | AccessDenied | Reddedilir | Conflict | Duplicate |
| Temsilci TC | TC-019-01, TC-020-01 | TC-019-02 | TC-019-03 | TC-020-03 | TC-020-02, TC-021-02 |

## 9. Negatif Test Senaryoları

| Negatif durum | Test case |
|---|---|
| Hatalı login | TC-001-02 |
| Eksik zorunlu alan | TC-001-03, TC-002-02, TC-007-03, TC-008-02 |
| Yetkisiz kullanıcı | TC-023-01, TC-023-02 |
| Başka bölüm/fakülte verisine erişim | TC-009-02, TC-024-02 |
| Çakışmalı program | TC-012-01, TC-013-01, TC-014-01, TC-015-01-TC-015-04 |
| Online derse fiziksel derslik verme | TC-017-02 |
| Fiziksel derse derslik vermeme | TC-017-04 |
| Kapasite yetersizliği | TC-018-02 |
| Olmayan kayıt | TC-004-02, TC-022-03 |
| Geçersiz enum | TC-007-02 |
| Geçersiz gün / hafta sonu | TC-011-03, TC-019-03 |
| Geçersiz durum/duplicate | TC-020-02, TC-021-02 |
| Belirsiz başlamış ders iptali | TC-021-03 |

## 10. Rol ve Yetki Testleri

| Rol | Dahil mi? | Gerekçe | İlgili testler |
|---|---|---|---|
| SUPER_ADMIN | Evet | SRS ve implementasyonda var | TC-003-01, TC-004-01, TC-005-01, TC-006-01 |
| DEPARTMENT_ADMIN | Evet | SRS ve implementasyonda var | TC-009-01, TC-010-01, TC-011-01, TC-024-01 |
| ACADEMICIAN | Evet | SRS ve implementasyonda var | TC-010-02, TC-019-01, TC-020-01, TC-021-01 |
| Misafir | Evet | SRS public görüntüleme akışlarında var | TC-022-01, TC-022-02 |
| STUDENT | Hayır | Sprint 13.1'e göre SRS/kod karşılığı yok | Test case yok |
| ASSISTANT | Hayır | Sprint 13.1'e göre SRS/kod karşılığı yok | Test case yok |
| HOD | Hayır | Sprint 13.1'e göre SRS/kod karşılığı yok | Test case yok |

Rol testlerinde beklenen kapsama:

| Soru | Tasarım karşılığı |
|---|---|
| Kim erişebilir? | Karar tabloları ve `@PreAuthorize` temelli TC'ler |
| Kim erişemez? | TC-023-01, TC-023-02, TC-023-03 |
| Kendi kapsamındaki veriyi görebilir mi? | TC-024-01, TC-024-03 |
| Başka bölüm/fakülte verisine erişebilir mi? | TC-009-02, TC-024-02 |

## 11. Çakışma Testleri

| Çakışma durumu | Destek durumu | Test case / not |
|---|---|---|
| Aynı derslik / aynı zaman | Destekleniyor | TC-012-01 |
| Aynı derslik / kısmi çakışma | Çoklu slot ortak slot ile temsil ediliyor | TC-015-01 |
| Aynı derslik / tam kapsama | Çoklu slot ortak slot ile temsil ediliyor | TC-015-02 |
| Aynı başlangıç | Destekleniyor | TC-015-03 |
| Aynı bitiş | Destekleniyor | TC-015-04 |
| Arka arkaya ders | Çakışma yok | TC-016-01 |
| Aynı akademisyen / aynı zaman | Destekleniyor | TC-013-01 |
| Aynı akademisyen / farklı slot | Çakışma yok | TC-013-02 |
| Aynı zorunlu sınıf seviyesi | Destekleniyor | TC-014-01 |
| Çoklu slot ders | Destekleniyor | TC-015-01-TC-015-04 |
| Online ders | Fiziksel kaynak çakışması yok | TC-017-01 |
| Farklı gün | Çakışma yok | TC-012-02 |
| Farklı hafta | Desteklenmiyor | TC-016-02 |
| Serbest zaman aralığı kesişimi | Desteklenmiyor | Sprint 12.4'e göre ayrık slot modeli kullanılıyor |

## 12. Online/Fiziksel Ders Testleri

| Kombinasyon | Gereksinim açısından anlamlı mı? | Beklenen tasarım sonucu | Test case |
|---|---|---|---|
| Online + derslik verilmemesi | Evet | Geçerli | TC-017-01 |
| Online + derslik verilmesi | Evet, negatif | Reddedilir | TC-017-02 |
| Fiziksel + derslik verilmesi | Evet | Geçerli | TC-017-03 |
| Fiziksel + derslik verilmemesi | Evet, negatif | Reddedilir | TC-017-04 |

Belirsizlik: Mevcut `CreateWeeklyScheduleRequest` ve `UpdateWeeklyScheduleRequest` içinde `classroomId` zorunlu olduğu için online dersin haftalık program API'si üzerinden nasıl oluşturulacağı netleştirilmelidir. DB/entity tarafında online ders için `classroom_id=NULL` desteklenmektedir.

## 13. Requirement → Scenario → Test Case İzlenebilirliği

| Requirement / BR | Scenario | Test cases |
|---|---|---|
| REQ-3.1.1 | TS-001 | TC-001-01, TC-001-02, TC-001-03 |
| REQ-3.1.2, REQ-3.1.3, REQ-3.1.4 | TS-002 | TC-002-01, TC-002-02, TC-002-03, TC-002-04 |
| REQ-3.4.1 | TS-003 | TC-003-01, TC-003-02, TC-003-03 |
| REQ-3.4.2 | TS-004 | TC-004-01, TC-004-02 |
| REQ-3.4.3 | TS-005 | TC-005-01, TC-005-02 |
| REQ-3.4.4, REQ-3.4.5, BR-12 | TS-006, TS-007 | TC-006-01, TC-006-02, TC-006-03, TC-007-01, TC-007-02, TC-007-03 |
| REQ-3.4.6 | TS-008 | TC-008-01, TC-008-02 |
| REQ-3.5.1, BR-07 | TS-009 | TC-009-01, TC-009-02, TC-009-03 |
| REQ-3.5.2 | TS-010 | TC-010-01, TC-010-02 |
| REQ-3.5.3, REQ-3.5.4, BR-14 | TS-011 | TC-011-01, TC-011-02, TC-011-03, TC-011-04, TC-011-05, TC-011-06 |
| BR-01 | TS-012 | TC-012-01, TC-012-02 |
| BR-02 | TS-013 | TC-013-01, TC-013-02 |
| BR-03 | TS-014 | TC-014-01, TC-014-02 |
| BR-04 | TS-015, TS-016 | TC-015-01, TC-015-02, TC-015-03, TC-015-04, TC-016-01, TC-016-02 |
| BR-05 | TS-017 | TC-017-01, TC-017-02, TC-017-03, TC-017-04 |
| BR-06 | TS-018 | TC-018-01, TC-018-02, TC-018-03 |
| REQ-3.6.1, BR-08, BR-09, BR-10 | TS-019, TS-020 | TC-019-01, TC-019-02, TC-019-03, TC-019-04, TC-020-01, TC-020-02, TC-020-03 |
| REQ-3.6.3, BR-11 | TS-021 | TC-021-01, TC-021-02, TC-021-03 |
| REQ-3.2.1-REQ-3.2.5, REQ-3.7.1-REQ-3.7.5, BR-13 | TS-022 | TC-022-01, TC-022-02, TC-022-03, TC-022-04 |
| AUTH-01, AUTH-02, AUTH-06 | TS-023 | TC-023-01, TC-023-02, TC-023-03 |
| AUTH-03, AUTH-04, AUTH-05 | TS-024 | TC-024-01, TC-024-02, TC-024-03 |

## 14. Önceliklendirme

| Öncelik | Test case sayısı | Testler |
|---|---:|---|
| High | 40 | TC-001-01, TC-001-02, TC-001-03, TC-003-01, TC-004-01, TC-004-02, TC-005-01, TC-006-01, TC-006-02, TC-008-01, TC-008-02, TC-009-01, TC-009-02, TC-010-01, TC-010-02, TC-011-01, TC-011-03, TC-012-01, TC-013-01, TC-014-01, TC-015-01, TC-015-02, TC-015-03, TC-015-04, TC-017-01, TC-017-02, TC-017-03, TC-017-04, TC-019-01, TC-019-02, TC-020-01, TC-020-02, TC-020-03, TC-021-01, TC-021-02, TC-023-01, TC-023-02, TC-024-01, TC-024-02, TC-024-03 |
| Medium | 31 | TC-002-01, TC-002-02, TC-002-03, TC-002-04, TC-003-02, TC-003-03, TC-005-02, TC-006-03, TC-007-01, TC-007-02, TC-007-03, TC-009-03, TC-011-02, TC-011-04, TC-011-05, TC-011-06, TC-012-02, TC-013-02, TC-014-02, TC-016-01, TC-018-01, TC-018-02, TC-018-03, TC-019-03, TC-019-04, TC-021-03, TC-022-01, TC-022-02, TC-022-03, TC-022-04, TC-023-03 |
| Low | 1 | TC-016-02 |

Not: Öncelik tablosunda High satırı risk açısından öne çıkan testleri listeler; sayı alanı manuel tasarım özetidir ve Sprint 13.3 planlama sırasında test yönetim aracına aktarılırken tekrar sayılmalıdır.

High öncelikli kümeler:

| Küme | Neden High |
|---|---|
| Authentication | Sisteme erişimin başlangıç noktasıdır |
| Authorization ve veri izolasyonu | Yanlış veri erişimi kritik güvenlik hatasıdır |
| Haftalık program | DTS'nin ana iş akışıdır |
| Çakışma kontrolleri | Derslik/akademisyen/program güvenilirliğini belirler |
| Online/fiziksel ders ayrımı | Fiziksel kaynak tutarlılığını etkiler |
| Akademisyen ek/telafi/iptal | Canlı program görünümünü ve kaynak kullanımını etkiler |
| Kritik CRUD | Kampüs ve bölüm verisinin temel bütünlüğünü sağlar |

## 15. Sprint 13.3 İçin Hazır Girdiler

Sprint 13.3 birim testleri için hazır girdiler:

| Girdi | Hedef sınıf / alan | İlgili test case |
|---|---|---|
| Login başarılı/başarısız ve validation davranışları | `AuthService`, `AuthController` | TC-001-01-TC-001-03 |
| Profil validation ve şifre min uzunluk | `ProfileService`, DTO validation | TC-002-01-TC-002-04 |
| Fakülte/bina/kat/bölüm CRUD validation | `FacultyService`, `BuildingService`, `FloorService`, `DepartmentService` | TC-003-01-TC-008-02 |
| Kat planı role guard | `FloorController`, `FloorLayoutService`, `SlotLayoutService` | TC-006-01, TC-006-02 |
| Derslik türü ve kapasite validation | `SlotLayoutService`, DTO validation | TC-007-01-TC-007-03 |
| Akademisyen ve ders scope kontrolleri | `AcademicianService`, `CourseService`, `AccessScopeService` | TC-009-01-TC-010-02 |
| Haftalık program oluşturma ve slot count sınırları | `WeeklyScheduleService` | TC-011-01-TC-011-06 |
| Derslik/akademisyen/sınıf seviyesi/çoklu slot çakışmaları | `WeeklyScheduleService` | TC-012-01-TC-016-01 |
| Online/fiziksel ders kuralı | `WeeklySchedule`, migration constraint, schedule service | TC-017-01-TC-017-04 |
| Kapasite uyarısı | `WeeklyScheduleService.toAvailableClassroomResponse` | TC-018-01-TC-018-03 |
| Ek ders/telafi/iptal ve duplicate kuralları | `ScheduleExceptionService` | TC-019-01-TC-021-03 |
| Public görüntüleme ve not found davranışı | `PublicCampusService` | TC-022-01-TC-022-04 |
| Role guard ve veri izolasyonu | Controller `@PreAuthorize`, `AccessScopeService` | TC-023-01-TC-024-03 |

Yeni belirsizlikler ve netleştirme ihtiyacı:

| No | Belirsizlik |
|---|---|
| U-01 | Online ders haftalık program API'sinde `classroomId` zorunlu DTO ile nasıl oluşturulacak? |
| U-02 | Başlamış veya geçmiş ders/rezervasyon iptalinin zaman sınırı nedir? |
| U-03 | Kat planı yüklemede PDF gerçekten desteklenecek mi, yoksa base64 görsel model resmi kabul mü edilecek? |
| U-04 | Anlık boş ve bir sonraki ders saatinde boşalacak derslik için ölçülebilir zaman eşiği nedir? |
| U-05 | Bölüm-derslik yetkilendirme ayrı model olarak mı uygulanacak, yoksa fakülte kapsamı yeterli mi? |
| U-06 | Ekipman metin alanı mı kalacak, yoksa `Equipment` / `ClassroomEquipment` entityleri gerekecek mi? |
| U-07 | Farklı hafta veya tarih bazlı haftalık program gereksinimi desteklenecek mi? |

Özet:

| Metrik | Sayı |
|---|---:|
| Test senaryosu | 24 |
| Test case | 72 |
| Eşdeğer sınıflandırma yapılan alan | 8 |
| Sınır değer analizi yapılan alan | 10 |
| Karar tablosu oluşturulan alan | 4 |
| High öncelikli ana risk kümesi | 7 |

Kod değişikliği yapılmadı. Test kodu yazılmadı. Test çalıştırılmadı.
