# DTS - Sprint 13.12 Test Automation + Regression Testing

## 1. Amaç

Sprint 13.12'nin amacı DTS için kritik, tekrar eden, deterministik ve regression değeri yüksek testleri otomasyon açısından değerlendirmek ve regression suite temelini oluşturmaktır.

Bu sprintte production code değiştirilmemiş, yeni dependency eklenmemiş, mevcut testler silinmemiştir. Mevcut backend otomasyon altyapısı incelenmiş, `mvn test` çalıştırılmaya denenmiş ancak Maven runner eksikliği nedeniyle test execution yapılamamıştır. PASS/FAIL sonucu üretilmemiştir.

## 2. Kapsam

İncelenen kaynaklar:

- Sprint 13.2 test case tasarımı.
- Sprint 13.3 test data.
- Sprint 13.4 unit tests.
- Sprint 13.6 integration tests.
- Sprint 13.7 system tests.
- Sprint 13.8 state/workflow/exploratory tests.
- Sprint 13.9 non-functional tests.
- Sprint 13.10 test environment.
- Sprint 13.11 UAT.
- `backend/pom.xml`, `backend/src/test`.
- `frontend/package.json`.
- Mevcut test configuration ve test class'ları.

Kapsam dışı:

- Playwright/Cypress/k6/JMeter/Gatling kurulumu.
- CI/CD pipeline kurulumu.
- Production business logic değişikliği.
- Önceki test dokümanlarının değiştirilmesi.
- Ölçülmemiş test sonucu veya production defect raporlaması.

## 3. Mevcut Test Automation Altyapısı

| Alan | Mevcut Durum | Sonuç |
| --- | --- | --- |
| Backend unit automation | JUnit 5 + Mockito/AssertJ, 6 service test class | AVAILABLE |
| Backend integration automation | Spring Boot Test + MockMvc + H2, 3 `*IT` class + support | AVAILABLE |
| Backend test runner | Maven Surefire config var; Maven CLI ve wrapper yok | BLOCKED |
| API automation | Ayrı API framework yok; MockMvc integration testleri API seviyesini kısmen kapsar | PARTIAL |
| Frontend unit automation | Jest/Vitest dependency yok | NOT AVAILABLE |
| E2E automation | Playwright/Cypress dependency yok | NOT AVAILABLE |
| Performance automation | k6/JMeter/Gatling yok | NOT AVAILABLE |
| CI/CD automation | GitHub/GitLab/Jenkins/Azure pipeline dosyası tespit edilmedi | NOT AVAILABLE |

Mevcut backend automated test inventory:

| Test Class | Type | Test Count | Kapsam |
| --- | --- | ---: | --- |
| `AccessScopeServiceTest` | Unit | 5 | Role/scope access control |
| `AuthServiceTest` | Unit | 5 | Login, refresh, reset token |
| `CourseServiceTest` | Unit | 7 | Course create/update/list validation |
| `DashboardServiceTest` | Unit | 1 | Department dashboard summary |
| `ScheduleExceptionServiceTest` | Unit | 6 | Exception ownership, duplicate, weekend |
| `WeeklyScheduleServiceTest` | Unit | 34 | Schedule creation, conflict, capacity, slot rules |
| `AuthenticationIT` | Integration/API | 3 | Login, `/me`, protected 401 |
| `CourseScheduleControllerIT` | Integration/API | 6 | Course/schedule controller-service-repository flow |
| `RepositoryDatabaseIT` | Integration | 3 | Repository/database constraints |
| `IntegrationTestSupport` | Support | NA | Shared Spring/H2 fixtures |

Current automated test methods detected: 70.

## 4. Automation Candidates

