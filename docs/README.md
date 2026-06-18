# COFRAP Documentation

Technical documentation served via **GitHub Pages** + **Swagger UI**.

## How to enable it

1. Push the contents of this folder to the `main` branch
2. Go to **Settings** → **Pages** on GitHub
3. Under **Source**, select:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

GitHub will publish the docs at `https://<your-user>.github.io/mspr-cofrap/` (up to 5 minutes for the first deployment).

## Structure

```
docs/
├── _config.yml         # Jekyll configuration (just-the-docs theme)
├── Gemfile             # Ruby dependencies (for optional local preview)
├── index.md            # Home page
├── architecture.md     # Technical architecture
├── 2fa.md              # TOTP in detail (RFC 6238)
├── security.md         # The 3 enterprise-grade defenses
├── api.md              # API reference (link to Swagger)
├── api.html            # Interactive Swagger UI (loads openapi.yaml)
├── openapi.yaml         # OpenAPI 3.0 spec for the 4 endpoints
└── deploy.md            # Local deployment guide
```

## Local preview (optional)

To preview the docs locally before pushing:

```bash
cd docs
bundle install      # installs Jekyll and just-the-docs (requires Ruby)
bundle exec jekyll serve

# The docs are available at http://localhost:4000
```

Otherwise, just push and check the result on GitHub Pages.

## Editing the docs

- All content is written in **Markdown** in the `.md` files
- The `---` front matter at the top of each file sets the title, nav order, etc.
- The API spec lives in `openapi.yaml`: edit this file to update Swagger UI
- The `just-the-docs` theme automatically adds: a navigation sidebar, full-text search, dark mode, and heading anchors

## Useful links

- [just-the-docs documentation](https://just-the-docs.com/)
- [OpenAPI 3.0 specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
