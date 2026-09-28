$base = "database_sybase"

$files = @(
    # Root
    "README.md",

    # Schema
    "schema\execution_order.txt",
    "schema\00_INIT_DATABASE.sql",
    "schema\COMMON_SCHEMA.sql",
    "schema\USER_SCHEMA.sql",
    "schema\ACCESSKEY_SCHEMA.sql",
    "schema\ROLE_SCHEMA.sql",
    "schema\CANTEENROLE_SCHEMA.sql",
    "schema\CONSUMERROLE_SCHEMA.sql",
    "schema\CENTER_SCHEMA.sql",
    "schema\CANTEEN_SCHEMA.sql",
    "schema\SERVICE_SCHEMA.sql",
    "schema\CUSTOMER_SCHEMA.sql",
    "schema\EMPLOYEES_VISITOR_SCHEMA.sql",
    "schema\DAYSLOT_SCHEMA.sql",
    "schema\DAYMENU_SCHEMA.sql",
    "schema\MENUTEMPLATE_SCHEMA.sql",
    "schema\MENUITEM_PRICE_SCHEMA.sql",
    "schema\BOOKING_SCHEMA.sql",
    "schema\WALLET_SCHEMA.sql",
    "schema\OFFICIAL_REQUEST.sql",
    "schema\KIOSK_SCHEMA.sql",
    "schema\HOLIDAY_SCHEMA.sql",

    # Booking procedures
    "procedures\booking\read\BOOKING_READ_PROCEDURES.sql",
    "procedures\booking\write\BOOKING_WRITE_PROCEDURES.sql",
    "procedures\booking\write\BOOKING_WEEKLY_BATCH.sql",

    # Canteen procedures
    "procedures\canteen\read\CANTEEN_READ_PROCEDURES.sql",
    "procedures\canteen\write\CANTEEN_WRITE_PROCEDURES.sql",

    # Common procedures
    "procedures\common\read\COMMON_READ_PROCEDURES.sql",
    "procedures\common\write\COMMON_WRITE_PROCEDURES.sql",

    # Day menu procedures
    "procedures\daymenu\read\DAYMENU_READ_PROCEDURES.sql",
    "procedures\daymenu\write\DAYMENU_WRITE_PROCEDURES.sql",

    # Day slot procedures
    "procedures\dayslot\read\DAYSLOT_READ_PROCEDURES.sql",
    "procedures\dayslot\write\DAYSLOT_WRITE_PROCEDURES.sql",

    # Identity procedures
    "procedures\identity\read\IDENTITY_READ_PROCEDURES.sql",
    "procedures\identity\write\IDENTITY_WRITE_PROCEDURES.sql",

    # Kiosk procedures
    "procedures\kiosk\read\KIOSK_READ_PROCEDURES.sql",
    "procedures\kiosk\write\KIOSK_WRITE_PROCEDURES.sql",

    # Menu item procedures
    "procedures\menuitem\read\MENUITEM_READ_PROCEDURES.sql",
    "procedures\menuitem\write\MENUITEM_WRITE_PROCEDURES.sql",

    # Menu template procedures
    "procedures\menutemplate\read\MENUTEMPLATE_READ_PROCEDURES.sql",
    "procedures\menutemplate\write\MENUTEMPLATE_WRITE_PROCEDURES.sql",

    # Official request procedures
    "procedures\officialrequest\read\OFFICIAL_READ_PROCEDURES.sql",
    "procedures\officialrequest\write\OFFICIAL_WRITE_PROCEDURES.sql",

    # Reporting procedures
    "procedures\reporting\read\REPORTING_READ_PROCEDURES.sql",
    "procedures\reporting\write\REPORTING_WRITE_PROCEDURES.sql",

    # Wallet procedures
    "procedures\wallet\read\WALLET_READ_PROCEDURES.sql",
    "procedures\wallet\write\WALLET_WRITE_PROCEDURES.sql",

    # Jobs
    "jobs\NOSHOW_ISQL_FALLBACK.sql",

    # Seed
    "seed\SEED_STATUS.sql",
    "seed\SEED_DATA.sql",
    "seed\SEED_AUTONO.sql",
    "seed\SEED_HOLIDAYS.sql",

    # Migrations
    "migrations\README.md",

    # Deployment
    "deploy\01_deploy_schema.sql",
    "deploy\02_deploy_procedures.sql",
    "deploy\03_deploy_seed.sql",
    "deploy\deploy_all.bat"
)

foreach ($file in $files) {
    $path = Join-Path $base $file
    $directory = Split-Path $path -Parent

    New-Item -ItemType Directory -Path $directory -Force | Out-Null

    if (-not (Test-Path $path)) {
        New-Item -ItemType File -Path $path | Out-Null
        Write-Host "CREATED : $path"
    }
    else {
        Write-Host "SKIPPED : $path"
    }
}

Write-Host ""
Write-Host "database_sybase structure created successfully."