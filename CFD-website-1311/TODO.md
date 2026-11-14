# CFD Website Backend TODO

## Real solver execution and trustworthy results

The website must submit validated STL geometry and validated simulation settings to the backend, queue work with bounded concurrency, execute the configured native OpenFOAM solver, stream logs and residuals, and show only metrics parsed from completed solver output. If the solver is missing or fails, the UI must show an actionable error and must not display fabricated CFD values.

## Secure API boundary

Authentication, CSRF protection, rate limiting, role checks, path isolation, command allow-listing, request validation, upload limits, and production secret requirements must remain enabled. Guest simulations must be disabled unless explicitly enabled by configuration.

## Live telemetry and reports

The existing SSE stream and polling fallback must continue to expose live solver logs, residuals, mesh health, status, and final result data so the current charts and Excel/PDF report actions can consume real run data.

## Regression quality

The TypeScript check and backend test suite must pass, malformed STL payloads must be rejected safely, and the project must expose a valid `GET /manus-routes.json` page route manifest.
