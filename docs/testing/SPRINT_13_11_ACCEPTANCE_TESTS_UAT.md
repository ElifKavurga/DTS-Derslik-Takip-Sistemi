# DTS - Sprint 13.11 Acceptance Tests / UAT

## 1. Amaç

Sprint 13.11'in amacı DTS'nin gerçek kullanıcı ihtiyaçlarını ve iş süreçlerini karşılayıp karşılamadığını değerlendirmek için User Acceptance Testing tasarımını oluşturmaktır.

Bu doküman teknik endpoint doğrulamasından çok kullanıcının iş hedefini tamamlayabilmesini, business workflow'un kabul edilebilirliğini ve kabul kriterlerini tanımlar. UAT testleri bu sprintte çalıştırılmamıştır. Sprint 13.10'da tespit edilen ortam eksikleri nedeniyle uygulanabilir UAT case'leri `BLOCKED`, implementation karşılığı olmayan roller `NOT IMPLEMENTED` olarak işaretlenmiştir.

## 2. Kapsam

İncelenen kaynaklar:

- SRS, ER ve veri sözlüğü kapsamı.
- README, backend/frontend configuration ve mevcut rol yapısı.
- Sprint 13.1 Requirement Analysis.
- Sprint 13.2 Test Case Design.
- Sprint 13.3 Test Data.
- Sprint 13.7 System Tests.
- Sprint 13.8 State / Workflow / Exploratory Testing.
- Sprint 13.9 Non-Functional Tests.
- Sprint 13.10 Test Environment.
- Backend `Role` enum, Spring Security config ve controller `@PreAuthorize` anotasyonları.
- Frontend role routes, protected routes ve public routes.

Kapsama alınan gerçek aktörler:

- `SUPER_ADMIN`
- `DEPARTMENT_ADMIN`
- `ACADEMICIAN`
- Public / Misafir kullanıcı

Kapsam gap'i olarak izlenen roller:

- `STUDENT`
- `ASSISTANT`
- `HOD`

## 3. Acceptance Testing Overview

Acceptance Testing, sistemin business ihtiyacını karşılayıp karşılamadığını değerlendirir. DTS için kabul testinin ana soruları şunlardır:

- Kullanıcı kendi rolüne uygun işi tamamlayabiliyor mu?
- Sistem derslik, program ve yetki sınırlarını business açısından doğru koruyor mu?
- Kullanıcı, oluşturduğu veya görüntülemesi gereken bilgiyi işini yapacak şekilde görebiliyor mu?
- Kritik hatalarda sistem kullanıcıyı yanlış yönlendirmeden ve veri bütünlüğünü bozmadan davranıyor mu?
- Implementation gap'leri kabul kararını etkileyen açık konu olarak görülebiliyor mu?

Bu sprintte formal UAT with end users was not executed.

## 4. System Test vs UAT

| Alan | System Testing | UAT |
| --- | --- | --- |
| Temel soru | Sistem teknik/fonksiyonel olarak doğru davranıyor mu? | Kullanıcı iş hedefini kabul edilebilir şekilde tamamlıyor mu? |
| Odak | Endpoint, UI state, sistem akışı, beklenen teknik sonuç | Business workflow, kabul kriteri, rol ihtiyacı, iş sonucu |
| Örnek | Aynı derslik ve saatte iki program oluşturma engelleniyor mu? | Bölüm Admini program hazırlarken derslik çakışmasını sistem üzerinden doğru yönetebiliyor mu? |
| Çıktı | PASS/FAIL teknik doğrulama | Accept/reject/sign-off girdisi |
| DTS ilişkisi | Sprint 13.7 STC-* sistem testleri | Sprint 13.11 UAT-* kabul testleri |

UAT, Sprint 13.7 sistem testlerinin kopyası değildir. Aynı akışlar kullanılsa bile bu raporda sonuç dili "kullanıcının işi tamamlayabilmesi" üzerinden kurulmuştur.

## 5. User Roles

