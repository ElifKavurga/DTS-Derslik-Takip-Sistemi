# Sprint 13.5 - Mockito + Mocklama + Davranis Dogrulama

## 1. Kapsam

Bu sprintte Sprint 13.4'te temizlenen service-only unit test yapisi korunarak Mockito davranis dogrulamasi guclendirildi. Production code degistirilmedi, yeni dependency eklenmedi, integration/web-layer test eklenmedi.

Odak alanlari:

| Alan | Uygulama |
|---|---|
| Mock izolasyonu | Repository, mapper, security/service bagimliliklari mock olarak tutuldu |
| State verification | Donen response, entity state, exception code/message ve saved entity alanlari dogrulandi |
| Behavior verification | `verify()` ile anlamli dependency cagri sozlesmeleri dogrulandi |
| `times()` | Is mantigi acisindan anlamli cagri sayilari dogrulandi |
| `never()` | Negatif akislarda persistence/notification/token generation gibi yan etkiler engellendi |
| `InOrder` | Sadece is mantigi acisindan anlamli iki siralama dogrulandi |

## 2. Incelenen Yapi

Incelenen test siniflari:

| Test sinifi | Production hedefi | Mocklanan bagimlilik turleri |
|---|---|---|
| `AuthServiceTest` | `AuthService` | `AuthenticationManager`, `JwtService`, `UserMapper`, repositories, `PasswordEncoder` |
| `AccessScopeServiceTest` | `AccessScopeService` | `FacultyRepository`, `DepartmentRepository` |
| `CourseServiceTest` | `CourseService` | repositories, `CourseMapper`, `AccessScopeService`, `NotificationService` |
| `DashboardServiceTest` | `DashboardService` | repositories, `AccessScopeService`, `WeeklyScheduleService` |
| `ScheduleExceptionServiceTest` | `ScheduleExceptionService` | repositories, `WeeklyScheduleService`, `AccessScopeService` |
| `WeeklyScheduleServiceTest` | `WeeklyScheduleService` | repositories, `AccessScopeService` |

`@SpringBootTest`, MockMvc, `@WebMvcTest`, `@DataJpaTest` veya gercek DB baglantisi eklenmedi.

## 3. Yapilan Test Degisiklikleri

| Dosya | Degisiklik |
|---|---|
| `AuthServiceTest` | Login token generation icin `times(1)`, inactive login icin `never()`, reset password icin `InOrder` eklendi |
| `AccessScopeServiceTest` | Super Admin akisi icin repository non-effect verification, scope lookup icin `times(1)` eklendi |
| `CourseServiceTest` | Eksik `AcademicPeriodRepository` mock'u eklendi; create/update state dogrulamasi guclendirildi; save -> notification -> mapper sirasi `InOrder` ile dogrulandi |
| `ScheduleExceptionServiceTest` | Iki slotlu ek ders basari akisi eklendi; conflict check repository cagrilari `times(2)` ile dogrulandi; saved exception state'i yakalandi |

Yeni eklenen test:

| Test | Amac |
|---|---|
| `ScheduleExceptionServiceTest.createExtraLessonChecksEachSelectedSlotAndPersistsWhenTargetIsAvailable` | Coklu slotta her slot icin classroom/academician/grade conflict kontrollerinin yapildigini ve uygun durumda exception kaydedildigini dogrular |

## 4. State Verification

State verification ornekleri:

| Test | Dogrulanan durum |
|---|---|
| `AuthServiceTest.loginReturnsTokensForActiveUser` | Access token, refresh token ve user response dogru doner |
| `AuthServiceTest.resetPasswordEncodesPasswordAndMarksTokenUsed` | Kullanici sifresi encode edilir, reset token used olur |
| `CourseServiceTest.departmentAdminCreateCourseUsesAuthenticatedDepartmentScope` | Kaydedilen ders code, faculty, department, period, semester ve student count degerlerini tasir |
| `CourseServiceTest.updateCoursePersistsStudentCount` | Guncellenen ders student count ve academic period bilgisini tasir |
| `ScheduleExceptionServiceTest.createExtraLessonChecksEachSelectedSlotAndPersistsWhenTargetIsAvailable` | Kaydedilen exception `EXTRA`, course, academician, classroom, timeSlot ve slotCount degerlerini tasir |

## 5. Behavior Verification

