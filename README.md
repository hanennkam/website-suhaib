# website-suhaib

Personal portfolio site for **Ahmad Suhaib** — software engineer, creative technologist, and founder.

Single-page, dependency-light static site: one `index.html` with inline CSS/JS, fonts from Google Fonts, and an Open Graph preview image.

## Sections

- **Hero** — intro, signal field animation
- **About** — background, UMPSA CS, focus areas
- **Ventures** — BVR Code Apparel, Hanennkam Rise Ventures
- **Work** — selected projects (Duits money management, etc.)
- **Experience** — education & roles
- **Contact** — links and email

## Run locally

No build step. Just open it, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Structure

```
index.html      # the whole site (markup + styles + behaviour)
og-image.png    # 1200x630 social preview image
```

## Deploy

Static — drop the folder on any host (GitHub Pages, Cloudflare Pages, Netlify). For GitHub Pages: Settings → Pages → deploy from `main` / root.

---

© Ahmad Suhaib. Content and images are personal; please don't reuse without permission.
