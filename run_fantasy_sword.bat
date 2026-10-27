@echo off
REM Run Fantasy Sword Blender script
set SCRIPT_PATH="C:/Users/Andres/Documents/Codex/2026-10-24/bu/mu-online/OpenMu-Client-Babylon/src/tools/fantasy_sword.py"

REM Try common Blender paths
for %%i in (
    "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe",
    "C:/Program Files/Blender Foundation/Blender 3.6/blender.exe"
) do (
    if exist %%i (
        echo Running Blender: %%i
        start "" "%%i" --background --python %SCRIPT_PATH%
        exit /b 0
    )
)

echo ❌ Blender not found in common paths
pause
