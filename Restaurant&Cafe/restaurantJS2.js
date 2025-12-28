async function nilbelDurumuGuncelle() {
    const yuzdeMetni = document.getElementById('kent-yuzde');
    const dolulukBari = document.getElementById('kent-bar');
    
    try {

        const response = await fetch('Restoran2/canli_durum.json');
        if (!response.ok) throw new Error("JSON dosyası bulunamadı!");
        
        const veri = await response.json();

        const dolu = veri.dolu_masa_sayisi; 
        const toplam = veri.toplam_kapasite;
        const yuzde = Math.round((dolu / toplam) * 100);

        if (yuzdeMetni && dolulukBari) {
            yuzdeMetni.innerText = `%${yuzde}`;
            dolulukBari.style.width = `${yuzde}%`;

            if (yuzde > 80) dolulukBari.style.backgroundColor = "#e74c3c";
            else if (yuzde > 50) dolulukBari.style.backgroundColor = "#f39c12";
            else dolulukBari.style.backgroundColor = "#8dc63f";
        }
    } catch (err) {
        console.error("Veri çekme hatası:", err);
    }
}

document.addEventListener('DOMContentLoaded', nilbelDurumuGuncelle);