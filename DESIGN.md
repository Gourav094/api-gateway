# API Gateway – Design Notes

## Key Design Goals
- Centralized request routing
- Configuration-driven behavior
- Minimal coupling with downstream services
- Easy extensibility

## Request Flow
1. Client sends request to Gateway
2. Gateway assigns Request ID
3. Rate limiting middleware executes
4. Route configuration is matched
5. Request forwarded to downstream service
6. Response normalized and returned

## Trade-offs
- Express chosen for simplicity over performance
- No persistence layer to keep gateway stateless
- Config-based routing instead of dynamic discovery

## Limitations
- No authentication yet
- No service discovery
- No circuit breaker

### Architecture Design 
                ┌──────────────┐
                │   Client     │
                └──────┬───────┘
                       │ HTTP Request
                       ▼
            ┌─────────────────────────┐
            │        API GATEWAY      │
            │─────────────────────────│
            │ 1. Request ID           │
            │ 2. Basic Validation     │
            │ 3. Rate Limiting        │
            │ 4. Routing              │
            │ 5. Timeout              │
            │ 6. Error Mapping        │
            └──────┬────────────┬─────┘
                   │            │
        ┌──────────▼───┐  ┌─────▼───────┐
        │ Order Service│  │ Payment Svc │
        └──────────────┘  └─────────────┘

### Inside API Gateway
```
        Incoming Request
            ↓
    [Request ID Middleware]
            ↓
    [Validation Middleware]
            ↓
        [Rate Limiter]
            ↓
         [Router]
            ↓
       [Reverse Proxy]
            ↓
      [Timeout Handler]
            ↓
     Response Normalizer
```
