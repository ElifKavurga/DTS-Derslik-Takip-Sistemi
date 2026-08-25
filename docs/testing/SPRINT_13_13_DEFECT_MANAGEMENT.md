# DTS - Sprint 13.13 Hata Takibi ve Defect Management

## 1. Amaç

Sprint 13.13'ün amacı DTS test sürecinde ortaya çıkabilecek failure, defect, environment issue ve requirement gap durumlarını güvenilir şekilde ayıran bir defect management yapısı oluşturmaktır.

Bu sprint kapsamında gerçek production bug uydurulmamıştır. Sprint 13.10-13.12 execution kısıtları nedeniyle testlerin önemli bölümü `BLOCKED`, `NOT RUN` veya `DESIGNED` durumunda kaldığı için doğrulanmış production defect kaydı açılmamıştır.

Confirmed Production Defects: 0.

## 2. Kapsam

İncelenen girdiler:

| Kaynak | Kullanım |
| --- | --- |
| `SPRINT_13_1_REQUIREMENT_ANALYSIS.md` | Requirement, SRS-ER, veri sözlüğü ve rol gap'leri |
| `SPRINT_13_2_TEST_CASE_DESIGN.md` | TC-* test case izlenebilirliği |
| `SPRINT_13_3_TEST_DATA.md` | TD-* test data izlenebilirliği |
| `SPRINT_13_4_UNIT_TESTS.md` | Unit test kapsamı ve execution dili |
| `SPRINT_13_6_INTEGRATION_TESTS.md` | Integration/API test kapsamı |
| `SPRINT_13_7_SYSTEM_TESTS.md` | Sistem test tasarımı ve runtime blokajları |
| `SPRINT_13_8_STATE_WORKFLOW_EXPLORATORY.md` | State/workflow/exploratory bulguları |
| `SPRINT_13_9_NON_FUNCTIONAL_TESTS.md` | NFR test tasarımı, NOT RUN sonuçları |
| `SPRINT_13_10_TEST_ENVIRONMENT.md` | Environment issue ve blocker kayıtları |
| `SPRINT_13_11_ACCEPTANCE_TESTS_UAT.md` | UAT BLOCKED/NOT IMPLEMENTED sonuçları |
| `SPRINT_13_12_TEST_AUTOMATION_REGRESSION.md` | Automation/regression BLOCKED sonuçları |
| `backend/pom.xml`, `backend/src/test` | Backend test altyapısı |
| `frontend/package.json` | Frontend test script/framework durumu |
| `README.md`, `SRS 2.md` | Ortam gereksinimleri, SRS, ER/veri sözlüğü referansı |

Production code, dependency, test implementation veya runtime configuration değiştirilmemiştir.

## 3. Defect Management Overview

Defect management akışı DTS için şu şekilde tanımlanır:

```text
TEST
  -> EXECUTION
  -> OBSERVED RESULT
  -> FAILURE ANALYSIS
  -> CLASSIFICATION
  -> DEFECT / ENVIRONMENT ISSUE / REQUIREMENT GAP / TEST ISSUE
  -> TRIAGE
  -> FIX OR CLARIFICATION
  -> RETEST
  -> REGRESSION
  -> CLOSE
```

Kural:

| Durum | Defect oluşturulur mu? | Açıklama |
| --- | --- | --- |
| Executed test FAIL, application behavior expected result ile çelişiyor | Evet, analiz sonrası | Production defect adayı |
| Test `NOT RUN` | Hayır | Execution yoktur |
| Test `BLOCKED` | Hayır | Blocker ayrı izlenir |
| Environment command unavailable | Hayır | Environment issue |
| Requirement belirsiz | Hayır | Requirement gap/open question |
| UAT yapılmadı | Hayır | UAT failure değildir |

## 4. Error / Defect / Failure