| Rol | Implementation Durumu | UAT Durumu | Not |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | Backend enum, frontend route ve dashboard mevcut | Dahil | Kampüs, kullanıcı, dönem, kat planı yönetimi |
| `DEPARTMENT_ADMIN` | Backend enum, frontend route ve dashboard mevcut | Dahil | Akademisyen, ders ve program yönetimi |
| `ACADEMICIAN` | Backend enum, frontend route ve dashboard mevcut | Dahil | Kendi ders/program/istisna akışları |
| Public / Misafir | Public frontend route ve `/api/public/**` mevcut | Dahil | Derslik ve program görüntüleme |
| `STUDENT` | Kodda ve frontend type'ta yok | NOT IMPLEMENTED | UAT PASS üretilemez |
| `ASSISTANT` | Kodda ve frontend type'ta yok | NOT IMPLEMENTED | UAT PASS üretilemez |
| `HOD` | Kodda ve frontend type'ta yok | NOT IMPLEMENTED | UAT PASS üretilemez |

## 6. Business Requirements

| Requirement / BR | Business Requirement | UAT Yorumu |
| --- | --- | --- |
| REQ-3.1.1 | Kullanıcı sisteme giriş yapabilmeli | Rol bazlı iş başlangıcı |
| REQ-3.1.5 | Kullanıcı çıkış yapabilmeli | Oturum güvenli kapanmalı |
| REQ-3.2.1-3.2.5 | Public kullanıcı derslik, kat planı ve sınıf bilgisi görebilmeli | Misafir kullanıcı bina içinde uygun derslik bulabilmeli |
| REQ-3.4.1-3.4.6 | Super Admin kampüs organizasyonunu yönetebilmeli | Kurumsal veri yönetimi |
| REQ-3.4.4-3.4.5 | Kat planı ve derslik yerleşimi yönetilebilmeli | Derslik konumu anlamlı şekilde yönetilmeli |
| REQ-3.5.1 | Bölüm Admini akademisyen yönetebilmeli | Bölüm operasyonu |
| REQ-3.5.2 | Bölüm Admini ders yönetebilmeli | Ders kataloğu hazırlığı |
| REQ-3.5.3 | Bölüm Admini haftalık program yönetebilmeli | Temel DTS business workflow |
| REQ-3.5.4 | Ders sınıfa yerleştirilebilmeli | Kaynak planlama |
| REQ-3.6.1-3.6.3 | Akademisyen istisna/rezervasyon benzeri akışları yönetebilmeli | Kodda `ScheduleException` modeliyle karşılanıyor |
| BR-01-BR-05 | Çakışma ve online/fiziksel kuralları korunmalı | Program güvenilirliği |
| BR-07-BR-08 | Veri izolasyonu ve sahiplik korunmalı | Business güvenliği |
| BR-12-BR-13 | Kat planı yetkisi ve public read-only sınırı korunmalı | Yetki sınırı |

## 7. User Needs

| User Need ID | Aktör | Kullanıcı İhtiyacı |
| --- | --- | --- |
| UN-001 | Super Admin | Fakülte, bina, kat, bölüm ve kullanıcı verisini merkezi olarak yönetebilmek. |
| UN-002 | Super Admin | Dersliklerin kat planındaki konumunu yönetebilmek. |
| UN-003 | Department Admin | Bölümüne ait akademisyen ve dersleri yeni dönem için hazırlayabilmek. |
| UN-004 | Department Admin | Haftalık ders programını çakışmasız oluşturabilmek. |
| UN-005 | Department Admin | Program hazırlarken derslik kapasitesi ve uygunluk bilgilerini anlayabilmek. |
| UN-006 | Department Admin | Kendi bölüm/fakülte kapsamı dışındaki verileri yönetememek. |
| UN-007 | Academician | Kendi derslerini ve programını görebilmek. |
| UN-008 | Academician | Kendi dersi için iptal, telafi veya ek ders isteği oluşturabilmek. |
| UN-009 | Public | Boş/uygun derslik ve public program bilgisini giriş yapmadan görebilmek. |
| UN-010 | Supported users | Oturumunu güvenli şekilde kapatabilmek. |

## 8. Acceptance Criteria

