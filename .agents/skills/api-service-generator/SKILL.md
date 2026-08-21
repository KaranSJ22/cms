---
name: api-service-generator
description: Generates Axios API services by strictly cross-referencing the backend routes and validations.
---
# API Service Generator Skill

## 1. Pre-Flight Check (Mandatory Backend Alignment)
Before generating any frontend API service, you MUST read the corresponding backend files for the requested module:
*   **Check the Routes:** Read `backend/src/modules/[module-name]/[module-name].routes.js` to get the exact HTTP methods, URL paths, and middleware layers.
*   **Check the Payload Validation:** Read `backend/src/modules/[module-name]/[module-name].validation.js` to understand the exact Zod schema requirements for payloads.

## 2. Execution
*   Generate the Axios service file inside `src/features/[feature-name]/services/[featureName]Service.js`.
*   Ensure all payload shapes in the frontend perfectly match the backend schemas.
*   Configure the service to use the project's authenticated Axios instance.
*   Add JSDoc comments above each API function detailing the required roles and expected response format (always expecting SUCCESS, MESSAGE, and DATA keys).