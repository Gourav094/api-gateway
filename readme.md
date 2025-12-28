## API Gateway

### What this service is
A single entry point that 
- recieve all client request 
- Forward to correct service
- Block bad traffic

Expectation:  Only valid, controlled traffic should ever reach backend services.

### Problem it solves
Without an API Gateway:
- Every service must handle auth, rate limiting, timeouts
- Clients(frontend) need to know service URLs
- One bad client can overload everything


### When to use

- Multiple backend services
- Public-facing APIs
- Need consistent traffic control

### Features
- Routing: Clients never interact directly with internal services.
- Request ID propagation: Every request is traceable end-to-end.
- Timeout handling: Prevents requests from hanging indefinitely.
- Standardized error responses Clients receive consistent error formats.
- Backend failure handling: Clean failures without crashing or leaking internals.
- Rate Limiting: Blocks abusive or excessive traffic before it reaches services.
- Request Validation: Rejects malformed or unsafe requests early to protect backends.
- Structured logging: Includes request IDs and service context.
- CORS: Configurable and disabled by default.


### Quick Setup
```
docker-compose up
curl localhost:8080/orders
```

Failure behavior

- Too many requests → 429
- Backend slow → 504
- Backend unavailable → 502
- Unknown route → 404

### Configuration

The API Gateway is fully configuration-driven via `config/gateway.config.js`.

### Adding a New Service
```
services: {
  inventory: {
    enabled: true,
    name: 'inventory',
    route: '/inventory',
    target: 'http://localhost:9000',
    timeout: 2000
  }
}
```

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