const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(cors());

// Güvenli Veritabanı Bağlantısı (SQLite)
const db = new sqlite3.Database('./kullanicilar.db', (err) => {
    if (!err) {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )`);
        console.log("🛡️ Güvenli veritabanı bağlandı.");
    }
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
            return res.status(400).json({ error: 'E-posta veya şifre hatalı!' });
        }

        // Girilen şifre ile veritabanındaki BCrypt hash'ini karşılaştır
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'E-posta veya şifre hatalı!' });
        }

        res.json({ success: true, user: { name: user.name, email: user.email } });
    });
});

app.listen(3000, () => console.log('🛡️ Güvenli API 3000 portunda çalışıyor.'));
