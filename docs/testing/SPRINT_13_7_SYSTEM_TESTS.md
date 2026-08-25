# Sprint 13.7 - Sistem Testleri

## 1. Amac

Sprint 13.7'nin amaci DTS'yi tekil backend/frontend bilesenleri yerine gercek kullanici akislarina gore sistem seviyesinde dogrulayacak izlenebilir test yapisini olusturmaktir. Bu dokuman, Sprint 13.1 requirement analizi, Sprint 13.2 test case tasarimi, Sprint 13.3 test verileri, Sprint 13.4 unit testleri ve Sprint 13.6 integration testlerinden gelen zinciri sistem testi seviyesine tasir.

Bu sprintte production code degistirilmedi, unit/integration testler silinmedi veya yeniden yazilmadi, yeni test otomasyon framework'u eklenmedi.

## 2. Sistem Testi Kapsami

Sistem testleri kullanici bakis acisiyla asagidaki alanlari kapsar:

| Kapsam | Sistem seviyesi dogrulama |
|---|---|
| Authentication | Login, invalid login, tokenli oturum, logout ve protected sayfa davranisi |
| Authorization | Rol bazli sayfa/API erisimi ve yetkisiz kullanici yonlendirme |
| Veri izolasyonu | Department Admin'in kendi bolum/fakulte kapsaminda kalmasi |
| Derslik yonetimi | Public goruntuleme, filtreleme, blok/kat/derslik/kroki iliskisi |
| Ders programi | Program goruntuleme, olusturma, guncelleme, silme |
| Cakisma kontrolleri | Derslik, akademisyen, kismi/tam slot, ayni baslangic/bitis, arka arkaya, online/fiziksel |
| Kullanici deneyimi | Basari/hata mesaji, yonlendirme, basarisiz islem sonrasi state |

## 3. Test Ortami

| Konu | Durum |
|---|---|
| Backend calistirma | README'ye gore `cd backend && mvn spring-boot:run` |
| Frontend calistirma | README'ye gore `cd frontend && npm run dev` |
| Docker calistirma | `docker compose up --build` |
| Backend test komutu | `mvn test`; Sprint 13.6'da ortamda `mvn` ve `mvnw.cmd` yoktu |
| Frontend otomasyon | Playwright/Cypress yok |
| Sistem testi calistirma | Bu ortamda calistirilmadi |
| PASS/FAIL | Olculmedi |

Sistem testlerinin calistirilabilmesi icin backend, frontend ve test verisi yuklenmis veritabani birlikte ayakta olmalidir. Bu sprintte asil cikti test tasarimidir.

## 4. Kullanici Rolleri

| Rol | SRS / talep | Mevcut implementasyon | Sistem testi karari |
|---|---|---|---|
| STUDENT | Degerlendirilmeli | Kodda/frontend type'ta yok | Test edilemeyen alan olarak raporlandi |
| ACADEMICIAN | Var | Backend enum, frontend route ve dashboard var | Dahil edildi |
| ASSISTANT | Degerlendirilmeli | Kodda/frontend type'ta yok | Test edilemeyen alan olarak raporlandi |
| DEPARTMENT ADMIN | Var | `DEPARTMENT_ADMIN` olarak var | Dahil edildi |
| HOD | Degerlendirilmeli | Kodda/frontend type'ta yok | Test edilemeyen alan olarak raporlandi |
| SUPER ADMIN | Var | Backend enum, frontend route ve dashboard var | Dahil edildi |
| Misafir/Public | Var | Public classroom/program route'lari var | Dahil edildi |

## 5. Sistem Test Senaryolari

