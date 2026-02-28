# Déploiement sur Vercel

## 🚀 Guide de déploiement complet

### Prérequis
- Compte Vercel (gratuit) : https://vercel.com
- Compte Turso pour la database : https://turso.tech
- (Optionnel) Clés API DeepL ou Google Translate

---

## Étape 1 : Créer la database Turso (SQLite hébergé)

Turso est nécessaire car Vercel a un filesystem éphémère.

```bash
# 1. Installer Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Se connecter
turso auth login

# 3. Créer la database
turso db create live-monitor

# 4. Récupérer l'URL de connexion
turso db show live-monitor --url
# Copier l'URL : libsql://live-monitor-xxx.turso.io

# 5. Créer un token d'authentification
turso db tokens create live-monitor
# Copier le token : eyJhbGciOiJFZERTQS...
```

---

## Étape 2 : Installer Vercel CLI

```bash
npm install -g vercel
```

---

## Étape 3 : Déployer

```bash
# Dans le dossier du projet
cd /Users/xunit/Desktop/ww3

# Lancer le déploiement
vercel

# Suivre les prompts :
# - Set up and deploy? Yes
# - Which scope? [Votre compte]
# - Link to existing project? No
# - Project name: live-monitor
# - Directory: ./
# - Override settings? No
```

---

## Étape 4 : Configurer les variables d'environnement

### Option A : Via le dashboard Vercel

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `live-monitor`
3. Aller dans **Settings** → **Environment Variables**
4. Ajouter les variables suivantes :

| Nom | Valeur | Environnement |
|-----|--------|---------------|
| `TURSO_DATABASE_URL` | `libsql://live-monitor-xxx.turso.io` | Production |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQS...` | Production |
| `CRON_SECRET` | `générer_un_secret_aléatoire` | Production |
| `DEEPL_API_KEY` | `votre_clé_deepl` (optionnel) | Production |
| `GOOGLE_TRANSLATE_API_KEY` | `votre_clé_google` (optionnel) | Production |
| `NEXT_PUBLIC_APP_URL` | `https://middleeastlivefeed.com` | Production |

### Option B : Via CLI

```bash
vercel env add TURSO_DATABASE_URL
# Coller la valeur: libsql://live-monitor-xxx.turso.io

vercel env add TURSO_AUTH_TOKEN
# Coller le token

vercel env add CRON_SECRET
# Créer un secret: openssl rand -base64 32

vercel env add NEXT_PUBLIC_APP_URL
# Valeur: https://middleeastlivefeed.com
```

---

## Étape 5 : Migrer la database Turso

```bash
# Se connecter à Turso
turso db shell live-monitor

# Copier/coller le contenu de lib/db/migrations/001_initial.sql
# Puis taper .exit
```

**Alternative** : Créer un script de migration :

```bash
# Créer scripts/migrate-turso.ts
turso db shell live-monitor < lib/db/migrations/001_initial.sql
```

---

## Étape 6 : Seed les sources dans Turso

```bash
# Modifier temporairement .env.local pour pointer vers Turso
TURSO_DATABASE_URL=libsql://live-monitor-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQS...

# Modifier lib/db/client.ts pour utiliser Turso (voir section ci-dessous)

# Lancer le seed
npm run setup-db
```

### Code pour supporter Turso

**Dans `lib/db/client.ts`**, remplacer l'import et la fonction `getDatabase()` :

```typescript
import { createClient } from '@libsql/client';

let db: any = null;

export function getDatabase() {
  if (db) return db;

  // Production: use Turso
  if (process.env.TURSO_DATABASE_URL) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  // Development: use SQLite
  else {
    const Database = require('better-sqlite3');
    const dbPath = process.env.DATABASE_PATH || './data/monitor.db';
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }

  return db;
}
```

**Installer le client Turso** :
```bash
npm install @libsql/client
```

---

## Étape 7 : Configurer le domaine

### Dans Vercel Dashboard

1. Aller dans **Settings** → **Domains**
2. Ajouter `middleeastlivefeed.com`
3. Vercel vous donnera un CNAME : `cname.vercel-dns.com`

### Chez votre registrar de domaine

Ajouter un enregistrement DNS :

| Type | Nom | Valeur |
|------|-----|--------|
| CNAME | @ | cname.vercel-dns.com |

**Attendre 1-24h** pour la propagation DNS.

---

## Étape 8 : Activer les Cron Jobs

Les cron jobs sont déjà configurés dans `vercel.json` :

```json
{
  "crons": [{
    "path": "/api/ingest",
    "schedule": "*/5 * * * *"
  }]
}
```

Cela va appeler `/api/ingest` toutes les 5 minutes automatiquement.

**Vérifier dans Dashboard** :
- Aller dans **Settings** → **Cron Jobs**
- Vous devriez voir : `*/5 * * * *` → `/api/ingest`

---

## Étape 9 : Premier test de production

```bash
# Trigger manual ingestion
curl -X POST https://middleeastlivefeed.com/api/ingest \
  -H "authorization: Bearer VOTRE_CRON_SECRET"

# Vérifier les items
curl https://middleeastlivefeed.com/api/items?limit=5

# Visiter le site
open https://middleeastlivefeed.com
```

---

## 🔍 Debugging

### Voir les logs Vercel
```bash
vercel logs
```

### Vérifier la database
```bash
turso db shell live-monitor
SELECT COUNT(*) FROM feed_items;
SELECT * FROM sources LIMIT 5;
.exit
```

### Tester localement avec Turso

Modifier `.env.local` pour utiliser Turso temporairement :
```bash
TURSO_DATABASE_URL=libsql://live-monitor-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQS...
```

Puis :
```bash
npm run dev
npm run ingest
```

---

## 📊 Monitoring

**Dashboard Vercel** : https://vercel.com/dashboard
- Analytics
- Function logs
- Cron job status

**Turso Dashboard** : https://turso.tech/app
- Database metrics
- Query logs
- Storage usage

---

## 🚨 Troubleshooting

### Error: "SQLITE_CANTOPEN"
→ Database path incorrect ou permissions manquantes
→ Solution: Vérifier TURSO_DATABASE_URL

### Error: "Unauthorized" sur /api/ingest
→ CRON_SECRET incorrect
→ Solution: Vérifier variable d'environnement

### Pas de nouvelles dans le feed
→ Cron job pas configuré ou sources bloquées
→ Solution: Vérifier logs Vercel, tester manuellement /api/ingest

### Database empty après déploiement
→ Migrations pas exécutées sur Turso
→ Solution: Relancer scripts/migrate-turso.ts

---

## 🎯 Checklist finale

- [ ] Turso database créée et migrée
- [ ] Sources seeded dans Turso
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Code modifié pour supporter Turso (lib/db/client.ts)
- [ ] Déployé sur Vercel
- [ ] Domaine configuré
- [ ] Cron jobs activés
- [ ] Test manuel réussi
- [ ] Premières news visibles dans le dashboard

---

**Félicitations ! 🎉**

Votre site est maintenant live sur **https://middleeastlivefeed.com** !