| AC ID | Acceptance Criterion | Requirement / Need | Status |
| --- | --- | --- | --- |
| AC-001 | Desteklenen kullanıcı geçerli bilgilerle login olduğunda rolüne uygun alana ulaşabilmelidir. | REQ-3.1.1, UN-001..008 | BLOCKED |
| AC-002 | Kullanıcı logout sonrası protected sayfalara oturumlu gibi devam edememelidir. | REQ-3.1.5, UN-010 | BLOCKED |
| AC-003 | Super Admin kampüs hiyerarşisini oluşturup public tarafta görünür kılabilmelidir. | REQ-3.4.1-3.4.6, UN-001 | BLOCKED |
| AC-004 | Super Admin kat planında derslik yerleşimini kaydedip tekrar görüntüleyebilmelidir. | REQ-3.4.4-3.4.5, UN-002 | BLOCKED |
| AC-005 | Department Admin kendi bölümüne akademisyen ve ders tanımlayabilmelidir. | REQ-3.5.1-3.5.2, UN-003 | BLOCKED |
| AC-006 | Department Admin geçerli ders, akademisyen, derslik, gün ve saat ile program oluşturup görüntüleyebilmelidir. | REQ-3.5.3-3.5.4, UN-004 | BLOCKED |
| AC-007 | Bölüm programı hazırlanırken derslik/akademisyen/sınıf çakışmaları business verisini bozmadan engellenmelidir. | BR-01-BR-04, UN-004 | BLOCKED |
| AC-008 | Online/fiziksel ders ayrımı kullanıcı açısından anlaşılır ve kaynak planlamasını korur şekilde uygulanmalıdır. | BR-05, UN-004 | BLOCKED |
| AC-009 | Kapasite yetersizliği kullanıcının karar verebileceği şekilde görünmelidir. | BR-06, UN-005 | BLOCKED |
| AC-010 | Department Admin yalnızca kendi kapsamındaki veriyi yönetebilmelidir. | BR-07, UN-006 | BLOCKED |
| AC-011 | Akademisyen yalnızca kendi ders/program/istisna verileriyle işlem yapabilmelidir. | BR-08, UN-007, UN-008 | BLOCKED |
| AC-012 | Public kullanıcı derslik ve program bilgilerini giriş yapmadan görebilmelidir. | REQ-3.2, REQ-3.7, UN-009 | BLOCKED |
| AC-013 | Kodda bulunmayan roller için UAT kabul sonucu üretilmemeli, gap raporlanmalıdır. | ER-02, AUTH-06 | NOT IMPLEMENTED |

Acceptance criterion not explicitly defined in SRS olan alanlar: kapasite uyarısının UI kabul biçimi, public anlık durum eşiği, online schedule create DTO davranışı, başlamış ders iptal kuralı.

## 9. UAT Entry Criteria

Proposed UAT Entry Criteria:

- UAT scope ve dahil edilen roller onaylanmış olmalı.
- UAT senaryoları ve acceptance criteria hazırlanmış olmalı.
- Test environment çalışır olmalı: frontend, backend, database.
- Gerekli test kullanıcıları mevcut olmalı.
- Sprint 13.3 TD-* test verisi ortamda yüklenmiş veya üretilebilir olmalı.
- Kritik system testleri çalıştırılabilir durumda olmalı.
- Blocker environment gap'i bulunmamalı.
- Formal stakeholder/UAT owner belirlenmiş olmalı.

Bu kriterler resmi proje politikası olarak doğrulanmadı; öneri niteliğindedir.

## 10. UAT Exit Criteria

Proposed Exit Criteria:

- Kritik P0 UAT case'leri çalıştırılmış olmalı.
- P0 acceptance criteria'lar karşılanmış veya resmi istisna olarak kabul edilmiş olmalı.
- Açık kritik business defect kalmamalı.
- UAT failure oluşursa defect, severity, fix ve retest akışı tamamlanmalı.
- Known gaps business owner tarafından değerlendirilmiş olmalı.
- Formal sign-off alınmalı veya sign-off alınamadığı açıkça raporlanmalı.

Bu sprintte exit criteria sağlanmadı; UAT execution yapılmadı.

## 11. UAT Scenarios

