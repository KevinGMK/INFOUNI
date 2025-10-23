from flask import Flask, send_from_directory, jsonify
import os

app = Flask(__name__)

# Ruta compartida en tu red local (asegúrate que existe en el servidor donde corre Flask)
NETWORK_PATH = r"\\192.168.50.111\Carpeta Compartida"

@app.route("/")
def index():
    # sirve el archivo index.html (tu frontend)
    return send_from_directory("static", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    # sirve otros archivos estáticos (css, js, imágenes, etc.)
    return send_from_directory("static", filename)

@app.route("/list/<program>")
def list_program(program):
    """
    Endpoint para listar archivos dentro de la carpeta compartida de un programa.
    Ejemplo: /list/office
    """
    path = os.path.join(NETWORK_PATH, program)
    if not os.path.exists(path):
        return jsonify({"error": "Carpeta no encontrada"}), 404
    
    files = os.listdir(path)
    return jsonify(files)

@app.route("/download/<program>/<filename>")
def download_file(program, filename):
    """
    Endpoint para descargar un archivo desde la carpeta compartida
    """
    path = os.path.join(NETWORK_PATH, program)
    return send_from_directory(path, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
