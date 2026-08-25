# DTS - Sprint 13.9 Non-Functional Tests

## 1. Amaç

Sprint 13.9'un amacı DTS'nin fonksiyonel doğruluğundan çok kalite özellikleri için test tasarımı oluşturmaktır. Bu rapor performance, load, stress, scalability, security, usability, compatibility ve responsive testing alanlarını kapsar.

Bu sprintte gerçek performans, yük, stres veya güvenlik taraması çalıştırılmamıştır. Ölçülmeyen değerler sonuç gibi raporlanmamıştır. Tüm test case'ler `DESIGNED / NOT RUN` durumundadır.

## 2. Kapsam

İncelenen kaynaklar:

- `SRS 2.md`: use case'ler, ER modeli, veri sözlüğü ve ölçülebilir olmayan NFR notları.
- `README.md`, `docker-compose.yml`, backend/frontend Dockerfile'ları ve ortam değişkenleri.
- `docs/testing/SPRINT_13_1_REQUIREMENT_ANALYSIS.md`
- `docs/testing/SPRINT_13_2_TEST_CASE_DESIGN.md`
- `docs/testing/SPRINT_13_3_TEST_DATA.md`
- `docs/testing/SPRINT_13_4_UNIT_TESTS.md`
- `docs/testing/SPRINT_13_6_INTEGRATION_TESTS.md`
- `docs/testing/SPRINT_13_7_SYSTEM_TESTS.md`
- `docs/testing/SPRINT_13_8_STATE_WORKFLOW_EXPLORATORY.md`
- Backend `pom.xml`, Spring Security config, controller authorization anotasyonları, application config.
- Frontend `package.json`, Vite config, router, auth store ve axios interceptor.

Kapsama alınmayanlar:

- Yeni test framework kurulumu.
- k6/JMeter/Gatling/Playwright/Cypress eklenmesi.
- Production code, test code, migration veya dependency değişikliği.
- Ölçülmemiş PASS/FAIL sonucu.
- Kodda bulunmayan `STUDENT`, `ASSISTANT`, `HOD` rolleri için gerçek implementation varmış gibi test tasarımı.

## 3. Mevcut Test Altyapısı

| Alan | Mevcut Durum | Sonuç |
| --- | --- | --- |
| Backend unit test | Maven, JUnit 5, Spring Boot Test, Mockito/AssertJ altyapısı `spring-boot-starter-test` ile mevcut | Var |
| Backend security test | `spring-security-test` mevcut | Var |
| Backend integration test | H2, Spring context, MockMvc ve `*IT` pattern'i Sprint 13.6'da hazırlanmış | Var, önceki sprintte çalıştırılamamış |
| Backend test runner | `mvn test`; önceki raporda `mvn` PATH üzerinde bulunmadığı belirtilmiş | Ortam bağımlı |
| Frontend static check | `npm run lint`, `npm run build` | Var |
| Frontend unit test | Jest/Vitest dependency yok | Yok |
| Frontend E2E | Playwright/Cypress dependency yok | Yok |
| Performance/load/stress | JMeter, k6, Gatling veya benzeri araç bulunmadı | Yok |
| Security scanning | SAST/DAST aracı bulunmadı | Yok |
| Compatibility automation | Browser matrix veya cross-browser runner yok | Yok |
| Docker test ortamı | PostgreSQL, backend, frontend servisleri ve healthcheck var | Var |
| Observability | Actuator `health,info`; metrik endpoint exposure yok | Sınırlı |

## 4. Non-Functional Test Strategy

Yaklaşım:

- P0 testler auth, authorization, veri izolasyonu, program görüntüleme/oluşturma ve çakışma kontrolüne odaklanır.
- Performance/load/stress testleri gerçek eşik üretmez; SRS'de hedef olmadığı için kabul kriteri "onaylı threshold tanımlanınca karşılanmalı" şeklinde tasarlanır.
- Load testing beklenen normal kullanım yükünü, stress testing beklenen kapasitenin üzerindeki zorlayıcı yükü temsil eder.
- Security testleri doğrulanmamış vulnerability raporlamaz; authentication, authorization, invalid token ve scope izolasyonu üzerinden negatif test planlar.
- Usability ve compatibility testleri gözlem ve ortam matrisi tasarımıdır; formal kullanıcı araştırması veya cross-browser execution yapılmadığı için sonuç üretilmez.

