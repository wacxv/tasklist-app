# TaskList

TaskList is a full-stack task management application built with a React frontend and a .NET 9 Web API. It includes JWT authentication, PostgreSQL persistence, task organization tools, recurring tasks, and profile settings.

## Features

- User registration with username, email, password confirmation, and validation
- Login with either username or email
- JWT-protected task management
- Create, edit, complete, and bulk-delete tasks
- Task descriptions, due dates, priorities, and recurrence options
- Sorting, priority/recurrence filters, and completed-task counts
- Automatic Daily, Weekly, and Monthly task resets
- Responsive dark-themed interface
- Profile-picture upload with drag-and-drop, square cropping, zoom, and drag positioning
- Password changes and logout
- Profile and task image API support

## Stack

### Backend

- .NET 9 ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT Bearer authentication
- Swagger in Development

### Frontend

- React 19
- Vite 7
- React Router 7
- Axios
- Custom CSS

## Project Structure

```text
backend/     .NET API, EF Core models, controllers, and migrations
frontend/    React/Vite application
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- .NET SDK 9
- PostgreSQL

### Backend

Update the PostgreSQL connection string and JWT settings in `backend/appsettings.json`, then run:

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run --launch-profile http
```

The API listens on `http://localhost:5215`. Swagger is available at `http://localhost:5215/swagger` in Development.

### Frontend

Set the API address in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5215
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### Phone Testing

To open the application on a phone connected to the same network:

1. Set `VITE_API_BASE_URL` to the computer's LAN address, for example `http://192.168.68.106:5215`.
2. Start the backend and frontend.
3. Open `http://192.168.68.106:5173` on the phone.

The computer firewall must allow the frontend and API ports.

## Validation

```bash
cd backend
dotnet build

cd ../frontend
npm run lint
npm run build
```

There is currently no automated test project. Recurrence resets, task CRUD, authentication, profile cropping, and password changes should be manually smoke-tested.