# Projek — Portfolio Ahmad Suhaib

## Status

Fasa A–E siap pada branch `design/apple-minimal` (tidak digabung ke `main`). Commit utama:

- `35b9497` — Fasa A: token reka bentuk dan tipografi.
- `1a250c0` — Fasa B: hero kamera 3D.
- `9ce62c7` — pembetulan hero dan poster responsif.
- `ed7b9b6` — Fasa C: Selected work dan demo lazy.
- `3f4cd92` — pembetulan copy Selected work.
- `17904ac` — Fasa D: pinned 3D Objects.
- `8efe8c3`, `f64ae89`, `0f74eb4`, `239bbb7`, `4afa61e`, `d3ab24e`, `7d32f1c` — Fasa E: pembetulan, Ventures, Recognition/Contact, navigasi/About, SEO, aksesibiliti dan prestasi/aset.
- Commit dokumentasi ini ialah commit terakhir selepas `7d32f1c`.

## Objektif

Membina semula portfolio sebagai pengalaman produk gaya Apple: satu mesej setiap section, ruang lega, tipografi besar, satu aksen oren, dan 3D yang berfungsi sebagai fotografi produk — bukan hiasan. Semua fakta, pautan dan metrik mesti datang daripada rekod projek sedia ada; tiada klien, tangkapan skrin atau angka yang direka.

## Teknologi

- HTML, CSS dan JavaScript statik; tiada framework atau build step.
- Three.js **r128** dan GLTFLoader (fail tempatan dalam `vendor/`).
- GSAP **3.12.5** dan ScrollTrigger **3.12.5** (CDN).
- Lenis **1.1.14** (CDN), disambung dengan ScrollTrigger.
- Inter (WOFF2 tempatan) sebagai satu-satunya typeface.
- Vercel untuk hosting, kompresi dan header cache (`vercel.json`).
- Alat pembangunan: Python `http.server` untuk ujian tempatan, Playwright untuk ujian Chromium/WebKit/Firefox, Lighthouse 13.6.0.

## Fungsi

- Hero poster-first dengan kamera 3D selepas idle, parallax halus dan fallback poster.
- About: satu statement besar dan tiga baris capability.
- Selected work: empat projek (HistoScan-AI, Duits, Waspada Banjir, Agent Systems) dengan satu interaksi setiap projek, demo dimuat secara lazy, dan indeks More work (Invoicing Engine, XAUUSD).
- Objects: satu section pinned 3D untuk Sejenak Photobooth, BVRCODE Apparel dan Tinta Visuals; objek bergerak mengikut scroll, drag yaw manual, progress dot dan salinan yang bertukar.
- Ventures: dua baris ringkas Hannenkam Rise Ventures dan DevXMedia.
- Recognition: enam baris anugerah, Dean's List, pendidikan dan pensijilan.
- Contact: mesej besar, status internship, salin emel ke papan klip dan pautan GitHub.
- Fallback statik untuk `<1024px`, pointer kasar, reduced motion, `deviceMemory < 4`, WebGL gagal atau tiada IntersectionObserver; fallback tanpa JavaScript juga tersedia.
- Navigasi header dengan scroll-spy, menu mobile penuh skrin dengan focus trap, Esc dan pemulihan fokus.
- SEO: title/description, OG/Twitter image 1200×630, favicon SVG/ICO/apple-touch-icon, JSON-LD Person, `robots.txt` dan `sitemap.xml`.
- Prestasi: satu WebGL renderer dikongsi, model dimuat progresif, loop berhenti di luar viewport, dan header cache aset.

## Ringkasan

Keputusan utama ialah menggunakan satu sistem visual yang tenang — hitam, putih, `#f5f5f7`, kelabu dan satu aksen oren — dengan Inter sahaja dan tanpa label HUD/mono/uppercase mikro. Hero dan Objects menggunakan satu renderer Three.js yang sama; canvas dipindahkan antara hero dan pinned stage, bukan dicipta semula. Setiap pengalaman 3D mempunyai fallback statik yang setara. Kandungan dihadkan kepada fakta sedia ada, fotografi stok dikeluarkan daripada aliran utama, dan semua pautan/brand yang dikekalkan menggunakan href asal. Dokumen pra-redesign diarkibkan di `docs/archive/`, dan audit aset tidak dirujuk disimpan di `docs/ASSET-AUDIT.md` tanpa memadam sebarang aset.
