
document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            localStorage.setItem('user_location', JSON.stringify({
                x: pos.coords.latitude,
                y: pos.coords.longitude
            }));
        });
    }
});

function mesafeHesapla(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

window.enUygunYeriAnalizEt = async function() {
    const aiSonuc = document.getElementById('ai-sonuc');
    aiSonuc.innerHTML = "<p>🤖 En yakın ve %80 altı sakin kütüphane aranıyor...</p>";

    try {
        const yerelVeri = localStorage.getItem('kutuphane_verileri');
        if (!yerelVeri) throw new Error("Kütüphane verileri yüklenemedi. Sayfayı yenileyin.");
        
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
            aiSonuc.innerHTML = "<p>⚠️ Üzgünüm, şu an tüm kütüphaneler %80 doluluğun üzerinde!</p>";
            return;
        }

        const prompt = `Nilüfer Belediyesi asistanısın. Şu an kullanıcıya konum olarak EN YAKIN ve doluluğu %80'in altında olan yer: ${enYakin.ad}. Güncel doluluk oranı: %${enYakin.yuzde}. Burayı samimi bir dille öner ve Nilüfer'de 1 milyon kaynak olduğunu belirt.`;

        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=GOOGLE-API-KEY-SECRET", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            aiSonuc.innerHTML = `<div class="oneri-kart"><p>${data.candidates[0].content.parts[0].text}</p></div>`;
        } else {
            throw new Error("API yanıt vermedi.");
        }

    } catch (err) {
        console.error("Analiz Hatası:", err);
        aiSonuc.innerHTML = `<p style="color:red;">❌ Hata: ${err.message}</p>
        <p style="font-size:0.8rem;">İpucu: Sayfayı yenileyip tekrar deneyin.</p>`;
    }

};