| Kavram | Tanım | DTS örneği | Bu sprintte durum |
| --- | --- | --- | --- |
| Error | İnsan tarafından yapılan yanlışlık | Developer conflict rule'u eksik kodlar | Doğrulanmış error yok |
| Defect / Bug | Yazılımdaki kusur | Aynı dersliğe aynı saatte iki program kaydı kabul edilir | Doğrulanmış production defect yok |
| Failure | Çalışma anında beklenen davranışın gerçekleşmemesi | Conflict testinde ikinci kayıt oluşur | Execution yapılmadığı için doğrulanmış failure yok |

Failure doğrudan defect değildir. Önce test data, environment, configuration, expected result ve requirement netliği kontrol edilmelidir.

## 5. Failure Analysis

Failure analysis karar ağacı:

```text
Observed issue var mı?
  -> Hayır: Defect yok.
  -> Evet:
       Test executed mı?
          -> Hayır: NOT RUN/BLOCKED; defect yok.
          -> Evet:
               Expected result requirement'a bağlı mı?
                  -> Hayır: Requirement gap.
                  -> Evet:
                       Environment/test data/config kaynaklı mı?
                          -> Evet: Environment/Test issue.
                          -> Hayır: Production defect candidate.
```

Sprint 13.13 mevcut durum analizi:

| Kaynak | Observed Result | Classification |
| --- | --- | --- |
| Sprint 13.10 `mvn` not recognized | Backend tests cannot run | Environment Issue |
| Sprint 13.10 Docker daemon pipe not found | Compose stack cannot be validated | Environment Issue |
| Sprint 13.10 backend `8080` not reachable | API/UAT cannot execute | Environment Issue |
| Sprint 13.10 frontend `5173` not reachable | UI/UAT cannot execute | Environment Issue |
| Sprint 13.11 UAT `BLOCKED` | UAT not executed | Test Blocker |
| Sprint 13.11 unsupported roles | UAT cannot be produced for missing roles | Requirement/Scope Gap |
| Sprint 13.12 automation `BLOCKED` | Automated tests cannot execute | Automation Blocker |
| Sprint 13.9 NFT `NOT RUN` | NFR metrics unavailable | Not Executed |

## 6. Defect Identification

Defect oluşturma kriterleri:

| Kriter | Zorunlu mu? |
| --- | --- |
| Test gerçekten çalıştırıldı | Yes |
| Expected result requirement veya kabul kriterine bağlı | Yes |
| Actual result gözlemlendi | Yes |
| Expected ve actual farklı | Yes |
| Environment/test data/config kaynaklı olmadığı analiz edildi | Yes |
| Evidence veya execution log mevcut | Strongly recommended |

Bu kriterler mevcut sprintte hiçbir production behavior için tamamlanmadı. Bu nedenle `DEF-*` production defect kaydı oluşturulmadı.

## 7. Defect Report Format

Gerçek defect bulunduğunda kullanılacak DTS defect report alanları:

| Alan | Açıklama |
| --- | --- |
| Defect ID | Benzersiz `DEF-001` formatı |
| Title | `[Module] Problem` formatında kısa başlık |
| Requirement | `REQ-*`, `BR-*`, `AUTH-*` referansı |
| Module | Auth, Schedule, Classroom vb. |
| Test Case ID | `TC-*`, `UAT-*`, `NFT-*`, `REG-*` |
| Test Data ID | `TD-*` |
| Environment | OS, runtime, test profile, service state |
| Preconditions | Kullanıcı, veri ve sistem ön koşulları |
| Steps to Reproduce | Tekrar edilebilir adımlar |
| Expected Result | Gereksinime göre beklenen davranış |
| Actual Result | Execution sırasında gözlenen davranış |
| Severity | CRITICAL/HIGH/MEDIUM/LOW |
| Priority | HIGH/MEDIUM/LOW |
| Status | Lifecycle status |
| Detected By | Test eden kişi veya otomasyon |
| Detected Date | Tespit tarihi |
| Assigned To | Owner bilinmiyorsa `Unassigned` |
| Evidence | Log, screenshot, test report |
| Notes | Ek analiz |

Defect report checklist:

