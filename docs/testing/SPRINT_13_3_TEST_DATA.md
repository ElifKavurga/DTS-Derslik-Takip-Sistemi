# Sprint 13.3 - Test Verilerinin Hazirlanmasi

## 1. Kapsam

Bu dokuman Sprint 13.2'de tasarlanan 24 test senaryosu ve 72 test case icin kullanilacak test verilerini tanimlar. Amac, Sprint 13.4'te yazilacak unit testlere ve gerekirse manuel test kosularina dogrudan girdi saglamaktir.

Bu sprintte yalnizca test verisi tasarimi yapilmistir. JUnit, Mockito, test otomasyonu, production code degisikligi, yeni dependency, yeni migration veya test calistirma yapilmamistir.

## 2. Kullanilan Kaynaklar

| Kaynak | Kullanim amaci |
|---|---|
| `docs/testing/SPRINT_13_1_REQUIREMENT_ANALYSIS.md` | Dogrulanmis requirement, is kurali, belirsizlik ve test edilebilirlik notlari |
| `docs/testing/SPRINT_13_2_TEST_CASE_DESIGN.md` | Scenario ID, Test Case ID, teknik ve beklenen sonuc tasarimi |
| `docs/SPRINT_12_4_TEST_SCENARIOS.md` | Mevcut cakisma ve edge-case test verisi ozeti |
| `backend/src/main/resources/db/migration/V2__create_users_and_seed_super_admin.sql` | Super Admin seed kullanicisi ve desteklenen rol enumlari |
| `backend/src/main/resources/db/migration/V6__create_campus_tables_and_seed_data.sql` | Fakulte, bina, kat, bolum, derslik ve kullanici seed verileri |
| `backend/src/main/resources/db/migration/V11__create_courses_table.sql` | Seed dersler ve ders-bolum-akademisyen iliskileri |
| `backend/src/main/resources/db/migration/V20__create_academic_periods_table.sql` | Akademik donem seed verileri |
| `backend/src/main/resources/db/migration/V25__seed_conflict_and_edge_case_scenarios.sql` | Sprint 12.4 `[S12.4]` etiketli haftalik program ve cakisma verileri |

## 3. Mevcut Sprint 12 Test Verilerinin Degerlendirilmesi

Sprint 12.4 verileri `weekly_schedules.source_note` alanindaki `[S12.4]` etiketiyle ayrilabilir durumdadir. Bu veri seti Sprint 13 icin yeniden kullanilabilir, ancak modelin desteklemedigi alanlarda yeni varsayim uretilmemelidir.

| Sprint 12 verisi | Durum | Sprint 13.3 karari |
|---|---|---|
| Ayni akademisyen / ayni slot | Kullanilabilir | `TD-COMBO-002` olarak tekrar kullanilir |
| Ayni zorunlu sinif / ayni slot | Kullanilabilir | `TD-COMBO-003` olarak tekrar kullanilir |
| Kismi cakisma | Kullanilabilir | `TD-COMBO-004` olarak tekrar kullanilir |
| Tam kapsama | Kullanilabilir | `TD-COMBO-005` olarak tekrar kullanilir |
| Ayni baslangic | Kullanilabilir | `TD-COMBO-006` olarak tekrar kullanilir |
| Ayni bitis | Kullanilabilir | `TD-COMBO-007` olarak tekrar kullanilir |
| Arka arkaya ders | Kullanilabilir | `TD-VALID-013` olarak tekrar kullanilir |
| Ayni akademisyen / farkli slot | Kullanilabilir | `TD-VALID-014` olarak tekrar kullanilir |
| Kapasite asimi | Kullanilabilir | `TD-SPECIAL-001` olarak tekrar kullanilir |
| Online ders / classroom null | Kullanilabilir | `TD-VALID-012` ve `TD-COMBO-008` olarak tekrar kullanilir |
| Fiziksel temel ders | Kullanilabilir | `TD-VALID-011` olarak tekrar kullanilir |
| Ayni derslik / ayni slot | DB unique constraint nedeniyle ikinci satir yok | API reddi icin `TD-COMBO-001` ile temsil edilir |
| Farkli hafta | Modelde hafta/tarih alani yok | `TD-SPECIAL-002` belirsizlik girdisi olarak tutulur |
| Serbest zaman araligi | Model yalnizca ayrik `time_slot` kullanir | `TD-SPECIAL-003` belirsizlik girdisi olarak tutulur |
| Fiziksel derslik eksik | DTO `classroomId` zorunlu | `TD-INVALID-011` ile negatif veri olarak tutulur |
| Aktif akademik donem yok | Program sorgusu/olusturma oncesi aktif donem bulunmama durumu | `TD-INVALID-012` ile negatif veri olarak tutulur |

## 4. Test Verisi Yaklasimi