| Candidate ID | Source IDs | Area | Priority | Automation Level | Reason |
| --- | --- | --- | --- | --- | --- |
| AUT-CAND-001 | TC-001-01, UAT-001..003 | Valid login | P0 | Integration/API, E2E candidate | Critical and repeated entry workflow |
| AUT-CAND-002 | TC-001-02 | Invalid login | P0 | Unit + Integration/API | Deterministic auth negative |
| AUT-CAND-003 | TC-023-01, UP-001 | Protected endpoint without token | P0 | Integration/API | Security regression |
| AUT-CAND-004 | TC-023-02, UP-003..005 | Wrong role access | P0 | Integration/API, E2E candidate | Authorization regression |
| AUT-CAND-005 | TC-024-02, UAT-012 | Department data isolation | P0 | Unit + Integration/API | High business/security risk |
| AUT-CAND-006 | TC-019-02, UAT-013 | Academician ownership | P0 | Unit + Integration/API | Prevents cross-owner operations |
| AUT-CAND-007 | TC-011-01, UAT-008 | Schedule creation | P0 | Unit + Integration/API, E2E candidate | Core DTS workflow |
| AUT-CAND-008 | TC-012-01 | Classroom conflict | P0 | Unit + Integration/API | Core resource rule |
| AUT-CAND-009 | TC-013-01 | Academician conflict | P0 | Unit | Deterministic business rule |
| AUT-CAND-010 | TC-014-01 | Student group/grade conflict | P0 | Unit | Deterministic business rule |
| AUT-CAND-011 | TC-015-01..04 | Multi-slot conflict | P0 | Unit parameterized candidate | Repeated same rule with data variants |
| AUT-CAND-012 | TC-017-01..04 | Online/physical split | P0 | Unit + integration candidate | Physical resource consistency |
| AUT-CAND-013 | TC-018-01..03 | Capacity warning | P1 | Unit parameterized candidate | Important scheduling usability |
| AUT-CAND-014 | TC-010-01, UAT-007 | Course operations | P1 | Unit + Integration/API | Common department workflow |
| AUT-CAND-015 | TC-006-01, UAT-006 | Floor layout save | P1 | Integration/API | Data integrity and admin workflow |
| AUT-CAND-016 | TC-022-01, UAT-014 | Public classroom filtering | P1 | API/E2E candidate | Public business value |
| AUT-CAND-017 | TC-022-02 | Public floor plan viewing | P1 | E2E candidate | Visual workflow, needs browser tool |
| AUT-CAND-018 | TC-020-02, TC-021-02 | Duplicate exception | P1 | Unit + Integration/API | Regression risk |
| AUT-CAND-019 | UAT-015 | Unsupported role contract | P2 | Static/contract check | Prevents false UAT PASS |
| AUT-CAND-020 | NFT-PERF/LOAD/STRESS | Non-functional smoke | P2 | Future tool-based automation | Needs load tool and thresholds |

Automation candidates: 20.

## 5. Automation Suitability Analysis

| Test | Critical | Repeatable | Deterministic | Data Manageable | Environment Ready | Automation Candidate | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Login valid/invalid | Yes | Yes | Yes | Yes | Runner blocked | Yes | High value and already covered by unit/IT |
| Protected endpoint 401 | Yes | Yes | Yes | Yes | Runner blocked | Yes | Stable security check |
| Role authorization | Yes | Yes | Yes | Yes | Runner blocked | Yes | P0 regression |
| Department scope isolation | Yes | Yes | Yes | Yes | Runner blocked | Yes | Business/security critical |
| Schedule creation | Yes | Yes | Mostly | Yes | Runner blocked | Yes | Core workflow |
| Schedule conflict | Yes | Yes | Yes | Yes | Runner blocked | Yes | Good unit/integration target |
| Capacity warning | Medium | Yes | Yes | Yes | Runner blocked | Yes | Parameterized candidate |
| Public classroom filtering | Medium | Yes | Yes | Yes | Frontend/API blocked | Yes | API/E2E split recommended |
| Floor plan visual workflow | Medium | Yes | Partly | Fixture needed | E2E unavailable | Candidate later | Browser/visual tool needed |
| UAT full schedule creation | Yes | Yes | Partly | Needs seed | E2E unavailable | Candidate later | Best as small E2E smoke |
| Performance/load/stress | Yes | Yes | No threshold | Volume missing | Tool unavailable | Candidate later | Needs Sprint 13.10 gaps resolved |

