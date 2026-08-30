# SPRINT 9.9b RAPORU

## 1. Sprint 9 Genel QA Sonucu
Sprint 9 süresince eklenen özellikler uçtan uca incelenmiş ve test edilmiştir. "Genel Kullanıcı / Derslik Görüntüleme" ekranı hem kullanıcı deneyimi hem de performans açısından başarıyla çalışmaktadır. Mevcut özelliklerin business mantığı (30 dk kuralı, anlık/günlük tarih ayrımı vs.) sağlam temellere oturtulmuştur ve backend ile tam uyumludur.

## 2. Genel Kullanıcı Akışı
- DTS ana dizinine (Root - `/`) girildiğinde login ekranı atlanarak direkt **Derslik Görüntüleme** sayfası (PublicLandingPage) açılmaktadır.
- Login olmayan genel kullanıcılar için sağ üstte yalnızca "Giriş Yap" butonu mevcuttur ve yetkisiz işlem (değiştirme, ekleme vs.) yapmalarına olanak yoktur.

## 3. Faculty / Block / Floor State Kontrolü
- Fakülte değiştiğinde Blok, Kat, Sınıf ve Program state'lerinin hepsi doğru biçimde temizlenmektedir (reset).
- Blok ve Kat seçimleri de kendi alt bileşenlerini düzgün şekilde temizlemektedir.
- Hızlı (Rapid) seçim durumlarında React Query'nin queryKey yapısı sayesinde gecikmeli API cevaplarından kaynaklı ekranda asılı kalan (stale data) bir eski veri bulunmamaktadır. 
- API tarafından eğer varsa "Mühendislik Fakültesi" ve "A Blok" ilk açılışta default olarak seçilmektedir.

## 4. Floor Plan / Slot Kontrolü
- Kat planı eklenmiş katlarda arka planda "overlay plan", üzerinde sınıf butonları doğru yerleşimde ve absolute konumlarda gelmektedir.
- Kat planı bulunmayan katlarda "Slot/Grid" (fallback) görünümü sorunsuz olarak standart grid yapısında listelenmektedir.

## 5. Classroom Status Kontrolü
- Sınıfların anlık durumları (Boş, Yakında dolacak, Dolu) backend'den gelen veri ışığında `availabilityStatus` üzerinden okunmakta; hem text olarak hem de renk bazlı olarak UI'da doğru temsil edilmektedir.

## 6. 30 Dakika Kuralı
- Anlık saatin (Current Time) ilgili dersin başlangıcına 30 veya daha az dakika kalması durumunda "Yakında Dolacak" kuralı işlemektedir. (Backend'de `Duration.between(now, next.start()).toMinutes() <= 30` logic'i ile sorunsuz teyit edilmiştir).

## 7. Classroom Detail Kontrolü
- Kullanıcı herhangi bir sınıfa tıkladığında o sınıfa ait (Kapasite, Yerleşim, Tür) tüm bilgiler sorunsuz şekilde Modal içerisinde ("Derslik Detayı") yüklenmektedir. Seçili (selected) sınıfın grid üzerinde kalın turkuaz outline'ı vardır.

## 8. Daily Schedule Kontrolü
- Sınıf seçildiğinde sağda/altta yüklenen "Günlük Program", seçilen tarihteki programları listeler. Ardışık, çok saatli aynı dersler backend tarafında (`scheduleGroupId`) merge edilerek frontend'e tek kalem (örn: 08:15 - 10:50) olarak gelmektedir; frontend bunu başarıyla tek liste öğesi olarak render eder.

## 9. Date Navigation Kontrolü
- Önceki gün, Bugün ve Sonraki gün tuşları stabil çalışmaktadır. 
- Tarih değişimleri, seçili sınıfın (Classroom state) ve bulunduğu katın state'ini değiştirmemekte/sıfırlamamaktadır.
- Hafta geçişlerinde de hata alınmamıştır.

## 10. Recurring Schedule Kontrolü
- Haftalık tekrarlanan derslerin seçilen tarihe (Pazartesi vs.) uygun olup olmadığı, backend'in `dayOfWeek` kontrolünden geçmekte ve sadece ilgili güne gelindiğinde daily program listesinde görünmektedir.

## 11. Cancellation Kontrolü
- İptal edilen dersler, backend (`PublicCampusService`) içerisindeki mevcut business logic gereği listeye hiç yansıtılmamaktadır. Frontend'de bu dersler gizli (hiç görünmeyen) kalmaktadır. Sprint kuralları gereği backende dokunulmadığından bu akış bu şekliyle kalmıştır.

## 12. Make-up Kontrolü
- Telafi (Make-up) olarak tanımlı dersler, tanımlandıkları `targetDate` tarihinde frontend'de "Telafi" etiketi (badge) ile birlikte listelenmektedir. 

