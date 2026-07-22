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

    btnPotdExplore.addEventListener('click', () => {
        searchInput.value = 'Lavanta';
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

        currentSonuc = null;
        statusBar.textContent = 'Arayüz temizlendi.';
    });

    async function sorgula() {
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
        statusBar.textContent = `🔍 '${bitkiAdi}' bilgileri Wikipedia'dan çekiliyor...`;

        infoPlaceholder.style.display = 'block';
        infoPlaceholder.style.color = '#2e7d32';
        infoPlaceholder.textContent = '🔍 Lütfen bekleyin, bilgiler getiriliyor...';

        try {
            const sonuc = await wikipediaOzetiGetir(bitkiAdi);
            btnSearch.disabled = false;

            if (sonuc && sonuc.baslik) {
                currentSonuc = sonuc;

                // Keşif Sayacı
                const prevSize = kesfedilenBitkiler.size;
                kesfedilenBitkiler.add(sonuc.baslik);
                if (kesfedilenBitkiler.size > prevSize) {
                    updateUserRank();
                }

                // Aramalar Geçmişi
                if (!sonAramalar.includes(bitkiAdi)) {
                    sonAramalar.unshift(bitkiAdi);
                    if (sonAramalar.length > 5) sonAramalar.pop();
                    updateHistoryDropdown();
                }

                infoPlaceholder.style.display = 'none';
                resultContent.style.display = 'block';

                plantTitle.textContent = `🌿 ${sonuc.baslik}`;
                botanicalName.textContent = `🧬 Botanik Adı: ${getBotanicalName(sonuc.baslik)}`;

                // Daktilo Yazma Animasyonu
                fullText = sonuc.ozet;
                plantDescription.textContent = '';
                typingIndex = 0;

                typingTimer = setInterval(() => {
                    if (typingIndex < fullText.length) {
                        plantDescription.textContent += fullText.charAt(typingIndex);
                        typingIndex++;
                    } else {
                        clearInterval(typingTimer);
                        statusBar.textContent = `Tamamlandı: ${bitkiAdi}`;
                    }
                }, 15);

                // Bakım & Trivia
                updateCareTipsForPlant(sonuc.baslik);
                triviaText.textContent = getPlantTrivia(sonuc.baslik);

                // Butonlar Aktif
                btnFavAdd.disabled = false;
                btnSaveImg.disabled = !sonuc.resimUrl;
                btnWiki.disabled = !sonuc.wikiUrl;
                btnFullscreen.disabled = !sonuc.resimUrl;

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
        const kelime = bitkiAdi.toLowerCase().trim();
        if (kelime.length < 2) return false;
        const yasaklar = ["araba", "ev", "masa", "insan", "aslan", "kedi", "su", "hava", "yemek", "kelebek", "köpek", "balık", "kuş", "yılan", "böcek", "telefon", "bilgisayar", "sandalye", "kalem", "uçak", "saat", "ayakkabı", "bina", "televizyon", "şehir", "ülke", "kapı", "pencere", "oyun", "yazılım", "film", "müzik", "kitap", "para", "banka", "okul", "hastane", "otobüs", "gemi", "tren", "masal"];
        return !yasaklar.includes(kelime);
    }

    async function wikipediaOzetiGetir(sorgu) {
        const encoded = encodeURIComponent(sorgu);
        const summaryUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
        const fullWikiUrl = `https://tr.wikipedia.org/wiki/${encoded}`;

        const res = await fetch(summaryUrl);
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
        const combined = `${title || ''} ${description || ''} ${extract || ''}`.toLowerCase();
        const nonPlantKeywords = ["memeli", "köpekgiller", "kedigiller", "otomobil", "şehirdir", "başkentidir", "elektronik", "yazılımdır", "markadır", "şirkettir", "bölgedir", "ilçedir", "köyüdür", "filmdir", "albümüdür", "şarkısıdır", "oyuncudur", "yazardır", "siyasetçidir", "futbolcudur", "insandır", "omurgalıdır", "sürüngendir", "kuştur", "balıktır", "böcektir", "romandır", "tarihtir", "müzik grubu", "televizyon", "bilgisayar", "telefon", "cihazdır", "araçtır", "bina", "masal", "oyun", "meslek"];
        for (let kw of nonPlantKeywords) {
            if (combined.includes(kw)) return false;
        }
        const plantKeywords = ["bitki", "ağaç", "çiçek", "meyve", "sebze", "flora", "tohumlu", "familyasından", "familya", "cinsi", "türüdür", "otçul", "çalı", "otlar", "tahıl", "baklegil", "baharat", "narenciye", "yapraklı", "botanik", "fidan", "hasat", "otsu", "odunsu", "yeşillik", "kültür bitkisi", "tıbbi bitki", "tarım"];
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

    function updateCareTips(sun, water, temp) {
        careSun.textContent = `☀️ Güneş: ${sun}`;
        careWater.textContent = `💧 Sulama: ${water}`;
        careTemp.textContent = `🌡️ Sıcaklık: ${temp}`;
    }

    function updateCareTipsForPlant(name) {
        const p = name.toLowerCase();
        if (p.includes('kaktüs') || p.includes('sukulent')) updateCareTips('Bol Doğrudan Güneş', '2-3 Haftada Bir', '15°C - 30°C');
        else if (p.includes('orkide')) updateCareTips('Yarı Gölge / Parlak', 'Haftada 1 Kez', '18°C - 25°C');
        else if (p.includes('lavanta') || p.includes('nane') || p.includes('fesleğen')) updateCareTips('Bol Güneşli', 'Toprak Kurudukça', '15°C - 28°C');
        else updateCareTips('Parlak Dolaylı Işık', 'Haftada 1-2 Kez', '18°C - 24°C');
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
        if (e.key === 'Escape') fullscreenModal.style.display = 'none';
    });

    // AUTHENTICATION & PROFILE LOGIC
    let isRegisterMode = false;

    function refreshAuthUI() {
        if (currentUser) {
            btnProfile.textContent = `👤 ${currentUser.name}`;
            document.getElementById('userNameDisplay').textContent = currentUser.name;
            document.getElementById('userEmailDisplay').textContent = `📧 ${currentUser.email}`;
            document.getElementById('userAvatar').textContent = currentUser.avatar || "🌿";
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('userProfileContainer').style.display = 'block';
            document.getElementById('modalTitleText').textContent = '👤 Hesabım & Profil Merkezi';
        } else {
            btnProfile.textContent = '👤 Giriş Yap / Kayıt Ol';
            document.getElementById('authContainer').style.display = 'flex';
            document.getElementById('userProfileContainer').style.display = 'none';
            document.getElementById('modalTitleText').textContent = '🔐 Oturum Aç veya Kayıt Ol';
        }
    }
    refreshAuthUI();

    btnProfile.addEventListener('click', () => {
        refreshAuthUI();
        if (currentUser) {
            updateProfileModal();
        }
        profileModal.style.display = 'flex';
    });
    btnCloseProfile.addEventListener('click', () => profileModal.style.display = 'none');

    // TAB SEÇİMİ (Giriş Yap / Kayıt Ol)
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const nameInputGroup = document.getElementById('nameInputGroup');
    const btnSubmitAuth = document.getElementById('btnSubmitAuth');

    tabLogin.addEventListener('click', () => {
        isRegisterMode = false;
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        nameInputGroup.style.display = 'none';
        btnSubmitAuth.textContent = '🔑 Giriş Yap';
    });

    tabRegister.addEventListener('click', () => {
        isRegisterMode = true;
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        nameInputGroup.style.display = 'flex';
        btnSubmitAuth.textContent = '📝 Hesap Oluştur';
    });

    // GOOGLE İLE GİRİŞ YAP
    document.getElementById('btnGoogleLogin').addEventListener('click', () => {
        const googleEmail = prompt("Google Hesabı İle Giriş Yap:\nLütfen Gmail Adresinizi Giriniz:", "ornek.kullanici@gmail.com");
        if (googleEmail && googleEmail.includes('@')) {
            const defaultName = googleEmail.split('@')[0].replace('.', ' ');
            const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
            currentUser = {
                name: formattedName + " (Google)",
                email: googleEmail.trim(),
                avatar: "🌐",
                isGoogle: true
            };
            localStorage.setItem('bitki_user', JSON.stringify(currentUser));
            userName = currentUser.name;
            userEmail = currentUser.email;
            refreshAuthUI();
            updateProfileModal();
            alert(`🎉 Hoş geldiniz, ${currentUser.name}!\nGoogle hesabınızla başarıyla giriş yapıldı.`);
        }
    });

    // E-POSTA İLE GİRİŞ YAP / KAYIT OL FORM SUBMIT
    document.getElementById('authForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmailInput').value.trim();
        const pass = document.getElementById('authPassInput').value.trim();
        const name = document.getElementById('authNameInput').value.trim();

        if (!email || !pass) {
            alert('Lütfen e-posta ve şifre alanlarını doldurun.');
            return;
        }

        let registeredUsers = JSON.parse(localStorage.getItem('bitki_users_db')) || [];

        if (isRegisterMode) {
            if (!name) {
                alert('Lütfen adınızı ve soyadınızı giriniz.');
                return;
            }

            // Çift E-posta Kontrolü
            const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                alert(`⚠️ HATA: "${email}" e-posta adresi ile zaten kayıt yapılmış!\nLütfen '🔑 Giriş Yap' sekmesini kullanarak oturum açın.`);
                return;
            }

            // Yeni Kullanıcı Ekle
            const newUser = {
                name: name,
                email: email,
                pass: pass,
                avatar: "🌿",
                isGoogle: false
            };
            registeredUsers.push(newUser);
            localStorage.setItem('bitki_users_db', JSON.stringify(registeredUsers));

            currentUser = newUser;
            localStorage.setItem('bitki_user', JSON.stringify(currentUser));
            userName = currentUser.name;
            userEmail = currentUser.email;
            refreshAuthUI();
            updateProfileModal();
            alert(`🎉 Hesabınız başarıyla oluşturuldu! Hoş geldiniz, ${userName}.`);
        } else {
            // Giriş Yap Kontrolü
            const userInDb = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (userInDb && userInDb.pass !== pass) {
                alert('⚠️ HATA: Şifreniz hatalı! Lütfen kontrol edip tekrar deneyin.');
                return;
            }

            const displayName = userInDb ? userInDb.name : (email.split('@')[0] || "Botanikçi");
            currentUser = {
                name: displayName,
                email: email,
                avatar: "🌿",
                isGoogle: false
            };

            localStorage.setItem('bitki_user', JSON.stringify(currentUser));
            userName = currentUser.name;
            userEmail = currentUser.email;
            refreshAuthUI();
            updateProfileModal();
            alert(`🎉 Başarıyla giriş yapıldı! Hoş geldiniz, ${userName}.`);
        }
    });

    // OTURUMU KAPAT / ÇIKIŞ YAP
    document.getElementById('btnLogoutUser').addEventListener('click', () => {
        if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
            currentUser = null;
            localStorage.removeItem('bitki_user');
            userName = "Botanik Sevdalısı";
            userEmail = "";
            refreshAuthUI();
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
            renderNotes();
        }
    });

    function renderNotes() {
        const notesList = document.getElementById('notesList');
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

    // QUIZ GAME MODAL
    let currentQuizAnswer = "";
    btnOpenQuiz.addEventListener('click', () => {
        quizModal.style.display = 'flex';
        loadQuizQuestion();
    });
    btnCloseQuiz.addEventListener('click', () => quizModal.style.display = 'none');

    async function loadQuizQuestion() {
        const pool = ["Orkide", "Gül", "Lavanta", "Papatya", "Kaktüs", "Nane", "Yasemin", "Limon", "Zeytin", "Fesleğen"];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        currentQuizAnswer = shuffled[0];
        const opts = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);

        const quizImg = document.getElementById('quizImage');
        const quizLoading = document.getElementById('quizLoadingText');
        quizImg.style.display = 'none';
        quizLoading.style.display = 'block';

        const btns = document.querySelectorAll('.btn-quiz-opt');
        btns.forEach((b, i) => {
            b.textContent = `${String.fromCharCode(65 + i)}) ${opts[i]}`;
            b.onclick = () => {
                if (opts[i] === currentQuizAnswer) {
                    quizScore += 10;
                    document.getElementById('quizScoreDisplay').textContent = quizScore;
                    alert('🎉 TEBRİKLER! Doğru Cevap! (+10 Puan)');
                } else {
                    alert(`❌ Yanlış! Doğru cevap: ${currentQuizAnswer}`);
                }
                loadQuizQuestion();
            };
        });

        try {
            const data = await wikipediaOzetiGetir(currentQuizAnswer);
            if (data && data.resimUrl) {
                quizImg.src = data.resimUrl;
                quizImg.style.display = 'block';
                quizLoading.style.display = 'none';
            } else {
                quizLoading.textContent = 'Görsel yüklenemedi.';
            }
        } catch (e) {
            quizLoading.textContent = 'Görsel yüklenemedi.';
        }
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
            renderWateringList();
        }
    });

    function renderWateringList() {
        const container = document.getElementById('homePlantsList');
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

    window.waterPlant = function(i) {
        evBitkileri[i].status = `✅ Sulandı (${evBitkileri[i].days} gün kaldı)`;
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
        if (favoriListesi.length === 0) {
            container.innerHTML = '<li class="empty-note">Favorilere henüz bitki eklenmedi.</li>';
        } else {
            container.innerHTML = favoriListesi.map((f, i) => `
                <li class="fav-item">
                    <span>🌿 ${f.baslik}</span>
                    <button class="btn btn-sm btn-success" onclick="selectFav('${f.baslik}')">🔍 Göster</button>
                </li>
            `).join('');
        }
    }

    window.selectFav = function(title) {
        favsModal.style.display = 'none';
        profileModal.style.display = 'none';
        searchInput.value = title;
        sorgula();
    };
});
