# Gemini Chatbot Nuxt 3

A full-stack AI chatbot application built with **Nuxt 3**, **Logto**, **Neon PostgreSQL**, **Prisma**, **Vercel AI SDK**, and **Google Gemini 2.5 Pro**. Users can authenticate via Logto, create new chat sessions, view conversation history, and interact with Gemini AI in real-time streaming mode.

## ✨ Features

- 🔐 **Secure Authentication** - OAuth/SSO using Logto with session management
- 💬 **Multi-Session Chat** - Create and manage multiple chat conversations
- 🤖 **AI Integration** - Streaming responses from Google Gemini 2.5 Pro via Vercel AI SDK
- 📊 **Persistent Storage** - Chat history stored in Neon PostgreSQL (serverless) via Prisma ORM
- 🎨 **Modern UI** - Responsive design with Tailwind CSS & Shadcn-Vue components
- 📄 **PDF Support** - Upload and analyze PDF documents within chat
- 🧪 **Comprehensive Testing** - Unit tests with Vitest and Vue Test Utils
- 🚀 **Auto Session Naming** - AI-powered automatic session title generation

## 🛠️ Tech Stack

### Frontend
- **Framework**: Nuxt 3 (Vue 3, TypeScript)
- **Styling**: Tailwind CSS, Radix Vue, Lucide Icons
- **State Management**: Vue Composables, VueUse

### Backend
- **Runtime**: Nitro (Nuxt server engine)
- **Authentication**: Logto OAuth
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Prisma
- **AI SDK**: Vercel AI SDK with Google Gemini 2.5 Pro

### Testing
- **Test Runner**: Vitest
- **Component Testing**: Vue Test Utils
- **DOM Simulation**: Happy DOM