| Scenario ID | Actor | User Goal | Business Workflow | Priority |
| --- | --- | --- | --- | --- |
| UATS-001 | Supported user | Rolüne uygun alana giriş yapmak | Login -> dashboard -> ilgili menü | P0 |
| UATS-002 | Supported user | Oturumu güvenli kapatmak | User menu -> logout -> protected page check | P0 |
| UATS-003 | Super Admin | Kampüs organizasyonunu hazırlamak | Fakülte -> bina -> kat -> bölüm | P0 |
| UATS-004 | Super Admin | Derslikleri kat planında yönetmek | Kat planı -> derslik yerleşimi -> kaydet -> görüntüle | P1 |
| UATS-005 | Department Admin | Bölüm ders kataloğunu hazırlamak | Akademisyen -> ders -> dönem bilgisi | P0 |
| UATS-006 | Department Admin | Haftalık program oluşturmak | Ders -> akademisyen -> derslik -> gün/saat -> kaydet -> görüntüle | P0 |
| UATS-007 | Department Admin | Çakışmaları yönetmek | Program denemesi -> uyarı/engel -> veri değişmemesi | P0 |
| UATS-008 | Department Admin | Kapsam dışı veriye erişememek | Scope dışı veri -> işlem denemesi -> reddedilme | P0 |
| UATS-009 | Academician | Kendi ders/program bilgisini görmek | Login -> kendi programı/dersleri -> filtrele | P1 |
| UATS-010 | Academician | Kendi dersi için istisna oluşturmak | Program/ders -> iptal/telafi/ek ders -> görüntüle | P1 |
| UATS-011 | Public | Derslik ve program bilgisi bulmak | Public sayfa -> filtre -> kat/program görüntüle | P1 |
| UATS-012 | Unsupported role | Kodda olmayan rolün gap olarak raporlanması | STUDENT/ASSISTANT/HOD beklentisi -> implementation yok | P2 |

## 12. UAT Test Cases