Test verileri 5 ana gruba ayrilmistir: valid, invalid, boundary, combination ve special/exceptional. Ayrica authentication, authorization, derslik, ders programi, cakisma, online/fiziksel, filtre ve form validation bolumlerinde ayni `TD-*` kimlikleri yeniden referanslanmistir.

| Metrik | Sayi |
|---|---:|
| Toplam test data seti | 58 |
| Valid test data | 16 |
| Invalid test data | 14 |
| Boundary test data | 12 |
| Combination test data | 8 |
| Special / exceptional test data | 8 |
| Sprint 12'den yeniden kullanilan veri | 14 |
| Sprint 13.3'te yeni tasarlanan veri | 44 |

Kaynakla dogrulanan sinirlar:

| Konu | Kaynak sonucu |
|---|---|
| `dayOfWeek=SATURDAY` | Haftalik program icin `WeeklyScheduleService.DAYS` yalnizca `MONDAY`-`FRIDAY` icerir; `normalizeDay` liste disini reddeder. Bu nedenle `SATURDAY` haftalik programda gecersiz test verisi olarak tutulur. |
| `slotCount=0/12/13` | Haftalik programda `WeeklyScheduleService.normalizeSlotCount` 1-12 araligini uygular. Ek ders/telafi DTO'larinda `@Min(1) @Max(12)` vardir. Bu nedenle 0, 12 ve 13 boundary verileri kaynak desteklidir. |

Verilerde gercek kisi bilgisi veya gercek sifre kullanilmaz. Seed dosyalarinda bulunan gelistirme sifreleri bu dokumanda tekrar edilmez; sifre alanlari `<DUMMY_VALID_PASSWORD>`, `<DUMMY_INVALID_PASSWORD>` veya benzeri sentetik placeholder ile temsil edilir.

## 5. Valid Test Data

| Data ID | Veri seti | Degerler | Kaynak | Ilgili TC |
|---|---|---|---|---|
| TD-VALID-001 | Aktif Super Admin oturumu | `role=SUPER_ADMIN`, `active=true`, `userId=11111111-1111-1111-1111-111111111111`, `password=<DUMMY_VALID_PASSWORD>` | Reuse: V2 | TC-001-01, TC-002-01, TC-003-01 |
| TD-VALID-002 | Aktif Department Admin - CENG | `role=DEPARTMENT_ADMIN`, `faculty=MF`, `department=CENG`, `password=<DUMMY_VALID_PASSWORD>` | Reuse: V6/V24 | TC-009-01, TC-010-01, TC-011-01, TC-024-01 |
| TD-VALID-003 | Aktif Academician - kendi dersi olan kullanici | `role=ACADEMICIAN`, `faculty=MF`, `department=CENG`, `ownedCourses=CENG101,CENG201,CENG301,CENG401` | Reuse: V6/V11 | TC-010-02, TC-019-01, TC-020-01, TC-021-01, TC-024-03 |
| TD-VALID-004 | Fakulte olusturma payload | `name=Test Muhendislik Fakultesi`, `code=TMF13` | New | TC-003-01 |
| TD-VALID-005 | Bina olusturma payload | `facultyCode=MF`, `name=Sprint 13 Test Blok`, `code=S13-BLK` | New | TC-004-01 |
| TD-VALID-006 | Kat olusturma payload | `buildingCode=S13-BLK`, `name=1. Kat`, `level=1` | New | TC-005-01 |
| TD-VALID-007 | Layout payload | `floorId=<VALID_FLOOR_ID>`, `objects=[classroom, door, corridor]`, koordinatlar pozitif | New | TC-006-01, TC-022-02 |
| TD-VALID-008 | Derslik olusturma payload | `code=S13-D101`, `capacity=60`, `type=CLASSROOM`, `equipment=Projeksiyon` | New | TC-007-01, TC-017-03 |
| TD-VALID-009 | Bolum olusturma payload | `facultyCode=MF`, `name=Sprint 13 Bilgisayar`, `code=S13CENG` | New | TC-008-01 |
| TD-VALID-010 | Ders olusturma payload | `code=S13C101`, `courseType=ZORUNLU`, `grade=1`, `studentCount=40`, `academician=<CENG_ACADEMICIAN>` | New | TC-010-01, TC-011-01 |
| TD-VALID-011 | Fiziksel temel schedule | `deliveryType=FACE_TO_FACE`, `day=MONDAY`, `timeSlot=08:15-09:00`, `[S12.4][PHYSICAL_BASELINE]` | Reuse: V25 | TC-017-03 |
| TD-VALID-012 | Online schedule | `deliveryType=ONLINE`, `classroomId=null`, `day=TUESDAY`, `timeSlot=13:30-14:15`, `[S12.4][ONLINE_NO_PHYSICAL_CONFLICT]` | Reuse: V25 | TC-017-01 |
| TD-VALID-013 | Back-to-back schedule | Ayni derslikte `08:15-09:00` ve `09:10-09:55` ayrik slotlari | Reuse: V25 | TC-016-01 |
| TD-VALID-014 | Ayni akademisyen farkli slot | Ayni akademisyen, Pazartesi `08:15-09:00` ve `10:05-10:50` | Reuse: V25 | TC-016-01 |
| TD-VALID-015 | Laboratuvar derslik payload | `code=S13-LAB201`, `capacity=40`, `type=LABORATORY`, `equipment=Bilgisayar` | New | TC-007-01 |
| TD-VALID-016 | Amfi derslik payload | `code=S13-AMFI1`, `capacity=120`, `type=AMPHITHEATER`, `equipment=Ses sistemi` | New | TC-007-01 |

