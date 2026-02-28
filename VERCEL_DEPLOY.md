# Déploiement Vercel - Guide Rapide

## 📋 Prérequis

1. Compte Supabase : https://supabase.com
2. Compte Vercel : https://vercel.com
3. Domaine : `middleeastlivefeed.com`

---

## 🗄️ Étape 1 : Configurer Supabase

### 1.1 Créer un projet

1. Aller sur https://supabase.com
2. Créer un nouveau projet : `live-monitor`
3. Choisir une région (ex: US East)
4. Noter le mot de passe de la database

### 1.2 Créer les tables

1. Aller dans **SQL Editor**
2. Copier/coller le contenu de `lib/db/migrations/supabase-schema.sql`
3. Cliquer sur **Run**

### 1.3 Seed les sources

Dans SQL Editor, exécuter :

```sql
INSERT INTO sources (name, url, source_type, reliability, language, rate_limit_seconds, is_active) VALUES
('BBC News - Middle East', 'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml', 'mainstream', 5, 'en', 300, true),
('AP News - Middle East', 'https://feedx.net/rss/ap.xml', 'mainstream', 5, 'en', 300, true),
('Al Jazeera - English', 'https://www.aljazeera.com/xml/rss/all.xml', 'regional', 4, 'en', 300, true),
('Times of Israel', 'https://www.timesofisrael.com/feed/', 'regional', 4, 'en', 300, true),
('The Jerusalem Post', 'https://www.jpost.com/rss/rssfeedsheadlines.aspx', 'regional', 4, 'en', 300, true),
('Middle East Eye', 'https://www.middleeasteye.net/rss', 'regional', 4, 'en', 300, true),
('ReliefWeb - Updates', 'https://reliefweb.int/updates/rss.xml', 'humanitarian', 5, 'en', 600, true),
('UN OCHA - News', 'https://www.unocha.org/rss.xml', 'humanitarian', 5, 'en', 600, true),
('UN News - Middle East', 'https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml', 'official', 5, 'en', 600, true);
```

### 1.4 Récupérer les clés

1. Aller dans **Project Settings** → **API**
2. Copier :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **service_role key** (secret)

---

## 🚀 Étape 2 : Déployer sur Vercel

### 2.1 Connexion GitHub

Le repo est déjà sur GitHub : https://github.com/Project-GHOSTLINE/live-monitor

### 2.2 Importer dans Vercel

```bash
vercel --prod
```

Ou via dashboard :
1. Aller sur https://vercel.com/new
2. Importer depuis GitHub
3. Sélectionner `live-monitor`

### 2.3 Configurer les variables d'environnement

Dans **Settings** → **Environment Variables**, ajouter :

| Variable | Valeur | Type |
|----------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (clé service_role) | Production (Secret) |
| `CRON_SECRET` | Générer : `openssl rand -base64 32` | Production (Secret) |
| `NEXT_PUBLIC_APP_URL` | `https://middleeastlivefeed.com` | Production |
| `DEEPL_API_KEY` | Votre clé DeepL (optionnel) | Production (Secret) |

### 2.4 Déployer

Vercel va automatiquement :
- Build le projet
- Déployer sur un domaine `.vercel.app`

---

## 🌐 Étape 3 : Configurer le domaine

### 3.1 Dans Vercel

1. **Settings** → **Domains**
2. Ajouter `middleeastlivefeed.com`
3. Vercel affiche les DNS à configurer

### 3.2 Chez votre registrar

Ajouter ces enregistrements DNS :

| Type | Nom | Valeur |
|------|-----|--------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

Ou simplement :

| Type | Nom | Valeur |
|------|-----|--------|
| CNAME | @ | cname.vercel-dns.com |

Attendre 1-24h pour la propagation.

---

## ⏰ Étape 4 : Vérifier les Cron Jobs

Les cron jobs sont déjà configurés dans `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/ingest",
    "schedule": "*/5 * * * *"
  }]
}
```

Vérifier dans **Settings** → **Cron Jobs** que le job apparaît.

---

## ✅ Étape 5 : Test

### Test manuel

```bash
# Trigger ingestion
curl -X POST https://middleeastlivefeed.com/api/ingest \
  -H "authorization: Bearer VOTRE_CRON_SECRET"

# Vérifier les items
curl https://middleeastlivefeed.com/api/items?limit=5

# Ouvrir le site
open https://middleeastlivefeed.com
```

### Vérifier dans Supabase

```sql
SELECT COUNT(*) FROM feed_items;
SELECT * FROM feed_items ORDER BY published_at DESC LIMIT 5;
```

---

## 📊 Monitoring

- **Vercel** : https://vercel.com/dashboard → Logs, Analytics
- **Supabase** : https://supabase.com/dashboard → Database, Logs
- **Cron Jobs** : Vercel dashboard → Function logs

---

## 🐛 Troubleshooting

### Erreur : "Missing Supabase credentials"
→ Vérifier les variables d'environnement dans Vercel

### Aucune news dans le feed
→ Vérifier les logs de `/api/ingest` dans Vercel
→ Vérifier que les sources sont dans Supabase

### Erreur 401 sur `/api/ingest`
→ Vérifier que `CRON_SECRET` est correct

---

## 🎉 C'est fait !

Votre site est maintenant live sur **https://middleeastlivefeed.com** !

Le cron job va automatiquement ingérer les news toutes les 5 minutes.
