# Sprint 13.6 - Entegrasyon Testleri

## 1. Amac

Sprint 13.6 kapsaminda DTS backend icin unit seviyesinden cikarak bilesenlerin birlikte calismasini dogrulayan integration testleri eklendi. Odak soru "tek bilesen dogru mu?" degil, "Controller, Service, Repository, Security ve Database birlikte dogru calisiyor mu?" seklinde ele alindi.

## 2. Kapsam

Kapsam backend ile sinirli tutuldu. E2E, frontend, performans ve sistem testi yazilmadi. Production business logic degistirilmedi. Yeni dependency eklenmedi.

Eklenen integration test alanlari:

| Alan | Test sinifi | Kapsam |
|---|---|---|
| Authentication | `AuthenticationIT` | Login, JWT ile `/api/auth/me`, hatali credential, protected endpoint 401 |
| Controller -> Service -> Repository -> DB | `CourseScheduleControllerIT` | Course create, schedule create, conflict, validation, role/scope |
| Repository -> DB | `RepositoryDatabaseIT` | Course-Academician-Department-Program, Classroom-Faculty scope, WeeklySchedule CRUD |

## 3. Mevcut Test Yapisinin Incelenmesi

`backend/src/test/java` altinda Sprint 13.4/13.5 sonrasinda 6 service unit test sinifi vardi. `@SpringBootTest`, MockMvc, `@DataJpaTest`, H2 ve repository-backed testler Sprint 13.4'te unit test sinirina uymadigi icin kaldirilmisti. Sprint 13.6'da bu davranislar kor korune geri tasinmadi; mevcut production akislari uzerinden yeni integration testler tasarlandi.

## 4. Unit / Integration Ayrimi

Mevcut `service/*Test` siniflari unit test olarak korundu. Yeni `integration/*IT` siniflari Spring context, real service, real repository, Spring Security ve H2 test database ile calisir. Testlerde Mockito mock'u kullanilmadi.

## 5. Secilen Integration Strategy

Sandwich yaklasimi secildi. Alt seviyede Repository -> Database testleri, ust seviyede MockMvc ile HTTP -> Authentication/Authorization -> Controller -> Service -> Repository -> Database testleri birlikte kullanildi. Big Bang tercih edilmedi; cunku tek bir genis senaryo hata nedenini ayrismayi zorlastirirdi.

Stub/driver kullanilmadi. Production bilesenleri test ortaminda calisabilir oldugu icin gereksiz stub olusturulmadi.

## 6. Test Ortami

| Konu | Sonuc |
|---|---|
| Test profile | `@ActiveProfiles("test")` |
| Database | H2 in-memory, PostgreSQL mode |
| Flyway | Test profile'da kapali |
| JPA schema | `ddl-auto: create-drop` |
| Security | Gercek Spring Security + JWT filter |
| MockMvc | `@SpringBootTest` + `@AutoConfigureMockMvc` |
| Test izolasyonu | `@Transactional` rollback |
| Production DB | Kullanilmadi |
| Testcontainers | Mevcut degil, eklenmedi |
| Maven wrapper | Yok |
| Maven CLI | Ortamda yok |

`backend/pom.xml` icinde Surefire include listesine `**/*IT.java` eklendi. Boylece Maven kullanilabilir oldugunda `mvn test` hem unit testleri hem integration testleri calistirabilir.

## 7. Database Integration

`RepositoryDatabaseIT` icinde repository ve H2 arasindaki gercek persistence dogrulandi:

| Test | Dogrulama |
|---|---|
| `courseRepositoryPersistsAndRetrievesCourseAcademicianProgramRelations` | Ders -> Akademisyen -> Bolum -> Fakulte -> Akademik Donem iliskileri |
| `classroomRepositoryFiltersClassroomsByFacultyScopeThroughFloorAndBuilding` | Derslik -> Kat -> Bina -> Fakulte scope sorgusu |
| `weeklyScheduleRepositoryPersistsAndDeletesProgramClassroomRelation` | Program -> Ders -> Derslik kaydi, find ve delete/flush |

## 8. Controller -> Service -> Repository

`CourseScheduleControllerIT` gercek HTTP istekleriyle calisir:

| Test | Akis |
|---|---|
| `departmentAdminCreatesCourseThroughControllerServiceRepositoryDatabase` | POST `/api/courses` -> CourseService -> CourseRepository -> DB |
| `scheduleCreationPersistsClassroomAndCourseRelationship` | POST `/api/schedules` -> WeeklyScheduleService -> WeeklyScheduleRepository -> DB |
| `scheduleCreationRejectsClassroomConflictAndDoesNotPersistSecondSchedule` | Conflict -> 409 -> DB'de ikinci kayit yok |

## 9. Authentication Integration

| Test | TC / TD |
|---|---|
| `loginWithValidUserReturnsJwtAndMeUsesAuthenticatedPrincipal` | TC-001-01 / TD-VALID-001 |
| `loginWithInvalidPasswordIsRejected` | TC-001-02 / TD-INVALID-001 |
| `protectedEndpointWithoutAuthenticationReturnsUnauthorized` | TC-023-01 / TD-INVALID-014 |

## 10. Authorization Integration

| Test | Dogrulama |
|---|---|
| `academicianCanReadOwnCourseButCannotCreateCourse` | ACADEMICIAN read-only course access, POST `/api/courses` 403 |
| `departmentAdminCannotScheduleCourseWithOutOfFacultyClassroom` | Department Admin scope disi derslik ile program olusturamaz |
| `protectedEndpointWithoutAuthenticationReturnsUnauthorized` | Authentication olmadan protected endpoint 401 |

Projede `STUDENT`, `ASSISTANT`, `HOD` rolleri bulunmadigi icin bu roller icin test yazilmadi.

## 11. Veri Izolasyonu

`departmentAdminCannotScheduleCourseWithOutOfFacultyClassroom` testi Department Admin'in kendi bolum/fakulte scope'u disindaki dersligi programa atamasini 403 ile reddeder ve DB'de program kaydi olusmadigini repository uzerinden dogrular.

## 12. Ders - Akademisyen - Program

`RepositoryDatabaseIT.courseRepositoryPersistsAndRetrievesCourseAcademicianProgramRelations` dersi akademisyen, bolum, fakulte ve akademik donemle birlikte kaydedip tekrar sorgular. `CourseScheduleControllerIT.scheduleCreationPersistsClassroomAndCourseRelationship` ayni dersin haftalik programa alinmasini dogrular.

## 13. Derslik - Program

`scheduleCreationPersistsClassroomAndCourseRelationship` program kaydinda derslik ID'sinin response ve DB sorgusunda korundugunu dogrular. `weeklyScheduleRepositoryPersistsAndDeletesProgramClassroomRelation` derslik-program iliskisinin repository seviyesinde find/delete davranisini test eder.

## 14. Validation

`invalidScheduleRequestIsRejectedAtHttpValidationLayer`, eksik `courseId` ile POST `/api/schedules` isteginin controller validation katmaninda 400 aldigini dogrular.

## 15. Negative Integration Tests

Toplam 6 negatif integration test vardir:

| Test | Negatif durum |
|---|---|
| `loginWithInvalidPasswordIsRejected` | Hatali credential |
| `protectedEndpointWithoutAuthenticationReturnsUnauthorized` | Unauthenticated protected request |
| `scheduleCreationRejectsClassroomConflictAndDoesNotPersistSecondSchedule` | Classroom conflict ve DB non-effect |
| `departmentAdminCannotScheduleCourseWithOutOfFacultyClassroom` | Scope/ownership violation |
| `academicianCanReadOwnCourseButCannotCreateCourse` | Role-based forbidden create |
| `invalidScheduleRequestIsRejectedAtHttpValidationLayer` | Invalid request validation |

## 16. Test Data

Sprint 13.3 TD kimlikleri tekrar kullanildi:

`TD-VALID-001`, `TD-VALID-002`, `TD-VALID-003`, `TD-VALID-008`, `TD-VALID-010`, `TD-VALID-011`, `TD-INVALID-001`, `TD-INVALID-010`, `TD-INVALID-014`, `TD-BOUNDARY-009`, `TD-COMBO-001`.

Fixture verileri test siniflari icinde sentetik olarak uretilir; gercek kisi verisi veya production credential kullanilmaz.

## 17. Requirement -> Test Case -> Integration Test Traceability