Final service unit testlerinde 63 `verify()` kullanimi bulunuyor. Mekanik tum internal cagrilar degil, is sonucu acisindan anlamli dependency sozlesmeleri dogrulandi.

| Davranis | Ornek test |
|---|---|
| Auth basarisinda authentication ve token servisleri cagrilir | `AuthServiceTest.loginReturnsTokensForActiveUser` |
| Course create akisi save, notification ve mapper kullanir | `CourseServiceTest.departmentAdminCreateCourseUsesAuthenticatedDepartmentScope` |
| Dashboard ozeti scope ve repository sayimlarini kullanir | `DashboardServiceTest.departmentAdminDashboardUsesAuthenticatedUsersDepartmentScope` |
| Schedule conflict bulundugunda save yapilmaz | `WeeklyScheduleServiceTest` conflict testleri |
| Schedule exception duplicate/conflict durumunda save yapilmaz | `ScheduleExceptionServiceTest` negatif testleri |

## 6. `times()` Kullanimi

Final testlerde 16 `times()` kullanimi var.

| Test | Gerekce |
|---|---|
| `AuthServiceTest.loginReturnsTokensForActiveUser` | Access token, refresh token ve mapper cagrilari birer kez yapilmali |
| `AuthServiceTest.resetPasswordEncodesPasswordAndMarksTokenUsed` | User ve reset token birer kez kaydedilmeli |
| `AccessScopeServiceTest.requireDepartmentScopeReturnsMatchingDepartmentIgnoringCase` | Faculty ve department lookup birer kez yeterli |
| `CourseServiceTest.departmentAdminCreateCourseUsesAuthenticatedDepartmentScope` | Ders save, notification ve mapper birer kez yapilmali |
| `ScheduleExceptionServiceTest.createExtraLessonChecksEachSelectedSlotAndPersistsWhenTargetIsAvailable` | Iki slot icin uc farkli conflict lookup ikiser kez yapilmali |

## 7. `never()` ve Non-Effect Verification

Final testlerde 40 `never()` kullanimi var.

| Negatif akis | Non-effect dogrulamasi |
|---|---|
| Inactive login | Token generation yapilmaz |
| Invalid refresh token | User lookup yapilmaz |
| Expired reset token | User/token save yapilmaz |
| Duplicate course code | Course save, academician lookup, notification ve mapper yapilmaz |
| Scope disi course update | Course save, notification, mapper ve period lookup yapilmaz |
| Schedule conflict | `weeklyScheduleRepository.saveAll` yapilmaz |
| Schedule exception duplicate/conflict | `scheduleExceptionRepository.save` yapilmaz |

## 8. `InOrder` Kullanimi

Iki anlamli siralama dogrulandi:

| Test | Sira |
|---|---|
| `AuthServiceTest.resetPasswordEncodesPasswordAndMarksTokenUsed` | Once user save, sonra reset token save |
| `CourseServiceTest.departmentAdminCreateCourseUsesAuthenticatedDepartmentScope` | Once course save, sonra notification, sonra mapper response |

Gereksiz sira dogrulamasi eklenmedi; yalnizca is akisi acisindan anlamli noktalarda kullanildi.

## 9. Exception ve Negatif Senaryolar

Final testlerde 32 exception scenario assertion'i bulunuyor.

| Alan | Ornek |
|---|---|
| Authentication | Inactive user, invalid refresh token, expired reset token |
| Authorization / scope | Department claim eksik, scope mismatch, scope disi ders |
| Course business logic | Duplicate code, invalid student count, scope disi update |
| Weekly schedule | Classroom, academician, required class, multi-slot conflict |
| Schedule exception | Baska akademisyenin dersi, hafta sonu, duplicate cancellation/makeup, target classroom conflict |

## 10. Unit Test -> Mock / Behavior Verification Izlenebilirligi

