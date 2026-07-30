# Contributing to Super Townhouse

Thank you for your interest in contributing!

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Hotel-Super-Townhouse.git`
3. Install dependencies: `npm install`
4. Copy environment variables: `cp .env.example .env.local`
5. Fill in your Supabase and Razorpay credentials
6. Start development: `npm run dev`

## Code Standards

### TypeScript
- Strict mode enabled
- No implicit `any` in application code (Supabase client abstraction is exempt)
- All public functions must have types

### ESLint
- Run `npm run lint` before committing
- Auto-fix with `npm run lint:fix`
- Zero warnings policy for application code

### Git Commits
Follow Conventional Commits:
```
feat: add new booking feature
fix: resolve payment webhook issue
docs: update README
refactor: improve service layer types
test: add unit tests for pricingService
chore: update dependencies
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run all checks: `npm run type-check && npm run lint && npm run build`
4. Commit with a descriptive message
5. Push and open a Pull Request
6. Fill out the PR template

## Architecture Decisions

Please read [ARCHITECTURE.md](ARCHITECTURE.md) before making structural changes.

For database changes, add a new migration file — never modify existing migrations.

## Questions?

Open a GitHub Discussion or email dev@supertownhouse.com.
