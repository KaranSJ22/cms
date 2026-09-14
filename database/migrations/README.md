# Database Migrations (Historical Archive)

The migration scripts in this directory were incremental patches used during development:

1. `ADD_OFFSER_TO_MENU.sql`: Added the `OFFSER` (Official Service) flag to `CMS_MENUITEM`.
   - **Baseline Status**: This column is now defined directly in `database/schema/MENUITEM_PRICE_SCHEMA.sql`.
   - The associated procedures are defined in `database/procedures/MENUITEM_PRICE_PROCEDURES.sql`.

2. `MIGRATE_KIOSK_SUPPORT.sql`: Added self-service kiosk support, including the 4-parameter `CMSGETBOOKFORSERVING` and 3-parameter `CMSSERVEBOOK`.
   - **Baseline Status**: Kiosk procedures are now part of `database/procedures/KIOSK_PROCEDURES.sql`, `BOOKING_PROCEDURES.sql`, and `REPORTING_SERVING_PROCEDURES.sql`.

## Fresh Database Initialization

For any new deployment (such as Aiven Cloud MySQL or a fresh local instance), **do not run these migration files directly**.
Instead, execute:
```bash
npm run db:init
```
which executes all base schemas (`database/schema/`), stored procedures (`database/procedures/`), and base seed data (`database/seed/`) in the exact required dependency order.
