# CFD Backend Setup

The backend is a native OpenFOAM execution service. It does not generate substitute CFD numbers. A completed result is produced only after the configured OpenFOAM solver, mesh checks, VTK export, and force-coefficient parsing all succeed.

## Local development

Install the repository dependencies with the package manager used by the project, then provide the environment values from `.env.example`. In production, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ALLOWED_ORIGIN` are mandatory. Guest simulation access is disabled unless `ALLOW_GUEST_SIMULATIONS=true` is explicitly set for a controlled development environment.

The host must provide OpenFOAM v2606-compatible binaries including `blockMesh`, `surfaceFeatureExtract`, `snappyHexMesh`, `checkMesh`, `simpleFoam` or `chtMultiRegionSimpleFoam`, and `foamToVTK`. Parallel runs additionally require `decomposePar`, `mpirun`, and `reconstructPar`. The runner verifies these binaries before starting a heavy job and returns a translated failure if any are missing.

Start the application with `npm run dev`. The API and Vite development server share port 3000. `GET /healthz` is a liveness check; `GET /readyz` returns 503 until the OpenFOAM toolchain is available; `GET /api/health` exposes the detected solver status.

## Simulation flow

Upload a validated STL through `/api/upload-stl`, submit `/api/run-simulation`, then consume `/api/simulation-stream/:caseId` for live logs and residuals. `/api/simulation-status/:caseId` remains available as a polling fallback. The frontend's existing charts and Excel/PDF report actions consume the terminal solver payload.

Case directories are UUID-scoped under `/tmp/of_cases`, are restricted to the owning user, and are cleaned up after expiry or cancellation. Do not expose that directory through a static route or mount it as a public volume.

## Production notes

The current identity and active-job stores are in memory. Run one server instance for a controlled deployment, or replace those stores with a durable database and shared job queue before horizontal scaling. Do not enable guest simulations in production. Use HTTPS so the secure `SameSite=None` authentication cookies can be sent through an embedded HTTPS preview or reverse proxy.