## 6. Invalid Test Data

| Data ID | Gecersiz veri | Degerler | Beklenen kullanim | Ilgili TC |
|---|---|---|---|---|
| TD-INVALID-001 | Hatali sifre | Gecerli kullanici + `password=<DUMMY_INVALID_PASSWORD>` | Login reddi | TC-001-02 |
| TD-INVALID-002 | Eksik login alani | `email=""` veya `password=""` | Validation hatasi | TC-001-03 |
| TD-INVALID-003 | Bos profil zorunlu alani | `firstName=""` veya `lastName=""` | Profil update reddi | TC-002-02 |
| TD-INVALID-004 | Var olmayan fakulte ID | `facultyId=00000000-0000-4000-8000-000000000404` | Bina/bolum FK reddi | TC-004-02 |
| TD-INVALID-006 | Gecersiz derslik turu | `type=OFFICE` | Enum reddi | TC-007-02 |
| TD-INVALID-007 | Derslik capacity eksik | `capacity=null` | Validation hatasi | TC-007-03 |
| TD-INVALID-008 | Bos bolum kodu | `code=""` | Validation hatasi | TC-008-02 |
| TD-INVALID-009 | Duplicate akademisyen e-postasi | Mevcut seed kullanici e-postasi ile yeni akademisyen payload | Unique alan reddi | TC-009-03 |
| TD-INVALID-010 | Department Admin scope disi kaynak | CENG Department Admin + baska fakulte derslik ID veya baska bolum akademisyen ID | AccessDenied | TC-009-02, TC-024-02 |
| TD-INVALID-011 | Fiziksel dersliksiz schedule | `deliveryType=FACE_TO_FACE`, `classroomId=null` | DTO/servis reddi | TC-017-04 |
| TD-INVALID-012 | Aktif akademik donem yok | `activeAcademicPeriod=null` | Program sorgusu/olusturma oncesi hata | TC-011-02 |
| TD-INVALID-013 | Var olmayan classroom public sorgusu | `classroomId=00000000-0000-4000-8000-000000000999` | Not found/hata | TC-022-03 |
| TD-INVALID-014 | Unauthenticated protected request | Token yok veya gecersiz token | 401 veya login yonlendirmesi | TC-023-01 |
| TD-INVALID-015 | Academician baskasinin dersi | ACADEMICIAN kullanicisi + baska akademisyene ait `courseId` | AccessDenied | TC-019-02 |

## 7. Boundary Test Data

| Data ID | Alan | Deger | Sinir gerekcesi | Ilgili TC |
|---|---|---|---|---|
| TD-BOUNDARY-001 | Yeni sifre | 7 karakter: `<PWD_7>` | Min 8'in hemen alti | TC-002-03 |
| TD-BOUNDARY-002 | Yeni sifre | 8 karakter: `<PWD_8>` | Min 8 sinir degeri | TC-002-04 |
| TD-BOUNDARY-003 | Fakulte adi | 255 karakter | DTO max siniri | TC-003-02 |
| TD-BOUNDARY-004 | Fakulte adi | 256 karakter | DTO max + 1 | TC-003-03 |
| TD-BOUNDARY-005 | Kat adi | 101 karakter | Max 100 + 1 | TC-005-02 |
| TD-BOUNDARY-006 | Weekly schedule `slotCount` | `0` | `WeeklyScheduleService.normalizeSlotCount`: min 1'in hemen alti | TC-011-04 |
| TD-BOUNDARY-007 | Weekly schedule `slotCount` | `12` | `WeeklyScheduleService.normalizeSlotCount`: max sinir | TC-011-05 |
| TD-BOUNDARY-008 | Weekly schedule `dayOfWeek` | `SATURDAY` | `WeeklyScheduleService.DAYS` ve `normalizeDay`: `MONDAY`-`FRIDAY` disi | TC-011-03 |
| TD-BOUNDARY-009 | Weekly schedule / exception `slotCount` | `13` | `WeeklyScheduleService.normalizeSlotCount` ve exception DTO `@Max(12)`: max + 1 | TC-011-06, TC-019-04 |
| TD-BOUNDARY-010 | Kapasite | `capacity=studentCount-1` | Yetersizlige gecis | TC-018-02 |
| TD-BOUNDARY-011 | Kapasite | `capacity=studentCount` | Esitlik siniri | TC-018-01 |
| TD-BOUNDARY-012 | Kapasite | `capacity=studentCount+1` | Yeterlilik ustu | TC-018-03 |

