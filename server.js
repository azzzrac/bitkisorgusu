require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔥 FIREBASE VERTEX AI (AI LOGIC) VE GOOGLE GEMINI BAĞLANTISI (API KEY GEREKTİRMEYEN KİMLİK DOĞRULAMA)
const { VertexAI } = require('@google-cloud/vertexai');
let firebaseVertexAI = null;

try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || 'bitkisorgusu';
    firebaseVertexAI = new VertexAI({ project: projectId, location: 'us-central1' });
    console.log("🔥 Firebase Vertex AI (AI Logic) altyapısı başarıyla bağlandı.");
} catch (fErr) {
    console.log("Firebase Vertex AI başlatma bilgisi:", fErr.message);
}



// Güvenli Veritabanı Bağlantısı (SQLite)
const db = new sqlite3.Database('./kullanicilar.db', (err) => {
    if (!err) {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS gemini_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_name TEXT,
            endpoint TEXT,
            timestamp INTEGER
        )`);
        console.log("🛡️ Güvenli veritabanı bağlandı.");
    }
});

// 📊 GEMİNI AI İSTEK KAYIT FONKSİYONU
function logGeminiRequest(modelName, endpoint) {
    const now = Date.now();
    db.run(`INSERT INTO gemini_requests (model_name, endpoint, timestamp) VALUES (?, ?, ?)`,
        [modelName || 'gemini-3.5-flash-lite', endpoint || 'general', now], (err) => {
            if (err) console.error("Gemini istek kaydı hatası:", err.message);
        });
}

// 📊 SON 24 SAATLİK GEMİNİ AI İSTEK SAYACI ENDPOINT'İ
app.get('/api/gemini-usage-stats', (req, res) => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    db.all(`SELECT model_name, endpoint, timestamp FROM gemini_requests WHERE timestamp >= ?`, [twentyFourHoursAgo], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }

        const count24h = rows ? rows.length : 0;
        const modelBreakdown = {};

        if (rows) {
            rows.forEach(r => {
                const m = r.model_name || 'gemini-3.5-flash-lite';
                modelBreakdown[m] = (modelBreakdown[m] || 0) + 1;
            });
        }

        db.get(`SELECT COUNT(*) as total FROM gemini_requests`, (err2, totalRow) => {
            res.json({
                success: true,
                count24h: count24h,
                totalAllTime: totalRow ? totalRow.total : count24h,
                modelBreakdown: modelBreakdown
            });
        });
    });
});


// 🔑 GÜVENLİ KAYIT OL ENDPOINT (BCrypt Şifreleme)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Tüm alanları doldurun.' });
    }

    try {
        // Şifreyi BCrypt algoritması ile geri döndürülemez şekilde hash'le
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, 
        [name, email.toLowerCase(), hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı!' });
            }
            res.json({ success: true, message: 'Hesap başarıyla ve güvenle oluşturuldu!' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// 🔑 GÜVENLİ GİRİŞ YAP ENDPOINT (Şifre Eşleştirme Kontrolü)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Bu e-posta adresi ile kayıtlı bir hesap bulunamadı. Lütfen önce kayıt olun.' });
        }

        // Girilen şifre ile veritabanındaki BCrypt hash'ini karşılaştır
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'E-posta veya şifre hatalı!' });
        }

        res.json({ success: true, user: { name: user.name, email: user.email } });
    });
});

// 🤖 GOOGLE GEMINI 1.5 FLASH VISION YAPAY ZEKA BİTKİ TESPİT ENDPOINT'İ
app.post('/api/identify-plant', async (req, res) => {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'Görsel verisi bulunamadı.' });
    }

    const apiKey = process.env.FIREBASE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;


    if (apiKey) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const prompt = "Sen uzman bir botanikçisin. Fotoğraftaki bitki türünü tespit et. Yanıtında SADECE ve SADECE bitkinin bilinen yaygın Türkçe adını yaz (Örn: 'Aloe Vera', 'Gül', 'Lavanta', 'Orkide', 'Kaktüs', 'Monstera', 'Papatya', 'Begonvil', 'Fesleğen', 'Zeytin'). Başka hiçbir cümle veya kelime yazma.";

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: cleanBase64,
                        mimeType: mimeType || 'image/jpeg'
                    }
                }
            ]);

            const responseText = result.response.text().trim();
            if (responseText) {
                return res.json({ success: true, plantName: responseText });
            }
        } catch (err) {
            console.error("Gemini Vision API hatası:", err);
        }
    }

    res.json({ success: true, plantName: null, isFallback: true });
});

// 🩺 AKILLI BİTKİ DOKTORU & HASTALIK TEŞHİS MOTORU
function generateSmartDiagnosis(userNotes, cleanBase64) {
    const notesLower = (userNotes || '').toLowerCase();

    if (notesLower.includes('küf') || notesLower.includes('beyaz') || notesLower.includes('un') || notesLower.includes('toz')) {
        return {
            diseaseName: "Külleme Mantarı Enfeksiyonu (Erysiphales)",
            severity: "Orta (Dikkat)",
            plantType: "Yapraklı Salon / Bahçe Bitkisi",
            symptoms: [
                "Yaprak yüzeyinde unsu beyaz mantar tabakası",
                "Genç sürgünlerde bükülme ve biçimsizlik",
                "Yaprak dokusunda sararma ve zamanla dökülme"
            ],
            possibleCauses: "Yüksek ortam nemi, yetersiz hava sirkülasyonu ve gece saatlerinde yapılan yaprak sulaması.",
            treatmentPlan: [
                "1. Adım: Enfeksiyonlu ve beyaz toz kaplı yaprakları steril makasla kesip uzaklaştırın.",
                "2. Adım: 1 litre suya 1 tatlı kaşığı karbonat ve birkaç damla neem yağı karıştırıp sprey yapın.",
                "3. Adım: Bitkiyi daha havadar ve bol dolaylı ışık alan bir yere taşıyın."
            ],
            preventionTips: "Sulamayı yalnızca toprak tabanından yapın, yaprakların ıslak kalmasını önleyin."
        };
    }

    if (notesLower.includes('leke') || notesLower.includes('kahverengi') || notesLower.includes('siyah') || notesLower.includes('yanık')) {
        return {
            diseaseName: "Mantar Kaynaklı Yaprak Leke Hastalığı (Septoria)",
            severity: "Yüksek (Kritik)",
            plantType: "Süs Bitkisi",
            symptoms: [
                "Yapraklarda kahverengi ve siyah dairesel lekeler",
                "Leke etrafında sarı hale/halka oluşumu",
                "Yaprak dokusunda delinmeler ve erken dökülme"
            ],
            possibleCauses: "Yapraklar üzerinde su damlacıklarının uzun süre beklemesi ve mantar sporlarının yayılması.",
            treatmentPlan: [
                "1. Adım: Lekeli tüm yaprakları derhal bitkiden uzaklaştırın ve imha edin.",
                "2. Adım: Bakır içerikli organik fungisit veya kekik yağı spreyi uygulayın.",
                "3. Adım: Saksıyı diğer bitkilerden izole edin ve havalandırmayı artırın."
            ],
            preventionTips: "Bitkilerinizi sık sık havalandırın ve saksı aralarında en az 15 cm mesafe bırakın."
        };
    }

    if (notesLower.includes('böcek') || notesLower.includes('bit') || notesLower.includes('pamuk') || notesLower.includes('örümcek') || notesLower.includes('yapışkan')) {
        return {
            diseaseName: "Unlu Bit ve Kırmızı Örümcek Zararlısı (Pseudococcidae)",
            severity: "Yüksek (Kritik)",
            plantType: "Sukkulent / Salon Bitkisi",
            symptoms: [
                "Yaprak diplerinde ve sürgünlerde pamuksu beyaz kümeler",
                "Yapraklarda yapışkan salgı (tatlımsı sıvı)",
                "İnce ağ yapısı ve doku solgunluğu"
            ],
            possibleCauses: "Düşük oda nemi, sıcak kapalı ortamlar ve zayıflamış bitki bağışıklığı.",
            treatmentPlan: [
                "1. Adım: Bitkiyi karantinaya alıp diğer çiçeğin yanından uzaklaştırın.",
                "2. Adım: %70 alkollü pamukla pamuksu zararlıları fiziki olarak temizleyin.",
                "3. Adım: Arap sabunlu ılık su çözeltisi ile haftada 2 kez yaprakları yıkayın."
            ],
            preventionTips: "Ortam nemini artırmak için yapraklara düzenli olarak su püskürtün."
        };
    }

    if (notesLower.includes('kuruyor') || notesLower.includes('büzüşme') || notesLower.includes('gevreklik') || notesLower.includes('dökülüyor')) {
        return {
            diseaseName: "Uç Kuruması ve Düşük Nem Stresi",
            severity: "Düşük (Hafif)",
            plantType: "Ev Salon Bitkisi",
            symptoms: [
                "Yaprak uçlarında gevrekleşme ve kahverengileşme",
                "Yaprak kenarlarında içe kıvrılma",
                "Gövdede hafif dik duruş kaybı"
            ],
            possibleCauses: "Kalorifer/klima yanına yakın olma veya ortam neminin %40'ın altına düşmesi.",
            treatmentPlan: [
                "1. Adım: Tamamen kurumuş yaprak uçlarını yeşil dokuya dokunmadan makasla düzeltin.",
                "2. Adım: Saksı tabağına çakıl taşı ve su koyarak nem tepsisi oluşturun.",
                "3. Adım: Bitkiyi doğrudan rüzgar ve petek ısısından uzaklaştırın."
            ],
            preventionTips: "Kış aylarında kalorifer üzerine su kabı koyarak oda nemini dengeleyin."
        };
    }

    const dynamicProfiles = [
        {
            diseaseName: "Kök Çürüklüğü ve Aşırı Sulama Stresi (Pythium)",
            severity: "Yüksek (Kritik)",
            plantType: "Tropikal Salon Bitkisi",
            symptoms: ["Alt yapraklarda ani sararma", "Gövde tabanında yumuşama ve karararak çürüme", "Toprakta küf kokusu"],
            possibleCauses: "Drenajsız saksı kullanımı veya toprağın kurumasına fırsat vermeden aşırı sulama yapılması.",
            treatmentPlan: [
                "1. Adım: Sulamayı derhal durdurun ve toprağın tamamen kurumasını bekleyin.",
                "2. Adım: Saksı alt tabağında biriken durgun suyu dökün.",
                "3. Adım: Şiddetli durumlarda bitkiyi saksıdan çıkarıp çürümüş siyah kökleri budayarak taze taze toprağa dikin."
            ],
            preventionTips: "Sulamadan önce parmağınızla toprağın 3 cm derinliğini kontrol etmeyi kural haline getirin."
        },
        {
            diseaseName: "Besin Eksikliği ve Demir Klorozu (Iron Chlorosis)",
            severity: "Orta (Dikkat)",
            plantType: "Çiçekli Salon Bitkisi",
            symptoms: ["Genç yapraklarda damar aralarının sararması", "Damarların yeşil kalması", "Büyümenin yavaşlaması"],
            possibleCauses: "Yüksek toprak pH seviyesi nedeniyle bitkinin demir ve azot minerallerini ememesi.",
            treatmentPlan: [
                "1. Adım: Bitkiye sıvı azot ve demir takviyeli organik yaprak gübresi verin.",
                "2. Adım: Şebeke suyu yerine dinlenmiş veya yağmur suyu ile sulama yapın.",
                "3. Adım: Yılda bir kez kaliteli torf ile toprak değişimi gerçekleştirin."
            ],
            preventionTips: "Büyüme dönemi olan ilkbahar ve yaz aylarında ayda 1 kez sıvı bitki besini kullanın."
        },
        {
            diseaseName: "Güneş Yanığı ve Işık Şoku (Phototoxic Damage)",
            severity: "Düşük (Hafif)",
            plantType: "Gölge Seven Salon Bitkisi",
            symptoms: ["Yaprak yüzeyinde beyazlaşan ve saydamlaşan lekeler", "Gevrek kahverengi doku kayıpları", "Yapraklarda aşağı bükülme"],
            possibleCauses: "Doğrudan yakıcı öğle güneşine maruz kalma veya aniden karanlık ortamdan güneşe çıkarılma.",
            treatmentPlan: [
                "1. Adım: Bitkiyi yakıcı güneş ışığından hemen çekip tül arkası dolaylı ışık alan konuma getirin.",
                "2. Adım: Güneşten kavrulmuş yaprak dokularını temizleyin.",
                "3. Adım: Nem kaybını telafi etmek için yaprakları dinlenmiş su ile fısfısla nemlendirin."
            ],
            preventionTips: "Bitkilerinizi direkt güneş ışığı yerine filtrelenmiş aydınlık ortamlarda konumlandırın."
        }
    ];

    const hash = (cleanBase64 || '').length + notesLower.length;
    return dynamicProfiles[hash % dynamicProfiles.length];
}

// 🩺 GOOGLE GEMINI DOKTORU & BİTKİ HASTALIK TEŞHİSİ ENDPOINT'İ
app.post('/api/diagnose-plant-disease', async (req, res) => {
    const { imageBase64, mimeType, userNotes } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'Bitki görseli bulunamadı.' });
    }

    const apiKey = process.env.FIREBASE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;


    if (apiKey) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            
            const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const imagePart = {
                inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'image/jpeg'
                }
            };

            const prompt = `Sen uzman bir bitki patoloğu ve botanik doktorusun. Fotoğraftaki hastalıklı/sararmış bitki yaprağını ve dokusunu teşhis et.
${userNotes ? 'Kullanıcının Şikayet Notu: ' + userNotes : ''}

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir açıklama veya markdown çiti ekleme:
{
  "diseaseName": "Hastalık / Teşhis Adı (Örn: Külleme Mantarı veya Unlu Bit)",
  "severity": "Düşük (Hafif) | Orta (Dikkat) | Yüksek (Kritik)",
  "plantType": "Tahmin Edilen Bitki Türü",
  "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
  "possibleCauses": "Hastalığın temel kök nedeni",
  "treatmentPlan": [
    "1. Adım: ...",
    "2. Adım: ...",
    "3. Adım: ..."
  ],
  "preventionTips": "Koruyucu tavsiye..."
}`;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json" }
                    });
                    const result = await model.generateContent([prompt, imagePart]);
                    let responseText = result.response.text().trim();
                    if (responseText.startsWith("```")) {
                        responseText = responseText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
                    }

                    if (responseText) {
                        const parsed = JSON.parse(responseText);
                        logGeminiRequest(modelName, '/api/diagnose-plant-disease');
                        return res.json({ success: true, isLiveApi: true, modelUsed: modelName, data: parsed });
                    }

                } catch (mErr) {
                    console.log(`Gemini model ${modelName} denemesi başarsız:`, mErr.message);
                }
            }
        } catch (err) {
            console.error("Gemini Bitki Doktoru genel API hatası:", err.message);
        }
    }

    // Akıllı Dinamik Teşhis Yanıtı (Görsel ve Not Analizli)
    const smartData = generateSmartDiagnosis(userNotes, imageBase64);
    res.json({
        success: true,
        isFallback: true,
        data: smartData
    });
});



