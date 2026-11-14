# CFD Website Backend Implementation Plan

## Scope

Make the existing React/Vite CFD workbench use a safe, real OpenFOAM execution path for STL upload, queued simulation, live SSE telemetry, solver-derived results, and existing report/chart downloads. Preserve the current visual UI and avoid synthetic CFD metrics in the real-run path.

## Implementation approach

- Keep the existing Express server and OpenFOAM runner as the backend boundary.
- Harden authentication, cookies, CORS, guest access, and secret handling without exposing credentials in source.
- Validate STL payloads strictly, reject malformed geometry before queueing, and preserve the existing case-directory isolation and command allow-list.
- Keep live progress and residuals on the existing SSE endpoint, with polling fallback in the frontend.
- Ensure result payloads are sourced from OpenFOAM VTK and force-coefficient output; when OpenFOAM is not installed, return a translated failure instead of fallback numbers.
- Add the required route manifest and focused regression coverage.

## Project structure

- `server.ts`: Express middleware, auth, simulation and SSE routes, health checks, static/Vite serving.
- `backend/auth.js`: access/refresh tokens, CSRF, sessions, password policy and roles.
- `backend/validation.js`: Zod request validation and STL integrity checks.
- `backend/openfoamRunner.js`: isolated case creation, bounded queue, OpenFOAM process execution, telemetry parsing and result assembly.
- `src/pages/SimulationRunnerPage.tsx`: real submission, SSE/polling lifecycle and solver-result mapping.
- `src/utils/api.ts`: authenticated API client and SSE transport.
- `public/manus-routes.json`: page route manifest for the website runtime.

## Design decisions

- **Operational aesthetic** (0.07): keep the current aerospace workbench visual language and improve trust through explicit backend status, solver provenance, and clear failure states.
- **Instrument-panel clarity** (0.05): prioritize status hierarchy, live telemetry, and actionable remediation over decorative changes.
- **Scientific notebook restraint** (0.08): favor neutral surfaces, precise units, and provenance labels for engineering outputs.

Chosen direction: operational aerospace workbench. Backend-facing UI should use concise engineering language, show whether a value is solver-derived, and never imply a successful run when the native solver did not complete.

## Safety constraints

- No fabricated CFD results or silent fallback metrics.
- No shell interpolation of user-controlled values.
- No production fallback JWT secrets or hardcoded production seed credentials.
- Guest simulation access is opt-in through an explicit environment variable.
- Uploaded STL files remain size- and triangle-bounded and are stored in per-case restricted directories.
