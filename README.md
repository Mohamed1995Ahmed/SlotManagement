# Slot Management

A full-stack slot scheduling feature built with **ABP.io** (.NET 9 / C#) and **Angular 19**.

Admins configure a date range and slot duration, generate slots on the backend, then view the next available slots in any IANA time zone. All time handling uses **NodaTime** — slots are stored as time-zone-agnostic `Instant` values and converted to local time only when displayed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | ABP Framework 9.3.1 |
| Runtime | .NET 9 |
| Time library | NodaTime 3.2.2 |
| Database | SQLite (via EF Core 9) |
| Frontend | Angular 19 (standalone components) |
| API docs | Swagger / OpenAPI (Swashbuckle) |
| Testing | xUnit + Shouldly |

---

## Prerequisites

| Tool | Version |
|---|---|
| .NET SDK | 9.0 or later |
| Node.js | 18 or later |
| npm | 9 or later |

Check your versions:

```bash
dotnet --version
node --version
npm --version
```

---

## Project Structure

```
SlotManagement/
├── src/
│   ├── SlotBooking.Domain.Shared/      # Enums, constants (SlotStatus)
│   ├── SlotBooking.Domain/             # Slot entity, ISlotRepository, SlotGenerator
│   ├── SlotBooking.Application.Contracts/  # DTOs, ISlotsAppService
│   ├── SlotBooking.Application/        # SlotsAppService, SlotTimeFormatter
│   ├── SlotBooking.EntityFrameworkCore/ # DbContext, EF config, migrations, SlotRepository
│   ├── SlotBooking.HttpApi/            # SlotsController
│   ├── SlotBooking.HttpApi.Host/       # ASP.NET Core host (Program.cs, appsettings.json)
│   └── SlotBooking.DbMigrator/         # Standalone migration runner (console app)
├── test/
│   └── SlotBooking.Application.Tests/  # Unit tests (SlotGeneratorTests, SlotTimeFormatterTests)
├── angular/                            # Angular 19 SPA
└── SlotBooking.sln
```

---

## Backend Setup

### 1. Clone and restore

```bash
git clone <your-repo-url>
cd SlotManagement
dotnet restore SlotBooking.sln
```

### 2. Set up the database

**Option A — DbMigrator (recommended, standalone)**

```bash
dotnet run --project src/SlotBooking.DbMigrator
```

This creates `src/SlotBooking.HttpApi.Host/SlotBooking.db` and applies all migrations.

**Option B — EF Core CLI**

```bash
dotnet ef database update \
  --project src/SlotBooking.EntityFrameworkCore \
  --startup-project src/SlotBooking.HttpApi.Host
```

**Option C — automatic on startup**

The HTTP host also calls `MigrateAsync()` on startup, so running the host (step 3) is enough for development.

### 3. Run the backend

```bash
dotnet run --project src/SlotBooking.HttpApi.Host
```

The API starts at:
- **HTTPS** → `https://localhost:44300`
- **HTTP** → `http://localhost:44301`
- **Swagger UI** → `https://localhost:44300/swagger`

---

## Frontend Setup

```bash
cd angular
npm install
npm start
```

The Angular app runs at `http://localhost:4200` and calls `https://localhost:44300` (configured in `src/environments/environment.ts`).

> If your browser blocks the self-signed certificate, open `https://localhost:44300/swagger` once and accept the cert. The Angular app will then work.

---

## API Reference

### POST `/api/app/slots/generate`

Generate slots for a date range.

**Request body:**
```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-06-03",
  "timeZone": "Africa/Cairo",
  "slotDuration": 30
}
```

**Response:**
```json
{ "totalSlotsCreated": 144 }
```

---

### GET `/api/app/slots/next?timeZone=Africa/Cairo&count=20`

Fetch the next N available slots, times expressed in the requested time zone.

**Response:**
```json
[
  {
    "id": "...",
    "localStartTime": "2026-06-01T14:00:00+03:00",
    "localEndTime": "2026-06-01T14:30:00+03:00",
    "timeZone": "Africa/Cairo",
    "durationMinutes": 30,
    "isBookable": true
  }
]
```

---

### POST `/api/app/slots/{id}/book`

Mark a slot as booked. Returns 200 on success, 400 if already booked.

---

## NodaTime Design

The core requirement is **time-zone-agnostic storage with time-zone-aware display**.

| Concern | Approach |
|---|---|
| Storage | `Instant` (UTC ticks) converted to `DateTime UTC` by EF value converter |
| Generation | `LocalDate` → `ZonedDateTime` (midnight in requested zone) → `Instant` per slot boundary |
| Display | `Instant.InZone(requestedZone)` → `ZonedDateTime` → ISO-8601 offset string |
| Clock | `SystemClock.Instance.GetCurrentInstant()` for "is this slot in the future?" |

Key files:
- `src/SlotBooking.Domain/Slots/SlotGenerator.cs` — generation logic
- `src/SlotBooking.Application/Slots/SlotTimeFormatter.cs` — conversion helpers
- `src/SlotBooking.Application/Slots/SlotsAppService.cs` — orchestration
- `src/SlotBooking.EntityFrameworkCore/Slots/SlotEntityTypeConfiguration.cs` — EF value converters

---

## Unit Tests

```bash
dotnet test test/SlotBooking.Application.Tests
```

Tests cover:
- `SlotGeneratorTests` — single-day count (24 × 60-min), multi-day count (96 × 30-min), UTC independence across zones
- `SlotTimeFormatterTests` — correct UTC offset strings and local hours for Cairo / London / New York

---

## Supported Time Zones

The UI provides three IANA (TZDB) time zones. The backend accepts any valid TZDB identifier.

| Display | TZDB ID |
|---|---|
| Cairo | `Africa/Cairo` |
| New York | `America/New_York` |
| London | `Europe/London` |

---

## Assumptions and Notes

- Authentication is intentionally omitted — all endpoints are `[AllowAnonymous]`.
- SQLite is used for simplicity; swap to SQL Server/PostgreSQL by changing the EF provider and connection string.
- Duplicate slots are not prevented — generating the same range twice will insert additional rows.
- The `abp-source/` directory contains the ABP framework source checked out locally for reference. It is not part of the build.
- The migration class name `init` triggers a C# warning (`CS8981`); this is cosmetic and does not affect functionality.

---

## Bonus Features Implemented

- ✅ **Unit tests** for slot generation and time zone conversion
- ✅ **Book a slot** — `POST /api/app/slots/{id}/book` marks a slot as booked and removes it from "next available" results
- ✅ **DbMigrator** — standalone console app for applying EF Core migrations independently of the HTTP host
