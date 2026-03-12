# Implementation Plan: Production-Ready Codebase Refactor

## Goal

Transform the GDGoist ATS Leaderboard from its current semi-refactored state (audit score: 3.1/10) into a production-ready codebase with proper separation of concerns, security hardening, testing, and deployment infrastructure. **All phases preserve existing behavior — zero functional changes.**

---

## User Review Required

> [!IMPORTANT]
> **This is a large-scale refactor across ~50 files.** I recommend executing it phase-by-phase with verification after each phase. Each phase is designed to be independently shippable.

> [!WARNING]
> **Phase 1 (Security)** includes removing the committed [.env](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/.env) file from the repo. This means the Git history still contains it. You should rotate ALL secrets (JWT_SECRET, AWS keys, MONGO_URI, GITHUB_CLIENT_SECRET) after Phase 1 is deployed.

> [!CAUTION]
> **Phase 2 changes all import paths** in the backend. Every [require('../scoreService')](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/middleware/auth.js#27-34) becomes [require('../services/scoring/scoreService')](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/middleware/auth.js#27-34), etc. This must be done atomically — partial migration will break the app.

---

## Phase 1: Security Hardening

**Priority:** 🔴 CRITICAL — must be done first
**Estimated scope:** 6 files modified, 1 file deleted, 1 file created

---

### 1.1 Remove [.env](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/.env) from repository

#### [DELETE] [.env](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/.env)

- Delete from tracked files via `git rm --cached backend/.env`
- The file stays on disk but is no longer tracked

#### [MODIFY] [.gitignore](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/.gitignore)

- The [.env](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/.env) pattern is already in [.gitignore](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/.gitignore) (line 30), but [backend/.env](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/.env) existed before the gitignore was added
- Verify no other [.env](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/.env) files are tracked

---

### 1.2 Add environment variable validation at startup

#### [NEW] [envValidator.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/config/envValidator.js)

Create a startup validation module that **fails fast** if required env vars are missing:

```
Required variables (crash on missing):
  - MONGO_URI
  - JWT_SECRET (must NOT be 'changeme' in production)

Required for features (warn on missing):
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
  - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
  - ATS_SERVICE_URL

Optional with sane defaults:
  - PORT (4000)
  - NODE_ENV (development)
  - JWT_EXPIRES_IN (7d)
```

#### [MODIFY] [config.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/config/config.js)

- Remove the `|| 'changeme'` fallback for `JWT_SECRET` (line 17)
- Call `envValidator.validate()` at import time to fail fast

---

### 1.3 Fix [auth.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/middleware/auth.js) bypassing centralized config

#### [MODIFY] [auth.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/middleware/auth.js)

Currently reads `process.env` directly on lines 4 and 8:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'changeme'  // line 4
const opts = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }  // line 8
```

Change to:
```javascript
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config')
```

---

### 1.4 Lock down CORS

#### [MODIFY] [createServer.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/server/createServer.js)

Currently `cors()` on line 20 allows ALL origins. Change to:

```javascript
const corsOptions = {
  origin: config.NODE_ENV === 'production'
    ? config.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}
