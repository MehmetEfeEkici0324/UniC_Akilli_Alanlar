import cv2
import json

masalar = {}
gecerli_noktalar = []

img_orjinal = cv2.imread('foto1.jpg')
if img_orjinal is None:
    print("HATA: 'foto1.jpg' bulunamadi!")
    exit()

oran = 0.5
img = cv2.resize(img_orjinal, (0,0), fx=oran, fy=oran)

def ekrani_tazele():
    temp_img = img.copy()
    for isim, noktalar in masalar.items():
        kucuk_noktalar = [(int(nx*oran), int(ny*oran)) for nx, ny in noktalar]
        for i in range(len(kucuk_noktalar)):
            cv2.circle(temp_img, kucuk_noktalar[i], 3, (0, 0, 255), -1)
            cv2.line(temp_img, kucuk_noktalar[i], kucuk_noktalar[(i+1)%len(kucuk_noktalar)], (0, 0, 255), 1)

    for i, nokta in enumerate(gecerli_noktalar):
        cv2.circle(temp_img, nokta, 4, (0, 255, 0), -1)
        if i > 0:
            cv2.line(temp_img, gecerli_noktalar[i-1], gecerli_noktalar[i], (255, 0, 0), 2)
    
    cv2.imshow("Isaretleme", temp_img)

def tiklama_olayi(event, x, y, flags, param):
    global gecerli_noktalar
    if event == cv2.EVENT_LBUTTONDOWN:
        gecerli_noktalar.append((x, y))
        ekrani_tazele()

cv2.namedWindow("Isaretleme")
cv2.setMouseCallback("Isaretleme", tiklama_olayi)

print("\n--- KONTROLLER ---")
print("Sol Tik: Nokta koyar")
print("'z' Tusu: Son noktayi geri alir")
print("'s' Tusu: Masayi kaydeder (CMD ekranina isim yazip ENTER'la)")
print("'q' Tusu: Kaydet ve Cik\n")

while True:
    ekrani_tazele()
    tus = cv2.waitKey(1) & 0xFF
    
    if tus == ord("z"):
        if len(gecerli_noktalar) > 0:
            gecerli_noktalar.pop()
            print("Son nokta silindi.")
    
    elif tus == ord("s"):
        if len(gecerli_noktalar) > 2:
            isim = input("Masa ismi: ")
            masalar[isim] = [(int(nx/oran), int(ny/oran)) for nx, ny in gecerli_noktalar]
            gecerli_noktalar = []
            print(f"{isim} sisteme kaydedildi.")
        else:
            print("Hata: Bir masa icin en az 3 nokta gerekir.")
            
    elif tus == ord("q"): 
        with open("masalar.json", "w") as f:
            json.dump(masalar, f)
        print("Harita basariyla olusturuldu.")
        break

cv2.destroyAllWindows()