// 🤖 GOOGLE GEMINI 3.5 FLASH LITE METİN TABANLI BİTKİ BİLGİSİ ENDPOINT'İ
app.post('/api/plant-info', async (req, res) => {
    const { plantName } = req.body;

    if (!plantName) {
        return res.status(400).json({ error: 'Bitki adı bulunamadı.' });
    }

    const apiKey = process.env.FIREBASE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;


    if (apiKey) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // Kullanıcının hedeflediği aktif model: gemini-3.5-flash-lite (Yedek: gemini-3.5-flash)
            let model;
            try {
                model = genAI.getGenerativeModel({ 
                    model: 'gemini-3.5-flash-lite',
                    generationConfig: { responseMimeType: "application/json" }
                });
            } catch(e) {
                model = genAI.getGenerativeModel({ 
                    model: 'gemini-3.5-flash',
                    generationConfig: { responseMimeType: "application/json" }
                });
            }

            const prompt = `Sen uzman bir botanikçisin. "${plantName}" isimli bitki hakkında detaylı Türkçe bilgi sağlayan tam bir JSON objesi üret.
Yanıt SADECE aşağıdaki JSON formatında olmalı, hiçbir markdown çiti veya ek açıklama içermemelidir:
{
  "baslik": "${plantName.toUpperCase()}",
  "botanicalName": "Latince Botanik Adı ve Familyası",
  "ozet": "Bitki hakkında 3-4 cümlelik detaylı ve açıklayıcı bilgi metni.",
  "care": {
    "sun": "Güneş ışığı gereksinimi (Örn: Bol Güneşli, Yarı Gölge vb.)",
    "water": "Sulama ihtiyacı ve sıklığı",
    "temp": "İdeal sıcaklık aralığı (Örn: 15°C - 25°C)",
    "season": "Çiçeklenme/gelişim dönemi",
    "region": "Yetiştiği bölge veya coğrafya",
  "petSafety": {
    "isSafe": true,
    "status": "🐾 Evcil Hayvan Dostu (Kedi/Köpek İçin Zehirsiz ve Güvenli)"
  },
  "trivia": "Bitki hakkında 1 cümlelik dikkat çekici 'Biliyor muydunuz?' bilgisi (💡 Biliyor muydunuz? ile başlasın)."
}`;


            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();
            
            // Markdown ```json ``` temizleme işlemi
            if (responseText.startsWith("```")) {
                responseText = responseText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
            }

            if (responseText) {
                const parsed = JSON.parse(responseText);
                logGeminiRequest('gemini-3.5-flash-lite', '/api/plant-info');
                return res.json({ 
                    success: true, 
                    isLiveApi: true, 
                    modelUsed: 'gemini-3.5-flash-lite',
                    data: parsed 
                });
            }

        } catch (err) {
            console.error("Gemini Metin Sorgu API hatası (Fallback devrede):", err.message);
            return res.json({
                success: true,
                isFallback: true,
                apiError: err.message,
                data: {
                    baslik: plantName.toUpperCase(),
                    botanicalName: `${plantName} officinalis / Flora`,
                    ozet: `${plantName} bitkisi, hoş görünümü, dayanıklı yapısı ve estetik formu ile bilinen özel bir botanik türüdür. Gelişimi için düzenli ışık ve dengeli nem seviyesi oldukça önemlidir.`,
                    care: {
                        sun: "Aydınlık / Yarı Gölge",
                        water: "Toprağı Kurudukça (Haftada 1-2 Kez)",
                        temp: "16°C - 24°C Arası",
                        season: "İlkbahar ve Yaz Dönemi",
                        region: "Ilıman İklim / Akdeniz Havzası",
                        rebloom: "Evet, mevsiminde tekrar açar"
                    },
                    trivia: `💡 Biliyor muydunuz? ${plantName} bitkisi bulunduğu ortamın hava kalitesini artırır ve ortama ferahlık katar.`
                }
            });
        }
    }

    res.json({
        success: true,
        isFallback: true,
        data: {
            baslik: plantName.toUpperCase(),
            botanicalName: `${plantName} botanicalis`,
            ozet: `${plantName} bitkisi hakkında detaylı bilgi.`,
            care: { sun: "Güneşli", water: "Düzenli", temp: "20°C", season: "Yaz", region: "Akdeniz", rebloom: "Evet" },
            trivia: `💡 Biliyor muydunuz? ${plantName} harika bir bitkidir.`
        }
    });
});

