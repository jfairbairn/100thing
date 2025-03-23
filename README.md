# 100 Things App

A productivity app inspired by Visakan Veerasamy's "Do 100 Things" approach. This app helps you break down your goals into smaller, manageable actions and track your progress towards completing 100 iterations of each action.

## Features

- Create projects to organize related actions
- Add actions with descriptions and target counts
- Track progress with quick increment buttons
- View statistics and progress for each action
- Modern, clean user interface

## Prerequisites

- Node.js 18 or later
- pnpm
- PostgreSQL
- Docker (optional, for running PostgreSQL)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/100thing.git
cd 100thing
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up the database:
   - Option 1: Using Docker (recommended)
   ```bash
   pnpm db:start
   ```
   
   - Option 2: Use your own PostgreSQL instance
   - Create a database named `100thing`
   - Update the `DATABASE_URL` in `.env` if needed

4. Initialize the database:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

The app will be available at http://localhost:5174

## Usage

1. Create a new project by entering a name and clicking "Create Project"
2. Click on a project to add actions to it
3. For each action, enter a title and description
4. Track progress by clicking the +1 or +5 buttons
5. Monitor your progress towards completing 100 iterations of each action

## Development

- `pnpm dev` - Start the development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview the production build
- `pnpm test` - Run tests
- `pnpm db:studio` - Open Drizzle Studio to manage the database

## License

MIT
