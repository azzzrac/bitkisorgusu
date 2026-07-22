import java.io.IOException;
import java.io.PrintStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Kullanıcının girdiği bitki adını Wikipedia'nın özet (summary) API'sinden
 * sorgular ve kısa bir bilgi metni gösterir.
 *
 * Çalıştırma (JDK 11+ ile ekstra derleme gerekmez):
 *   java BitkiSorgu.java
 *   java BitkiSorgu.java lilyum
 *   BitkiSorgu.cmd
 *   BitkiSorgu.cmd lilyum
 *
 * Not: Basit gösterim amaçlı, dış kütüphane olmadan (ilkel regex ile)
 * JSON'dan "title" ve "extract" alanlarını ayıklıyor. Daha sağlam bir
 * JSON ayrıştırma için Gson/Jackson gibi bir kütüphane eklemen önerilir.
 */
public class BitkiSorgu {

    private static final HttpClient client = HttpClient.newHttpClient();

    public static void main(String[] args) throws IOException, InterruptedException {
        System.setOut(new PrintStream(System.out, true, StandardCharsets.UTF_8));

        if (args.length > 0) {
            String bitkiAdi = String.join(" ", args);
            bitkiBilgisiGoster(bitkiAdi);
            return;
        }

        Scanner scanner = new Scanner(System.in, StandardCharsets.UTF_8);
        try {
            while (true) {
                System.out.print("\u001B[39m");
                System.out.flush();
                System.out.print("Bitki adini giriniz (cikmak icin q): ");
                System.out.flush();
                String bitkiAdi = scanner.nextLine().trim();
                System.out.print("\u001B[0m");
                System.out.flush();

                if (bitkiAdi.isBlank()) {
                    System.out.println("Lutfen bir bitki adi gir.");
                    continue;
                }

                if (bitkiAdi.equalsIgnoreCase("q") || bitkiAdi.equalsIgnoreCase("cik") || bitkiAdi.equalsIgnoreCase("exit")) {
                    System.out.println("Cikiliyor...");
                    break;
                }

                if (!bitkiAdiDogrula(bitkiAdi)) {
                    System.out.println("Bu bir bitki adı gibi görünmüyor. Lütfen sadece bir bitki adı girin.");
                    continue;
                }

                bitkiBilgisiGoster(bitkiAdi);
                System.out.println();
            }
        } finally {
            scanner.close();
        }
    }

    private static boolean bitkiAdiDogrula(String bitkiAdi) {
        if (bitkiAdi == null || bitkiAdi.isBlank()) {
            return false;
        }

        String[] yasakKelimeListesi = {"araba", "ev", "masa", "insan", "aslan", "kedi", "su", "hava", "yemek", "kelebek", "köpek", "balık", "kuş", "yılan", "böcek"};
        String kelime = bitkiAdi.toLowerCase().trim();

        if (kelime.length() < 3) {
            return false;
        }

        for (String yasakKelime : yasakKelimeListesi) {
            if (kelime.equals(yasakKelime)) {
                return false;
            }
        }

        return true;
    }

    private static void bitkiBilgisiGoster(String bitkiAdi) throws IOException, InterruptedException {
        System.out.println("\n\"" + bitkiAdi + "\" için bilgi araniyor...\n");

        BitkiBilgisi bilgi = wikipediaOzetiGetir(bitkiAdi, "tr");

        // Türkçe Wikipedia'da bulunamazsa İngilizce'yi dene
        if (bilgi == null) {
            System.out.println("Türkçe Wikipedia'da bulunamadi, İngilizce deneniyor...\n");
            bilgi = wikipediaOzetiGetir(bitkiAdi, "en");
        }

        if (bilgi == null) {
            System.out.println("Bu isimle bir sonuç bulunamadi. Yazimi kontrol edip tekrar dener misin?");
            return;
        }

        if (!bitkiIcerikMi(bilgi)) {
            System.out.println("Bu isimle bir bitki bulunamadi. Lütfen sadece bir bitki adı girin.");
            return;
        }

        yazdirOzet(bilgi);
    }

    private static boolean bitkiIcerikMi(BitkiBilgisi bilgi) {
        String metin = (bilgi.baslik() + " " + bilgi.ozet()).toLowerCase();

        String[] redFlags = {"böcek", "hayvan", "kuş", "balık", "memeli", "sürüngen", "yılan", "aslan", "kedi", "köpek", "insan", "araba", "ev", "masa", "şehir", "ülke"};
        String[] plantHints = {"bitki", "ağaç", "çiçek", "yaprak", "gövde", "kök", "tohum", "çalı", "dal", "fidan", "ot", "kaktüs", "orman", "tür", "familya"};

        for (String flag : redFlags) {
            if (metin.contains(flag)) {
                return false;
            }
        }

        for (String hint : plantHints) {
            if (metin.contains(hint)) {
                return true;
            }
        }

        return false;
    }

    private static BitkiBilgisi wikipediaOzetiGetir(String sorgu, String dil) throws IOException, InterruptedException {
        String encoded = URLEncoder.encode(sorgu, StandardCharsets.UTF_8).replace("+", "%20");
        String url = "https://" + dil + ".wikipedia.org/api/rest_v1/page/summary/" + encoded;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "BitkiSorguUygulamasi/1.0")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() != 200) {
            return null;
        }

        String json = response.body();
        String title = jsonAlaniniCek(json, "title");
        String extract = jsonAlaniniCek(json, "extract");
        String pageUrl = jsonAlaniniCekIcTirnak(json, "\"content_urls\"", "\"desktop\"", "\"page\"");

        if (extract == null || extract.isBlank()) {
            return null;
        }

        return new BitkiBilgisi(title, extract, pageUrl, dil);
    }

    // Basit JSON alan çekici (dış kütüphanesiz). Değer içinde kaçışlı (\") karakterleri de destekler.
    private static String jsonAlaniniCek(String json, String alan) {
        Pattern pattern = Pattern.compile("\"" + alan + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1)
                    .replace("\\n", " ")
                    .replace("\\\"", "\"")
                    .replace("\\/", "/")
                    .trim();
        }
        return null;
    }

    // İç içe geçmiş bir yapıdan (content_urls -> desktop -> page) değer çekmek için basit yardımcı
    private static String jsonAlaniniCekIcTirnak(String json, String... yol) {
        // Basitleştirilmiş: sadece "page" anahtarının ilk geçtiği yeri bulur
        Pattern pattern = Pattern.compile("\"page\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1).replace("\\/", "/");
        }
        return null;
    }

    private static void yazdirOzet(BitkiBilgisi bilgi) {
        System.out.println("=".repeat(50));
        System.out.println(bilgi.baslik());
        System.out.println("=".repeat(50));
        System.out.println(bilgi.ozet());
        if (bilgi.kaynakUrl() != null) {
            System.out.println("\nKaynak: " + bilgi.kaynakUrl());
        }
        System.out.println("(Dil: " + ("tr".equals(bilgi.dil()) ? "Türkçe Wikipedia" : "İngilizce Wikipedia") + ")");
    }

    private record BitkiBilgisi(String baslik, String ozet, String kaynakUrl, String dil) {
    }
}