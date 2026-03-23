# Contributing to StudyPro

## Development Setup

### Prerequisites
- Node.js 20+
- Docker (optional)
- PostgreSQL 15+ (or use Docker)

### Quick Start

```bash
# Clone
git clone https://github.com/studypro/studypro.git
cd studypro

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start database and redis
docker-compose up -d db redis

# Run migrations
npm run migrate

# Start development server
npm run dev:api
```

## Project Structure

```
studypro/
├── src/                    # API backend
│   ├── api/               # Routes, controllers, middleware
│   ├── lib/               # Core libraries
│   │   ├── engines/      # Business logic engines
│   │   └── db/           # Database client
│   └── services/         # Service layer
├── mobile/                # Expo mobile app
├── web/                   # Next.js web app
├── infra/                 # Infrastructure
│   ├── docker/
│   ├── terraform/
│   └── k8s/
├── tests/                 # Test files
└── scripts/              # Utility scripts
```

## Coding Standards

### TypeScript
- Strict mode enabled
- Use explicit types
- No `any` without reason

### Naming
- PascalCase for types/interfaces/classes
- camelCase for variables/functions
- kebab-case for files

### Commits
Follow Conventional Commits:
```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
chore: update dependencies
```

## Testing

### Writing Tests
- Use Arrange-Act-Assert pattern
- Mock external dependencies
- Test edge cases
- Keep tests focused

### Running Tests
```bash
npm test
npm run test:watch
npm run test:coverage
```

## Pull Request Process

1. Fork and create branch
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation if needed
5. Request review