| Scenario ID | Sistem test senaryosu | Requirement / BR | Rol | Risk |
|---|---|---|---|---|
| STS-001 | Kullanici login olur ve rolune uygun ana ekrana yonlenir | REQ-3.1.1 | SUPER_ADMIN, DEPARTMENT_ADMIN, ACADEMICIAN | P0 |
| STS-002 | Gecersiz login ve protected sayfa erisimi reddedilir | REQ-3.1.1, AUTH-01 | Tum kullanicilar | P0 |
| STS-003 | Logout sonrasi oturum temizlenir ve protected sayfa acilmaz | REQ-3.1.5 | Tum desteklenen roller | P0 |
| STS-004 | Rol bazli route ve endpoint erisimi korunur | AUTH-02 | Desteklenen roller | P0 |
| STS-005 | Department Admin kendi bolum/fakulte verilerini gorur | AUTH-03, BR-07 | DEPARTMENT_ADMIN | P0 |
| STS-006 | Department Admin scope disi veriye erisemez | AUTH-03, BR-07 | DEPARTMENT_ADMIN | P0 |
| STS-007 | Misafir derslik ve program bilgilerini goruntuler | REQ-3.2.1-3.2.5, REQ-3.7.1-3.7.5 | Public | P1 |
| STS-008 | Super Admin kampus varliklarini yonetir | REQ-3.4.1-3.4.6 | SUPER_ADMIN | P1 |
| STS-009 | Department Admin akademisyen ve ders yonetimi yapar | REQ-3.5.1, REQ-3.5.2 | DEPARTMENT_ADMIN | P0 |
| STS-010 | Department Admin haftalik program olusturur/gunceller/siler | REQ-3.5.3, REQ-3.5.4 | DEPARTMENT_ADMIN | P0 |
| STS-011 | Derslik cakismasi kullanici akisinda engellenir | BR-01 | DEPARTMENT_ADMIN | P0 |
| STS-012 | Akademisyen cakismasi kullanici akisinda engellenir | BR-02 | DEPARTMENT_ADMIN | P0 |
| STS-013 | Zorunlu sinif seviyesi ve coklu slot cakismalari dogrulanir | BR-03, BR-04 | DEPARTMENT_ADMIN | P0 |
| STS-014 | Online/fiziksel ders ayrimi sistem seviyesinde izlenir | BR-05 | DEPARTMENT_ADMIN, ACADEMICIAN | P1 |
| STS-015 | Academician kendi derslerini ve istisna akislarini gorur | REQ-3.6.1-3.6.3, BR-08 | ACADEMICIAN | P1 |
| STS-016 | Kullanici hata/basari mesajlari ve state korunumu dogrulanir | UX | Desteklenen roller | P1 |
| STS-017 | Desteklenmeyen roller icin sistem karsiligi bulunmadigi raporlanir | ER-02, AUTH-06 | STUDENT, ASSISTANT, HOD | P2 |
| STS-018 | Public filtreleme ve not-found davranisi dogrulanir | REQ-3.2.5, REQ-3.7.5 | Public | P2 |

## 6. Test Case'ler