| Checklist Item | Required | Current Confirmed Defect Coverage |
| --- | --- | --- |
| Unique ID | Yes | N/A |
| Clear title | Yes | N/A |
| Requirement reference | Yes | N/A |
| Test Case reference | Yes | N/A |
| Test Data reference | Yes | N/A |
| Environment | Yes | N/A |
| Preconditions | Yes | N/A |
| Reproduction steps | Yes | N/A |
| Expected result | Yes | N/A |
| Actual result | Yes | N/A |
| Severity | Yes | N/A |
| Priority | Yes | N/A |
| Evidence | Recommended | N/A |
| Status | Yes | N/A |
| Assignee | Yes | N/A |

## 8. Defect ID Convention

DTS için önerilen defect ID standardı:

| ID Type | Format | Kullanım |
| --- | --- | --- |
| Production defect | `DEF-001` | Doğrulanmış application bug |
| Environment issue | `ENV-ISS-001` | Test/runtime ortam problemi |
| Requirement gap | `REQ-GAP-001` | Belirsiz veya çelişkili gereksinim |
| Test issue | `TEST-ISS-001` | Test data, expected result veya test tasarım problemi |
| Automation issue | `AUTO-ISS-001` | Automation runner/tool/pipeline problemi |
| UAT issue | `UAT-ISS-001` | UAT entry, stakeholder, sign-off veya execution problemi |

Bu sprintte `DEF-*` oluşturulmamıştır. Environment, requirement, automation ve UAT kayıtları production defect'ten ayrı takip edilmiştir.

## 9. Expected vs Actual

Expected result requirement/test case'e bağlı olmalıdır. Actual result yalnızca gerçek execution gözlemiyle yazılır.

| Örnek Alan | Doğru Kullanım |
| --- | --- |
| Expected | Sistem aynı derslik ve saatte ikinci programı engellemelidir. |
| Actual | Execution sırasında ikinci programın kaydedildiği gözlemlendi. |
| Defect kararı | Sadece actual result gerçekten gözlemlendiyse defect adayıdır. |

Mevcut sprintlerde çalıştırılmayan testler için actual result yoktur. `BLOCKED`, `NOT RUN` ve `DESIGNED` durumlarından expected/actual farkı üretilemez.

## 10. Steps to Reproduce

Gerçek defect için steps to reproduce şu kalıpla yazılmalıdır:

1. Test environment ve build bilgisi belirtilir.
2. Kullanıcı rolü ve test data ID hazırlanır.
3. Başlangıç ekranı veya endpoint açılır.
4. İşlem adımları numaralı şekilde tekrarlanır.
5. Expected result yazılır.
6. Actual result yazılır.
7. Evidence eklenir.

Örnek şablon:

| Alan | Değer |
| --- | --- |
| Defect ID | DEF-XXX |
| Module | Schedule |
| Preconditions | `DEPARTMENT_ADMIN`, TD-VALID-010, TD-COMBO-001 |
| Step 1 | Bölüm Admini ile login ol |
| Step 2 | Ders programı ekranını aç |
| Step 3 | Aynı derslik/saat için ikinci program oluşturmayı dene |
| Expected | Conflict engellenir |
| Actual | Yalnızca gerçek execution sonrası doldurulur |

Bu örnek şablondur; confirmed defect değildir.

## 11. Severity

Projede mevcut severity standardı bulunmadığı için DTS için Proposed Severity Scale:

| Severity | Tanım | DTS etkisi |
| --- | --- | --- |
| CRITICAL | Sistem kritik fonksiyonu tamamen kullanılamaz veya ciddi güvenlik/veri etkisi vardır | Auth tamamen çalışmaz, veri izolasyonu tamamen kırılır |
| HIGH | Ana iş akışı ciddi bozulur | Program çakışması engellenmez, yanlış rol veri değiştirir |
| MEDIUM | İşlev kısmen etkilenir | Filtreleme eksik, validasyon mesajı yetersiz |
| LOW | Kozmetik veya düşük etkili sorun | UI metin/yerleşim problemi |

