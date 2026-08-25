# DTS

## Derslik Takip Sistemi

DTS, üniversite içerisindeki fakülte, bölüm, derslik, akademisyen, ders ve haftalık ders programı süreçlerinin merkezi olarak yönetilmesi için geliştirilen web tabanlı bir derslik takip sistemidir. Sistem; rol bazlı erişim, derslik yerleşimi, ders programı oluşturma, çakışma kontrolleri ve public program görüntüleme akışlarını tek bir uygulama altında toplar.

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4.9-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.14-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## Proje Tanıtımı

Derslik Takip Sistemi, akademik birimlerin derslik kullanımını ve haftalık ders programlarını daha izlenebilir hale getirmeyi amaçlar. Süper admin kurum genelindeki fakülte, bölüm, kullanıcı, derslik, dönem ve ders yapılarını yönetebilir. Bölüm admini kendi bölüm kapsamındaki akademisyen, ders ve ders programı işlemlerini yürütür. Akademisyenler kendi derslerini, programlarını ve ders değişiklik kayıtlarını görüntüleyebilir.

Sistemin temel amacı; dersliklerin merkezi yönetimi, ders programlarının planlanması, akademisyen ve derslik çakışmalarının azaltılması, kapasite uygunluğunun kontrol edilmesi ve public program/derslik görüntüleme ekranlarıyla bilgiye erişimin kolaylaştırılmasıdır.

## Temel Özellikler

- JWT tabanlı giriş, refresh token ve şifre sıfırlama akışı
- Spring Security ile rol bazlı yetkilendirme
- Süper admin için kullanıcı, fakülte, bölüm, bina/kat, ders, dönem ve derslik yerleşimi yönetimi
- Bölüm admini için akademisyen, ders ve haftalık ders programı yönetimi
- Akademisyen için ders listesi, haftalık program ve ders değişiklikleri görüntüleme
- Derslik, bina, kat, kat krokisi ve slot yerleşimi yönetimi
- Haftalık ders programında derslik, akademisyen ve zorunlu ders sınıf seviyesi çakışma kontrolleri
- Derslik kapasitesi ile ders öğrenci sayısı karşılaştırması
- Akademik dönem yönetimi ve aktif dönem seçimi
- Bildirim ve profil yönetimi
- Public derslik keşfi, derslik programı, bölüm programı ve akademisyen programı görüntüleme
- React Router ile protected/public route ayrımı
- TailwindCSS ile responsive sayfa, tablo ve kart düzenleri

## Kullanıcı Rolleri

| Rol | Açıklama |
|---|---|
| `SUPER_ADMIN` | Sistem genelindeki fakülte, bölüm, kullanıcı, dönem, bina, kat, derslik ve ders yönetimi işlemlerini gerçekleştirir. |
| `DEPARTMENT_ADMIN` | Kendi bölüm kapsamındaki akademisyen, ders ve haftalık ders programı işlemlerini yönetir. |
| `ACADEMICIAN` | Kendisine atanmış dersleri, programını ve ders değişikliklerini görüntüler; akademisyen kapsamındaki program verilerine erişir. |
| Public | Giriş yapmadan derslikleri ve program görüntüleme ekranlarını read-only olarak kullanır. Backend rol enumunda ayrı bir rol değildir. |

## Kullanılan Teknolojiler

| Katman | Teknolojiler |
|---|---|
| Backend | Java 21, Spring Boot 3.3.5, Spring Web, Spring Data JPA, Spring Security, Spring Validation |
| Frontend | React 19.0.0, TypeScript 5.6.3, Vite 5.4.9, React Router DOM 6.27.0 |
| UI | TailwindCSS 3.4.14, Heroicons, Lucide React, React Hot Toast |
| State / Form | Zustand 5.0.0, TanStack React Query 5.59.16, React Hook Form 7.53.1, Zod 3.23.8 |
| Veritabanı | PostgreSQL 16, H2 test veritabanı |
| Authentication | JWT, JJWT 0.12.6, BCrypt |
| Migration | Flyway |
| API Dokümantasyonu | Springdoc OpenAPI 2.6.0, Swagger UI |
| DevOps | Docker, Docker Compose, Nginx frontend container |
| Test | Spring Boot Test, Spring Security Test, JUnit tabanlı backend unit/integration testleri |

## Mimari

Backend, Spring Boot üzerinde katmanlı mimariyle yapılandırılmıştır:

- `controller`: REST endpointleri ve request yönlendirme
- `service`: iş kuralları, yetki kapsamı, çakışma ve kapasite kontrolleri
- `repository`: Spring Data JPA veri erişimi
- `entity`: JPA entity ve enum modelleri
- `dto`: request/response veri transfer modelleri
- `mapper`: MapStruct tabanlı dönüşümler
- `security`: JWT filter, user details, security config ve access handler bileşenleri

