# VTEX Day 2026 Event Platform

A modern event management platform built with NestJS, React, and React Native for the VTEX Day 2026 conference.

## 🏗️ Architecture

This is a monorepo structured project containing:

```
vtexday26/
├── apps/
│   ├── api/          # NestJS backend API
│   ├── web/          # React web application (placeholder)
│   ├── mobile/       # React Native mobile app (placeholder)
│   └── admin/        # React admin dashboard (placeholder)
├── packages/
│   ├── shared/       # Shared TypeScript types and utilities
│   └── ui/           # Shared UI components (placeholder)
└── infrastructure/
    └── docker/       # Docker configuration files
```

## 🚀 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for local MongoDB and Redis)
- MongoDB Atlas account (for production)

## 🛠️ Technology Stack

- **Backend**: NestJS 10.0+, TypeScript 5.0+
- **Database**: MongoDB 6.0+ with Mongoose
- **Cache**: Redis 7.0+
- **Authentication**: JWT with Passport.js
- **Testing**: Jest 29+, Supertest
- **Code Quality**: ESLint, Prettier, Husky

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd vtexday26
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start local databases with Docker**
```bash
npm run docker:up
```

5. **Build shared packages**
```bash
npm run build:shared
```

## 🏃‍♂️ Development

### Start the API server
```bash
npm run dev
# or
npm run dev:api
```

The API will be available at `http://localhost:3000`

### Run all services (when implemented)
```bash
npm run dev:all
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

## 🎨 Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format
```

## 📝 API Documentation

The API follows RESTful principles and is organized into the following modules:

### Authentication (`/api/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get current user profile

### Users (`/api/users`)
- `GET /users` - List all users (Admin/Producer only)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin only)

### Sessions (`/api/sessions`)
- `GET /sessions` - List all sessions (public)
- `GET /sessions/:id` - Get session by ID (public)
- `POST /sessions` - Create session (Admin/Producer)
- `PATCH /sessions/:id` - Update session (Admin/Producer)
- `DELETE /sessions/:id` - Delete session (Admin only)

### Speakers (`/api/speakers`)
- `GET /speakers` - List all speakers (public)
- `GET /speakers/highlights` - Get highlight speakers (public)
- `GET /speakers/:id` - Get speaker by ID (public)
- `POST /speakers` - Create speaker (Admin/Producer)
- `PATCH /speakers/:id` - Update speaker (Admin/Producer)
- `DELETE /speakers/:id` - Delete speaker (Admin only)

### Sponsors (`/api/sponsors`)
- `GET /sponsors` - List all sponsors (public)
- `GET /sponsors/:id` - Get sponsor by ID (public)
- `POST /sponsors` - Create sponsor (Admin only)
- `PATCH /sponsors/:id` - Update sponsor (Admin only)
- `DELETE /sponsors/:id` - Delete sponsor (Admin only)

### Notifications (`/api/notifications`)
- `POST /notifications/broadcast` - Send broadcast notification (Admin/Producer)
- `POST /notifications/session-reminder` - Send session reminder (Admin/Producer)

## 🔐 User Roles

- **SUPER_ADMIN**: Full system access
- **PRODUCER**: Event management access
- **SPONSOR**: Sponsor-specific features
- **PARTICIPANT**: Basic attendee access

## 🗄️ Database Configuration

### Local Development
Uses Docker Compose to run MongoDB and Redis locally:
```bash
# Start databases
npm run docker:up

# View logs
npm run docker:logs

# Stop databases
npm run docker:down
```

### Production
Configure MongoDB Atlas connection string in your `.env` file:
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vtexday26?retryWrites=true&w=majority
```

## 🚢 Deployment

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm run start:prod
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT in your `.env` file
   - Or kill the process using the port

2. **MongoDB connection failed**
   - Ensure Docker is running: `docker ps`
   - Check MongoDB container: `npm run docker:logs`
   - Verify connection string in `.env`

3. **Dependencies installation issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## 📄 License

Private - VTEX Day 2026

## 👥 Team

Development team for VTEX Day 2026 event platform.

---

For more information, check the documentation in the `docs/` directory.