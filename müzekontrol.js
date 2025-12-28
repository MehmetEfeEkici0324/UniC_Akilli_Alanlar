document.addEventListener('DOMContentLoaded', () => {
    verileriGetir();
});

async function verileriGetir() {
    try {
        const cevap = await fetch('muzeveritabani.json');
        if (!cevap.ok) throw new Error("JSON dosyası yüklenemedi!");
        const muzeler = await cevap.json();

        muzeler.forEach(muze => {
            const kart = document.getElementById(muze.id);
            
            if (kart) {

                const dolulukYuzdesi = Math.round((muze.dolu / muze.kapasite) * 100);
                const bosKontenjan = muze.kapasite - muze.dolu;
                const doluElement = kart.querySelector('[data-val="dolu"]');
                const bosElement = kart.querySelector('[data-val="bos"]');
                const yuzdeElement = kart.querySelector('.yuzde-daire');
                const barElement = kart.querySelector('.durum-bar-doluluk');

                if (doluElement) doluElement.innerText = muze.dolu;
                if (bosElement) bosElement.innerText = bosKontenjan;
                if (yuzdeElement) yuzdeElement.innerText = `%${dolulukYuzdesi}`;
                if (barElement) {
                    barElement.style.width = `${dolulukYuzdesi}%`;
 
                    if (dolulukYuzdesi > 80) {
                        barElement.style.backgroundColor = "#e74c3c";
                    } else {
                        barElement.style.backgroundColor = "#8dc63f"; 
                    }
                }

                const erisilebilirlikElement = kart.querySelector('.erisilebilirlik-skoru');
                if (erisilebilirlikElement) erisilebilirlikElement.innerText = muze.erisilebilirlik;
            }
        });
        console.log("Müze verileri başarıyla senkronize edildi.");
    } catch (hata) {
        console.error("Hata detayı:", hata);
    }
}
