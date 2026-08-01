# QuickBite

A food delivery application: browse restaurants, order, and track the order through the kitchen
and out for delivery — with separate dashboards for customers, restaurant owners, delivery
partners and administrators.

```
QuickBite/
├─ food-delivery-backend/    Spring Boot 3.5.9 · Java 17 · MySQL 8 · Spring Security + JWT
├─ food-delivery-frontend/   React 18 · Vite 7 · Tailwind 3 · React Router 6 · axios
└─ docker-compose.yml        MySQL for local development
```

---

## Quick start

Assumes **JDK 17+**, **Node 18+** and a running **MySQL 8**. Three terminals:

```bash
# 1. Create the database (or let the backend create it — the JDBC URL has
#    createDatabaseIfNotExist=true, so this step is optional)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS food_delivery_db;"

# 2. Backend  →  http://localhost:8080
cd food-delivery-backend
DB_PASSWORD=your_mysql_password ./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run

# 3. Frontend →  http://localhost:5173
cd food-delivery-frontend
npm ci && npm run dev
```

On first boot the seeder inserts 32 restaurants, ~300 menu items, 36 accounts and 10 sample
orders. It is idempotent per record, so restarting never duplicates rows.

Open <http://localhost:5173> and sign in with any account from the table below.

### Optional: both servers from one terminal

```bash
npm install          # at the repository ROOT — installs `concurrently` only. Required.
npm run dev          # backend + frontend together, prefixed [api] / [web]
```

`npm install` at the root is a genuine prerequisite: without it `npm run dev` fails with
`'concurrently' is not recognized`. The backend script goes through `scripts/mvnw.mjs`, which
picks `mvnw.cmd` on Windows and `./mvnw` elsewhere.

### Optional: MySQL via Docker — untested

`docker-compose.yml` is provided for convenience and is **untested**: there is no Docker on the
machine this was developed on, so it has never actually been run. The YAML parses and the
service definition is structurally sound (image pinned, healthcheck, named volume, credentials
matching the backend defaults), but treat it as a starting point rather than a verified path.

```bash
docker compose up -d                                  # MySQL 8.4 on :3306
cd food-delivery-backend && DB_PASSWORD=quickbite ./mvnw spring-boot:run
```

## Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@quickbite.com` | `admin123` |
| Customer | `john@example.com` | `password` |
| Restaurant | `owner@quickbite.com` | `password` |
| Delivery | `delivery@quickbite.com` | `password` |
| Restaurants 2–32 | `owner2@quickbite.com` … `owner32@quickbite.com` | `password` |

`owner@quickbite.com` owns restaurant #1 (Nizam's Biryani House). `owner1@quickbite.com` also
exists but owns nothing — restaurant #1 is assigned to the documented demo login instead.

---

## Environment variables

### Backend — see `food-delivery-backend/.env.example`

| Variable | Default | Notes |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/food_delivery_db?createDatabaseIfNotExist=true` | JDBC URL |
| `DB_USERNAME` | `root` | |
| `DB_PASSWORD` | `root` | Use `quickbite` with docker-compose |
| `JWT_SECRET` | dev-only key | **Must be valid Base64** — decoded with `Decoders.BASE64`. Generate with `openssl rand -base64 64` |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24 h) |
| `SEED_ENABLED` | `true` | `false` starts with an empty catalogue |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated. No wildcards — the API sends credentials |

### Frontend — see `food-delivery-frontend/.env.example`

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Target of the Vite dev proxy for `/api/*` |

Only `VITE_`-prefixed variables reach the browser, and everything in that file is bundled into
the client — never put secrets there.

---

## Testing

```bash
# Backend — runs against in-memory H2, no database required
cd food-delivery-backend && ./mvnw verify

# Frontend
cd food-delivery-frontend && npm run lint && npm test && npm run build
```

A CI workflow is committed at `.github/workflows/ci.yml` and runs both suites on push and
pull request. Note it has **never executed** — it has not been pushed to a GitHub runner
yet, so it is unverified beyond the YAML parsing and the fact that the same commands pass
locally.

---

## API documentation

With the backend running:

- Swagger UI — <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON — <http://localhost:8080/v3/api-docs>

Use **Authorize** in Swagger UI to paste a bearer token from `POST /api/auth/signin`.

| Prefix | Purpose |
|---|---|
| `/api/auth` | Sign in / sign up, `me`, change password |
| `/api/restaurants` | Public catalogue, owner's own restaurant, edit, order feed |
| `/api/restaurants/{id}/menu` | Menu CRUD + availability toggle (owner or admin) |
| `/api/cart` | The signed-in customer's cart |
| `/api/orders` | Place orders, order history, kitchen-side status changes |
| `/api/users/me/addresses` | Saved delivery addresses |
| `/api/delivery` | Courier job board, assignments, earnings, profile |
| `/api/admin` | Users, restaurants, delivery partners, platform stats |

---

## Order lifecycle

```
PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED
                                                   ↘ CANCELLED
```

The legal transitions live in one place — the `EOrderStatus` enum — and both the restaurant and
delivery endpoints validate against it. Restaurants drive the states up to `READY_FOR_PICKUP`;
everything after that belongs to the assigned courier, who claims jobs from the delivery board.

---

## Features by role

**Customers** — browse and filter restaurants, cart, checkout with saved addresses, live order
tracking, order history, wishlist, profile and password management.

**Restaurant owners** — order feed with status controls, full menu CRUD including an
availability toggle, and editable restaurant details.

**Delivery partners** — job board of unclaimed orders, one-tap accept, status handover,
earnings for today and this week, vehicle/zone profile, online-offline switch.

**Administrators** — paged user directory with search and role filters, suspend or delete
accounts, create users of any role, approve or remove restaurants, delivery-partner roster,
and real platform statistics.

---

## Notes on the design

- **Authorisation is server-side.** The session in `localStorage` is a cache, not a source of
  truth: the app revalidates it against `GET /api/auth/me` on every load, and the API
  authorises every request independently. Editing the persisted role changes nothing.
- **Prices are server-side.** Orders are priced from current menu rows; any total the client
  sends is discarded, and an order may not span two restaurants.
- **`spring.jpa.open-in-view=false`.** Lazy associations are fetched explicitly with
  `@EntityGraph`. Note that Spring Data applies an entity graph as a *fetch* graph, so every
  association a response touches must be named — including ones that are EAGER by mapping.
- **Restaurants are hidden until approved.** `GET /api/restaurants` and the category filter
  return only approved restaurants, and an unapproved one 404s on the detail endpoint for
  everyone except its owner and admins (404 rather than 403, so the response does not
  confirm it exists). The admin console and `/api/restaurants/my` are unfiltered. Seeded
  demo restaurants ship approved; self-registered ones wait for an admin.
- **Images are local.** Everything under `public/images/` is committed; nothing is hotlinked.
  Cuisine tiles are generated by `scripts/generate-food-placeholders.mjs`.
