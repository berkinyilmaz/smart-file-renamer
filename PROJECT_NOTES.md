# Smart File Renamer — Project Notes

Bir grup dosyayı özel isimlendirme desenleriyle toplu yeniden adlandıran, tamamen tarayıcıda çalışan bir araç. Kullanıcı dosyaları ekler, bir desen tanımlar, değişiklikleri önizler ve hepsini yeni isimleriyle indirir.

---

## Konsept

String manipülasyonu ve kullanıcı girdisi üzerine kurulu bir araç. Problem: çok sayıda dosyayı elle tek tek yeniden adlandırmak yorucu ve hataya açık. Çözüm: token tabanlı bir desen motoru + canlı önizleme + çakışma tespiti ile tek seferde güvenli toplu rename.

---

## Tasarım Dili (mevcut projelerle birebir)

Referans olarak `timestamp-converter` alındı, aynı dil korundu:

- **Dark-first** zemin `#0a0a0c` + üstte hafif radial gradient
- **Tek aksan rengi** indigo `#6366f1` — CTA, focus, token chip'leri, aktif segment
- **Surface katmanları** `--surface` / `--surface-2` / `--surface-hover` — yumuşak border + soft shadow
- **Köşeler** 20px (kartlar) / 14px (input, segment) / pill (CTA, chip, badge)
- **Tipografi** Inter (Google Fonts), dosya adı/desen alanları için system mono
- **Micro-interactions** 180ms ease — hover glow, focus ring
- **İkonlar** inline thin-line SVG (stroke 1.5–1.6)
- **Pure CSS + custom properties** (Tailwind yok, TypeScript yok)

---

## Stack

| Katman | Seçim |
|---|---|
| Framework | React 19 + Vite 5 |
| Styling | Pure CSS + design tokens |
| State | `useState` / `useMemo` / `useCallback` / `useRef` — tek dosya |
| Dosya işleme | Browser File API + `URL.createObjectURL` (indirme) |
| Bağımlılık | Sadece React — ZIP/harici kütüphane yok |

---

## Özellikler

1. **Desen motoru** — `{name}` (uzantısız ad), `{n}` (sıra no), `{date}` (bugün) token'ları
2. **Find & Replace** — düz metin veya regex modu
3. **Case dönüşümleri** — Original / lower / UPPER / Title / kebab / snake
4. **Numbering** — başlangıç değeri + zero-padding (digit sayısı)
5. **Uzantı kontrolü** — Keep / lowercase / Set to… / Remove
6. **Canlı önizleme** — her dosya için eski → yeni, değişenler aksan renginde
7. **Çakışma tespiti** — tekrarlanan veya boş isimler kırmızı, indirme kilitlenir
8. **Toplu indirme** — her dosya yeni ismiyle, sıralı tetiklenir
9. **Drag & drop** + dosya seçici, boş durum için dropzone

---

## Mimari Notlar

### Dosya yapısı
```
smart-file-renamer/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── PROJECT_NOTES.md   ← bu dosya
└── src/
    ├── main.jsx
    ├── App.jsx         (tüm UI + rename mantığı)
    └── styles.css      (design tokens + bileşen stilleri)
```

### Rename pipeline (`buildNewName`)
1. `splitName` — dosya adını base + uzantı olarak ayır
2. Find & Replace uygula (regex modu escape ile korunur, geçersiz regex sessizce atlanır)
3. Case transform uygula (`applyCase`)
4. Template token'larını değiştir (`{name}` / `{n}` / `{date}`)
5. Uzantı kuralını uygula (keep/lower/set/remove)

### Çakışma tespiti
`useMemo` içinde tüm yeni isimler bir `Map` ile sayılır; sayısı 1'den fazla olan veya boş kalan isimler `duplicate` işaretlenir ve indirme butonu devre dışı bırakılır.

### İndirme
Her dosya için `URL.createObjectURL(file)` → gizli `<a download=newName>` → `click()`. Tarayıcıların hızlı ardışık indirmeyi engellememesi için 150ms aralıkla tetiklenir, sonra `revokeObjectURL` ile temizlenir.

### Erişilebilirlik
- Tüm butonlarda `aria-label` veya görünür metin
- Dropzone `role="button"` + `tabIndex` + Enter/Space
- Segment butonlarında `aria-pressed`
- `:focus-visible` ile aksan renkli focus ring

---

## Tamamlandı / Test

- `npm install` — temiz
- `npm run build` — temiz (~334ms, CSS 10.33kB gzip 2.48kB, JS 204.9kB gzip 63.76kB)
- `npm run dev` — `localhost:5173` 200 OK
- Responsive: 720px'te tek kolona düşer, 600px'te satırlar dikey (eski/yeni alt alta)

---

## Sonraki Adımlar (opsiyonel)

- ZIP olarak tek dosya indirme (kütüphane maliyeti değerlendirilerek)
- Desen preset'leri (localStorage'da kaydet)
- `{ext}` ve `{parent}` gibi ek token'lar
- Sürükleyerek sıralama (numbering sırasını manuel değiştirme)
