@echo off
setlocal EnableExtensions
REM ==========================================================================
REM  subir.bat - Sube TODO C:\Users\jaman\Documents\PROYECTOS\CAD a GitHub
REM  (carpetas, subcarpetas e incluso ficheros ignorados) y SOBRESCRIBE lo
REM  que haya en el repositorio: GitHub queda identico a la carpeta local.
REM  Requisito: Git para Windows (https://git-scm.com/download/win)
REM ==========================================================================

set "CARPETA=C:\Users\jaman\Documents\PROYECTOS\CAD"
set "REPO=https://github.com/jamanteiga/CAD.git"
set "RAMA=main"

where git >nul 2>nul || (echo [ERROR] Falta Git: https://git-scm.com/download/win & pause & exit /b 1)
if not exist "%CARPETA%\" (echo [ERROR] No existe %CARPETA% & pause & exit /b 1)
cd /d "%CARPETA%"

REM --- repositorio local -------------------------------------------------------
if not exist ".git\" git init
REM limpia operaciones a medias de ejecuciones anteriores
git merge --abort >nul 2>nul
git rebase --abort >nul 2>nul

git config user.name  "jamanteiga"
git config user.email "jamanteiga@gmail.com"
git config core.longpaths true
git config core.autocrlf false
git config http.postBuffer 524288000

git remote remove origin >nul 2>nul
git remote add origin %REPO%

REM --- absolutamente todo (tambien lo que excluya un .gitignore) -----------------
echo Anadiendo todos los ficheros...
git add -A -f .

git diff --cached --quiet
if errorlevel 1 (
  git commit -q -m "Subida completa %date% %time%"
) else (
  git rev-parse --verify HEAD >nul 2>nul || git commit -q --allow-empty -m "Subida inicial"
)
git branch -M %RAMA%

REM --- subir sobrescribiendo GitHub --------------------------------------------
echo Subiendo y sobrescribiendo %REPO% ...
git push --force -u origin %RAMA%
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo subir. Revisa el inicio de sesion en GitHub
  echo         o si hay algun fichero de mas de 100 MB (GitHub no los admite).
  pause & exit /b 1
)

echo.
echo [OK] GitHub queda igual que %CARPETA%
pause
endlocal