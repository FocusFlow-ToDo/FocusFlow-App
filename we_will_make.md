🧩 Mevcut Güçlü Yönlerin Üstüne Ne Eklenmeli?
Uygulamanda zaten olan şeyler şunlar (ekran görüntülerinden gördüm): XP + seviye sistemi, başarım rozetleri, streak takibi, alt görevler, analitik/aktivite trendi, topluluk liderliği, proje etiketleme, haftalık planlayıcı.
Eksik olan tek ama en kritik katman: Gerçek zamanlı davranış zekası. Yani şu an uygulamana verdiğin veri statik — görev ekleyip işaretliyorsun. Ama uygulama senin ne yaptığını bilmiyor. İşte o boşluğu dolduracak sistemi aşağıda bütünlüklü topladım.

🎯 Ana Vizyon: "Dijital İş Arkadaşı" Katmanı
Bunu bir modül olarak düşün. Adı ne olursa olsun (Smart Focus Mode, Koç Modu, vs.), tek cümlede şu: Senin yerine değil, seninle birlikte çalışan, arka planda seni izleyen ve gerektiğinde — ama sadece gerektiğinde — devreye giren bir sistem.

📋 Tüm Fikirlerin Konsolide Listesi
Katman 1 — Görev Başlamadan Önce (Pre-Task)
1. Niyet Bildirimi
Bir göreve "Başla" butonuna bastığında tek satır soran küçük bir popup:

"Bu oturumda tam olarak ne yapacaksın?"

"Video editi" değil, "Giriş sahnesi ile B-Roll kesimlerini birleştireceğim" yazdırıyorsun. Soyut hedef → somut eylem. Araştırmalar tamamlanma oranını ciddi oranda artırıyor.
2. Görev Ağırlık Testi
Göreve başlarken:

😊 Hafif hissettiriyor | 😐 Normal | 😰 Çok ağır geliyor

Eğer "Çok ağır" seçersen sistem otomatik olarak şunu önerir:

"Bu görevi ilk 3 alt adıma bölelim mi?"

Ve bunu geçmiş verinle karşılaştırır. "Video Editi" görevini 4 kez ağır işaretlediysen ve hep ertelediysen sistem bunu bilir.
3. Görev Isınması
Büyük ve yaratıcı görevlerde (belirleyici kriter: alt görev sayısı ≥3 veya tahmini süre ≥60dk) göreve başlamadan önce 2 dakikalık ısınma modu:

"Başlamadan önce, bu görevle ilgili aklına gelen ilk 3 şeyi yaz. Sadece 2 dakika."

Bu zihinsel bağlamı yükler. Video editi için "giriş sahnesi, müzik sync, renk düzeltme" yazan biri o göreve zihinsel olarak hazır girer.

Katman 2 — Görev Sırasında (During-Task) — Asıl Eksik Olan Bu
4. Aktif Pencere Takibi (active-win)
Arka planda sürekli çalışan sessiz bir loop. Kullanıcı hiçbir şey fark etmez. Eğer odak modunda değilse bile bu sistemi opsiyonel olarak aktif tutabilirsin.
5. Esnek Tolerans Süresi
Daha önce konuştuğumuz gibi — sabit 10 dakika değil, adaptif. Sabah 10'da 8 dakika, öğleden sonra 3'te 5 dakika olabilir. Senin kendi aktivite trendini (zaten analytics ekranında var) buna bağla.
6. Uygulama Geçiş Hız Uyarısı (Öngörücü Nudge)
Dağılmadan önce şunu fark eder: Son 5 dakikada 5+ uygulama geçişi yaptıysan henüz dikkat dağınıklığı olmamış olsa bile:

"Hareketli görünüyorsun 👀 Bir mola mı vermek istersin, yoksa devam mı?"

Bu reaktif değil, proaktif. Ve kullanıcıyı suçlamıyor — sadece soruyor.
7. Zarif Müdahale (The Nudge)
Tolerans süresi dolduğunda blur overlay:

"Son 8 dakikadır [Uygulama]'da vakit geçiriyorsun. Görevin: 'Video Editi'. Bu sana yardımcı oluyor mu?"

