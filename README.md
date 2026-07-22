# 🌱 Bitki Keşif Portalı (Plant Discovery Portal)

![Java](https://img.shields.io/badge/Java-11%2B-brightgreen)
![HTML5](https://img.shields.io/badge/Web-HTML5%20%7C%20CSS3%20%7C%20JS-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

**Bitki Keşif Portalı**, bitkiler hakkında detaylı bilgileri, görselleri ve bakım ipuçlarını Wikipedia API entegrasyonu ile anlık olarak sunan interaktif bir masaüstü ve web uygulamasıdır.

---

## ✨ Özellikler

* **🌱 Canlı Wikipedia Sorgulama:** İstediğiniz bitkinin ismini yazarak Türkçe özetine, botanik bilgilerine ve yüksek çözünürlüklü görseline anında erişin.
* **🔎 Akıllı Otomatik Tamamlama:** Türkçe harf esnekliği (Harf duyarsızlaştırma) ve kelime başı eşleşme algoritması ile 80+ bitki arasında hızlı arama.
* **🖼️ Görseli Büyütme & Kaydetme:** Bitki görsellerini yüksek çözünürlüklü tam ekranda inceleyin veya bilgisayarınıza kaydedin.
* **☀️ Bakım İpuçları Rehberi:** Bitkilerin güneş, sulama ve ideal sıcaklık ihtiyaçları hakkında rehber kartları.
* **🌙 Gece Modu (Dark Mode):** Göz yormayan şık karanlık tema desteği.
* **🏆 Botanikçi Rozetleri & Quiz:** Bitki keşfettikçe rozetler kazanın ve bitki bilginizi test edin.
* **📱 Web & Mobil Uyumlu:** Masaüstü Java Swing uygulamasının yanı sıra tarayıcı üzerinden mobil uyumlu web sürümü.

---

## 🚀 Çalıştırma Rehberi

### 1. Masaüstü Arayüzü (Java GUI)
Proje klasöründeyken terminalde (PowerShell veya CMD) şu komutu çalıştırabilirsiniz:

```bash
java BitkiGUI.java
```

### 2. Web & Mobil Sürümü
Tarayıcı üzerinden kullanmak için `web_sunucu.cmd` dosyasına çift tıklayabilir veya yerel bir sunucu başlatarak `index.html` sayfasını açabilirsiniz.

### 3. Komut Satırı Sürümü (CLI)
Konsol üzerinden hızlı sorgulama yapmak için:

```bash
.\BitkiSorgu.cmd "Gül"
```

---

## 🛠️ Teknolojiler
* **Java 11+** (Swing, HttpClient, Multi-threading)
* **HTML5, Vanilla CSS3, JavaScript (ES6+)**
* **Wikipedia REST & OpenSearch API**

---

## 📜 Lisans
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır. İletişime geçmek veya katkıda bulunmak için pull request gönderebilirsiniz!