Bu sprintte severity dağılımı confirmed defect olmadığı için 0'dır.

## 12. Priority

Projede mevcut priority standardı bulunmadığı için DTS için Proposed Priority Scale:

| Priority | Tanım | Örnek |
| --- | --- | --- |
| HIGH | Hızlıca ele alınmalı | Testleri tamamen bloklayan Maven/wrapper eksikliği |
| MEDIUM | Yakın sprintte planlanmalı | Browser matrix netleştirme |
| LOW | Backlog'a alınabilir | Düşük etkili dokümantasyon iyileştirmeleri |

Environment veya requirement priority'si production defect priority'si değildir; ayrı triage edilmelidir.

## 13. Severity vs Priority

Severity teknik/sistem etkisini, priority iş açısından düzeltme aciliyetini ifade eder.

| Senaryo | Severity | Priority | Açıklama |
| --- | --- | --- | --- |
| Başka bölüm verilerine erişim production'da doğrulandı | HIGH | HIGH | Authorization ve data isolation etkilenir |
| Login ekranında kozmetik metin hatası | LOW | MEDIUM/HIGH olabilir | Demo/UAT etkisine göre priority yükselebilir |
| Maven runner eksik | N/A for defect | HIGH environment priority | Production bug değil, test execution blocker |
| NFR threshold yok | N/A for defect | HIGH requirement priority | PASS/FAIL üretimini engeller |

## 14. Defect Lifecycle

DTS defect lifecycle:

```text
NEW
  -> ASSIGNED
  -> IN PROGRESS
  -> FIXED / READY FOR RETEST
  -> RETEST
  -> VERIFIED
  -> CLOSED
```

Alternatif yollar:

```text
NEW -> REJECTED
NEW -> DEFERRED
RETEST -> FAIL -> REOPENED -> IN PROGRESS
```

Environment issue lifecycle:

```text
NEW -> TRIAGED -> IN PROGRESS -> READY TO VERIFY -> VERIFIED -> CLOSED
```

Requirement gap lifecycle:

```text
OPEN QUESTION -> BUSINESS REVIEW -> CLARIFIED -> TESTS UPDATED -> CLOSED
```

## 15. Defect Statuses

| Status | Tanım |
| --- | --- |
| NEW | Yeni raporlandı |
| ASSIGNED | İlgili owner'a atandı |
| IN PROGRESS | Düzeltme üzerinde çalışılıyor |
| FIXED / READY FOR RETEST | Fix hazır, test ekibi doğrulamalı |
| RETEST | Spesifik defect yeniden test ediliyor |
| VERIFIED | Retest geçti |
| CLOSED | Defect kapatıldı |
| REOPENED | Retest başarısız, yeniden açıldı |
| REJECTED | Defect değil; duplicate, invalid veya expected behavior |
| DEFERRED | Gerçek defect ancak sonraki sprint/release'e ertelendi |

Bu sprintte confirmed defect status kaydı yoktur.

## 16. Retest

Retest, spesifik defect fix'inin doğrulanmasıdır.

| Retest Alanı | DTS Kuralı |
| --- | --- |
| Girdi | Confirmed defect + fix |
| Test case | Mümkünse orijinal TC/UAT/NFT tekrar kullanılır |
| Test data | Orijinal TD korunur veya kontrollü varyant eklenir |
| Sonuç | PASS veya FAIL |
| Fail sonucu | Defect `REOPENED` olur |

Mevcut sprintte fix yapılmadığı ve confirmed defect olmadığı için retest yapılmamıştır.

## 17. Retest vs Regression

| Alan | Retest | Regression |
| --- | --- | --- |
| Amaç | Spesifik defect düzeldi mi? | Fix başka işlevleri bozdu mu? |
| Kapsam | Dar | İlişkili modüller |
| Tetikleyici | Defect fix | Fix, release, refactor, dependency/config change |
| DTS örneği | Conflict defect'i artık ikinci kaydı engelliyor mu? | Schedule creation, classroom availability, academician conflict, capacity, auth hala çalışıyor mu? |

