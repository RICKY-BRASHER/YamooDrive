# Yamoo Drive

Yamoo Drive est une application de gestion de location de voitures développée avec Laravel, React, TypeScript, PostgreSQL et Laravel Reverb. Les clients peuvent consulter la flotte et envoyer des demandes de réservation. Depuis un tableau de bord sécurisé, les administrateurs gèrent les véhicules, les clients, les offres, les réservations, les paiements enregistrés manuellement et les retours de véhicules.

## Fonctionnalités

- Inscription des clients, vérification de leur adresse e-mail et connexion par session.
- Catalogue public des véhicules et des offres actives, chargé depuis l’API.
- Demandes de réservation avec vérification serveur des disponibilités et du prix.
- Tableau de bord affichant le nom de l’administrateur connecté et les données de l’application.
- Création de véhicules et de clients, sélection et téléversement d’images de véhicules, gestion de la disponibilité de la flotte.
- Création et activation d’offres, avec critères d’éligibilité des véhicules et durées minimales.
- Gestion des statuts de réservation, enregistrement des paiements et retours de véhicules.
- Notifications privées d’activité administrateur diffusées en temps réel avec Laravel Reverb et WebSockets.
- Interface React adaptative et export des réservations au format CSV.

Les paiements sont saisis manuellement après réception par l’agence. L’application ne débite pas de carte et n’est reliée à aucune passerelle de paiement.

## Parcours d’utilisation

### Clients

1. Consulter le catalogue public alimenté par l’API Laravel.
2. Créer un compte et vérifier l’adresse e-mail avant de se connecter.
3. Choisir un véhicule disponible, saisir les dates de location et le numéro du permis, puis envoyer une demande.
4. Le serveur vérifie la disponibilité, l’éligibilité et le prix final avant d’enregistrer la réservation.

### Administrateurs

1. Se connecter avec un compte administrateur créé par `php artisan admin:create`.
2. Gérer la flotte, les profils clients et les offres liées aux véhicules.
3. Examiner les demandes, confirmer ou démarrer une location, enregistrer les paiements reçus et les retours.
4. Consulter les données actuelles de la flotte et des réservations. Les notifications d’activité et les données de la page sont actualisées lorsqu’un autre administrateur ou un client effectue une action pertinente.

### Photos des véhicules

Dans le formulaire de gestion de la flotte, choisissez sur votre appareil une image JPG, PNG ou WebP. Le navigateur en affiche un aperçu et l’envoie sous forme de données multipart. Laravel vérifie le type et la taille (5 Mo maximum), enregistre le fichier sur le disque public et renvoie le véhicule créé. Il n’est pas nécessaire de fournir une URL d’image. Exécutez `php artisan storage:link` pour rendre les images disponibles.

### Activité en direct

Laravel diffuse les événements réservés aux administrateurs sur le canal privé `admin.activity`. Laravel Echo authentifie l’abonnement via la route `/broadcasting/auth`, protégée par la session. Les événements Reverb apparaissent dans les notifications et l’activité récente du tableau de bord, qui recharge également les données depuis le serveur. La base de données et l’API HTTP restent les sources de vérité ; les WebSockets signalent aux interfaces connectées qu’une donnée a changé.

## Technologies

| Domaine | Technologies |
| --- | --- |
| Interface | React, TypeScript, Vite, Tailwind CSS, React Router |
| API et règles métier | Laravel 13, PHP 8.3+ |
| Base de données | PostgreSQL 15 (Docker) |
| Temps réel | Laravel Reverb, Laravel Echo, protocole Pusher |
| Développement local | Docker Compose, pnpm |

## Démarrage rapide avec Docker

Prérequis : Docker Engine et le module complémentaire Docker Compose.

1. Copier les modèles de variables d’environnement :

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Construire les images, installer les dépendances PHP et générer la clé Laravel :

   ```bash
   docker compose build
   docker compose run --rm backend sh -c "composer install && php artisan key:generate --force"
   ```

3. Démarrer l’application :

   ```bash
   docker compose up -d
   ```

4. Créer le schéma et le lien public pour les fichiers téléversés :

   ```bash
   docker compose exec backend php artisan migrate --force
   docker compose exec backend php artisan storage:link
   ```

5. Créer interactivement un compte administrateur (le mot de passe est demandé et n’est pas enregistré dans ce dépôt) :

   ```bash
   docker compose exec backend php artisan admin:create admin@example.com
   ```