Durum sözlüğü:

| Durum | Anlam |
| --- | --- |
| DESIGNED | Test ölçülebilir şekilde tasarlandı. |
| RUN | Test gerçekten çalıştırıldı. |
| PASS | Çalıştırıldı ve geçti. |
| FAIL | Çalıştırıldı ve başarısız oldu. |
| NOT RUN | Çalıştırılmadı. |
| BLOCKED | Çalıştırma için gerekli bağımlılık veya ortam eksik. |

## 5. Performance Testing

SRS'de response time, throughput veya error-rate hedefi belirtilmemiştir. Bu nedenle aşağıdaki testlerde gerçek kabul eşiği `TBD` olarak bırakılmıştır.

| ID | Request / Page | Input | Expected Behavior | Measurement | Acceptance Criterion | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NFT-PERF-001 | `POST /api/auth/login` | TD-VALID-001/002/003 | Geçerli kullanıcı token alır. | Response time, error rate | SRS'de threshold yok; Sprint 13.10'da onaylı eşik tanımlanmalı. | P0 | DESIGNED / NOT RUN |
| NFT-PERF-002 | `GET /api/public/...` derslik görüntüleme | TD-VALID-004..008 | Public derslik listesi ve durumlar döner. | Response time, payload size | SRS'de threshold yok; public ekran için eşik tanımlanmalı. | P1 | DESIGNED / NOT RUN |
| NFT-PERF-003 | Public derslik filtreleme sayfası | Fakülte/bina/kat filtreleri | Filtre sonucu tutarlı görünür. | UI render time, API response time | Threshold yok; ölçüm hedefi tanımlanmalı. | P1 | DESIGNED / NOT RUN |
| NFT-PERF-004 | Program görüntüleme | TD-VALID-011/012 | Haftalık program listelenir. | Response time, DB query time, error rate | Threshold yok; aktif dönem/veri hacmi belirtilmeli. | P0 | DESIGNED / NOT RUN |
| NFT-PERF-005 | Program filtreleme | Dönem, sınıf, akademisyen, derslik filtreleri | Filtreler doğru liste döndürür. | Response time, frontend interaction latency | Threshold yok. | P1 | DESIGNED / NOT RUN |
| NFT-PERF-006 | Program oluşturma | TD-VALID-010, TD-VALID-011 | Kayıt oluşur ve liste güncellenir. | Response time, DB write time, error rate | Threshold yok. | P0 | DESIGNED / NOT RUN |
| NFT-PERF-007 | Çakışma kontrolü | TD-COMBO-001..007 | Çakışmalar reddedilir. | Response time, validation path latency | Threshold yok; conflict check için eşik tanımlanmalı. | P0 | DESIGNED / NOT RUN |
| NFT-PERF-008 | Public program görüntüleme | `/programlar/sinif`, `/programlar/bolum`, `/programlar/akademisyen` | Public program verisi görünür. | Response time, render time, error rate | Threshold yok. | P1 | DESIGNED / NOT RUN |

## 6. Load Testing

Load Testing: beklenen normal yük altında sistem davranışını ölçer.

Dokümanlarda beklenen kullanıcı sayısı, request rate veya normal kullanım profili belirtilmemiştir. Bu yüzden `Concurrent users`, `Request rate` ve `Duration` alanları `Expected load not specified` olarak işaretlenmiştir.

| ID | Endpoint / Page | Concurrent Users | Request Rate | Duration | Expected Behavior | Metrics | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFT-LOAD-001 | Login istekleri | Expected load not specified | Expected load not specified | Expected load not specified | Geçerli/hatalı login istekleri tutarlı cevaplanır. | Response time, throughput, error rate | P0 | DESIGNED / NOT RUN |
| NFT-LOAD-002 | Public derslik görüntüleme ve filtreleme | Expected load not specified | Expected load not specified | Expected load not specified | Public kullanıcılar derslik ve kat bilgilerini alır. | Response time, throughput, DB load | P1 | DESIGNED / NOT RUN |
| NFT-LOAD-003 | Program görüntüleme | Expected load not specified | Expected load not specified | Expected load not specified | Authenticated kullanıcılar kendi kapsamındaki programı görür. | Response time, throughput, error rate | P0 | DESIGNED / NOT RUN |
| NFT-LOAD-004 | Public program görüntüleme | Expected load not specified | Expected load not specified | Expected load not specified | Public program sayfaları veri döndürür. | Response time, render time, error rate | P1 | DESIGNED / NOT RUN |

