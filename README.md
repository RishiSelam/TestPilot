# TestPilot

**A QA testing workspace for managing test cases, executing test runs, testing APIs, and tracking defects.**

TestPilot is a full-stack QA portfolio project I built to bring common software testing workflows into one workspace. It combines test case management, test execution tracking, API testing, and defect management with a dashboard for monitoring testing activity.

## Live Demo

[Open TestPilot](https://test-pilot-amber.vercel.app)

## Screenshots

### Dashboard
![TestPilot Dashboard](public/screenshots/dashboard.png)

### Test Case Management
![Test Cases](public/screenshots/test-cases.png)

### Test Run Management
![Test Runs](public/screenshots/test-runs.png)

### API Testing
![API Testing](public/screenshots/api-testing.png)

### API Request Details
![API Testing Details](public/screenshots/api-testing-details.png)

### Defect Management
![Defects](public/screenshots/defects.png)

## Features

### Dashboard
- Overview of test cases, executions, pass rate, and open defects.
- Recent test run activity.
- Defect summary and quality indicators.
- Light and dark themes.

### Test Case Management
- Create, view, update, and delete test cases.
- Organise test cases by priority and status.
- Search and filter test cases.
- Persist test case records in the database.

### Test Run Management
- Create and track test runs.
- Record passed, failed, and skipped test cases.
- Monitor execution status and completion details.
- Associate defects with test runs.

### API Testing
- Send HTTP requests using common methods.
- Configure request URLs, headers, and request bodies.
- Inspect response status, headers, and response time.
- Save and manage API requests.
- Validate API request inputs.

### Defect Management
- Create, update, and delete defects.
- Track severity, priority, and status.
- Associate defects with test cases and test runs.
- Search and filter reported defects.

## Tech Stack

| Category | Technologies |
|---|---|
| Framework | Next.js 16 |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Neon PostgreSQL |
| ORM | Prisma 7 |
| API | Next.js Route Handlers |
| Testing | Playwright |
| Package Manager | pnpm |

## Architecture

TestPilot uses a Next.js application with separate frontend workspaces and API route handlers.

- **Frontend:** React components and Next.js pages provide the dashboard and testing modules.
- **API layer:** Route handlers manage CRUD operations and API request execution.
- **Database:** Prisma 7 provides database access to Neon PostgreSQL using the Prisma Neon adapter.
- **Testing:** Playwright covers key interface workflows, API validation, and data integrity scenarios.

## Database Models

The application uses Prisma models to manage:

- `TestCase` - Stores test case details, priority, and status.
- `TestRun` - Stores test execution information and results.
- `Defect` - Stores defect descriptions, severity, priority, and status.
- `ApiRequest` - Stores saved API request configurations.

## API Routes

| Endpoint | Purpose |
|---|---|
| `GET /api/test-cases` | Retrieve test cases |
| `POST /api/test-cases` | Create a test case |
| `/api/test-cases/:id` | Retrieve, update, or delete a test case |
| `/api/test-cases/test-runs` | Handle test case execution records |
| `/api/test-runs` | Manage test runs |
| `/api/defects` | Manage defects |
| `/api/defects/:id` | Retrieve, update, or delete a defect |
| `/api/api-requests` | Manage saved API requests |
| `/api/api-requests/:id` | Retrieve, update, or delete a saved request |
| `/api/api-testing/execute` | Execute an API request |

## Testing

The project includes **41 Playwright tests** across the following areas:

| Test Suite | Tests |
|---|---:|
| API Request Validation | 13 |
| API Testing Interface | 7 |
| Data Integrity | 3 |
| Defect Management | 5 |
| Dashboard | 3 |
| Test Cases | 4 |
| Test Runs | 6 |
| **Total** | **41** |

Run the test suite:

```bash
pnpm exec playwright test --workers=1
```

Some frontend workflows use mocked API responses. The test count therefore represents automated workflow and validation coverage, not 41 independent database integration tests.

## Getting Started

### Prerequisites

- Node.js
- pnpm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/RishiSelam/TestPilot.git
cd TestPilot
```

Install dependencies:

```bash
pnpm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
```

Apply database migrations and generate the Prisma client:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the application for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Check TypeScript types |
| `pnpm exec playwright test --workers=1` | Run Playwright tests |

## Project Structure

```text
TestPilot/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”œâ”€â”€ api-requests/
â”‚   â”‚   â”œâ”€â”€ api-testing/
â”‚   â”‚   â”œâ”€â”€ defects/
â”‚   â”‚   â”œâ”€â”€ test-cases/
â”‚   â”‚   â””â”€â”€ test-runs/
â”‚   â”œâ”€â”€ api-testing/
â”‚   â”œâ”€â”€ defects/
â”‚   â”œâ”€â”€ test-runs/
â”‚   â”œâ”€â”€ globals.css
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â””â”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/
â”‚   â”œâ”€â”€ api-testing-view.tsx
â”‚   â”œâ”€â”€ defects-view.tsx
â”‚   â””â”€â”€ test-cases-view.tsx
â”œâ”€â”€ lib/
â”œâ”€â”€ prisma/
â”œâ”€â”€ public/
â”‚   â””â”€â”€ screenshots/
â”œâ”€â”€ tests/
â”œâ”€â”€ .env.example
â”œâ”€â”€ package.json
â””â”€â”€ README.md
```

## Development Status

The core TestPilot workflows are implemented, including test case management, test runs, API testing, and defect tracking.

Potential future improvements include:

- More comprehensive database integration and edge-case tests.
- User authentication and workspace management.
- CI integration and automated test reporting.

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Repository

[GitHub - RishiSelam/TestPilot](https://github.com/RishiSelam/TestPilot)