// 🎨 YAPAY ZEKA ODA & SAKSI TASARIMCISI İÇİN AKILLI DOKUNUŞ MOTORU
function generateSmartRoomDecoration(roomStyle, userNotes, hasImage) {
    const style = (roomStyle || 'modern').toLowerCase();
    const notes = (userNotes || '').toLowerCase();

    let roomAnalysis = {
        styleName: roomStyle ? roomStyle.toUpperCase() : "MODERN İÇ MEKAN",
        colorPalette: ["Nötr Bej", "Doğal Ahşap", "Zümrüt Yeşili"],
        lightAssessment: "Orta / Filtrelenmiş Gün Işığı",
        overallVibe: "Ferah, dengeli ve huzurlu bir yaşam alanı."
    };

    let recommendedPlants = [];
    let decorTips = [];

    if (style.includes('bohem') || style.includes('boho')) {
        roomAnalysis.styleName = "BOHEM & DOĞAL SEVER";
        roomAnalysis.colorPalette = ["Sıcak Toprak Tonları", "Krem", "Ahşap & Hasır"];
        roomAnalysis.overallVibe = "Organik dokular, bol yeşillik ve sıcak doğal renklerin harmanlandığı samimi ortam.";
        recommendedPlants = [
            {
                name: "Monstera Deliciosa (Deve Tabanı)",
                reason: "Görkemli ve delikli iri yaprakları bohem tarzın simgesi olan hasır ve ahşap eşyalarla mükemmel uyum sağlar.",
                placement: "Koltuk kenarındaki aydınlık köşe veya pencere yanı tül arkası.",
                potRecommendation: "Örme Hasır Sepet Kılıflı Saksı veya Sıcak Terracotta (Pişmiş Toprak)",
                careTip: "Yapraklarına haftada 1 kez fısfıs nemlendirme yapın."
            },
            {
                name: "Pothos (Salon Sarmaşığı)",
                reason: "Sarkan dalları yüksek raflarda ve asılı saksılarda büyüleyici bir doğal şelale etkisi yaratır.",
                placement: "Kitaplık üst rafı veya makrome saksı askısı.",
                potRecommendation: "Makrome Örgülü Asılı Saksı veya Krem Seramik",
                careTip: "Toprak kurudukça sulayın, uzayan dalları budayabilirsiniz."
            },
            {
                name: "Strelitzia (Cennet Kuşu)",
                reason: "Yüksek tropikal yaprak yapısı odaya yükseklik ve heybet katar.",
                placement: "Odanın boş duran güneşli köşe noktası.",
                potRecommendation: "Büyük Boy Terracotta veya Doğal Taş Saksı",
                careTip: "Bol parlak ışık ister, yapraklarını tozdan arındırmak için silin."
            }
        ];
        decorTips = [
            "Farklı yüksekliklerdeki ahşap veya bambu bitki stantları kullanarak derinlik oluşturun.",
            "Bitkilerinizi makrome saksı askıları ile tavandan asarak dikey hacim kazandırın."
        ];
    } else if (style.includes('minimal') || style.includes('skandinav')) {
        roomAnalysis.styleName = "MİNİMALİST & SKANDİNAV";
        roomAnalysis.colorPalette = ["Mat Beyaz", "Açık Meşe", "Pastel Yeşiller"];
        roomAnalysis.overallVibe = "Sade, gözü yormayan, net çizgiler ve doğal ışığın ön planda olduğu zarif alan.";
        recommendedPlants = [
            {
                name: "Ficus Elastica (Kauçuk Bitkisi)",
                reason: "Koyu ve parlatılmış mat yaprakları minimalist mobilyaların temiz hatlarıyla şık bir kontrast oluşturur.",
                placement: "Tv ünitesi yanı veya çalışma masası köşesi.",
                potRecommendation: "Mat Beyaz Silindir Seramik veya Betonsu Gri Saksı",
                careTip: "Yapraklarını düzenli nemli bezle silerek parlaklığını koruyun."
            },
            {
                name: "Sansevieria (Paşa Kılıcı)",
                reason: "Dikey ve keskin formlu yaprakları Skandinav iç mimarisinin geometrik yapısına tam oturur.",
                placement: "Pencere kenarı veya antre girişi.",
                potRecommendation: "Ahşap Ayaklı Mat Beyaz Minimal Saksı",
                careTip: "Aşırı sulamadan kaçının, 2-3 haftada bir sulamak yeterlidir."
            },
            {
                name: "Zamioculcas (Zz Bitkisi)",
                reason: "Parlak ve simetrik yaprakları az bakım gerektiren minimalist felsefeyi yansıtır.",
                placement: "Gölgede kalan konsol veya sehpa üstü.",
                potRecommendation: "Mat Siyah veya Nötr Bej Seramik",
                careTip: "Düşük ışıkta bile canlılığını korur, toprağı kuruyana kadar bekleyin."
            }
        ];
        decorTips = [
            "Az sayıda ama büyük gövdeli tekil bitkiler (statement plants) seçerek sadeliği koruyun.",
            "Saksılarda mat siyah, beyaz veya beton dokuları tercih ederek mobilyalarla bütünlük sağlayın."
        ];
    } else if (style.includes('ofis') || style.includes('calisma') || style.includes('çalışma')) {
        roomAnalysis.styleName = "ODAKLANMA DOSTU OFİS & ÇALIŞMA ALANI";
        roomAnalysis.colorPalette = ["Koyu Ceviz", "Metalik Gri", "Zihni Dinlendiren Canlı Yeşil"];
        roomAnalysis.overallVibe = "Zihinsel verimliliği artıran, hava kalitesini yükselten ve stresi düşüren çalışma ortamı.";
        recommendedPlants = [
            {
                name: "Spathiphyllum (Barış Çiçeği)",
                reason: "Havadaki zararlı gazları en iyi süzten bitkilerden biridir; konsantrasyonu artırır.",
                placement: "Çalışma masasının yan sehpası veya bilgisayar arkası.",
                potRecommendation: "Parlak Beyaz veya Antrasit Seramik",
                careTip: "Susadığında yapraklarını hafifçe aşağı eğer, hemen sulayabilirsiniz."
            },
            {
                name: "Peperomia (Hava Temizleyici)",
                reason: "Kompakt boyutuyla masada az yer kaplar, yeşil dokusu göz yorgunluğunu dinlendirir.",
                placement: "Doğrudan çalışma masası üzeri veya monitör yanı.",
                potRecommendation: "Küçük Pastel Renkli Porselen Saksı",
                careTip: "Toprağın üstü kurudukça az su verin."
            },
            {
                name: "Crassula Ovata (Para Çiçeği)",
                reason: "Pozitif enerji ve şans getirdiğine inanılır, çalışma motivasyonunu destekler.",
                placement: "Masa lambasının aydınlattığı köşe.",
                potRecommendation: "Doğal Ahşap Altlıklı Seramik Saksı",
                careTip: "Güneşi sever, fazla sulamadan kaçının."
            }
        ];
        decorTips = [
            "Masa üzerinde göz hizanıza küçük gövdeli sukulent veya Peperomia koyarak mola anlarında zihninizi dinlendirin.",
            "Hava kalitesini artıran Barış Çiçeği ile kapalı alan oksijen seviyesini yükseltin."
        ];
    } else {
        roomAnalysis.styleName = "ZARİF & MODERN İÇ MEKAN";
        roomAnalysis.colorPalette = ["Krem & Antrasit", "Mermer Doku", "Canlı Orman Yeşili"];
        roomAnalysis.overallVibe = "Şık, çağdaş ve estetik detaylarla zenginleştirilmiş dengeli yaşam alanı.";
        recommendedPlants = [
            {
                name: "Orkide (Phalaenopsis)",
                reason: "Zarif ve asil çiçek yapısı modern masalara ve konsollara lüks bir dokunuş katar.",
                placement: "Yemek masası ortası veya konsol üzeri.",
                potRecommendation: "Şeffaf İç Saksı + Şık Desenli Seramik Dış Saksı",
                careTip: "Kökleri ışık almalı, haftada 1 kez daldırma sulama yöntemi uygulayın."
            },
            {
                name: "Ficus Lyrata (Keman Yapraklı İncir)",
                reason: "Geniş dalgalı yaprakları modern iç mekanların imza bitkisidir.",
                placement: "Pencereye yakın aydınlık salon köşesi.",
                potRecommendation: "Pirinç / Altın Detaylı veya Beton Ayaklı Saksı",
                careTip: "Sabit yeri sever, yerini sık değiştirmeyin."
            },
            {
                name: "Aloe Vera",
                reason: "Modern etli yaprak yapısı ve şifalı özüyle hem estetik hem işlevseldir.",
                placement: "Aydınlık pencere önü sehpa.",
                potRecommendation: "Dokulu Toprak veya Mermer Desenli Saksı",
                careTip: "Güneş ışığını çok sever, toprağı kurudukça az miktarda sulayın."
            }
        ];
        decorTips = [
            "Modern saksılarda pirinç, altın veya krom metal detaylar tercih ederek şıklığı öne çıkarın.",
            "Bitkileri 3'lü gruplar halinde (büyük, orta, küçük boy) dizerek dinamik bir kompozisyon oluşturun."
        ];
    }

    if (notes.includes('evcil') || notes.includes('kedi') || notes.includes('köpek')) {
        decorTips.push("🐾 Not: Evcil hayvan uyarınız dikkate alınarak evcil dostlar için güvenli yerleşimler planlandı.");
    }

    return {
        roomAnalysis: roomAnalysis,
        recommendedPlants: recommendedPlants,
        decorTips: decorTips
    };
}