Ouvrez l’interface sur [http://localhost:3000](http://localhost:3000). L’API Laravel est disponible sur [http://localhost:8000](http://localhost:8000). Avec Docker, le serveur Vite de l’interface relaie les WebSockets du navigateur vers Reverb ; l’activité en direct fonctionne donc même si Docker ne peut pas publier directement le port Reverb.

Compose configure PostgreSQL, l’API, les journaux de courrier et Reverb pour le développement local. La base de données utilisée par défaut est `yamoo_drive`. Ne définissez `DB_DATABASE` dans le fichier `.env` à la racine que si vous souhaitez intentionnellement en choisir une autre. Définissez-y `DB_PASSWORD` avant de partager un environnement de développement. L’identifiant, la clé et le secret Reverb proviennent de `backend/.env` ; seul l’identifiant public correspondant est transmis à l’interface dans `frontend/.env.local`. N’exposez jamais et ne réutilisez jamais les identifiants de développement en production.

## Courriels et inscriptions publiques

Les nouveaux comptes clients doivent vérifier leur adresse e-mail avant de se connecter. Pour envoyer les messages de vérification, configurez les paramètres SMTP dans `backend/.env` (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` et `MAIL_FROM_ADDRESS`). La configuration Docker de développement utilise `MAIL_MAILER=log` ; consultez `backend/storage/logs/laravel.log` pour récupérer les liens de vérification locaux.

Une inscription publique crée un compte et un profil client. Les profils créés par un administrateur servent à la gestion de l’agence et ne créent pas de compte de connexion.

## Configuration

### Backend

Les paramètres Laravel sont documentés dans `backend/.env.example`. Avec Docker, Compose définit l’hôte et les identifiants de la base pour utiliser le service `postgres`. Paramètres locaux utiles :

- `APP_URL` : adresse du backend, généralement `http://localhost:8000`.
- `FRONTEND_URLS` : liste des origines navigateur autorisées, généralement `http://localhost:3000`.
- `FILESYSTEM_DISK=public` : stocke les images des véhicules dans `backend/storage/app/public`.
- `BROADCAST_CONNECTION=reverb` : envoie les événements d’activité administrateur au serveur Reverb.
- `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` : identifiants correspondants de l’application Reverb.
- `REVERB_HOST` et `REVERB_PORT` : `reverb:8080` depuis les conteneurs ; `127.0.0.1:8080` si le backend est exécuté directement sur l’hôte.

### Frontend

`frontend/.env.example` décrit les paramètres de l’API et de Reverb. Dans un navigateur local, `VITE_API_URL` doit pointer vers l’API, par exemple `http://localhost:8000/api`. La valeur `VITE_REVERB_APP_KEY` utilisée par le client WebSocket doit correspondre à `REVERB_APP_KEY` dans `backend/.env`. Seule la clé publique peut figurer dans la configuration frontend ; n’exposez jamais le secret Reverb dans le navigateur.

## Développement local sans Docker

Installez PHP 8.3+, Composer, PostgreSQL, Node.js 20+ et pnpm. Configurez `backend/.env` pour l’instance PostgreSQL locale et le fournisseur de courrier, puis exécutez :

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan admin:create admin@example.com
php artisan serve
```

Dans un autre terminal, installez et démarrez l’interface :

```bash
cd frontend
pnpm install
pnpm dev
```

Démarrez Reverb dans un troisième terminal avec les mêmes identifiants d’application :

```bash
cd backend
php artisan reverb:start --host=0.0.0.0 --port=8080
```

Si le frontend et le backend utilisent des noms d’hôtes ou des ports différents, adaptez `FRONTEND_URLS`, `VITE_API_URL` et les paramètres `VITE_REVERB_*`.

## Mise en production à faible coût (VM Docker)

Le fichier `docker-compose.production.yml` prépare un déploiement sur une seule VM Linux : Caddy termine le HTTPS, le conteneur Nginx sert le build React et transmet l’API à PHP-FPM, et Laravel, son worker de tâches, Reverb et PostgreSQL restent sur un réseau Docker privé. Les ports PostgreSQL et Reverb ne sont pas publiés sur Internet. Cette application utilise la file de tâches PostgreSQL ; aucun service Redis séparé n’est nécessaire dans cette configuration.

Oracle Cloud Infrastructure (OCI) propose des ressources Always Free, mais l’inscription demande une carte de crédit ou de débit pour vérifier l’identité. La documentation OCI indique qu’une éventuelle préautorisation est temporaire, mais une ressource hors limites Always Free ou un passage en compte payant peut entraîner des frais. Après la période d’essai, OCI indique une limite Always Free totale de 2 OCPU et 12 Go de mémoire pour Ampere A1. La capacité dépend de la région, il n’y a pas de SLA gratuit, et les comptes inactifs peuvent être suspendus. Vérifiez le marquage Always Free de chaque ressource dans la console et n’activez pas Pay As You Go si vous souhaitez rester à 0 €.

Une sous-adresse DuckDNS peut fournir gratuitement un nom d’hôte pour la VM sans acheter de domaine. Caddy obtient alors automatiquement un certificat HTTPS lorsque le DNS pointe correctement vers la VM et que les ports TCP 80/443 sont accessibles. Garder l’interface et l’API sur le même nom d’hôte évite les problèmes de cookies de session et d’authentification Reverb.

### Préparer et démarrer

1. Créez une VM Ubuntu dans votre région OCI d’origine, en choisissant une forme explicitement marquée **Always Free** et en restant dans les limites Always Free de votre compte. Installez Docker Engine et le plug-in Docker Compose depuis la [documentation Docker](https://docs.docker.com/engine/install/).
2. Autorisez les ports TCP 80 et 443 dans les règles réseau OCI et dans le pare-feu de la VM. Limitez SSH (port 22) à votre adresse IP ; ne publiez ni PostgreSQL (5432) ni Reverb (8080).
3. Créez un sous-domaine DuckDNS et faites pointer son adresse IPv4 vers l’adresse publique de la VM.
4. Clonez ce dépôt sur la VM, puis préparez le fichier d’environnement :

   ```bash
   git clone https://github.com/RICKY-BRASHER/YamooDrive.git
   cd YamooDrive
   cp .env.production.example .env.production
   ```

   Si le dépôt est privé, authentifiez Git sur la VM avec une clé de déploiement en lecture seule ; ne mettez jamais un jeton GitHub dans le fichier d’environnement.

5. Modifiez `.env.production` **sur la VM seulement**. Remplacez le sous-domaine d’exemple dans `APP_DOMAIN`, `APP_URL`, `FRONTEND_URL`, `FRONTEND_URLS` et `MAIL_EHLO_DOMAIN`. Renseignez également un mot de passe PostgreSQL aléatoire et les paramètres SMTP d’un fournisseur de courrier. La vérification des adresses e-mail ne fonctionnera pas tant que le SMTP réel n’est pas configuré.
6. Générez les identifiants Reverb et un mot de passe DB (par exemple avec `openssl rand -hex 32`). Gardez `REVERB_HOST=reverb`, `REVERB_PORT=8080` et `REVERB_SCHEME=http` dans l’environnement Laravel : cette adresse est privée au réseau Docker. Le build React reçoit séparément l’hôte public HTTPS pour sa connexion WSS.
7. Validez la configuration et construisez les images :

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
   docker compose --env-file .env.production -f docker-compose.production.yml build
   ```

8. Générez la clé Laravel puis copiez la valeur affichée dans `APP_KEY` de `.env.production` :

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml run --rm --no-deps app php artisan key:generate --show
   ```

   Ne changez plus `APP_KEY` après la mise en service : les sessions et données chiffrées en dépendent.

9. Démarrez la base, appliquez les migrations, puis démarrez le reste :

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d postgres
   docker compose --env-file .env.production -f docker-compose.production.yml run --rm --no-deps app php artisan migrate --force
   docker compose --env-file .env.production -f docker-compose.production.yml up -d
   docker compose --env-file .env.production -f docker-compose.production.yml exec app php artisan admin:create admin@example.com
   ```

   Le mot de passe administrateur est demandé par la commande et ne doit pas être ajouté au dépôt. Consultez `https://VOTRE_SOUS_DOMAINE/up` et les journaux avec `docker compose --env-file .env.production -f docker-compose.production.yml logs -f`.

### Mises à jour et sauvegardes

Pour mettre à jour le code, appliquez les nouvelles migrations avant de redémarrer les services :

```bash
git pull --ff-only
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d postgres
docker compose --env-file .env.production -f docker-compose.production.yml run --rm --no-deps app php artisan migrate --force
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Les données PostgreSQL, les photos téléversées et les certificats Caddy sont conservés dans des volumes Docker de la VM, pas dans Git. Une panne ou suppression de la VM peut toutefois les faire perdre : planifiez des sauvegardes chiffrées hors de la VM pour la base et les photos, et testez leur restauration. Ne lancez pas `docker compose down -v` : l’option `-v` supprime les volumes de données. Ce déploiement gratuit est adapté à une démonstration ou un petit projet, mais une activité de production avec des données clients importantes doit prévoir un hébergement avec support, sauvegardes et SLA.

## Tests et contrôles qualité

```bash
pnpm --dir frontend build
pnpm --dir frontend lint
cd backend && php artisan test
```

L’image Docker du backend inclut les pilotes PDO PostgreSQL et SQLite ; les tests fonctionnels utilisent une base SQLite en mémoire et forcent l’environnement Laravel de test. Exécutez les contrôles du backend dans le conteneur `backend` si PHP installé sur l’hôte ne dispose pas de `pdo_sqlite`.

## Organisation du projet

```text
backend/
  app/Http/Controllers/Api/  Authentification par session, données admin et locations
  app/Services/              Disponibilité et tarification des réservations
  app/Events/                Diffusion privée de l’activité administrateur
  database/migrations/       Schéma de location et relations offres-véhicules
  tests/                     Tests Laravel fonctionnels et unitaires
frontend/
  src/components/            Pages publiques, réservation et écrans admin
  src/layout/                Interfaces principale et admin
  src/services/              Client API et abonnement Reverb
docs/
  react-beginner-guide.md   Cours React en français avec exemples tirés du projet
```

Consultez le [README du backend](backend/README.md) pour l’API et le modèle de données, et le [README du frontend](frontend/README.md) pour les détails de l’interface.
Pour apprendre React pas à pas et comprendre le rôle des fonctions du frontend, consultez le [cours React pour débutants](docs/react-beginner-guide.md), également disponible en [version PDF imprimable](docs/react-beginner-guide.pdf).
