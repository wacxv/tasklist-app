# TaskList Frontend

React 19 and Vite frontend for the TaskList application.

## Features

- Registration with username, email, password confirmation, and validation
- Login with username or email
- Protected Tasks route with JWT persistence
- Automatic redirect to login when the API returns `401 Unauthorized`
- Task creation, inline editing, completion toggling, and bulk deletion
- Descriptions, due dates, priorities, recurrence, and last-reset metadata
- Completed tasks sorted to the bottom
- Sorting by due date or date added
- Priority and recurrence filters
- Completed-task counter
- Responsive dark-themed layout
- Settings overlay with password changes and logout
- Profile-picture upload popup with drag-and-drop or Browse files
- Square profile-picture crop with zoom, mouse-wheel zoom, plus/minus controls, and pointer dragging

## Requirements

- Node.js 18 or newer
- Running TaskList API

## Configuration

Create or update `.env` in this folder:

```env
VITE_API_BASE_URL=http://localhost:5215
```

For phone testing, use the computer's LAN address instead:

```env
VITE_API_BASE_URL=http://192.168.68.106:5215
```

Restart Vite after changing `.env` because environment variables are loaded when the dev server starts.

## Run

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`. Vite is configured to expose the development server to the local network.

## Scripts

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run lint      # Run ESLint
```

## User Workflow

1. Register with a username, email, and strong password.
2. Log in using either the username or email.
3. Create tasks with descriptions, due dates, priorities, and recurrence.
4. Use filters and sorting to organize the task list.
5. Open Settings from the profile menu to change the password or upload a profile picture.
6. Click the profile avatar to open the upload dialog, choose or drop an image, then crop it in the square editor before confirming.

## Validation

```bash
npm run lint
npm run build
```

There is currently no automated frontend test script.