| Test Case ID | Scenario | Requirement | Risk | Role | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| STC-001 | STS-001 | REQ-3.1.1 | P0 | SUPER_ADMIN | Admin kullanici var | Login; dashboard acilisini kontrol et | TD-VALID-001 | `/super-admin/dashboard` acilir | Calistirilmadi | Not Run | TC-001-01 |
| STC-002 | STS-001 | REQ-3.1.1 | P0 | DEPARTMENT_ADMIN | Bolum admin var | Login; dashboard acilisini kontrol et | TD-VALID-002 | `/department-admin/dashboard` acilir | Calistirilmadi | Not Run | TC-001-01 |
| STC-003 | STS-001 | REQ-3.1.1 | P0 | ACADEMICIAN | Akademisyen kullanici var | Login; dashboard acilisini kontrol et | TD-VALID-003 | `/academician/dashboard` acilir | Calistirilmadi | Not Run | TC-001-01 |
| STC-004 | STS-002 | REQ-3.1.1 | P0 | Any | Kullanici var | Hatali sifreyle login dene | TD-INVALID-001 | Login reddedilir, oturum olusmaz | Calistirilmadi | Not Run | TC-001-02 |
| STC-005 | STS-002 | AUTH-01 | P0 | Public | Oturum yok | Protected route ac | TD-INVALID-014 | `/giris` yonlendirmesi veya 401 | Calistirilmadi | Not Run | TC-023-01 |
| STC-006 | STS-003 | REQ-3.1.5 | P0 | Any supported | Kullanici login | User menu -> cikis yap; protected route ac | TD-VALID-001/002/003 | Token/session temizlenir, login ekranina doner | Calistirilmadi | Not Run | Logout backend endpoint'i yok; frontend session temizler |
| STC-007 | STS-004 | AUTH-02 | P0 | ACADEMICIAN | Akademisyen login | `/department-admin/ders-programi` ac | TD-VALID-003 | Kendi dashboard'una yonlenir veya erisim engellenir | Calistirilmadi | Not Run | TC-023-03 |
| STC-008 | STS-004 | BR-12 | P0 | DEPARTMENT_ADMIN | Bolum admin login | Super Admin layout/kampus islemi dene | TD-VALID-002 | 403 veya route guard | Calistirilmadi | Not Run | TC-023-02 |
| STC-009 | STS-005 | AUTH-03, BR-07 | P0 | DEPARTMENT_ADMIN | Scope tanimli | Dersler/program sayfasini ac | TD-VALID-002 | Kendi bolum verileri gorunur | Calistirilmadi | Not Run | TC-024-01 |
| STC-010 | STS-006 | AUTH-03, BR-07 | P0 | DEPARTMENT_ADMIN | Iki fakulte/bolum var | Scope disi derslik ile program olustur | TD-INVALID-010 | Islem reddedilir, DB/state degismez | Calistirilmadi | Not Run | TC-024-02 |
| STC-011 | STS-007 | REQ-3.2.1-3.2.5 | P1 | Public | Seed kampus verisi var | `/classrooms`; fakulte/bina/kat filtreleri | TD-VALID-004..008 | Derslikler ve durum bilgileri gorunur | Calistirilmadi | Not Run | TC-022-01 |
| STC-012 | STS-007 | REQ-3.2.3, REQ-3.7.3 | P1 | Public | Kat plani verisi var | Kat/kroki sayfasini ac | TD-VALID-007 | Kat plani ve yerlestirmeler gorunur | Calistirilmadi | Not Run | TC-022-02 |
| STC-013 | STS-008 | REQ-3.4.1 | P1 | SUPER_ADMIN | Admin login | Fakulte olustur | TD-VALID-004 | Kayit listede gorunur | Calistirilmadi | Not Run | TC-003-01 |
| STC-014 | STS-008 | REQ-3.4.2-3.4.3 | P1 | SUPER_ADMIN | Fakulte var | Bina ve kat olustur | TD-VALID-005, TD-VALID-006 | Bina/kat iliskisi gorunur | Calistirilmadi | Not Run | TC-004-01, TC-005-01 |
| STC-015 | STS-008 | REQ-3.4.4, BR-12 | P1 | SUPER_ADMIN | Kat var | Kat plani/slot layout kaydet | TD-VALID-007 | Layout kaydedilir ve tekrar acilir | Calistirilmadi | Not Run | TC-006-01 |
| STC-016 | STS-009 | REQ-3.5.1 | P0 | DEPARTMENT_ADMIN | Scope tanimli | Kendi bolumune akademisyen ekle | TD-VALID-002 | Akademisyen listede gorunur | Calistirilmadi | Not Run | TC-009-01 |
| STC-017 | STS-009 | REQ-3.5.1, BR-07 | P0 | DEPARTMENT_ADMIN | Baska bolum akademisyeni var | Scope disi akademisyen update/delete dene | TD-INVALID-010 | Erisim reddedilir | Calistirilmadi | Not Run | TC-009-02 |
| STC-018 | STS-009 | REQ-3.5.2 | P0 | DEPARTMENT_ADMIN | Akademisyen ve donem var | Ders olustur | TD-VALID-010 | Ders kendi bolumunde gorunur | Calistirilmadi | Not Run | TC-010-01 |
| STC-019 | STS-010 | REQ-3.5.3, REQ-3.5.4 | P0 | DEPARTMENT_ADMIN | Ders, akademisyen, derslik var | Program olustur; programi tekrar goruntule | TD-VALID-010, TD-VALID-011 | Ders-akademisyen-derslik iliskisi gorunur | Calistirilmadi | Not Run | TC-011-01 |
| STC-020 | STS-010 | REQ-3.5.3 | P1 | DEPARTMENT_ADMIN | Program kaydi var | Program guncelle ve sil | TD-VALID-011 | Degisiklik/silme ekranda gorunur | Calistirilmadi | Not Run | TC-011-01 turevi |
| STC-021 | STS-011 | BR-01 | P0 | DEPARTMENT_ADMIN | Ayni derslikte program var | Ayni derslik/slot ikinci program dene | TD-COMBO-001 | Cakisma mesaji, ikinci kayit yok | Calistirilmadi | Not Run | TC-012-01 |
| STC-022 | STS-012 | BR-02 | P0 | DEPARTMENT_ADMIN | Ayni akademisyenin dersi var | Ayni slotta ikinci ders ata | TD-COMBO-002 | Akademisyen cakismasi reddedilir | Calistirilmadi | Not Run | TC-013-01 |
| STC-023 | STS-013 | BR-03 | P0 | DEPARTMENT_ADMIN | Zorunlu ayni sinif seviyesi var | Ayni grade/slot program dene | TD-COMBO-003 | Ogrenci grubu cakismasi reddedilir | Calistirilmadi | Not Run | TC-014-01 |
| STC-024 | STS-013 | BR-04 | P1 | DEPARTMENT_ADMIN | Coklu slot program verisi var | Kismi/tam/ayni baslangic/ayni bitis dene | TD-COMBO-004..007 | Cakisan slotlar reddedilir | Calistirilmadi | Not Run | TC-015-01..04 |
| STC-025 | STS-013 | REQ-3.5.4 | P1 | DEPARTMENT_ADMIN | Arka arkaya slot verisi var | Arka arkaya ders olustur | TD-VALID-013 | Cakisma sayilmaz | Calistirilmadi | Not Run | TC-016-01 |
| STC-026 | STS-014 | BR-05 | P1 | DEPARTMENT_ADMIN | Online/fiziksel test verisi | Online/fiziksel kombinasyonlari dene | TD-COMBO-008 | Desteklenen kombinasyonlar ayrisir | Calistirilmadi | Not Run | DTO online `classroomId` belirsizligi var |
| STC-027 | STS-015 | REQ-3.6.1, BR-08 | P1 | ACADEMICIAN | Kendi dersi var | Ek ders/telafi/iptal akislarini ac | TD-VALID-003, TD-VALID-011 | Kendi dersleri icin islem yapabilir | Calistirilmadi | Not Run | TC-019-01, TC-020-01, TC-021-01 |
| STC-028 | STS-015 | BR-08 | P1 | ACADEMICIAN | Baska akademisyen dersi var | Baska ders icin exception dene | TD-INVALID-015 | Erisim reddedilir | Calistirilmadi | Not Run | TC-019-02 |
| STC-029 | STS-018 | REQ-3.2.5, REQ-3.7.5 | P2 | Public | Oturum yok | Var olmayan classroom programi ac | TD-INVALID-013 | Not-found/hata mesaji gorunur | Calistirilmadi | Not Run | TC-022-03 |
| STC-030 | STS-017 | ER-02, AUTH-06 | P2 | STUDENT/ASSISTANT/HOD | Rol kodda yok | Bu rollerle login/route bekleme | New: TD-UNSUPPORTED-ROLE-001 | Test edilemez; gereksinim/implementasyon gap raporlanir | Calistirilmadi | Blocked | Kodda rol yok |

