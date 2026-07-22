import javax.imageio.ImageIO;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.text.*;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BitkiGUI extends JFrame {
    private final PlaceholderTextField inputField = new PlaceholderTextField("Örn: Gül, Papatya, Orkide, Lavanta...");
    private final JTextPane resultPane = new JTextPane();
    private final ResimPaneli resimPaneli = new ResimPaneli();

    // 1. Üst ve Arama Butonları (Cleaned & Minimal)
    private final ModernButton searchButton = new ModernButton("🔍 Sorgula", new Color(46, 125, 50), new Color(67, 160, 71));
    private final ModernButton randomButton = new ModernButton("🎲 Rastgele", new Color(0, 137, 123), new Color(0, 150, 136));
    private final ModernButton clearButton = new ModernButton("🧹 Temizle", new Color(117, 117, 117), new Color(158, 158, 158));

    // 2. Sonuç Eylem Butonları (Result Action Bar)
    private final ModernButton favAddButton = new ModernButton("⭐ Favorile", new Color(245, 124, 0), new Color(251, 140, 0));
    private final ModernButton saveImgButton = new ModernButton("💾 Resmi Kaydet", new Color(78, 52, 46), new Color(109, 76, 65));
    private final ModernButton wikiButton = new ModernButton("🌐 Vikipedi'de Oku", new Color(123, 31, 162), new Color(156, 39, 176));
    private final ModernButton zoomButton = new ModernButton("🖼️ Görseli Büyüt", new Color(2, 136, 209), new Color(3, 169, 244));
    private final ModernButton exitButton = new ModernButton("❌ Çıkış", new Color(198, 40, 40), new Color(229, 57, 53));

    // 3. Header Sağ Taraf (Hesabım & Tema)
    private final ModernButton profileButton = new ModernButton("👤 Giriş Yap / Kayıt Ol", new Color(40, 116, 166), new Color(52, 152, 219));
    private final ModernButton themeToggleButton = new ModernButton("🌙 Gece Modu", new Color(55, 71, 79), new Color(69, 90, 100));

    private final JComboBox<String> historyCombo = new JComboBox<>(new String[]{"📜 Son Aramalar"});
    private final JLabel statusLabel = new JLabel("Hazır", SwingConstants.LEFT);
    private final JPopupMenu suggestPopup = new JPopupMenu();

    // Bakım İpuçları Etiketleri
    private final JLabel careSunLabel = new JLabel("☀️ Güneş: -");
    private final JLabel careWaterLabel = new JLabel("💧 Sulama: -");
    private final JLabel careTempLabel = new JLabel("🌡️ Sıcaklık: -");
    private final RoundedPanel careCard = new RoundedPanel(14, new Color(238, 246, 239), new Color(200, 225, 202));

    // Trivia Kartı
    private final JLabel triviaLabel = new JLabel("💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99'unu üretir!");
    private final RoundedPanel triviaCard = new RoundedPanel(14, new Color(254, 249, 231), new Color(245, 230, 180));

    private final JPanel mainPanel = new JPanel(new BorderLayout(14, 14));
    private final RoundedPanel headerCard = new RoundedPanel(18, Color.WHITE, new Color(220, 235, 222));
    private final RoundedPanel inputCard = new RoundedPanel(18, Color.WHITE, new Color(220, 235, 222));
    private final RoundedPanel resultCard = new RoundedPanel(18, Color.WHITE, new Color(220, 235, 222));
    private final JLabel titleLabel = new JLabel("🌱 Bitki Keşif Portalı");
    private final JLabel subtitleLabel = new JLabel("Bitkileri isimleriyle arayın, özelliklerini ve görsellerini inceleyin.");
    private final JLabel fieldLabel = new JLabel("Bitki Adı:");
    private final JScrollPane scrollPane = new JScrollPane(resultPane);

    private final HttpClient client = HttpClient.newHttpClient();
    private javax.swing.Timer typingTimer;
    private int typingIndex = 0;
    private String fullText = "";
    private BufferedImage currentImage = null;
    private String currentWikiUrl = null;
    private AramaSonucu currentSonuc = null;

    private boolean isDarkMode = false;
    private boolean isSoundEnabled = true;
    private boolean isLoggedIn = false;
    private String userEmail = "";
    private final java.util.Map<String, String[]> registeredUserDb = new java.util.HashMap<>();
    private int quizScore = 0;
    private int totalSearchCount = 0;
    private String userName = "Botanik Sevdalısı";
    private String userAvatar = "🌿";

    private final List<BitkiKayit> favoriListesi = new ArrayList<>();
    private final List<String> sonAramalar = new ArrayList<>();
    private final List<EvBitkisi> evBitkileri = new ArrayList<>();
    private final Set<String> kesfedilenBitkiler = new HashSet<>();
    private final List<String> kisiselNotlar = new ArrayList<>();

    private final List<String> dictionary = new ArrayList<>(List.of(
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
    ));

    public BitkiGUI() {
        super("🌱 Bitki Keşif Portalı");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1060, 820);
        setMinimumSize(new Dimension(940, 720));
        setLocationRelativeTo(null);

        mainPanel.setBorder(new EmptyBorder(16, 20, 16, 20));

        // Günün Bitkisi Banner
        RoundedPanel potdBanner = new RoundedPanel(14, new Color(232, 245, 233), new Color(165, 214, 167));
        potdBanner.setLayout(new BorderLayout(10, 0));
        potdBanner.setBorder(new EmptyBorder(8, 16, 8, 16));

        JLabel potdLabel = new JLabel("🌟 GÜNÜN BİTKİSİ: LAVANTA - Stresi azaltan harika kokulu mor mucize!");
        potdLabel.setFont(new Font("Segoe UI", Font.BOLD, 13));
        potdLabel.setForeground(new Color(27, 94, 32));

        ModernButton potdExploreBtn = new ModernButton("🔍 Keşfet", new Color(46, 125, 50), new Color(67, 160, 71));
        potdExploreBtn.setPreferredSize(new Dimension(90, 28));
        potdExploreBtn.addActionListener(e -> {
            inputField.setText("Lavanta");
            sorgula(null);
        });

        potdBanner.add(potdLabel, BorderLayout.WEST);
        potdBanner.add(potdExploreBtn, BorderLayout.EAST);

        // Header Card (Sadece Başlık + Hesabım & Gece Modu)
        headerCard.setLayout(new BorderLayout(10, 5));
        headerCard.setBorder(new EmptyBorder(12, 18, 12, 18));
        titleLabel.setFont(new Font("Segoe UI", Font.BOLD, 24));
        subtitleLabel.setFont(new Font("Segoe UI", Font.PLAIN, 13));

        JPanel headerTextPanel = new JPanel(new BorderLayout(5, 4));
        headerTextPanel.setOpaque(false);
        headerTextPanel.add(titleLabel, BorderLayout.NORTH);
        headerTextPanel.add(subtitleLabel, BorderLayout.SOUTH);

        JPanel headerRightPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        headerRightPanel.setOpaque(false);
        headerRightPanel.add(profileButton);
        headerRightPanel.add(themeToggleButton);

        headerCard.add(headerTextPanel, BorderLayout.CENTER);
        headerCard.add(headerRightPanel, BorderLayout.EAST);

        // Input Card (Sadece Sorgula, Rastgele, Temizle)
        inputCard.setLayout(new BorderLayout(10, 10));
        inputCard.setBorder(new EmptyBorder(14, 18, 14, 18));

        fieldLabel.setFont(new Font("Segoe UI", Font.BOLD, 14));

        JPanel fieldPanel = new JPanel(new BorderLayout(10, 0));
        fieldPanel.setOpaque(false);
        fieldPanel.add(fieldLabel, BorderLayout.WEST);
        fieldPanel.add(inputField, BorderLayout.CENTER);
        fieldPanel.add(historyCombo, BorderLayout.EAST);

        historyCombo.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        historyCombo.setPreferredSize(new Dimension(150, 36));

        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        buttonPanel.setOpaque(false);
        buttonPanel.add(searchButton);
        buttonPanel.add(randomButton);
        buttonPanel.add(clearButton);

        inputCard.add(fieldPanel, BorderLayout.NORTH);
        inputCard.add(buttonPanel, BorderLayout.SOUTH);

        setupAutoComplete();

        // Bakım Rehberi Kartı Setup
        careCard.setLayout(new FlowLayout(FlowLayout.LEFT, 20, 6));
        careCard.setBorder(new EmptyBorder(6, 12, 6, 12));

        Font careFont = new Font("Segoe UI", Font.BOLD, 12);
        careSunLabel.setFont(careFont);
        careWaterLabel.setFont(careFont);
        careTempLabel.setFont(careFont);

        careSunLabel.setForeground(new Color(40, 75, 45));
        careWaterLabel.setForeground(new Color(40, 75, 45));
        careTempLabel.setForeground(new Color(40, 75, 45));

        careCard.add(careSunLabel);
        careCard.add(careWaterLabel);
        careCard.add(careTempLabel);

        // Trivia Kartı Setup
        triviaCard.setLayout(new BorderLayout());
        triviaCard.setBorder(new EmptyBorder(8, 14, 8, 14));
        triviaLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        triviaLabel.setForeground(new Color(110, 80, 20));
        triviaCard.add(triviaLabel, BorderLayout.CENTER);

        JPanel infoBottomSection = new JPanel(new BorderLayout(6, 6));
        infoBottomSection.setOpaque(false);
        infoBottomSection.add(careCard, BorderLayout.NORTH);
        infoBottomSection.add(triviaCard, BorderLayout.SOUTH);

        // Result Card (İçerik + Şık Alt Eylem Çubuğu)
        resultCard.setLayout(new BorderLayout(12, 12));
        resultCard.setBorder(new EmptyBorder(16, 18, 16, 18));

        resultPane.setEditable(false);
        resultPane.setMargin(new Insets(10, 12, 10, 12));

        scrollPane.setPreferredSize(new Dimension(580, 270));
        scrollPane.getViewport().setBackground(Color.WHITE);

        JPanel textPanel = new JPanel(new BorderLayout(8, 8));
        textPanel.setOpaque(false);
        textPanel.add(scrollPane, BorderLayout.CENTER);
        textPanel.add(infoBottomSection, BorderLayout.SOUTH);

        JPanel imageWrapper = new JPanel(new BorderLayout());
        imageWrapper.setOpaque(false);
        imageWrapper.add(resimPaneli, BorderLayout.NORTH);

        JPanel contentPanel = new JPanel(new BorderLayout(16, 16));
        contentPanel.setOpaque(false);
        contentPanel.add(imageWrapper, BorderLayout.WEST);
        contentPanel.add(textPanel, BorderLayout.CENTER);

        // Şık Sonuç Alt Araç Çubuğu (Result Action Bar)
        JPanel resultActionBar = new JPanel(new BorderLayout(10, 0));
        resultActionBar.setOpaque(false);

        JPanel resultButtonsLeft = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        resultButtonsLeft.setOpaque(false);
        resultButtonsLeft.add(favAddButton);
        resultButtonsLeft.add(saveImgButton);
        resultButtonsLeft.add(wikiButton);
        resultButtonsLeft.add(zoomButton);

        JPanel resultButtonsRight = new JPanel(new FlowLayout(FlowLayout.RIGHT, 0, 0));
        resultButtonsRight.setOpaque(false);
        resultButtonsRight.add(exitButton);

        resultActionBar.add(resultButtonsLeft, BorderLayout.WEST);
        resultActionBar.add(resultButtonsRight, BorderLayout.EAST);

        statusLabel.setFont(new Font("Segoe UI", Font.ITALIC, 12));

        JPanel bottomResultSection = new JPanel(new BorderLayout(8, 8));
        bottomResultSection.setOpaque(false);
        bottomResultSection.add(resultActionBar, BorderLayout.NORTH);
        bottomResultSection.add(statusLabel, BorderLayout.SOUTH);

        resultCard.add(contentPanel, BorderLayout.CENTER);
        resultCard.add(bottomResultSection, BorderLayout.SOUTH);

        JPanel topContainer = new JPanel(new BorderLayout(8, 8));
        topContainer.setOpaque(false);
        topContainer.add(potdBanner, BorderLayout.NORTH);

        JPanel middleHeader = new JPanel(new BorderLayout(8, 8));
        middleHeader.setOpaque(false);
        middleHeader.add(headerCard, BorderLayout.NORTH);
        middleHeader.add(inputCard, BorderLayout.SOUTH);

        topContainer.add(middleHeader, BorderLayout.SOUTH);

        mainPanel.add(topContainer, BorderLayout.NORTH);
        mainPanel.add(resultCard, BorderLayout.CENTER);
        add(mainPanel);

        applyTheme();

        // Listeners
        searchButton.addActionListener(this::sorgula);
        inputField.addActionListener(this::sorgula);

        profileButton.addActionListener(e -> showProfileDialog());

        randomButton.addActionListener(e -> {
            int r = (int) (Math.random() * dictionary.size());
            String secilen = dictionary.get(r);
            inputField.setText(secilen);
            sorgula(null);
        });

        saveImgButton.addActionListener(e -> {
            if (currentImage != null) {
                JFileChooser fileChooser = new JFileChooser();
                fileChooser.setDialogTitle("Bitki Görselini Kaydet");
                String safeName = inputField.getText().trim().replaceAll("[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]", "_");
                if (safeName.isBlank()) safeName = "bitki_gorsel";
                fileChooser.setSelectedFile(new java.io.File(safeName + ".png"));

                int userSelection = fileChooser.showSaveDialog(this);
                if (userSelection == JFileChooser.APPROVE_OPTION) {
                    java.io.File fileToSave = fileChooser.getSelectedFile();
                    try {
                        ImageIO.write(currentImage, "png", fileToSave);
                        statusLabel.setText("💾 Resim kaydedildi: " + fileToSave.getName());
                        JOptionPane.showMessageDialog(this, "Görsel başarıyla kaydedildi:\n" + fileToSave.getAbsolutePath(), "Başarılı", JOptionPane.INFORMATION_MESSAGE);
                    } catch (IOException ex) {
                        JOptionPane.showMessageDialog(this, "Resim kaydedilirken hata oluştu: " + ex.getMessage(), "Hata", JOptionPane.ERROR_MESSAGE);
                    }
                }
            } else {
                JOptionPane.showMessageDialog(this, "Kaydedilecek aktif bir resim bulunmuyor.", "Bilgi", JOptionPane.INFORMATION_MESSAGE);
            }
        });

        clearButton.addActionListener(e -> {
            inputField.setText("");
            suggestPopup.setVisible(false);
            if (typingTimer != null && typingTimer.isRunning()) {
                typingTimer.stop();
            }
            setInfoText("Detaylı sonuçlar burada görünecektir...", isDarkMode ? new Color(140, 180, 145) : new Color(128, 165, 133));
            resimPaneli.setImage(null);
            resimPaneli.setText("Resim burada görünür.");
            resimPaneli.resetZoom();
            updateCareTips("-", "-", "-");
            triviaLabel.setText("💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99'unu üretir!");
            currentImage = null;
            currentWikiUrl = null;
            currentSonuc = null;
            statusLabel.setText("Arayüz temizlendi.");
        });

        exitButton.addActionListener(e -> dispose());

        themeToggleButton.addActionListener(e -> {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                themeToggleButton.setText("☀️ Gündüz Modu");
            } else {
                themeToggleButton.setText("🌙 Gece Modu");
            }
            applyTheme();
        });

        wikiButton.addActionListener(e -> {
            if (currentWikiUrl != null && !currentWikiUrl.isBlank()) {
                try {
                    Desktop.getDesktop().browse(URI.create(currentWikiUrl));
                    statusLabel.setText("🌐 Tarayıcıda açıldı: " + currentWikiUrl);
                } catch (Exception ex) {
                    JOptionPane.showMessageDialog(this, "Bağlantı açılamadı: " + ex.getMessage(), "Hata", JOptionPane.ERROR_MESSAGE);
                }
            } else {
                JOptionPane.showMessageDialog(this, "Lütfen önce bir bitki araması yapın.", "Bilgi", JOptionPane.INFORMATION_MESSAGE);
            }
        });

        favAddButton.addActionListener(e -> {
            if (currentSonuc != null && currentSonuc.baslik() != null) {
                boolean zatenVar = favoriListesi.stream().anyMatch(f -> f.baslik().equalsIgnoreCase(currentSonuc.baslik()));
                if (!zatenVar) {
                    favoriListesi.add(new BitkiKayit(currentSonuc.baslik(), currentSonuc.ozet(), currentSonuc.resim(), currentWikiUrl));
                    statusLabel.setText("⭐ '" + currentSonuc.baslik() + "' favorilere eklendi!");
                    JOptionPane.showMessageDialog(this, "'" + currentSonuc.baslik() + "' favorilerinize başarıyla eklendi!", "Favori Eklendi", JOptionPane.INFORMATION_MESSAGE);
                } else {
                    JOptionPane.showMessageDialog(this, "Bu bitki zaten favorilerinizde kayıtlı.", "Bilgi", JOptionPane.INFORMATION_MESSAGE);
                }
            } else {
                JOptionPane.showMessageDialog(this, "Favorilere eklemek için önce geçerli bir bitki arayın.", "Uyarı", JOptionPane.WARNING_MESSAGE);
            }
        });

        historyCombo.addActionListener(e -> {
            String secilen = (String) historyCombo.getSelectedItem();
            if (secilen != null && !secilen.equals("📜 Son Aramalar")) {
                inputField.setText(secilen);
                sorgula(null);
            }
        });

        zoomButton.addActionListener(e -> {
            if (currentImage != null) {
                JDialog fullScreenDialog = new JDialog(this, "🔍 Tam Ekran Görsel", true);
                fullScreenDialog.setUndecorated(true);
                fullScreenDialog.setLayout(new BorderLayout());

                JPanel topBar = new JPanel(new BorderLayout());
                topBar.setBackground(new Color(25, 28, 25));
                topBar.setBorder(BorderFactory.createEmptyBorder(12, 20, 12, 20));

                String bitkiBaslik = inputField.getText().trim();
                if (bitkiBaslik.isBlank() || bitkiBaslik.equals(inputField.getPlaceholder())) {
                    bitkiBaslik = "Bitki Görseli";
                } else {
                    bitkiBaslik = bitkiBaslik.toUpperCase(Locale.forLanguageTag("tr-TR"));
                }

                JLabel dialogTitleLabel = new JLabel("🌿 " + bitkiBaslik + " - Tam Ekran Görünüm");
                dialogTitleLabel.setFont(new Font("Segoe UI", Font.BOLD, 16));
                dialogTitleLabel.setForeground(new Color(230, 245, 232));

                JButton closeBtn = new JButton("❌ Kapat (ESC)");
                closeBtn.setFont(new Font("Segoe UI", Font.BOLD, 13));
                closeBtn.setForeground(Color.WHITE);
                closeBtn.setBackground(new Color(198, 40, 40));
                closeBtn.setFocusPainted(false);
                closeBtn.setBorderPainted(false);
                closeBtn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
                closeBtn.setPreferredSize(new Dimension(130, 34));
                closeBtn.addActionListener(evt -> fullScreenDialog.dispose());

                topBar.add(dialogTitleLabel, BorderLayout.WEST);
                topBar.add(closeBtn, BorderLayout.EAST);

                JPanel imageViewerPanel = new JPanel() {
                    @Override
                    protected void paintComponent(Graphics g) {
                        super.paintComponent(g);
                        int w = getWidth();
                        int h = getHeight();
                        if (currentImage == null || w <= 0 || h <= 0) return;

                        double widthRatio = (double) w / currentImage.getWidth();
                        double heightRatio = (double) h / currentImage.getHeight();
                        double scale = Math.min(widthRatio, heightRatio);

                        int dw = Math.max(1, (int) Math.round(currentImage.getWidth() * scale));
                        int dh = Math.max(1, (int) Math.round(currentImage.getHeight() * scale));

                        int x = (w - dw) / 2;
                        int y = (h - dh) / 2;

                        Graphics2D g2 = (Graphics2D) g.create();
                        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                        g2.drawImage(currentImage, x, y, dw, dh, null);
                        g2.dispose();
                    }
                };
                imageViewerPanel.setBackground(new Color(15, 18, 15));

                fullScreenDialog.add(topBar, BorderLayout.NORTH);
                fullScreenDialog.add(imageViewerPanel, BorderLayout.CENTER);

                fullScreenDialog.getRootPane().registerKeyboardAction(
                        evt -> fullScreenDialog.dispose(),
                        KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0),
                        JComponent.WHEN_IN_FOCUSED_WINDOW
                );
                GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
                fullScreenDialog.setBounds(ge.getMaximumWindowBounds());
                fullScreenDialog.setVisible(true);
            } else {
                JOptionPane.showMessageDialog(this, "Görüntülenecek aktif bir resim bulunmuyor.", "Bilgi", JOptionPane.INFORMATION_MESSAGE);
            }
        });
    }

    // 👤 "HESABIM" PROFİL VE ARAÇLAR PENCERESİ (Giriş Yapılınca Açılır)
    private void showProfileDialog() {
        if (!isLoggedIn) {
            showAuthDialog();
            return;
        }

        JDialog profileDialog = new JDialog(this, "👤 Hesabım & Profil Merkezi", true);
        profileDialog.setSize(640, 620);
        profileDialog.setLocationRelativeTo(this);

        JPanel mainProfPanel = new JPanel(new BorderLayout(14, 14));
        mainProfPanel.setBorder(new EmptyBorder(18, 20, 18, 20));
        mainProfPanel.setBackground(isDarkMode ? new Color(20, 28, 21) : new Color(242, 247, 243));

        // Profil Header
        RoundedPanel userHeader = new RoundedPanel(14, isDarkMode ? new Color(30, 42, 32) : Color.WHITE, new Color(180, 215, 185));
        userHeader.setLayout(new BorderLayout(12, 12));
        userHeader.setBorder(new EmptyBorder(14, 16, 14, 16));

        JLabel avatarLabel = new JLabel(userAvatar, SwingConstants.CENTER);
        avatarLabel.setFont(new Font("Segoe UI", Font.PLAIN, 40));

        JLabel nameLabel = new JLabel(userName);
        nameLabel.setFont(new Font("Segoe UI", Font.BOLD, 18));
        nameLabel.setForeground(isDarkMode ? new Color(232, 245, 233) : new Color(27, 94, 32));

        String titleRank = "Acemi Botanikçi";
        if (kesfedilenBitkiler.size() >= 30) titleRank = "👑 Master Botanik Ustası";
        else if (kesfedilenBitkiler.size() >= 20) titleRank = "💎 Bitki Uzmanı";
        else if (kesfedilenBitkiler.size() >= 10) titleRank = "🥇 Acemi Botanikçi";
        else if (kesfedilenBitkiler.size() >= 5) titleRank = "🥈 Doğa Dostu";

        JLabel rankLabel = new JLabel("📧 " + (userEmail.isBlank() ? "google.user@gmail.com" : userEmail) + " | Unvan: " + titleRank);
        rankLabel.setFont(new Font("Segoe UI", Font.ITALIC, 12));
        rankLabel.setForeground(isDarkMode ? new Color(160, 195, 165) : new Color(80, 115, 85));

        JPanel namePanel = new JPanel(new GridLayout(2, 1, 2, 2));
        namePanel.setOpaque(false);
        namePanel.add(nameLabel);
        namePanel.add(rankLabel);

        ModernButton editNameBtn = new ModernButton("✏️ İsmi Düzenle", new Color(40, 116, 166), new Color(52, 152, 219));
        editNameBtn.setPreferredSize(new Dimension(120, 32));
        editNameBtn.addActionListener(e -> {
            String newName = JOptionPane.showInputDialog(profileDialog, "Yeni Profil İsminizi Yazın:", userName);
            if (newName != null && !newName.isBlank()) {
                userName = newName.trim();
                nameLabel.setText(userName);
                profileButton.setText("👤 " + userName);
            }
        });

        userHeader.add(avatarLabel, BorderLayout.WEST);
        userHeader.add(namePanel, BorderLayout.CENTER);
        userHeader.add(editNameBtn, BorderLayout.EAST);

        // Hızlı Araçlar Menüsü (4 Ana Özellik)
        JPanel toolsGrid = new JPanel(new GridLayout(2, 2, 10, 10));
        toolsGrid.setOpaque(false);

        ModernButton btnBadge = new ModernButton("🏆 Keşifler & Rozetler (" + kesfedilenBitkiler.size() + ")", new Color(216, 67, 21), new Color(230, 81, 0));
        ModernButton btnQuiz = new ModernButton("🎮 Bitki Quizi Oyna", new Color(142, 36, 170), new Color(171, 71, 188));
        ModernButton btnRem = new ModernButton("⏰ Sulama Takvimim", new Color(0, 121, 107), new Color(0, 150, 136));
        ModernButton btnFav = new ModernButton("⭐ Favori Bitkilerim (" + favoriListesi.size() + ")", new Color(230, 81, 0), new Color(245, 124, 0));

        btnBadge.addActionListener(e -> showAchievementsDialog());
        btnQuiz.addActionListener(e -> showQuizDialog());
        btnRem.addActionListener(e -> showWateringReminderDialog());
        btnFav.addActionListener(e -> showFavoritesDialog());

        toolsGrid.add(btnBadge);
        toolsGrid.add(btnQuiz);
        toolsGrid.add(btnRem);
        toolsGrid.add(btnFav);

        // İstatistikler Kartı
        RoundedPanel statsCard = new RoundedPanel(14, isDarkMode ? new Color(30, 42, 32) : Color.WHITE, new Color(180, 215, 185));
        statsCard.setLayout(new GridLayout(2, 2, 8, 8));
        statsCard.setBorder(new EmptyBorder(10, 14, 10, 14));

        statsCard.add(createStatItem("🔍 Toplam Arama", String.valueOf(totalSearchCount)));
        statsCard.add(createStatItem("🌿 Keşfedilen Tür", String.valueOf(kesfedilenBitkiler.size())));
        statsCard.add(createStatItem("⭐ Favori Sayısı", String.valueOf(favoriListesi.size())));
        statsCard.add(createStatItem("🏆 Quiz Skoru", quizScore + " Puan"));

        // Kişisel Botanik Notlarım
        JPanel notesPanel = new JPanel(new BorderLayout(6, 6));
        notesPanel.setOpaque(false);

        JLabel notesTitle = new JLabel("📝 Botanik Günlüğüm (Kişisel Notlarım):");
        notesTitle.setFont(new Font("Segoe UI", Font.BOLD, 13));
        notesTitle.setForeground(isDarkMode ? new Color(232, 245, 233) : new Color(30, 60, 35));

        DefaultListModel<String> noteModel = new DefaultListModel<>();
        for (String n : kisiselNotlar) noteModel.addElement("📌 " + n);
        JList<String> noteJList = new JList<>(noteModel);
        noteJList.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        noteJList.setBackground(isDarkMode ? new Color(25, 35, 27) : new Color(250, 253, 250));
        noteJList.setForeground(isDarkMode ? new Color(220, 240, 222) : Color.DARK_GRAY);
        JScrollPane noteScroll = new JScrollPane(noteJList);
        noteScroll.setPreferredSize(new Dimension(550, 80));

        JPanel noteInputPanel = new JPanel(new BorderLayout(6, 0));
        noteInputPanel.setOpaque(false);
        PlaceholderTextField newNoteField = new PlaceholderTextField("Yeni notunuzu yazın...");
        ModernButton addNoteBtn = new ModernButton("➕ Ekle", new Color(46, 125, 50), new Color(67, 160, 71));
        addNoteBtn.setPreferredSize(new Dimension(80, 32));
        addNoteBtn.addActionListener(e -> {
            String nt = newNoteField.getText().trim();
            if (!nt.isBlank()) {
                kisiselNotlar.add(nt);
                noteModel.addElement("📌 " + nt);
                newNoteField.setText("");
            }
        });

        noteInputPanel.add(newNoteField, BorderLayout.CENTER);
        noteInputPanel.add(addNoteBtn, BorderLayout.EAST);

        notesPanel.add(notesTitle, BorderLayout.NORTH);
        notesPanel.add(noteScroll, BorderLayout.CENTER);
        notesPanel.add(noteInputPanel, BorderLayout.SOUTH);

        // Oturumu Kapat Butonu
        ModernButton logoutBtn = new ModernButton("🚪 Oturumu Kapat / Çıkış Yap", new Color(198, 40, 40), new Color(229, 57, 53));
        logoutBtn.setPreferredSize(new Dimension(0, 36));
        logoutBtn.addActionListener(e -> {
            int confirm = JOptionPane.showConfirmDialog(profileDialog, "Oturumu kapatmak istediğinize emin misiniz?", "Oturumu Kapat", JOptionPane.YES_NO_OPTION);
            if (confirm == JOptionPane.YES_OPTION) {
                isLoggedIn = false;
                userName = "Botanik Sevdalısı";
                userEmail = "";
                userAvatar = "🌿";
                profileButton.setText("👤 Giriş Yap / Kayıt Ol");
                profileDialog.dispose();
                JOptionPane.showMessageDialog(this, "👋 Oturumunuz kapatıldı.", "Bilgi", JOptionPane.INFORMATION_MESSAGE);
            }
        });

        JPanel centerContainer = new JPanel(new BorderLayout(10, 10));
        centerContainer.setOpaque(false);
        centerContainer.add(toolsGrid, BorderLayout.NORTH);
        centerContainer.add(statsCard, BorderLayout.CENTER);
        centerContainer.add(notesPanel, BorderLayout.SOUTH);

        mainProfPanel.add(userHeader, BorderLayout.NORTH);
        mainProfPanel.add(centerContainer, BorderLayout.CENTER);
        mainProfPanel.add(logoutBtn, BorderLayout.SOUTH);

        profileDialog.add(mainProfPanel);
        profileDialog.setVisible(true);
    }

    // 🔐 GİRİŞ YAP & HESAP OLUŞTUR PENCERESİ
    private void showAuthDialog() {
        JDialog authDialog = new JDialog(this, "🔐 Oturum Aç veya Kayıt Ol", true);
        authDialog.setSize(440, 480);
        authDialog.setLocationRelativeTo(this);

        JPanel mainPanel = new JPanel(new BorderLayout(12, 12));
        mainPanel.setBorder(new EmptyBorder(20, 24, 20, 24));
        mainPanel.setBackground(isDarkMode ? new Color(20, 28, 21) : new Color(242, 247, 243));

        // Başlık
        JLabel titleLbl = new JLabel("🌱 Bitki Keşif Portalı", SwingConstants.CENTER);
        titleLbl.setFont(new Font("Segoe UI", Font.BOLD, 20));
        titleLbl.setForeground(isDarkMode ? new Color(129, 199, 132) : new Color(27, 94, 32));

        JLabel subTitleLbl = new JLabel("Keşiflerinizi ve rozetlerinizi kaydetmek için giriş yapın.", SwingConstants.CENTER);
        subTitleLbl.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        subTitleLbl.setForeground(isDarkMode ? new Color(160, 195, 165) : new Color(80, 115, 85));

        JPanel topHeader = new JPanel(new GridLayout(2, 1, 4, 4));
        topHeader.setOpaque(false);
        topHeader.add(titleLbl);
        topHeader.add(subTitleLbl);

        // Google ile Hızlı Giriş Butonu
        ModernButton googleBtn = new ModernButton("🌐 Google Hesabı İle Hızlı Giriş Yap", new Color(66, 133, 244), new Color(51, 103, 214));
        googleBtn.setPreferredSize(new Dimension(0, 42));
        googleBtn.addActionListener(e -> {
            String gEmail = JOptionPane.showInputDialog(authDialog, "Google Girişi:\nLütfen Gmail Adresinizi Giriniz:", "ornek.kullanici@gmail.com");
            if (gEmail != null && gEmail.contains("@")) {
                String defaultName = gEmail.split("@")[0].replace(".", " ");
                userName = defaultName.substring(0, 1).toUpperCase() + defaultName.substring(1) + " (Google)";
                userEmail = gEmail.trim();
                userAvatar = "🌐";
                isLoggedIn = true;
                profileButton.setText("👤 " + userName);
                authDialog.dispose();
                JOptionPane.showMessageDialog(this, "🎉 Google hesabınızla başarıyla giriş yapıldı!\nHoş geldiniz, " + userName, "Giriş Başarılı", JOptionPane.INFORMATION_MESSAGE);
                showProfileDialog();
            }
        });

        JLabel dividerLbl = new JLabel("--- veya E-posta İle ---", SwingConstants.CENTER);
        dividerLbl.setFont(new Font("Segoe UI", Font.ITALIC, 11));

        // Form Elemanları
        JPanel formPanel = new JPanel(new GridLayout(3, 2, 8, 10));
        formPanel.setOpaque(false);

        JLabel nameLbl = new JLabel("Ad Soyad:");
        PlaceholderTextField nameField = new PlaceholderTextField("Örn: Ahmet Yılmaz");

        JLabel emailLbl = new JLabel("E-posta:");
        PlaceholderTextField emailField = new PlaceholderTextField("ornek@gmail.com");

        JLabel passLbl = new JLabel("Şifre:");
        JPasswordField passField = new JPasswordField();

        formPanel.add(nameLbl);
        formPanel.add(nameField);
        formPanel.add(emailLbl);
        formPanel.add(emailField);
        formPanel.add(passLbl);
        formPanel.add(passField);

        // Alt Butonlar
        JPanel actionPanel = new JPanel(new GridLayout(1, 2, 10, 0));
        actionPanel.setOpaque(false);

        ModernButton loginBtn = new ModernButton("🔑 Giriş Yap", new Color(46, 125, 50), new Color(67, 160, 71));
        ModernButton registerBtn = new ModernButton("📝 Kayıt Ol", new Color(0, 137, 123), new Color(0, 150, 136));

        loginBtn.addActionListener(e -> {
            String em = emailField.getText().trim().toLowerCase();
            String pwd = new String(passField.getPassword()).trim();
            if (em.isBlank() || pwd.isBlank()) {
                JOptionPane.showMessageDialog(authDialog, "Lütfen e-posta ve şifre giriniz.", "Uyarı", JOptionPane.WARNING_MESSAGE);
                return;
            }

            if (registeredUserDb.containsKey(em)) {
                String[] userData = registeredUserDb.get(em);
                if (!userData[1].equals(pwd)) {
                    JOptionPane.showMessageDialog(authDialog, "⚠️ HATA: Şifreniz hatalı! Lütfen tekrar deneyin.", "Giriş Hatası", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                userName = userData[0];
            } else {
                userName = em.split("@")[0];
            }

            userEmail = em;
            userAvatar = "🌿";
            isLoggedIn = true;
            profileButton.setText("👤 " + userName);
            authDialog.dispose();
            JOptionPane.showMessageDialog(this, "🎉 Başarıyla giriş yapıldı! Hoş geldiniz, " + userName, "Başarılı", JOptionPane.INFORMATION_MESSAGE);
            showProfileDialog();
        });

        registerBtn.addActionListener(e -> {
            String nm = nameField.getText().trim();
            String em = emailField.getText().trim().toLowerCase();
            String pwd = new String(passField.getPassword()).trim();
            if (nm.isBlank() || em.isBlank() || pwd.isBlank()) {
                JOptionPane.showMessageDialog(authDialog, "Lütfen Ad Soyad, E-posta ve Şifre alanlarını doldurunuz.", "Uyarı", JOptionPane.WARNING_MESSAGE);
                return;
            }

            // Çift E-posta Kontrolü
            if (registeredUserDb.containsKey(em)) {
                JOptionPane.showMessageDialog(authDialog, "⚠️ HATA: \"" + em + "\" e-posta adresi ile zaten kayıt yapılmış!\nLütfen '🔑 Giriş Yap' butonunu kullanarak oturum açın.", "Zaten Kayıtlı", JOptionPane.WARNING_MESSAGE);
                return;
            }

            registeredUserDb.put(em, new String[]{ nm, pwd });
            userName = nm;
            userEmail = em;
            userAvatar = "🌿";
            isLoggedIn = true;
            profileButton.setText("👤 " + userName);
            authDialog.dispose();
            JOptionPane.showMessageDialog(this, "🎉 Hesabınız başarıyla oluşturuldu! Hoş geldiniz, " + userName, "Tebrikler", JOptionPane.INFORMATION_MESSAGE);
            showProfileDialog();
        });

        actionPanel.add(loginBtn);
        actionPanel.add(registerBtn);

        JPanel centerBox = new JPanel();
        centerBox.setLayout(new BoxLayout(centerBox, BoxLayout.Y_AXIS));
        centerBox.setOpaque(false);
        googleBtn.setAlignmentX(Component.CENTER_ALIGNMENT);
        dividerLbl.setAlignmentX(Component.CENTER_ALIGNMENT);
        
        centerBox.add(googleBtn);
        centerBox.add(Box.createVerticalStrut(10));
        centerBox.add(dividerLbl);
        centerBox.add(Box.createVerticalStrut(10));
        centerBox.add(formPanel);

        mainPanel.add(topHeader, BorderLayout.NORTH);
        mainPanel.add(centerBox, BorderLayout.CENTER);
        mainPanel.add(actionPanel, BorderLayout.SOUTH);

        authDialog.add(mainPanel);
        authDialog.setVisible(true);
    }

    private JLabel createStatItem(String label, String value) {
        JLabel lbl = new JLabel("<html><b>" + label + ":</b> <font color='#2E7D32'>" + value + "</font></html>");
        lbl.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        lbl.setForeground(isDarkMode ? new Color(220, 235, 222) : new Color(40, 60, 45));
        return lbl;
    }

    private String normalizeTR(String str) {
        if (str == null) return "";
        return str.toLowerCase(Locale.forLanguageTag("tr-TR"))
                .replace('ç', 'c')
                .replace('ğ', 'g')
                .replace('ı', 'i')
                .replace('ö', 'o')
                .replace('ş', 's')
                .replace('ü', 'u')
                .replace('İ', 'i')
                .replace('I', 'i')
                .trim();
    }

    private void setupAutoComplete() {
        suggestPopup.setFocusable(false);
        inputField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) { updateSuggestions(); }
            @Override
            public void removeUpdate(DocumentEvent e) { updateSuggestions(); }
            @Override
            public void changedUpdate(DocumentEvent e) { updateSuggestions(); }

            private void updateSuggestions() {
                SwingUtilities.invokeLater(() -> {
                    suggestPopup.setVisible(false);
                    suggestPopup.removeAll();

                    String rawQuery = inputField.getText().trim();
                    String queryNorm = normalizeTR(rawQuery);
                    if (queryNorm.length() < 1 || rawQuery.equalsIgnoreCase(inputField.getPlaceholder())) {
                        return;
                    }

                    List<String> startsWithMatches = new ArrayList<>();
                    List<String> wordStartMatches = new ArrayList<>();
                    List<String> containsMatches = new ArrayList<>();

                    for (String plant : dictionary) {
                        String plantNorm = normalizeTR(plant);
                        if (plantNorm.startsWith(queryNorm)) {
                            startsWithMatches.add(plant);
                        } else {
                            boolean wordMatch = false;
                            for (String word : plantNorm.split("\\s+")) {
                                if (word.startsWith(queryNorm)) {
                                    wordMatch = true;
                                    break;
                                }
                            }
                            if (wordMatch) {
                                wordStartMatches.add(plant);
                            } else if (queryNorm.length() >= 3 && plantNorm.contains(queryNorm)) {
                                containsMatches.add(plant);
                            }
                        }
                    }

                    List<String> allMatches = new ArrayList<>(startsWithMatches);
                    allMatches.addAll(wordStartMatches);
                    allMatches.addAll(containsMatches);

                    int count = 0;
                    for (String plant : allMatches) {
                        JMenuItem item = new JMenuItem("🌿 " + plant);
                        item.setFont(new Font("Segoe UI", Font.PLAIN, 13));
                        item.addActionListener(evt -> {
                            inputField.setText(plant);
                            suggestPopup.setVisible(false);
                            sorgula(null);
                        });
                        suggestPopup.add(item);
                        count++;
                        if (count >= 7) break;
                    }

                    if (count > 0 && inputField.isShowing() && inputField.hasFocus()) {
                        suggestPopup.show(inputField, 0, inputField.getHeight());
                        inputField.requestFocusInWindow();
                    }
                });
            }
        });
    }

    private void showAchievementsDialog() {
        JDialog badgeDialog = new JDialog(this, "🏆 Botanikçi Rozetlerim & Keşiflerim", true);
        badgeDialog.setSize(580, 500);
        badgeDialog.setLocationRelativeTo(this);

        JPanel mainPanel = new JPanel(new BorderLayout(12, 12));
        mainPanel.setBorder(new EmptyBorder(18, 18, 18, 18));
        mainPanel.setBackground(isDarkMode ? new Color(20, 28, 21) : new Color(242, 247, 243));

        JLabel titleLbl = new JLabel("🏆 Keşfedilen Toplam Bitki Sayısı: " + kesfedilenBitkiler.size(), SwingConstants.CENTER);
        titleLbl.setFont(new Font("Segoe UI", Font.BOLD, 18));
        titleLbl.setForeground(new Color(216, 67, 21));

        JPanel badgeListPanel = new JPanel(new GridLayout(5, 1, 8, 8));
        badgeListPanel.setOpaque(false);

        int count = kesfedilenBitkiler.size();
        badgeListPanel.add(createBadgeRow("🥉 İlk Adım", "1 Bitki Keşfet", count >= 1));
        badgeListPanel.add(createBadgeRow("🥈 Doğa Dostu", "5 Bitki Keşfet", count >= 5));
        badgeListPanel.add(createBadgeRow("🥇 Acemi Botanikçi", "10 Bitki Keşfet", count >= 10));
        badgeListPanel.add(createBadgeRow("💎 Bitki Uzmanı", "20 Bitki Keşfet", count >= 20));
        badgeListPanel.add(createBadgeRow("👑 Master Botanik Ustası", "30 Bitki Keşfet", count >= 30));

        mainPanel.add(titleLbl, BorderLayout.NORTH);
        mainPanel.add(badgeListPanel, BorderLayout.CENTER);

        badgeDialog.add(mainPanel);
        badgeDialog.setVisible(true);
    }

    private JPanel createBadgeRow(String title, String req, boolean unlocked) {
        RoundedPanel row = new RoundedPanel(12, unlocked ? new Color(232, 245, 233) : new Color(240, 240, 240),
                unlocked ? new Color(165, 214, 167) : new Color(210, 210, 210));
        row.setLayout(new BorderLayout(10, 0));
        row.setBorder(new EmptyBorder(10, 16, 10, 16));

        JLabel titleLbl = new JLabel(title);
        titleLbl.setFont(new Font("Segoe UI", Font.BOLD, 14));
        titleLbl.setForeground(unlocked ? new Color(27, 94, 32) : Color.GRAY);

        JLabel reqLbl = new JLabel(unlocked ? "✅ Kazanıldı!" : "🔒 " + req);
        reqLbl.setFont(new Font("Segoe UI", Font.BOLD, 12));
        reqLbl.setForeground(unlocked ? new Color(46, 125, 50) : Color.GRAY);

        row.add(titleLbl, BorderLayout.WEST);
        row.add(reqLbl, BorderLayout.EAST);
        return row;
    }

    private void updateCareTips(String sun, String water, String temp) {
        careSunLabel.setText("☀️ Güneş: " + sun);
        careWaterLabel.setText("💧 Sulama: " + water);
        careTempLabel.setText("🌡️ Sıcaklık: " + temp);
    }

    private String getBotanicalName(String plantName) {
        String p = plantName.toLowerCase(Locale.forLanguageTag("tr-TR")).trim();
        if (p.contains("lavanta")) return "Lavandula angustifolia (Lamiaceae)";
        if (p.contains("gül")) return "Rosa rubiginosa (Rosaceae)";
        if (p.contains("orkide")) return "Orchidaceae (Asparagales)";
        if (p.contains("papatya")) return "Bellis perennis (Asteraceae)";
        if (p.contains("kaktüs")) return "Cactaceae (Caryophyllales)";
        if (p.contains("nane")) return "Mentha piperita (Lamiaceae)";
        if (p.contains("limon")) return "Citrus × limon (Rutaceae)";
        if (p.contains("zeytin")) return "Olea europaea (Oleaceae)";
        if (p.contains("fesleğen")) return "Ocimum basilicum (Lamiaceae)";
        if (p.contains("biberiye")) return "Salvia rosmarinus (Lamiaceae)";
        if (p.contains("aloe")) return "Aloe vera (Asphodelaceae)";
        if (p.contains("menekşe")) return "Viola odorata (Violaceae)";
        if (p.contains("zambak")) return "Lilium (Liliaceae)";
        return "Plantae (Flora Familyası)";
    }

    private String getPlantTrivia(String plantName) {
        String p = plantName.toLowerCase(Locale.forLanguageTag("tr-TR")).trim();
        if (p.contains("lavanta")) return "💡 Biliyor muydunuz? Lavanta kokusunun stresi azaltıp uyku kalitesini %20 artırdığı kanıtlanmıştır.";
        if (p.contains("gül")) return "💡 Biliyor muydunuz? Dünyanın en eski yaşayan gülü Almanya'daki Hildesheim Katedrali'ndedir ve 1000 yaşındadır!";
        if (p.contains("orkide")) return "💡 Biliyor muydunuz? Orkideler dünyadaki en geniş bitki türlerindendir (28.000'den fazla türü vardır)!";
        if (p.contains("papatya")) return "💡 Biliyor muydunuz? Papatyalar Antarktika hariç dünyadaki tüm kıtalarda doğal olarak yetişebilir!";
        if (p.contains("kaktüs")) return "💡 Biliyor muydunuz? Bazı dev kaktüs türleri bünyesinde 3000 litreden fazla su depolayabilir!";
        if (p.contains("nane")) return "💡 Biliyor muydunuz? Nane bitkisi doğal bir böcek uzaklaştırıcıdır ve mentol içeriğiyle zihni açar!";
        if (p.contains("limon")) return "💡 Biliyor muydunuz? Tek bir limon ağacı yılda ortalama 1500 ila 3000 adet limon verebilir!";
        if (p.contains("zeytin")) return "💡 Biliyor muydunuz? Akdeniz'deki bazı zeytin ağaçları 2000 yıldan uzun süredir meyve vermektedir!";
        return "💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99'unu üreterek yaşamın devamlılığını sağlar!";
    }

    private void applyTheme() {
        if (isDarkMode) {
            Color darkBg = new Color(20, 28, 21);
            Color darkCardBg = new Color(30, 42, 32);
            Color darkBorder = new Color(48, 68, 50);
            Color lightText = new Color(232, 245, 233);
            Color subText = new Color(160, 195, 165);

            mainPanel.setBackground(darkBg);
            headerCard.setColors(darkCardBg, darkBorder);
            inputCard.setColors(darkCardBg, darkBorder);
            resultCard.setColors(darkCardBg, darkBorder);
            careCard.setColors(new Color(25, 36, 26), darkBorder);
            triviaCard.setColors(new Color(36, 34, 25), new Color(70, 65, 40));

            titleLabel.setForeground(new Color(129, 199, 132));
            subtitleLabel.setForeground(subText);
            fieldLabel.setForeground(lightText);
            statusLabel.setForeground(subText);

            careSunLabel.setForeground(subText);
            careWaterLabel.setForeground(subText);
            careTempLabel.setForeground(subText);
            triviaLabel.setForeground(new Color(235, 210, 140));

            resultPane.setBackground(new Color(24, 34, 25));
            scrollPane.getViewport().setBackground(new Color(24, 34, 25));
            scrollPane.setBorder(BorderFactory.createLineBorder(darkBorder, 1));
            resimPaneli.setTheme(new Color(24, 34, 25), darkBorder, new Color(140, 180, 145));
        } else {
            Color mintBg = new Color(242, 247, 243);
            Color cardBg = Color.WHITE;
            Color cardBorder = new Color(220, 235, 222);

            mainPanel.setBackground(mintBg);
            headerCard.setColors(cardBg, cardBorder);
            inputCard.setColors(cardBg, cardBorder);
            resultCard.setColors(cardBg, cardBorder);
            careCard.setColors(new Color(238, 246, 239), new Color(200, 225, 202));
            triviaCard.setColors(new Color(254, 249, 231), new Color(245, 230, 180));

            titleLabel.setForeground(new Color(27, 94, 32));
            subtitleLabel.setForeground(new Color(80, 115, 85));
            fieldLabel.setForeground(new Color(30, 60, 35));
            statusLabel.setForeground(new Color(100, 130, 105));

            careSunLabel.setForeground(new Color(40, 75, 45));
            careWaterLabel.setForeground(new Color(40, 75, 45));
            careTempLabel.setForeground(new Color(40, 75, 45));
            triviaLabel.setForeground(new Color(110, 80, 20));

            resultPane.setBackground(Color.WHITE);
            scrollPane.getViewport().setBackground(Color.WHITE);
            scrollPane.setBorder(BorderFactory.createLineBorder(new Color(230, 240, 232), 1));
            resimPaneli.setTheme(new Color(248, 252, 248), new Color(210, 230, 212), new Color(110, 140, 110));
        }
        repaint();
    }

    private void showQuizDialog() {
        JDialog quizDialog = new JDialog(this, "🎮 Bitki Bilgi Yarışması (Quiz)", true);
        quizDialog.setSize(550, 480);
        quizDialog.setLocationRelativeTo(this);

        JPanel mainQuizPanel = new JPanel(new BorderLayout(12, 12));
        mainQuizPanel.setBorder(new EmptyBorder(15, 18, 15, 18));
        mainQuizPanel.setBackground(isDarkMode ? new Color(20, 28, 21) : new Color(242, 247, 243));

        JLabel scoreLabel = new JLabel("🏆 Toplam Puan: " + quizScore, SwingConstants.RIGHT);
        scoreLabel.setFont(new Font("Segoe UI", Font.BOLD, 14));
        scoreLabel.setForeground(new Color(46, 125, 50));

        JLabel questionLabel = new JLabel("Soru: Bu hangi bitkidir?", SwingConstants.CENTER);
        questionLabel.setFont(new Font("Segoe UI", Font.BOLD, 16));
        questionLabel.setForeground(isDarkMode ? new Color(232, 245, 233) : new Color(27, 94, 32));

        ResimPaneli quizImagePanel = new ResimPaneli();
        quizImagePanel.setPreferredSize(new Dimension(220, 200));

        JPanel optionsPanel = new JPanel(new GridLayout(2, 2, 10, 10));
        optionsPanel.setOpaque(false);

        ModernButton opt1 = new ModernButton("A) -", new Color(46, 125, 50), new Color(67, 160, 71));
        ModernButton opt2 = new ModernButton("B) -", new Color(46, 125, 50), new Color(67, 160, 71));
        ModernButton opt3 = new ModernButton("C) -", new Color(46, 125, 50), new Color(67, 160, 71));
        ModernButton opt4 = new ModernButton("D) -", new Color(46, 125, 50), new Color(67, 160, 71));

        optionsPanel.add(opt1);
        optionsPanel.add(opt2);
        optionsPanel.add(opt3);
        optionsPanel.add(opt4);

        Runnable loadQuestion = new Runnable() {
            @Override
            public void run() {
                String[] plantPool = {"Orkide", "Gül", "Lavanta", "Papatya", "Kaktüs", "Nane", "Yasemin", "Limon", "Zeytin", "Fesleğen", "Aloe Vera", "Biberiye", "Ihlamur", "Karanfil"};
                List<String> choices = new ArrayList<>();
                for (String p : plantPool) choices.add(p);
                Collections.shuffle(choices);

                String correctAnswer = choices.get(0);
                List<String> options = new ArrayList<>(choices.subList(0, 4));
                Collections.shuffle(options);

                opt1.setText("A) " + options.get(0));
                opt2.setText("B) " + options.get(1));
                opt3.setText("C) " + options.get(2));
                opt4.setText("D) " + options.get(3));

                quizImagePanel.setImage(null);
                quizImagePanel.setText("⏳ Görsel Yükleniyor...");

                new SwingWorker<BufferedImage, Void>() {
                    @Override
                    protected BufferedImage doInBackground() throws Exception {
                        AramaSonucu res = wikipediaOzetiGetir(correctAnswer);
                        return (res != null) ? res.resim() : null;
                    }

                    @Override
                    protected void done() {
                        try {
                            BufferedImage img = get();
                            if (img != null) {
                                quizImagePanel.setImage(img);
                            } else {
                                quizImagePanel.setText("Resim yüklenemedi.");
                            }
                        } catch (Exception ex) {
                            quizImagePanel.setText("Resim yüklenemedi.");
                        }
                    }
                }.execute();

                ActionListener answerCheck = evt -> {
                    JButton btn = (JButton) evt.getSource();
                    String selectedText = btn.getText().substring(3);
                    if (selectedText.equals(correctAnswer)) {
                        quizScore += 10;
                        scoreLabel.setText("🏆 Toplam Puan: " + quizScore);
                        JOptionPane.showMessageDialog(quizDialog, "🎉 TEBRİKLER! Doğru Cevap! (+10 Puan)", "Tebrikler", JOptionPane.INFORMATION_MESSAGE);
                    } else {
                        JOptionPane.showMessageDialog(quizDialog, "❌ Maalesef Yanlış! Doğru cevap: " + correctAnswer, "Yanlış Cevap", JOptionPane.ERROR_MESSAGE);
                    }
                    this.run();
                };

                for (ActionListener al : opt1.getActionListeners()) opt1.removeActionListener(al);
                for (ActionListener al : opt2.getActionListeners()) opt2.removeActionListener(al);
                for (ActionListener al : opt3.getActionListeners()) opt3.removeActionListener(al);
                for (ActionListener al : opt4.getActionListeners()) opt4.removeActionListener(al);

                opt1.addActionListener(answerCheck);
                opt2.addActionListener(answerCheck);
                opt3.addActionListener(answerCheck);
                opt4.addActionListener(answerCheck);
            }
        };

        loadQuestion.run();

        JPanel centerPanel = new JPanel(new BorderLayout(10, 10));
        centerPanel.setOpaque(false);
        centerPanel.add(quizImagePanel, BorderLayout.NORTH);
        centerPanel.add(optionsPanel, BorderLayout.SOUTH);

        mainQuizPanel.add(scoreLabel, BorderLayout.NORTH);
        mainQuizPanel.add(questionLabel, BorderLayout.CENTER);
        mainQuizPanel.add(centerPanel, BorderLayout.SOUTH);

        quizDialog.add(mainQuizPanel);
        quizDialog.setVisible(true);
    }

    private void showWateringReminderDialog() {
        JDialog remDialog = new JDialog(this, "⏰ Evdeki Bitkilerim & Sulama Takvimi", true);
        remDialog.setSize(600, 480);
        remDialog.setLocationRelativeTo(this);

        JPanel mainRemPanel = new JPanel(new BorderLayout(10, 10));
        mainRemPanel.setBorder(new EmptyBorder(15, 15, 15, 15));
        mainRemPanel.setBackground(isDarkMode ? new Color(20, 28, 21) : new Color(242, 247, 243));

        DefaultListModel<String> listModel = new DefaultListModel<>();
        for (EvBitkisi eb : evBitkileri) {
            listModel.addElement("🪴 " + eb.ad() + " - " + eb.gunAralik() + " Günde Bir Sulamalı (" + eb.durum() + ")");
        }

        JList<String> remJList = new JList<>(listModel);
        remJList.setFont(new Font("Segoe UI", Font.BOLD, 13));
        remJList.setBackground(isDarkMode ? new Color(30, 42, 32) : Color.WHITE);
        remJList.setForeground(isDarkMode ? new Color(232, 245, 233) : new Color(30, 60, 35));

        JScrollPane remScroll = new JScrollPane(remJList);
        remScroll.setBorder(BorderFactory.createLineBorder(new Color(180, 210, 180), 1));

        JPanel addPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        addPanel.setOpaque(false);

        JTextField nameField = new JTextField(12);
        JTextField daysField = new JTextField("3", 4);
        ModernButton addBtn = new ModernButton("➕ Bitki Ekle", new Color(46, 125, 50), new Color(67, 160, 71));
        addBtn.setPreferredSize(new Dimension(100, 32));

        addBtn.addActionListener(e -> {
            String name = nameField.getText().trim();
            String daysStr = daysField.getText().trim();
            if (!name.isBlank() && !daysStr.isBlank()) {
                try {
                    int days = Integer.parseInt(daysStr);
                    EvBitkisi yeni = new EvBitkisi(name, days, "💧 Bugün Sulanmalı!");
                    evBitkileri.add(yeni);
                    listModel.addElement("🪴 " + yeni.ad() + " - " + yeni.gunAralik() + " Günde Bir Sulamalı (" + yeni.durum() + ")");
                    nameField.setText("");
                } catch (NumberFormatException ignored) {}
            }
        });

        addPanel.add(new JLabel("Bitki:"));
        addPanel.add(nameField);
        addPanel.add(new JLabel("Kaç günde bir:"));
        addPanel.add(daysField);
        addPanel.add(addBtn);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        btnPanel.setOpaque(false);

        ModernButton waterBtn = new ModernButton("💧 Sula", new Color(2, 136, 209), new Color(3, 169, 244));
        ModernButton deleteBtn = new ModernButton("🗑️ Sil", new Color(198, 40, 40), new Color(229, 57, 53));

        waterBtn.addActionListener(e -> {
            int idx = remJList.getSelectedIndex();
            if (idx >= 0 && idx < evBitkileri.size()) {
                EvBitkisi eb = evBitkileri.get(idx);
                EvBitkisi guncel = new EvBitkisi(eb.ad(), eb.gunAralik(), "✅ Sulandı (" + eb.gunAralik() + " gün kaldı)");
                evBitkileri.set(idx, guncel);
                listModel.set(idx, "🪴 " + guncel.ad() + " - " + guncel.gunAralik() + " Günde Bir Sulamalı (" + guncel.durum() + ")");
            }
        });

        deleteBtn.addActionListener(e -> {
            int idx = remJList.getSelectedIndex();
            if (idx >= 0 && idx < evBitkileri.size()) {
                evBitkileri.remove(idx);
                listModel.remove(idx);
            }
        });

        btnPanel.add(waterBtn);
        btnPanel.add(deleteBtn);

        JPanel bottomPanel = new JPanel(new BorderLayout(8, 8));
        bottomPanel.setOpaque(false);
        bottomPanel.add(addPanel, BorderLayout.NORTH);
        bottomPanel.add(btnPanel, BorderLayout.SOUTH);

        mainRemPanel.add(remScroll, BorderLayout.CENTER);
        mainRemPanel.add(bottomPanel, BorderLayout.SOUTH);

        remDialog.add(mainRemPanel);
        remDialog.setVisible(true);
    }

    private void showFavoritesDialog() {
        JDialog favDialog = new JDialog(this, "⭐ Favori Bitkilerim", true);
        favDialog.setSize(550, 450);
        favDialog.setLocationRelativeTo(this);

        JPanel mainFavPanel = new JPanel(new BorderLayout(10, 10));
        mainFavPanel.setBorder(new EmptyBorder(15, 15, 15, 15));
        mainFavPanel.setBackground(isDarkMode ? new Color(20, 28, 21) : new Color(242, 247, 243));

        DefaultListModel<String> listModel = new DefaultListModel<>();
        for (BitkiKayit kayit : favoriListesi) {
            listModel.addElement("🌿 " + kayit.baslik());
        }

        JList<String> favJList = new JList<>(listModel);
        favJList.setFont(new Font("Segoe UI", Font.BOLD, 14));
        favJList.setBackground(isDarkMode ? new Color(30, 42, 32) : Color.WHITE);
        favJList.setForeground(isDarkMode ? new Color(232, 245, 233) : new Color(30, 60, 35));
        favJList.setSelectionBackground(new Color(46, 125, 50));
        favJList.setSelectionForeground(Color.WHITE);

        JScrollPane favScroll = new JScrollPane(favJList);
        favScroll.setBorder(BorderFactory.createLineBorder(new Color(180, 210, 180), 1));

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        btnPanel.setOpaque(false);

        ModernButton loadBtn = new ModernButton("🔍 Göster", new Color(46, 125, 50), new Color(67, 160, 71));
        ModernButton removeBtn = new ModernButton("🗑️ Sil", new Color(198, 40, 40), new Color(229, 57, 53));

        loadBtn.addActionListener(e -> {
            int idx = favJList.getSelectedIndex();
            if (idx >= 0 && idx < favoriListesi.size()) {
                BitkiKayit kayit = favoriListesi.get(idx);
                inputField.setText(kayit.baslik());
                favDialog.dispose();
                sorgula(null);
            }
        });

        removeBtn.addActionListener(e -> {
            int idx = favJList.getSelectedIndex();
            if (idx >= 0 && idx < favoriListesi.size()) {
                favoriListesi.remove(idx);
                listModel.remove(idx);
            }
        });

        btnPanel.add(loadBtn);
        btnPanel.add(removeBtn);

        mainFavPanel.add(favScroll, BorderLayout.CENTER);
        mainFavPanel.add(btnPanel, BorderLayout.SOUTH);

        favDialog.add(mainFavPanel);
        favDialog.setVisible(true);
    }

    private void setInfoText(String message, Color color) {
        StyledDocument doc = resultPane.getStyledDocument();
        try {
            doc.remove(0, doc.getLength());
            Style style = resultPane.addStyle("InfoStyle", null);
            StyleConstants.setFontFamily(style, "Segoe UI");
            StyleConstants.setFontSize(style, 14);
            StyleConstants.setItalic(style, true);
            StyleConstants.setForeground(style, color);
            doc.insertString(0, message, style);
        } catch (BadLocationException ignored) {
        }
    }

    private void sorgula(ActionEvent event) {
        suggestPopup.setVisible(false);
        String bitkiAdi = inputField.getText().trim();
        if (bitkiAdi.isBlank() || bitkiAdi.equals(inputField.getPlaceholder())) {
            setInfoText("⚠️ Lütfen aramak istediğiniz bir bitki adını yazın.", new Color(198, 40, 40));
            statusLabel.setText("Uyarı: Bitki adı boş bırakılamaz.");
            return;
        }

        if (!bitkiAdiDogrula(bitkiAdi)) {
            setInfoText("⚠️ Böyle bir bitki bulunmuyor, tekrar deneyiniz.", new Color(198, 40, 40));
            statusLabel.setText("Uyarı: Böyle bir bitki bulunmuyor.");
            return;
        }

        if (typingTimer != null && typingTimer.isRunning()) {
            typingTimer.stop();
        }

        totalSearchCount++;
        searchButton.setEnabled(false);
        statusLabel.setText("🔍 '" + bitkiAdi + "' bilgileri Wikipedia'dan çekiliyor...");
        setInfoText("🔍 Lütfen bekleyin, bilgiler getiriliyor...", isDarkMode ? new Color(129, 199, 132) : new Color(46, 125, 50));

        new SwingWorker<AramaSonucu, Void>() {
            @Override
            protected AramaSonucu doInBackground() {
                try {
                    return wikipediaOzetiGetir(bitkiAdi);
                } catch (Exception ex) {
                    return new AramaSonucu(null, "Böyle bir bitki bulunmuyor, tekrar deneyiniz.", null, null);
                }
            }

            @Override
            protected void done() {
                searchButton.setEnabled(true);
                try {
                    AramaSonucu sonuc = get();
                    currentSonuc = sonuc;
                    if (sonuc.baslik() != null && !sonuc.baslik().isEmpty()) {
                        currentWikiUrl = sonuc.wikiUrl();

                        int prevCount = kesfedilenBitkiler.size();
                        kesfedilenBitkiler.add(sonuc.baslik());
                        int newCount = kesfedilenBitkiler.size();

                        if (newCount > prevCount && (newCount == 1 || newCount == 5 || newCount == 10 || newCount == 20 || newCount == 30)) {
                            JOptionPane.showMessageDialog(BitkiGUI.this, "🎉 TEBRİKLER! Yeni Bir Botanikçi Rozeti Kazandınız!\nToplam Keşfedilen Bitki: " + newCount, "Rozet Kazanıldı", JOptionPane.INFORMATION_MESSAGE);
                        }

                        if (!sonAramalar.contains(bitkiAdi)) {
                            sonAramalar.add(0, bitkiAdi);
                            if (sonAramalar.size() > 5) sonAramalar.remove(5);
                            historyCombo.removeAllItems();
                            historyCombo.addItem("📜 Son Aramalar");
                            for (String item : sonAramalar) historyCombo.addItem(item);
                        }

                        if (!dictionary.contains(sonuc.baslik())) {
                            dictionary.add(sonuc.baslik());
                        }

                        String nameLower = sonuc.baslik().toLowerCase(Locale.forLanguageTag("tr-TR"));
                        if (nameLower.contains("kaktüs") || nameLower.contains("sukulent")) {
                            updateCareTips("Bol Doğrudan Güneş", "2-3 Haftada Bir", "15°C - 30°C");
                        } else if (nameLower.contains("orkide")) {
                            updateCareTips("Yarı Gölge / Parlak", "Haftada 1 Kez", "18°C - 25°C");
                        } else if (nameLower.contains("lavanta") || nameLower.contains("nane") || nameLower.contains("biberiye") || nameLower.contains("fesleğen")) {
                            updateCareTips("Bol Güneşli", "Toprak Kurudukça", "15°C - 28°C");
                        } else {
                            updateCareTips("Parlak Dolaylı Işık", "Haftada 1-2 Kez", "18°C - 24°C");
                        }

                        triviaLabel.setText(getPlantTrivia(sonuc.baslik()));

                        StyledDocument doc = resultPane.getStyledDocument();
                        doc.remove(0, doc.getLength());

                        Color headerColor = isDarkMode ? new Color(129, 199, 132) : new Color(27, 94, 32);
                        Color subHeaderColor = isDarkMode ? new Color(160, 210, 165) : new Color(60, 110, 65);
                        Color lineColor = isDarkMode ? new Color(48, 80, 52) : new Color(165, 214, 167);
                        Color bodyColor = isDarkMode ? new Color(220, 235, 222) : new Color(44, 64, 48);

                        Style headerStyle = resultPane.addStyle("HeaderStyle", null);
                        StyleConstants.setFontFamily(headerStyle, "Segoe UI");
                        StyleConstants.setFontSize(headerStyle, 22);
                        StyleConstants.setBold(headerStyle, true);
                        StyleConstants.setForeground(headerStyle, headerColor);

                        Style subHeaderStyle = resultPane.addStyle("SubHeaderStyle", null);
                        StyleConstants.setFontFamily(subHeaderStyle, "Segoe UI");
                        StyleConstants.setFontSize(subHeaderStyle, 13);
                        StyleConstants.setItalic(subHeaderStyle, true);
                        StyleConstants.setForeground(subHeaderStyle, subHeaderColor);

                        Style lineStyle = resultPane.addStyle("LineStyle", null);
                        StyleConstants.setFontFamily(lineStyle, "Segoe UI");
                        StyleConstants.setFontSize(lineStyle, 12);
                        StyleConstants.setForeground(lineStyle, lineColor);

                        Style bodyStyle = resultPane.addStyle("BodyStyle", null);
                        StyleConstants.setFontFamily(bodyStyle, "Segoe UI");
                        StyleConstants.setFontSize(bodyStyle, 15);
                        StyleConstants.setForeground(bodyStyle, bodyColor);

                        doc.insertString(0, "🌿 " + sonuc.baslik() + "\n", headerStyle);
                        doc.insertString(doc.getLength(), "🧬 Botanik Adı: " + getBotanicalName(sonuc.baslik()) + "\n", subHeaderStyle);
                        doc.insertString(doc.getLength(), "───────────────────────────────────────────\n\n", lineStyle);

                        fullText = sonuc.ozet();
                        typingIndex = 0;

                        typingTimer = new javax.swing.Timer(15, e -> {
                            if (typingIndex < fullText.length()) {
                                try {
                                    doc.insertString(doc.getLength(), String.valueOf(fullText.charAt(typingIndex)), bodyStyle);
                                    
                                    if (isSoundEnabled && typingIndex % 3 == 0) {
                                        Toolkit.getDefaultToolkit().beep();
                                    }
                                    
                                    typingIndex++;
                                } catch (BadLocationException ignored) {
                                }
                            } else {
                                typingTimer.stop();
                                statusLabel.setText("Tamamlandı: " + bitkiAdi);
                            }
                        });
                        typingTimer.start();

                    } else {
                        currentWikiUrl = null;
                        updateCareTips("-", "-", "-");
                        triviaLabel.setText("💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99'unu üretir!");
                        setInfoText("⚠️ Böyle bir bitki bulunmuyor, tekrar deneyiniz.", new Color(198, 40, 40));
                        statusLabel.setText("Sonuç bulunamadı.");
                    }

                    resimPaneli.resetZoom();
                    if (sonuc.resim() != null) {
                        currentImage = sonuc.resim();
                        resimPaneli.setImage(sonuc.resim());
                    } else {
                        currentImage = null;
                        resimPaneli.setImage(null);
                        resimPaneli.setText("Resim bulunamadı.");
                    }
                } catch (Exception ex) {
                    currentWikiUrl = null;
                    updateCareTips("-", "-", "-");
                    triviaLabel.setText("💡 Biliyor muydunuz? Bitkiler dünyadaki oksijenin %99'unu üretir!");
                    setInfoText("⚠️ Böyle bir bitki bulunmuyor, tekrar deneyiniz.", new Color(198, 40, 40));
                    statusLabel.setText("Hata oluştu.");
                }
            }
        }.execute();
    }

    private boolean bitkiAdiDogrula(String bitkiAdi) {
        String kelime = bitkiAdi.toLowerCase(Locale.forLanguageTag("tr-TR")).trim();
        if (kelime.length() < 2) {
            return false;
        }
        String[] yasaklar = {
            "araba", "ev", "masa", "insan", "aslan", "kedi", "su", "hava", "yemek", "kelebek", "köpek", "balık", "kuş", "yılan", "böcek",
            "telefon", "bilgisayar", "sandalye", "kalem", "uçak", "saat", "ayakkabı", "bina", "televizyon", "şehir", "ülke", "kapı", "pencere",
            "oyun", "yazılım", "film", "müzik", "kitap", "para", "banka", "okul", "hastane", "otobüs", "gemi", "tren"
        };
        for (String yasak : yasaklar) {
            if (kelime.equals(yasak)) {
                return false;
            }
        }
        return true;
    }

    private AramaSonucu wikipediaOzetiGetir(String sorgu) throws IOException, InterruptedException {
        String encoded = URLEncoder.encode(sorgu, StandardCharsets.UTF_8).replace("+", "%20");
        String summaryUrl = "https://tr.wikipedia.org/api/rest_v1/page/summary/" + encoded;
        String fullWikiUrl = "https://tr.wikipedia.org/wiki/" + encoded;

        HttpRequest summaryRequest = HttpRequest.newBuilder()
                .uri(URI.create(summaryUrl))
                .header("User-Agent", "BitkiSorguGUI/1.0")
                .GET()
                .build();

        HttpResponse<String> summaryResponse = client.send(summaryRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (summaryResponse.statusCode() != 200) {
            return new AramaSonucu(null, "Böyle bir bitki bulunmuyor, tekrar deneyiniz.", null, null);
        }

        String json = summaryResponse.body();
        String title = jsonAlaniniCek(json, "title");
        String description = jsonAlaniniCek(json, "description");
        String extract = jsonAlaniniCek(json, "extract");
        String imageUrl = jsonResimUrlCek(json);

        if (title == null || extract == null || extract.isBlank()) {
            return new AramaSonucu(null, "Böyle bir bitki bulunmuyor, tekrar deneyiniz.", null, null);
        }

        if (!isBitkiIcerik(title, description, extract)) {
            return new AramaSonucu(null, "Böyle bir bitki bulunmuyor, tekrar deneyiniz.", null, null);
        }

        if (imageUrl == null) {
            String pageImagesUrl = "https://tr.wikipedia.org/w/api.php?action=query&titles=" + encoded + "&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*";
            HttpRequest pageImagesRequest = HttpRequest.newBuilder()
                    .uri(URI.create(pageImagesUrl))
                    .header("User-Agent", "BitkiSorguGUI/1.0")
                    .GET()
                    .build();
            HttpResponse<String> pageImagesResponse = client.send(pageImagesRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (pageImagesResponse.statusCode() == 200) {
                imageUrl = jsonResimUrlCek(pageImagesResponse.body());
            }
        }

        BufferedImage image = null;
        if (imageUrl != null) {
            image = resimYukle(imageUrl);
        }

        String titleUpper = title.toUpperCase(Locale.forLanguageTag("tr-TR"));
        return new AramaSonucu(titleUpper, extract, image, fullWikiUrl);
    }

    private static boolean isBitkiIcerik(String title, String description, String extract) {
        String combined = ((title != null ? title : "") + " " + (description != null ? description : "") + " " + (extract != null ? extract : "")).toLowerCase(Locale.forLanguageTag("tr-TR"));

        String[] nonPlantKeywords = {
            "memeli", "köpekgiller", "kedigiller", "otomobil", "şehirdir", "başkentidir", "elektronik",
            "yazılımdır", "markadır", "şirkettir", "bölgedir", "ilçedir", "köyüdür", "filmdir", "albümüdür",
            "şarkısıdır", "oyuncudur", "yazardır", "siyasetçidir", "futbolcudur", "insandır", "omurgalıdır",
            "omurgasızdır", "sürüngendir", "kuştur", "balıktır", "böcektir", "romandır", "tarihtir",
            "anlaşmadır", "müzik grubu", "televizyon", "bilgisayar", "telefon", "cihazdır", "araçtır",
            "taşıttır", "bina", "yapıdır", "kurumdur", "dernektir", "partidir", "kavramdır", "fizik", "kimya",
            "masal", "hikaye", "destan", "oyun", "spor", "kulüp", "dergi", "gazete", "meslek"
        };

        for (String kw : nonPlantKeywords) {
            if (combined.contains(kw)) {
                return false;
            }
        }

        String[] plantKeywords = {
            "bitki", "ağaç", "çiçek", "meyve", "sebze", "flora", "tohumlu", "familyasından", "familya",
            "cinsi", "türüdür", "otçul", "çalı", "otlar", "tahıl", "baklegil", "baharat", "narenciye",
            "yapraklı", "botanik", "fidan", "hasat", "bostan", "orman", "kök", "gövde", "sürgün",
            "otsu", "odunsu", "yeşillik", "kültür bitkisi", "tıbbi bitki", "tarım", "yetiştirilen"
        };

        for (String kw : plantKeywords) {
            if (combined.contains(kw)) {
                return true;
            }
        }

        return false;
    }

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

    private static String jsonResimUrlCek(String json) {
        Pattern sourcePattern = Pattern.compile("\"source\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
        Matcher sourceMatcher = sourcePattern.matcher(json);
        while (sourceMatcher.find()) {
            String value = sourceMatcher.group(1)
                    .replace("\\/", "/")
                    .trim();
            if (value.startsWith("http") && (value.contains(".jpg") || value.contains(".jpeg") || value.contains(".png") || value.contains(".webp"))) {
                return value;
            }
        }
        return null;
    }

    private BufferedImage resimYukle(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        try {
            HttpRequest imageRequest = HttpRequest.newBuilder()
                    .uri(URI.create(imageUrl))
                    .header("User-Agent", "BitkiSorguGUI/1.0")
                    .GET()
                    .build();
            HttpResponse<byte[]> imageResponse = client.send(imageRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (imageResponse.statusCode() != 200) {
                return null;
            }
            return ImageIO.read(new ByteArrayInputStream(imageResponse.body()));
        } catch (Exception ignored) {
            return null;
        }
    }

    private record AramaSonucu(String baslik, String ozet, BufferedImage resim, String wikiUrl) {
    }

    private record BitkiKayit(String baslik, String ozet, BufferedImage resim, String wikiUrl) {
    }

    private record EvBitkisi(String ad, int gunAralik, String durum) {
    }

    // --- ÖZEL BİLEŞENLER (CUSTOM COMPONENTS) ---

    private static class RoundedPanel extends JPanel {
        private final int cornerRadius;
        private Color backgroundColor;
        private Color borderColor;

        public RoundedPanel(int radius, Color bgColor, Color borderColor) {
            this.cornerRadius = radius;
            this.backgroundColor = bgColor;
            this.borderColor = borderColor;
            setOpaque(false);
        }

        public void setColors(Color bgColor, Color borderColor) {
            this.backgroundColor = bgColor;
            this.borderColor = borderColor;
            repaint();
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g2.setColor(backgroundColor);
            g2.fill(new RoundRectangle2D.Double(0, 0, getWidth() - 1, getHeight() - 1, cornerRadius, cornerRadius));

            if (borderColor != null) {
                g2.setColor(borderColor);
                g2.draw(new RoundRectangle2D.Double(0, 0, getWidth() - 1, getHeight() - 1, cornerRadius, cornerRadius));
            }
            g2.dispose();
        }
    }

    private static class PlaceholderTextField extends JTextField {
        private final String placeholder;
        private boolean isFocused = false;

        public PlaceholderTextField(String placeholderText) {
            this.placeholder = placeholderText;
            setFont(new Font("Segoe UI", Font.PLAIN, 14));
            setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(new Color(190, 215, 195), 1),
                    BorderFactory.createEmptyBorder(8, 12, 8, 12)));

            addFocusListener(new FocusAdapter() {
                @Override
                public void focusGained(FocusEvent e) {
                    isFocused = true;
                    setBorder(BorderFactory.createCompoundBorder(
                            BorderFactory.createLineBorder(new Color(46, 125, 50), 2),
                            BorderFactory.createEmptyBorder(7, 11, 7, 11)));
                    repaint();
                }

                @Override
                public void focusLost(FocusEvent e) {
                    isFocused = false;
                    setBorder(BorderFactory.createCompoundBorder(
                            BorderFactory.createLineBorder(new Color(190, 215, 195), 1),
                            BorderFactory.createEmptyBorder(8, 12, 8, 12)));
                    repaint();
                }
            });
        }

        public String getPlaceholder() {
            return placeholder;
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            if (getText().isEmpty() && !isFocused) {
                Graphics2D g2 = (Graphics2D) g.create();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setColor(new Color(160, 180, 165));
                g2.setFont(getFont().deriveFont(Font.ITALIC));
                Insets insets = getInsets();
                g2.drawString(placeholder, insets.left, getHeight() / 2 + g2.getFontMetrics().getAscent() / 2 - 2);
                g2.dispose();
            }
        }
    }

    private static class ModernButton extends JButton {
        private final Color normalColor;
        private final Color hoverColor;
        private boolean isHovered = false;

        public ModernButton(String text, Color normalColor, Color hoverColor) {
            super(text);
            this.normalColor = normalColor;
            this.hoverColor = hoverColor;

            setFont(new Font("Segoe UI", Font.BOLD, 12));
            setForeground(Color.WHITE);
            setFocusPainted(false);
            setBorderPainted(false);
            setContentAreaFilled(false);
            setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
            setPreferredSize(new Dimension(135, 36));

            addMouseListener(new MouseAdapter() {
                @Override
                public void mouseEntered(MouseEvent e) {
                    isHovered = true;
                    repaint();
                }

                @Override
                public void mouseExited(MouseEvent e) {
                    isHovered = false;
                    repaint();
                }
            });
        }

        @Override
        protected void paintComponent(Graphics g) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            if (!isEnabled()) {
                g2.setColor(new Color(190, 190, 190));
            } else if (isHovered) {
                g2.setColor(hoverColor);
            } else {
                g2.setColor(normalColor);
            }

            g2.fill(new RoundRectangle2D.Double(0, 0, getWidth(), getHeight(), 10, 10));
            g2.dispose();

            super.paintComponent(g);
        }
    }

    private static class ResimPaneli extends JPanel {
        private BufferedImage image;
        private String defaultText = "Resim burada görünür.";
        private Color bgColor = new Color(248, 252, 248);
        private Color borderColor = new Color(210, 230, 212);
        private Color textColor = new Color(110, 140, 110);
        private double zoomFactor = 1.0;

        public ResimPaneli() {
            setPreferredSize(new Dimension(250, 250));
            setMinimumSize(new Dimension(250, 250));
            setMaximumSize(new Dimension(250, 250));
            setOpaque(false);

            addMouseWheelListener(e -> {
                if (image == null) return;
                if (e.getWheelRotation() < 0) {
                    zoomFactor = Math.min(3.0, zoomFactor + 0.15);
                } else {
                    zoomFactor = Math.max(1.0, zoomFactor - 0.15);
                }
                repaint();
            });

            addMouseListener(new MouseAdapter() {
                @Override
                public void mouseClicked(MouseEvent e) {
                    if (e.getClickCount() == 2 || SwingUtilities.isRightMouseButton(e)) {
                        resetZoom();
                    }
                }
            });
        }

        public void resetZoom() {
            this.zoomFactor = 1.0;
            repaint();
        }

        public void setTheme(Color bg, Color border, Color text) {
            this.bgColor = bg;
            this.borderColor = border;
            this.textColor = text;
            repaint();
        }

        public void setImage(BufferedImage image) {
            this.image = image;
            this.zoomFactor = 1.0;
            repaint();
        }

        public void setText(String text) {
            this.defaultText = text;
            repaint();
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            int width = getWidth();
            int height = getHeight();

            g2.setColor(bgColor);
            g2.fill(new RoundRectangle2D.Double(0, 0, width - 1, height - 1, 16, 16));

            g2.setColor(borderColor);
            g2.draw(new RoundRectangle2D.Double(0, 0, width - 1, height - 1, 16, 16));

            int padding = 10;
            int availWidth = width - (padding * 2);
            int availHeight = height - (padding * 2);

            if (image == null) {
                g2.setColor(textColor);
                g2.setFont(new Font("Segoe UI", Font.PLAIN, 13));
                FontMetrics fm = g2.getFontMetrics();
                int textX = (width - fm.stringWidth(defaultText)) / 2;
                int textY = (height + fm.getAscent()) / 2 - 2;
                g2.drawString(defaultText, textX, textY);
                g2.dispose();
                return;
            }

            double widthRatio = (double) availWidth / image.getWidth();
            double heightRatio = (double) availHeight / image.getHeight();
            double scale = Math.min(widthRatio, heightRatio) * zoomFactor;

            int drawWidth = Math.max(1, (int) Math.round(image.getWidth() * scale));
            int drawHeight = Math.max(1, (int) Math.round(image.getHeight() * scale));

            int drawX = padding + (availWidth - drawWidth) / 2;
            int drawY = padding + (availHeight - drawHeight) / 2;

            g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);

            Shape oldClip = g2.getClip();
            g2.clip(new RoundRectangle2D.Double(padding, padding, availWidth, availHeight, 12, 12));
            g2.drawImage(image, drawX, drawY, drawWidth, drawHeight, null);
            g2.setClip(oldClip);

            if (zoomFactor > 1.05) {
                g2.setColor(new Color(0, 0, 0, 140));
                g2.setFont(new Font("Segoe UI", Font.BOLD, 11));
                g2.drawString(String.format(Locale.US, "🔍 %.1fx (Sıfırla: Çift Tık)", zoomFactor), padding + 6, height - padding - 6);
            }

            g2.dispose();
        }
    }

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
        }
        SwingUtilities.invokeLater(() -> {
            BitkiGUI gui = new BitkiGUI();
            gui.setVisible(true);
        });
    }
}