## 8. Combination Test Data

| Data ID | Kombinasyon | Degerler | Kaynak | Ilgili TC |
|---|---|---|---|---|
| TD-COMBO-001 | Ayni derslik / ayni slot | Ilk fiziksel schedule mevcut; ikinci payload ayni `classroomId`, `day`, `timeSlot` ile denenir; farkli gun varyanti cakisma uretmez | Partial reuse: V25 + new API payload | TC-012-01, TC-012-02 |
| TD-COMBO-002 | Ayni akademisyen / ayni slot | Pazartesi `08:15-09:00`, iki farkli derslik, ayni akademisyen | Reuse: V25 | TC-013-01, TC-013-02 |
| TD-COMBO-003 | Ayni zorunlu sinif / ayni slot | CENG 1-A Pazartesi `08:15-09:00`, iki zorunlu ders | Reuse: V25 | TC-014-01, TC-014-02 |
| TD-COMBO-004 | Kismi cakisma | Carsamba iki coklu-slot grup `09:10-09:55` ortak slotunu paylasir | Reuse: V25 | TC-015-01 |
| TD-COMBO-005 | Tam kapsama | Persembe 3 slotluk dis grup + ortadaki tek slotluk ic grup | Reuse: V25 | TC-015-02 |
| TD-COMBO-006 | Ayni baslangic | Cuma iki grup `08:15-09:00` slotunda baslar | Reuse: V25 | TC-015-03 |
| TD-COMBO-007 | Ayni bitis | Sali iki grup `09:10-09:55` slotunda biter | Reuse: V25 | TC-015-04 |
| TD-COMBO-008 | Online/fiziksel kaynak ayrimi | `ONLINE/null`, `ONLINE/classroom`, `FACE_TO_FACE/classroom`, `FACE_TO_FACE/null` | Reuse + new invalid payload | TC-017-01, TC-017-02, TC-017-03, TC-017-04 |

## 9. Special / Exceptional Test Data

| Data ID | Ozel veri | Degerler | Durum | Ilgili TC |
|---|---|---|---|---|
| TD-SPECIAL-001 | Kapasite asimi dersi | `courseCode=S124EC1`, `studentCount=999`, dusuk kapasiteli derslik | Reuse: V25 | TC-018-02 |
| TD-SPECIAL-002 | Farkli hafta senaryosu | Haftaya ozel program beklentisi | Desteklenmiyor, modelde hafta/tarih yok | TC-016-02 |
| TD-SPECIAL-003 | Serbest zaman araligi | `start=08:30`, `end=09:30` gibi ayrik slot disi aralik | Desteklenmiyor, `time_slot` granuler model var | TC-015-01, TC-016-02 |
| TD-SPECIAL-004 | Hafta sonu exception | Cumartesi tarihli ek ders/telafi payload | Yeni negatif exception verisi | TC-019-03 |
| TD-SPECIAL-005 | Duplicate telafi/iptal | Ayni `scheduleId` + ayni tarih ikinci kez | Yeni duplicate exception verisi | TC-020-02, TC-021-02 |
| TD-SPECIAL-006 | Baslamis ders iptali | Gecmis veya basladigi kabul edilen ders tarihi | Belirsiz; kesin valid/invalid fixture degil | TC-021-03 |
| TD-SPECIAL-007 | Anlik durum / yakinda bosalacak esigi | Dolu, bos, yakinda bosalacak beklentisi | Belirsiz; esik tanimli olmadigi icin kesin fixture degil | TC-022-04 |
| TD-SPECIAL-008 | Kat plani format belirsizligi | `mimeType=application/pdf` veya format alaninin belirsiz oldugu payload | Belirsiz; desteklenen MIME listesi net degil | TC-006-03 |

## 10. Authentication Test Data

| Data ID | Kullanici tipi | Rol | Faculty / Department | Sifre temsili | Ilgili TC |
|---|---|---|---|---|---|
| TD-VALID-001 | Super Admin | `SUPER_ADMIN` | Global | `<DUMMY_VALID_PASSWORD>` | TC-001-01, TC-002-01 |
| TD-VALID-002 | Department Admin | `DEPARTMENT_ADMIN` | `MF` / `CENG` | `<DUMMY_VALID_PASSWORD>` | TC-001-01, TC-024-01 |
| TD-VALID-003 | Academician | `ACADEMICIAN` | `MF` / `CENG` | `<DUMMY_VALID_PASSWORD>` | TC-001-01, TC-024-03 |
| TD-INVALID-001 | Hatali sifre varyanti | Mevcut rol | Mevcut scope | `<DUMMY_INVALID_PASSWORD>` | TC-001-02 |
| TD-INVALID-002 | Eksik credential | Yok | Yok | Bos alan | TC-001-03 |