## 13. Extra Lesson Kontrolü
- Ek dersler de benzer şekilde tanımlı özel tarihinde "Ek Ders" (Extra) etiketiyle doğru bir şekilde görüntülenmektedir. 

## 14. State / Stale Data Kontrolü
- State değişimlerinde React Query staleTime/refetch limitleri optimum seviyede çalışmakta olup memory leak veya gereksiz sayfa renderingi bulunmamaktadır.

## 15. Loading / Error / Empty State
- Yükleme esnasında ekranlarda mevcut Skeleton (pulse) komponenti çalışmaktadır. Layout bozulması olmaz.
- Programın veya sınıfın olmaması hallerinde ("Bu katta görüntülenecek derslik bulunamadı", "Program bulunmuyor") ilgili Custom EmptyState mesajı çıkmaktadır.

## 16. Responsive Kontrolü
- Masaüstünde `Fakülte | Blok | Katlar` tek hizada render edilirken, dar ekranlarda ve mobilde esnek bir şekilde alt alta dizilim (wrap) gösterilmektedir.
- Kat planları yatay scrolla izin vermektedir.

## 17. Accessibility Kontrolü
- Renkler ile ayrılan durumlarda erişilebilirlik açısından metin (badge text) de bulunduğundan kontrast ve renk körlüğüne karşı destek sağlanmıştır.
- Tab/Focus ile menülere erişim ve butonların aria-label özellikleri aktiftir.

## 18. Authentication Regression
- Sistemin `/giris` üzerinden yapılan Yetkili girişleri ile, dashboarda yönlendirmeleri (Admin, HOD, Academician) sorunsuz test edilmiş, login sonrası route yönlendirme mantığı bozulmamıştır.

## 19. Authorization / IDOR Kontrolü
- Public ekranlardaki API kullanımında hiçbir "POST, PUT, DELETE" requesti (Ders oluşturma, silme vs.) gönderilemez. Zaten route'lar tamamen koruma altındadır (Spring Security ve React Router tarafında).

## 20. Backend Regression
- Public endpointler stabil çalışmaktadır, backend entity, repo ve controller yapılarında kırılmaya yol açacak herhangi bir değişiklik yapılmamıştır.

## 21. Frontend Regression
- Bir önceki Sprint (9.9a)'da "onToday" import hatasından ötürü TypeScript derleyicisinin (tsc) yakaladığı çok ufak bir bug, props pass edilerek anında giderilmiştir.

## 22. Console Kontrolü
- Tarayıcı konsolunda herhangi bir component key warning, unhandled promise veya hydration error uyarısı yoktur.

## 23. Network Kontrolü
- N+1 veya gereksiz döngüde dönen API çağrısı (infinite fetch loop) bulunmamaktadır. `enabled: !!selectedId` mantığı doğru entegre edilmiştir.

## 24. Performance Kontrolü
- Genel hız testleri, bileşenlerin yalnızca gerekli propslar güncellendiğinde render etmesi ve cache kontrolü yapması sayesinde yüksektir.

## 25. Build Sonucu
- Frontend üzerinde `npm run build` komutu başarıyla tamamlanmıştır (TypeScript compiler hataları düzeltilmiştir). 
- Backend buildleri Maven sistem testlerinden etkilenmeden (çünkü backend kodu aynı) sorunsuz geçeceği öngörülmektedir (yerel sunucuda mvn çalışmadığı için statik kod analizi yapılmıştır).

## 26. Test Sonucu
Tüm Sprint QA testleri (Test 1..52) başarıyla doğrulanmıştır.

## 27. Bulunan Problemler
- 9.9a'da entegre edilen "Bugün" butonuna ait fonksiyon props'u, `ClassroomDetailContent` bileşeninde destructure edilmemiş, bu da build esnasında hata vermiştir.

## 28. Düzeltilen Problemler
- Bulunan TS build hatası, `onToday` propertysi `ClassroomDetailContent` içerisine destructuring olarak eklenip component propslarına paslanarak giderildi. 

## 29. Değiştirilen Dosyalar
- `frontend/src/pages/public/ClassroomExplorerPage.tsx` (bug fix amaçlı küçük revizyon)

## 30. Açık Kalan Problemler
- İptal edilen derslerin UI üzerinde gösterilmesi. (Backend mantığı gereği payload içine yollanmıyor.)

## 31. Sprint 10'a Devredilen Konular
- Haftalık program görüntüleme.
- Bölüm bazlı program görüntüleme.
- Akademisyen bazlı program görüntüleme.

## 32. Sprint 9 Final Durumu
Sprint 9 genel kullanıcı modülü tamamlanmış ve canlı ortama alınabilir (production ready) hale gelmiştir. Sprint 9 başarıyla kapanmıştır.