## 7. Stress Testing

Stress Testing: normal sınırların üzerinde sistem davranışını ölçer. Load senaryoları ile aynı etiketlenmez; bu testlerde amaç beklenen kapasitenin üstüne çıkıldığında hata oranı, kaynak kullanımı ve recovery davranışını gözlemlemektir.

Beklenen kapasite dokümante edilmediği için stress yük seviyeleri sayı olarak verilmemiştir.

| ID | Senaryo | Neden Stress | Ölçüm | Expected Behavior | Acceptance Criterion | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NFT-STRESS-001 | Login yükünü kademeli artırma | Normal load bilinmediği için kapasite üstü davranış ayrıca tanımlanmalı | Response time, 4xx/5xx rate, recovery | Sistem kontrollü hata üretmeli, veri bozulmamalı. | Kapasite eşiği Sprint 13.10'da tanımlanmalı. | P0 | DESIGNED / NOT RUN |
| NFT-STRESS-002 | Program listeleme yükünü kademeli artırma | En kritik okuma akışı zorlanır | Response time, DB connection behavior, error rate | Program verisi tutarlı kalmalı. | Threshold yok. | P0 | DESIGNED / NOT RUN |
| NFT-STRESS-003 | Çakışmalı program oluşturma yükünü kademeli artırma | Yazma + validation + DB constraint birlikte zorlanır | Error rate, response time, duplicate write | Çakışmalı kayıt oluşmamalı. | Threshold yok; veri bütünlüğü korunmalı. | P0 | DESIGNED / NOT RUN |
| NFT-STRESS-004 | Public derslik ve program endpointlerini birlikte zorlama | Anonymous trafiğin sistemi etkilemesi ölçülür | Throughput, response time, recovery | Protected endpoint güvenliği etkilenmemeli. | Threshold yok. | P1 | DESIGNED / NOT RUN |

## 8. Scalability Testing

SRS'de öğrenci, akademisyen, ders, derslik, program veya dönem veri hacmi hedefleri belirtilmemiştir. Bu nedenle ölçek seviyeleri sayısal verilmemiştir.

| ID | Büyüyen Boyut | Test Tasarımı | Measurement | Expected Behavior | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NFT-SCAL-001 | Ders sayısı | Ders listesi ve programlama ekranı artan ders datası ile ölçülür. | Response time, DB query time, memory | Listeleme ve filtreleme tutarlı kalmalı. | P1 | DESIGNED / NOT RUN |
| NFT-SCAL-002 | Derslik sayısı | Public derslik, kat planı ve uygunluk snapshot'ı artan derslik datası ile ölçülür. | Response time, payload size, render time | Public ekran bozulmadan veri göstermeli. | P1 | DESIGNED / NOT RUN |
| NFT-SCAL-003 | Haftalık program kaydı | Çakışma kontrolü artan program kaydıyla ölçülür. | Query time, response time, error rate | Yanlış conflict/no-conflict sonucu üretmemeli. | P0 | DESIGNED / NOT RUN |
| NFT-SCAL-004 | Akademisyen sayısı | Akademisyen filtreleri ve sahiplik kontrolleri artan akademisyen datasıyla ölçülür. | Response time, DB behavior | Scope ve ownership korunmalı. | P1 | DESIGNED / NOT RUN |
| NFT-SCAL-005 | Akademik dönem geçmişi | Aktif/geçmiş dönem verisi arttığında dönem filtreleri ölçülür. | Query time, memory, error rate | Tek aktif dönem kuralı bozulmamalı. | P1 | DESIGNED / NOT RUN |

## 9. Security Testing

