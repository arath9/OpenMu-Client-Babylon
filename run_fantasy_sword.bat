@echo off
setlocal
REM BLENDER_EXE may point to a portable or installed Blender executable.
if not defined BLENDER_EXE set "BLENDER_EXE=blender"
"%BLENDER_EXE%" --background --factory-startup --python-exit-code 1 --python "%~dp0src\tools\fantasy_sword.py" -- %*
exit /b %errorlevel%