| UAT ID | Requirement | Actor / Role | Business Goal | Preconditions | Test Data | User Workflow | Expected Business Outcome | Acceptance Criteria | Actual Result | Status | Defect ID | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UAT-001 | REQ-3.1.1 | `SUPER_ADMIN` | Yönetim alanına erişmek | UAT environment hazır, Super Admin var | TD-VALID-001 | Login -> dashboard | Super Admin kendi yönetim ekranlarına ulaşır | AC-001 | Not executed | BLOCKED | NA | P0 | Sprint 13.10: backend/frontend çalışmıyor |
| UAT-002 | REQ-3.1.1 | `DEPARTMENT_ADMIN` | Bölüm yönetim alanına erişmek | UAT environment hazır, bölüm admin var | TD-VALID-002 | Login -> dashboard -> dersler/program | Bölüm Admini kendi iş alanına ulaşır | AC-001 | Not executed | BLOCKED | NA | P0 | Environment blocked |
| UAT-003 | REQ-3.1.1 | `ACADEMICIAN` | Kendi ders/program alanına erişmek | UAT environment hazır, akademisyen var | TD-VALID-003 | Login -> dashboard -> ders programı | Akademisyen kendi programını görebileceği alana ulaşır | AC-001 | Not executed | BLOCKED | NA | P0 | Environment blocked |
| UAT-004 | REQ-3.1.5 | Supported user | Oturumu güvenli kapatmak | Kullanıcı login | TD-VALID-001/002/003 | Logout -> protected route dene | Kullanıcı oturumlu alana dönemez | AC-002 | Not executed | BLOCKED | NA | P0 | Frontend/backend running değil |
| UAT-005 | REQ-3.4.1-3.4.6 | `SUPER_ADMIN` | Kampüs organizasyonunu kurmak | Super Admin login, test data hazır | TD-VALID-004..006, TD-VALID-009 | Fakülte -> bina -> kat -> bölüm oluştur | Kurumsal yapı yönetilebilir ve ilişkili görünür | AC-003 | Not executed | BLOCKED | NA | P0 | Business workflow |
| UAT-006 | REQ-3.4.4-3.4.5, BR-12 | `SUPER_ADMIN` | Dersliği kat planında konumlandırmak | Kat ve derslik var | TD-VALID-007/008 | Kat planı -> derslik yerleştir -> kaydet -> tekrar aç | Derslik konumu yönetilebilir | AC-004 | Not executed | BLOCKED | NA | P1 | PDF/base64 format detayı gap |
| UAT-007 | REQ-3.5.1-3.5.2 | `DEPARTMENT_ADMIN` | Yeni dönem derslerini hazırlamak | Bölüm admin scope, akademik dönem | TD-VALID-002, TD-VALID-010 | Akademisyen -> ders oluştur -> listele | Ders kataloğu bölüm ihtiyacına göre hazırlanır | AC-005 | Not executed | BLOCKED | NA | P0 | Business prep workflow |
| UAT-008 | REQ-3.5.3-3.5.4 | `DEPARTMENT_ADMIN` | Geçerli haftalık program oluşturmak | Ders, akademisyen, derslik var | TD-VALID-010, TD-VALID-011 | Program ekranı -> ders/akademisyen/derslik/gün/saat -> kaydet -> görüntüle | Program oluşturulur ve bölümce görüntülenebilir | AC-006 | Not executed | BLOCKED | NA | P0 | Ana DTS UAT |
| UAT-009 | BR-01-BR-04 | `DEPARTMENT_ADMIN` | Çakışan programı doğru yönetmek | Mevcut program ve conflict data var | TD-COMBO-001..007 | Çakışan program dene -> sonucu incele | Sistem çakışmayı iş akışında anlaşılır şekilde engeller, veri bozulmaz | AC-007 | Not executed | BLOCKED | NA | P0 | Negative/business protection |
| UAT-010 | BR-05 | `DEPARTMENT_ADMIN` | Online/fiziksel ders ayrımını yönetmek | Online/fiziksel ders verisi var | TD-VALID-012, TD-COMBO-008 | Online/fiziksel kombinasyonları iş akışında dene | Fiziksel kaynak planlaması doğru korunur | AC-008 | Not executed | BLOCKED | NA | P1 | Online DTO belirsizliği var |
| UAT-011 | BR-06 | `DEPARTMENT_ADMIN` | Kapasite yetersizliğiyle karar vermek | Kapasite sınır verisi var | TD-BOUNDARY-010..012 | Derslik seç -> kapasite uyarısını değerlendir | Kullanıcı yetersiz kapasiteyi fark ederek karar verebilir | AC-009 | Not executed | BLOCKED | NA | P1 | Uyarı kabul biçimi SRS'de açık değil |
| UAT-012 | BR-07 | `DEPARTMENT_ADMIN` | Sadece kendi kapsamını yönetmek | İki farklı bölüm/fakülte datası | TD-INVALID-010 | Scope dışı akademisyen/derslik/program yönetmeyi dene | Bölüm Admini başka kapsamın verisini yönetemez | AC-010 | Not executed | BLOCKED | NA | P0 | Data isolation UAT |
| UAT-013 | REQ-3.6.1-3.6.3, BR-08 | `ACADEMICIAN` | Kendi dersi için istisna yönetmek | Akademisyene ait ders var | TD-VALID-003, TD-VALID-011, TD-SPECIAL-005 | Kendi dersini seç -> iptal/telafi/ek ders oluştur -> görüntüle | Akademisyen kendi dersine ilişkin istisnayı yönetir | AC-011 | Not executed | BLOCKED | NA | P1 | Reservation terminolojisi ScheduleException |
| UAT-014 | REQ-3.2.1-3.2.5, REQ-3.7.1-3.7.5 | Public | Derslik/program bilgisi bulmak | Public veri var | TD-VALID-004..008, TD-VALID-011 | Public sayfa -> filtrele -> kat/program görüntüle | Misafir kullanıcı uygun derslik/program bilgisine ulaşır | AC-012 | Not executed | BLOCKED | NA | P1 | Anlık durum eşiği belirsiz |
| UAT-015 | ER-02, AUTH-06 | `STUDENT`/`ASSISTANT`/`HOD` | Talep edilen ama uygulanmamış rolleri değerlendirmek | Role implementation beklenir | TD-UNSUPPORTED-ROLE-001 | Bu rollerle UAT bekleme | Kabul sonucu üretilemez; implementation gap raporlanır | AC-013 | Not executed | NOT IMPLEMENTED | NA | P2 | Kodda/frontend type'ta rol yok |

## 13. Positive UAT