app.use(cors(corsOptions))
```

Add `ALLOWED_ORIGINS` to [config.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/postcss.config.js).

---

### 1.5 Add security headers

#### [MODIFY] [package.json](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/package.json)

Add `helmet` dependency.

#### [MODIFY] [createServer.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/server/createServer.js)

Add `app.use(helmet())` before other middleware.

---

### 1.6 Secure the password reset endpoint

#### [MODIFY] [authRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/routes/authRoutes.js)

The `/auth/reset-password` endpoint (line 68) is completely unauthenticated — anyone can reset any user's password by knowing their email. Fix:
- Add [verifyToken](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/middleware/auth.js#12-26) + [requireRole('admin')](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/middleware/auth.js#27-34) middleware, OR
- Implement email-based reset token flow

---

## Phase 2: Backend Service Extraction

**Priority:** 🟠 HIGH — architectural cleanup
**Estimated scope:** ~30 files affected (7 moved, 10 routes refactored, 13+ new controller files)

---

### 2.1 Move loose service files into `services/` subdirectories

All 7 files at `backend/src/` root need to move into the existing `services/` directory:

| Current Location | New Location | Size |
|---|---|---|
| `src/scoreService.js` | `src/services/scoring/scoreService.js` | 244 ln |
| `src/badges.js` | `src/services/badges/badgeService.js` | 300 ln |
| `src/adminAnalytics.js` | `src/services/analytics/adminAnalytics.js` | 318 ln |
| `src/analyticsCache.js` | `src/services/analytics/analyticsCache.js` | ~80 ln |
| `src/privacyService.js` | `src/services/privacy/privacyService.js` | 228 ln |
| `src/github.js` | `src/services/github/githubApi.js` | ~140 ln |
| `src/githubScheduler.js` | `src/services/github/githubScheduler.js` | ~160 ln |

**After each move:** Update ALL `require()` paths across the codebase. Every file that imports from these modules must be updated. Specific files affected per service:

- `scoreService.js` → imported by: `adminRoutes.js`, `profileRoutes.js`, `resumeRoutes.js`, `githubRoutes.js`, `peerRoutes.js`, `skillGapRoutes.js`, `index.js` (scheduler)
- `badges.js` → imported by: `githubRoutes.js`, `badgeRoutes.js`, `skillGapRoutes.js`, `peerRoutes.js` (inline require)
- `adminAnalytics.js` → imported by: `adminRoutes.js`
- `analyticsCache.js` → imported by: `adminRoutes.js`, `profileRoutes.js`
- `privacyService.js` → imported by: `adminRoutes.js`, `profileRoutes.js`
- `github.js` → imported by: `githubRoutes.js`
- `githubScheduler.js` → imported by: `index.js`

---

### 2.2 Create shared utility modules

#### [NEW] `src/utils/avatarResolver.js`

Extract the duplicated avatar resolution logic found in 4 route files:

```javascript
function resolveAvatar(user, githubDoc) {
  if (user.profilePicture) return user.profilePicture
  if (githubDoc?.profile?.avatarUrl) return githubDoc.profile.avatarUrl
  return null
}
```

Files to update: `adminRoutes.js:63-64`, `profileRoutes.js:256-257`, `leaderboardRoutes.js:65-66`, `peerRoutes.js:65-67`

#### [NEW] `src/utils/badgeFormatter.js`

Extract the duplicated badge formatting logic found in 3 route files:

```javascript
function formatBadges(badges, baseUrl) {
  return badges.map(b => {
    const def = b.definitionId || b.definition
    let iconUrl = def ? def.icon : (b.metadata?.icon || '🏅')
    if (iconUrl && iconUrl.startsWith('/')) iconUrl = `${baseUrl}${iconUrl}`
    return { name: def ? def.name : b.badgeType, icon: iconUrl, /* ... */ }
  })
}
```

Files to update: `profileRoutes.js:249-254`, `leaderboardRoutes.js:75-79`, `badgeRoutes.js:57-67`

---

### 2.3 Extract business logic from route handlers (Controller Pattern)

Each fat route file should follow this pattern — routes become thin controllers:

```
Route handler (5-10 lines) → Controller function → Service function → Model
```

#### [MODIFY] [adminRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/routes/adminRoutes.js) (300 → ~100 lines)

Create: `src/controllers/adminController.js`

| Route | Controller Function | Current Lines | What Moves |
|---|---|---|---|
| `GET /admin/users` | `getUsers(query)` | 47-79 | DB query building, user enrichment, badge population |
| `GET /admin/users/export` | `exportUsersCsv(query)` | 82-109 | CSV generation, query building |
| `POST /admin/badges` | `createBadgeDefinition(data, file)` | 213-245 | S3 upload with fallback, badge creation |
| `POST /admin/users/:userId/badges` | `assignBadge(userId, badgeDefId)` | 262-278 | Badge existence check, creation, score recalc |
| `DELETE /admin/users/:userId/badges/:badgeId` | `removeBadge(userId, badgeId)` | 280-297 | Owner verification, deletion, score recalc |

The remaining routes (analytics, privacy) are already thin proxies to `adminAnalytics` and `privacyService` — they can stay as-is.

#### [MODIFY] [profileRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/routes/profileRoutes.js) (301 → ~80 lines)

Create: `src/controllers/profileController.js`

| Route | Controller Function | Current Lines | What Moves |
|---|---|---|---|
| `PUT /me/profile` | `updateProfile(userId, updates)` | 89-117 | Allowed fields filter, score recalc, cache clear |
| `POST /me/avatar` | `uploadAvatar(userId, file)` | 120-147 | S3 upload with local fallback |
| `GET /users/:userId/profile` | `getPublicProfile(userId)` | 234-272 | Badge formatting, avatar resolution, score lookup |
| `GET /files/:key(*)` | `proxyS3File(key)` | 213-231 | MIME type mapping, S3 file fetch |

#### [MODIFY] [leaderboardRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/routes/leaderboardRoutes.js) (208 → ~60 lines)

Create: `src/controllers/leaderboardController.js`

| Route | Controller Function | Current Lines | What Moves |
|---|---|---|---|
| `GET /leaderboard` | `getPublicLeaderboard(filters)` | 17-87 | Aggregation pipeline, badge formatting, avatar resolution |
| `GET /leaderboard/admin` | `getAdminLeaderboard(filters)` | 90-127 | Aggregation pipeline |
| `GET /admin/stats/departments` | `getDepartmentStats()` | 130-157 | Aggregation, histogram computation |
| `GET /admin/stats/years` | `getYearStats()` | 160-173 | Aggregation |
| `GET /admin/export/anonymized.csv` | `exportAnonymizedCsv(filters)` | 176-205 | SHA256 hashing, CSV generation |

#### [MODIFY] [peerRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/routes/peerRoutes.js) (162 → ~50 lines)

Create: `src/controllers/peerController.js`

Fix the inline `require()` on line 135:
```javascript
// BEFORE (anti-pattern):
await require('../badges').awardBadge(req.user.id, 'networking_ninja', ...)