Frontend, React ve TypeScript ile modüler bir yapı kullanır:

- `pages`: admin, department admin, academician, auth, public ve profile ekranları
- `components`: layout, ortak UI ve kat/slot editor bileşenleri
- `services`: Axios tabanlı API istemcileri
- `store`: auth ve header state yönetimi
- `router`: public/protected route tanımları ve rol bazlı yönlendirme
- `types`: frontend veri tipleri
- `styles`: global TailwindCSS stilleri

## Proje Yapısı

```text
DTS-Derslik-Takip-Sistemi/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/dts/dersliktakip/
│       │   │   ├── config/
│       │   │   ├── controller/
│       │   │   ├── dto/
│       │   │   ├── entity/
│       │   │   ├── exception/
│       │   │   ├── mapper/
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   └── service/
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       └── test/
│           ├── java/com/dts/dersliktakip/
│           └── resources/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── router/
│       ├── services/
│       ├── store/
│       ├── styles/
│       └── types/
├── docs/
│   ├── SPRINT_12_4_TEST_SCENARIOS.md
│   └── testing/
├── resimler/
├── docker-compose.yml
├── .env.example
├── SRS 2.md
└── README.md
```

## Kurulum

### Gereksinimler

- Java 21
- Maven
- Node.js ve npm
- Docker
- Docker Compose
- PostgreSQL 16 veya Docker üzerindeki PostgreSQL servisi

### Ortam Değişkenleri

Kök dizinde örnek ortam dosyası bulunur:

```bash
cp .env.example .env
```

Backend ve frontend için ayrı örnek dosyalar da mevcuttur:

- `backend/.env.example`
- `frontend/.env.example`

Temel değişkenler:

```env
POSTGRES_DB=dts_db
POSTGRES_USER=dts_user
POSTGRES_PASSWORD=dts_password
JWT_SECRET=change-this-production-secret-with-at-least-32-chars
JWT_EXPIRATION=60
JWT_REFRESH_EXPIRATION=10080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
VITE_API_URL=http://localhost:8080/api
```

### Docker ile Çalıştırma

Kök dizinde:

```bash
docker compose up --build
```

Docker servisleri:

| Servis | Container | Port |
|---|---|---|
| Frontend | `dts-frontend` | `http://localhost:5173` |
| Backend | `dts-backend` | `http://localhost:8080` |
| PostgreSQL | `dts-postgres` | `localhost:5432` |

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

PostgreSQL verisi `postgres_data` Docker volume içinde saklanır. Backend servisi PostgreSQL healthcheck sonucunu, frontend servisi ise backend healthcheck sonucunu bekleyecek şekilde tanımlanmıştır.

## Manuel Çalıştırma

PostgreSQL servisini Docker ile tek başına başlatmak için:

```bash
docker compose up postgres
```

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend geliştirme sunucusu Vite ile `0.0.0.0` hostunda çalışacak şekilde yapılandırılmıştır. API adresi için `VITE_API_URL` değeri kullanılmalıdır.

## Sistem Modülleri

| Modül | Açıklama |
|---|---|
| Kimlik Doğrulama | Giriş, token yenileme, mevcut kullanıcı bilgisi, şifre unutma ve şifre sıfırlama akışları. |
| Kullanıcı Yönetimi | Süper admin tarafından kullanıcı oluşturma, güncelleme, listeleme ve silme işlemleri. |
| Fakülte Yönetimi | Fakülte listeleme, detay, oluşturma, güncelleme ve silme işlemleri. |
| Bölüm Yönetimi | Bölüm listeleme, fakülteye göre filtreleme, detay ve yönetim işlemleri. |
| Bina / Kat Yönetimi | Fakülteye bağlı bina, binaya bağlı kat ve derslik ilişkilerinin yönetimi. |
| Kat Krokisi | Kat üzerindeki mekan nesneleri ve layout bilgilerinin kaydedilmesi. |
| Slot Yerleşimi | Derslik ve öğretim alanlarının slot tabanlı yerleşim düzeninin yönetimi. |
| Akademisyen Yönetimi | Bölüm admininin kendi bölümündeki akademisyen kayıtlarını yönetmesi. |
| Ders Yönetimi | Ders kodu, ad, akademisyen, dönem, kredi, AKTS, saat, sınıf ve öğrenci sayısı bilgilerinin yönetimi. |
| Akademik Dönem Yönetimi | Akademik dönem oluşturma, güncelleme, aktifleştirme ve silme işlemleri. |
| Ders Programı | Haftalık ders programı oluşturma, güncelleme, silme ve uygun derslik sorgulama. |
| Çakışma / Kapasite Kontrolü | Derslik, akademisyen, zorunlu ders sınıf seviyesi ve kapasite uygunluğu kontrolleri. |
| Ders Değişiklikleri | Akademisyen ders iptal, telafi ve ek ders kayıtları. |
| Bildirimler | Kullanıcı bildirimlerini listeleme, okunma durumu ve toplu okundu işaretleme. |
| Profil | Profil bilgileri ve şifre değiştirme işlemleri. |
| Public Görüntüleme | Derslik keşfi, derslik programı, bölüm programı ve akademisyen programı ekranları. |

