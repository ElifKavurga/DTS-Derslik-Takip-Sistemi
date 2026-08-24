# Sprint 13.4 - Birim Testleri

## 1. Kapsam

Bu sprintte backend test yapisi izole JUnit 5 unit testlerine odaklanacak sekilde temizlendi. Production code degistirilmedi, yeni dependency eklenmedi, PostgreSQL veya dis servis baglantisi kurulmamasi hedeflendi.

Sprint 13.1 -> 13.2 -> 13.3 zinciri korunarak P0/P1 agirlikli servis davranislari test edildi.

## 2. Mevcut Test Yapisinin Incelenmesi

Baslangicta `backend/src/test/java` altinda 11 test sinifi ve 96 test metodu vardi.

| Test sinifi | Mevcut durum | Karar |
|---|---|---|
| `WeeklyScheduleServiceTest` | Mockito tabanli servis unit testi | Korundu |
| `CourseServiceTest` | Mockito + DTO validation tabanli unit test | Korundu |
| `DashboardServiceTest` | Mockito tabanli servis unit testi | Korundu |
| `UserServiceTest` | `@SpringBootTest`, repository ve H2 bagimli | Kaldirildi; Sprint 13.6 integration kapsaminda ele alinmali |
| `FloorLayoutServiceTest` | `@SpringBootTest`, repository transaction davranisi | Kaldirildi; Sprint 13.6 integration kapsaminda ele alinmali |
| `SlotLayoutServiceTest` | `@SpringBootTest`, repository ve DB constraint davranisi | Kaldirildi; Sprint 13.6 integration kapsaminda ele alinmali |
| `DerslikTakipApplicationTests` | Spring context smoke testi | Kaldirildi; unit test kapsaminda degil |
| Controller security testleri | `@SpringBootTest` + MockMvc web-layer testleri | Kaldirildi; Sprint 13.6 web/integration kapsaminda ele alinmali |

## 3. Temizlenen / Korunan Testler

| Metrik | Sayi |
|---|---:|
| Baslangictaki test metodu | 96 |
| Korunan test metodu | 42 |
| Kaldirilan test metodu | 54 |
| Yeni eklenen unit test | 15 |
| Final test metodu | 57 |
| Final test sinifi | 6 |

Kaldirma nedeni: temizlenen siniflar unit test degil; Spring context, MockMvc, repository, H2 veya DB constraint davranisina dayaniyordu. Bu davranislar degerli olabilir, ancak Sprint 13.4 unit test sinirina dahil edilmedi.

## 4. Test Altyapisi

`backend/pom.xml` incelendi. `spring-boot-starter-test`, JUnit 5, AssertJ ve Mockito altyapisi mevcut oldugu icin yeni dependency eklenmedi. `spring-security-test` ve `h2` zaten vardi, ancak final unit test seti Spring context kullanmiyor.

## 5. Unit Test Kapsami

Final test siniflari:

| Test sinifi | Production hedefi | Kapsam |
|---|---|---|
| `AuthServiceTest` | `AuthService` | Login, refresh token, reset password exception/sonuc davranislari |
| `AccessScopeServiceTest` | `AccessScopeService` | Super Admin, faculty/department scope, access denied davranislari |
| `WeeklyScheduleServiceTest` | `WeeklyScheduleService` | Program olusturma/guncelleme, cakisma, kapasite, slot ve scope kurallari |
| `ScheduleExceptionServiceTest` | `ScheduleExceptionService` | Ek ders/telafi/iptal sahiplik, duplicate, hafta sonu ve cakisma davranislari |
| `CourseServiceTest` | `CourseService`, `CreateCourseRequest` | Ders scope, duplicate code, student count validation |
| `DashboardServiceTest` | `DashboardService` | Department dashboard scope ve ozet uyarilari |

## 6. P0 Testleri