// AFTER (top-level import):
const { awardBadge } = require('../services/badges/badgeService')
```

#### [MODIFY] [resumeRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/routes/resumeRoutes.js) (158 → ~50 lines)

Create: `src/controllers/resumeController.js`

---

### 2.4 Add API prefix & versioning

#### [MODIFY] [registerRoutes.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/src/server/registerRoutes.js)

Change from:
```javascript
app.use('/', authRoutes)
app.use('/', profileRoutes)
// ...
```

To:
```javascript
const apiRouter = express.Router()
apiRouter.use('/', authRoutes)
apiRouter.use('/', profileRoutes)
// ...
app.use('/api/v1', apiRouter)

// Keep health check at root
app.get('/health', ...)
```

#### [MODIFY] Frontend `api.js` — update base URL

Update [api.js](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/src/services/api.js) to use `/api/v1` as the base path. And update any hardcoded API paths in the frontend `AuthContext.jsx` and service files.

---

### 2.5 Resulting backend file structure

```
backend/src/
├── index.js                          # Unchanged (42 lines)
├── config/
│   ├── config.js                     # Modified (env validation)
│   └── envValidator.js               # NEW
├── controllers/                      # NEW directory
│   ├── adminController.js            # NEW (~150 lines)
│   ├── leaderboardController.js      # NEW (~100 lines)
│   ├── peerController.js             # NEW (~70 lines)
│   ├── profileController.js          # NEW (~120 lines)
│   └── resumeController.js           # NEW (~80 lines)
├── infrastructure/
│   ├── db.js                         # Unchanged
│   └── s3.js                         # Unchanged
├── middleware/
│   ├── auth.js                       # Modified (use config)
│   ├── consent.js                    # Unchanged
│   ├── errorHandler.js               # Unchanged
│   ├── onboarding.js                 # Unchanged
│   └── rateLimit.js                  # Unchanged
├── models/                           # Unchanged (10 files)
├── routes/
│   ├── adminRoutes.js                # Thinned (300 → ~100 lines)
│   ├── authRoutes.js                 # Modified (secure reset)
│   ├── badgeRoutes.js                # Unchanged
│   ├── githubRoutes.js               # Thinned (~170 → ~80 lines)
│   ├── leaderboardRoutes.js          # Thinned (208 → ~60 lines)
│   ├── peerRoutes.js                 # Thinned (162 → ~50 lines)
│   ├── profileRoutes.js              # Thinned (301 → ~80 lines)
│   ├── resumeRoutes.js               # Thinned (158 → ~50 lines)
│   ├── scoreRoutes.js                # Unchanged
│   └── skillGapRoutes.js             # Updated imports
├── server/
│   ├── createServer.js               # Modified (CORS, helmet)
│   └── registerRoutes.js             # Modified (/api/v1 prefix)
├── services/
│   ├── analytics/
│   │   ├── adminAnalytics.js         # MOVED from src/
│   │   └── analyticsCache.js         # MOVED from src/
│   ├── auth/
│   │   └── authService.js            # Unchanged (already exists)
│   ├── badges/
│   │   └── badgeService.js           # MOVED from src/badges.js
│   ├── github/
│   │   ├── githubApi.js              # MOVED from src/github.js
│   │   └── githubScheduler.js        # MOVED from src/
│   ├── privacy/
│   │   └── privacyService.js         # MOVED from src/
│   └── scoring/
│       ├── resumeProcessingService.js # Unchanged (already exists)
│       └── scoreService.js           # MOVED from src/
└── utils/
    ├── avatarResolver.js             # NEW
    ├── badgeFormatter.js             # NEW
    └── logger.js                     # Unchanged
