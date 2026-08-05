# DTS - Derslik Takip Sistemi

DTS, dersliklerin takibi için geliştirilecek modern bir full-stack web uygulamasıdır. Bu sprintte business logic eklenmemiştir; amaç profesyonel, genişletilebilir ve çalıştırılabilir proje iskeletini hazırlamaktır.

## Kullanılan Teknolojiler

Backend:

- Java 21
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway
- JWT Authentication
- Maven
- Docker
- Lombok
- MapStruct
- Jakarta Validation
- OpenAPI / Swagger

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- TanStack Query
- Zustand
- React Hook Form
- Zod
- React Hot Toast
- Heroicons
- ESLint
- Prettier

## Proje Yapısı

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
    types/
    utils/
```

## Kurulum Adımları

Ön gereksinimler:

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker ve Docker Compose

Ortam değişkenleri için örnek dosyayı kullanabilirsiniz:

```bash
cp .env.example .env
```

## Docker ile Çalıştırma

Kök dizinde:

```bash
docker compose up --build
```

Servisler:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Swagger: `http://localhost:8080/swagger-ui.html`

## Backend Çalıştırma

PostgreSQL çalışır durumdayken:

```bash
cd backend
mvn spring-boot:run
```

Backend varsayılan olarak `http://localhost:8080` adresinde çalışır.

## Frontend Çalıştırma

```bash
cd frontend
npm install
npm run dev
```

Frontend varsayılan olarak `http://localhost:5173` adresinde çalışır.

## Doğrulama

Backend:

```bash
cd backend
mvn test
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```