## 7. Pozitif Senaryolar

Pozitif sistem testleri: STC-001, STC-002, STC-003, STC-006, STC-009, STC-011, STC-012, STC-013, STC-014, STC-015, STC-016, STC-018, STC-019, STC-020, STC-025, STC-027.

Toplam pozitif test case: 16.

## 8. Negatif Senaryolar

Negatif sistem testleri: STC-004, STC-005, STC-007, STC-008, STC-010, STC-017, STC-021, STC-022, STC-023, STC-024, STC-026, STC-028, STC-029, STC-030.

Toplam negatif test case: 14. STC-026 karma bir karar tablosu testidir; online/fiziksel kombinasyonlarinda hem pozitif hem negatif beklenti icerir ve negatif sayimda risk nedeniyle yer alir.

## 9. E2E Senaryolari

| E2E ID | Akis | Ilgili test case'ler | Otomasyon uygunlugu |
|---|---|---|---|
| E2E-001 | Public kullanici derslik arar, kat planini acar, derslik programini gorur | STC-011, STC-012, STC-029 | Yuksek |
| E2E-002 | Department Admin login olur, ders olusturur, program olusturur, programi gorur | STC-002, STC-018, STC-019 | Yuksek |
| E2E-003 | Department Admin cakisan program dener ve sistem state'inin degismedigini gorur | STC-019, STC-021 | Yuksek |
| E2E-004 | Academician login olur, kendi derslerini gorur, kendi dersi icin istisna olusturur | STC-003, STC-027 | Orta |
| E2E-005 | Super Admin kampus varligi olusturur, public tarafta gorunurlugunu kontrol eder | STC-001, STC-013, STC-014, STC-011 | Orta |
| E2E-006 | Kullanici logout yapar, geri/ileri gezinme ile protected sayfaya donemez | STC-006, STC-005 | Yuksek |

Toplam E2E senaryo: 6.

## 10. Risk-Based Onceliklendirme

| Risk | Test case sayisi | Test case'ler | Gerekce |
|---|---:|---|---|
| P0 / Critical | 17 | STC-001..010, STC-016..019, STC-021..023 | Auth, authz, veri izolasyonu, program olusturma ve kritik cakismalar |
| P1 / High | 10 | STC-011..015, STC-020, STC-024..028 | Derslik/program CRUD, public goruntuleme, online/fiziksel, exception akislar |
| P2 / Medium | 3 | STC-029, STC-030 ve desteklenmeyen rol gap'i | Not-found ve implementasyon karsiligi olmayan roller |

