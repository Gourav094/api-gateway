### Design decisions (example)

- Rate limiting at gateway instead of services
    → avoids duplication

- Timeout enforced at gateway
    → prevents resource exhaustion

- Simple path-based routing
    → easy to reason about

### Trade-offs

- Gateway is a single point of failure
- Adds extra network hop

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
            └──────┬─────────┬────────┘
                   │         │
        ┌──────────▼───┐ ┌──▼──────────┐
        │ Order Service│ │ Payment Svc │
        └──────────────┘ └─────────────┘

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