## Kullanıcı Arayüzü

Frontend; rol bazlı dashboard, sol menü, üst bar, global arama, bildirim paneli, ortak tablo/kart bileşenleri ve public program ekranları üzerine kuruludur. TailwindCSS breakpointleri ile mobil ve masaüstü görünümler için farklı grid, tablo ve menü düzenleri kullanılır. Veri tablolarında masaüstü tablo görünümü, küçük ekranlarda kart bazlı görünüm desteklenir.

## Ekran Görüntüleri

### Giriş ve Hesap

| Giriş | Şifremi Unuttum | Profil |
|---|---|---|
| ![Giriş](resimler/giris_yap.png)<br>JWT tabanlı giriş ekranı. | ![Şifremi Unuttum](resimler/sifremi_unuttum.png)<br>Şifre sıfırlama isteği ekranı. | ![Profil](resimler/profil.png)<br>Profil ve şifre değiştirme ekranı. |

### Super Admin

| Ana Ekran | Kullanıcılar | Fakülte Yönetimi |
|---|---|---|
| ![Admin Ana Ekran](resimler/admin_anaekran.png)<br>Sistem geneli dashboard. | ![Admin Kullanıcılar](resimler/admin_kullanicilar.png)<br>Kullanıcı yönetimi ekranı. | ![Admin Fakülte Yönetimi](resimler/admin_fakulte_yonetimi.png)<br>Fakülte listeleme ve yönetim ekranı. |

| Bölüm Yönetimi | Dersler | Dönem Yönetimi |
|---|---|---|
| ![Admin Bölüm Yönetimi](resimler/admin_bolum_yonetimi.png)<br>Bölüm yönetimi ekranı. | ![Admin Dersler](resimler/admin_dersler.png)<br>Ders yönetimi ekranı. | ![Admin Dönem Yönetimi](resimler/admin_donem_yonetimi.png)<br>Akademik dönem yönetimi ekranı. |

| Bina Detayı | Kat Krokisi | Slot Yerleşimi |
|---|---|---|
| ![Admin Blok Detay](resimler/admin_blok_detay.png)<br>Bina ve kat detayları. | ![Admin Kat Krokisi](resimler/admin_korki_yerlesim.png)<br>Kat yerleşim düzenleme ekranı. | ![Admin Slot Yerleşimi](resimler/admin_slot_yerlesim.png)<br>Derslik slot yerleşimi ekranı. |

### Bölüm Admini

| Ana Ekran | Akademisyenler | Dersler |
|---|---|---|
| ![Bölüm Admini Ana Ekran](resimler/bolum_admini_anaekran.png)<br>Bölüm odaklı dashboard. | ![Bölüm Admini Akademisyenler](resimler/bolum_admini_akademisyenler.png)<br>Akademisyen yönetimi ekranı. | ![Bölüm Admini Dersler](resimler/bolum_admini_dersler.png)<br>Bölüm dersleri ekranı. |

| Ders Programı | Programa Ders Ekleme | Bölüm Programı |
|---|---|---|
| ![Bölüm Admini Ders Programı](resimler/bolum_admini_ders_programi.png)<br>Haftalık ders programı yönetimi. | ![Programa Ders Ekleme](resimler/bolum_admini_programa_ders_ekleme.png)<br>Programa ders ekleme akışı. | ![Bölüm Programı](resimler/bolum_programi.png)<br>Public bölüm programı görünümü. |

### Akademisyen

| Ana Ekran | Dersler | Ders Programı |
|---|---|---|
| ![Akademisyen Ana Ekran](resimler/akademisyen_ana_ekran.png)<br>Akademisyen dashboard ekranı. | ![Akademisyen Dersler](resimler/akademisyen_dersler.png)<br>Akademisyene atanmış dersler. | ![Akademisyen Ders Programı](resimler/akademisyen_ders_programi.png)<br>Akademisyen haftalık programı. |