| P0 hedefi | Durum | Ilgili testler |
|---|---|---|
| Authentication | Tamamlandi | `AuthServiceTest.loginReturnsTokensForActiveUser`, `loginRejectsInactiveUserAfterAuthentication`, `refreshRejectsNonRefreshToken` |
| Authorization | Tamamlandi | `AccessScopeServiceTest`, `CourseServiceTest.departmentAdminCannotUpdateCourseOutsideDepartmentScope`, `WeeklyScheduleServiceTest.createScheduleRejectsCourseOutsideAuthenticatedDepartment` |
| Veri izolasyonu | Tamamlandi | `AccessScopeServiceTest.requireDepartmentScopeReturnsMatchingDepartmentIgnoringCase`, `assertDepartmentAccessRejectsScopeMismatch`, weekly/course scope testleri |
| Derslik / akademisyen / program cakismasi | Tamamlandi | `WeeklyScheduleServiceTest` conflict testleri, `ScheduleExceptionServiceTest.createExtraLessonRejectsClassroomConflictAtTargetSlot` |
| Online / fiziksel kararlar | Kismen mevcut | `WeeklyScheduleService` fiziksel program olusturma `FACE_TO_FACE` default davranisini kapsiyor; online create DTO uyumsuzlugu Sprint 13.3 belirsizligi olarak kaldi |

## 7. P1 Testleri

| P1 hedefi | Durum | Ilgili testler |
|---|---|---|
| Derslik kapasitesi | Tamamlandi | `availableClassroomsMarksEqualCapacityAsSuitable`, `availableClassroomsMarksLowerCapacityAsSelectableAlternative`, capacity sorting/warning testleri |
| Validation | Tamamlandi | `CourseServiceTest.createCourseRequestAcceptsNonNegativeStudentCount`, negative/decimal student count testleri |
| Exception durumlari | Tamamlandi | Auth reset token, schedule exception duplicate/weekend, weekly schedule conflict exception testleri |
| Kritik CRUD business logic | Kismen tamamlandi | `CourseServiceTest` ders olusturma/guncelleme business scope testleri |

## 8. JUnit 5 ve AAA Kullanimi

Yeni testler JUnit 5 ile yazildi. Yeni test metodlarinda Arrange, Act, Assert ayrimi yorumlarla belirtildi. Mevcut korunan testlerde de davranis odakli assertion kullanimi surduruldu.

## 9. Exception Testleri

Final test setinde `assertThatThrownBy` kullanan 32 exception kontrolu bulunuyor. Yeni eklenen exception odaklari:

| Test | Exception beklentisi |
|---|---|
| `AuthServiceTest.loginRejectsInactiveUserAfterAuthentication` | `DisabledException` |
| `AuthServiceTest.refreshRejectsNonRefreshToken` | `BadCredentialsException` |
| `AuthServiceTest.resetPasswordRejectsExpiredToken` | `ExpiredResetTokenException` |
| `AccessScopeServiceTest.requireDepartmentScopeRejectsUserWithoutDepartmentClaim` | `AccessDeniedException` |
| `AccessScopeServiceTest.assertDepartmentAccessRejectsScopeMismatch` | `AccessDeniedException` |
| `ScheduleExceptionServiceTest.*` negatif testleri | `AccessDeniedException`, `IllegalArgumentException`, `ScheduleConflictException` |

## 10. Parametrik Testler

Final setinde 1 parametrik test bulunuyor:

| Test | Kapsam |
|---|---|
| `CourseServiceTest.createCourseRequestAcceptsNonNegativeStudentCount` | `studentCount` valid degerleri: 0, 1, 72, 300 |

Diger davranislar ayni assertion mantigina indirgenemeyecek kadar farkli oldugu icin ayrik testler olarak tutuldu.

## 11. Mock Kullanimi

Mock kullanimi unit izolasyonu icin temel seviyede kullanildi:

| Test sinifi | Mock nedeni |
|---|---|
| `AuthServiceTest` | AuthenticationManager, JwtService, mapper ve repository bagimliliklarini izole etmek |
| `AccessScopeServiceTest` | Faculty/Department repository lookup sonucunu kontrol etmek |
| `WeeklyScheduleServiceTest` | Repository ve `AccessScopeService` davranislarini izole etmek |
| `ScheduleExceptionServiceTest` | Repository, time configuration ve scope bagimliliklarini izole etmek |
| `CourseServiceTest` | Repository, mapper, notification ve scope bagimliliklarini izole etmek |
| `DashboardServiceTest` | Repository ozetleri ve schedule summary bagimliliklarini izole etmek |

Sprint 13.5'e birakilan ileri Mockito konulari: ayrintili interaction policy, `times/never` genisletmeleri, `InOrder`, state-vs-behavior ayrimi ve mock fixture standardizasyonu.

## 12. Test Case -> Test Data -> Unit Test Izlenebilirligi

