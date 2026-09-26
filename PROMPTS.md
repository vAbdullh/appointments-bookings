# Prompts Log

## 1. Analyze and Understanding
(OpenAI GPT-6 Astra)

### Prompt

```text
Analyze the attached task description. Briefly list requirements, main goals and challenges, success criteria, expected system architecture, broken into microservices with short description of each microservice


Keep it direct and technical. Do not start implementation yet.
```

---

## 2. Init Docker and Environment
(Antigravity (Gemini 3.1 Pro) )

### Prompt

```text
Init docker compose with those seriveces:
- backend: TypeScript + NestJS, Prisma, Socket.IO, and Swagger.
- db: PostgreSQL with a persistent volume and health check. plz use the existing image locally
Setup Dockerfile, compose file, .env and .env.example file, prisma

create getting started in readme with project title "appointment-booking"
```

## 3. Database design 
(OpenAI GPT-6 Astra)

### Prompt

```text
Now create well stractured database schema in sql with make sure of rules and well indexing, make sure to  use unique combined where it need to prevent the duplicate booknig
``` 
## 4. Slots & booking endpoints 
(Antigravity ( Claude Sonnet 4.6) )

### Prompt 
```text
Implement these two endpoints:
1. GET /slots: Return available slots, sorted by startsAt, then id.
2. POST /bookings: Validate and trim inputs, create bookings, and handle concurrent conflicts with 409.

in the existing NestJS project using the existing Prisma schema.

Use a clean NestJS structure:
- SlotsModule, SlotsController, and SlotsService.
- BookingsModule, BookingsController, and BookingsService.
- DTOs for request validation and a shared Prisma service.
- Keep controllers thin and business logic in services. NestJS controller decorators handle routing; separate Express router files are unnecessary.
1. GET /slots
   - Return only slots without an active booking.
   - Sort by startsAt ascending, then id ascending.
   - Response: { "slots": [...] }, including only id, startsAt, and endsAt.
2. POST /bookings
   - Require slotId, customerName, and customerEmail.
   - Trim name and email before validation and saving.
   - Validate UUID, nonempty name, and valid email.
   - Let the database generate the booking UUID.
   - Return 201 with { "booking": { "id", "slotId", "customerName", "customerEmail", "status" } }.
   - Return 400 VALIDATION_ERROR for invalid input, including malformed JSON.
   - Return 404 SLOT_NOT_FOUND for a nonexistent slot.
   - Return 409 SLOT_UNAVAILABLE when the slot already has an active booking.
   - Enforce one active booking per slot using a database partial unique index. Do not rely only on checking availability before inserting.
   - Two concurrent valid requests for the same slot must return one 201 and one 409.
Use this error format:
{ "error": { "code": "...", "message": "..." } }
Return unexpected errors as 500 INTERNAL_ERROR without exposing database details.
```

## 5. Swagger and docs
(Antigravity (Gemini 3.1 Pro) )

### Prompt

```text
Add Swagger documentation to the existing NestJS backend at `/docs`, with the OpenAPI specification at `/openapi.json`.

Document the three existing endpoints, including inputs, required fields, validation, response shapes, all status/error codes, and examples. Explain that repeated cancellation returns the same cancelled booking and that authentication is not required.

Match the current implementation and task requirements. Keep changes minimal; do not refactor unrelated code.
```

## 6. Integration tests
(Antigravity (Gemini 3.1 Pro) )
### prompt
```text
Add integration tests using Jest + Supertest and a separate real PostgreSQL test database. Do not mock Prisma or the database.

Test these scenarios:
- Booking returns 201 and hides the slot from GET /slots.
- Two concurrent requests for the same slot return one 201 and one 409, with exactly one active booking in the database.
- Cancellation returns 200, restores availability, and allows rebooking.
- Repeated cancellation returns the same cancelled booking without affecting a newer booking for that slot.

Use the app’s existing validation and error handling. Apply Prisma migrations to the test database and reset test data between tests. Make sure cleanup cannot run against the development database.

Add an `npm run test:e2e` command and simple setup instructions in the README. Run the tests and fix any failures. Keep changes minimal and follow the existing project structure.
```

## 7. Review and verification
(Antigravity (Gemini 3.1 Pro) )

### Prompt

```text
Review the existing project against the original task requirements. Inspect the code and run the tests. Do not change code yet.

Check:
- GET /slots returns only available slots, ordered by startsAt, then id.
- POST /bookings trims and validates input and returns the correct responses and error codes.
- The database prevents multiple active bookings per slot, including concurrent requests.
- Cancellation preserves booking history, restores availability, and is safe to repeat without affecting newer bookings.
- JSON responses, UUIDs, UTC dates, and error formats match the specification.
- Socket.IO events match the required payloads, emit only after commit, and never expose customer details or repeat on unchanged cancellations.
- /docs and /openapi.json accurately document all endpoints, validation, responses, examples, and error codes.
- Integration tests use real PostgreSQL and verify booking, overlapping requests, cancellation, and rebooking.
- Migrations, seed, test setup, and documented startup commands work.
- README includes setup, Socket.IO testing, design decisions, actual time spent, unfinished work, and AI disclosure.
- Delivery includes source, package lockfile, Prisma schema, migrations, seed, tests, README, and .env.example. The ZIP excludes secrets, actual .env files, and node_modules.

Return a concise checklist marked PASS, FAIL, or NOT VERIFIED. For each issue, give the file location and the smallest recommended fix. Clearly distinguish tests you ran from code you only inspected. Do not suggest extra features outside the task.
```