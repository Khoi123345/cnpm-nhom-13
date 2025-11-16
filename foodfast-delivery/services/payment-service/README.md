# Payment Service (microservice)

This is a minimal Spring Boot payment microservice used for the CNPM project demo. It provides simple in-memory payment processing and demonstrates role-based access for three roles:

- ROLE_ADMIN
- ROLE_RESTAURANT_ADMIN
- ROLE_USER

Authentication (demo):
- This lightweight demo uses request headers to simulate authentication. Send headers:
  - `X-User-Id`: numeric user id as string (e.g. `"1"`)
  - `X-User-Role`: comma separated roles, e.g. `ROLE_USER` or `ROLE_ADMIN` or `ROLE_RESTAURANT_ADMIN`

Example curl (create payment as user 1):

```bash
curl -v -X POST "http://localhost:8085/api/payments/process?amount=12.5&currency=USD" \
  -H "X-User-Id: 1" -H "X-User-Role: ROLE_USER"
```

Admin list all payments:

```bash
curl -v "http://localhost:8085/api/payments/admin/all" -H "X-User-Id: 999" -H "X-User-Role: ROLE_ADMIN"
```

Notes:
- This is intentionally minimal and uses an in-memory store for fast testing. Replace with JPA/repository and proper authentication (JWT/OAuth2) for production.

Momo integration:
- To enable Momo (test) set the following properties in `application.properties` or environment:
  - `momo.endpoint` - Momo create payment endpoint (test/default provided)
  - `momo.partnerCode`, `momo.accessKey`, `momo.secretKey` - credentials
  - `momo.returnUrl`, `momo.notifyUrl` - return/notify callbacks

Endpoints provided:
- POST /api/payments/momo/create?amount=12.5&currency=USD  (auth required) — create a pending payment and call Momo; returns Momo response
- POST /api/payments/momo/notify  (public) — Momo asynchronous notification endpoint to update payment status

Note: The Momo client implementation here is simplified for demo and computes a HMAC-SHA256 signature. For production follow Momo's official integration docs and secure keys.

Database (PostgreSQL):
- The service now persists payments to PostgreSQL. Set these environment variables or override in `application.properties`:
  - `PAYMENT_DB_URL` (default: jdbc:postgresql://localhost:5432/payment_service)
  - `PAYMENT_DB_USERNAME` (default: postgres)
  - `PAYMENT_DB_PASSWORD` (default: postgres)

  Service-to-service calls:
  - The payment service exposes an internal endpoint `/api/payments/internal/create` for other services to create a pending payment.
  - Protect it by `X-Service-Token` header; set the token via `payment.internal.token` property or `PAYMENT_INTERNAL_TOKEN` env var.

Quick run (local):

```bash
# start Postgres (example using Docker)
docker run --name payment-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=payment_service -p 5432:5432 -d postgres:15

# then run the service
mvn -f services/payment-service/pom.xml spring-boot:run
```

Notes:
- For dockerized deployments, set the DB env vars accordingly and mount secrets for momo keys.