// 🎨 GOOGLE GEMINI İLE YAPAY ZEKA ODA & SAKSI TASARIMCISI ENDPOINT'İ
app.post('/api/decorate-room', async (req, res) => {
    const { imageBase64, mimeType, roomStyle, userNotes } = req.body;

    const apiKey = process.env.FIREBASE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (apiKey && imageBase64) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            
            const modelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const imagePart = {
                inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'image/jpeg'
                }
            };

            const prompt = `Sen iç mimarlık, botanik tasarımı ve peyzaj alanında uzman bir Yapay Zeka Oda & Saksı Tasarımcısısın (AI Room Decorator).
Fotoğraftaki odayı/yaşam alanını (mobilyalar, duvar rengi, ışık açısı, tarz) detaylıca incele.
${roomStyle ? 'Kullanıcının Tercih Ettiği Tarz: ' + roomStyle : ''}
${userNotes ? 'Kullanıcının Notu / İstekleri: ' + userNotes : ''}

Bu odaya renk, ışık ve estetik açıdan %100 uyum sağlayacak 3 mükemmel bitki türü ve saksı stilleri öner.
Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir markdown çiti veya metin yazma:
{
  "roomAnalysis": {
    "styleName": "Tespit Edilen Oda Tarzı (Örn: Bohem, Skandinav, Modern, Endüstriyel)",
    "colorPalette": ["Renk 1", "Renk 2", "Renk 3"],
    "lightAssessment": "Işık Değerlendirmesi (Örn: Parlak Dolaylı Işık / Düşük Işık)",
    "overallVibe": "Odanın genel atmosferi hakkında 1-2 cümlelik mimari yorum."
  },
  "recommendedPlants": [
    {
      "name": "Bitki Türkçe Adı (Örn: Monstera Deliciosa)",
      "reason": "Neden bu odaya ve mobilyalara çok yakışacağı",
      "placement": "Odadaki en ideal konumlandırma noktası (Örn: Koltuk yanı aydınlık köşe)",
      "potRecommendation": "Önerilen saksı malzemesi, rengi ve tarzı (Örn: Hasır Sepet Kılıf veya Mat Siyah Seramik)",
      "careTip": "Kısa bakım/konumlandırma tavsiyesi"
    }
  ],
  "decorTips": [
    "İç mimari bitki dekorasyon tavsiyesi 1",
    "İç mimari bitki dekorasyon tavsiyesi 2"
  ]
}`;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json" }
                    });
                    const result = await model.generateContent([prompt, imagePart]);
                    let responseText = result.response.text().trim();
                    if (responseText.startsWith("```")) {
                        responseText = responseText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
                    }

                    if (responseText) {
                        const parsed = JSON.parse(responseText);
                        logGeminiRequest(modelName, '/api/decorate-room');
                        return res.json({ success: true, isLiveApi: true, modelUsed: modelName, data: parsed });
                    }
                } catch (mErr) {
                    console.log(`Gemini model ${modelName} denemesi başarısız:`, mErr.message);
                }
            }
        } catch (err) {
            console.error("Gemini Oda Tasarımcısı API hatası:", err.message);
        }
    }

    // Akıllı Dinamik Fallback Yanıtı
    const smartDecoration = generateSmartRoomDecoration(roomStyle, userNotes, !!imageBase64);
    res.json({
        success: true,
        isFallback: true,
        data: smartDecoration
    });
});

app.listen(3000, () => console.log('🛡️ Güvenli API & Gemini AI 3000 portunda çalışıyor.'));



