# TestPilot

TestPilot is a QA Engineer portfolio project I'm building to make software testing more organized and easier to manage. The idea is to create a single place where I can manage test cases, track their status, and eventually run tests and monitor results through a clean dashboard.

I built it using Next.js, TypeScript, Tailwind CSS, Prisma, SQLite, and Playwright. I'm developing it step by step, starting with the interface and test case management before connecting everything to the backend.

## Getting Started

First, clone the repository and navigate to the project folder:

```bash
git clone https://github.com/RishiSelam/TestPilot.git
cd TestPilot
```

Install the dependencies:

```bash
pnpm install
```

Create a `.env` file in the root directory and add:

```env
DATABASE_URL="file:./dev.db"
```

Set up the Prisma database and generate the Prisma client:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view TestPilot.

## What I've Built So Far

### 1. Dashboard

I created a dashboard with a sidebar, navigation, and light and dark themes. It provides an overview of the project and includes sample metrics and recent test run information. Some of the dashboard data is currently for demonstration purposes.

### 2. Test Case Management

I built a test cases page where I can:

- Create new test cases.
- Edit and delete existing test cases.
- Add a title, description, test steps, and expected results.
- Assign priorities such as Low, Medium, High, and Critical.
- Track statuses such as Draft, Ready, and Blocked.
- Search and filter test cases.

The current frontend stores test case data in the browser's `localStorage`, so changes persist in that browser. Connecting this interface to the backend database is part of my next phase.

### 3. Backend API and Database

I set up API routes using Next.js Route Handlers and connected them to an SQLite database through Prisma ORM.

The API currently supports:

- `GET /api/test-cases` to retrieve test cases.
- `POST /api/test-cases` to create a test case.
- `PATCH /api/test-cases/:id` to update a test case.
- `DELETE /api/test-cases/:id` to delete a test case.

I tested these operations locally against the database to verify that records could be created, retrieved, updated, and deleted.

**Current limitation:** The frontend is not yet connected to these API routes. The UI currently uses `localStorage`, while the API works with SQLite.

### 4. Automated Testing

I added Playwright smoke tests to check important parts of the application, including:

- Whether the dashboard loads correctly.
- Whether recent test run information is displayed.
- Whether the theme toggle works.

These tests help catch basic issues when making changes to the application.

To run the smoke tests, start the development server in one terminal, then run this command in another:

```bash
pnpm exec playwright test
```

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers
- **Database:** SQLite
- **ORM:** Prisma
- **Automated Testing:** Playwright
- **Package Manager:** pnpm

## How It Works

The project currently has three main parts:

1. **Frontend:** The dashboard and test case management interface, where users can interact with test cases.
2. **Backend:** API routes that handle creating, retrieving, updating, and deleting test cases.
3. **Database:** SQLite stores test case records, with Prisma handling database operations.

The frontend and backend are currently separate. My next step is to connect the UI to the API so that test cases can be managed through the database rather than browser storage.

## What's Next?

I'm continuing to develop TestPilot, with the following improvements planned:

- Connect the test case management interface to the backend API.
- Add proper loading states and error handling.
- Expand automated tests for the API and frontend.
- Implement test execution and test result tracking.
- Connect dashboard metrics to actual application data instead of sample values.

## Learn More

Here are some of the technologies I'm using to build this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Repository

You can find the source code here:

[TestPilot on GitHub](https://github.com/RishiSelam/TestPilot)
