# API Specification

## REST API Specification

The API follows RESTful principles with the following key endpoints:

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Refresh access token
- `POST /auth/validate-ticket` - Validate event ticket

### Sessions/Agenda
- `GET /sessions` - Get all sessions with filters
- `GET /sessions/:id` - Get session details
- `POST /sessions/:id/favorite` - Add to favorites (auth required)
- `DELETE /sessions/:id/favorite` - Remove from favorites (auth required)

### Speakers
- `GET /speakers` - Get all speakers
- `GET /speakers/:id` - Get speaker details

### Sponsors
- `GET /sponsors` - Get sponsors grouped by tier
- `GET /sponsors/:id` - Get sponsor details
- `POST /sponsors/:id/message` - Send message to sponsor (auth required)

### FAQ
- `GET /faq/categories` - Get FAQ categories
- `GET /faq` - Get FAQs with optional filters

### User Profile
- `GET /users/me` - Get current user profile (auth required)
- `PATCH /users/me` - Update profile (auth required)
- `GET /users/me/agenda` - Get favorited sessions (auth required)

### Admin Endpoints
- Full CRUD operations for all entities
- Push notification management
- Content visibility control
- Analytics and reporting