| Requirement / BR | TC | TD | Unit test |
|---|---|---|---|
| REQ-3.1.1 | TC-001-01 | TD-VALID-001 | `AuthServiceTest.loginReturnsTokensForActiveUser` |
| REQ-3.1.1 | TC-001-02 | TD-INVALID-001 | `AuthServiceTest.loginRejectsInactiveUserAfterAuthentication` |
| AUTH-01 | TC-023-01 | TD-INVALID-014 | `AuthServiceTest.refreshRejectsNonRefreshToken` |
| AUTH-02 | TC-023-02 | TD-VALID-001 | `AccessScopeServiceTest.isSuperAdminReturnsTrueWhenRoleIsPresent` |
| AUTH-03 / BR-07 | TC-024-01, TC-024-02 | TD-VALID-002, TD-INVALID-010 | `AccessScopeServiceTest`, `CourseServiceTest`, `WeeklyScheduleServiceTest` |
| BR-01 | TC-012-01 | TD-COMBO-001 | `WeeklyScheduleServiceTest.createScheduleRejectsClassroomConflictAcrossDepartments` |
| BR-02 | TC-013-01 | TD-COMBO-002 | `WeeklyScheduleServiceTest.createScheduleRejectsAcademicianConflict` |
| BR-03 | TC-014-01 | TD-COMBO-003 | `WeeklyScheduleServiceTest.createScheduleRejectsRequiredCourseConflictForSameGrade` |
| BR-04 | TC-015-01..TC-015-04 | TD-COMBO-004..TD-COMBO-007 | `WeeklyScheduleServiceTest.availableClassroomsChecksAllSlotsForMultiSlotSelection`, update multi-slot conflict tests |
| BR-06 | TC-018-01..TC-018-03 | TD-BOUNDARY-010..TD-BOUNDARY-012 | `WeeklyScheduleServiceTest` capacity tests |
| BR-08 | TC-019-02 | TD-INVALID-015 | `ScheduleExceptionServiceTest.createExtraLessonRejectsCourseOwnedByAnotherAcademician` |
| BR-09 | TC-019-03 | TD-SPECIAL-004 | `ScheduleExceptionServiceTest.createExtraLessonRejectsWeekendDate` |
| BR-10 | TC-020-02 | TD-SPECIAL-005 | `ScheduleExceptionServiceTest.createMakeupRejectsDuplicateForSameOriginalScheduleAndDate` |
| BR-11 | TC-021-02 | TD-SPECIAL-005 | `ScheduleExceptionServiceTest.cancelLessonRejectsDuplicateCancellation` |

## 13. Test Sonuclari

Komut denendi:

```powershell
mvn test
```

Sonuc: calistirilamadi. Ortamda `mvn` komutu bulunmuyor ve projede Maven wrapper (`mvnw`) yok.

| Metrik | Sonuc |
|---|---:|
| Toplam test | Calistirilamadi |
| Passed | Calistirilamadi |
| Failed | Calistirilamadi |
| Skipped | Calistirilamadi |
| Error | Calistirilamadi |

Statik kontrol:

| Kontrol | Sonuc |
|---|---|
| Final test sinifi sayisi | 6 |
| Final test metodu sayisi | 57 |
| `@SpringBootTest` / MockMvc kaldi mi? | Hayir |
| Yeni dependency eklendi mi? | Hayir |

## 14. Basarisiz Testler ve Nedenleri

Test lifecycle baslatilamadigi icin basarisiz test ayrimi yapilamadi. Engelleyici neden: Maven komutu PATH uzerinde yok ve repository'de Maven wrapper bulunmuyor.

## 15. Tespit Edilen Gercek Buglar

Bu sprintte production bug'i dogrulanmadi. Production code degistirilmedi.

Not edilen belirsizlik: Sprint 13.3'teki online schedule create DTO / entity uyumsuzlugu test tarafinda yeni varsayima donusturulmedi.

## 16. Coverage (varsa)

Projede coverage araci yapilandirmasi bulunmuyor. Bu sprintte coverage icin yeni arac eklenmedi.

## 17. Sprint 13.5 Icin Hazir Girdiler

| Girdi | Not |
|---|---|
| Mockito interaction kalitesi | `verify`, `times`, `never`, `InOrder` gibi konular sistematik olarak ele alinabilir |
| Fixture standardizasyonu | `WeeklyScheduleServiceTest` helperlari oldukca genis; ortak test fixture yapisi degerlendirilebilir |
| Removed integration/web tests | Controller security, layout persistence ve context smoke testleri Sprint 13.6 icin tekrar tasarlanabilir |
| Maven wrapper | CI ve lokal dogrulama icin `mvnw` eklenmesi degerlendirilebilir |