Security testleri mevcut Spring Security, JWT, `@PreAuthorize`, frontend route guard ve scope servisleri üzerinden tasarlanmıştır. Gerçek güvenlik açığı doğrulanmamıştır.

| ID | Security Area | Requirement | Role | Test Data | Expected Result | Measurement / Evidence | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFT-SEC-001 | Authentication | Geçerli login | `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `ACADEMICIAN` | TD-VALID-001..003 | Token alınır. | HTTP status, token presence | P0 | DESIGNED / NOT RUN |
| NFT-SEC-002 | Authentication | Geçersiz login | Any | TD-INVALID-001 | Login reddedilir. | HTTP status, error body | P0 | DESIGNED / NOT RUN |
| NFT-SEC-003 | Authentication | Token olmadan protected API | Anonymous | TD-INVALID-014 | 401 JSON cevabı. | HTTP status, body | P0 | DESIGNED / NOT RUN |
| NFT-SEC-004 | Authentication | Geçersiz/expired token | Any | TD-INVALID-014 | 401, session temizliği. | HTTP status, frontend storage state | P0 | DESIGNED / NOT RUN |
| NFT-SEC-005 | Authorization | Wrong role admin endpoint | `ACADEMICIAN` | TD-VALID-003 | 403 veya frontend redirect. | HTTP status, route state | P0 | DESIGNED / NOT RUN |
| NFT-SEC-006 | Authorization | Super admin-only endpoint | `DEPARTMENT_ADMIN` | TD-VALID-002 | 403. | HTTP status, DB unchanged | P0 | DESIGNED / NOT RUN |
| NFT-SEC-007 | Data Isolation | Department admin başka fakülte/bölüm verisi | `DEPARTMENT_ADMIN` | TD-INVALID-010 | Access denied, veri değişmez. | HTTP status, DB unchanged | P0 | DESIGNED / NOT RUN |
| NFT-SEC-008 | Ownership | Akademisyen başkasının ders istisnası | `ACADEMICIAN` | TD-INVALID-015 | Access denied. | HTTP status, DB unchanged | P0 | DESIGNED / NOT RUN |
| NFT-SEC-009 | Public API | Public endpoint yalnızca görüntüleme | Anonymous | TD-VALID-004..008 | Public read çalışır; protected write çalışmaz. | HTTP status matrix | P0 | DESIGNED / NOT RUN |
| NFT-SEC-010 | Token lifecycle | Reset token tekrar kullanımı | Public | TD-SPECIAL-005 benzeri token fixture | Kullanılmış/expired token reddedilir. | HTTP status, token state | P0 | DESIGNED / NOT RUN |

SQL injection, XSS ve CSRF testleri için otomatik araç veya manuel execution yapılmadı. Spring Security config içinde CSRF stateless API için disable edilmiş; bu tek başına bulgu olarak raporlanmamıştır.

## 10. Usability Testing

Formal usability study yapılmadı. Aşağıdaki testler gözlem formu olarak tasarlanmıştır.

| ID | Role | Task | Preconditions | User Action | Expected Usability Behavior | Observation | Issue | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NFT-USE-001 | Public | Derslik arama | Kampüs verisi var | `/classrooms` üzerinde filtreleri kullanır | Filtreler anlaşılır, empty/loading/error state görünür. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |
| NFT-USE-002 | Public | Public program görüntüleme | Program verisi var | Sınıf/bölüm/akademisyen programı açar | Program okunabilir ve filtreler anlaşılır olmalı. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |
| NFT-USE-003 | `SUPER_ADMIN` | Kampüs varlığı oluşturma | Login + yetki | Fakülte/bina/kat akışını tamamlar | Form etiketleri, başarı/hata mesajları açık olmalı. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |
| NFT-USE-004 | `SUPER_ADMIN` | Kat planı düzenleme | Kat var | Layout/slot planı kaydeder | Yerleşim kontrolleri veri kaybı riski olmadan anlaşılır olmalı. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |
| NFT-USE-005 | `DEPARTMENT_ADMIN` | Ders oluşturma | Akademisyen ve dönem var | Ders formunu doldurur | Zorunlu alanlar ve validation mesajları açık olmalı. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |
| NFT-USE-006 | `DEPARTMENT_ADMIN` | Program oluşturma | Ders/derslik var | Slot ve derslik seçerek program kaydeder | Busy/suitable/alternative ayrımı anlaşılır olmalı. | Not observed | Not assessed | P0 | DESIGNED / NOT RUN |
| NFT-USE-007 | `ACADEMICIAN` | Kendi programını okuma | Kendi dersleri var | Program ve filtreleri kullanır | Read-only durum açık olmalı; yanlışlıkla mutate beklentisi oluşmamalı. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |
| NFT-USE-008 | `ACADEMICIAN` | İptal/telafi/ek ders oluşturma | Kendi dersi var | Exception formunu doldurur | Tarih, slot ve hata mesajları anlaşılır olmalı. | Not observed | Not assessed | P1 | DESIGNED / NOT RUN |

`STUDENT`, `ASSISTANT` ve `HOD` rolleri kodda bulunmadığından usability testi yapılabilir implementation yoktur.

## 11. Compatibility Testing

Resmi desteklenen browser/device matrisi dokümantasyonda belirtilmemiştir. Aşağıdaki ortamlar `Compatibility candidate` olarak tasarlanmıştır.

| ID | Environment | Scope | Expected Behavior | Measurement | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NFT-COMP-001 | Chrome desktop candidate | Public + protected ana akışlar | UI render olur, API çağrıları çalışır. | Visual check, console error, network status | P1 | DESIGNED / NOT RUN |
| NFT-COMP-002 | Edge desktop candidate | Public + protected ana akışlar | Chrome ile eşdeğer davranış. | Visual check, console error | P1 | DESIGNED / NOT RUN |
| NFT-COMP-003 | Firefox desktop candidate | Public + protected ana akışlar | Formlar, tablolar ve router çalışır. | Visual check, console error | P1 | DESIGNED / NOT RUN |
| NFT-COMP-004 | Tablet width candidate | Public derslik/program ekranları | Layout taşmadan kullanılabilir. | Screenshot review, interaction check | P1 | DESIGNED / NOT RUN |
| NFT-COMP-005 | Mobile width candidate | Login, public derslik, program görüntüleme | Navbar/sidebar, tablo ve filtreler kullanılabilir. | Screenshot review, interaction check | P1 | DESIGNED / NOT RUN |

## 12. Responsive Testing

UI responsive test altyapısı yoktur. Aşağıdaki viewport'lar adaydır; resmi destek matrisi değildir.

| ID | Viewport Candidate | Screen / Component | Expected Behavior | Measurement | Priority | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NFT-RESP-001 | Desktop candidate | Dashboard layout/sidebar/navbar | Navigasyon ve içerik çakışmaz. | Screenshot, visual inspection | P1 | DESIGNED / NOT RUN |
| NFT-RESP-002 | Tablet candidate | Derslik filtreleri ve public floor view | Filtreler ve kat planı taşmadan görünür. | Screenshot, interaction check | P1 | DESIGNED / NOT RUN |
| NFT-RESP-003 | Mobile candidate | Login/forgot/reset forms | Form alanları okunur ve kullanılabilir. | Screenshot, form interaction | P1 | DESIGNED / NOT RUN |
| NFT-RESP-004 | Mobile candidate | Ders programı tablosu/kartları | Program satırları okunur, filtreler erişilebilir olur. | Screenshot, scroll behavior | P0 | DESIGNED / NOT RUN |
| NFT-RESP-005 | Mobile candidate | Modal/dialog akışları | Modal içerik viewport dışına kontrolsüz taşmaz. | Screenshot, keyboard/scroll check | P1 | DESIGNED / NOT RUN |

## 13. Risk-Based Prioritization

| Öncelik | Kapsam | Gerekçe |
| --- | --- | --- |
| P0 | Auth, authorization, data isolation, program görüntüleme/oluşturma, çakışma kontrolü, kritik responsive program görünümü | Güvenlik, veri bütünlüğü ve DTS'nin ana iş akışı etkilenir. |
| P1 | Public görüntüleme, derslik filtreleme, usability, compatibility, scalability veri büyümesi | Kullanılabilirlik ve operasyonel kalite etkilenir. |
| P2 | Yardımcı UI/state alanları | Ana iş akışını doğrudan durdurma riski daha düşüktür. |

P0/P1/P2 dağılımı:

- P0: 22
- P1: 27
- P2: 0

## 14. Test Environment

Bilinen ortam girdileri:

| Alan | Mevcut Bilgi |
| --- | --- |
| Backend | Spring Boot 3.3.5, Java 21, Maven 3.9+ gereksinimi |
| Frontend | React 19, Vite 5, TypeScript, Tailwind, Node.js 20+ gereksinimi |
| Database | PostgreSQL 16-alpine Docker servisi; test için H2 dependency mevcut |
| Docker | `docker compose up --build` ile postgres/backend/frontend servisleri |
| Backend port | `8080` |
| Frontend port | Docker'da `5173:80`, dev server `5173` |
| API base URL | `VITE_API_URL` veya default `http://localhost:8080/api` |
| Browser | Resmi destek matrisi belirtilmemiş |
| OS | Bu çalışma alanı Windows üzerinde; resmi OS matrisi belirtilmemiş |
| Network koşulları | Belirtilmemiş |
| Hardware | Belirtilmemiş |
| Test data | Sprint 13.3 `TD-*` verileri; sentetik fixture önerilir |
| Observability | `/actuator/health`, `/actuator/info`; performance metrik endpointleri açık değil |