## 11. Role and Authorization Test Data

| Data ID | Rol + kapsam | Islem | Beklenen sonuc | Ilgili TC |
|---|---|---|---|---|
| TD-VALID-001 | `SUPER_ADMIN` / global | Fakulte, bina, kat, layout, derslik, bolum CRUD | Izin verilir | TC-003-01, TC-006-01 |
| TD-VALID-002 | `DEPARTMENT_ADMIN` / `MF-CENG` | Kendi bolum akademisyen/ders/program yonetimi | Izin verilir | TC-009-01, TC-010-01, TC-011-01, TC-024-01 |
| TD-INVALID-010 | `DEPARTMENT_ADMIN` / scope disi derslik | Baska fakulte dersligini programa atama | Reddedilir | TC-024-02 |
| TD-VALID-003 | `ACADEMICIAN` / kendi dersleri | Ders/exception goruntuleme ve kendi dersi icin exception | Izin verilir | TC-019-01, TC-024-03 |
| TD-INVALID-015 | `ACADEMICIAN` / baskasinin dersi | Baska akademisyenin dersi icin exception | Reddedilir | TC-019-02 |
| TD-INVALID-014 | Misafir / protected endpoint | Protected route veya API | 401/redirect | TC-023-01 |

## 12. Derslik Test Data

| Data ID | Derslik verisi | Degerler | Ilgili TC |
|---|---|---|---|
| TD-VALID-008 | Gecerli classroom | `code=S13-D101`, `capacity=60`, `type=CLASSROOM` | TC-007-01 |
| TD-VALID-015 | Gecerli laboratory | `code=S13-LAB201`, `capacity=40`, `type=LABORATORY` | TC-007-01 |
| TD-VALID-016 | Gecerli amphitheater | `code=S13-AMFI1`, `capacity=120`, `type=AMPHITHEATER` | TC-007-01 |
| TD-INVALID-006 | Enum disi tur | `type=OFFICE` | TC-007-02 |
| TD-INVALID-007 | Bos kapasite | `capacity=null` | TC-007-03 |
| TD-BOUNDARY-010 | Kapasite yetersiz | `capacity=studentCount-1` | TC-018-02 |
| TD-BOUNDARY-011 | Kapasite esit | `capacity=studentCount` | TC-018-01 |
| TD-BOUNDARY-012 | Kapasite yeterli | `capacity=studentCount+1` | TC-018-03 |

## 13. Ders Programi Test Data

| Data ID | Program verisi | Degerler | Ilgili TC |
|---|---|---|---|
| TD-VALID-010 | Gecerli ders on kosulu | CENG bolumu, akademisyen, akademik donem, `studentCount=40` | TC-010-01, TC-011-01 |
| TD-VALID-011 | Gecerli fiziksel program | `FACE_TO_FACE`, derslik var, Pazartesi `08:15-09:00` | TC-011-01, TC-017-03 |
| TD-VALID-012 | Gecerli online program | `ONLINE`, `classroomId=null` | TC-017-01 |
| TD-BOUNDARY-006 | `slotCount=0` | Haftalik program alt sinir disi | TC-011-04 |
| TD-BOUNDARY-007 | `slotCount=12` | Haftalik program ust sinir | TC-011-05 |
| TD-BOUNDARY-008 | `dayOfWeek=SATURDAY` | `WeeklyScheduleService.DAYS` kaynakli gecersiz gun | TC-011-03 |
| TD-BOUNDARY-009 | `slotCount=13` | Haftalik program / exception ust sinir disi | TC-011-06, TC-019-04 |

## 14. Cakisma Test Data

| Data ID | Cakisma tipi | Beklenen sonuc | Ilgili TC |
|---|---|---|---|
| TD-COMBO-001 | Ayni derslik / ayni slot ve farkli gun varyanti | Ayni gun/slot conflict, farkli gun no-conflict | TC-012-01, TC-012-02 |
| TD-COMBO-002 | Ayni akademisyen / ayni slot | `ACADEMICIAN_CONFLICT` | TC-013-01, TC-013-02 |
| TD-COMBO-003 | Ayni zorunlu sinif seviyesi | `STUDENT_GROUP_CONFLICT` | TC-014-01, TC-014-02 |
| TD-COMBO-004 | Kismi cakisma | Cakisma reddi | TC-015-01 |
| TD-COMBO-005 | Tam kapsama | Cakisma reddi | TC-015-02 |
| TD-COMBO-006 | Ayni baslangic | Cakisma reddi | TC-015-03 |
| TD-COMBO-007 | Ayni bitis | Cakisma reddi | TC-015-04 |
| TD-VALID-013 | Arka arkaya slot | Cakisma yok | TC-016-01 |

