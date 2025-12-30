## API Versioning Support

The gateway supports versioned APIs through the `basePath` configuration:
```javascript
services: {
  auth: {
    route: '/auth',
    basePath: '/api/v1',  // Routes become /auth/api/v1/*
    target: 'http://localhost:4001'
  }
}
```

---
# API Gateway

A lightweight, configurable API Gateway built with Node.js and Express. It provides centralized routing, request forwarding, rate limiting, timeouts, and error handling for microservices-based architectures.



## ✨ Features

- Routing: Clients never interact directly with internal services.
- Request ID propagation: Every request is traceable end-to-end.
- Timeout handling: Prevents requests from hanging indefinitely.
- Standardized error responses Clients receive consistent error formats.
- Backend failure handling: Clean failures without crashing or leaking internals.
- Rate Limiting: Blocks abusive or excessive traffic before it reaches services.
- Request Validation: Rejects malformed or unsafe requests early to protect backends.
- Structured logging: Includes request IDs and service context.
- CORS: Configurable and disabled by default.
- Versioned services: Add your services with version support


## 🧠 Why This Project Exists

In a microservices architecture, exposing each service directly to clients
leads to duplicated concerns like authentication, rate limiting, logging,
and error handling.

This API Gateway acts as a **single entry point** that:
- Simplifies client interaction
- Protects backend services
- Centralizes cross-cutting concerns



## 🏗 Architecture Overview

Client → API Gateway → Downstream Services

The gateway reads routing rules from configuration and forwards incoming
requests to the appropriate service while enforcing policies like rate limits
and timeouts.



## 📁 Project Structure
```
api-gateway/
│
├── src/
│ ├── config/ # Route and service configuration
│ ├── middleware/ # Rate limit, timeout, request-id, error handlers
│ ├── routes/ # Gateway routing logic
│ ├── utils/ # Helper utilities
│ ├── app.js # Express app initialization
│ └── server.js # Server bootstrap
│
├── tests/ # Unit & integration tests
├── Dockerfile
├── package.json
└── README.md
```

---

## ⚙️ Configuration
The API Gateway is fully configuration-driven via `config/gateway.config.js`.

### Route Configuration Example

```
{
  "path": "/users",
  "method": "GET",
  "target": "http://localhost:4001",
  "timeout": 5000,
  "rateLimit": {
    "windowMs": 60000,
    "max": 100
  }
}
```

## 🚀 Getting Started

## Installation

```
git clone https://github.com/Gourav094/api-gateway.git
cd api-gateway
npm install
```
### Run Locally
```
npm start
Gateway will start on: `http://localhost:3000`
```


### 🔁 Example Request
```
curl http://localhost:3000/orders
The gateway forwards the request to: http://localhost:8000/
```
### 🧪 Running Tests
```
npm test
```
### 🐳 Docker Support
```
docker build -t api-gateway .
docker run -p 3000:3000 api-gateway
```

### Failure behavior

- Too many requests → 429
- Backend slow → 504
- Backend unavailable → 502
- Unknown route → 404

### Future Enhancements
- JWT / OAuth2 authentication
- Plugin system for middleware
- Metrics & tracing (Prometheus, OpenTelemetry)
- Circuit breaker & retries
- API versioning