## 6. Test Automation Pyramid

```text
Many fast tests
  Unit: JUnit + Mockito
  -> Integration/API: Spring Boot Test + MockMvc + H2
      -> Few critical E2E: Playwright/Cypress candidate, not installed
          -> Non-functional automation: k6/JMeter/Gatling candidate, not installed
```

Automation strategy:

- Keep business logic checks mostly at unit level.
- Use integration/API tests for security, controller/service/repository, DB and auth behavior.
- Use E2E only for a small number of critical stable workflows once a browser framework exists.
- Do not move all regression coverage to E2E.

## 7. Unit Test Automation

Existing unit automation is the strongest current layer.

| Area | Existing Tests | Regression Role | Gap |
| --- | --- | --- | --- |
| Authentication | `AuthServiceTest` | P0 login/reset regression | Runner blocked |
| Authorization/scope | `AccessScopeServiceTest` | P0 data isolation regression | More controller-level matrix can be added as IT |
| Schedule conflict | `WeeklyScheduleServiceTest` | P0 conflict regression | Good candidate for additional parameterized cleanup |
| Course operations | `CourseServiceTest` | P1 course regression | Continue using DTO validation and service assertions |
| Schedule exception | `ScheduleExceptionServiceTest` | P1 ownership/duplicate regression | Started lesson cancellation remains unclear |
| Dashboard | `DashboardServiceTest` | P2 summary regression | Low volume |

New unit tests added in Sprint 13.12: 0.

## 8. Integration Test Automation

Existing integration automation:

| Area | Existing Class | Regression Value |
| --- | --- | --- |
| Authentication | `AuthenticationIT` | Login, `/me`, unauthenticated protected endpoint |
| Course + schedule flow | `CourseScheduleControllerIT` | Controller -> service -> repository -> H2 |
| Repository/database | `RepositoryDatabaseIT` | Constraint and persistence checks |

These tests are good candidates for `REGRESSION-P0` and `REGRESSION-P1`, but execution is blocked until Maven or wrapper is available.

## 9. API Automation

Standalone API automation framework is not present.

Current practical API automation path:

- Use Spring Boot integration tests with MockMvc.
- Assert HTTP status, response body and business side effects.
- Keep test data synthetic and isolated in H2.

API automation candidates:

| Candidate | Source | Status |
| --- | --- | --- |
| Login success/failure | TC-001-01/02 | Existing integration coverage |
| Protected endpoint 401 | TC-023-01 | Existing integration coverage |
| Department Admin course create | TC-010-01 | Existing integration coverage |
| Schedule create and conflict | TC-011-01, TC-012-01 | Existing/extendable integration coverage |
| Scope violation | TC-024-02 | Candidate for additional integration matrix |
| Public classroom/program read | TC-022-01/02 | Candidate |

## 10. E2E Automation

Playwright and Cypress are not available in `frontend/package.json`. No E2E test runner is configured.

E2E automation should be limited to critical stable workflows after tool approval:

| E2E Candidate | Source | Priority | Current Status |
| --- | --- | --- | --- |
| Role-based login smoke | UAT-001..003, E2E-006 | P0 | DESIGNED / BLOCKED |
| Department Admin schedule creation | UAT-008, E2E-002 | P0 | DESIGNED / BLOCKED |
| Conflict handling business flow | UAT-009, E2E-003 | P0 | DESIGNED / BLOCKED |
| Department scope isolation | UAT-012 | P0 | DESIGNED / BLOCKED |
| Public classroom/program discovery | UAT-014, E2E-001 | P1 | DESIGNED / BLOCKED |
| Academician own exception flow | UAT-013, E2E-004 | P1 | DESIGNED / BLOCKED |

