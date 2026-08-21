---
name: rbac-route-config
description: Configures frontend routing and enforces Role-Based Access Control (RBAC) for new features.
---
# RBAC Route Configurator Skill

## Instructions
When instructed to add a route for a feature, you must:
1.  Open `src/routes/routeConfig.js` (or equivalent routing file).
2.  Import the newly created `[FeatureName]View.jsx` component.
3.  Define the path and wrap the component in the `ProtectedRoute` wrapper.
4.  Apply the exact `allowedRoles` array based on the role middleware definitions found in the backend routes for that specific module.
5.  Assign the route to the correct layout component (e.g., `AppLayout` for authenticated views, `AuthLayout` for public views).