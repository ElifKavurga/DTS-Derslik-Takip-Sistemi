# DTS - Derslik Takip Sistemi

DTS, derslik takip süreçleri için geliştirilecek full-stack web uygulamasıdır. Sprint 0.3 kapsamı yalnızca geliştirme ortamı altyapısını hazırlar; business logic, entity ve controller geliştirmesi içermez.

## Gereksinimler

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker
- Docker Compose

## Docker ile Calistirma

Kök dizinde:

```bash
docker compose up --build
```

Servisler:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- PostgreSQL: `localhost:5432`

Docker servisleri aynı `dts-network` bridge network üzerinde çalışır. `backend`, `postgres` servisinin healthcheck sonucunu bekler. `frontend`, `backend` servisinin sağlıklı hale gelmesini bekler.

## Manuel Calistirma

PostgreSQL'i Docker ile tek başına başlatmak için:

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

## Veritabani

Geliştirme ortamı için varsayılan PostgreSQL bilgileri:

- Database: `dts_db`
- User: `dts_user`
- Password: `dts_password`
- Encoding: `UTF8`

PostgreSQL verisi `postgres_data` Docker volume içinde saklanır.

## Ortam Degiskenleri

Kök ortam değişkenleri için:

```bash
cp .env.example .env
```

Backend için örnek değişkenler [backend/.env.example](backend/.env.example) dosyasında yer alır:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/dts_db
DATABASE_USERNAME=dts_user
DATABASE_PASSWORD=dts_password
JWT_SECRET=change-this-development-secret-with-at-least-32-chars
JWT_EXPIRATION=60
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend için örnek değişkenler [frontend/.env.example](frontend/.env.example) dosyasında yer alır:

```env
VITE_API_URL=http://localhost:8080/api
```

## Flyway Migration

Migration dosyaları:

```text
backend/src/main/resources/db/migration
```

İlk migration dosyası:

```text
V1__init.sql
```

Uygulama açılırken Flyway otomatik çalışır. Gelecek migration dosyaları `V{number}__description.sql` formatıyla aynı klasöre eklenmelidir.

Sprint 0.4 ile auth altyapısı için `users` tablosu ve ilk `SUPER_ADMIN` kullanıcısı migration üzerinden eklenir.

Varsayılan geliştirme kullanıcısı:

```text
Email: admin@dts.local
Password: Admin123*
Role: SUPER_ADMIN
```

Şifre veritabanında BCrypt hash olarak tutulur.

## Authentication

Backend endpointleri:

```text
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
```

`/api/auth/login` ve `/api/auth/refresh` public endpointlerdir. `/api/auth/me` ve diğer endpointler JWT Bearer token gerektirir.

Frontend auth akışı:

- Login formu React Hook Form ve Zod validation kullanır.
- Access token ve refresh token Zustand auth store içinde session storage ile korunur.
- Axios request interceptor `Authorization: Bearer <token>` header değerini ekler.
- Axios response interceptor `401` durumunda session bilgisini temizler.
- Dashboard protected route arkasındadır.

## Proje Yapisi

```text
backend/
  src/main/java/com/dts/dersliktakip/
    config/
    controller/
    dto/
    entity/
    exception/
    mapper/
    repository/
    security/
    service/
    util/
  src/main/resources/
    application.yml
    application-dev.yml
    application-test.yml
    db/migration/

frontend/
  src/
    assets/
    components/
    features/
    hooks/
    layouts/
    pages/
    router/
    services/
    store/
    styles/
    types/
    utils/
```

## Dogrulama

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
mvn test
```
