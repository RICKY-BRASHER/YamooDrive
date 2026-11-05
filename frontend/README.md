# Frontend React

Le catalogue public et la console de l’agence sont une application React 19 et TypeScript construite avec Vite. Pour les instructions complètes de configuration, Docker et backend, consultez le [README principal](../README.md).

## Développement

```bash
pnpm install
pnpm dev
```

Configurez `VITE_API_URL` dans `.env` si Laravel n’est pas disponible sur `http://localhost:8000/api`. Le client WebSocket de l’administration a également besoin des valeurs correspondantes `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT` et `VITE_REVERB_SCHEME`. Ne placez jamais un secret Reverb dans les variables d’environnement frontend.

Avec Docker Compose, Vite relaie les requêtes WebSocket du navigateur vers le service Reverb interne. Le navigateur se connecte donc via le port `3000` sans dépendre de la publication du port Docker `8080`. En développement local sans Docker, dirigez directement les paramètres WebSocket vers le port Reverb de l’hôte.

## Principales zones

- `src/layout/YamooCatalog.tsx` : charge le catalogue public de véhicules et d’offres, et coordonne la connexion et les réservations client.
- `src/components/booking/PublicReservationModal.tsx` : envoie une demande de réservation client.
- `src/layout/AdminConsole.tsx` : charge les données admin, affiche le nom de l’administrateur connecté et s’abonne à l’activité privée en direct.
- `src/components/admin/` : écrans de gestion de la flotte, des clients, des offres et des réservations.
- `src/services/api.ts` : client Laravel typé et adaptation des réponses de l’API.
- `src/services/realtime.ts` : abonnement Laravel Echo/Reverb.

Les données métier sont chargées depuis Laravel ; le stockage local ne sert que de cache d’affichage de courte durée. Le serveur demeure la source de vérité pour les disponibilités, les prix, les autorisations et la persistance.

Le formulaire de la flotte utilise le sélecteur d’images natif de l’appareil et transmet le fichier avec `FormData` ; il ne demande pas d’URL d’image. Lorsqu’un administrateur est connecté, l’abonnement privé Reverb affiche les notifications d’activité et recharge les données d’administration concernées lorsqu’un événement arrive.

## Vérifications

```bash
pnpm build
pnpm lint
```

Pour une explication destinée aux débutants sur les composants React, les hooks, les fonctions asynchrones, les appels API et les événements Reverb de cette application, consultez le [cours React](../docs/react-beginner-guide.md), également disponible en [PDF imprimable](../docs/react-beginner-guide.pdf).
