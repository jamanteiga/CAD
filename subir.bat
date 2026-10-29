@echo off
setlocal EnableExtensions
REM ==========================================================================
REM  subir-a-github.bat
REM  Sube TODO el contenido de la carpeta del proyecto al repositorio GitHub.
REM  Requisito: Git para Windows (https://git-scm.com/download/win)
REM  La primera vez Git abre el navegador para iniciar sesion en GitHub.
REM ==========================================================================

set "CARPETA=C:\Users\jaman\Documents\PROYECTOS\CAD"
set "REPO=https://github.com/jamanteiga/CAD.git"
set "RAMA=main"
set "NOMBRE=jamanteiga"
set "CORREO=jamanteiga@gmail.com"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git no esta instalado. Descargalo de https://git-scm.com/download/win
  pause & exit /b 1
)

if not exist "%CARPETA%\" (
  echo [ERROR] No existe la carpeta %CARPETA%
  pause & exit /b 1
)
cd /d "%CARPETA%"

REM --- primera vez: crear el repositorio local --------------------------------
if not exist ".git\" (
  echo Creando repositorio local...
  git init
  git branch -M %RAMA%
)

git config user.name  "%NOMBRE%"
git config user.email "%CORREO%"
git config core.longpaths true
git config core.autocrlf true

REM --- remoto ------------------------------------------------------------------
git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin %REPO%
) else (
  git remote set-url origin %REPO%
)

REM --- anadir absolutamente todo (carpetas, subcarpetas, borrados) ----------------
echo Anadiendo ficheros...
git add -A

REM --- commit con fecha y hora (solo si hay cambios) ------------------------------
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Actualizacion %date% %time%"
) else (
  echo No hay cambios locales nuevos.
)

REM --- integrar lo que ya hubiera en GitHub (gana la version local) -------------
git fetch origin >nul 2>nul
git ls-remote --exit-code --heads origin %RAMA% >nul 2>nul
if not errorlevel 1 (
  echo Integrando cambios remotos...
  git pull --no-rebase --no-edit -X ours --allow-unrelated-histories origin %RAMA%
  if errorlevel 1 (
    echo [ERROR] No se pudo integrar el contenido remoto. Revisa los mensajes.
    pause & exit /b 1
  )
)

REM --- subir -------------------------------------------------------------------
echo Subiendo a %REPO% ...
git push -u origin %RAMA%
if errorlevel 1 (
  echo [ERROR] Fallo la subida. Comprueba el inicio de sesion en GitHub y vuelve a ejecutar.
  pause & exit /b 1
)

echo.
echo [OK] Proyecto subido a %REPO%
echo Publicacion web: GitHub ^> Settings ^> Pages ^> Deploy from a branch ^> main / (root)
pause
endlocal