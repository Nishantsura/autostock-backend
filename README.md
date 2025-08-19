# Autostock AI — Backend

Enterprise-ready backend API for inventory management using TypeScript, Express, Prisma (Postgres), Zod, JWT, and Jest.

## 🚀 Quick Deploy

### Docker (Recommended for Production)
```bash
# Clone and configure
git clone <your-repo>
cd autostock-backend
cp .env.example .env
# Edit .env with your production values

# Deploy with Docker
npm run docker:build
npm run docker:run

# View logs
npm run docker:logs
```

### Manual Deployment
```bash
# Environment setup
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET (minimum 32 characters)

# Install and build
npm ci --only=production
npm run deploy:build

# Database setup
npm run deploy:migrate
npm run prisma:seed

# Start production server
npm start
```

## 🛠️ Development Setup

1) **Prerequisites**: Node 18+, PostgreSQL, npm
2) **Install dependencies**:
```bash
npm install
```
3) **Configure environment**:
```bash
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
```
4) **Database setup**:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```
5) **Start dev server**:
```bash
npm run dev
```

## 📋 Production Checklist

✅ **Security**: Rate limiting, CORS, security headers, input validation  
✅ **Monitoring**: Health checks, structured logging, error handling  
✅ **Database**: Prisma migrations, connection pooling, transactions  
✅ **Testing**: Integration tests for critical flows  
✅ **Deployment**: Docker support, deployment scripts  
✅ **Documentation**: OpenAPI specs available at `/api/docs`  

## 🔍 API Documentation

- **Health Check**: `GET /health` - Basic health status
- **Readiness**: `GET /ready` - Database connectivity check  
- **Detailed Health**: `GET /health/detailed` - Comprehensive system status
- **API Docs**: `GET /api/docs` - OpenAPI documentation
- **Authentication**: `POST /api/v1/auth/token` - JWT token generation (dev)

## 🌍 Environment Variables

### Required (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Minimum 32-character secret for JWT signing

### Optional
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGINS` - Comma-separated allowed origins
- `RATE_LIMIT_MAX` - Requests per window (default: 100)
- External API keys for AI features (OpenAI, Pinecone)
- S3 configuration for file storage
- CAPTCHA settings for public endpoints

## 🏗️ Architecture

See `.cursorrules` for detailed folder structure and development guidelines.

**Key Features:**
- JWT-based authentication with role-based access
- Comprehensive inventory management (SKUs, stock, locations)
- Purchase order workflow with receiving
- Audit logging for all stock movements
- Rate limiting and security headers
- Structured logging with correlation IDs
- Docker containerization ready