## 15. Online / Fiziksel Ders Test Data

| Data ID | Delivery type | Classroom | Beklenen sonuc | Ilgili TC |
|---|---|---|---|---|
| TD-VALID-012 | `ONLINE` | `null` | Gecerli, fiziksel kaynak cakismasi yok | TC-017-01 |
| TD-COMBO-008 | `ONLINE` | Gecerli derslik ID | Reddedilir | TC-017-02 |
| TD-VALID-011 | `FACE_TO_FACE` | Gecerli derslik ID | Gecerli | TC-017-03 |
| TD-INVALID-011 | `FACE_TO_FACE` | `null` | Reddedilir | TC-017-04 |

## 16. Filter Test Data

| Data ID | Filtre | Deger | Beklenen sonuc | Ilgili TC |
|---|---|---|---|---|
| TD-VALID-004 | Fakulte filtre | `facultyCode=MF` | Bina/bolum/derslik listesi doner | TC-022-01 |
| TD-VALID-005 | Bina filtre | Mevcut MF bina ID | Kat listesi doner | TC-022-01 |
| TD-VALID-006 | Kat filtre | Mevcut kat ID | Kat plani ve derslikler doner | TC-022-02 |
| TD-VALID-008 | Derslik filtre | Mevcut derslik ID | Public derslik programi doner | TC-022-01 |
| TD-INVALID-013 | Var olmayan derslik | `00000000-0000-4000-8000-000000000999` | Hata / not found | TC-022-03 |
| TD-SPECIAL-007 | Anlik durum esigi | Dolu, bos, yakinda bosalacak beklentisi | Esik belirsizligi not edilir; kesin fixture degil | TC-022-04 |

## 17. Form Validation Test Data

| Data ID | Form | Alan | Deger | Ilgili TC |
|---|---|---|---|---|
| TD-INVALID-002 | Login | `email/password` | Bos | TC-001-03 |
| TD-INVALID-003 | Profile | `firstName/lastName` | Bos | TC-002-02 |
| TD-BOUNDARY-001 | Change password | `newPassword` | 7 karakter | TC-002-03 |
| TD-BOUNDARY-002 | Change password | `newPassword` | 8 karakter | TC-002-04 |
| TD-BOUNDARY-003 | Faculty | `name` | 255 karakter | TC-003-02 |
| TD-BOUNDARY-004 | Faculty | `name` | 256 karakter | TC-003-03 |
| TD-BOUNDARY-005 | Floor | `name` | 101 karakter | TC-005-02 |
| TD-INVALID-006 | Classroom | `type` | `OFFICE` | TC-007-02 |
| TD-INVALID-007 | Classroom | `capacity` | `null` | TC-007-03 |
| TD-INVALID-008 | Department | `code` | Bos | TC-008-02 |
| TD-BOUNDARY-009 | Schedule / Exception | `slotCount` | 13 | TC-011-06, TC-019-04 |

## 18. Requirement -> Scenario -> Test Case -> Test Data Izlenebilirligi