E2E automated tests added: 0.

## 11. Regression Testing

Regression Testing, bir değişikliğin daha önce çalışan davranışları bozup bozmadığını kontrol etmek için ilgili testlerin tekrar çalıştırılmasıdır.

Retest ile farkı:

| Kavram | Amaç | DTS Örneği |
| --- | --- | --- |
| Retest | Düzeltilen spesifik bug'ın tekrar doğrulanması | Çözülen classroom conflict bug'ını aynı veriyle tekrar denemek |
| Regression | Değişikliğin başka çalışan alanları bozmadığını kontrol etmek | Schedule değişikliği sonrası login, scope, course ve conflict testlerini tekrar çalıştırmak |

Sprint 13.12'de regression execution yapılamadı; suite tasarlandı.

## 12. Regression Suite

### REGRESSION-P0

| Regression ID | Source IDs | Automated Target | Data | Current Status |
| --- | --- | --- | --- | --- |
| REG-P0-001 | TC-001-01 | `AuthenticationIT`, `AuthServiceTest` | TD-VALID-001..003 | BLOCKED |
| REG-P0-002 | TC-001-02 | `AuthenticationIT`, `AuthServiceTest` | TD-INVALID-001 | BLOCKED |
| REG-P0-003 | TC-023-01 | `AuthenticationIT` | TD-INVALID-014 | BLOCKED |
| REG-P0-004 | TC-023-02 | Integration candidate | TD-VALID-002/003 | NOT RUN |
| REG-P0-005 | TC-024-02 | `AccessScopeServiceTest`, IT candidate | TD-INVALID-010 | BLOCKED |
| REG-P0-006 | TC-019-02 | `ScheduleExceptionServiceTest` | TD-INVALID-015 | BLOCKED |
| REG-P0-007 | TC-011-01 | `WeeklyScheduleServiceTest`, `CourseScheduleControllerIT` | TD-VALID-010/011 | BLOCKED |
| REG-P0-008 | TC-012-01 | `WeeklyScheduleServiceTest`, `CourseScheduleControllerIT` | TD-COMBO-001 | BLOCKED |
| REG-P0-009 | TC-013-01 | `WeeklyScheduleServiceTest` | TD-COMBO-002 | BLOCKED |
| REG-P0-010 | TC-014-01 | `WeeklyScheduleServiceTest` | TD-COMBO-003 | BLOCKED |
| REG-P0-011 | TC-015-01..04 | `WeeklyScheduleServiceTest` | TD-COMBO-004..007 | BLOCKED |
| REG-P0-012 | TC-017-01..04 | Unit/IT candidate | TD-VALID-012, TD-COMBO-008 | NOT RUN |
| REG-P0-013 | UAT-008 | E2E candidate | TD-VALID-010/011 | BLOCKED |
| REG-P0-014 | UAT-012 | E2E/API candidate | TD-INVALID-010 | BLOCKED |

### REGRESSION-P1

| Regression ID | Source IDs | Automated Target | Data | Current Status |
| --- | --- | --- | --- | --- |
| REG-P1-001 | TC-010-01 | `CourseServiceTest`, `CourseScheduleControllerIT` | TD-VALID-010 | BLOCKED |
| REG-P1-002 | TC-018-01..03 | `WeeklyScheduleServiceTest` | TD-BOUNDARY-010..012 | BLOCKED |
| REG-P1-003 | TC-020-02, TC-021-02 | `ScheduleExceptionServiceTest` | TD-SPECIAL-005 | BLOCKED |
| REG-P1-004 | TC-006-01 | Integration candidate | TD-VALID-007 | NOT RUN |
| REG-P1-005 | TC-022-01 | API/E2E candidate | TD-VALID-004..008 | BLOCKED |
| REG-P1-006 | TC-022-02 | E2E candidate | TD-VALID-007 | BLOCKED |
| REG-P1-007 | UAT-013 | E2E/API candidate | TD-VALID-003/011 | BLOCKED |
| REG-P1-008 | UAT-014 | E2E/API candidate | TD-VALID-004..008 | BLOCKED |
| REG-P1-009 | NFT-SEC-009 | API candidate | TD-VALID-004..008 | NOT RUN |