Sprint 13.12'de 26 maddelik regression suite tasarlandı; çalıştırılamadığı için regression failure doğrulanmadı.

## 18. Defect Traceability

Gerçek defect mümkün olduğunca şu zincire bağlanmalıdır:

```text
Requirement -> Scenario -> Test Case -> Test Data -> Execution -> Defect -> Fix -> Retest -> Regression
```

Örnek traceability şablonu:

| Link | Örnek |
| --- | --- |
| Requirement | REQ-3.5.4 / BR-01 |
| Scenario | TS-012 |
| Test Case | TC-012-01 |
| Test Data | TD-COMBO-001 |
| Execution | EXEC-YYYYMMDD-001 |
| Defect | DEF-001 |
| Retest | RETEST-001 |
| Regression | REG-P0-008 |

Current coverage:

| Alan | Durum |
| --- | --- |
| Requirement to tests | Sprint 13.1-13.12 içinde mapped |
| Test data to tests | TD-* kullanımı mapped |
| Execution to defect | N/A, confirmed execution failure yok |
| Defect to fix/retest/regression | N/A |

## 19. Environment Issues

Environment issue production defect değildir. Sprint 13.10 ve 13.12'den taşınan environment kayıtları:

| ID | Title | Source | Impact | Priority | Status |
| --- | --- | --- | --- | --- | --- |
| ENV-ISS-001 | Maven CLI ve Maven wrapper unavailable | Sprint 13.10, Sprint 13.12 | Backend unit/integration/regression tests cannot run | HIGH | OPEN |
| ENV-ISS-002 | Docker daemon unavailable | Sprint 13.10 | Compose stack cannot be started/validated | HIGH | OPEN |
| ENV-ISS-003 | Backend not reachable on `8080` | Sprint 13.10 | API, health, auth, UAT validation blocked | HIGH | OPEN |
| ENV-ISS-004 | Frontend not reachable on `5173` | Sprint 13.10 | UI, usability, UAT, E2E validation blocked | HIGH | OPEN |
| ENV-ISS-005 | Dedicated test environment not defined | Sprint 13.10 | Dev/test/runtime boundaries unclear | MEDIUM | OPEN |
| ENV-ISS-006 | Load/performance/stress tool unavailable | Sprint 13.9, Sprint 13.10 | NFR execution cannot run | MEDIUM | OPEN |
| ENV-ISS-007 | Browser/device support matrix absent | Sprint 13.9, Sprint 13.10 | Compatibility certification blocked | MEDIUM | OPEN |
| ENV-ISS-008 | Monitoring/metrics exposure limited | Sprint 13.10 | Performance evidence incomplete | MEDIUM | OPEN |
| ENV-ISS-009 | Runtime test data seeding not standardized | Sprint 13.10-13.12 | Repeatable integration/E2E data setup limited | HIGH | OPEN |

## 20. Requirement Gaps

Requirement gap production defect değildir. Netleştirme gerektirir.

| ID | Requirement / Area | Gap | Source | Priority | Status |
| --- | --- | --- | --- | --- | --- |
| REQ-GAP-001 | REQ-3.1.4 | Password rule thresholds not measurable | Sprint 13.1 | MEDIUM | OPEN |
| REQ-GAP-002 | REQ-3.1.5 | JWT logout/session invalidation expectation unclear | Sprint 13.1 | MEDIUM | OPEN |
| REQ-GAP-003 | REQ-3.2.1/3.2.2 | Current/next-slot availability time window unclear | Sprint 13.1, Sprint 13.9 | HIGH | OPEN |
| REQ-GAP-004 | REQ-3.4.4 | Floor plan file format/storage differs from SRS | Sprint 13.1 | MEDIUM | OPEN |
| REQ-GAP-005 | REQ-3.4.8 / ER-05 | DepartmentClassroom model absent or replaced by faculty scope | Sprint 13.1 | HIGH | OPEN |
| REQ-GAP-006 | REQ-3.6.1 / ER-06 | Reservation entity vs ScheduleException model mismatch | Sprint 13.1, Sprint 13.11 | HIGH | OPEN |
| REQ-GAP-007 | REQ-3.6.3 | Started reservation cancellation rule not measurable | Sprint 13.1, Sprint 13.11 | MEDIUM | OPEN |
| REQ-GAP-008 | ER-01 | `LECTURER` vs `ACADEMICIAN` role naming mismatch | Sprint 13.1 | MEDIUM | OPEN |
| REQ-GAP-009 | ER-02/AUTH-06 | `STUDENT`, `ASSISTANT`, `HOD` requested in some scope but absent from SRS/code | Sprint 13.1, Sprint 13.11 | MEDIUM | OPEN |
| REQ-GAP-010 | NFR | Performance/load/stress thresholds absent | Sprint 13.9, Sprint 13.10 | HIGH | OPEN |
| REQ-GAP-011 | NFR | Expected load and data volume absent | Sprint 13.9, Sprint 13.10 | HIGH | OPEN |

