
function uyariVer(mesaj) {
    let box = document.getElementById('bildirim');
    if (!box) {
        box = document.createElement('div');
        box.id = 'bildirim';
        box.className = 'bildirim-kutusu';
        document.body.appendChild(box);
    }
    box.innerText = mesaj;
    box.classList.add('goster');
    setTimeout(() => { box.classList.remove('goster'); }, 5000);
}


function mesafeHesapla(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

document.addEventListener('DOMContentLoaded', () => {
    verileriYukle();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            localStorage.setItem('user_location', JSON.stringify({
                x: pos.coords.latitude,
                y: pos.coords.longitude
            }));
        });
    }

    const aiBtn = document.getElementById('kutuphane-ai-btn'); 
    const aiPanel = document.getElementById('ai-panel'); 
    const aiKapat = document.getElementById('panel-kapat'); 

    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            aiPanel.style.display = "block";
            aiPanel.classList.add('acik');
            enUygunYeriAnalizEt(); 
        });
    }

    if (aiKapat) {
        aiKapat.onclick = () => {
            aiPanel.classList.remove('acik');
            aiPanel.style.display = "none";
        };
    }
});

async function enUygunYeriAnalizEt() {
    const aiSonuc = document.getElementById('ai-sonuc');
    aiSonuc.innerHTML = "<p>🤖 Analiz yapılıyor...</p>";

    try {
        const yerelVeri = localStorage.getItem('kutuphane_verileri');
        if (!yerelVeri) return;
        
        const veriler = JSON.parse(yerelVeri);
        const userLoc = JSON.parse(localStorage.getItem('user_location')) || { x: 40.21, y: 28.90 };

        let uygunlar = veriler
            .filter(k => (k.dolu / k.kapasite) < 0.8)
            .map(k => ({
                ...k,
                mesafe: mesafeHesapla(userLoc.x, userLoc.y, k.x, k.y),
                yuzde: Math.round((k.dolu / k.kapasite) * 100)
            }))
            .sort((a, b) => a.mesafe - b.mesafe);

        const enYakin = uygunlar[0];

        if (!enYakin) {
            aiSonuc.innerHTML = "<p>⚠️ Şu an her yer %80'den fazla dolu!</p>";
            return;
        }

        const yedekMesaj = `
            <div class="oneri-kart">
                <p>📍 <strong>Önerilen:</strong> ${enYakin.ad}</p>
                <p>📊 <strong>Doluluk:</strong> %${enYakin.yuzde}</p>
                <p>💡 <em>Şu an konuma en yakın ve en sakin yer burası görünüyor.</em></p>
            </div>`;

        try {
            const API_KEY = "GOOGLE-API-KEY-SECRET";
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: `Nilüfer asistanısın. En yakın kütüphane: ${enYakin.ad}, doluluk: %${enYakin.yuzde}. Burayı neden önerdiğini samimi ve kısa bir dille açıkla.` }] }] })
            });

            if (!response.ok) throw new Error("API Hatası");

            const data = await response.json();
            aiSonuc.innerHTML = `<div class="oneri-kart"><p>${data.candidates[0].content.parts[0].text}</p></div>`;
        } catch (apiErr) {
            console.warn("API Bağlantı Hatası, yedek gösteriliyor.");
            aiSonuc.innerHTML = yedekMesaj;
        }

    } catch (err) {
        aiSonuc.innerHTML = "<p>⚠️ Verilere ulaşılamadı. Sayfayı yenileyip konum izni verdiğinizden emin olun.</p>";
    }
}

function kutuphaneKartlariniOlustur(veriler) {
    const container = document.querySelector('.kutuphane-container'); 
    if (!container) return;
    
    container.innerHTML = ""; 
    veriler.forEach(k => {
    });
    arayuzuGuncelle(veriler);
}

async function verileriYukle() {
    try {
        const response = await fetch('http://127.0.0.1:5000/verileri-getir'); 
        const veriler = await response.json();
        
        localStorage.setItem('kutuphane_verileri', JSON.stringify(veriler));
        arayuzuGuncelle(veriler);
    } catch (error) {
        console.error("Hata:", error);
        uyariVer("❌ Sunucu kapalı! Veriler yüklenemedi.");
    }
}

function arayuzuGuncelle(kutuphaneler) {
    kutuphaneler.forEach(k => {
        const kart = document.getElementById(k.id);
        if (kart) {
            const yuzde = Math.round((k.dolu / k.kapasite) * 100);
            const bos = k.kapasite - k.dolu;
            kart.querySelector('.veri-satiri:nth-child(1) .deger').innerText = k.dolu;
            kart.querySelector('.veri-satiri:nth-child(2) .deger').innerText = bos > 0 ? bos : 0;
            const bekleyenElement = kart.querySelector('.veri-satiri:nth-child(3) .deger');
            if (bekleyenElement) bekleyenElement.innerText = bos > 0 ? 0 : (k.bekleyen || 0);
            
            kart.querySelector('.yuzde-daire').innerText = `%${yuzde}`;
            const bar = kart.querySelector('.durum-bar-doluluk');
            if (bar) {
                bar.style.width = `${yuzde}%`;
                bar.style.backgroundColor = yuzde > 85 ? "#e74c3c" : "#8dc63f";
            }
        }
    });
}

async function kapasiteDegistir(buton, islem) {
    const kart = buton.closest('.bilgi-karti');
    const id = kart.id;

    let doluVal = parseInt(kart.querySelector('.veri-satiri:nth-child(1) .deger').innerText) || 0;
    let bekleyenVal = parseInt(kart.querySelector('.veri-satiri:nth-child(3) .deger').innerText) || 0;

    const yerelVeri = JSON.parse(localStorage.getItem('kutuphane_verileri'));
    const kData = yerelVeri.find(item => item.id === id);
    const kapasite = kData ? kData.kapasite : 120; 

    if (islem === 'giris') {
        if (doluVal < kapasite) {
            doluVal++; 
        } else {
            bekleyenVal++; 
            uyariVer("⚠️ Kapasite dolu! Sıraya eklendiniz.");
        }
    } 
    else if (islem === 'cikis') {
        if (bekleyenVal > 0) {
            bekleyenVal--; 
            uyariVer("✅ Sıradaki kişi içeri alındı.");
        } else if (doluVal > 0) {
            doluVal--; 
        } else {
            uyariVer("❌ Kütüphane zaten boş!");
            return;
        }
    }

    try {
        const res = await fetch('http://127.0.0.1:5000/guncelle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: id, 
                dolu: doluVal, 
                bekleyen: bekleyenVal 
            })
        });
        
        if (res.ok) {
            verileriYukle();
        }
    } catch (err) {
        uyariVer("❌ Sunucu Hatası!");
    }
}

async function pythonuHaberdarEt(id, yeniDolu, yeniBekleyen) {
    try {
        const response = await fetch('http://127.0.0.1:5000/guncelle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id,
                dolu: yeniDolu,
                bekleyen: yeniBekleyen
            })
        });
        const sonuc = await response.json();
        console.log("Python'dan cevap geldi:", sonuc.durum);
    } catch (error) {
        console.warn("Python servisi kapalı olduğu için JSON güncellenemedi.");
    }

}