| UAT ID | Pozitif Business Outcome |
| --- | --- |
| UAT-001 | Super Admin rolüne uygun alana erişir. |
| UAT-002 | Department Admin rolüne uygun alana erişir. |
| UAT-003 | Academician rolüne uygun alana erişir. |
| UAT-004 | Kullanıcı oturumunu güvenli kapatır. |
| UAT-005 | Super Admin kampüs organizasyonunu kurar. |
| UAT-006 | Super Admin kat planı/derslik konumunu yönetir. |
| UAT-007 | Department Admin akademisyen ve ders hazırlığını yapar. |
| UAT-008 | Department Admin geçerli program oluşturur ve görüntüler. |
| UAT-013 | Akademisyen kendi dersine ilişkin istisna yönetir. |
| UAT-014 | Public kullanıcı derslik/program bilgisi bulur. |

Positive UAT count: 10.

## 14. Negative UAT

| UAT ID | Negatif Business Outcome |
| --- | --- |
| UAT-009 | Çakışan program business verisini bozmadan engellenir. |
| UAT-010 | Online/fiziksel kaynak ayrımı yanlış planlamayı önler. |
| UAT-011 | Kapasite yetersizliği kullanıcı kararına görünür olur. |
| UAT-012 | Department Admin kapsam dışı veriyi yönetemez. |
| UAT-015 | Kodda olmayan roller için kabul sonucu üretilmez. |

Negative UAT count: 5.

## 15. Role-Based UAT

| Role | UAT Case'leri | Kapsam |
| --- | --- | --- |
| `SUPER_ADMIN` | UAT-001, UAT-005, UAT-006 | Kampüs, organizasyon, kat planı |
| `DEPARTMENT_ADMIN` | UAT-002, UAT-007, UAT-008, UAT-009, UAT-010, UAT-011, UAT-012 | Ders, program, çakışma, scope |
| `ACADEMICIAN` | UAT-003, UAT-013 | Kendi programı ve ders istisnası |
| Public | UAT-014 | Derslik ve program görüntüleme |
| `STUDENT`/`ASSISTANT`/`HOD` | UAT-015 | NOT IMPLEMENTED gap |

## 16. Data Isolation UAT

| UAT ID | Business Rule | User Perspective | Expected Outcome | Status |
| --- | --- | --- | --- | --- |
| UAT-012 | BR-07 | Bölüm Admini yalnızca kendi bölüm/fakülte kapsamını yönetebilmelidir. | Scope dışı veri değişmez ve kullanıcı yetki sınırını aşamaz. | BLOCKED |
| UAT-013 | BR-08 | Akademisyen yalnızca kendi dersleri için istisna oluşturabilmelidir. | Başka akademisyenin dersi için işlem yapılamaz. | BLOCKED |
| UAT-014 | BR-13 | Public kullanıcı yalnızca görüntüleme yapabilmelidir. | Public alan bilgi verir, yönetim işlemi sunmaz. | BLOCKED |

## 17. Test Data

| Test Data | UAT Kullanımı |
| --- | --- |
| TD-VALID-001 | Super Admin login ve yönetim akışları |
| TD-VALID-002 | Department Admin login, ders/program/scope akışları |
| TD-VALID-003 | Akademisyen login ve kendi ders akışları |
| TD-VALID-004..006 | Fakülte, bina, kat setup |
| TD-VALID-007..008 | Kat planı ve derslik |
| TD-VALID-009 | Bölüm setup |
| TD-VALID-010 | Ders oluşturma |
| TD-VALID-011 | Fiziksel schedule |
| TD-VALID-012 | Online schedule |
| TD-BOUNDARY-010..012 | Kapasite karar alanı |
| TD-COMBO-001..007 | Çakışma business akışları |
| TD-COMBO-008 | Online/fiziksel kombinasyon |
| TD-INVALID-010 | Department Admin scope dışı veri |
| TD-SPECIAL-005 | Duplicate exception |
| TD-UNSUPPORTED-ROLE-001 | STUDENT/ASSISTANT/HOD implementation gap |

UAT execution için TD-* datasının runtime test ortamında gerçekten yüklü olduğu doğrulanmalıdır. Sprint 13.10'a göre bu doğrulama yapılmamıştır.

## 18. Environment

Sprint 13.10 bulguları UAT execution için blocker oluşturmaktadır:

| Environment Alanı | Durum | UAT Etkisi |
| --- | --- | --- |
| Backend | `localhost:8080` kapalı | Login, API ve business workflow çalıştırılamaz |
| Frontend | `localhost:5173` kapalı | UI tabanlı UAT çalıştırılamaz |
| Maven | CLI ve wrapper yok | Backend test runner kullanılamaz |
| Docker | CLI var, daemon erişilemiyor | Repeatable stack başlatılamaz |
| Database | `localhost:5432` açık | DTS DB/migration/test data doğrulanmadı |
| Browser/E2E | Resmi matrix ve araç yok | UAT automation/visual execution yok |

Sonuç: UAT execution environment is not ready.

## 19. Requirement Traceability

| Requirement / Need | Acceptance Criterion | UAT Scenario | UAT Test Case | Test Data |
| --- | --- | --- | --- | --- |
| REQ-3.1.1 | AC-001 | UATS-001 | UAT-001..003 | TD-VALID-001..003 |
| REQ-3.1.5 | AC-002 | UATS-002 | UAT-004 | TD-VALID-001..003 |
| REQ-3.4.1-3.4.6 | AC-003 | UATS-003 | UAT-005 | TD-VALID-004..006, TD-VALID-009 |
| REQ-3.4.4-3.4.5, BR-12 | AC-004 | UATS-004 | UAT-006 | TD-VALID-007..008 |
| REQ-3.5.1-3.5.2 | AC-005 | UATS-005 | UAT-007 | TD-VALID-002, TD-VALID-010 |
| REQ-3.5.3-3.5.4 | AC-006 | UATS-006 | UAT-008 | TD-VALID-010..011 |
| BR-01-BR-04 | AC-007 | UATS-007 | UAT-009 | TD-COMBO-001..007 |
| BR-05 | AC-008 | UATS-007 | UAT-010 | TD-VALID-012, TD-COMBO-008 |
| BR-06 | AC-009 | UATS-006 | UAT-011 | TD-BOUNDARY-010..012 |
| BR-07 | AC-010 | UATS-008 | UAT-012 | TD-INVALID-010 |
| REQ-3.6.1-3.6.3, BR-08 | AC-011 | UATS-009, UATS-010 | UAT-013 | TD-VALID-003, TD-VALID-011 |
| REQ-3.2.1-3.2.5, REQ-3.7.1-3.7.5, BR-13 | AC-012 | UATS-011 | UAT-014 | TD-VALID-004..008 |
| ER-02, AUTH-06 | AC-013 | UATS-012 | UAT-015 | TD-UNSUPPORTED-ROLE-001 |

Requirements covered by UAT: 13 grouped requirement/rule areas.

## 20. UAT Results

UAT testleri çalıştırılmadı. PASS/FAIL sonucu üretilmedi.

| Status | Count | Açıklama |
| --- | ---: | --- |
| PASS | 0 | Gerçek UAT execution yok |
| FAIL | 0 | Gerçek UAT execution yok |
| BLOCKED | 14 | Sprint 13.10 environment eksikleri nedeniyle çalıştırılamadı |
| NOT RUN | 0 | Uygulanabilir case'ler environment nedeniyle `BLOCKED` sayıldı |
| NOT IMPLEMENTED | 1 | `STUDENT`/`ASSISTANT`/`HOD` rolleri |
| NA | 0 | Kapsam dışı case yok |

## 21. Defect Handling

UAT failure oluşursa izlenecek akış:

```text
UAT case
  -> FAIL
  -> Defect record
  -> Severity / Priority
  -> Fix decision
  -> Retest
  -> PASS or formally accepted exception
```

Sprint 13.13 defect management için aktarılacak alanlar:

- UAT ID
- Acceptance criterion
- Actor / role
- Business goal
- Actual result
- Expected business outcome
- Severity
- Priority
- Environment
- Test data
- Retest status

Bu sprintte gerçek UAT failure doğrulanmadığı için defect oluşturulmadı.

## 22. Sign-Off

Formal sign-off not performed.

Sign-off için önerilen minimum bilgiler:

- Sign-off veren business owner / stakeholder.
- Çalıştırılan UAT case listesi.
- PASS/FAIL/BLOCKED/NOT IMPLEMENTED özeti.
- Kabul edilen açık riskler.
- Açık defect listesi.
- Retest durumu.
- Sign-off tarihi ve kapsamı.

Bu sprintte environment hazır olmadığı ve gerçek kullanıcı testi yapılmadığı için kabul/onay sonucu üretilemez.