## 21. Defect Triage

Triage amacı:

| Triage Kararı | Açıklama |
| --- | --- |
| Classification | Defect, environment issue, requirement gap, test issue ayrımı |
| Severity | Teknik etki |
| Priority | İş aciliyeti |
| Owner | Backend, Frontend, QA, DevOps, Business; bilinmiyorsa `Unassigned` |
| Action | Immediate, Sprint backlog, Deferred, Rejected |

Current triage summary:

| Item Type | Count | Owner |
| --- | ---: | --- |
| Confirmed production defect | 0 | N/A |
| Environment issue | 9 | Unassigned |
| Requirement gap | 11 | Unassigned |
| Automation issue/gap | 8 tracked as AUTO-ISS | Unassigned |
| UAT issue/gap | 4 tracked as UAT-ISS | Unassigned |

## 22. Defect Categories

DTS defect categories:

| Category | Modül/Risk |
| --- | --- |
| Authentication | Login, token, reset password |
| Authorization | Role-based endpoint/frontend access |
| Data Isolation | Department/faculty/academician scope |
| Classroom | Classroom CRUD, capacity, equipment |
| Course | Course CRUD and department ownership |
| Schedule | Weekly schedule create/update/list |
| Conflict | Classroom, academician, class level, multi-slot conflict |
| Filtering | Public/private list filters |
| UI | Form, table, routing, responsive layout |
| Validation | DTO/entity/business rule validation |
| Performance | Response time, DB query time, throughput |
| Security | 401/403, token lifecycle, data exposure |
| Compatibility | Browser/device support |
| Environment | Runner, services, Docker, ports, seed data |

Confirmed defect by category: all categories 0.

## 23. Defect Sources

Defect source DTS için defect'in ilk yakalandığı yeri ifade eder.

| Source | Current Confirmed Defects | Not |
| --- | ---: | --- |
| Requirement | 0 | Requirement gaps ayrı izlendi |
| Design | 0 | Confirmed design defect yok |
| Code | 0 | Production code defect doğrulanmadı |
| Unit Test | 0 | Tests could not execute in current environment |
| Integration Test | 0 | Tests could not execute in current environment |
| System Test | 0 | System tests blocked/not executed |
| UAT | 0 | UAT not executed |
| Exploratory Test | 0 | Exploratory items designed/not run |
| Automation | 0 | Automation execution blocked |
| Environment | N/A | Environment issues ayrı sayıldı |

## 24. Defect Metrics

Confirmed defect metrics:

| Metric | Value |
| --- | ---: |
| Total Defects | 0 |
| Confirmed Production Defects | 0 |
| Open Defects | 0 |
| Closed Defects | 0 |
| Reopened Defects | 0 |
| Rejected Defects | 0 |
| Deferred Defects | 0 |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| High Priority Defects | 0 |
| Medium Priority Defects | 0 |
| Low Priority Defects | 0 |
| Defects by Module | N/A |
| Defects by Test Level | N/A |
| Defects by Source | N/A |
| Automation Failures | 0 confirmed |
| UAT Failures | 0 confirmed |

