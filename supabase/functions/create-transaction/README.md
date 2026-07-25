# create-transaction Edge Function

Public API endpoint for creating `Transaction` rows via a Supabase Edge Function.

## Environment Variables

The function expects the following environment variables:

| Variable | Description |
|---|---|
| `API_KEY` | Shared secret for authenticating callers via the `x-api-key` header |
| `SUPABASE_URL` | URL of the Supabase project (auto-set when deployed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for bypassing RLS on inserts (auto-set when deployed) |

---

## Local Development

### Set the secret

Uncomment and populate the `[edge_runtime.secrets]` block in `supabase/config.toml`:

```toml
[edge_runtime.secrets]
API_KEY = "your-local-dev-key"
```

Then restart the local Supabase stack:

```bash
supabase stop && supabase start
```

### Serve the function

```bash
supabase functions serve create-transaction
```

The function will be available at:

```
http://127.0.0.1:54321/functions/v1/create-transaction
```

### Test locally

```bash
# Success (numeric transaction type)
curl -X POST http://127.0.0.1:54321/functions/v1/create-transaction \
  -H "x-api-key: your-local-dev-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"transactionTypeId":1,"description":"Test"}'

# Backfill (name-based type + historical createdAt + paymentMode)
curl -X POST http://127.0.0.1:54321/functions/v1/create-transaction \
  -H "x-api-key: your-local-dev-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"transactionTypeName":"Want","description":"Coffee","date":"2025-03-15T00:00:00.000Z","createdAt":"2025-03-15T00:00:00.000Z","paymentMode":"UPI"}'

# Auth failure (missing key)
curl -X POST http://127.0.0.1:54321/functions/v1/create-transaction \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"transactionTypeId":1,"description":"Test"}'

# Validation failure
curl -X POST http://127.0.0.1:54321/functions/v1/create-transaction \
  -H "x-api-key: your-local-dev-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":-50,"transactionTypeId":1,"description":"Test"}'
```

---

## Production Deployment

### Set the secret

```bash
supabase secrets set API_KEY=your-production-secret-key
```

### Deploy

```bash
supabase functions deploy create-transaction
```

The function will be available at:

```
https://<project-ref>.supabase.co/functions/v1/create-transaction
```

### Test in production

```bash
# Success (numeric transaction type)
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-transaction \
  -H "x-api-key: your-production-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"transactionTypeId":1,"description":"Test"}'

# Backfill (name-based type + historical createdAt + paymentMode)
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-transaction \
  -H "x-api-key: your-production-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"transactionTypeName":"Want","description":"Coffee","date":"2025-03-15T00:00:00.000Z","createdAt":"2025-03-15T00:00:00.000Z","paymentMode":"UPI"}'

# Auth failure (missing key)
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-transaction \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"transactionTypeId":1,"description":"Test"}'

# Validation failure
curl -X POST https://<project-ref>.supabase.co/functions/v1/create-transaction \
  -H "x-api-key: your-production-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"amount":-50,"transactionTypeId":1,"description":"Test"}'
```

---

## API Reference

### `POST /create-transaction`

Creates a new transaction with `source: "api"`.

#### Request Headers

| Header | Required | Description |
|---|---|---|
| `x-api-key` | Yes | Shared secret for authentication |
| `Content-Type` | Yes | Must be `application/json` |

#### Request Body

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | Yes | Positive number. Must be > 0. |
| `transactionTypeId` | number | Yes* | Positive integer. Must reference an existing `TransactionType`. |
| `transactionTypeName` | string | Yes* | Name of an existing `TransactionType` (e.g. `Need`, `Want`, `Investment`, `Income`). |
| `description` | string | Yes | Non-empty string describing the transaction. |
| `date` | string | No | ISO 8601 date string. Defaults to current UTC time if omitted. |
| `createdAt` | string | No | ISO 8601 date string. Sets `created_at` explicitly for backfills. Defaults to current UTC time if omitted. |
| `paymentMode` | string | No | Payment method (e.g. `UPI`, `Cash`, `Credit Card`). Stored in `payment_mode`. |

> **Note:** The `source` field is **not allowed** in the request body. Attempting to set it will result in a `400` error.
>
> `transactionTypeId` and `transactionTypeName` are mutually exclusive — provide exactly one of them.

#### Responses

**201 Created** — Transaction created successfully.

```json
{
  "id": 1,
  "amount": 500,
  "transactionTypeId": 1,
  "description": "Test",
  "date": "2026-07-20T14:30:00.000Z",
  "source": "api",
  "createdAt": "2026-07-20T14:30:05.000Z",
  "paymentMode": "UPI"
}
```

**400 Bad Request** — Validation error.

```json
{ "error": "Amount must be a positive number" }
```

**401 Unauthorized** — Missing or invalid API key.

```json
{ "error": "Unauthorized" }
```

**405 Method Not Allowed** — Request method is not `POST`.

```json
{ "error": "Method not allowed" }
```

---

## Notes

- Only `POST` requests are accepted. `OPTIONS` is handled for CORS preflight.
- The caller cannot provide a `source` field; it is always set to `"api"` internally.
- `date` is optional and defaults to the current UTC time when omitted.
- Database writes use the service role key, bypassing RLS. The API key gate is the only auth layer.