### REGRESSION-P2

| Regression ID | Source IDs | Automated Target | Data | Current Status |
| --- | --- | --- | --- | --- |
| REG-P2-001 | UAT-015 | Static/contract candidate | TD-UNSUPPORTED-ROLE-001 | NOT RUN |
| REG-P2-002 | NFT-COMP/RESP | Browser automation candidate | Viewport/browser matrix | BLOCKED |
| REG-P2-003 | NFT-PERF/LOAD/STRESS | Load tool candidate | Volume data missing | BLOCKED |

Regression suite size: 26.

## 13. Change Impact Analysis

| Change Area | P0 Tests | P1 Tests | E2E | Data |
| --- | --- | --- | --- | --- |
| Authentication | REG-P0-001..003 | UAT login smoke after environment ready | Role-based login E2E | TD-VALID-001..003, TD-INVALID-001/014 |
| Authorization | REG-P0-003..006, REG-P0-014 | REG-P1-007 | Role guard/scope E2E | TD-VALID-002/003, TD-INVALID-010/015 |
| Classroom | REG-P0-008, REG-P1-004..006 | REG-P1-005/006 | Public classroom discovery | TD-VALID-004..008, TD-COMBO-001 |
| Course | REG-P1-001, REG-P0-007 | REG-P1-001 | Department course setup E2E | TD-VALID-010 |
| Schedule | REG-P0-007..012 | REG-P1-002 | Department schedule E2E | TD-VALID-010..013, TD-COMBO-* |
| Conflict | REG-P0-008..011 | REG-P1-002/003 | Conflict handling E2E | TD-COMBO-001..007 |
| Filtering | REG-P1-005/006 | Public and schedule filter checks | Public filter E2E | TD-VALID-004..008 |
| Floor layout | REG-P1-004 | REG-P1-006 | Floor plan E2E candidate | TD-VALID-007/008 |
| Non-functional config | REG-P2-002/003 | NFT candidates | Browser/load tool future | Browser matrix, volume data |

## 14. Test Data Automation

| Data Category | Existing Source | Automation Use | Isolation Need |
| --- | --- | --- | --- |
| Valid | TD-VALID-001..016 | Login, course, classroom, schedule | Create synthetic users/entities per test |
| Invalid | TD-INVALID-001..015 | Negative auth, scope, invalid classroom | Avoid modifying shared seed |
| Boundary | TD-BOUNDARY-001..012 | Slot, password, capacity, field lengths | Parameterized unit tests |
| Combination | TD-COMBO-001..008 | Conflict and online/physical matrix | Per-test schedule fixture cleanup |
| Special | TD-SPECIAL-001..008 | Duplicate exception, weekend, unclear areas | Mark unclear rules until requirement resolved |

Recommended existing-pattern approach:

- Unit tests use builders/factories inside test classes.
- Integration tests use H2 and synthetic fixture setup in `IntegrationTestSupport`.
- No production credentials or production DB data.
- Each integration test should own the data it mutates.

## 15. Test Isolation

Automation rules for DTS:

- Tests must not depend on execution order.
- Unit tests should isolate dependencies with Mockito.
- Integration tests should use H2/test profile and synthetic fixture data.
- Test data should be created per test or reset between tests.
- Shared state from one schedule/conflict test must not leak into another.
- Assertions should verify both response and important business outcome, such as "second conflicting schedule is not persisted".

Risk areas:

| Risk | Impact | Control |
| --- | --- | --- |
| Shared DB state | Flaky integration failures | Per-test setup/cleanup |
| Time-dependent public availability | Non-deterministic status | Controlled clock/test data needed |
| Random IDs without trace | Hard debugging | Stable fixture labels/source notes |
| E2E async UI timing | Flaky UI tests | Prefer semantic waits; avoid blind sleep |

## 16. Parameterized Tests

Good parameterized candidates:

| Area | Data | Reason |
| --- | --- | --- |
| Slot count validation | `0`, `1`, `12`, `13` | Same validation rule |
| Capacity warning | `studentCount-1`, `studentCount`, `studentCount+1` | Same threshold behavior |
| Role access matrix | `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `ACADEMICIAN` | Same access decision structure |
| Delivery type matrix | `ONLINE/null`, `ONLINE/classroom`, `FACE_TO_FACE/classroom`, `FACE_TO_FACE/null` | Decision table |
| Day validation | weekday vs `SATURDAY` | Same normalized day rule |

Avoid parameterization when the workflow, setup or business assertion differs significantly.

## 17. Flaky Test Analysis

| Potential Flaky Cause | Applies To | Risk | Mitigation |
| --- | --- | --- | --- |
| Timing/current clock | Public availability, `STARTING_SOON`, schedule exception dates | High | Inject/fix clock or fixture dates |
| Shared database state | Integration conflict tests | High | Reset fixture state per test |
| Async frontend requests | E2E login/program screens | Medium | Wait for user-visible state, not fixed sleep |
| Network/container startup | Docker/E2E/load tests | Medium | Healthcheck gate before test |
| Browser selectors | E2E tests | Medium | Stable labels/test ids after tool decision |
| Order dependency | Regression suite | High | Independent setup for each test |

No flaky tests were confirmed because tests did not execute.

## 18. Test Naming / Assertion Quality

Current naming style is behavior-oriented, for example:

- `loginWithInvalidPasswordIsRejected`
- `protectedEndpointWithoutAuthenticationReturnsUnauthorized`
- `scheduleCreationRejectsClassroomConflictAndDoesNotPersistSecondSchedule`

Recommended assertion quality:

- Assert status/result and business effect.
- For conflict tests, assert rejected operation and unchanged persisted state.
- For auth tests, assert token/principal behavior where meaningful.
- For authorization tests, assert access denial and no data mutation.
- Avoid assertions tied to incidental implementation details.
- Do not remove assertions to force a PASS.

## 19. Automation Execution

Execution attempted:

| Command | Result | Status |
| --- | --- | --- |
| `mvn test` in `backend` | `mvn` not recognized | BLOCKED |
| Maven wrapper check | `backend/mvnw.cmd` absent | BLOCKED |

Automation result reporting:

| Metric | Result |
| --- | ---: |
| Total executed | 0 |
| Passed | 0 |
| Failed | 0 |
| Skipped | 0 |
| Error | 0 |
| Blocked existing automated tests | 70 |
| Duration | Not measured |

No test PASS/FAIL result was produced.

## 20. Regression Execution

Recommended execution order:

1. Environment validation.
2. Test data validation.
3. Unit tests.
4. Integration/API tests.
5. Critical E2E tests after tool setup.
6. Regression summary.

Sprint 13.12 execution result:

| Step | Status | Reason |
| --- | --- | --- |
| Environment validation | BLOCKED | Maven missing; backend/frontend not running from Sprint 13.10 |
| Test data validation | NOT RUN | Runtime DB/test data not verified |
| Unit tests | BLOCKED | Maven runner unavailable |
| Integration/API tests | BLOCKED | Maven runner unavailable |
| E2E tests | BLOCKED | Playwright/Cypress unavailable and app not running |
| Regression summary | DESIGNED | Suite created, not executed |

## 21. CI/CD

CI/CD automation not currently implemented.

Checked items:

- `.github` workflow files: not found.
- `.gitlab-ci.yml`: not found.
- `Jenkinsfile`: not found.
- `azure-pipelines.yml`: not found.

Pipeline recommendation:

- Backend unit + integration tests via Maven.
- Frontend lint/build via npm.
- Later E2E smoke after Playwright/Cypress decision.
- Publish test result summary with total/passed/failed/skipped/error/duration.

## 22. Automation Maintenance

| Automation Layer | Maintenance Cost | DTS Guidance |
| --- | --- | --- |
| Unit | Low | Prefer for business rules and validation |
| Integration/API | Medium | Use for security, DB and controller-service-repository behavior |
| E2E | High | Keep only critical stable workflows |
| Performance/load | Medium/High | Use only after thresholds, volume data and monitoring are defined |

Maintenance risks:

- UI selector changes can break E2E tests.
- Time-dependent status tests can become flaky.
- Large shared seed data can make failures hard to diagnose.
- Over-broad E2E suites slow down regression feedback.

## 23. Traceability

| Requirement / BR | Scenario / UAT | Test Data | Automated Test / Candidate |
| --- | --- | --- | --- |
| REQ-3.1.1 | TC-001-01/02, UAT-001..003 | TD-VALID-001..003, TD-INVALID-001 | `AuthServiceTest`, `AuthenticationIT` |
| AUTH-01 | TC-023-01 | TD-INVALID-014 | `AuthenticationIT` |
| AUTH-02 | TC-023-02, UAT role smoke | TD-VALID-002/003 | Integration/E2E candidate |
| BR-07 | TC-024-02, UAT-012 | TD-INVALID-010 | `AccessScopeServiceTest`, IT candidate |
| BR-08 | TC-019-02, UAT-013 | TD-INVALID-015 | `ScheduleExceptionServiceTest` |
| REQ-3.5.2 | TC-010-01, UAT-007 | TD-VALID-010 | `CourseServiceTest`, `CourseScheduleControllerIT` |
| REQ-3.5.3-3.5.4 | TC-011-01, UAT-008 | TD-VALID-010/011 | `WeeklyScheduleServiceTest`, `CourseScheduleControllerIT` |
| BR-01 | TC-012-01 | TD-COMBO-001 | `WeeklyScheduleServiceTest`, `CourseScheduleControllerIT` |
| BR-02 | TC-013-01 | TD-COMBO-002 | `WeeklyScheduleServiceTest` |
| BR-03/BR-04 | TC-014-01, TC-015-01..04 | TD-COMBO-003..007 | `WeeklyScheduleServiceTest` |
| BR-05 | TC-017-01..04 | TD-VALID-012, TD-COMBO-008 | Unit/IT candidate |
| BR-06 | TC-018-01..03 | TD-BOUNDARY-010..012 | `WeeklyScheduleServiceTest` |
| REQ-3.2/3.7 | TC-022-01/02, UAT-014 | TD-VALID-004..008 | API/E2E candidate |
| ER-02/AUTH-06 | UAT-015 | TD-UNSUPPORTED-ROLE-001 | Static/contract candidate |

Traceability coverage: 14 grouped requirement/rule areas mapped.

## 24. Regression Matrix

| Change Area | P0 Tests | P1 Tests | E2E | Data |
| --- | --- | --- | --- | --- |
| Authentication | REG-P0-001..003 | UAT smoke after env ready | Role login smoke | TD-VALID-001..003, TD-INVALID-001/014 |
| Authorization | REG-P0-003..006, REG-P0-014 | REG-P1-007 | Role guard E2E | TD-VALID-002/003, TD-INVALID-010/015 |
| Classroom | REG-P0-008 | REG-P1-004..006 | Public classroom E2E | TD-VALID-004..008, TD-COMBO-001 |
| Course | REG-P0-007, REG-P1-001 | REG-P1-001 | Course setup E2E | TD-VALID-010 |
| Schedule | REG-P0-007..012 | REG-P1-002 | Schedule creation E2E | TD-VALID-010..013, TD-COMBO-* |
| Conflict | REG-P0-008..011 | REG-P1-003 | Conflict handling E2E | TD-COMBO-001..007 |
| Filtering | REG-P1-005/006 | Public filters | Public filter E2E | TD-VALID-004..008 |
| Exceptions | REG-P0-006 | REG-P1-003/007 | Academician exception E2E | TD-VALID-003/011, TD-SPECIAL-005 |
| Non-functional | REG-P2-002/003 | NFT candidates | Browser/load future | Browser matrix, volume data |

## 25. Automation Gaps

| Gap ID | Gap | Impact |
| --- | --- | --- |
| AUTO-GAP-001 | Maven CLI and Maven wrapper unavailable | Existing backend tests cannot execute |
| AUTO-GAP-002 | Frontend unit test framework absent | Frontend logic has no automated unit coverage |
| AUTO-GAP-003 | E2E framework absent | System/UAT workflows cannot be automated |
| AUTO-GAP-004 | Performance/load/stress tool absent | Non-functional automation cannot run |
| AUTO-GAP-005 | CI/CD pipeline absent | Regression is not automatically triggered |
| AUTO-GAP-006 | Runtime test data seeding not standardized | Repeatable integration/E2E runs are limited |
| AUTO-GAP-007 | Browser/device matrix undefined | Compatibility regression cannot be certified |
| AUTO-GAP-008 | Backend/frontend not running in current environment | API/E2E validation blocked |
| AUTO-GAP-009 | Docker daemon unavailable | Repeatable stack startup blocked |
| AUTO-GAP-010 | Performance thresholds and expected load undefined | PASS/FAIL criteria unavailable |
| AUTO-GAP-011 | Some requirements remain unclear | Online schedule DTO, public threshold, started cancellation |

Automation gaps: 11.

## 26. Sprint 13.13 Inputs

Defect tracking inputs for Sprint 13.13:

| Input | Status |
| --- | --- |
| Failed automated tests | None confirmed |
| Potential defects | None confirmed |
| Flaky tests | None confirmed |
| Environment failures | Maven missing, Maven wrapper absent, Docker daemon unavailable, backend/frontend not running |
| Regression failures | None confirmed |
| Blocked regression items | Existing 70 backend automated tests blocked by runner |
| Production defect | Production defect not confirmed |

Defect records should not be created from unexecuted tests. Environment blockers should be tracked separately from application defects.

## 27. Sonuç

Sprint 13.12 kapsamında DTS'nin mevcut test otomasyon altyapısı incelendi, otomasyon adayları belirlendi ve 26 maddelik regression suite tasarlandı. Mevcut backend tarafında 70 automated test method bulunuyor; ancak Maven CLI ve Maven wrapper olmadığı için bu testler çalıştırılamadı. Frontend, E2E, performance/load/stress ve CI/CD otomasyonu mevcut değildir.

Final metrikler:

| Metrik | Değer |
| --- | --- |
| Existing automated tests | 70 |
| New automated tests | 0 |
| Unit automated tests | 58 |
| Integration automated tests | 12 |
| API automated tests | 0 standalone; API coverage via integration tests |
| E2E automated tests | 0 |
| Regression suite size | 26 |
| P0 regression tests | 14 |
| P1 regression tests | 9 |
| P2 regression tests | 3 |
| Executed | 0 |
| Passed | 0 |
| Failed | 0 |
| Skipped | 0 |
| Error | 0 |
| Blocked | 70 existing automated tests |
| Not Run | 26 designed regression items |
| Automation candidates | 20 |
| Automation gaps | 11 |
| Traceability coverage | 14 grouped requirement/rule areas |
| Production defect confirmed | No |
| Production code değişikliği | Yok |
| Dependency değişikliği | Yok |