## 11. Exploratory Test Alanlari

| Alan ID | Kesif alani | Odak |
|---|---|---|
| EXP-001 | Roller arasi oturum degisimi | Logout/login sonrasi stale cache veya eski rol state'i kalmasin |
| EXP-002 | Browser geri/ileri gezinme | Logout veya yetki reddi sonrasi protected sayfaya donulemesin |
| EXP-003 | Program formunda yarim kalan islem | Modal kapatma, refresh, iptal sonrasi state temizligi |
| EXP-004 | Cakisma denemelerini tekrar etme | Arka arkaya conflict denemeleri ikinci kayit/state uretmesin |
| EXP-005 | Filtreleri hizli degistirme | Public/ders programi filtreleri stale veri gostermesin |
| EXP-006 | Gecersiz veri kombinasyonlari | Bos alan, enum disi deger, slotCount sinirlari ve mesajlar |
| EXP-007 | Scope disi URL manipulasyonu | ID degistirerek baska fakulte/bolum verisine erisim denenmesi |
| EXP-008 | Online/fiziksel belirsizlik alani | UI'nin online ders icin classroom zorunlulugunu nasil ele aldigi |

Toplam exploratory alan: 8.

## 12. Test Data Traceability

| Test Data | Kullanilan sistem testleri |
|---|---|
| TD-VALID-001 | STC-001, STC-006 |
| TD-VALID-002 | STC-002, STC-008, STC-009, STC-016, STC-019 |
| TD-VALID-003 | STC-003, STC-007, STC-027 |
| TD-VALID-004 | STC-011, STC-013 |
| TD-VALID-005 | STC-011, STC-014 |
| TD-VALID-006 | STC-011, STC-014 |
| TD-VALID-007 | STC-012, STC-015 |
| TD-VALID-008 | STC-011 |
| TD-VALID-010 | STC-018, STC-019 |
| TD-VALID-011 | STC-019, STC-020, STC-027 |
| TD-VALID-013 | STC-025 |
| TD-INVALID-001 | STC-004 |
| TD-INVALID-010 | STC-010, STC-017 |
| TD-INVALID-013 | STC-029 |
| TD-INVALID-014 | STC-005 |
| TD-INVALID-015 | STC-028 |
| TD-COMBO-001 | STC-021 |
| TD-COMBO-002 | STC-022 |
| TD-COMBO-003 | STC-023 |
| TD-COMBO-004..007 | STC-024 |
| TD-COMBO-008 | STC-026 |
| TD-UNSUPPORTED-ROLE-001 | STC-030 |

Yeni test verisi:

| Data ID | Gerekce | Degerler |
|---|---|---|
| TD-UNSUPPORTED-ROLE-001 | Talepte STUDENT, ASSISTANT, HOD rolleri isteniyor ancak kodda yok | `role=STUDENT/ASSISTANT/HOD`, expected=`not implemented / not testable` |

## 13. Requirement Traceability

| Requirement / BR | System scenario | System test case |
|---|---|---|
| REQ-3.1.1 | STS-001, STS-002 | STC-001..005 |
| REQ-3.1.5 | STS-003 | STC-006 |
| AUTH-01, AUTH-02 | STS-002, STS-004 | STC-005, STC-007, STC-008 |
| AUTH-03, BR-07 | STS-005, STS-006 | STC-009, STC-010, STC-017 |
| REQ-3.2.1-3.2.5, REQ-3.7.1-3.7.5 | STS-007, STS-018 | STC-011, STC-012, STC-029 |
| REQ-3.4.1-3.4.6, BR-12 | STS-008 | STC-013..015 |
| REQ-3.5.1 | STS-009 | STC-016, STC-017 |
| REQ-3.5.2 | STS-009 | STC-018 |
| REQ-3.5.3, REQ-3.5.4 | STS-010 | STC-019, STC-020 |
| BR-01 | STS-011 | STC-021 |
| BR-02 | STS-012 | STC-022 |
| BR-03, BR-04 | STS-013 | STC-023..025 |
| BR-05 | STS-014 | STC-026 |
| REQ-3.6.1-3.6.3, BR-08 | STS-015 | STC-027, STC-028 |
| ER-02, AUTH-06 | STS-017 | STC-030 |

