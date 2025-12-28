import os
import time
import json
import cv2
from datetime import datetime
from ultralytics import YOLO
from shapely.geometry import Point, Polygon

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FOTOGRAF_LISTESI = [os.path.join(BASE_DIR, 'foto1.jpg'), 
                    os.path.join(BASE_DIR, 'foto2.jpg'), 
                    os.path.join(BASE_DIR, 'foto3.jpg'), 
                    os.path.join(BASE_DIR, 'foto4.jpg'), 
                    os.path.join(BASE_DIR, 'foto5.jpg')]
MASA_VERISI = os.path.join(BASE_DIR, 'masalar.json')
CIKTI_JSON = os.path.join(BASE_DIR, 'canli_durum.json')
BEKLEME_SURESI = 10  


def analiz_yap(foto_yolu):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Analiz Ediliyor: {foto_yolu}")

    try:
        model = YOLO('yolov8n.pt')
    except:
        print("Model yuklenemedi!")
        return

    if not os.path.exists(MASA_VERISI):
        print(f"HATA: {MASA_VERISI} dosyasi bulunamadi!")
        return

    with open(MASA_VERISI, 'r') as f:
        masa_tanimlari = json.load(f)
    
    img = cv2.imread(foto_yolu)
    if img is None:
        print(f"HATA: {foto_yolu} okunamadi!")
        return

    results = model.predict(img, device='cpu', verbose=False, conf=0.20)

    guncel_durum = {
        "son_guncelleme": datetime.now().strftime('%H:%M:%S'),
        "analiz_edilen_dosya": foto_yolu,
        "toplam_kapasite": len(masa_tanimlari), 
        "dolu_masa_sayisi": 0,                  
        "masalar": {}
    }
    
    dolu_sayac = 0
    for masa_ismi, koordinatlar in masa_tanimlari.items():
        masa_alani = Polygon(koordinatlar)
        dolu_mu = False
        
        for r in results:
            for box in r.boxes:
                if int(box.cls) == 0: 
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    ayak = Point((x1 + x2) / 2, y2)
                    if masa_alani.contains(ayak):
                        dolu_mu = True
                        break
        
        if dolu_mu:
            dolu_sayac += 1
        
        guncel_durum["masalar"][masa_ismi] = "DOLU" if dolu_mu else "BOS"

    guncel_durum["dolu_masa_sayisi"] = dolu_sayac

    with open(CIKTI_JSON, 'w') as f:
        json.dump(guncel_durum, f, indent=4)
        
    print(f"--- ANALIZ TAMAMLANDI ---")
    print(f"Dosya: {foto_yolu}")
    print(f"Kapasite: {guncel_durum['toplam_kapasite']}")
    print(f"Dolu Masa: {guncel_durum['dolu_masa_sayisi']}")
    print("-" * 30)

if __name__ == "__main__":
    print(">>> Hackathon Simülasyonu Başlatıldı.")
    print(">>> 5 fotoğraf sırayla analiz edilecek.")
    
    while True:
        for foto in FOTOGRAF_LISTESI:
            try:
                analiz_yap(foto)
            except Exception as e:
                print(f"Beklenmedik bir hata oluştu: {e}")
            
            time.sleep(BEKLEME_SURESI)