### Deployment
- **Platform**: Netlify (edge functions)
- **CI/CD**: Git-based deployment

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** `>= 20.19.0` (specified in `package.json`)
- **npm** or **pnpm** package manager
- **PostgreSQL Database** - [Neon](https://neon.tech) account (serverless PostgreSQL)
- **Google Gemini API Key** - From [Google AI Studio](https://ai.google.dev/)
- **Logto Account** - From [Logto Cloud](https://logto.io/)
- **Git** for version control

## 🚀 Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd gemini-chatbot-nuxt-3

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<endpoint>/<database>?sslmode=require"

# Google Gemini API
GEMINI_API_KEY="your_gemini_api_key_here"

# Logto Authentication
LOGTO_ENDPOINT="https://<your-space>.logto.app"
LOGTO_APP_ID="your_logto_app_id"
LOGTO_APP_SECRET="your_logto_app_secret"
LOGTO_COOKIE_ENCRYPTION_KEY="generate_with_openssl_rand_hex_16"
LOGTO_BASE_URL="http://localhost:3000" # use netlify url for production

# Environment
NODE_ENV="development"  # Use "production" for Netlify deployment
```

**Generate Cookie Encryption Key:**
```bash
openssl rand -hex 16
```

### 3. Database Setup

Run Prisma migrations to set up your database schema:

```bash
# Push schema to database (development)
npx prisma db push

# Or use migrations (production/CI)
npx prisma migrate deploy
```

**Verify database connection:**
```bash
npx prisma studio
```

### 4. Logto Configuration

1. Create a **Web** application in your [Logto Dashboard](https://cloud.logto.io/)
2. Add redirect URIs:
   - Development: `http://localhost:3000/callback`
   - Production: `https://<your-netlify-site>.netlify.app/callback`
3. Add post-logout redirect URIs:
   - Development: `http://localhost:3000`
   - Production: `https://<your-netlify-site>.netlify.app`
4. Copy credentials to `.env` file

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and start chatting!

## 🧪 Testing

This project uses **Vitest** for unit and component testing with comprehensive test coverage.

### Test Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
├── components/
│   └── ModelSelector.test.ts          # Component tests
├── composables/
│   ├── use-chat-messages.test.ts      # Message composable tests
│   └── use-chat-sessions.test.ts      # Session composable tests
├── server/utils/
│   ├── auth.test.ts                   # Authentication utility tests
│   ├── message-transformer.test.ts    # Message transformation tests
│   └── session-title.test.ts          # Session title generation tests
└── tests/
    ├── setup.ts                        # Test configuration
    └── mocks/logto.ts                  # Logto mock utilities
```

### Coverage Report

After running `npm run test:coverage`, view detailed coverage at:
```bash
open coverage/index.html  # macOS/Linux
start coverage/index.html # Windows
```

## 📁 Project Structure

```
gemini-chatbot-nuxt-3/
├── app/                    # Nuxt app configuration
├── assets/                 # Static assets (CSS, images)
├── components/             # Vue components
│   ├── chat/              # Chat-specific components
│   └── ui/                # Reusable UI components
├── composables/           # Vue composables (state/logic)
├── lib/                   # Shared utilities
│   ├── logto/            # Logto configuration
│   └── prisma.ts         # Prisma client setup
├── middleware/            # Nuxt middleware (auth, etc.)
├── pages/                 # Nuxt pages (routes)
├── plugins/               # Nuxt plugins
├── prisma/                # Database schema and migrations
├── public/                # Public static files
├── server/                # Server API routes and utilities
│   ├── api/              # API endpoints
│   └── utils/            # Server utilities
├── tests/                 # Test configuration and mocks
├── .env.example           # Environment variables template
├── nuxt.config.ts         # Nuxt configuration
├── package.json           # Dependencies and scripts
├── prisma/schema.prisma   # Database schema
├── tailwind.config.js     # Tailwind CSS configuration
└── vitest.config.ts       # Vitest test configuration
```

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Generate static site
npm run generate

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## 🐛 Debugging

### Logto Authentication Debug Mode

Add `?debug` query parameter to authentication pages to enable debug mode:

- `/sign-in?debug` - View sign-in state
- `/callback/continue?debug` - View callback state

Debug mode disables auto-redirects so you can inspect the authentication flow step by step.

### Common Issues

| Issue | Solution |
|-------|----------|
| **Build fails** | Ensure `npm install` completes successfully and run `npx prisma generate` |
| **Login not working** | Verify Logto redirect URLs match your `LOGTO_BASE_URL` |
| **Chat not responding** | Check `GEMINI_API_KEY` is valid and has quota remaining |
| **Database connection error** | Verify `DATABASE_URL` includes `?sslmode=require` for Neon |
| **Tests failing** | Run `npm install` and ensure all dev dependencies are installed |

## 🚀 Production Build

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

## 🌐 Deployment

For detailed deployment instructions to **Netlify**, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

Quick deployment checklist:
- ✅ Set all environment variables in Netlify
- ✅ Configure Logto with production redirect URLs
- ✅ Set `NODE_ENV=production`
- ✅ Run database migrations
- ✅ Verify Gemini API key quota

## 📚 Additional Documentation

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Detailed Netlify deployment guide
- [`MODEL_SELECTION_FEATURE.md`](./MODEL_SELECTION_FEATURE.md) - AI model selection documentation
- [`PDF_UPLOAD_IMPLEMENTATION.md`](./PDF_UPLOAD_IMPLEMENTATION.md) - PDF upload feature guide
- [`ARCHITECTURE_IMPROVEMENTS.md`](./ARCHITECTURE_IMPROVEMENTS.md) - Architecture decisions
- [`REFACTORING_GUIDE.md`](./REFACTORING_GUIDE.md) - Code refactoring guidelines

## 🔒 Security Best Practices

- ❌ **Never** commit `.env` files to version control
- 🔄 Rotate API keys and secrets regularly
- 🔐 Use strong `LOGTO_COOKIE_ENCRYPTION_KEY` (32+ characters)
- 🌐 Enable HTTPS in production (`NODE_ENV=production`)
- 📊 Monitor API usage and set up alerts
- 🔒 Restrict database access to required IPs only (if possible)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Run tests (`npm test`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Nuxt 3](https://nuxt.com/) - The Intuitive Vue Framework
- [Logto](https://logto.io/) - Authentication solution
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Google Gemini](https://ai.google.dev/) - AI model
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI streaming utilities
- [Shadcn Vue](https://www.shadcn-vue.com/) - UI components
