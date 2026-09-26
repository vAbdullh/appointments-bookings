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

g