# Ürün Bağlamı

## Sorun Tanımı
Kullanıcılar, geniş film arşivleri karşısında ne izleyeceklerine karar vermekte zorlanıyorlar. Mevcut platformlar her zaman kişisel zevklere tam olarak uymayan genel öneriler sunabiliyor. Kullanıcılar, kendi izleme geçmişlerine ve beğenilerine dayalı, daha kişisel ve isabetli önerilere ihtiyaç duyuyorlar.

## Çözüm
Bu film öneri sistemi, kullanıcıların geçmişteki film değerlendirmelerini analiz eden bir **collaborative filtering** yaklaşımı kullanarak bu sorunu çözer. Sistem:
1.  Benzer zevklere sahip kullanıcıları veya benzer şekilde değerlendirilen filmleri belirler.
2.  Kullanıcının daha önce izlemediği ancak beğenebileceği filmleri tahmin eder.
3.  TMDB API'sinden alınan zengin verilerle (afiş, özet vb.) film keşfini daha çekici hale getirir.

## Kullanıcı Deneyimi Hedefleri
1.  **Kişiselleştirme:** Kullanıcının zevklerine göre dinamik olarak uyarlanan öneriler sunmak.
2.  **Kolay Keşif:** Yeni ve ilgi çekici filmleri kolayca bulabilme imkanı sağlamak.
3.  **Basit Arayüz:** Kullanımı kolay, sezgisel ve görsel olarak çekici bir arayüz tasarlamak.
4.  **Etkileşim:** Kullanıcıların filmleri kolayca değerlendirmesine ve bu değerlendirmelerin önerilere yansımasına olanak tanımak.
5.  **Bilgilendirici İçerik:** TMDB entegrasyonu ile filmler hakkında yeterli bilgi (özet, oyuncu, afiş) sunmak.

## Hedef Kitle
-   Film izlemeyi seven ve yeni filmler keşfetmek isteyen herkes.
-   Kişiselleştirilmiş önerilere değer veren kullanıcılar.
-   Farklı film platformlarını kullanan ancak daha iyi öneri arayanlar.

## Kullanıcı Hikayeleri (Örnekler)
-   *Bir kullanıcı olarak,* daha önce izlediğim ve 5 yıldız verdiğim filmlere benzer yeni filmler görmek istiyorum.
-   *Bir kullanıcı olarak,* ilgimi çekebilecek ama daha önce hiç duymadığım filmleri keşfetmek istiyorum.
-   *Bir kullanıcı olarak,* aradığım bir filmin detaylarını (özet, afiş, tür) kolayca görmek ve onu değerlendirebilmek istiyorum.
-   *Bir kullanıcı olarak,* sadece benim için oluşturulmuş bir öneri listesi görmek istiyorum. 