## 15. Test Cases

Bu bölüm önceki non-functional bölümlerdeki test case'lerin toplu indeksidir.

| Test Type | Test Case ID Aralığı | Sayı | Status |
| --- | --- | ---: | --- |
| Performance | NFT-PERF-001..008 | 8 | NOT RUN |
| Load | NFT-LOAD-001..004 | 4 | NOT RUN |
| Stress | NFT-STRESS-001..004 | 4 | NOT RUN |
| Scalability | NFT-SCAL-001..005 | 5 | NOT RUN |
| Security | NFT-SEC-001..010 | 10 | NOT RUN |
| Usability | NFT-USE-001..008 | 8 | NOT RUN |
| Compatibility | NFT-COMP-001..005 | 5 | NOT RUN |
| Responsive | NFT-RESP-001..005 | 5 | NOT RUN |

Toplam test case: 49.

## 16. Test Data

| Test Data | Non-Functional Kullanım |
| --- | --- |
| TD-VALID-001 | Super admin login, admin endpoint, usability |
| TD-VALID-002 | Department admin login, scope içi program, load/security |
| TD-VALID-003 | Academician login, read-only program, ownership |
| TD-VALID-004..008 | Public derslik, kat planı, compatibility/responsive |
| TD-VALID-010..013 | Ders/program/performance ve schedule state |
| TD-INVALID-001..002 | Login negatif security/performance |
| TD-INVALID-010 | Scope dışı veri izolasyonu |
| TD-INVALID-011..014 | Program ve protected endpoint negatifleri |
| TD-INVALID-015 | Ownership/security negatifleri |
| TD-COMBO-001..007 | Çakışma kontrolü performance/stress |
| TD-SPECIAL-005 | Duplicate exception/reset token benzeri negatif lifecycle |
| TD-SPECIAL-007 | Public status threshold belirsizliği |
| TD-SPECIAL-008 | Kat planı format/görsel validasyon |