Quality metric availability:

| Metric | Status |
| --- | --- |
| Defect Density | Not measurable with current data |
| Defect Leakage | Not measurable with current data |
| Defect Removal Efficiency | Not measurable with current data |
| Mean Time To Repair | Not measurable with current data |
| Reopen Rate | Not measurable with current data |

Defect Density hesaplanmadı çünkü DTS için bu sprintte confirmed defect yok ve anlamlı software size denominator belirlenmedi.

## 25. False Positive / False Negative

| Kavram | Tanım | DTS risk örneği | Bu sprintte durum |
| --- | --- | --- | --- |
| False Positive | Defect olmadığı halde defect raporlamak | Maven yokken test çalışmadı diye production bug açmak | Önlenmiştir |
| False Negative | Gerçek defect'in test suite tarafından yakalanamaması | Yetkisiz erişim defect'i test edilmeden production'a kalabilir | Ölçülemedi |

Önemli ayrımlar:

| Yanlış eşleme | Doğru sınıflandırma |
| --- | --- |
| `BLOCKED` = bug | `BLOCKED` = test blocker |
| Environment issue = production defect | Environment issue ayrı takip edilir |
| Requirement ambiguity = bug | Requirement gap/open question |
| NOT RUN = PASS/FAIL | NOT RUN sonucu yoktur |

## 26. Automation Integration

Sprint 13.12 ile defect management bağlantısı:

```text
Automated Test
  -> FAIL
  -> Failure Analysis
  -> DEFECT or non-defect issue
  -> Fix
  -> Retest
  -> Automated regression rerun
  -> PASS
  -> Close
```

Current automation issue records:

| ID | Title | Source | Impact | Status |
| --- | --- | --- | --- | --- |
| AUTO-ISS-001 | Existing 70 backend automated tests blocked by runner | Sprint 13.12 | No automated PASS/FAIL can be produced | OPEN |
| AUTO-ISS-002 | Frontend unit test framework absent | Sprint 13.12 | Frontend logic has no automated unit coverage | OPEN |
| AUTO-ISS-003 | E2E framework absent | Sprint 13.12 | UAT/system workflows cannot be automated | OPEN |
| AUTO-ISS-004 | CI/CD pipeline absent | Sprint 13.12 | Regression is not automatically triggered | OPEN |
| AUTO-ISS-005 | Performance/load/stress tool absent | Sprint 13.12 | NFR automation cannot run | OPEN |
| AUTO-ISS-006 | Browser/device matrix undefined | Sprint 13.12 | Compatibility regression cannot be certified | OPEN |
| AUTO-ISS-007 | Runtime test data seed not standardized | Sprint 13.12 | Integration/E2E repeatability limited | OPEN |
| AUTO-ISS-008 | Regression suite designed but not executed | Sprint 13.12 | Regression failures cannot be confirmed | OPEN |

No automated test failure was confirmed.

## 27. UAT Integration

UAT defect flow:

```text
UAT Scenario
  -> Business workflow execution
  -> FAIL
  -> Defect analysis
  -> Fix
  -> UAT Retest
  -> Regression
  -> Sign-off
```

Current UAT issue records:

| ID | Title | Source | Impact | Status |
| --- | --- | --- | --- | --- |
| UAT-ISS-001 | Formal end-user UAT not executed | Sprint 13.11 | Business acceptance cannot be decided | OPEN |
| UAT-ISS-002 | UAT environment not ready | Sprint 13.10, Sprint 13.11 | 14 UAT cases blocked | OPEN |
| UAT-ISS-003 | Stakeholder/UAT owner sign-off not performed | Sprint 13.11 | No acceptance approval | OPEN |
| UAT-ISS-004 | Unsupported role UAT cannot execute | Sprint 13.11 | `STUDENT`, `ASSISTANT`, `HOD` have no implementation | OPEN |

No UAT failure was confirmed.

## 28. Confirmed Defects

Confirmed production defect list:

