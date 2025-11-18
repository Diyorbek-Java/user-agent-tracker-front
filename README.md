# Employee Monitoring System - Angular Frontend

A modern Angular 18 application for the Employee Monitoring System with authentication, dashboard, and activity tracking features.

## Features

- **Authentication System**
  - Login with email/password
  - OTP-based first-time login
  - Token-based authentication

- **Dashboard**
  - Real-time productivity statistics
  - Session tracking visualization
  - Top applications usage
  - 7-day productivity trend chart
  - Activity timeline

- **Responsive Design**
  - Mobile-friendly interface
  - Modern UI with smooth animations
  - Professional color scheme

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v18 or higher)

## Installation

1. **Install dependencies:**
   ```bash
   cd employee-monitoring-front
   npm install
   ```

2. **Install Angular CLI globally (if not already installed):**
   ```bash
   npm install -g @angular/cli
   ```

## Configuration

The app is pre-configured to connect to the Django backend at `http://127.0.0.1:8000`.

If you need to change the backend URL:
- Edit `proxy.conf.json` to update the target URL

## Running the Application

### Development Server

Start the development server with proxy to Django backend:

```bash
npm start
```

Or using Angular CLI:

```bash
ng serve
```

The application will be available at `http://localhost:4200`

### Production Build

Build the application for production:

```bash
npm run build:prod
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
employee-monitoring-front/
├── src/
│   ├── app/
│   │   ├── core/                  # Core functionality
│   │   │   ├── guards/           # Route guards
│   │   │   ├── interceptors/     # HTTP interceptors
│   │   │   ├── models/           # TypeScript interfaces
│   │   │   └── services/         # API services
│   │   ├── features/             # Feature modules
│   │   │   ├── auth/             # Authentication
│   │   │   │   └── login/        # Login component
│   │   │   └── dashboard/        # Dashboard
│   │   ├── shared/               # Shared components
│   │   ├── app.component.ts      # Root component
│   │   ├── app.config.ts         # App configuration
│   │   └── app.routes.ts         # Routing configuration
│   ├── assets/                   # Static assets
│   ├── environments/             # Environment configs
│   ├── index.html                # Main HTML
│   ├── main.ts                   # Bootstrap file
│   └── styles.css                # Global styles
├── angular.json                  # Angular CLI config
├── package.json                  # Dependencies
├── proxy.conf.json              # Proxy configuration
└── tsconfig.json                # TypeScript config
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests

## API Endpoints Used

The frontend connects to these Django API endpoints:

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/set-password/` - Set password (OTP)
- `GET /api/auth/current-user/` - Get current user

### Dashboard
- `GET /api/frontend/dashboard/` - Dashboard statistics
- `GET /api/frontend/sessions/` - User sessions
- `GET /api/frontend/activities/` - User activities
- `GET /api/frontend/timeline/` - Activity timeline
- `GET /api/frontend/productivity/` - Productivity report
- `GET /api/frontend/profile/` - User profile
- `PUT /api/frontend/profile/update/` - Update profile

## Integration with Django

1. **Start Django backend first:**
   ```bash
   cd employee-monitoring-backend
   python manage.py runserver
   ```

2. **Then start Angular frontend:**
   ```bash
   cd employee-monitoring-front
   npm start
   ```

3. **Access the application:**
   - Frontend: `http://localhost:4200`
   - Backend API: `http://127.0.0.1:8000`
   - API Docs: `http://127.0.0.1:8000/api/docs/`

## Default Login

Use the credentials created in Django admin or invited users:
- Email: Your registered email
- Password: Your password or OTP (for first-time login)

## Development Notes

- The app uses standalone components (Angular 18 feature)
- HTTP interceptor automatically adds authentication token
- Auth guard protects dashboard routes
- Proxy configuration handles CORS in development

## Troubleshooting

### CORS Issues
- Make sure Django `CORS_ALLOW_ALL_ORIGINS` is enabled in development
- Verify proxy configuration in `proxy.conf.json`

### Authentication Issues
- Check if Django backend is running
- Verify token is stored in localStorage
- Check browser console for errors

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Update Angular CLI: `npm install -g @angular/cli@latest`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is part of the Employee Monitoring System.
