from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(BASE_DIR, 'kutuphaneler.json')

@app.route('/verileri-getir', methods=['GET'])
def getir():
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({"durum": "hata", "mesaj": str(e)}), 500

@app.route('/guncelle', methods=['POST'])
def guncelle():
    try:
        veri = request.json
        kutuphane_id = veri.get('id')
        yeni_dolu = veri.get('dolu')
        yeni_bekleyen = veri.get('bekleyen')

        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            kutuphaneler = json.load(f)

        for k in kutuphaneler:
            if k['id'] == kutuphane_id:
                k['dolu'] = yeni_dolu
                k['bekleyen'] = yeni_bekleyen
                break

        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(kutuphaneler, f, ensure_ascii=False, indent=4)

        return jsonify({"durum": "basarili"})
    except Exception as e:
        return jsonify({"durum": "hata", "mesaj": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)