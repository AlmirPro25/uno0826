# Admin Panel Modularization Walkthrough

## Overview
This document details the changes made to modularize the Admin Panel (frontend) and instructions for verification.

## Modularization Summary
The following core modules have been extracted from `main.js` into dedicated files:
- **Agents (`agents.js`)**: Handles agent decisions and logic.
- **Memory (`memory.js`)**: Visualizes institutional memory.
- **Audit (`audit.js`)**: Displays audit logs.
- **Jobs (`jobs.js`)**: Manages background jobs.
- **Autonomy (`autonomy.js`)**: Visualizes the autonomy matrix.
- **Shadow Mode (`shadow.js`)**: Controls shadow mode execution.
- **Governance (`governance.js`)**: Consolidated Authority management and main governance dashboard.
- **Federation (`federation.js`)**: Federation status.

## Changes Made
1.  **New Files Created**: `agents.js`, `memory.js`, `audit.js`, `jobs.js`, `autonomy.js`, `shadow.js`, `federation.js`.
2.  **`index.html` Updated**: 
    - Added `<script>` tags for all new modules.
    - Updated Sidebar Navigation to point to the correct section IDs (`autonomy`, `shadow`, `agents`, `memory`, `audit`, `jobs`, `authority`).
3.  **`main.js` Cleaned**:
    - Removed monolithic `render*` functions for the above modules.
    - Updated `loadSection` switch statement to delegate rendering to the new module functions.
    - Removed `renderAuthority` logic (moved to `governance.js`).

## Verification Steps (Manual)

### Prerequisites
1.  **Backend Running**: Ensure the Go backend is running on `localhost:8080`.
    - A `.env` file has been created in the project root to support local execution.
    - Run: `cd backend && go run ./cmd/api/main.go`
2.  **Frontend Serving**: Open `index.html` via a local server (e.g., Live Server) or simply open the file in Chrome/Edge.

### Verification Checklist

#### 1. Governance & Authority
- [ ] Navigate to **Governance > Authority**.
- [ ] Verify the "Gestão de Autoridade" panel loads.
- [ ] Test "Nova Autoridade" button (modal should open).
- [ ] Verify list of authorities is fetched (or empty state).

#### 2. Autonomy & Agents
- [ ] Navigate to **Governance > Autonomy** (or Agents > Autonomy Matrix).
- [ ] Verify the Autonomy Matrix visualization appears.
- [ ] Navigate to **Agents > Agent Decisions**.
- [ ] Check for pending decisions list.

#### 3. Shadow Mode
- [ ] Navigate to **Agents > Shadow Mode**.
- [ ] Verify "Shadow Mode Status" card is visible.
- [ ] Toggle "Ativar Shadow Mode" (mock or real if backend supports).

#### 4. Memory & Audit
- [ ] Navigate to **Memory > Institutional Memory**.
- [ ] Verify graph/list of memory nodes.
- [ ] Navigate to **Memory > Audit Log**.
- [ ] Verify list of recent system actions.

#### 5. System Jobs
- [ ] Navigate to **System > Background Jobs** (or via URL hash `#jobs` if not in sidebar).
- [ ] Check job status dashboard.

### Troubleshooting
- **Backend Connection**: If sections show "Erro ao carregar" or similar, check the browser console. If `fetch` fails (`ERR_CONNECTION_REFUSED`), the backend is not running or CORS is blocking (check `.env` `ALLOWED_ORIGINS`).
- **Missing Functions**: If "function not defined" errors appear in console, ensure `governance.js` and others are loaded *after* `main.js` definitions but used correctly. (Note: `main.js` initializes on `DOMContentLoaded`, so order is generally safe).

## Next Steps
- Implement automated E2E tests for these flows.
- Further refine UI for "Cognitive Narrator" integration.