| Defect ID | Title | Requirement | Module | Test Case ID | Test Data ID | Severity | Priority | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| N/A | No confirmed production defect | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

Not: Bu tablo "uygulamada hiç bug yoktur" anlamına gelmez. Mevcut execution kısıtları nedeniyle production defect doğrulanamamıştır.

## 29. Open Issues

Open issue backlog, production defect dışı takip kayıtlarını içerir:

| Type | Count | Highest Priority | Action |
| --- | ---: | --- | --- |
| Environment Issue | 9 | HIGH | Sprint 13.14 quality metrics öncesi runner/runtime hazır edilmeli |
| Requirement Gap | 11 | HIGH | Business/technical owner clarification gerekli |
| Automation Issue | 8 | HIGH | Maven/wrapper, CI/CD ve E2E kararları alınmalı |
| UAT Issue | 4 | HIGH | UAT entry criteria, owner ve environment tamamlanmalı |
| Confirmed Production Defect | 0 | N/A | No action |

Open issue handling:

| Issue Type | Defect mi? | Tracking |
| --- | --- | --- |
| `ENV-ISS-*` | Hayır | Test management/environment backlog |
| `REQ-GAP-*` | Hayır | Requirement clarification backlog |
| `AUTO-ISS-*` | Hayır | Automation backlog |
| `UAT-ISS-*` | Hayır | Acceptance/testing backlog |
| `DEF-*` | Evet | Defect lifecycle |

## 30. Sprint 13.14 Inputs

Sprint 13.14 Test Management + Quality Metrics için hazırlanmış girdiler:

| Input | Value / Status |
| --- | --- |
| Defect counts | Confirmed production defects: 0 |
| Severity distribution | CRITICAL 0, HIGH 0, MEDIUM 0, LOW 0 |
| Priority distribution | Defect priority N/A; environment/requirement priorities separately available |
| Open/closed defects | Open 0, Closed 0 |
| Defect sources | N/A for confirmed defects |
| Environment blockers | 9 tracked as `ENV-ISS-*` |
| Requirement gaps | 11 tracked as `REQ-GAP-*` |
| Automation failures | 0 confirmed failures; 8 automation issues/gaps |
| UAT failures | 0 confirmed failures; 4 UAT issues/gaps |
| Traceability gaps | Execution -> Defect -> Fix -> Retest -> Regression not measurable |
| Regression suite | 26 designed, not executed |
| Existing automated tests | 70 backend tests, blocked by Maven runner |
| NFR tests | 49 designed, not run |
| UAT cases | 15 designed; 14 blocked, 1 not implemented |

Sprint 13.14 uygulanmamıştır; yalnızca quality metrics girdileri hazırlanmıştır.

## 31. Sonuç

Sprint 13.13 kapsamında DTS için defect management modeli, defect report formatı, ID standardı, severity/priority ayrımı, lifecycle, retest/regression ayrımı, traceability yaklaşımı, triage modeli ve metrics yapısı tanımlanmıştır.

Gerçek production defect doğrulanmadığı için `DEF-*` kaydı açılmamıştır. Sprint 13 boyunca görülen ana takip kalemleri production bug değil; environment issue, requirement gap, automation blocker ve UAT blocker kategorilerindedir.

Özet:

| Metric | Value |
| --- | ---: |
| Total confirmed defects | 0 |
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Open | 0 |
| In Progress | 0 |
| Fixed | 0 |
| Retest | 0 |
| Verified | 0 |
| Closed | 0 |
| Reopened | 0 |
| Rejected | 0 |
| Deferred | 0 |
| Environment issues | 9 |
| Requirement gaps | 11 |
| Automation failures | 0 confirmed |
| UAT failures | 0 confirmed |
| Defect traceability coverage | N/A - no confirmed defect |

Execution limitation nedeniyle production defect doğrulanamamıştır. Bu sonuç DTS'de bug bulunmadığını kanıtlamaz; yalnızca mevcut sprint verileriyle confirmed production defect oluşturulamayacağını gösterir.