| Ders Değişiklikleri |
|---|
| ![Akademisyen Ders Değişiklikleri](resimler/akademisyen_ders_değişikliklerim.png)<br>İptal, telafi ve ek ders kayıtları. |

### Derslik ve Program Görüntüleme

| Derslik Görüntüleme | Derslik Programı | Öğretim Görevlisi Programı |
|---|---|---|
| ![Derslik Görüntüleme](resimler/derslik_goruntuleme.png)<br>Public derslik keşfi. | ![Derslik Programı](resimler/derslik_programi.png)<br>Derslik bazlı program görüntüleme. | ![Öğretim Görevlisi Programı](resimler/ogretim_gorevlisi_programi.png)<br>Akademisyen bazlı public program görünümü. |

## Test ve Kalite

Backend tarafında Spring Boot Test, H2 ve Spring Security Test bağımlılıkları ile unit ve integration test sınıfları bulunmaktadır. `backend/src/test` altında servis testleri ve integration testleri yer alır.

Sprint 13 kapsamında gereksinim analizi, test case tasarımı, test data tasarımı, unit/integration test ayrımı, system test, workflow/exploratory test, non-functional test, UAT, automation/regression ve defect management dokümanları hazırlanmıştır. Final test raporuna göre test tasarım kapsamı oluşturulmuş; ancak Maven runner, Docker daemon, çalışan servis ve E2E/load araçları gibi ortam kısıtları nedeniyle geniş ölçekli execution tamamlanamamıştır.

Targeted komutlar:

```bash
cd backend
mvn test
```

```bash
cd frontend
npm run lint
npm run build
```

## Dokümantasyon

| Belge | Açıklama |
|---|---|
| `SRS 2.md` | Sistem gereksinimleri dokümanı. |
| `docs/SPRINT_12_4_TEST_SCENARIOS.md` | Sprint 12.4 test senaryoları. |
| `docs/testing/SPRINT_13_1_REQUIREMENT_ANALYSIS.md` | Sprint 13 gereksinim analizi. |
| `docs/testing/SPRINT_13_2_TEST_CASE_DESIGN.md` | Test case tasarımı. |
| `docs/testing/SPRINT_13_3_TEST_DATA.md` | Test verisi tasarımı. |
| `docs/testing/SPRINT_13_4_UNIT_TESTS.md` | Unit test dokümantasyonu. |
| `docs/testing/SPRINT_13_5_MOCKITO_BEHAVIOR_TESTS.md` | Mockito/behavior test dokümantasyonu. |
| `docs/testing/SPRINT_13_6_INTEGRATION_TESTS.md` | Integration test dokümantasyonu. |
| `docs/testing/SPRINT_13_7_SYSTEM_TESTS.md` | System test dokümantasyonu. |
| `docs/testing/SPRINT_13_8_STATE_WORKFLOW_EXPLORATORY.md` | State, workflow ve exploratory test dokümantasyonu. |
| `docs/testing/SPRINT_13_9_NON_FUNCTIONAL_TESTS.md` | Non-functional test dokümantasyonu. |
| `docs/testing/SPRINT_13_10_TEST_ENVIRONMENT.md` | Test ortamı dokümantasyonu. |
| `docs/testing/SPRINT_13_11_ACCEPTANCE_TESTS_UAT.md` | Acceptance/UAT dokümantasyonu. |
| `docs/testing/SPRINT_13_12_TEST_AUTOMATION_REGRESSION.md` | Automation ve regression dokümantasyonu. |
| `docs/testing/SPRINT_13_13_DEFECT_MANAGEMENT.md` | Defect management dokümantasyonu. |
| `docs/testing/SPRINT_13_14_TEST_MANAGEMENT_METRICS_REPORT.md` | Test management, metrikler ve final test raporu. |

Repository içinde ayrı bir ER diagram veya veri sözlüğü dosyası bulunmamaktadır.

## Gelecek Çalışmalar

- Maven wrapper veya standart Maven runner kullanımının netleştirilmesi
- Docker ortamının ve test execution sürecinin tekrarlanabilir hale getirilmesi
- Backend testlerinin düzenli çalıştırılıp raporlanması
- Frontend unit test ve E2E test altyapısının eklenmesi
- CI/CD pipeline ile build, test ve regression kontrollerinin otomatikleştirilmesi
- Performans, yük ve responsive testlerinin gerçek ortam üzerinde ölçülmesi
- SRS ile kod arasındaki rol kapsamı ve online/fiziksel ders iş kurallarının netleştirilmesi

## Lisans

Repository içinde bir `LICENSE` dosyası bulunmamaktadır. Bu proje akademik/staj çalışması kapsamında geliştirilmiştir.