İki seçenek: "Evet, görevin parçası" (whitelist'e ekle) veya "Hayır, döneceğim" (pencere küçülür, görev uygulaması öne gelir).
Kritik detay: Mesaj her seferinde farklı olsun. Aynı metin alışkanlığa dönüşür ve görmezden gelinir.
8. Ctrl+Shift+D — Dikkat Dağınıklığı Yakalayıcı
Çalışırken aklına "WhatsApp'a mesaj at" gibi bir şey geldiğinde onu kafanda tutmaya çalışmak odağı mahveder. Bu kısayol, ekranın sağ altında 1 saniyelik bir input açar, yazarsın, Enter'a basarsın, kapanır. "Daha sonra yapılacaklar" listesine düşer. Kafan rahatlar, göreve dönersin.

Katman 3 — Görev Biterken / Sonrasında (Post-Task)
9. Bitiş Ritüeli
Görevi tamamladığında sadece konfeti değil (bunu zaten yapıyorsun — görüntü 5'teki "Isınan Motorlar" ekranı güzelmiş), buna ek olarak 3 saniye süren bir kapanış:

"Bir sonraki oturuma nereden devam etmek istersin?" → [Tek satır]

Hemingway'in yöntemi: Bir sonraki cümleyi bilirken dur. Sıfırdan başlama kaygısını ortadan kaldırır.
10. Duygusal Check-in
Görev biterken:

🔥 Akıştaydım | 😤 Zorlandım ama yaptım | 😶 Böyle geçti | 💀 Berbattı

Bu veriyi analizler ekranına bağla. Zamanla şunu söyleyebilirsin:

"Video görevlerini Salı sabahları 'akışta' bitiriyorsun. Çarşamba öğlenleri ise genellikle zor geliyor."

Bu özellik rakipte yok — çünkü bu kadar kişisel veri toplamak zaman alıyor ve senin uygulamana özgü olur.

Katman 4 — Çıkış Sürtünmesi (Zaten Tasarladın, Refinement)
11. Çıkış Sürtünmesi — Dil Değişikliği
"Sözünü tutmadın" → kaldır. Yerine:

"Bırakmak istiyorsun. Bu tamamen normal. Neden zor geliyor olabilir?"

Ve üç seçenek sun:

"Görev çok büyük hissettiriyor" → Alt görevlere bölme teklifi
"Şu an enerjim yok" → Mola modu (30 dk sonra nazik hatırlatma)
"Gerçekten çıkmam lazım" → Bırakır, ama kaç dakika yapıldığını kaydeder

12. Pazarlık — Düzeltilmiş Hali
"30 dakika çalış, tamamlandı sayılsın" yerine:

"25 dakika çalış. Sonra istersen çıkabilirsin — sistem seni durdurmaz."

Görev tamamlandı sayılmaz ama kullanıcı başlamış olur. Çoğu zaman başladıktan sonra devam eder. Bu Zeigarnik Etkisi.

Katman 5 — Mevcut Sistemine Entegre Olacak Yeni Fikirler
13. Odak Haritası (Analizler Ekranına Ek)
Zaten aktivite trendi var. Buna bir ısı haritası ekle — haftanın her saatini koyu/açık renkle göster. Kullanıcı kendi "altın saatlerini" kendi keşfeder. Dışarıdan söylemek yerine göstermen çok daha güçlü.
14. Prokrastinasyon Tipi Rozeti (Başarımlar ekranıyla entegre)
Sistem zamanla senin tipini tespit eder ve bunu başarım olarak değil, içgörü olarak sunar:

"Büyük görevlerde başlama güçlüğü yaşıyorsun ama bir kez başladığında genellikle bitiriyorsun."

Bu, kullanıcıya kendini tanıtır. Ve çözümü de doğrudan bu vericen: "O zaman başlama eşiğini düşürelim."
15. Momentum Skoru (Streak'e Alternatif veya Tamamlayıcı)
Zaten streak var. Ama streak sıfırlanabilir ve bu motivasyonu kırar. Buna ek olarak bir "Momentum" metriği ekle: Sıfırlanmaz, sadece yavaşlar. Dün çalışmadıysan bugün biraz düştü, ama 0 değil. Bu daha gerçekçi ve kırılması durumunda terk etmeyi önler.
16. "Neden Önemli?" Çapası
Görev oluştururken opsiyonel tek satır:

"Bu görevi neden önemli buluyorsun?"

Nudge mesajında bunu göster:

"Görevin: 'Video Editi' — Bunu yapmak istemen nedeni: 'Kanalımın büyümesi için'."

XP'nin ötesinde anlam bağlantısı kurar.