Traceability durumu: Requirement -> System Test Scenario -> Test Case -> Test Data zinciri kurulmustur. Desteklenmeyen roller icin zincir gap olarak isaretlenmistir.

## 14. Unit / Integration / System Test Ayrimi

| Seviye | Soru | DTS karsiligi |
|---|---|---|
| Unit | Bir bilesen dogru mu? | Sprint 13.4/13.5 service + mock testleri |
| Integration | Bilesenler teknik olarak birlikte calisiyor mu? | Sprint 13.6 Spring context, MockMvc, repository, H2 testleri |
| System | Kullanici isini sistem butunuyle tamamlayabiliyor mu? | Sprint 13.7 STS/STC/E2E test tasarimi |

Sistem testlerinde yalnizca HTTP status veya repository sonucu yeterli kabul edilmez; kullanicinin ekran, mesaj, yonlendirme ve islem sonucunu gorebilmesi beklenir.

## 15. Belirsizlikler ve Test Edilemeyen Alanlar

| Alan | Durum | Etki |
|---|---|---|
| STUDENT, ASSISTANT, HOD rolleri | Kodda, frontend type'ta ve route guard'da yok | Sistem testi calistirilamaz; gereksinim/implementasyon gap |
| Online schedule create | Entity/DB online ders destekler, create DTO `classroomId` zorunlu | STC-026 icin beklenen sonuc belirsiz |
| Farkli hafta | WeeklySchedule modelinde hafta/tarih boyutu yok | Farkli hafta conflict testi otomasyona dogrudan donusemez |
| Serbest zaman araligi | Sistem ayrik `timeSlot` modeli kullanir | Kismi/tam cakisma slot gruplariyla temsil edilir |
| Anlik/yakinda bosalacak esigi | SRS'te olculebilir esik yok | Public durum testi kesin sinirla dogrulanamaz |
| Kat plani formatlari | SRS PNG/JPG/PDF der; implementasyon base64/layout modelinde | Format kabul testi belirsiz |
| Logout backend davranisi | Backend logout endpoint'i yok | Sistem testi frontend session temizleme olarak ele alinir |

## 16. Otomasyon Adaylari

Buyuk framework kurulmadan, ileride E2E araci eklendiginde otomasyona en uygun adaylar:

| Aday | Oncelik | Neden |
|---|---|---|
| Login -> rol dashboard redirect | P0 | Kritik ve deterministik |
| Protected route unauthenticated redirect | P0 | Guvenlik regresyonu yakalar |
| Department Admin course -> schedule create | P0 | Ana is akisi |
| Classroom conflict non-effect | P0 | Kritik veri tutarliligi |
| Department Admin scope disi classroom | P0 | Veri izolasyonu |
| Public classroom/program goruntuleme | P1 | Kullanici gorunurlugu |
| Logout session clear | P1 | Oturum guvenligi |

## 17. Sprint 13.8'e Aktarilacak Konular

| Konu | Aktarim nedeni |
|---|---|
| Sistem test otomasyonu secimi | Playwright/Cypress yok; framework karari ayri alinmali |
| Maven wrapper eklenmesi | Backend testlerinin ortamdan bagimsiz calismasi icin |
| Desteklenmeyen rollerin gereksinim karari | STUDENT/ASSISTANT/HOD icin product karari gerekli |
| Online schedule DTO belirsizligi | UI/API beklenen davranisi netlesmeli |
| Public anlik durum esigi | Sistem testinde olculebilir kabul kriteri gerekli |
| Test ortam seed standardizasyonu | Sistem testlerinin tekrarli kosulabilmesi icin |

## 18. Sonuc

| Metrik | Sonuc |
|---|---:|
| Toplam sistem test senaryosu | 18 |
| Toplam test case | 30 |
| Pozitif test sayisi | 16 |
| Negatif test sayisi | 14 |
| P0 test case | 17 |
| P1 test case | 10 |
| P2 test case | 3 |
| E2E senaryo sayisi | 6 |
| Exploratory test alani | 8 |
| Traceability durumu | Kuruldu |
| Calistirilabilen testler | 0 |
| Calistirilamayan testler | 30 |
| Production code degisikligi | Yok |
| Unit/integration test degisikligi | Yok |
| Dependency degisikligi | Yok |

Sistem testleri bu sprintte tasarlandi ancak uygun calistirma ortami ve E2E otomasyon altyapisi olmadigi icin yurutulmedi. PASS/FAIL sonucu uretilmedi.