```

---

## Phase 3: Frontend Decomposition

**Priority:** 🟡 MEDIUM — improves maintainability
**Estimated scope:** 4 large files split into ~25 smaller files

---

### 3.1 Break `AdminDashboard.jsx` (864 lines → ~6 files)

#### [MODIFY] [AdminDashboard.jsx](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/src/pages/admin/AdminDashboard.jsx)

Currently contains 7 inline component functions. Extract each to its own file:

| Inline Component | New File | Lines |
|---|---|---|
| `StatCard` (lines 772-790) | `components/features/admin/StatCard.jsx` | ~20 |
| `MiniStatCard` (lines 792-807) | `components/features/admin/MiniStatCard.jsx` | ~15 |
| `DistributionBadge` (lines 810-832) | `components/features/admin/DistributionBadge.jsx` | ~25 |
| `UserCard` (lines 575-693) | `components/features/admin/UserCard.jsx` | ~120 |
| `CohortCard` (lines 696-769) | `components/features/admin/CohortCard.jsx` | ~75 |
| `BestPracticeCard` (lines 835-863) | `components/features/admin/BestPracticeCard.jsx` | ~30 |

Additionally, break the main component into tab-level components:
| Tab section | New File | Lines |
|---|---|---|
| Overview tab (lines 253-368) | `pages/admin/OverviewTab.jsx` | ~120 |
| Users tab (lines 371-468) | `pages/admin/UsersTab.jsx` | ~100 |
| Analytics tab (lines 471-513) | `pages/admin/AnalyticsTab.jsx` | ~45 |
| Badge assign modal (lines 522-568) | `components/features/admin/BadgeAssignModal.jsx` | ~50 |

The main `AdminDashboard.jsx` becomes a **~80 line shell** that manages state and renders tabs.

---

### 3.2 Break `ProfileEdit.jsx` (29KB → ~5 files)

#### [MODIFY] [ProfileEdit.jsx](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/src/pages/profile/ProfileEdit.jsx)

Split into logical form sections:

| Section | New File |
|---|---|
| Basic info form (name, bio, department) | `components/features/profile/BasicInfoForm.jsx` |
| Social links editor | `components/features/profile/SocialLinksEditor.jsx` |
| Projects list editor | `components/features/profile/ProjectsEditor.jsx` |
| Experiences list editor | `components/features/profile/ExperiencesEditor.jsx` |
| Privacy settings | `components/features/profile/PrivacySettings.jsx` |

---

### 3.3 Break `LandingPage.jsx` (564 lines → ~6 files)

#### [MODIFY] [LandingPage.jsx](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/src/pages/LandingPage.jsx)

| Section | New File | Lines |
|---|---|---|
| Header/Navbar | `components/features/landing/LandingHeader.jsx` | ~50 |
| Hero section (lines 92-153) | `components/features/landing/HeroSection.jsx` | ~60 |
| Trust indicators (lines 155-217) | `components/features/landing/TrustIndicators.jsx` | ~60 |
| How it works (lines 219-354) | `components/features/landing/HowItWorks.jsx` | ~135 |
| Features list (lines 356-485) | `components/features/landing/FeaturesList.jsx` | ~130 |
| CTA + Footer (lines 487-559) | `components/features/landing/CTASection.jsx` + `LandingFooter.jsx` | ~75 |

Also extract the repeated gradient style into a shared constant:
```javascript
// styles/gradients.js
export const GOLD_GRADIENT = {
  backgroundImage: 'linear-gradient(135deg, #c9965c 0%, #f0b67f 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}
```

---

### 3.4 Split `index.css` (841 lines → ~8 files)

#### [MODIFY] [index.css](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/src/index.css)

Split into thematic stylesheets, all imported by `index.css`:

| New File | Content | Lines |
|---|---|---|
| `styles/variables.css` | CSS custom properties & design tokens | ~90 |
| `styles/base.css` | Reset, body, html, scrollbar | ~40 |
| `styles/typography.css` | Text scale classes | ~70 |
| `styles/layout.css` | Container, spacing, section utilities | ~25 |
| `styles/cards.css` | All card variants | ~70 |
| `styles/buttons.css` | All button variants | ~120 |
| `styles/forms.css` | Input, label, select styles | ~50 |
| `styles/animations.css` | Keyframes, animation utilities, stagger | ~70 |
| `styles/components.css` | Badges, progress, messages, empty states, misc | ~120 |

The `index.css` becomes:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:...');
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/variables.css';
@import './styles/base.css';
@import './styles/typography.css';
/* ... etc */
```

---

## Phase 4: Testing Infrastructure

**Priority:** 🟡 MEDIUM — required for safe future changes
**Estimated scope:** 2 packages installed, ~10 test files created

---

### 4.1 Backend testing setup

#### [MODIFY] [package.json](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/backend/package.json)

Add devDependencies: `jest`, `supertest`, `mongodb-memory-server`
Add script: `"test": "jest --forceExit --detectOpenHandles"`

#### [NEW] Backend test files

| Test File | Tests What | Key Test Cases |
|---|---|---|
| `tests/config/envValidator.test.js` | Env validation | Missing MONGO_URI crashes, default JWT_SECRET in production crashes |
| `tests/middleware/auth.test.js` | Auth middleware | Token generation, verification, role checking, expired token |
| `tests/services/scoring/scoreService.test.js` | Score calculation | ATS component, GitHub component, badge component, full recalculation |
| `tests/services/badges/badgeService.test.js` | Badge logic | Award, duplicate prevention, requirement checking |
| `tests/routes/auth.test.js` | Auth endpoints | Register, login, invalid credentials, domain restriction |
| `tests/routes/profile.test.js` | Profile endpoints | Get profile, update profile, avatar upload |
| `tests/routes/leaderboard.test.js` | Leaderboard | Public listing, pagination, department filter |
| `tests/routes/resume.test.js` | Resume endpoints | Upload, complete, parse flow |
| `tests/routes/admin.test.js` | Admin endpoints | Requires admin role, user listing, badge management |
| `tests/routes/github.test.js` | GitHub endpoints | OAuth flow, connect, disconnect, sync |

---

### 4.2 Frontend testing setup

#### [MODIFY] [package.json](file:///c:/Users/Lenovo/GDGoist-ATS-Leaderboard/frontend/package.json)

Add devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
Add script: `"test": "vitest run"`

#### [NEW] Frontend test files

| Test File | Tests What |
|---|---|
| `tests/context/AuthContext.test.jsx` | Auth state management, token storage |
| `tests/components/ui/Navbar.test.jsx` | Render, navigation links |
| `tests/services/api.test.js` | Base URL, interceptors |

---

## Phase 5: DevOps & Cleanup

**Priority:** 🟢 NORMAL — production deployment readiness
**Estimated scope:** 5 new files, 3 files deleted/moved

---

### 5.1 Docker setup

#### [NEW] `backend/Dockerfile`
#### [NEW] `frontend/Dockerfile`
#### [NEW] `ats-service/Dockerfile`
#### [NEW] `docker-compose.yml` (root)

Compose services: `backend`, `frontend`, `ats-service`, `mongodb`

### 5.2 CI/CD pipeline

#### [NEW] `.github/workflows/ci.yml`

Steps: Install → Lint → Test → Build (all 3 services)

### 5.3 Orphaned file cleanup

| File | Action |
|---|---|
| `/sbert_service.py` | Move to `ats-service/sbert/` or its own service directory |
| `/ATS_SCORING_FIX.md` | Move to `docs/` or delete |
| `/GITHUB_DATA_FIX.md` | Move to `docs/` or delete |
| `/frontend/tmp_build_log.txt` | Delete, add `*.log` and `tmp_*` to frontend `.gitignore` |

---

## Verification Plan

### Phase 1 Verification

```bash
# 1. Verify .env is untracked
cd c:\Users\Lenovo\GDGoist-ATS-Leaderboard
git status backend/.env    # Should show "nothing to commit" or untracked

# 2. Verify startup fails without required env vars
cd backend
unset MONGO_URI && node src/index.js   # Should crash with clear error message

# 3. Verify app starts with valid env
node src/index.js  # With valid .env present, should start normally

# 4. Verify helmet headers
curl -I http://localhost:4000/health  # Should include X-Content-Type-Options, etc.
```

### Phase 2 Verification

```bash
# 1. Verify all imports resolve
cd c:\Users\Lenovo\GDGoist-ATS-Leaderboard\backend
node -e "require('./src/index.js')"   # Should not throw MODULE_NOT_FOUND

# 2. Verify API prefix
curl http://localhost:4000/api/v1/health  # Should work
curl http://localhost:4000/health          # Root health should still work

# 3. Verify existing functionality via API calls
curl http://localhost:4000/api/v1/leaderboard  # Should return leaderboard data
curl -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test"}'
```

### Phase 3 Verification

```bash
# 1. Verify frontend builds without errors
cd c:\Users\Lenovo\GDGoist-ATS-Leaderboard\frontend
npm run build   # Should complete with 0 errors

# 2. Verify dev server starts
npm run dev     # Should start Vite dev server

# 3. Visual verification (browser)
# Open http://localhost:5173 — landing page should look identical
# Navigate to /login, /register, /dashboard — all should render correctly
# Navigate to /admin — admin dashboard should render all 4 tabs correctly
```

### Phase 4 Verification

```bash
# 1. Run backend tests
cd c:\Users\Lenovo\GDGoist-ATS-Leaderboard\backend
npm test    # All tests should pass

# 2. Run frontend tests
cd c:\Users\Lenovo\GDGoist-ATS-Leaderboard\frontend
npm test    # All tests should pass
```

### Phase 5 Verification

```bash
# 1. Verify Docker builds
docker-compose build   # All 3 services should build

# 2. Verify Docker runs
docker-compose up      # All services should start and connect to MongoDB

# 3. Verify no orphaned files remain at root
ls *.py *.md          # Should only show README.md and LICENSE
```

### Manual Verification (User)

After each phase, I recommend you manually test:
1. **Register a new user** → confirm token is returned
2. **Login** → confirm dashboard loads with correct data
3. **Upload a resume** → confirm ATS scoring works
4. **Connect GitHub** → confirm profile enrichment
5. **Admin dashboard** → confirm analytics, user management, badge management all work
6. **Leaderboard** → confirm pagination and filtering work

> [!TIP]
> Since there are no existing automated tests, the manual verification above is critical after each phase. I will add automated tests in Phase 4 to prevent future regressions.