| TC / TD | Unit test | Mock / behavior verification |
|---|---|---|
| TC-001-01 / TD-VALID-001 | `AuthServiceTest.loginReturnsTokensForActiveUser` | `AuthenticationManager`, `JwtService`, `UserMapper`; token calls `times(1)` |
| TC-001-02 / TD-INVALID-001 | `AuthServiceTest.loginRejectsInactiveUserAfterAuthentication` | `JwtService` token generation `never()` |
| AUTH-01 / TD-INVALID-014 | `AuthServiceTest.refreshRejectsNonRefreshToken` | Invalid refresh token sonrasi `userRepository.findByEmail` `never()` |
| REQ-3.1.4 / TD-BOUNDARY-002 | `AuthServiceTest.resetPasswordEncodesPasswordAndMarksTokenUsed` | `InOrder`: user save -> token save |
| AUTH-03 / TD-VALID-002 | `AccessScopeServiceTest.requireDepartmentScopeReturnsMatchingDepartmentIgnoringCase` | Faculty/department lookup `times(1)` |
| AUTH-03 / TD-INVALID-010 | `AccessScopeServiceTest.assertDepartmentAccessRejectsScopeMismatch` | Scope mismatch exception |
| TC-010-01 / TD-VALID-010 | `CourseServiceTest.departmentAdminCreateCourseUsesAuthenticatedDepartmentScope` | Save -> notification -> mapper `InOrder`; entity state capture |
| TC-009-03 / TD-INVALID-009 | `CourseServiceTest.createCourseRejectsDuplicateCodeIgnoringCase` | Save/notification/mapper non-effect |
| TC-024-02 / TD-INVALID-010 | `CourseServiceTest.departmentAdminCannotUpdateCourseOutsideDepartmentScope` | Save/notification/mapper/period lookup non-effect |
| TC-015-01 / TD-COMBO-004 | `ScheduleExceptionServiceTest.createExtraLessonChecksEachSelectedSlotAndPersistsWhenTargetIsAvailable` | 2 slot icin conflict repository cagrilari `times(2)` |
| TC-019-02 / TD-INVALID-015 | `ScheduleExceptionServiceTest.createExtraLessonRejectsCourseOwnedByAnotherAcademician` | Time configuration ve save `never()` |
| TC-019-03 / TD-SPECIAL-004 | `ScheduleExceptionServiceTest.createExtraLessonRejectsWeekendDate` | Weekend exception sonrasi save `never()` |
| TC-020-02, TC-021-02 / TD-SPECIAL-005 | Duplicate makeup/cancellation testleri | Duplicate exception sonrasi save `never()` |
| TC-012-01..TC-016-01 / TD-COMBO-* | `WeeklyScheduleServiceTest` conflict testleri | Conflict sonrasi `saveAll` `never()` |

## 11. Test Sonuclari

Komut denendi:

```powershell
mvn test
```

Sonuc: calistirilamadi. Ortamda `mvn` komutu bulunmuyor ve projede Maven wrapper (`mvnw` / `mvnw.cmd`) yok. PASS/FAIL sonucu uretilmedi.

| Metrik | Sonuc |
|---|---:|
| Toplam mevcut unit test | 58 |
| PASS | Olculemedi |
| FAIL | Olculemedi |
| ERROR | Olculemedi |
| SKIPPED | Olculemedi |

Statik sayim:

| Metrik | Sayi |
|---|---:|
| Test sinifi | 6 |
| Unit test metodu | 58 |
| Yeni eklenen test | 1 |
| Degistirilen test sinifi | 4 |
| `verify()` kullanimi | 63 |
| `times()` kullanimi | 16 |
| `never()` kullanimi | 40 |
| `InOrder` senaryosu | 2 |
| Exception scenario assertion'i | 32 |

## 12. Coverage

Coverage araci yapilandirmasi bulunmuyor. Bu sprintte coverage icin yeni arac veya dependency eklenmedi.

## 13. Ayrilan Integration Isleri

Sprint 13.5 kapsaminda eklenmedi:

| Konu | Neden |
|---|---|
| Controller security / MockMvc | Sprint 13.6 web/integration kapsaminda ele alinmali |
| Repository / H2 / DB constraint testleri | Unit test degil, integration kapsami |
| Gercek PostgreSQL | Sprint 13.5 unit-test izolasyonuna aykiri |
| Online schedule create DTO belirsizligi | Sprint 13.3 belirsizligi devam ediyor; yeni business rule uretilmedi |

## 14. Sonuc

Sprint 13.5 kapsaminda Mockito davranis dogrulamasi guclendirildi:

| Baslik | Sonuc |
|---|---|
| Production code degisti mi? | Hayir |
| Dependency degisti mi? | Hayir |
| Integration test eklendi mi? | Hayir |
| `@SpringBootTest` eklendi mi? | Hayir |
| Mock kullanilan test sinifi | 6 |
| State verification | Var |
| Behavior verification | Var |
| `times()` | Var |
| `never()` | Var |
| `InOrder` | Var |
| Negative scenario | Var |
| Exception scenario | Var |