| Requirement / BR | Scenario | Test Case | Test Data | Integration Test |
|---|---|---|---|---|
| REQ-3.1.1 | TS-001 | TC-001-01 | TD-VALID-001 | `AuthenticationIT.loginWithValidUserReturnsJwtAndMeUsesAuthenticatedPrincipal` |
| REQ-3.1.1 | TS-001 | TC-001-02 | TD-INVALID-001 | `AuthenticationIT.loginWithInvalidPasswordIsRejected` |
| AUTH-01 | TS-023 | TC-023-01 | TD-INVALID-014 | `AuthenticationIT.protectedEndpointWithoutAuthenticationReturnsUnauthorized` |
| REQ-3.5.2 | TS-010 | TC-010-01 | TD-VALID-010 | `CourseScheduleControllerIT.departmentAdminCreatesCourseThroughControllerServiceRepositoryDatabase` |
| REQ-3.5.3, REQ-3.5.4 | TS-011 | TC-011-01 | TD-VALID-010, TD-VALID-011 | `CourseScheduleControllerIT.scheduleCreationPersistsClassroomAndCourseRelationship` |
| BR-01 | TS-012 | TC-012-01 | TD-COMBO-001 | `CourseScheduleControllerIT.scheduleCreationRejectsClassroomConflictAndDoesNotPersistSecondSchedule` |
| AUTH-03, BR-07 | TS-024 | TC-024-02 | TD-INVALID-010 | `CourseScheduleControllerIT.departmentAdminCannotScheduleCourseWithOutOfFacultyClassroom` |
| REQ-3.5.2, AUTH-02 | TS-010, TS-023 | TC-010-02, TC-023-02 | TD-VALID-003 | `CourseScheduleControllerIT.academicianCanReadOwnCourseButCannotCreateCourse` |
| REQ-3.5.4 | TS-011 | TC-011-06 | TD-BOUNDARY-009 | `CourseScheduleControllerIT.invalidScheduleRequestIsRejectedAtHttpValidationLayer` |
| REQ-3.5.1, REQ-3.5.2 | TS-009, TS-010 | TC-009-01, TC-010-01 | TD-VALID-010 | `RepositoryDatabaseIT.courseRepositoryPersistsAndRetrievesCourseAcademicianProgramRelations` |
| REQ-3.4.5, AUTH-03 | TS-007, TS-024 | TC-007-01, TC-024-02 | TD-VALID-008, TD-INVALID-010 | `RepositoryDatabaseIT.classroomRepositoryFiltersClassroomsByFacultyScopeThroughFloorAndBuilding` |
| REQ-3.5.3, REQ-3.5.4 | TS-011 | TC-011-01 | TD-VALID-011 | `RepositoryDatabaseIT.weeklyScheduleRepositoryPersistsAndDeletesProgramClassroomRelation` |

## 18. Test Sonuclari

Komut durumu tekrar kontrol edildi:

```powershell
Test-Path backend\mvnw.cmd
Get-Command mvn -ErrorAction SilentlyContinue
```

Sonuc: `backend\mvnw.cmd` yok ve `mvn` PATH uzerinde bulunmuyor. Bu nedenle testler calistirilamadi; PASS/FAIL/ERROR/SKIPPED sonucu olculmedi.

| Metrik | Sonuc |
|---|---:|
| Mevcut integration test | 0 |
| Yeni integration test | 12 |
| Tasindan/degistirilen mevcut integration test | 0 |
| Yeni integration test sinifi | 3 |
| Ortak test support sinifi | 1 |
| PASS | Olculemedi |
| FAIL | Olculemedi |
| ERROR | Olculemedi |
| SKIPPED | Olculemedi |

## 19. Basarisiz Testler

Test lifecycle baslatilamadigi icin basarisiz test ayrimi yapilamadi.

## 20. Tespit Edilen Gercek Buglar

Bu sprintte testler calistirilamadigi icin gercek production bug dogrulanmadi. Production code degistirilmedi.

## 21. Sprint 13.7 Sistem Testleri Icin Hazir Girdiler

Sistem testi icin aktarilabilecek senaryolar:

| Senaryo | Not |
|---|---|
| Login -> token -> protected endpoint | Authentication akisi sistem seviyesinde tarayici/API ile dogrulanabilir |
| Department Admin course create -> schedule create | Uc ekran/API akisi birlestirilebilir |
| Classroom conflict | UI/API seviyesinde kullanici mesajlari ile dogrulanabilir |
| Department Admin scope disi derslik | Veri izolasyonu sistem seviyesinde kritik senaryo |
| Academician read-only course access | Rol bazli gezinme ve API yetkisi birlikte dogrulanabilir |