## 23. Alpha / Beta / Other Acceptance Types

| Acceptance Type | DTS İçin Durum | Not |
| --- | --- | --- |
| UAT | Tasarlandı, çalıştırılmadı | Bu raporun ana kapsamı |
| OAT | Not executed | Operasyonel readiness ayrıca tanımlanmalı |
| Contract Acceptance | Not defined | Sözleşme/kabul protokolü dokümante edilmedi |
| Regulatory Acceptance | Not applicable / not defined | Regülasyon kapsamı belirtilmedi |
| Alpha | Not executed | İç pilot kullanıcı testi yapılmadı |
| Beta | Not executed | Dış kullanıcı grubu ile test yapılmadı |

## 24. Known Gaps

| Gap | Etki |
| --- | --- |
| UAT environment hazır değil | UAT case'leri çalıştırılamaz |
| Formal stakeholder yok | Sign-off alınamaz |
| `STUDENT`, `ASSISTANT`, `HOD` yok | Bu roller için UAT kabul sonucu üretilemez |
| Public anlık durum eşiği belirsiz | Public UAT acceptance criterion kısmen belirsiz |
| Online schedule create DTO belirsizliği | Online/fiziksel UAT beklenen sonucu netleşmeyebilir |
| Reservation vs ScheduleException terminolojisi | Akademisyen UAT dili ve kabul kriteri netleşmeli |
| Başlamış ders iptali kuralı belirsiz | UAT-013 kapsamındaki bazı iptal beklentileri kesinleşmez |
| Browser/E2E aracı yok | UI UAT otomasyonu yapılamaz |
| Runtime test data doğrulanmadı | UAT precondition sağlanmış kabul edilemez |

## 25. Sprint 13.12 Automation Inputs

Sprint 13.12 için otomasyona uygun UAT adayları:

| Candidate | UAT ID | Önerilen Otomasyon Seviyesi | Priority |
| --- | --- | --- | --- |
| Role-based login smoke | UAT-001..003 | E2E / API + UI | P0 |
| Logout/session close | UAT-004 | E2E | P0 |
| Super Admin campus setup smoke | UAT-005 | E2E | P0 |
| Department Admin course setup | UAT-007 | E2E / API-assisted E2E | P0 |
| Department Admin schedule creation | UAT-008 | E2E | P0 |
| Conflict handling business flow | UAT-009 | E2E + integration fixture | P0 |
| Department scope isolation | UAT-012 | E2E + API assertion | P0 |
| Academician own exception flow | UAT-013 | E2E | P1 |
| Public classroom/program discovery | UAT-014 | E2E / visual smoke | P1 |
| Unsupported role gap check | UAT-015 | Static/contract check | P2 |

Sprint 13.12'de otomasyon yapılmadı; yalnızca adaylar belirlendi.

## 26. Sonuç

Sprint 13.11 kapsamında DTS için UAT yaklaşımı, kabul kriterleri, role-based business workflows, positive/negative UAT case'leri, data isolation UAT, traceability, sign-off yaklaşımı ve Sprint 13.12 automation girdileri hazırlanmıştır.

Gerçek kullanıcı testi, formal stakeholder sign-off ve UAT execution yapılmadı. Sprint 13.10 environment eksikleri nedeniyle uygulanabilir 14 UAT case `BLOCKED`, kodda bulunmayan roller için 1 UAT case `NOT IMPLEMENTED` olarak raporlandı. PASS/FAIL sonucu üretilmedi.

Final metrikler:

| Metrik | Değer |
| --- | --- |
| UAT scenario count | 12 |
| UAT test case count | 15 |
| Positive count | 10 |
| Negative count | 5 |
| P0/P1/P2 distribution | 9 / 5 / 1 |
| PASS | 0 |
| FAIL | 0 |
| BLOCKED | 14 |
| NOT RUN | 0 |
| NOT IMPLEMENTED | 1 |
| Requirements covered | 13 grouped requirement/rule areas |
| Acceptance criteria covered | 13 |
| Roles covered | 4 implemented actor groups + 3 unsupported role gaps |
| Business workflows covered | 12 |
| Open gaps | 9 |
| Sign-off status | Formal sign-off not performed |
| Production code değişikliği | Yok |
| Dependency değişikliği | Yok |
