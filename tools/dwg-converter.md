# Conversor DWG externo (opcional)

WebCAD Libre lee DWG en el navegador (LibreDWG/WebAssembly, ahora en un Web Worker), pero **no escribe DWG**:
no existe una biblioteca libre que lo haga de forma fiable. Para guardar en DWG puede montar su propio servicio.

## Contrato del servicio

- `POST <URL>` con el cuerpo = archivo **DXF 2000** (`Content-Type: application/dxf`).
- Cabecera `X-Target-Version`: `ACAD2018`, `ACAD2013`, `ACAD2010`, `ACAD2007`, `ACAD2004` o `ACAD2000`.
- Cabecera opcional `Authorization: Bearer <clave>`.
- Respuesta `200` con el DWG como cuerpo binario. Cualquier otro código se muestra como error.
- El servicio debe permitir CORS desde el dominio de la aplicación (p. ej. `https://jamanteiga.github.io`).

Configuración en WebCAD: **Insertar › SIG y DWG › Conversor DWG** (comando `CONVERSORDWG` / `DWGCONVERTER`).
Guardar: **Insertar › SIG y DWG › Guardar como DWG** (`GUARDARDWG` / `DWGOUT`).

## Ejemplo con ODA File Converter (gratuito, Windows/Linux) y Python

```python
# pip install flask flask-cors
import os, subprocess, tempfile, shutil
from flask import Flask, request, send_file, abort
from flask_cors import CORS

ODA = r"C:\Program Files\ODA\ODAFileConverter 25.12.0\ODAFileConverter.exe"  # ajuste la ruta
TOKEN = os.environ.get("WEBCAD_TOKEN", "")
app = Flask(__name__); CORS(app)

@app.post("/dwg")
def dwg():
    if TOKEN and request.headers.get("Authorization") != f"Bearer {TOKEN}": abort(401)
    ver = request.headers.get("X-Target-Version", "ACAD2018")
    src, dst = tempfile.mkdtemp(), tempfile.mkdtemp()
    try:
        open(os.path.join(src, "dibujo.dxf"), "wb").write(request.get_data())
        subprocess.run([ODA, src, dst, ver, "DWG", "0", "1", "*.DXF"], check=True, timeout=120)
        out = os.path.join(dst, "dibujo.dwg")
        if not os.path.exists(out): abort(500)
        return send_file(out, mimetype="application/acad", download_name="dibujo.dwg")
    finally:
        shutil.rmtree(src, ignore_errors=True)  # dst se borra al terminar la petición en producción

app.run(host="0.0.0.0", port=8765)
```

URL en WebCAD: `http://localhost:8765/dwg` (en el mismo equipo) o la de su servidor con HTTPS.
Licencia: revise las condiciones de uso de ODA File Converter para su caso.
