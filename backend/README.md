# TaskList API

ASP.NET Core .NET 9 Web API for the TaskList application. The API uses Entity Framework Core with PostgreSQL and JWT Bearer authentication.

## Features

- User registration and login with username or email
- Password validation and password changes
- JWT authentication and User/Admin authorization
- User-owned task CRUD
- Task descriptions, priorities, due dates, recurrence, and completion state
- Automatic Daily, Weekly, and Monthly recurrence resets when tasks are fetched
- Profile-picture upload and retrieval
- Task image upload, retrieval, and deletion
- EF Core migrations and Development Swagger

## Requirements

- .NET SDK 9
- PostgreSQL

## Configuration

Edit `appsettings.json` for the local PostgreSQL connection and JWT settings:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=localhost;Username=postgres;Password=yourpassword"
  }
}
```

Replace the sample database password and JWT secret for real deployments.

## Run

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run --launch-profile http
```

The HTTP profile listens on `http://localhost:5215`. Swagger is available at `http://localhost:5215/swagger` in Development.

For phone testing, the launch profile binds to `0.0.0.0:5215`, so the API can be reached through the computer's LAN address, such as `http://192.168.68.106:5215`.

## Main Routes

All routes below except registration and login require an `Authorization: Bearer <token>` header.

### Users

```text
POST   /users/register
POST   /users/login
GET    /users/{id}
PUT    /users/{id}/password
GET    /users/{id}/profile-picture
PUT    /users/{id}/profile-picture
GET    /users                 Admin only
DELETE /users/{id}            Admin only
```

Login accepts an `identifier` containing either a username or email:

```json
{
  "identifier": "user@example.com",
  "password": "Test123!"
}
```

### Tasks

```text
GET    /tasks
GET    /tasks/{id}
POST   /tasks
PUT    /tasks/{id}
DELETE /tasks/{id}
POST   /tasks/{id}/images
GET    /tasks/{id}/images/{imageId}
DELETE /tasks/{id}/images/{imageId}
```

Task create/update payloads support:

```json
{
  "title": "Prepare presentation",
  "description": "Review the final slides",
  "priority": "High",
  "recurrence": "Weekly",
  "lastResetAt": null,
  "isDone": false,
  "dueDate": "2026-09-30T12:00:00Z",
  "userId": 1
}
```

`userId` is required when creating a task and must match the authenticated user. Updates enforce ownership as well.

## Recurrence Behavior

Completed tasks with these recurrence values reset when a task list or task detail is requested:

- `Daily`: after one day
- `Weekly`: after seven days
- `Monthly`: after one calendar month

The task is reopened and `LastResetAt` is updated. `None`, `Occasional`, and `Additional` do not currently reset automatically.

## Database Migrations

After changing the EF model:

```bash
dotnet ef migrations add MigrationName
dotnet ef database update
```

The repository includes migrations for users, roles, timestamps, usernames, profile pictures, due dates, task images, and task metadata.

## Validation

```bash
dotnet build
dotnet ef database update
```