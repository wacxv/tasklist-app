# TaskList Development Notes

## Overview

TaskList is a React/Vite frontend backed by an ASP.NET Core .NET 9 API and PostgreSQL. The API owns authentication, task persistence, recurrence resets, and profile-picture storage.

## Local Ports

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5215`
- Swagger: `http://localhost:5215/swagger`
- PostgreSQL: `localhost:5432`

## Start the Application

Terminal 1:

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run --launch-profile http
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

For phone access, set `frontend/.env` to the computer's LAN API address and open the Vite LAN URL from a phone on the same network.

## Current Feature Checklist

### Authentication

- Registration requires username, email, password, and confirmation.
- Passwords must be 8–128 characters and include uppercase, lowercase, digit, and special characters.
- Login accepts username or email through the `identifier` field.
- JWT tokens last 60 minutes by default.
- Protected frontend requests redirect to login after a `401` response.

### Tasks

- Create, edit, complete, and delete tasks.
- Select and bulk-delete tasks in Edit Tasks mode.
- Store title, description, priority, recurrence, due date, completion state, and timestamps.
- Completed tasks appear after incomplete tasks.
- Sort by due date or date added.
- Filter by priority and recurrence.
- Display completed count and due-date status.

### Recurrence

- Daily tasks reset after one day.
- Weekly tasks reset after seven days.
- Monthly tasks reset after one calendar month.
- Reset processing runs when tasks are fetched and only reopens completed tasks.
- `LastResetAt` records the most recent reset.
- Occasional and Additional are currently informational recurrence values and do not reset automatically.

### Profile Settings

- Profile picture upload supports drag-and-drop and file browsing.
- The upload flow opens a full-screen centered dialog, followed by a square crop dialog.
- Crop supports pointer dragging, mouse-wheel zoom, a zoom slider, and plus/minus buttons.
- Password changes include a Cancel path that returns to Settings.

## Manual Smoke Test

1. Register a user with a valid password.
2. Confirm duplicate email and username validation.
3. Log in with both username and email.
4. Create tasks using each priority and recurrence option.
5. Edit a task and verify description, due date, priority, and recurrence persist.
6. Complete a recurring task, move its `LastResetAt` into the past in PostgreSQL, refresh, and verify it reopens.
7. Verify completed tasks sort below incomplete tasks.
8. Test filters, sorting, completed count, and bulk deletion.
9. Upload a profile image, drag/drop or browse, crop it square, zoom, drag it, and confirm.
10. Change the password and test Cancel.
11. Log out and confirm `/tasks` redirects to login.

To simulate an elapsed daily recurrence:

```sql
UPDATE "Tasks"
SET "LastResetAt" = NOW() - INTERVAL '2 days',
    "IsDone" = TRUE
WHERE "Id" = YOUR_TASK_ID;
```

## Validation Commands

```bash
cd backend
dotnet build

cd ../frontend
npm run lint
npm run build
```

There is currently no automated test project.