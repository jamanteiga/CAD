@echo off
echo ========================================
echo Subiendo proyecto EPDF al repositorio CAD...
echo ========================================

git add -A
set /p mensaje="Introduce el mensaje para el commit: "
git commit -m "Subir documentos a CAD"
git branch -M main

:: Vincula el repositorio remoto al proyecto CAD
git remote set-url origin https://github.com/jamanteiga/CAD.git

:: Sube los cambios (manteniendo la advertencia de que --force sobrescribirá todo lo previo en CAD)
git push -u origin main --force

echo ========================================
echo ¡Proceso finalizado!
echo ========================================
pause