| Requirement / BR | Scenario | Test Case | Test Data |
|---|---|---|---|
| REQ-3.1.1 | TS-001 | TC-001-01 | TD-VALID-001, TD-VALID-002, TD-VALID-003 |
| REQ-3.1.1 | TS-001 | TC-001-02 | TD-INVALID-001 |
| REQ-3.1.1 | TS-001 | TC-001-03 | TD-INVALID-002 |
| REQ-3.1.2, REQ-3.1.3, REQ-3.1.4 | TS-002 | TC-002-01 | TD-VALID-001, TD-VALID-002, TD-VALID-003 |
| REQ-3.1.3 | TS-002 | TC-002-02 | TD-INVALID-003 |
| REQ-3.1.4 | TS-002 | TC-002-03 | TD-BOUNDARY-001 |
| REQ-3.1.4 | TS-002 | TC-002-04 | TD-BOUNDARY-002 |
| REQ-3.4.1 | TS-003 | TC-003-01 | TD-VALID-004 |
| REQ-3.4.1 | TS-003 | TC-003-02 | TD-BOUNDARY-003 |
| REQ-3.4.1 | TS-003 | TC-003-03 | TD-BOUNDARY-004 |
| REQ-3.4.2 | TS-004 | TC-004-01 | TD-VALID-005 |
| REQ-3.4.2 | TS-004 | TC-004-02 | TD-INVALID-004 |
| REQ-3.4.3 | TS-005 | TC-005-01 | TD-VALID-006 |
| REQ-3.4.3 | TS-005 | TC-005-02 | TD-BOUNDARY-005 |
| REQ-3.4.4, REQ-3.4.5, BR-12 | TS-006 | TC-006-01 | TD-VALID-007 |
| BR-12 | TS-006 | TC-006-02 | TD-VALID-002 |
| REQ-3.4.4 | TS-006 | TC-006-03 | TD-SPECIAL-008 |
| REQ-3.2.5, REQ-3.4.5 | TS-007 | TC-007-01 | TD-VALID-008, TD-VALID-015, TD-VALID-016 |
| REQ-3.4.5 | TS-007 | TC-007-02 | TD-INVALID-006 |
| REQ-3.4.5 | TS-007 | TC-007-03 | TD-INVALID-007 |
| REQ-3.4.6 | TS-008 | TC-008-01 | TD-VALID-009 |
| REQ-3.4.6 | TS-008 | TC-008-02 | TD-INVALID-008 |
| REQ-3.5.1, BR-07 | TS-009 | TC-009-01 | TD-VALID-002 |
| REQ-3.5.1, BR-07 | TS-009 | TC-009-02 | TD-INVALID-010 |
| REQ-3.5.1 | TS-009 | TC-009-03 | TD-INVALID-009 |
| REQ-3.5.2 | TS-010 | TC-010-01 | TD-VALID-010 |
| REQ-3.5.2, BR-07 | TS-010 | TC-010-02 | TD-VALID-003 |
| REQ-3.5.3, REQ-3.5.4 | TS-011 | TC-011-01 | TD-VALID-010, TD-VALID-011 |
| REQ-3.5.3, BR-14 | TS-011 | TC-011-02 | TD-INVALID-012 |
| REQ-3.5.4 | TS-011 | TC-011-03 | TD-BOUNDARY-008 |
| REQ-3.5.4 | TS-011 | TC-011-04 | TD-BOUNDARY-006 |
| REQ-3.5.4 | TS-011 | TC-011-05 | TD-BOUNDARY-007 |
| REQ-3.5.4 | TS-011 | TC-011-06 | TD-BOUNDARY-009 |
| BR-01 | TS-012 | TC-012-01, TC-012-02 | TD-COMBO-001 |
| BR-02 | TS-013 | TC-013-01, TC-013-02 | TD-COMBO-002 |
| BR-03 | TS-014 | TC-014-01, TC-014-02 | TD-COMBO-003 |
| BR-04 | TS-015 | TC-015-01 | TD-COMBO-004 |
| BR-04 | TS-015 | TC-015-02 | TD-COMBO-005 |
| BR-04 | TS-015 | TC-015-03 | TD-COMBO-006 |
| BR-04 | TS-015 | TC-015-04 | TD-COMBO-007 |
| REQ-3.5.4 | TS-016 | TC-016-01 | TD-VALID-013, TD-VALID-014 |
| REQ-3.5.4 | TS-016 | TC-016-02 | TD-SPECIAL-002 |
| BR-05 | TS-017 | TC-017-01 | TD-VALID-012 |
| BR-05 | TS-017 | TC-017-02 | TD-COMBO-008 |
| BR-05 | TS-017 | TC-017-03 | TD-VALID-011 |
| BR-05 | TS-017 | TC-017-04 | TD-INVALID-011 |
| BR-06 | TS-018 | TC-018-01 | TD-BOUNDARY-011 |
| BR-06 | TS-018 | TC-018-02 | TD-BOUNDARY-010, TD-SPECIAL-001 |
| BR-06 | TS-018 | TC-018-03 | TD-BOUNDARY-012 |
| REQ-3.6.1, BR-08, BR-09 | TS-019 | TC-019-01 | TD-VALID-003, TD-VALID-011 |
| BR-08 | TS-019 | TC-019-02 | TD-INVALID-015 |
| BR-09 | TS-019 | TC-019-03 | TD-SPECIAL-004 |
| REQ-3.6.1 | TS-019 | TC-019-04 | TD-BOUNDARY-009 |
| REQ-3.6.1, BR-08, BR-10 | TS-020 | TC-020-01 | TD-VALID-003, TD-VALID-011 |
| BR-10 | TS-020 | TC-020-02 | TD-SPECIAL-005 |
| REQ-3.6.1 | TS-020 | TC-020-03 | TD-COMBO-001, TD-COMBO-002 |
| REQ-3.6.3, BR-08, BR-11 | TS-021 | TC-021-01 | TD-VALID-003, TD-VALID-011 |
| BR-11 | TS-021 | TC-021-02 | TD-SPECIAL-005 |
| REQ-3.6.3 | TS-021 | TC-021-03 | TD-SPECIAL-006 |
| REQ-3.2.1-REQ-3.7.5, BR-13 | TS-022 | TC-022-01 | TD-VALID-004, TD-VALID-005, TD-VALID-006, TD-VALID-008 |
| REQ-3.2.3, REQ-3.7.3 | TS-022 | TC-022-02 | TD-VALID-007 |
| REQ-3.2.5, REQ-3.7.5 | TS-022 | TC-022-03 | TD-INVALID-013 |
| REQ-3.2.1 | TS-022 | TC-022-04 | TD-SPECIAL-007 |
| AUTH-01, AUTH-02 | TS-023 | TC-023-01 | TD-INVALID-014 |
| AUTH-02, BR-12 | TS-023 | TC-023-02 | TD-VALID-002 |
| AUTH-06 | TS-023 | TC-023-03 | TD-VALID-003 |
| AUTH-03, BR-07 | TS-024 | TC-024-01 | TD-VALID-002 |
| AUTH-03, BR-07 | TS-024 | TC-024-02 | TD-INVALID-010 |
| AUTH-04, BR-08 | TS-024 | TC-024-03 | TD-VALID-003 |

