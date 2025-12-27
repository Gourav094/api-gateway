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
- Routing - Clients should not know internal service structure.
- Rate Limiting - Stops abuse before it reaches services.
- Timeout 
- Validate JWT / API key and pass user context.
- Request Validation - Reject bad requests early → save backend resources.
- Request/Response Transformation - Convert client JSON → internal format.
- Observability Hooks - Request ID, logging, metrics.

### Quick Setup
```
docker-compose up
curl localhost:8080/orders
```

Failure behavior

- Too many requests → 429
- Backend slow → 504
- Unknown route → 404

