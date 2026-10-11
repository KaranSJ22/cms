# Ensure script is run from the root of the existing kiosk folder
Write-Host "Scaffolding kiosk project structure..." -ForegroundColor Cyan

$directories = @(
    "systemd",
    "drivers",
    "agent\scripts",
    "agent\src\config",
    "agent\src\common\errors",
    "agent\src\common\responses",
    "agent\src\middlewares",
    "agent\src\db",
    "agent\src\utils",
    "agent\src\modules\kiosk",
    "agent\src\modules\booking",
    "agent\src\modules\sync",
    "agent\src\modules\system",
    "agent\src\routes"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

$files = @(
    # systemd
    "systemd\cms-kiosk.service",
    "systemd\cms-rfid.service",
    
    # drivers
    "drivers\requirements.txt",
    "drivers\rfid_daemon.py",
    
    # agent root
    "agent\package.json",
    "agent\.env.example",
    
    # agent scripts
    "agent\scripts\init-db.js",
    "agent\scripts\reset-outbox.js",
    
    # agent src root
    "agent\src\app.js",
    "agent\src\server.js",
    
    # config
    "agent\src\config\env.js",
    "agent\src\config\constants.js",
    
    # common
    "agent\src\common\errors\appError.js",
    "agent\src\common\responses\apiResponse.js",
    
    # middlewares
    "agent\src\middlewares\error.middleware.js",
    "agent\src\middlewares\validate.middleware.js",
    "agent\src\middlewares\requestLogger.middleware.js",
    
    # db
    "agent\src\db\sqlite.js",
    "agent\src\db\schema.sql",
    
    # utils
    "agent\src\utils\logger.js",
    "agent\src\utils\dateTime.js",
    
    # modules - kiosk
    "agent\src\modules\kiosk\kiosk.routes.js",
    "agent\src\modules\kiosk\kiosk.controller.js",
    "agent\src\modules\kiosk\kiosk.service.js",
    "agent\src\modules\kiosk\kiosk.repository.js",
    "agent\src\modules\kiosk\kiosk.validation.js",
    
    # modules - booking
    "agent\src\modules\booking\booking.routes.js",
    "agent\src\modules\booking\booking.controller.js",
    "agent\src\modules\booking\booking.service.js",
    "agent\src\modules\booking\booking.repository.js",
    "agent\src\modules\booking\booking.validation.js",
    
    # modules - sync
    "agent\src\modules\sync\sync.worker.js",
    "agent\src\modules\sync\sync.client.js",
    "agent\src\modules\sync\sync.repository.js",
    "agent\src\modules\sync\sync.service.js",
    
    # modules - system
    "agent\src\modules\system\system.routes.js",
    "agent\src\modules\system\system.controller.js",
    "agent\src\modules\system\system.service.js",
    
    # routes
    "agent\src\routes\index.routes.js"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        New-Item -ItemType File -Force -Path $file | Out-Null
    }
}

Write-Host "`nAll missing directories and files have been successfully created!" -ForegroundColor Green