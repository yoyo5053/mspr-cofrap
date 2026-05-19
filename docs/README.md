# Documentation COFRAP

Documentation technique servie via **GitHub Pages** + **Swagger UI**.

## Comment l'activer

1. Push le contenu de ce dossier sur la branche `main`
2. Aller dans **Settings** → **Pages** sur GitHub
3. Sous **Source**, sélectionner :
   - **Branch** : `main`
   - **Folder** : `/docs`
4. Cliquer **Save**

GitHub publiera la doc sur `https://<votre-user>.github.io/mspr-cofrap/` (jusqu'à 5 minutes pour le premier déploiement).

## Structure

```
docs/
├── _config.yml         # Configuration Jekyll (thème just-the-docs)
├── Gemfile             # Dépendances Ruby (pour preview local optionnel)
├── index.md            # Page d'accueil
├── architecture.md     # Architecture technique
├── 2fa.md              # TOTP en détail (RFC 6238)
├── security.md         # Les 3 défenses enterprise-grade
├── api.md              # Référence API (lien vers Swagger)
├── api.html            # Swagger UI interactif (charge openapi.yaml)
├── openapi.yaml        # Spec OpenAPI 3.0 des 4 endpoints
└── deploy.md           # Guide de déploiement local
```

## Preview en local (optionnel)

Pour prévisualiser la doc en local avant de push :

```bash
cd docs
bundle install      # installe Jekyll et just-the-docs (Ruby requis)
bundle exec jekyll serve

# La doc est sur http://localhost:4000
```

Sinon, push direct et regarder le résultat sur GitHub Pages.

## Modifier la doc

- Tous les contenus sont en **Markdown** dans les fichiers `.md`
- Le front matter `---` au début de chaque fichier définit titre, ordre dans la nav, etc.
- La spec API est dans `openapi.yaml` : modifier ce fichier pour mettre à jour Swagger UI
- Le thème `just-the-docs` ajoute automatiquement : sidebar de navigation, recherche full-text, dark mode, anchors sur les headings

## Liens utiles

- [Documentation just-the-docs](https://just-the-docs.com/)
- [Spécification OpenAPI 3.0](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
