# appointment-booking

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

### Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

### Running the Application
Start the services using Docker Compose:
```bash
docker-compose up -d --build
```

The services will be available at:
- **Backend (NestJS API)**: http://localhost:3000
- **Swagger API Docs**: http://localhost:3000/api
- **Database (PostgreSQL)**: localhost:5432

### Features
- **Backend:** TypeScript, NestJS, Prisma, Socket.IO, and Swagger
- **Database:** PostgreSQL with a persistent volume and health check