Yeni kalıcı test data eklenmedi. Büyük ölçekli load/stress/scalability datası için Sprint 13.10'da seed stratejisi gerekir.

## 17. Requirement Traceability

| Requirement / Risk | Non-Functional Testler | Trace Durumu |
| --- | --- | --- |
| REQ-3.1.1 Login | NFT-PERF-001, NFT-LOAD-001, NFT-STRESS-001, NFT-SEC-001, NFT-SEC-002 | COVERED |
| REQ-3.1.5 Logout/session | NFT-SEC-004, NFT-USE-007 | PARTIAL |
| REQ-3.2.1-3.2.5 Public classroom | NFT-PERF-002, NFT-PERF-003, NFT-LOAD-002, NFT-COMP-001..005, NFT-RESP-002 | COVERED |
| REQ-3.5.2 Ders yönetimi | NFT-SCAL-001, NFT-USE-005 | COVERED |
| REQ-3.5.3 Program görüntüleme | NFT-PERF-004, NFT-LOAD-003, NFT-STRESS-002, NFT-RESP-004 | COVERED |
| REQ-3.5.4 Program oluşturma/çakışma | NFT-PERF-006, NFT-PERF-007, NFT-STRESS-003, NFT-SCAL-003, NFT-USE-006 | COVERED |
| REQ-3.6.1-3.6.3 Exception akışları | NFT-USE-008, NFT-SEC-008 | COVERED |
| BR-07 Data isolation | NFT-SEC-007 | COVERED |
| BR-08 Ownership | NFT-SEC-008 | COVERED |
| BR-12 Floor layout authorization | NFT-SEC-006, NFT-USE-004 | COVERED |
| BR-13 Public read-only access | NFT-SEC-009, NFT-LOAD-004 | COVERED |
| NFR performance threshold | NFT-PERF-001..008, NFT-LOAD-001..004, NFT-STRESS-001..004 | UNCLEAR |
| NFR browser/device support | NFT-COMP-001..005, NFT-RESP-001..005 | UNCLEAR |

