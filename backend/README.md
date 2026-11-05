# Backend Laravel

Cette application Laravel fournit l’API Yamoo Drive avec authentification par session, le modèle de données PostgreSQL pour la location et la diffusion privée des événements d’activité administrateur. Le [README principal](../README.md) contient les instructions complètes de configuration Docker et locale.

## Domaines de l’API

- `GET /api/catalog` : véhicules de la flotte et offres actives pour le catalogue public.
- `POST /api/register`, `POST /api/login` et `GET /api/user` : inscription client et authentification par session.
- `PATCH /api/profile` et `POST /api/logout` : modification du profil connecté et fermeture sécurisée de la session.
- `GET /api/my/reservations`, `POST /api/reservations` : demandes de réservation d’un client.
- `/api/admin/*` : gestion réservée aux administrateurs de la flotte, des clients, des offres, des réservations, des paiements et des retours de véhicules.
- `POST /broadcasting/auth` : autorisation par session Laravel des canaux privés Reverb.

Toutes les routes d’administration vérifient que le rôle de l’utilisateur connecté est `admin`. Les demandes de réservation publiques exigent une session client authentifiée ; `ReservationService` revérifie les disponibilités et le prix avant toute écriture.

## Modèle de données et tarification

Les migrations définissent les entités `Voiture`, `Client`, `Reservation`, `Paiement`, `Retour` et `BonPlan`. Une offre peut s’appliquer à plusieurs véhicules grâce à la table pivot offre-véhicule. La réservation conserve le prix et les détails de l’offre appliquée afin que les modifications ultérieures ne changent pas le montant historique.

Le service de tarification vérifie que le véhicule est opérationnel et qu’aucune réservation en attente, confirmée ou active ne chevauche la période demandée. Le tarif de base facture chaque heure commencée au prix horaire, dans la limite du prix journalier par tranche de 24 heures. Une offre valide est comparée au tarif de base ; les heures qui ne sont pas couvertes par l’offre restent facturées au tarif de base.

Les paiements de l’API sont des enregistrements manuels des sommes reçues par l’agence. Ils sont plafonnés au solde restant dû pour la location ou la caution. Aucune passerelle de paiement n’est connectée.

## Images et événements en temps réel

Les images de véhicules sont téléversées aux formats JPG, PNG ou WebP (5 Mo maximum) et stockées sur le disque `public` de Laravel. Après l’installation, exécutez `php artisan storage:link` pour rendre les URL `/storage` accessibles dans le navigateur.

`AdminActivity` est ajouté à la file d’attente puis diffusé sur le canal privé `admin.activity` par le worker Laravel. Ainsi, une indisponibilité temporaire de Reverb ne transforme pas une opération déjà enregistrée en erreur HTTP. Seuls les comptes administrateurs peuvent s’authentifier au canal. La route HTTP d’authentification Reverb utilise la même session Laravel et doit être autorisée par CORS pour l’origine frontend configurée.

## Création d’un compte administrateur

Créez un compte administrateur vérifié avec un mot de passe saisi de manière interactive. La commande refuse d’écraser un compte existant :

```bash
php artisan admin:create admin@example.com 
```

N’ajoutez pas d’identifiants administrateur partagés ou codés en dur dans les données initiales. `DatabaseSeeder` ne crée volontairement aucun compte privilégié par défaut.

## Tests

```bash
php artisan test
```

Les tests utilisent une base SQLite en mémoire. L’image Docker du backend installe `pdo_sqlite` à cet effet et `pdo_pgsql` pour la base de l’application.
