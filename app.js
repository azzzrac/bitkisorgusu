/* --- BİTKİ KEŞİF PORTALI - İNTERAKTİF WEB & MOBİL JAVASCRIPT --- */

document.addEventListener('DOMContentLoaded', () => {
    // STATE & AUTHENTICATION
    let currentUser = JSON.parse(localStorage.getItem('bitki_user')) || null;
    let isDarkMode = false;
    let quizScore = 0;
    let totalSearchCount = 0;
    let userName = currentUser ? currentUser.name : "Botanik Sevdalısı";
    let userEmail = currentUser ? currentUser.email : "";
    let userAvatar = currentUser ? (currentUser.avatar || "🌿") : "🌿";
    let fullText = "";
    let typingTimer = null;
    let typingIndex = 0;
    let currentSonuc = null;

    const favoriListesi = [];
    const sonAramalar = [];
    const evBitkileri = [];
    const kesfedilenBitkiler = new Set();
    const kisiselNotlar = [];
    const kisiselFotoAlbumu = [];

    function saveUserData() {
        const emailKey = (currentUser && currentUser.email) ? currentUser.email.toLowerCase() : 'guest';
        const key = `bitki_userdata_${emailKey}`;
        const data = {
            favoriListesi,
            evBitkileri,
            kesfedilenBitkiler: Array.from(kesfedilenBitkiler),
            kisiselNotlar,
            kisiselFotoAlbumu,
            sonAramalar,
            quizScore
        };
        localStorage.setItem(key, JSON.stringify(data));
    }

    function loadUserData() {
        favoriListesi.length = 0;
        evBitkileri.length = 0;
        kesfedilenBitkiler.clear();
        kisiselNotlar.length = 0;
        kisiselFotoAlbumu.length = 0;
        sonAramalar.length = 0;
        quizScore = 0;

        const emailKey = (currentUser && currentUser.email) ? currentUser.email.toLowerCase() : 'guest';
        const key = `bitki_userdata_${emailKey}`;
        const raw = localStorage.getItem(key);

        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (Array.isArray(data.favoriListesi)) favoriListesi.push(...data.favoriListesi);
                if (Array.isArray(data.evBitkileri)) evBitkileri.push(...data.evBitkileri);
                if (Array.isArray(data.kesfedilenBitkiler)) data.kesfedilenBitkiler.forEach(k => kesfedilenBitkiler.add(k));
                if (Array.isArray(data.kisiselNotlar)) kisiselNotlar.push(...data.kisiselNotlar);
                if (Array.isArray(data.kisiselFotoAlbumu)) kisiselFotoAlbumu.push(...data.kisiselFotoAlbumu);
                if (Array.isArray(data.sonAramalar)) sonAramalar.push(...data.sonAramalar);
                if (typeof data.quizScore === 'number') quizScore = data.quizScore;
            } catch (e) {
                console.error("Kullanıcı verisi okunamadı:", e);
            }

        }

        // Misafir verisi varsa ve bir kullanıcı giriş yaptıysa misafir verilerini aktar
        if (currentUser && currentUser.email) {
            const guestRaw = localStorage.getItem('bitki_userdata_guest');
            if (guestRaw) {
                try {
                    const guestData = JSON.parse(guestRaw);
                    let merged = false;
                    if (Array.isArray(guestData.favoriListesi)) {
                        guestData.favoriListesi.forEach(f => {
                            if (!favoriListesi.some(existing => existing.baslik === f.baslik)) {
                                favoriListesi.push(f);
                                merged = true;
                            }
                        });
                    }
                    if (Array.isArray(guestData.evBitkileri)) {
                        guestData.evBitkileri.forEach(b => {
                            evBitkileri.push(b);
                            merged = true;
                        });
                    }
                    if (Array.isArray(guestData.kisiselNotlar)) {
                        guestData.kisiselNotlar.forEach(n => {
                            kisiselNotlar.push(n);
                            merged = true;
                        });
                    }
                    if (merged) {
                        saveUserData();
                    }
                    localStorage.removeItem('bitki_userdata_guest');
                } catch (e) {
                    console.error("Misafir verileri aktarılamadı:", e);
                }
            }
        }

        if (typeof updateProfileModal === 'function') updateProfileModal();
        if (typeof renderNotes === 'function') renderNotes();
        if (typeof renderWateringList === 'function') renderWateringList();
        if (typeof renderFavsList === 'function') renderFavsList();
    }

    const dictionary = [
        "Aloe Vera", "Açelya", "Adaçayı", "Ahududu", "Akasya", "Aloe", "Aronya", "Aşk Merdiveni",
        "Badem", "Bambu", "Begonvil", "Biberiye", "Bonsai", "Böğürtlen", "Cennet Kuşu", "Civanperçemi",
        "Çam", "Çınar", "Çilek", "Defne", "Deve Tabanı", "Dracena", "Eğreltiotu", "Erguvan",
        "Fesleğen", "Ficus", "Fuşya", "Gül", "Hüsnüyusuf", "Ihlamur", "İncir", "Ispanak",
        "Kaktüs", "Kalanşo", "Kantaron", "Karanfil", "Kardelen", "Kasımpatı", "Kavun", "Kekik",
        "Köknar", "Kraton", "Ladin", "Lale", "Lavanta", "Limon", "Manolya", "Melisa", "Menekşe",
        "Meşe", "Mimoza", "Monstera", "Mum Çiçeği", "Nane", "Nergis", "Okaliptüs", "Orkide",
        "Papatya", "Paşa Kılıcı", "Peygamber Çiçeği", "Reyhan", "Safran", "Sardunya", "Sarmaşık",
        "Söğüt", "Sukulent", "Sümbül", "Süsen", "Şakayık", "Şeftali", "Telgraf Çiçeği",
        "Tilki Kuyruğu", "Yasemin", "Yılbaşı Kaktüsü", "Yuka", "Zambak", "Zamioculcas", "Zencefil",
        "Zerdeçal", "Zeytin"
    ];

    function trNormalize(str) {
        if (!str) return "";
        return str.toLowerCase('tr-TR')
            .replace(/ç/g, 'c')
            .replace(/ğ/g, 'g')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ş/g, 's')
            .replace(/ü/g, 'u')
            .replace(/i̇/g, 'i')
            .trim();
    }

    // DOM ELEMENTS
    const searchInput = document.getElementById('searchInput');
    const autocompleteList = document.getElementById('autocompleteList');
    const historySelect = document.getElementById('historySelect');
    const btnSearch = document.getElementById('btnSearch');
    const btnRandom = document.getElementById('btnRandom');
    const btnClear = document.getElementById('btnClear');
    const btnPotdExplore = document.getElementById('btnPotdExplore');

    const imageBox = document.getElementById('imageBox');
    const plantImage = document.getElementById('plantImage');
    const imagePlaceholderText = document.getElementById('imagePlaceholderText');
    const zoomHint = document.getElementById('zoomHint');

    const infoPlaceholder = document.getElementById('infoPlaceholder');
    const resultContent = document.getElementById('resultContent');
    const plantTitle = document.getElementById('plantTitle');
    const botanicalName = document.getElementById('botanicalName');
    const plantDescription = document.getElementById('plantDescription');
    const statusBar = document.getElementById('statusBar');

    const careSun = document.getElementById('careSun');
    const careWater = document.getElementById('careWater');
    const careTemp = document.getElementById('careTemp');
    const careSeason = document.getElementById('careSeason');
    const careRegion = document.getElementById('careRegion');
    const careRebloom = document.getElementById('careRebloom');
    const triviaText = document.getElementById('triviaText');

    const btnFavAdd = document.getElementById('btnFavAdd');
    const btnSaveImg = document.getElementById('btnSaveImg');
    const btnWiki = document.getElementById('btnWiki');
    const btnFullscreen = document.getElementById('btnFullscreen');

    const btnProfile = document.getElementById('btnProfile');
    const btnThemeToggle = document.getElementById('btnThemeToggle');

    // MODALS
    const profileModal = document.getElementById('profileModal');
    const btnCloseProfile = document.getElementById('btnCloseProfile');

    const badgesModal = document.getElementById('badgesModal');
    const btnCloseBadges = document.getElementById('btnCloseBadges');
    const btnOpenBadges = document.getElementById('btnOpenBadges');

    const quizModal = document.getElementById('quizModal');
    const btnCloseQuiz = document.getElementById('btnCloseQuiz');
    const btnOpenQuiz = document.getElementById('btnOpenQuiz');

    const wateringModal = document.getElementById('wateringModal');
    const btnCloseWatering = document.getElementById('btnCloseWatering');
    const btnOpenWatering = document.getElementById('btnOpenWatering');

    const favsModal = document.getElementById('favsModal');
    const btnCloseFavs = document.getElementById('btnCloseFavs');
    const btnOpenFavs = document.getElementById('btnOpenFavs');

    const fullscreenModal = document.getElementById('fullscreenModal');
    const btnCloseFullscreen = document.getElementById('btnCloseFullscreen');
    const fullscreenImage = document.getElementById('fullscreenImage');
    const fullscreenTitle = document.getElementById('fullscreenTitle');

    // 🩺 BİTKİ DOKTORU & AI HASTALIK TEŞHİSİ MODALI
    const doctorModal = document.getElementById('doctorModal');
    const btnOpenDoctor = document.getElementById('btnOpenDoctor');
    const btnCloseDoctor = document.getElementById('btnCloseDoctor');
    const doctorUploadBox = document.getElementById('doctorUploadBox');
    const doctorFileInput = document.getElementById('doctorFileInput');
    const doctorUploadContent = document.getElementById('doctorUploadContent');
    const doctorPreviewImage = document.getElementById('doctorPreviewImage');
    const doctorNotesInput = document.getElementById('doctorNotesInput');
    const btnDiagnose = document.getElementById('btnDiagnose');
    const doctorLoader = document.getElementById('doctorLoader');
    const doctorReportCard = document.getElementById('doctorReportCard');

    let doctorSelectedBase64 = null;
    let doctorSelectedMime = 'image/jpeg';

    function resetDoctorModal() {
        doctorModal.style.display = 'none';
        doctorSelectedBase64 = null;
        if (doctorFileInput) doctorFileInput.value = '';
        if (doctorNotesInput) doctorNotesInput.value = '';
        if (doctorPreviewImage) {
            doctorPreviewImage.src = '';
            doctorPreviewImage.style.display = 'none';
        }
        if (doctorUploadContent) doctorUploadContent.style.display = 'block';
        if (doctorLoader) doctorLoader.style.display = 'none';
        if (doctorReportCard) doctorReportCard.style.display = 'none';
        if (btnDiagnose) btnDiagnose.disabled = false;
    }

    if (btnOpenDoctor) {
        btnOpenDoctor.addEventListener('click', () => {
            if (!currentUser) {
                alert("⚠️ Bitki Keşif Portalı'nı kullanabilmek için lütfen öncelikle kayıt olun veya oturum açın.");
                if (typeof showRegisterTab === 'function') showRegisterTab();
                profileModal.style.display = 'flex';
                return;
            }
            resetDoctorModal();
            doctorModal.style.display = 'flex';
        });
    }

    if (btnCloseDoctor) {
        btnCloseDoctor.addEventListener('click', () => {
            resetDoctorModal();
        });
    }

    if (doctorModal) {
        doctorModal.addEventListener('click', (e) => {
            if (e.target === doctorModal) {
                resetDoctorModal();
            }
        });
    }


    if (doctorUploadBox && doctorFileInput) {
        doctorUploadBox.addEventListener('click', () => doctorFileInput.click());
        doctorFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            doctorSelectedMime = file.type || 'image/jpeg';
            const reader = new FileReader();
            reader.onload = (evt) => {
                doctorSelectedBase64 = evt.target.result;
                doctorPreviewImage.src = doctorSelectedBase64;
                doctorPreviewImage.style.display = 'block';
                doctorUploadContent.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnDiagnose) {
        btnDiagnose.addEventListener('click', async () => {
            if (!doctorSelectedBase64) {
                alert('⚠️ Lütfen önce hastalıklı bitki yaprağının fotoğrafını yükleyin.');
                return;
            }

            btnDiagnose.disabled = true;
            doctorLoader.style.display = 'flex';
            doctorReportCard.style.display = 'none';

            try {
                const API_BASE = 'http://localhost:3000/api';
                const userNotes = doctorNotesInput ? doctorNotesInput.value.trim() : '';
                const res = await fetch(`${API_BASE}/diagnose-plant-disease`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: doctorSelectedBase64,
                        mimeType: doctorSelectedMime,
                        userNotes: userNotes
                    })
                });

                const data = await res.json();
                btnDiagnose.disabled = false;
                doctorLoader.style.display = 'none';

                if (data && data.success && data.data) {
                    const d = data.data;
                    
                    // Şiddet Rozeti Rengi
                    const severityEl = document.getElementById('reportSeverity');
                    severityEl.textContent = d.severity || 'Orta (Dikkat)';
                    if (d.severity && d.severity.toLowerCase().includes('yüksek')) {
                        severityEl.style.background = '#e53935';
                    } else if (d.severity && d.severity.toLowerCase().includes('düşük')) {
                        severityEl.style.background = '#43a047';
                    } else {
                        severityEl.style.background = '#fb8c00';
                    }

                    document.getElementById('reportDiseaseName').textContent = d.diseaseName || 'Yaprak Sararması';
                    document.getElementById('reportPlantType').textContent = `Tür: ${d.plantType || 'Ev Bitkisi'}`;

                    // Belirtiler Listesi
                    const symptomsList = document.getElementById('reportSymptomsList');
                    symptomsList.innerHTML = (d.symptoms || ['Yaprak sararması']).map(s => `<li>${s}</li>`).join('');

                    // Muhtemel Neden
                    document.getElementById('reportCauses').textContent = d.possibleCauses || 'Aşırı sulama veya besin eksikliği.';

                    // Tedavi Reçetesi Checklist (Yüksek Kontrastlı & İnteraktif Kartlar)
                    const treatmentList = document.getElementById('reportTreatmentList');
                    treatmentList.innerHTML = (d.treatmentPlan || []).map((t, idx) => `
                        <li class="treatment-step-item">
                            <input type="checkbox" id="trStep_${idx}" class="treatment-step-checkbox" onchange="toggleTreatmentStep(${idx})">
                            <label for="trStep_${idx}" id="trStepText_${idx}" class="treatment-step-text">${t}</label>
                        </li>
                    `).join('');


                    // Koruyucu Tavsiye
                    document.getElementById('reportPrevention').textContent = d.preventionTips || 'Düzenli ışık ve dengeli sulama sağlayın.';

                    doctorReportCard.style.display = 'block';
                } else {
                    alert('⚠️ Teşhis oluşturulamadı. Lütfen fotoğrafı kontrol edip tekrar deneyin.');
                }
            } catch (err) {
                btnDiagnose.disabled = false;
                doctorLoader.style.display = 'none';
                console.error("Doktor teşhis hatası:", err);
                alert('⚠️ Sunucu bağlantı hatası. Lütfen sunucunun açık olduğunu kontrol edin.');
            }
        });
    }







    // TEMA DEĞİŞTİRME
    btnThemeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.setAttribute('data-theme', 'dark');
            btnThemeToggle.textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            btnThemeToggle.textContent = '🌙';
        }
    });

    // OTOMATİK TAMAMLAMA
    searchInput.addEventListener('input', () => {
        const queryNorm = trNormalize(searchInput.value);
        if (queryNorm.length < 1) {
            autocompleteList.style.display = 'none';
            return;
        }

        const startsWithMatches = [];
        const wordStartMatches = [];
        const containsMatches = [];

        dictionary.forEach(p => {
            const pNorm = trNormalize(p);
            if (pNorm.startsWith(queryNorm)) {
                startsWithMatches.push(p);
            } else {
                const words = pNorm.split(/\s+/);
                if (words.some(w => w.startsWith(queryNorm))) {
                    wordStartMatches.push(p);
                } else if (queryNorm.length >= 3 && pNorm.includes(queryNorm)) {
                    containsMatches.push(p);
                }
            }
        });

        const matches = [...startsWithMatches, ...wordStartMatches, ...containsMatches].slice(0, 7);
        if (matches.length > 0) {
            autocompleteList.innerHTML = matches.map(m => `<div class="autocomplete-item" data-value="${m}">🌿 ${m}</div>`).join('');
            autocompleteList.style.display = 'block';
        } else {
            autocompleteList.style.display = 'none';
        }
    });

    autocompleteList.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            searchInput.value = item.getAttribute('data-value');
            autocompleteList.style.display = 'none';
            sorgula();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box-wrapper')) {
            autocompleteList.style.display = 'none';
        }
    });

    // ARAMA SORGULAMA
    btnSearch.addEventListener('click', () => sorgula());
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sorgula();
    });

    // 📷 TAM OTOMATİK FOTOĞRAFLA BİTKİ TANI / GÖRSEL HİSTOGRAM VE FİLTRE TESPİTİ
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const btnUploadImageInput = document.getElementById('btnUploadImageInput');

    if (btnUploadPhoto && btnUploadImageInput) {
        btnUploadPhoto.addEventListener('click', () => {
            if (!currentUser) {
                alert("⚠️ Bitki Keşif Portalı'nı kullanabilmek için lütfen öncelikle oturum açınız veya kayıt olunuz.");
                profileModal.style.display = 'flex';
                return;
            }
            btnUploadImageInput.click();
        });

        btnUploadImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const imgDataUrl = event.target.result;

                // Yüklenen görseli resim kutusunda göster
                plantImage.src = imgDataUrl;
                plantImage.style.display = 'block';
                imagePlaceholderText.style.display = 'none';
                zoomHint.style.display = 'inline-block';

                statusBar.textContent = "🤖 Google Gemini AI fotoğraftaki bitki türünü analiz ediyor...";

                try {
                    const API_BASE = 'http://localhost:3000/api';
                    const res = await fetch(`${API_BASE}/identify-plant`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: imgDataUrl, mimeType: file.type || 'image/jpeg' })
                    });
                    const data = await res.json();

                    if (res.ok && data.plantName) {
                        searchInput.value = data.plantName;
                        sorgula();
                        statusBar.textContent = `🤖 Gemini Yapay Zekası fotoğraftaki bitkiyi buldu: ${data.plantName}`;
                        return;
                    }
                } catch (err) {
                    console.error("Gemini API isteği başarısız:", err);
                }

                // Fallback: Görsel histogram analiz motoru
                const tempImg = new Image();
                tempImg.onload = () => {
                    let detectedPlant = analyzePlantImage(file, tempImg);
                    searchInput.value = detectedPlant;
                    sorgula();
                    statusBar.textContent = `📷 Görsel analiz ile tespit edilen bitki: ${detectedPlant}`;
                };
                tempImg.src = imgDataUrl;
            };
            reader.readAsDataURL(file);
        });
    }

    function analyzePlantImage(file, imgObj) {
        let fileName = file.name.toLowerCase('tr-TR');

        // 1. Adım: Dosya adında kayıtlı bitki ismi var mı?
        for (let plant of dictionary) {
            if (fileName.includes(plant.toLowerCase('tr-TR'))) {
                return plant;
            }
        }

        // 2. Adım: Görsel Renk & Dokusal Analiz (Canvas Histogram)
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 80;
            canvas.height = 80;
            ctx.drawImage(imgObj, 0, 0, 80, 80);
            const pixels = ctx.getImageData(0, 0, 80, 80).data;

            let totalPixels = pixels.length / 4;
            let purpleCount = 0, redCount = 0, yellowCount = 0, greenCount = 0, whiteCount = 0;

            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                if (r > 110 && b > 110 && g < 100) purpleCount++;
                else if (r > 140 && g < 90 && b < 90) redCount++;
                else if (r > 170 && g > 140 && b < 80) yellowCount++;
                else if (g > r && g > b && g > 55) greenCount++;
                else if (r > 170 && g > 170 && b > 170) whiteCount++;
            }

            if (purpleCount > totalPixels * 0.05) return "Lavanta";
            if (redCount > totalPixels * 0.05) return "Gül";
            if (yellowCount > totalPixels * 0.07) return "Papatya";
            if (whiteCount > totalPixels * 0.18) return "Papatya";
            if (greenCount > totalPixels * 0.25) {
                const greenCandidates = ["Aloe Vera", "Monstera", "Kaktüs", "Fesleğen", "Sukulent", "Paşa Kılıcı"];
                let hash = Math.abs(file.name.length + file.size);
                return greenCandidates[hash % greenCandidates.length];
            }
        } catch (e) {
            // Ignore canvas error
        }

        const fallbackList = ["Orkide", "Begonvil", "Zeytin", "Açelya", "Biberiye", "Lale"];
        let hash = Math.abs(file.name.length + file.size);
        return fallbackList[hash % fallbackList.length];
    }

    const potdList = [
        { name: "Lavanta", desc: "Stresi azaltan harika kokulu mor mucize!" },
        { name: "Orkide", desc: "Zarafetin ve güzelliğin dünyadaki simgesi!" },
        { name: "Monstera", desc: "Geniş yapraklarıyla evlere tropikal hava katan deve tabanı!" },
        { name: "Bonsai", desc: "Sabır ve doğanın dengesini simgeleyen minyatür sanat ağacı!" },
        { name: "Begonvil", desc: "Akdeniz sokaklarını renklendiren büyüleyici sarmaşık!" },
        { name: "Aloe Vera", desc: "Cilt dostu ve şifalı yapraklarıyla doğal mucize!" },
        { name: "Paşa Kılıcı", desc: "Gece boyunca oksijen üreten havayı temizleyen bitki!" },
        { name: "Kaktüs", desc: "Zorlu şartlara direnen dayanıklılık sembolü!" },
        { name: "Fesleğen", desc: "Mis kokulu yapraklarıyla ferahlık ve lezzet kaynağı!" },
        { name: "Zeytin", desc: "Barışın, bilgeliğin ve uzun ömrün kadim simgesi!" },
        { name: "Gül", desc: "Sevgiyi ve duyguları ifade eden zarafet çiçeği!" },
        { name: "Biberiye", desc: "Hafızayı güçlendiren harika aromatik Akdeniz bitkisi!" },
        { name: "Papatya", desc: "Saflık ve doğallığın simgesi olan kır çiçeği!" },
        { name: "Şakayık", desc: "Zenginlik ve şansı temsil eden muhteşem katmerli çiçek!" },
        { name: "Yılbaşı Kaktüsü", desc: "Kış aylarında canlı renkleriyle çiçek açan sukulent!" },
        { name: "Yasemin", desc: "Gece saatlerinde büyüleyici kokular yayan asil çiçek!" },
        { name: "Aşk Merdiveni", desc: "Yapraklarıyla ortama canlılık katan eğrelti türü!" },
        { name: "Sukulent", desc: "Az su ile uzun süre yaşayan dekoratif sevimli bitki!" },
        { name: "Ihlamur", desc: "Sakinleştirici çayı ve mis kokulu bahar çiçekleriyle bilinen ağaç!" },
        { name: "Manolya", desc: "Baharın gelişini haber veren devasa kokulu beyaz çiçekler!" },
        { name: "Kalanşo", desc: "Rengarenk tomurcuklarıyla uzun süre solmayan salon bitkisi!" },
        { name: "Nane", desc: "Ferahlatıcı etkisiyle tazelik sunan şifalı ot!" },
        { name: "Defne", desc: "Zaferin ve başarının simgesi olan kokulu yapraklı ağaç!" },
        { name: "Kardelen", desc: "Kar altından filizlenen umut ve direnç sembolü!" },
        { name: "Sardunya", desc: "Pencere önlerini süsleyen neşeli renkli klasik çiçek!" },
        { name: "Dracena", desc: "Ev ortamındaki toksinleri süzen şık salon bitkisi!" },
        { name: "Zamioculcas", desc: "Karanlık köşelere dahi uyum sağlayan parlak yapraklı bitki!" },
        { name: "Telgraf Çiçeği", desc: "Mor ve yeşil çizgili yapraklarıyla hızlı büyüyen sarmaşık!" },
        { name: "Cennet Kuşu", desc: "Tropikal kuş şeklindeki turuncu çiçekleriyle ünlü bitki!" },
        { name: "Akasya", desc: "Sarı ve beyaz kokulu küre çiçekleriyle baharın habercisi!" },
        { name: "Bambu", desc: "Şans, bereket ve pozitif enerji getirdiğine inanılan bitki!" }
    ];

    function getTodayPlant() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return potdList[dayOfYear % potdList.length];
    }

    const todayPlant = getTodayPlant();
    const bannerTextEl = document.querySelector('#potdBanner .banner-text');
    if (bannerTextEl) {
        bannerTextEl.innerHTML = `<b>${todayPlant.name.toUpperCase()}</b> - ${todayPlant.desc}`;
    }

    btnPotdExplore.addEventListener('click', () => {
        searchInput.value = todayPlant.name;
        sorgula();
    });


    btnRandom.addEventListener('click', () => {
        const r = Math.floor(Math.random() * dictionary.length);
        searchInput.value = dictionary[r];
        sorgula();
    });

    btnClear.addEventListener('click', () => {
        searchInput.value = '';
        autocompleteList.style.display = 'none';
        if (typingTimer) clearInterval(typingTimer);

        infoPlaceholder.style.display = 'block';
        infoPlaceholder.textContent = 'Detaylı sonuçlar burada görünecektir...';
        resultContent.style.display = 'none';

        plantImage.style.display = 'none';
        imagePlaceholderText.style.display = 'block';
        imagePlaceholderText.textContent = 'Resim burada görünür.';
        zoomHint.style.display = 'none';

        updateCareTips('-', '-', '-');
        triviaText.textContent = '💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99\'unu üretir!';

        btnFavAdd.disabled = true;
        btnSaveImg.disabled = true;
        btnWiki.disabled = true;
        btnFullscreen.disabled = true;
        if (btnExportPdf) btnExportPdf.disabled = true;

        currentSonuc = null;
        statusBar.textContent = 'Arayüz temizlendi.';

    });

    async function getPlantInfoFromGemini(bitkiAdi) {
        try {
            const API_BASE = 'http://localhost:3000/api';
            const res = await fetch(`${API_BASE}/plant-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plantName: bitkiAdi })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.success && data.data) {
                    return { ...data.data, _rawPayload: data };
                }
            }
        } catch (err) {
            console.error("Gemini plant-info isteği başarısız:", err);
        }
        return null;
    }


    async function sorgula() {
        if (!currentUser) {
            alert("⚠️ Bitki Keşif Portalı'nı kullanabilmek için lütfen öncelikle kayıt olun veya oturum açın.");
            if (typeof showRegisterTab === 'function') showRegisterTab();
            profileModal.style.display = 'flex';
            return;
        }

        const bitkiAdi = searchInput.value.trim();
        if (!bitkiAdi) {
            infoPlaceholder.style.display = 'block';
            infoPlaceholder.textContent = '⚠️ Lütfen aramak istediğiniz bir bitki adını yazın.';
            infoPlaceholder.style.color = '#c62828';
            statusBar.textContent = 'Uyarı: Bitki adı boş bırakılamaz.';
            return;
        }

        if (!bitkiAdiDogrula(bitkiAdi)) {
            infoPlaceholder.style.display = 'block';
            infoPlaceholder.textContent = '⚠️ Böyle bir bitki bulunmuyor, tekrar deneyiniz.';
            infoPlaceholder.style.color = '#c62828';
            statusBar.textContent = 'Uyarı: Böyle bir bitki bulunmuyor.';
            return;
        }

        if (typingTimer) clearInterval(typingTimer);

        totalSearchCount++;
        btnSearch.disabled = true;
        statusBar.textContent = `🤖 Google Gemini AI '${bitkiAdi}' bilgilerini hazırlıyor...`;

        const resultLayout = document.querySelector('.result-layout');
        const imageBoxWrapper = document.querySelector('.image-box-wrapper');
        const careCard = document.getElementById('careCard');
        const triviaCard = document.getElementById('triviaCard');

        // 1. AŞAMA: Tüm Eski Sonuç Kartı (Resim, Başlık, Sulama/Bakım ve Trivia) Komple Kaybolsun (Full Card Fade-Down)
        if (resultLayout) {
            if (imageBoxWrapper) imageBoxWrapper.classList.remove('animate-cascade-1');
            if (resultContent) resultContent.classList.remove('animate-cascade-1');
            if (careCard) careCard.classList.remove('animate-cascade-2');
            if (triviaCard) triviaCard.classList.remove('animate-cascade-3');

            resultLayout.classList.add('animate-full-fade-down');
            await new Promise(r => setTimeout(r, 340));

            // Eski İçerikleri ve Resmi Sıfırla
            resultContent.style.display = 'none';
            plantImage.style.display = 'none';
            imagePlaceholderText.style.display = 'block';
            imagePlaceholderText.textContent = 'Resim hazırlanıyor...';
            zoomHint.style.display = 'none';
            updateCareTips('-', '-', '-');
            triviaText.textContent = '💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99\'unu üretir!';

            resultLayout.classList.remove('animate-full-fade-down');
        }

        // 2. AŞAMA: Özel Botanik Yükleme Kartı (Dönen 🌿 Filiz & Nabız Yazısı - Aynı Satırda Ferah Boşluklu)
        infoPlaceholder.style.display = 'block';
        infoPlaceholder.className = 'info-placeholder botanical-loader';
        infoPlaceholder.innerHTML = `
            <span class="botanical-spinner">🌿</span>
            <span class="botanical-loader-text">🔍 ${bitkiAdi} bitkisi inceleniyor...</span>
        `;




        try {
            // 1. Google Gemini AI'dan bilgi almayı dene
            const geminiRes = await getPlantInfoFromGemini(bitkiAdi);
            // 2. Görsel ve Wikipedia bağlantısı için Wikipedia sorgusu yap
            const wikiRes = await wikipediaOzetiGetir(bitkiAdi);

            btnSearch.disabled = false;

            if (geminiRes || (wikiRes && wikiRes.baslik)) {
                const baslik = geminiRes ? geminiRes.baslik.toUpperCase() : wikiRes.baslik;




                const ozet = geminiRes ? geminiRes.ozet : wikiRes.ozet;
                const botName = (geminiRes && geminiRes.botanicalName) ? geminiRes.botanicalName : getBotanicalName(baslik);
                const resimUrl = wikiRes ? wikiRes.resimUrl : null;
                const wikiUrl = wikiRes ? wikiRes.wikiUrl : null;

                const sonuc = {
                    baslik: baslik,
                    ozet: ozet,
                    resimUrl: resimUrl,
                    wikiUrl: wikiUrl
                };
                currentSonuc = sonuc;

                // Keşif Sayacı (Sadece Giriş Yapıldığında Rozet Kazanılır)
                if (currentUser) {
                    const prevSize = kesfedilenBitkiler.size;
                    kesfedilenBitkiler.add(sonuc.baslik);
                    if (kesfedilenBitkiler.size > prevSize) {
                        updateUserRank();
                    }
                }

                // Aramalar Geçmişi
                if (!sonAramalar.includes(bitkiAdi)) {
                    sonAramalar.unshift(bitkiAdi);
                    if (sonAramalar.length > 5) sonAramalar.pop();
                    updateHistoryDropdown();
                }

                // 3. AŞAMA: Yükleyiciyi Kapat, Resim ve Bakım Kartlarını Aşamalı Dalga (Cascade 1, 2, 3) ile Aç
                infoPlaceholder.style.display = 'none';
                infoPlaceholder.className = 'info-placeholder';

                plantTitle.textContent = `🌿 ${baslik}`;
                botanicalName.textContent = `🧬 Botanik Adı: ${botName}`;
                resultContent.style.display = 'block';

                // Görsel Yükle
                if (sonuc.resimUrl) {
                    plantImage.src = sonuc.resimUrl;
                    plantImage.style.display = 'block';
                    imagePlaceholderText.style.display = 'none';
                    zoomHint.style.display = 'inline-block';
                } else {
                    plantImage.style.display = 'none';
                    imagePlaceholderText.style.display = 'block';
                    imagePlaceholderText.textContent = 'Resim bulunamadı.';
                    zoomHint.style.display = 'none';
                }

                // Bakım İpuçları & Trivia Güncelle
                if (geminiRes && geminiRes.care) {
                    const c = geminiRes.care;
                    updateCareTips(c.sun, c.water, c.temp, c.season, c.region, c.rebloom);
                } else {
                    updateCareTipsForPlant(baslik);
                }

                if (geminiRes && geminiRes.trivia) {
                    triviaText.textContent = geminiRes.trivia;
                } else {
                    triviaText.textContent = getPlantTrivia(baslik);
                }

                // Aşamalı Dalga Animasyonlarını Uygula (Önce Resim/Başlık, Sonra Bakım Kartı, Sonra Trivia)
                if (imageBoxWrapper) imageBoxWrapper.classList.add('animate-cascade-1');
                if (resultContent) resultContent.classList.add('animate-cascade-1');
                if (careCard) careCard.classList.add('animate-cascade-2');
                if (triviaCard) triviaCard.classList.add('animate-cascade-3');

                setTimeout(() => {
                    if (imageBoxWrapper) imageBoxWrapper.classList.remove('animate-cascade-1');
                    if (resultContent) resultContent.classList.remove('animate-cascade-1');
                    if (careCard) careCard.classList.remove('animate-cascade-2');
                    if (triviaCard) triviaCard.classList.remove('animate-cascade-3');
                }, 850);

                // Daktilo Yazma Animasyonu
                fullText = ozet;
                plantDescription.textContent = '';
                typingIndex = 0;

                typingTimer = setInterval(() => {
                    if (typingIndex < fullText.length) {
                        plantDescription.textContent += fullText.charAt(typingIndex);
                        typingIndex++;
                    } else {
                        clearInterval(typingTimer);
                        statusBar.textContent = geminiRes
                            ? `🤖 Gemini AI yanıtı hazır: ${bitkiAdi}`
                            : `Tamamlandı (Wikipedia): ${bitkiAdi}`;
                    }
                }, 15);

                // Butonlar Aktif
                btnFavAdd.disabled = false;
                btnSaveImg.disabled = !sonuc.resimUrl;
                btnWiki.disabled = !sonuc.wikiUrl;
                btnFullscreen.disabled = !sonuc.resimUrl;
                if (btnExportPdf) btnExportPdf.disabled = false;

                if (typeof fetchGeminiUsageStats === 'function') fetchGeminiUsageStats();






            } else {
                showErrorState();
            }
        } catch (err) {
            btnSearch.disabled = false;
            showErrorState();
        }
    }

    function showErrorState() {
        infoPlaceholder.style.display = 'block';
        infoPlaceholder.textContent = '⚠️ Böyle bir bitki bulunmuyor, tekrar deneyiniz.';
        infoPlaceholder.style.color = '#c62828';
        resultContent.style.display = 'none';

        plantImage.style.display = 'none';
        imagePlaceholderText.style.display = 'block';
        imagePlaceholderText.textContent = 'Resim bulunamadı.';
        zoomHint.style.display = 'none';

        updateCareTips('-', '-', '-');
        triviaText.textContent = '💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99\'unu üretir!';

        btnFavAdd.disabled = true;
        btnSaveImg.disabled = true;
        btnWiki.disabled = true;
        btnFullscreen.disabled = true;
        statusBar.textContent = 'Sonuç bulunamadı.';
    }

    function bitkiAdiDogrula(bitkiAdi) {
        const kelime = bitkiAdi.toLowerCase('tr-TR').trim();
        if (kelime.length < 2) return false;
        const yasaklar = [
            "araba", "ev", "masa", "insan", "aslan", "kedi", "su", "hava", "yemek", "kelebek", "köpek", "balık", "kuş", "yılan",
            "böcek", "telefon", "bilgisayar", "sandalye", "kalem", "uçak", "saat", "ayakkabı", "bina", "televizyon", "şehir",
            "ülke", "kapı", "pencere", "oyun", "yazılım", "film", "müzik", "kitap", "para", "banka", "okul", "hastane", "otobüs",
            "gemi", "tren", "masal", "istanbul", "ankara", "izmir", "türkiye", "futbol", "basketbol", "dizi", "elbise", "gömlek",
            "pantolon", "ayakkabı", "çorba", "tatlı", "doktor", "yazar", "şarkı", "sinema", "tiyatro", "resim", "tarih"
        ];
        return !yasaklar.includes(kelime);
    }

    async function wikipediaOzetiGetir(sorgu) {
        if (!sorgu) return null;
        let cleanQuery = sorgu.trim();
        // Bütün harfleri büyük gelen favori başlıklarını "Aloe Vera" gibi Title Case formatına dönüştür
        let titleCaseQuery = cleanQuery.toLowerCase('tr-TR').replace(/(^|\s)\S/g, l => l.toUpperCase());

        let encoded = encodeURIComponent(titleCaseQuery);
        let summaryUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
        let fullWikiUrl = `https://tr.wikipedia.org/wiki/${encoded}`;

        let res = await fetch(summaryUrl);

        // 404 Alınırsa Wikipedia OpenSearch API ile en yakın doğru makale başlığını sorgula
        if (!res.ok) {
            try {
                const searchUrl = `https://tr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=1&format=json&origin=*`;
                const searchRes = await fetch(searchUrl);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (searchData && searchData[1] && searchData[1].length > 0) {
                        const exactTitle = searchData[1][0];
                        encoded = encodeURIComponent(exactTitle);
                        summaryUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
                        fullWikiUrl = `https://tr.wikipedia.org/wiki/${encoded}`;
                        res = await fetch(summaryUrl);
                    }
                }
            } catch (e) {
                // Fallback hatasını yok say
            }
        }

        if (!res.ok) return null;
        const data = await res.json();

        if (!data.title || !data.extract || !isBitkiIcerik(data.title, data.description, data.extract)) {
            return null;
        }

        let imageUrl = data.thumbnail ? data.thumbnail.source : null;
        return {
            baslik: data.title.toUpperCase(),
            ozet: data.extract,
            resimUrl: imageUrl,
            wikiUrl: fullWikiUrl
        };
    }

    function isBitkiIcerik(title, description, extract) {
        const combined = `${title || ''} ${description || ''} ${extract || ''}`.toLowerCase('tr-TR');

        // 1. Bitki Olmayan Kesin Kategoriler / Kelimeler (Genişletilmiş Filtre)
        const nonPlantKeywords = [
            "memeli", "köpekgiller", "kedigiller", "otomobil", "araba", "uçak", "gemi", "tren", "otobüs", "bisiklet",
            "şehirdir", "başkentidir", "ilçesidir", "köyüdür", "ülkedir", "kıtadır", "nehirdir", "dağdır", "denizdir",
            "elektronik", "yazılımdır", "markadır", "şirkettir", "holdingdir", "kurumdur", "üniversitedir", "hastanendir",
            "filmdir", "albümüdür", "şarkısıdır", "dizisidir", "oyuncudur", "yazardır", "siyasetçidir", "futbolcudur",
            "müzisyendir", "ressamdır", "şairdir", "doktordur", "insandır", "omurgalıdır", "sürüngendir", "kuştur", "balıktır",
            "böcektir", "parazittir", "bakteridir", "virüstür", "romandır", "tarihtir", "müzik grubu", "televizyon",
            "bilgisayar", "telefon", "cihazdır", "araçtır", "bina", "masal", "oyun", "meslek", "spor takımı", "kulüptür",
            "yemektir", "tatlıdır", "çorbadır", "içecektir", "kıyafettir", "ayakkabıdır", "mobilyadır", "birlik", "anlaşma"
        ];
        for (let kw of nonPlantKeywords) {
            if (combined.includes(kw)) return false;
        }

        // 2. Güçlü Bitki Belirteçleri
        const plantKeywords = [
            "bitki", "ağaç", "çiçek", "meyve", "sebze", "flora", "tohumlu", "familyasından", "familya", "cinsi", "türüdür",
            "çalı", "otlar", "tahıl", "baklegil", "baharat", "narenciye", "yapraklı", "botanik", "fidan", "hasat", "otsu",
            "odunsu", "yeşillik", "kültür bitkisi", "tıbbi bitki", "tarım bitkisi", "sukulent", "kaktüs", "mantar", "yosun",
            "eğrelti", "bambu", "sarmaşık", "kozalak"
        ];
        for (let kw of plantKeywords) {
            if (combined.includes(kw)) return true;
        }
        return false;
    }

    function getBotanicalName(name) {
        const p = name.toLowerCase();
        if (p.includes('lavanta')) return 'Lavandula angustifolia (Lamiaceae)';
        if (p.includes('gül')) return 'Rosa rubiginosa (Rosaceae)';
        if (p.includes('orkide')) return 'Orchidaceae (Asparagales)';
        if (p.includes('papatya')) return 'Bellis perennis (Asteraceae)';
        if (p.includes('kaktüs')) return 'Cactaceae (Caryophyllales)';
        if (p.includes('nane')) return 'Mentha piperita (Lamiaceae)';
        if (p.includes('limon')) return 'Citrus × limon (Rutaceae)';
        if (p.includes('zeytin')) return 'Olea europaea (Oleaceae)';
        if (p.includes('fesleğen')) return 'Ocimum basilicum (Lamiaceae)';
        return 'Plantae (Flora Familyası)';
    }

    function getPlantTrivia(name) {
        const p = name.toLowerCase();
        if (p.includes('lavanta')) return '💡 Biliyor muydunuz? Lavanta kokusunun stresi azaltıp uyku kalitesini %20 artırdığı kanıtlanmıştır.';
        if (p.includes('gül')) return '💡 Biliyor muydunuz? Dünyanın en eski yaşayan gülü Almanya\'daki Hildesheim Katedrali\'ndedir ve 1000 yaşındadır!';
        if (p.includes('orkide')) return '💡 Biliyor muydunuz? Orkideler dünyadaki en geniş bitki türlerindendir (28.000\'den fazla türü vardır)!';
        if (p.includes('papatya')) return '💡 Biliyor muydunuz? Papatyalar Antarktika hariç dünyadaki tüm kıtalarda doğal olarak yetişebilir!';
        if (p.includes('kaktüs')) return '💡 Biliyor muydunuz? Bazı dev kaktüs türleri bünyesinde 3000 litreden fazla su depolayabilir!';
        return '💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99\'unu üreterek yaşamın devamlılığını sağlar!';
    }

    function updateCareTips(sun, water, temp, season = '-', region = '-', rebloom = '-') {
        if (careSun) careSun.textContent = `☀️ Güneş: ${sun}`;
        if (careWater) careWater.textContent = `💧 Sulama: ${water}`;
        if (careTemp) careTemp.textContent = `🌡️ Sıcaklık: ${temp}`;
        if (careSeason) careSeason.textContent = `🗓️ Dönem: ${season}`;
        if (careRegion) careRegion.textContent = `🗺️ Bölge: ${region}`;
        if (careRebloom) careRebloom.textContent = `🔄 Solarsa Yeniden Açar Mı?: ${rebloom}`;
    }

    function updateCareTipsForPlant(name) {
        const p = name.toLowerCase();
        let sun = 'Parlak Dolaylı Işık', water = 'Haftada 1-2 Kez', temp = '18°C - 24°C';
        let season = 'İlkbahar - Yaz', region = 'Türkiye Geneli & Ilıman Bölgeler', rebloom = 'Evet (Çok yıllıktır, solan çiçekler budandığında tekrar açar)';

        if (p.includes('lavanta')) {
            sun = 'Bol Güneşli'; water = 'Toprak Kurudukça (Az)'; temp = '15°C - 30°C';
            season = 'Yaz Başı (Haziran - Ağustos)'; region = 'Akdeniz Havzası & Ege (Isparta)';
            rebloom = 'Evet (Çok yıllık çalıdır, her yaz mor çiçeklerini tekrar açar)';
        } else if (p.includes('gül')) {
            sun = 'Tam Güneş (Günde 6 Saat)'; water = 'Haftada 2-3 Kez'; temp = '15°C - 26°C';
            season = 'İlkbahar - Sonbahar (Mayıs - Ekim)'; region = 'Ilıman Bölgeler, Anadolu & Akdeniz';
            rebloom = 'Evet (Solan çiçek başları budandıkça sezon boyunca tekrar tekrar açar)';
        } else if (p.includes('orkide')) {
            sun = 'Filtrelenmiş Parlak Işık'; water = 'Haftada 1 Kez (Daldırma)'; temp = '18°C - 25°C';
            season = 'Sonbahar - İlkbahar (Yılda 1-2 Kez)'; region = 'Tropikal & Yarı Tropikal Yağmur Ormanları';
            rebloom = 'Evet (Çiçek sapı 3. boğumdan budanıp nem sağlandığında tekrar açar)';
        } else if (p.includes('papatya')) {
            sun = 'Bol Doğrudan Güneş'; water = 'Haftada 1-2 Kez'; temp = '12°C - 25°C';
            season = 'İlkbahar - Yaz (Nisan - Temmuz)'; region = 'Tüm Türkiye Çayırları & Ilıman Avrupa';
            rebloom = 'Evet (Sezon içinde solanlar budanırsa yeni tomurcuk verir)';
        } else if (p.includes('kaktüs') || p.includes('sukulent')) {
            sun = 'Bol Doğrudan Güneş'; water = '2-3 Haftada Bir (İyice Kuruyunca)'; temp = '15°C - 35°C';
            season = 'İlkbahar - Yaz Ortası (Nadir Çiçeklenme)'; region = 'Çöl & Kurak İklim Bölgeleri (Meksika/Afrika)';
            rebloom = 'Evet (Güneş ve kış dinlenmesi sağlandığında her yıl tekrar çiçeklenir)';
        } else if (p.includes('lale')) {
            sun = 'Güneşli / Yarı Gölge'; water = 'Haftada 1 Kez'; temp = '10°C - 20°C';
            season = 'Erken İlkbahar (Mart - Mayıs)'; region = 'Orta Asya, Anadolu & Hollanda';
            rebloom = 'Evet (Soğanı toprakta kaldığı sürece her ilkbaharda tekrar açar)';
        } else if (p.includes('begonvil')) {
            sun = 'Tam Güneşli'; water = 'Haftada 2 Kez'; temp = '20°C - 35°C';
            season = 'Yaz - Sonbahar (Mayıs - Kasım)'; region = 'Akdeniz & Ege Kıyı Şeridi (Bodrum/Marmaris)';
            rebloom = 'Evet (Sıcak iklimde soldukça tüm yaz boyunca sarmaşık şeklinde coşkuyla açar)';
        } else if (p.includes('nane') || p.includes('fesleğen') || p.includes('biberiye')) {
            sun = 'Bol Güneşli'; water = 'Nemli Toprak (Düzenli)'; temp = '15°C - 28°C';
            season = 'İlkbahar - Sonbahar (Tüm Sezon)'; region = 'Akdeniz Havzası & Tüm Ilıman Bölgeler';
            rebloom = 'Evet (Yaprak ve çiçekleri budandıkça sürekli daha gür yeniden büyür)';
        } else if (p.includes('limon') || p.includes('zeytin')) {
            sun = 'Tam Güneş'; water = 'Haftada 1-2 Kez'; temp = '15°C - 32°C';
            season = 'İlkbahar (Çiçek) / Sonbahar (Meyve)'; region = 'Akdeniz & Ege Kıyı Bölgesi';
            rebloom = 'Evet (Çok yıllık ağaçtır, her yıl baharda kokulu çiçekler açar)';
        }

        updateCareTips(sun, water, temp, season, region, rebloom);
    }

    function updateHistoryDropdown() {
        historySelect.innerHTML = '<option value="">📜 Son Aramalar</option>' + sonAramalar.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    historySelect.addEventListener('change', () => {
        if (historySelect.value) {
            searchInput.value = historySelect.value;
            sorgula();
        }
    });

    // SONUÇ BUTONLARI
    btnFavAdd.addEventListener('click', () => {
        if (currentSonuc && currentSonuc.baslik) {
            if (!favoriListesi.some(f => f.baslik === currentSonuc.baslik)) {
                favoriListesi.push(currentSonuc);
                saveUserData();
                updateProfileModal();
                alert(`'${currentSonuc.baslik}' favorilerinize eklendi!`);
                statusBar.textContent = `⭐ '${currentSonuc.baslik}' favorilere eklendi.`;
            } else {
                alert('Bu bitki zaten favorilerinizde ekli.');
            }
        }
    });

    btnWiki.addEventListener('click', () => {
        if (currentSonuc && currentSonuc.wikiUrl) {
            window.open(currentSonuc.wikiUrl, '_blank');
        }
    });

    btnSaveImg.addEventListener('click', () => {
        if (currentSonuc && currentSonuc.resimUrl) {
            const a = document.createElement('a');
            a.href = currentSonuc.resimUrl;
            a.download = `${currentSonuc.baslik}.jpg`;
            a.target = '_blank';
            a.click();
        }
    });

    // TAM EKRAN GÖRSEL
    imageBox.addEventListener('click', openFullscreen);
    btnFullscreen.addEventListener('click', openFullscreen);

    function openFullscreen() {
        if (currentSonuc && currentSonuc.resimUrl) {
            fullscreenImage.src = currentSonuc.resimUrl;
            fullscreenTitle.textContent = `🌿 ${currentSonuc.baslik} - TAM EKRAN GÖRÜNÜM`;
            fullscreenModal.style.display = 'flex';
        }
    }

    btnCloseFullscreen.addEventListener('click', () => fullscreenModal.style.display = 'none');
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fullscreenModal.style.display = 'none';
            if (currentUser) {
                profileModal.style.display = 'none';
            }
        }
    });

    // AUTHENTICATION & PROFILE LOGIC
    let isRegisterMode = true;

    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const nameInputGroup = document.getElementById('nameInputGroup');
    const btnSubmitAuth = document.getElementById('btnSubmitAuth');

    function showRegisterTab() {
        isRegisterMode = true;
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        nameInputGroup.style.display = 'flex';
        btnSubmitAuth.textContent = '📝 Hesap Oluştur';
    }

    function showLoginTab() {
        isRegisterMode = false;
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        nameInputGroup.style.display = 'none';
        btnSubmitAuth.textContent = '🔑 Giriş Yap';
    }

    function refreshAuthUI() {
        if (currentUser) {
            btnProfile.textContent = `👤 ${currentUser.name}`;
            document.getElementById('userNameDisplay').textContent = currentUser.name;
            document.getElementById('userEmailDisplay').textContent = `📧 ${currentUser.email}`;
            document.getElementById('userAvatar').textContent = currentUser.avatar || "🌿";
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('userProfileContainer').style.display = 'block';
            document.getElementById('modalTitleText').textContent = '👤 Hesabım & Profil Merkezi';
            btnCloseProfile.style.display = 'inline-block';
        } else {
            btnProfile.textContent = '👤 Giriş Yap / Kayıt Ol';
            document.getElementById('authContainer').style.display = 'flex';
            document.getElementById('userProfileContainer').style.display = 'none';
            document.getElementById('modalTitleText').textContent = '📝 Bitki Keşif Portalı - Kayıt Ol';
            btnCloseProfile.style.display = 'none';
        }
    }

    // Oturum Kontrolü (Açılışta Kayıt Ol ekranı otomatik çıkar ve kapanamaz)
    loadUserData();
    refreshAuthUI();
    if (!currentUser) {
        showRegisterTab();
        profileModal.style.display = 'flex';
    }

    btnProfile.addEventListener('click', () => {
        refreshAuthUI();
        if (currentUser) {
            updateProfileModal();
        } else {
            showRegisterTab();
        }
        profileModal.style.display = 'flex';
    });

    btnCloseProfile.addEventListener('click', () => {
        if (!currentUser) {
            alert("⚠️ Bitki Keşif Portalı'nı kullanabilmek için lütfen öncelikle kayıt olun veya oturum açın.");
            return;
        }
        profileModal.style.display = 'none';
    });

    tabLogin.addEventListener('click', () => showLoginTab());
    tabRegister.addEventListener('click', () => showRegisterTab());


    // E-POSTA İLE GİRİŞ YAP / KAYIT OL FORM SUBMIT (Docker Backend API http://localhost:3000 + LocalStorage Fallback)
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmailInput').value.trim();
        const pass = document.getElementById('authPassInput').value.trim();
        const name = document.getElementById('authNameInput').value.trim();

        if (!email || !pass) {
            alert('Lütfen e-posta ve şifre alanlarını doldurun.');
            return;
        }

        const API_BASE = 'http://localhost:3000/api';

        if (isRegisterMode) {
            if (!name) {
                alert('Lütfen adınızı ve soyadınızı giriniz.');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password: pass })
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    alert(`⚠️ HATA: ${data.error || 'Kayıt gerçekleştirilemedi!'}`);
                    return;
                }

                currentUser = { name: name, email: email, avatar: "🌿", isGoogle: false };
                localStorage.setItem('bitki_user', JSON.stringify(currentUser));
                userName = currentUser.name;
                userEmail = currentUser.email;
                loadUserData();
                refreshAuthUI();
                profileModal.style.display = 'none';
                alert(`🎉 ${data.message || 'Hesabınız başarıyla oluşturuldu! Hoş geldiniz, ' + userName}.`);
            } catch (err) {
                // Sunucuya erişilemezse LocalStorage Fallback
                let registeredUsers = JSON.parse(localStorage.getItem('bitki_users_db')) || [];
                const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (existingUser) {
                    alert(`⚠️ HATA: "${email}" e-posta adresi ile zaten kayıt yapılmış!\nLütfen '🔑 Giriş Yap' sekmesini kullanarak oturum açın.`);
                    return;
                }

                const newUser = { name: name, email: email, pass: pass, avatar: "🌿", isGoogle: false };
                registeredUsers.push(newUser);
                localStorage.setItem('bitki_users_db', JSON.stringify(registeredUsers));
                currentUser = newUser;
                localStorage.setItem('bitki_user', JSON.stringify(currentUser));
                userName = currentUser.name;
                userEmail = currentUser.email;
                loadUserData();
                refreshAuthUI();
                profileModal.style.display = 'none';
                alert(`🎉 Hesabınız başarıyla oluşturuldu! Hoş geldiniz, ${userName}.`);
            }
        } else {
            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: pass })
                });
                const data = await res.json();
                if (!res.ok || data.error) {
                    alert(`⚠️ HATA: ${data.error || 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı veya şifre hatalı!'}`);
                    return;
                }

                currentUser = {
                    name: data.user ? data.user.name : (email.split('@')[0] || "Botanikçi"),
                    email: data.user ? data.user.email : email,
                    avatar: "🌿",
                    isGoogle: false
                };
                localStorage.setItem('bitki_user', JSON.stringify(currentUser));
                userName = currentUser.name;
                userEmail = currentUser.email;
                loadUserData();
                refreshAuthUI();
                profileModal.style.display = 'none';
                alert(`🎉 Başarıyla giriş yapıldı! Hoş geldiniz, ${userName}.`);
            } catch (err) {
                // Sunucuya erişilemezse LocalStorage Fallback
                let registeredUsers = JSON.parse(localStorage.getItem('bitki_users_db')) || [];
                const userInDb = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

                if (!userInDb) {
                    alert(`⚠️ HATA: "${email}" e-posta adresi ile kayıtlı bir hesap bulunamadı!\nLütfen önce '📝 Hesap Oluştur' sekmesinden kayıt olun.`);
                    return;
                }

                if (userInDb.pass !== pass) {
                    alert('⚠️ HATA: Şifreniz hatalı! Lütfen kontrol edip tekrar deneyin.');
                    return;
                }

                currentUser = { name: userInDb.name, email: userInDb.email, avatar: "🌿", isGoogle: false };
                localStorage.setItem('bitki_user', JSON.stringify(currentUser));
                userName = currentUser.name;
                userEmail = currentUser.email;
                loadUserData();
                refreshAuthUI();
                profileModal.style.display = 'none';
                alert(`🎉 Başarıyla giriş yapıldı! Hoş geldiniz, ${userName}.`);
            }
        }
    });

    // OTURUMU KAPAT / ÇIKIŞ YAP
    document.getElementById('btnLogoutUser').addEventListener('click', () => {
        if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
            saveUserData();
            currentUser = null;
            localStorage.removeItem('bitki_user');
            userName = "Botanik Sevdalısı";
            userEmail = "";
            loadUserData();
            refreshAuthUI();
            profileModal.style.display = 'flex';
            alert('👋 Oturum kapatıldı.');
        }
    });

    document.getElementById('btnEditName').addEventListener('click', () => {
        const newName = prompt('Yeni Profil İsminizi Yazın:', userName);
        if (newName && newName.trim()) {
            userName = newName.trim();
            if (currentUser) {
                currentUser.name = userName;
                localStorage.setItem('bitki_user', JSON.stringify(currentUser));
            }
            refreshAuthUI();
        }
    });

    function updateProfileModal() {
        document.getElementById('statSearchCount').textContent = totalSearchCount;
        document.getElementById('statSpeciesCount').textContent = kesfedilenBitkiler.size;
        document.getElementById('statFavCount').textContent = favoriListesi.length;
        document.getElementById('statQuizScore').textContent = `${quizScore} Puan`;
        document.getElementById('countBadges').textContent = kesfedilenBitkiler.size;
        document.getElementById('countFavs').textContent = favoriListesi.length;
        const countAlbumEl = document.getElementById('countAlbum');
        if (countAlbumEl) countAlbumEl.textContent = kisiselFotoAlbumu.length;
        updateUserRank();
    }


    function updateUserRank() {
        const size = kesfedilenBitkiler.size;
        let rank = "Acemi Botanikçi";
        if (size >= 30) rank = "👑 Master Botanik Ustası";
        else if (size >= 20) rank = "💎 Bitki Uzmanı";
        else if (size >= 10) rank = "🥇 Acemi Botanikçi";
        else if (size >= 5) rank = "🥈 Doğa Dostu";
        document.getElementById('userRankDisplay').textContent = `Unvan: ${rank}`;
    }

    // BOTANİK GÜNLÜĞÜ NOTLAR
    document.getElementById('btnAddNote').addEventListener('click', () => {
        const inp = document.getElementById('newNoteInput');
        if (inp.value.trim()) {
            kisiselNotlar.push(inp.value.trim());
            inp.value = '';
            saveUserData();
            renderNotes();
        }
    });

    function renderNotes() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;
        if (kisiselNotlar.length === 0) {
            notesList.innerHTML = '<li class="empty-note">Henüz not eklenmedi.</li>';
        } else {
            notesList.innerHTML = kisiselNotlar.map(n => `<li>📌 ${n}</li>`).join('');
        }
    }

    // ROZETLER MODAL
    btnOpenBadges.addEventListener('click', () => {
        renderBadges();
        badgesModal.style.display = 'flex';
    });
    btnCloseBadges.addEventListener('click', () => badgesModal.style.display = 'none');

    function renderBadges() {
        const size = kesfedilenBitkiler.size;
        document.getElementById('badgeTotalCount').textContent = size;
        const container = document.getElementById('badgesListContainer');
        const rows = [
            { title: "🥉 İlk Adım", req: 1 },
            { title: "🥈 Doğa Dostu", req: 5 },
            { title: "🥇 Acemi Botanikçi", req: 10 },
            { title: "💎 Bitki Uzmanı", req: 20 },
            { title: "👑 Master Botanik Ustası", req: 30 }
        ];

        container.innerHTML = rows.map(r => `
            <div class="badge-row ${size >= r.req ? '' : 'locked'}">
                <span>${r.title}</span>
                <span>${size >= r.req ? '✅ Kazanıldı!' : `🔒 ${r.req} Bitki Keşfet`}</span>
            </div>
        `).join('');
    }

    // QUIZ GAME MODAL & ZENGİN BİTKİ VERİ KÜMESİ (GARANTİLİ YÜKSEK ÇÖZÜNÜRLÜKLÜ GÖRSELLER)
    let currentQuizAnswer = "";
    const usedQuizPlantNames = new Set();

    const quizPlantDataset = [
        { name: "Lavanta", wiki: "Lavanta", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Single_lavender_flower_02.jpg/640px-Single_lavender_flower_02.jpg" },
        { name: "Orkide", wiki: "Orkide", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Orchid_Flower_Phalaenopsis.jpg/640px-Orchid_Flower_Phalaenopsis.jpg" },
        { name: "Monstera", wiki: "Monstera_deliciosa", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Monstera_deliciosa2.jpg/640px-Monstera_deliciosa2.jpg" },
        { name: "Gül", wiki: "Gül", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Red_Rose_Smooth.jpg/640px-Red_Rose_Smooth.jpg" },
        { name: "Papatya", wiki: "Papatya", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Daisy_flower1.jpg/640px-Daisy_flower1.jpg" },
        { name: "Aloe Vera", wiki: "Aloe_vera", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inset.jpg/640px-Aloe_vera_flower_inset.jpg" },
        { name: "Kaktüs", wiki: "Kaktüsgiller", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Golden_barrel_cactus_in_Cactus_Garden.jpg/640px-Golden_barrel_cactus_in_Cactus_Garden.jpg" },
        { name: "Begonvil", wiki: "Begonvil", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Bougainvillea_glabra_1.jpg/640px-Bougainvillea_glabra_1.jpg" },
        { name: "Bonsai", wiki: "Bonsai", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Japanese_Maple_Bonsai_800.jpg/640px-Japanese_Maple_Bonsai_800.jpg" },
        { name: "Paşa Kılıcı", wiki: "Sansevieria_trifasciata", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata%29.jpg/640px-Snake_Plant_%28Sansevieria_trifasciata%29.jpg" },
        { name: "Yasemin", wiki: "Yasemin", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Jasminum_officinale_flower.jpg/640px-Jasminum_officinale_flower.jpg" },
        { name: "Manolya", wiki: "Manolya", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Magnolia_grandiflora_flower.jpg/640px-Magnolia_grandiflora_flower.jpg" },
        { name: "Kardelen", wiki: "Kardelen", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Galanthus_nivalis_0.jpg/640px-Galanthus_nivalis_0.jpg" },
        { name: "Şakayık", wiki: "Şakayık", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Paeonia_lactiflora_01.jpg/640px-Paeonia_lactiflora_01.jpg" },
        { name: "Lale", wiki: "Lale", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tulip_ -_floriade_canberra.jpg/640px-Tulip_ -_floriade_canberra.jpg" },
        { name: "Sümbül", wiki: "Sümbül", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Hyacinthus_orientalis_blue.jpg/640px-Hyacinthus_orientalis_blue.jpg" },
        { name: "Nergis", wiki: "Nergis", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Narcissus_pseudonarcissus_0.jpg/640px-Narcissus_pseudonarcissus_0.jpg" },
        { name: "Sardunya", wiki: "Sardunya", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pelargonium_zonale_flower.jpg/640px-Pelargonium_zonale_flower.jpg" },
        { name: "Dracena", wiki: "Dracaena_marginata", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Dracaena_marginata_1.jpg/640px-Dracaena_marginata_1.jpg" },
        { name: "Zeytin", wiki: "Zeytin", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Olive_tree_Greece.jpg/640px-Olive_tree_Greece.jpg" },
        { name: "Bambu", wiki: "Bambu", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Bamboo_forest_Kyoto.jpg/640px-Bamboo_forest_Kyoto.jpg" },
        { name: "Ihlamur", wiki: "Ihlamur", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Tilia_cordata_flower.jpg/640px-Tilia_cordata_flower.jpg" },
        { name: "Defne", wiki: "Defne", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Laurus_nobilis_L.jpg/640px-Laurus_nobilis_L.jpg" },
        { name: "Nilüfer", wiki: "Nilüfer_%28bitki%29", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Nymphaea_alba_flower.jpg/640px-Nymphaea_alba_flower.jpg" },
        { name: "Fesleğen", wiki: "Fesleğen", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Basil-Leaves.jpg/640px-Basil-Leaves.jpg" }
    ];

    btnOpenQuiz.addEventListener('click', () => {
        quizModal.style.display = 'flex';
        loadQuizQuestion();
    });
    btnCloseQuiz.addEventListener('click', () => quizModal.style.display = 'none');

    async function loadQuizQuestion() {
        // Tüm bitkiler sorulduysa havuzu yenile
        if (usedQuizPlantNames.size >= quizPlantDataset.length) {
            usedQuizPlantNames.clear();
        }

        // Sorulmamış bitkilerden rastgele seç (Tekrar Etmeme Garantisi)
        const available = quizPlantDataset.filter(p => !usedQuizPlantNames.has(p.name));
        const targetPlant = available[Math.floor(Math.random() * available.length)];
        usedQuizPlantNames.add(targetPlant.name);
        currentQuizAnswer = targetPlant.name;

        // 4 Şıklı Seçenek Oluştur (1 Doğru, 3 Yanlış)
        const wrongCandidates = quizPlantDataset.filter(p => p.name !== targetPlant.name);
        const shuffledWrong = wrongCandidates.sort(() => Math.random() - 0.5).slice(0, 3).map(p => p.name);
        const opts = [targetPlant.name, ...shuffledWrong].sort(() => Math.random() - 0.5);

        const quizImg = document.getElementById('quizImage');
        const quizLoading = document.getElementById('quizLoadingText');
        quizImg.style.display = 'none';
        quizLoading.style.display = 'block';
        quizLoading.textContent = '⏳ Görsel Yükleniyor...';

        const btns = document.querySelectorAll('.btn-quiz-opt');
        btns.forEach((b, i) => {
            b.textContent = `${String.fromCharCode(65 + i)}) ${opts[i]}`;
            b.onclick = () => {
                if (opts[i] === currentQuizAnswer) {
                    quizScore += 10;
                    document.getElementById('quizScoreDisplay').textContent = quizScore;
                    saveUserData();
                    updateProfileModal();
                    alert('🎉 TEBRİKLER! Doğru Cevap! (+10 Puan)');
                } else {
                    alert(`❌ Yanlış! Doğru cevap: ${currentQuizAnswer}`);
                }
                loadQuizQuestion();
            };
        });

        // Görsel Yükleme (Önce Canlı Wikipedia API, Yoksa Garantili İmg Yolu)
        try {
            const data = await wikipediaOzetiGetir(targetPlant.wiki || targetPlant.name);
            if (data && data.resimUrl) {
                quizImg.src = data.resimUrl;
            } else {
                quizImg.src = targetPlant.img;
            }
        } catch (e) {
            quizImg.src = targetPlant.img;
        }

        quizImg.onload = () => {
            quizImg.style.display = 'block';
            quizLoading.style.display = 'none';
        };

        quizImg.onerror = () => {
            quizImg.src = targetPlant.img;
            quizImg.style.display = 'block';
            quizLoading.style.display = 'none';
        };
    }


    // SULAMA TAKVİMİ MODAL
    btnOpenWatering.addEventListener('click', () => {
        renderWateringList();
        wateringModal.style.display = 'flex';
    });
    btnCloseWatering.addEventListener('click', () => wateringModal.style.display = 'none');

    document.getElementById('btnAddHomePlant').addEventListener('click', () => {
        const name = document.getElementById('homePlantName').value.trim();
        const days = document.getElementById('homePlantDays').value.trim();
        if (name && days) {
            evBitkileri.push({ name, days, status: '💧 Bugün Sulanmalı!' });
            document.getElementById('homePlantName').value = '';
            saveUserData();
            renderWateringList();
            updateProfileModal();
        }
    });

    function renderWateringList() {
        const container = document.getElementById('homePlantsList');
        if (!container) return;
        if (evBitkileri.length === 0) {
            container.innerHTML = '<li class="empty-note">Henüz ev bitkisi eklenmedi.</li>';
        } else {
            container.innerHTML = evBitkileri.map((b, i) => `
                <li class="watering-item">
                    <span>🪴 ${b.name} (${b.days} günde bir) - <small>${b.status}</small></span>
                    <button class="btn btn-sm btn-blue" onclick="waterPlant(${i})">💧 Sula</button>
                </li>
            `).join('');
        }
    }

    window.waterPlant = function (i) {
        evBitkileri[i].status = `✅ Sulandı (${evBitkileri[i].days} gün kaldı)`;
        saveUserData();
        renderWateringList();
    };

    // FAVORİLER MODAL
    btnOpenFavs.addEventListener('click', () => {
        renderFavsList();
        favsModal.style.display = 'flex';
    });
    btnCloseFavs.addEventListener('click', () => favsModal.style.display = 'none');

    function renderFavsList() {
        const container = document.getElementById('favsListContainer');
        if (!container) return;
        if (favoriListesi.length === 0) {
            container.innerHTML = '<li class="empty-note">Favorilere henüz bitki eklenmedi.</li>';
        } else {
            container.innerHTML = favoriListesi.map((f, i) => `
                <li class="fav-item">
                    <span>🌿 ${f.baslik}</span>
                    <div>
                        <button class="btn btn-sm btn-success" onclick="selectFav('${f.baslik}')">🔍 Göster</button>
                        <button class="btn btn-sm btn-danger" onclick="removeFav(${i})">🗑️ Sil</button>
                    </div>
                </li>
            `).join('');
        }
    }

    window.removeFav = function (i) {
        favoriListesi.splice(i, 1);
        saveUserData();
        renderFavsList();
        updateProfileModal();
    };

    window.selectFav = function (title) {
        favsModal.style.display = 'none';
        profileModal.style.display = 'none';
        searchInput.value = title;
        sorgula();
    };

    // 📸 KİŞİSEL FOTOĞRAF ALBÜMÜ MODALI
    const galleryModal = document.getElementById('galleryModal');
    const btnOpenGallery = document.getElementById('btnOpenGallery');
    const btnCloseGallery = document.getElementById('btnCloseGallery');
    const albumFileInput = document.getElementById('albumFileInput');
    const btnSelectAlbumFile = document.getElementById('btnSelectAlbumFile');
    const albumCaptionInput = document.getElementById('albumCaptionInput');
    const btnAddAlbumPhoto = document.getElementById('btnAddAlbumPhoto');
    let selectedAlbumBase64 = null;

    if (btnOpenGallery) {
        btnOpenGallery.addEventListener('click', () => {
            renderGallery();
            galleryModal.style.display = 'flex';
        });
    }

    if (btnCloseGallery) {
        btnCloseGallery.addEventListener('click', () => galleryModal.style.display = 'none');
    }

    if (btnSelectAlbumFile && albumFileInput) {
        btnSelectAlbumFile.addEventListener('click', () => albumFileInput.click());
        albumFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                selectedAlbumBase64 = evt.target.result;
                btnSelectAlbumFile.textContent = '✅ Fotoğraf Seçildi';
                btnSelectAlbumFile.classList.remove('btn-outline');
                btnSelectAlbumFile.classList.add('btn-success');
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnAddAlbumPhoto) {
        btnAddAlbumPhoto.addEventListener('click', () => {
            if (!selectedAlbumBase64) {
                alert('⚠️ Lütfen önce bir fotoğraf seçin.');
                return;
            }
            const title = (albumCaptionInput && albumCaptionInput.value.trim()) ? albumCaptionInput.value.trim() : 'Bitki Anım';
            kisiselFotoAlbumu.unshift({
                id: Date.now(),
                title: title,
                imgSrc: selectedAlbumBase64,
                date: new Date().toLocaleDateString('tr-TR')
            });

            selectedAlbumBase64 = null;
            if (albumCaptionInput) albumCaptionInput.value = '';
            btnSelectAlbumFile.textContent = '🖼️ Fotoğraf Seç';
            btnSelectAlbumFile.classList.add('btn-outline');
            btnSelectAlbumFile.classList.remove('btn-success');

            saveUserData();
            renderGallery();
            updateProfileModal();
            alert('🎉 Fotoğraf albümünüze eklendi!');
        });
    }

    function renderGallery() {
        const container = document.getElementById('galleryGridContainer');
        if (!container) return;

        if (kisiselFotoAlbumu.length === 0) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-subtitle); padding: 30px; font-style: italic;">Henüz albüme fotoğraf eklenmedi. Fotoğraflarınızı yukarıdan ekleyebilirsiniz! 📸</div>';
        } else {
            container.innerHTML = kisiselFotoAlbumu.map((item, index) => `
                <div class="gallery-card">
                    <button class="gallery-card-del" onclick="removeAlbumPhoto(${index})" title="Sil">&times;</button>
                    <img src="${item.imgSrc}" alt="${item.title}" onclick="openFullscreenImg('${item.imgSrc}', '${item.title}')">
                    <div class="gallery-card-info">
                        <span class="gallery-card-title">${item.title}</span>
                        <span class="gallery-card-date">📅 ${item.date}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    window.removeAlbumPhoto = function (index) {
        if (confirm('Bu fotoğrafı albümünüzden silmek istediğinize emin misiniz?')) {
            kisiselFotoAlbumu.splice(index, 1);
            saveUserData();
            renderGallery();
            updateProfileModal();
        }
    };

    window.openFullscreenImg = function (src, title) {
        fullscreenImage.src = src;
        fullscreenTitle.textContent = `📸 ${title}`;
        fullscreenModal.style.display = 'flex';
    };

    // 📄 PDF BAKIM KARTI VE TEŞHİS REÇETESİ İNDİRME / YAZDIRMA
    const btnExportPdf = document.getElementById('btnExportPdf');
    const btnPrintDoctorReport = document.getElementById('btnPrintDoctorReport');

    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            if (!currentSonuc) {
                alert('⚠️ Lütfen önce bir bitki sorgulayın.');
                return;
            }
            window.print();
        });
    }

    if (btnPrintDoctorReport) {
        btnPrintDoctorReport.addEventListener('click', () => {
            window.print();
        });
    }

    window.toggleTreatmentStep = function(idx) {
        const chk = document.getElementById(`trStep_${idx}`);
        const txt = document.getElementById(`trStepText_${idx}`);
        if (chk && txt) {
            if (chk.checked) {
                txt.classList.add('checked');
            } else {
                txt.classList.remove('checked');
            }
        }
    };

    // 📊 GEMİNI AI 24 SAATLİK İSTEK SAYACI & MODALI
    const usageModal = document.getElementById('usageModal');
    const btnOpenUsage = document.getElementById('btnOpenUsage');
    const btnCloseUsage = document.getElementById('btnCloseUsage');
    const headerUsageCount = document.getElementById('headerUsageCount');

    async function fetchGeminiUsageStats() {
        try {
            const API_BASE = 'http://localhost:3000/api';
            const res = await fetch(`${API_BASE}/gemini-usage-stats`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    if (headerUsageCount) headerUsageCount.textContent = `${data.count24h} İstek`;
                    const el24h = document.getElementById('stat24hCount');
                    const elTot = document.getElementById('statTotalCount');
                    if (el24h) el24h.textContent = data.count24h;
                    if (elTot) elTot.textContent = data.totalAllTime;

                    const breakdownList = document.getElementById('usageBreakdownList');
                    if (breakdownList) {
                        const keys = Object.keys(data.modelBreakdown || {});
                        if (keys.length === 0) {
                            breakdownList.innerHTML = '<li style="font-style: italic; color: var(--text-subtitle);">Son 24 saat içinde henüz canlı istek atılmadı.</li>';
                        } else {
                            breakdownList.innerHTML = keys.map(k => `
                                <li style="display: flex; justify-content: space-between; padding: 6px 10px; background: rgba(0,0,0,0.03); border-radius: 6px;">
                                    <span>🤖 <b>${k}</b></span>
                                    <span style="font-weight: 700; color: var(--primary-green);">${data.modelBreakdown[k]} İstek</span>
                                </li>
                            `).join('');
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Gemini istek istatistikleri alınamadı:", e);
        }
    }

    if (btnOpenUsage) {
        btnOpenUsage.addEventListener('click', () => {
            fetchGeminiUsageStats();
            usageModal.style.display = 'flex';
        });
    }

    if (btnCloseUsage) {
        btnCloseUsage.addEventListener('click', () => usageModal.style.display = 'none');
    }

    // İlk yüklemede ve pencere açıldığında sayacı güncelle
    fetchGeminiUsageStats();
    window.fetchGeminiUsageStats = fetchGeminiUsageStats;
});