Traceability durumu: functional requirement ve ana riskler testlere bağlandı. SRS'de ölçülebilir performance/browser hedefleri bulunmadığı için NFR threshold trace'i `UNCLEAR` kaldı.

## 18. Measurement / Acceptance Criteria

| Alan | Ölçüm | Kabul Kriteri |
| --- | --- | --- |
| Response time | API endpoint response time | SRS'de eşik yok; Sprint 13.10'da ortam ve threshold tanımlanmalı. |
| Throughput | Request/sec veya transaction/sec | Expected load belirtilmediği için eşik yok. |
| Error rate | 4xx/5xx ayrımı | Geçerli isteklerde kabul edilebilir hata oranı tanımlanmalı; negatif testlerde beklenen 4xx hata sayılır. |
| Resource usage | CPU, memory, DB connection usage | Ortam/hardware bilinmediği için eşik yok. |
| Recovery | Stress sonrası healthcheck ve veri tutarlılığı | `/actuator/health` dönmeli; veri bütünlüğü bozulmamalı. |
| Security | HTTP status, response body, DB unchanged | Unauthorized 401, forbidden/scope ihlali 403 veya access denied davranışı vermeli. |
| Usability | Task completion observation, error clarity | Formal study yok; observation alanı execution sırasında doldurulmalı. |
| Compatibility | Browser console, visual inspection, network status | Resmi browser matrix yok; candidate ortamda temel akışlar bozulmamalı. |
| Responsive | Screenshot, layout overlap, scroll behavior | Resmi viewport matrix yok; candidate viewportlarda kritik ekranlar kullanılabilir olmalı. |

## 19. Executed Tests

Bu sprintte non-functional test çalıştırılmadı.

| Metric | Value |
| --- | ---: |
| Executed | 0 |
| PASS | 0 |
| FAIL | 0 |
| Measured performance result | Yok |
| Confirmed security vulnerability | Yok |

## 20. Not Run / Blocked Tests

| Durum | Testler | Gerekçe |
| --- | --- | --- |
| NOT RUN | 49 test case | Sprint 13.9 kapsamı test tasarımıdır; gerçek load/performance/security/usability/compatibility execution yapılmadı. |
| BLOCKED | 0 test case | Testler çalıştırılmaya denenmediği için blocked olarak işaretlenmedi; altyapı eksikleri not olarak raporlandı. |

Altyapı eksikleri:

- Load/performance/stress aracı yok.
- Frontend E2E/cross-browser aracı yok.
- Resmi browser/device destek matrisi yok.
- SRS'de ölçülebilir performance threshold yok.
- Expected load, request rate, duration ve hardware hedefleri yok.

## 21. Bulgular