## 19. Belirsizlikler / Eksik Test Verileri

| Konu | Eksiklik / belirsizlik | Etki | Sprint 13.4 notu |
|---|---|---|---|
| Online schedule create DTO | DB/entity online ders icin `classroom_id=NULL` desteklerken create/update DTO'da `classroomId` zorunlu gorulmustur | `TC-017-01` unit test seviyesinde hangi katmanin hedeflenecegi netlesmelidir | DTO validation veya servis/domain testi ayrimi yapilmali |
| Kat plani formatlari | SRS PNG/JPG/PDF der; implementasyonda base64/layout modelinde MIME kabul listesi net degildir | `TC-006-03` icin kesin expected result yok | Requirement netlesmeden sadece belirsizlik testi yazilmali |
| Farkli hafta | `WeeklySchedule` modelinde hafta/tarih boyutu yoktur | `TC-016-02` otomasyona dogrudan donusturulemez | Model degisikligi olmadan unsupported olarak isaretlenmeli |
| Serbest zaman araligi | Sistem ayrik `time_slot` karsilastirir | Kesisen saat araligi testleri slot gruplarina indirgenir | Yeni is kurali uretilmemeli |
| Baslamis ders iptali | "Baslamis" icin olculebilir dakika/saat esigi yok | `TC-021-03` expected result belirsiz | Product/SRS netlestirmesi gerekir |
| Anlik durum / yakinda bosalacak | "Yakinda" esigi tanimli degil | `TC-022-04` kesin sinir verisi uretilemez | Esik degeri tanimlanmali |
| Student / Assistant / HOD rolleri | Mevcut kod/SRS dogrulamasinda aktif rol karsiligi yok | Authorization test verisi uretilmedi | Rol eklenmeden test data uretilmemeli |

## 20. Sprint 13.4 Icin Hazir Girdiler

Sprint 13.4 unit testleri icin oncelikli hazir girdiler:

| Oncelik | Unit test hedefi | Hazir data |
|---|---|---|
| P0 | Auth valid/invalid credential davranisi | TD-VALID-001, TD-INVALID-001, TD-INVALID-002 |
| P0 | Role ve scope authorization | TD-VALID-002, TD-VALID-003, TD-INVALID-010, TD-INVALID-015 |
| P0 | Haftalik program cakisma servisleri | TD-COMBO-001..TD-COMBO-007, TD-VALID-013 |
| P0 | Online/fiziksel karar tablosu | TD-VALID-011, TD-VALID-012, TD-COMBO-008, TD-INVALID-011 |
| P1 | Kapasite uyarisi | TD-BOUNDARY-010, TD-BOUNDARY-011, TD-BOUNDARY-012, TD-SPECIAL-001 |
| P1 | Schedule exception sahiplik/duplicate/hafta sonu | TD-VALID-003, TD-INVALID-015, TD-SPECIAL-004, TD-SPECIAL-005; TD-SPECIAL-006 yalnizca belirsizlik girdisidir |
| P1 | Form validation boundary testleri | TD-BOUNDARY-001..TD-BOUNDARY-009, TD-INVALID-003, TD-INVALID-006, TD-INVALID-007, TD-INVALID-008, TD-SPECIAL-008 |
| P2 | Public filtre ve not-found davranisi | TD-VALID-004..TD-VALID-008, TD-INVALID-013; TD-SPECIAL-007 yalnizca belirsizlik girdisidir |

Ozet:

| Baslik | Sonuc |
|---|---|
| Toplam test data seti | 58 |
| Valid | 16 |
| Invalid | 14 |
| Boundary | 12 |
| Combination | 8 |
| Special | 8 |
| Sprint 12'den reuse edilen | 14 |
| Yeni tasarlanan | 44 |
| Requirement -> TC -> TD izlenebilirligi | Bolum 18'de saglandi |
| Eksik/belirsiz test verileri | Bolum 19'da listelendi |
