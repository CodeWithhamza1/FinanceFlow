# FinanceFlow

A comprehensive personal finance management application built with Next.js and MySQL. FinanceFlow helps you track expenses, manage budgets, monitor income, and receive AI-powered financial recommendations.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Key Features Explained](#key-features-explained)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### Authentication & User Management
- Secure email/password authentication with JWT tokens
- Google OAuth 2.0 integration for seamless sign-in
- User profile management with avatar upload
- Multi-currency support with preference settings
- Session management and token refresh

### Expense Management
- Add, edit, and delete expenses with detailed categorization
- Custom expense categories with icon selection
- Date-based expense tracking
- Real-time expense aggregation and analytics
- Recent expenses display with quick actions

### Budget Tracking
- Set monthly budgets by category
- Visual budget progress indicators
- Budget vs actual spending comparison
- Over-budget alerts and notifications
- Category-wise budget management

### Income Management
- Track multiple income sources
- Monthly income aggregation
- Income history with date filtering
- Income vs expense balance calculation
- Support for recurring income entries

### AI-Powered Recommendations
- Intelligent budget recommendations based on spending patterns
- Comprehensive financial dashboard analysis
- Category-specific optimization suggestions
- Spending pattern insights from transaction history
- Budget alignment recommendations
- Investment advice for surplus funds
- Save and manage AI recommendations
- Markdown-formatted detailed reports

### Multi-Currency Support
- Support for multiple currencies (USD, PKR, EUR, GBP, JPY, etc.)
- Real-time currency conversion using ExchangeRate-API
- Smart currency caching to minimize API calls
- Currency conversion only on preference change
- Automatic formatting based on currency rules

### Analytics & Insights
- Spending breakdown by category with visual charts
- Pie charts for category distribution
- Budget progress tracking
- Income vs expense summary cards
- Real-time balance calculations
- Spending trend analysis

## Technology Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library
- **Recharts 2.15.1** - Charting library for data visualization
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MySQL 2** - Relational database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Axios** - HTTP client

### AI & Integrations
- **Genkit 1.20.0** - AI framework
- **Google Generative AI** - AI recommendations
- **ExchangeRate-API** - Currency conversion
- **Firebase** - Google OAuth integration

### Development Tools
- **Turbopack** - Fast bundler (Next.js built-in)
- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## System Architecture

### Database Schema

The application uses MySQL with the following main tables:

- **users** - User accounts and authentication
- **expenses** - Individual expense transactions
- **budgets** - Monthly budget limits by category
- **categories** - Custom expense categories
- **income** - Income entries and sources
- **ai_recommendations** - Saved AI-generated recommendations

All tables include proper foreign key relationships, indexes for performance, and cascading deletes for data integrity.

### Authentication Flow

1. User signs up/logs in via email or Google OAuth
2. JWT token is generated and stored in httpOnly cookies
3. All API requests include the token for authentication
4. Middleware validates tokens on protected routes
5. Token refresh mechanism for session management

### Data Flow

1. **Dashboard Load:**
   - Fetches expenses, budgets, income, and categories
   - Aggregates data for summary cards
   - Calculates balances and spending by category
   - Updates UI in real-time

2. **Expense Management:**
   - User adds/edits expense
   - API validates and stores in MySQL
   - Dashboard automatically refreshes
   - Charts and analytics update

3. **AI Recommendations:**
   - Collects comprehensive financial data
   - Calculates analytics (top categories, trends, budget vs actual)
   - Sends to Genkit AI flow
   - Formats and displays markdown response
   - Option to save recommendations

## Installation

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ database server
- Google Cloud account (for AI features - optional)
- Firebase project (for Google OAuth - optional)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd project
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Database Setup

Create the MySQL database and run the schema:

```bash
mysql -u root -p
CREATE DATABASE financeflow;
exit
mysql -u root -p financeflow < database/schema.sql
```

If you need to add the AI recommendations table:

```bash
mysql -u root -p financeflow < database/add_ai_recommendations_table.sql
```

### Step 4: Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=financeflow

# JWT Secret (generate a strong secret for production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google AI API Key (for AI recommendations)
GOOGLE_GENAI_API_KEY=your-google-ai-api-key
# Alternative: GEMINI_API_KEY=your-gemini-api-key

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:9002
```

### Step 5: Firebase Configuration (Optional)

If using Google OAuth, update `src/firebase/config.ts` with your Firebase credentials:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

### Step 6: Run the Application

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002)

## Configuration

### Currency Support

The application supports multiple currencies with automatic conversion:
- USD (US Dollar)
- PKR (Pakistani Rupee)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- And more via ExchangeRate-API

Currency conversion is cached for 24 hours to minimize API calls. Conversion only occurs when the user changes their currency preference in settings.

### AI Recommendations

To enable AI-powered recommendations:
1. Obtain a Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to `.env.local` as `GOOGLE_GENAI_API_KEY`
3. The AI will analyze your complete financial dashboard and provide personalized recommendations

## Database Setup

### Initial Schema

The main schema includes:
- User authentication and profile tables
- Expense and income tracking
- Budget management
- Category definitions

### Migration Scripts

- `database/schema.sql` - Main database schema
- `database/migrate_photo_url.sql` - Migration for profile picture support
- `database/add_ai_recommendations_table.sql` - AI recommendations storage

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "token": "jwt-token-string"
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### POST `/api/auth/google`
Authenticate via Google OAuth.

**Request Body:**
```json
{
  "idToken": "google-id-token"
}
```

### Expense Endpoints

#### GET `/api/expenses`
Get all expenses for the authenticated user.

**Query Parameters:**
- `limit` (optional) - Limit number of results

**Response:**
```json
{
  "expenses": [
    {
      "id": "1",
      "description": "Groceries",
      "amount": 150.00,
      "category": "Food",
      "date": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### POST `/api/expenses`
Create a new expense.

**Request Body:**
```json
{
  "description": "Groceries",
  "amount": 150.00,
  "category": "Food",
  "date": "2024-01-15T10:00:00.000Z"
}
```

#### POST `/api/expenses/update`
Update an existing expense.

**Request Body:**
```json
{
  "id": "1",
  "description": "Updated description",
  "amount": 200.00,
  "category": "Food",
  "date": "2024-01-15T10:00:00.000Z"
}
```

#### POST `/api/expenses/delete`
Delete an expense.

**Request Body:**
```json
{
  "id": "1"
}
```

### Budget Endpoints

#### GET `/api/budgets`
Get all budgets for the authenticated user.

#### POST `/api/budgets`
Set or update budgets.

**Request Body:**
```json
{
  "budgets": [
    {
      "category": "Food",
      "amount": 500.00
    },
    {
      "category": "Transport",
      "amount": 200.00
    }
  ]
}
```

### Category Endpoints

#### GET `/api/categories`
Get all categories for the authenticated user.

#### POST `/api/categories`
Create a new category.

**Request Body:**
```json
{
  "name": "Entertainment",
  "icon": "Film"
}
```

#### PUT `/api/categories/[id]`
Update a category.

#### DELETE `/api/categories/[id]`
Delete a category.

### Income Endpoints

#### GET `/api/income`
Get all income entries for the authenticated user.

**Query Parameters:**
- `month` (optional) - Filter by month (YYYY-MM format)

#### POST `/api/income`
Create a new income entry.

**Request Body:**
```json
{
  "amount": 5000.00,
  "description": "Salary",
  "date": "2024-01-01"
}
```

#### POST `/api/income/update`
Update an income entry.

#### POST `/api/income/delete`
Delete an income entry.

### Currency Conversion

#### GET `/api/currency/convert`
Convert currency amounts.

**Query Parameters:**
- `from` - Source currency code
- `to` - Target currency code
- `amount` - Amount to convert

**Response:**
```json
{
  "convertedAmount": 65000.00,
  "rate": 278.50,
  "from": "USD",
  "to": "PKR"
}
```

### User Profile

#### GET `/api/user`
Get current user profile.

#### PUT `/api/user`
Update user profile.

**Request Body:**
```json
{
  "displayName": "John Doe",
  "currency": "PKR"
}
```

#### POST `/api/user/avatar`
Upload user profile picture.

**Request:** Multipart form data with image file.

### AI Recommendations

#### GET `/api/ai-recommendations`
Get all saved AI recommendations.

#### POST `/api/ai-recommendations`
Save a new AI recommendation.

**Request Body:**
```json
{
  "title": "Monthly Budget Plan",
  "recommendation": "Markdown formatted recommendation...",
  "income": 5000.00,
  "savingsGoal": 1000.00,
  "expensesSummary": {}
}
```

#### DELETE `/api/ai-recommendations/[id]`
Delete a saved recommendation.

## Project Structure

```
project/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── expenses/          # Expense management
│   │   │   ├── budgets/           # Budget management
│   │   │   ├── categories/        # Category management
│   │   │   ├── income/            # Income management
│   │   │   ├── currency/          # Currency conversion
│   │   │   ├── user/              # User profile
│   │   │   └── ai-recommendations/# AI recommendations
│   │   ├── settings/              # Settings page
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Dashboard page
│   ├── components/
│   │   ├── auth/                  # Authentication components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── settings/              # Settings components
│   │   ├── layout/                # Layout components
│   │   └── ui/                    # Reusable UI components
│   ├── contexts/
│   │   └── auth-context.tsx       # Authentication context
│   ├── hooks/
│   │   ├── use-expenses.ts        # Expense data hook
│   │   ├── use-budgets.ts         # Budget data hook
│   │   ├── use-income.ts          # Income data hook
│   │   ├── use-categories.ts      # Category data hook
│   │   └── use-currency-amount.ts # Currency conversion hook
│   ├── lib/
│   │   ├── db.ts                  # MySQL connection
│   │   ├── auth.ts                # JWT utilities
│   │   ├── middleware.ts          # API authentication
│   │   ├── api.ts                 # Axios instance
│   │   ├── currency-utils.ts      # Currency utilities
│   │   └── types.ts               # TypeScript types
│   ├── ai/
│   │   ├── genkit.ts              # Genkit configuration
│   │   └── flows/
│   │       └── ai-powered-budget-recommendation.ts
│   └── firebase/                  # Firebase configuration
├── database/
│   ├── schema.sql                 # Main database schema
│   ├── migrate_photo_url.sql      # Profile picture migration
│   ├── add_ai_recommendations_table.sql
│   └── add_logs_table.sql         # Activity logs table
├── public/                        # Static assets
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

## Activity Logging System

FinanceFlow includes a comprehensive activity logging system that tracks all user actions for security, auditing, and debugging purposes.

### Features

- **Complete Activity Tracking**: Logs all user actions including:
  - Authentication (login, logout, signup, Google OAuth)
  - Expense management (create, update, delete)
  - Budget changes
  - Income management
  - Category management
  - Profile updates (name, currency, avatar)
  - AI recommendation generation and management
  - Page views (settings, logs, dashboard)

- **Detailed Metadata**: Each log entry includes:
  - Action type and description
  - Entity type and ID (if applicable)
  - Before/after values for updates
  - IP address and user agent
  - Timestamp
  - Additional metadata in JSON format

- **Beautiful Logs Page**: 
  - Accessible from Settings page
  - Date range filtering
  - Action type filtering
  - Infinite scroll for efficient loading
  - Responsive card-based layout
  - Expandable metadata details

- **Automatic Cleanup**: 
  - Logs older than 30 days are automatically deleted
  - Cleanup runs periodically (1% of log requests)
  - Manual cleanup endpoint available
  - Cron endpoint for scheduled cleanup

### Setting Up Automated Cleanup

For production, set up a daily cron job to clean up old logs:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourapp.com/api/logs/cron
```

Or add `CRON_SECRET` to your `.env.local`:
```env
CRON_SECRET=your-secret-token-for-cron
```

## Key Features Explained

### Real-Time Updates

The application implements automatic data refresh:
- Data hooks refresh every 60 seconds
- Immediate refetch after user actions (create, update, delete)
- Optimistic UI updates for better UX

### Currency Conversion Strategy

- All amounts stored in USD in the database
- Conversion happens at display time based on user preference
- Smart caching reduces API calls
- Currency conversion only triggers when preference changes
- Supports both whole number currencies (PKR, JPY) and decimal currencies

### AI Recommendation System

The AI recommendation system:
1. Collects comprehensive financial data (income, expenses, budgets, analytics)
2. Calculates spending patterns and trends
3. Compares budget vs actual spending
4. Analyzes recent transactions
5. Generates personalized recommendations with:
   - Immediate action items
   - Category-specific optimizations
   - Spending pattern insights
   - Budget alignment suggestions
   - Investment advice (if applicable)

### Security Features

- JWT-based authentication with secure token storage
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- CORS protection
- Input validation and sanitization
- Protected API routes with middleware

### Performance Optimizations

- Database indexes on frequently queried columns
- Connection pooling for MySQL
- Client-side caching for currency rates
- Memoized calculations for dashboard data
- Optimized React re-renders with useMemo and useCallback

## Development

### Available Scripts

```bash
# Start development server with Turbopack
npm run dev

# Start Genkit AI development server
npm run genkit:dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript type checking
npm run typecheck

# Run linter
npm run lint
```

### Development Workflow

1. Make changes to components or API routes
2. Changes auto-reload with Turbopack (fast refresh)
3. Test API endpoints using the dashboard or API client
4. Check TypeScript errors with `npm run typecheck`
5. Run linter before committing

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier (if configured) for formatting
- Component-based architecture
- Custom hooks for data fetching

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are set:
- Database credentials
- JWT secret (use a strong, random secret)
- Google AI API key
- Firebase configuration (if using OAuth)

### Database Considerations

- Use connection pooling in production
- Set up database backups
- Configure proper indexes
- Monitor query performance
- Use environment-specific database instances

### Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Implement input validation
- [ ] Use environment variables for secrets
- [ ] Regular security updates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure code passes linting

---

**Built with ❤️ using Next.js, MySQL**