| ID | Bulgu | Etki |
| --- | --- | --- |
| NF-FIND-001 | Performance/load/stress için araç yok. | Gerçek ölçüm yapılamaz. |
| NF-FIND-002 | SRS'de response time, throughput, concurrent user veya error-rate hedefi yok. | PASS/FAIL kriteri üretilemez. |
| NF-FIND-003 | Frontend'de Playwright/Cypress/Jest/Vitest yok. | Usability, compatibility ve responsive otomasyonu yok. |
| NF-FIND-004 | Actuator sadece health/info expose ediyor. | Kaynak kullanımı ve application metric ölçümü sınırlı. |
| NF-FIND-005 | Resmi browser/device destek matrisi yok. | Compatibility testleri candidate olarak kalır. |
| NF-FIND-006 | `STUDENT`, `ASSISTANT`, `HOD` rolleri kodda yok. | Bu roller için usability/security testi gerçek implementation'a bağlanamaz. |

## 22. Gerçek Güvenlik veya Performans Problemleri

Bu sprintte gerçek güvenlik açığı veya gerçek performans problemi doğrulanmadı.

| Alan | Sonuç |
| --- | --- |
| Ölçülen response time | Yok |
| Ölçülen throughput | Yok |
| Ölçülen concurrent user kapasitesi | Yok |
| Ölçülen CPU/memory/DB kullanımı | Yok |
| Doğrulanmış vulnerability | Yok |
| PASS/FAIL security sonucu | Yok |

## 23. Automation Candidates

| Aday | Önerilen Araç | Öncelik | Not |
| --- | --- | --- | --- |
| Auth/security negative matrix | Mevcut JUnit + MockMvc + Spring Security Test | P0 | Yeni dependency gerektirmez. |
| Scope isolation integration tests | Mevcut Spring Boot integration altyapısı | P0 | H2 fixture ile ölçülebilir. |
| Program çakışma performance smoke | k6 veya JMeter önerilir | P0 | Yeni araç kararı Sprint 13.10 girdisidir. |
| Public endpoint load smoke | k6 veya JMeter önerilir | P1 | Expected load tanımlandıktan sonra. |
| Frontend route guard E2E | Playwright veya Cypress önerilir | P0 | Frontend'de şu an yok. |
| Responsive screenshot matrix | Playwright önerilir | P1 | Browser/device matrix netleşmeli. |
| Compatibility smoke | Playwright cross-browser önerilir | P1 | Chrome/Edge/Firefox candidate. |
| Basic dependency/security scanning | Maven/npm audit veya SAST aracı önerilir | P1 | Bu sprintte çalıştırılmadı. |

## 24. Sprint 13.10 Test Environment Inputs

Sprint 13.10 ortam çalışması için gerekli girdiler:

- Resmi performance threshold: login, public list, program list, program create, conflict check.
- Expected load profili: concurrent users, request rate, duration, think time.
- Stress profili: normal/artan/yüksek/aşırı yük seviyeleri ve durdurma kriteri.
- Test veri hacmi: fakülte, bina, kat, derslik, akademisyen, ders, program, exception ve dönem sayıları.
- Ortam bilgisi: CPU, memory, DB resource, network koşulu, Docker mı native mi.
- Browser/device support matrix.
- E2E aracı kararı: Playwright veya Cypress.
- Load/performance aracı kararı: k6, JMeter veya Gatling.
- Metric toplama kararı: Actuator metrics exposure, DB monitoring, container metrics.
- Rapor formatı: ölçüm zamanı, commit, ortam, veri seti, tool version.

## 25. Sonuç

Sprint 13.9 kapsamında DTS için 49 non-functional test case tasarlanmıştır. Testler çalıştırılmadığı için performans değeri, kapasite sonucu, PASS/FAIL veya doğrulanmış güvenlik açığı raporlanmamıştır.

Final özet:

| Metrik | Değer |
| --- | --- |
| Performance test sayısı | 8 |
| Load test sayısı | 4 |
| Stress test sayısı | 4 |
| Scalability test sayısı | 5 |
| Security test sayısı | 10 |
| Usability test sayısı | 8 |
| Compatibility test sayısı | 5 |
| Responsive test sayısı | 5 |
| Toplam test case | 49 |
| P0/P1/P2 dağılımı | 22 / 27 / 0 |
| Executed | 0 |
| PASS | 0 |
| FAIL | 0 |
| NOT RUN | 49 |
| BLOCKED | 0 |
| Gerçek ölçülen performance sonuçları | Yok |
| Gerçek güvenlik bulguları | Yok |
| Production code değişikliği | Yok |
| Dependency değişikliği | Yok |
