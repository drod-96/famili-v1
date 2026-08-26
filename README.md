# Caisse Familiale Andamboly

Application simple de suivi de la **caisse familiale commune**.

Chaque membre doit verser **10 000 Ar par mois**. L'application convertit
automatiquement les versements en mois payés (30 000 Ar = 3 mois) et signale en
rouge les mois passés qui ne sont pas couverts — ainsi que **le membre lui-même**,
dans la liste de gauche, dès qu'il a du retard sur le mois en cours.

Le suivi se fait **par année civile** : la grille affiche les mois de l'année en
cours, et l'avance qu'un membre peut prendre s'arrête à **décembre**. En 2026 la
caisse ne compte que quatre mois (septembre → décembre) : 40 000 Ar suffisent donc
à couvrir toute l'année.

Ce qui est versé **au-delà de décembre n'est pas perdu** : il est reporté sur
l'année suivante et annoncé tel quel — pastille `Année couverte · +2 mois`, `4/4 +2`
dans la liste de gauche, et « 2,5 mois reportés sur 2027 » sous la grille.

La caisse démarre en **septembre 2026**. Ce qui a été donné **avant** pour un
événement — l'anniversaire de tonton Jean Michel, et la dépense qui a suivi — se
saisit comme **participation ponctuelle** : l'argent entre bien dans la caisse et
compte dans le solde, mais il ne couvre aucun mois.

## Stack

- React 19 + TypeScript
- Vite 8
- CSS natif avec design tokens
- Données mockées derrière une interface `FinanceRepository`
- Compatible GitHub Pages

Aucune base de données n'est nécessaire pour lancer cette version.

## Lancer en local

```bash
npm install
npm run dev
```

Vite affiche une adresse locale, généralement `http://localhost:5173`.

Pour tester depuis un téléphone sur le même Wi-Fi :

```bash
npm run dev -- --host
```

## Vérifier avant commit

```bash
npm run typecheck
npm run build
```

## Où vivent les données

**Dans Supabase**, dès que le projet est raccordé : une base, partagée par tous,
derrière une authentification. Rien ne transite par le dépôt, rien n'est écrit
dans la page. C'est le mode dans lequel l'application est faite pour tourner —
voir [Brancher Supabase](#brancher-supabase).

Le fichier `data/fund.seed.json` garde les données réelles pour alimenter la
base la première fois (`npm run seed:supabase`). Il n'est **jamais versionné** :
le dépôt est public.

**Sans Supabase**, l'application se replie sur le `localStorage` du navigateur,
sur une caisse vide. C'est un mode de développement — `npm run dev` marche sans
compte — pas un mode de consultation : rien n'y est partagé entre appareils.

## Les réglages à connaître

Tout est dans [`src/config/fund.ts`](src/config/fund.ts) :

```ts
export const FUND_NAME = 'Caisse Familiale Andamboly';
export const MONTHLY_DUE_AR = 10_000;               // cotisation mensuelle
export const FUND_START = { year: 2026, month: 9 };  // premier mois de la caisse
export const DEFAULT_EUR_RATE_AR = 5_100;            // taux de départ, 1 € = 5 100 Ar
export const FUND_ANNOUNCEMENT: string | null = null; // bandeau « Actu »
```

Le taux de change n'est **pas** connecté à une API. `DEFAULT_EUR_RATE_AR` n'est que
sa valeur de départ : une fois l'application lancée, **le taux se change depuis
l'espace admin** et il est enregistré avec les données de la caisse. Il est rappelé
sous le solde pour que tout le monde sache quel taux est appliqué.

`FUND_ANNOUNCEMENT` affiche un bandeau **Actu** en haut du tableau de bord.
Tant qu'il vaut `null`, le bandeau rappelle automatiquement que la caisse démarre
en septembre 2026 ; dès que la caisse a démarré, il disparaît.

## Espace admin

L'écran de saisie est à l'adresse **`#/admin`**, accessible par le bouton cadenas
« Admin » de l'en-tête (réduit au cadenas seul sur téléphone). Il demande d'abord
un mot de passe, puis propose six formulaires :

| Action | Ce qui est demandé |
| --- | --- |
| **Nouvelle entrée** | le payeur (liste déroulante alphabétique), la **nature** (cotisation ou participation ponctuelle), le montant **en Ar ou en €**, la date, une note |
| **Nouvelle sortie** | le motif, le montant **en Ar ou en €**, la catégorie, la date, et — **facultativement** — un membre concerné |
| **Nouveau membre** | titre, prénom, nom, couleur d'avatar |
| **Taux de change** | le nouveau taux, en ariary pour 1 € |
| **Corriger une entrée** | l'entrée à reprendre, puis tous ses champs — ou sa suppression |
| **Corriger un membre** | le membre à reprendre, puis titre, prénom, nom, couleur |

Le nombre de mois payés n'est jamais saisi : il est déduit du montant. En saisissant
30 000 Ar, le formulaire affiche `= 3 mois` avant même l'enregistrement, et les mois
sont ajoutés à ceux déjà couverts par le membre.

Chaque champ « Montant » a sa propre bascule **Ar / €**. Un montant saisi en euros
est converti en ariary **au taux en vigueur au moment de l'enregistrement** :
le stockage reste entièrement en ariary, et le formulaire indique en dessous ce qui
sera réellement enregistré (`Enregistré 15 300 Ar`).

Les décimales de mois sont **tronquées, jamais arrondies** : 9 996 Ar affiche
`0,99 mois`, pas `1 mois` — on n'annonce jamais un mois qui n'est pas couvert.

### Cotisation ou participation ponctuelle

Le champ **Nature du versement** décide de tout :

| Nature | Effet |
| --- | --- |
| **Cotisation mensuelle** | convertie en mois payés (30 000 Ar = 3 mois) |
| **Participation ponctuelle** | entre dans la caisse et dans le solde, **sans couvrir de mois** |

Une participation ponctuelle demande un **motif** (« Anniversaire de tonton Jean
Michel ») : c'est ce qu'on relira dans un an. Elle sert aux collectes faites en
dehors des cotisations — un événement, une aide exceptionnelle — y compris
**avant le démarrage de la caisse**.

Sur le tableau de bord, elle reste volontairement discrète :

- dans le fil des mouvements, « **a participé** » au lieu de « a payé », avec une
  pastille grise **Ponctuel** au lieu du « +2 mois » vert ;
- sous les mois payés du membre, une ligne en retrait « **Dont ponctuel** »,
  affichée seulement s'il y en a ;
- dans le solde, rien de particulier : c'est de l'argent de la caisse comme le reste.

### Corriger une saisie

Rien n'est figé. **Corriger une entrée** liste tous les versements, du plus
récent au plus ancien (`Naina — 75 000 Ar — 26/08/2026 — ponctuel`) ; en choisir
un remplit le formulaire avec ce qu'il contient, y compris sa nature — on peut
donc **basculer une cotisation en participation ponctuelle** et l'inverse. Le
bouton **Supprimer**, lui, demande confirmation.

**Corriger un membre** change titre, prénom, nom et couleur. L'identifiant ne
bouge jamais : renommer quelqu'un ne détache **aucun** de ses versements.

### Changer le taux € / Ar

Le formulaire **Taux de change** demande une seule chose : combien d'ariary vaut
un euro. Le taux prend effet **immédiatement**, il est daté du jour et vient en
tête de l'historique ; les trois précédents restent affichés sous le formulaire.

Le principe est simple :

- **rien n'est réécrit.** Tous les montants sont stockés en ariary : un versement
  de 30 000 Ar reste 30 000 Ar, et le solde de la caisse en ariary ne bouge pas ;
- **c'est la valeur en euros qui suit le taux**, pour l'historique comme pour la
  suite — c'est bien elle qui fluctue, pas l'argent réellement présent ;
- **les saisies faites en euros** à partir de ce moment-là sont converties au
  nouveau taux, puis enregistrées en ariary comme les autres.

Le formulaire montre l'effet avant d'enregistrer : ce que vaudront une cotisation
et le solde au taux saisi.

### Mot de passe

**Ce mot de passe ne sert qu'en mode local.** Dès que Supabase est branché, le
droit de saisir vient de la base (`app_users.is_admin`) et cet écran disparaît.

Le mot de passe par défaut est **`andamboly`**. L'accès reste ouvert jusqu'à la
fermeture de l'onglet.

Pour le changer, générer l'empreinte du nouveau mot de passe :

```bash
echo -n "mon-nouveau-mot-de-passe" | sha256sum
```

puis coller le résultat dans `ADMIN_PASSWORD_SHA256`
([`src/config/admin.ts`](src/config/admin.ts)). Le mot de passe lui-même n'est
jamais écrit dans le code.

Le membre responsable de la caisse porte `isAdmin: true` dans les données ; il est
signalé « responsable » sous son nom dans la liste de gauche.

> **Attention — tant que Supabase n'est pas branché**, deux limites :
>
> 1. Les saisies restent dans le navigateur (`localStorage`) de l'appareil qui
>    les fait ; elles ne sont pas partagées entre téléphones.
> 2. Le mot de passe est vérifié **dans le navigateur**. Il empêche l'accès
>    accidentel, mais quelqu'un qui inspecte le code du site le contourne.
>
> Le code Supabase est écrit et règle les deux : il ne manque que le projet et
> ses deux variables. Voir [Brancher Supabase](#brancher-supabase).

## Les membres

La liste de gauche est une **liste simple, triée par ordre alphabétique** — il n'y
a ni famille ni chef de famille. Le tri se fait sur le prénom puis le nom, en
ignorant les accents et la casse (`Élodie` et `elodie` se suivent), et sans tenir
compte du titre : « Tonton Jean Michel » se classe à **J**, pas à **T**.

Une fois Supabase branché, tout se saisit depuis l'espace admin et se partage
aussitôt. Le fichier `data/fund.seed.json` ne sert qu'à **remplir la base la
première fois** ; passé ce cap, il ne fait plus foi.

```json
"members": [
  { "id": "naina", "title": "Mre", "firstName": "Naina", "color": "teal", "avatarUrl": null },
  { "id": "tiana", "firstName": "Tiana", "color": "blue", "avatarUrl": null }
]
```

> **Attention — le fichier ne gagne pas contre le navigateur.** Sur un appareil
> qui a déjà affiché l'application, les données sont dans `localStorage` et
> gardent la priorité : modifier `mockFund.ts`, relancer `npm run dev` ou
> recharger la page n'y change rien. Deux façons de repartir du fichier :
>
> 1. le bouton **« Repartir des données de départ »**, en bas de l'espace admin ;
> 2. monter la version de `STORAGE_KEY` dans
>    [`src/services/localFinanceRepository.ts`](src/services/localFinanceRepository.ts)
>    (`famili.fund.v2` → `v3`, en ajoutant l'ancienne clé à `LEGACY_KEYS`), ce qui
>    fait repartir **tous** les appareils, pas seulement le sien.

L'ordre du fichier n'a aucune importance : l'affichage trie lui-même.

Le champ `title` est libre — « Tonton », « Tantine », « Dr », « PDG », « Maire »… Il
s'affiche **en gris devant le prénom, exactement tel qu'il a été saisi** : `PDG`
reste `PDG Rado Rasoa`, et les sigles gardent donc leurs majuscules.

Les versements se saisissent dans `contributions` (montants toujours **positifs**,
toujours **en ariary**) :

```json
{ "id": "c-naina", "memberId": "naina", "amountAr": 60000, "date": "2026-08-26" },

// Sans `kind`, c'est une cotisation. `kind: "oneOff"` ne couvre aucun mois :
{ "id": "a-naina", "memberId": "naina", "amountAr": 75000, "date": "2026-08-26",
  "kind": "oneOff", "note": "Anniversaire" },

// Sans `memberId` : de l'argent entré sans qu'on sache encore de qui il vient.
{ "id": "a-complement", "amountAr": 257000, "date": "2026-08-26",
  "kind": "oneOff", "note": "Complément — lignes manquantes du relevé" }
```

Le `memberId` est **facultatif**. Un versement sans membre compte dans le solde
mais n'est attribué à personne : il apparaît dans le fil des mouvements sous sa
note, sans avatar, et ne donne de mois à personne. C'est ce qui permet de faire
tomber juste le total d'un relevé dont il manque des lignes, sans inventer un
membre pour l'occasion.

Et les dépenses de la caisse dans `expenses` :

```json
{ "id": "e-1", "label": "Aide médicale", "amountAr": 40000,
  "date": "2026-08-19", "category": "health" }
```

Rien d'autre n'est à modifier : les mois payés, les retards, les totaux et le fil
des mouvements sont tous recalculés à partir de ces trois listes.

## Comment les mois sont calculés

`src/utils/fund.ts` contient toute la logique :

1. on additionne les **cotisations** du membre — les participations ponctuelles
   sont mises de côté, elles ne couvrent aucun mois ;
2. on divise par `MONTHLY_DUE_AR` pour obtenir le nombre de mois couverts ;
3. ces mois sont attribués **dans l'ordre**, à partir de septembre 2026 ;
4. on compare avec la date du jour pour donner un statut à chaque mois ;
5. la grille n'affiche que **l'année civile en cours** (`buildPeriods`), ce qui
   borne l'avance possible à décembre et rend le calcul lisible : « 3 / 4 mois
   payés » plutôt que « 6 mois d'avance ».

Le **retard**, lui, se compte toujours depuis le démarrage de la caisse et non
depuis le premier mois affiché : un mois impayé de l'année précédente reste un
retard en janvier suivant.

| Pastille | Quand |
| --- | --- |
| `N mois de retard` (rouge) | des mois passés ne sont pas couverts |
| `Mois en cours à payer` (orange) | à jour sur le passé, le mois courant reste dû |
| `3 / 4 mois payés` | à jour, l'année n'est pas encore bouclée |
| `Année couverte · +2 mois` | l'année est payée, le surplus part sur la suivante |
| `Pas encore versé` | aucun versement enregistré |

| Statut | Signification | Rendu |
| --- | --- | --- |
| `paid` | mois entièrement couvert | case verte pleine |
| `late` | mois **passé** non couvert | hachures rouges, libellé rouge, **membre en rouge dans la liste** |
| `due` | mois en cours non couvert | contour orange en pointillés |
| `upcoming` | mois futur | case grise |

Un versement partiel (5 000 Ar) remplit la case à moitié : la hauteur verte
représente toujours l'argent réellement versé, le fond de la case représente
l'échéance.

## Classement des payeurs

La carte **Top payeurs** classe les membres sur ce qu'ils ont mis dans la caisse,
**cotisations et participations ponctuelles additionnées**. La barre de chaque
ligne se lit par rapport au premier du classement, pas par rapport au total
collecté. Les trois premiers portent l'**or, l'argent et le cuivre** ; au-delà le
rang reste en gris.

**Tout le monde y figure**, y compris ceux qui n'ont rien versé : ils ferment le
classement à zéro, en gris, marqués « rien versé ». Un classement qui cache les
absents ne dit pas qui il manque. L'en-tête résume : `30 / 32 ont versé`.

Les cinq premiers sont affichés, le reste se déplie.

C'est un classement de **générosité, pas d'assiduité** : être en tête ici ne veut
pas dire être à jour de ses cotisations — pour ça, c'est la pastille de statut.

La liste de gauche suit le même ordre par défaut, avec une bascule
**Montant / A–Z** en haut. Ceux qui n'ont rien versé ferment la liste au lieu
d'en être exclus.

## Le fil des mouvements

La carte **Mouvements** contient **tous** les mouvements, du plus récent au plus
ancien — versements et dépenses mêlés. La liste **défile** dans la carte, comme
celle des membres : rien n'est tronqué, on peut remonter jusqu'au premier
versement enregistré.

Le menu en haut à droite **filtre par mois** : « Toutes les périodes », puis
chaque mois où il s'est passé quelque chose (`août 2026`, `septembre 2026`…). La
liste des mois est déduite des données, elle n'est écrite nulle part. Le compteur
suit le filtre : `12 sur 33`.

## Avatars

Chaque membre a une couleur parmi `teal`, `blue`, `violet`, `amber`, `coral`, `green`.

- si `avatarUrl` contient une URL valide, la photo est affichée ;
- sinon, les initiales sont générées automatiquement (`Jean Michel Henri` → `JM`).

Les initiales ne sont donc jamais stockées : il suffira de renseigner `avatarUrl`
quand les photos seront disponibles.

## Structure

```text
src/
├── app/
│   ├── App.tsx                  # état, routage, sélection du membre, monnaie
│   └── AdminPage.tsx            # écran de saisie #/admin
├── config/
│   ├── fund.ts                  # nom, cotisation, date de départ, taux €, annonce
│   ├── supabase.ts              # URL et clé anon, lues dans l'environnement
│   └── admin.ts                 # empreinte du mot de passe admin (mode local)
├── components/
│   ├── ActivityCard.tsx         # « Naina a payé → +60 000 Ar (+6 mois) »
│   │                            #   « Tiana a participé → +130 000 Ar · Ponctuel »
│   ├── Announcement.tsx         # bandeau « Actu »
│   ├── AppHeader.tsx
│   ├── BalanceCard.tsx          # solde + bascule Ar / €
│   ├── Card.tsx
│   ├── CurrencyToggle.tsx
│   ├── MembersSidebar.tsx       # liste de gauche, triée alphabétiquement
│   ├── MemberAvatar.tsx
│   ├── MemberName.tsx           # titre gris minuscule + prénom et nom
│   ├── AuthGate.tsx             # connexion par e-mail (mode Supabase)
│   ├── PaidMonthsCard.tsx       # mois payés du membre sélectionné
│   ├── TopPayersCard.tsx        # classement cotisations + ponctuel
│   ├── StatusPill.tsx
│   └── admin/                   # AdminGate + formulaires de saisie et de correction
├── domain/models.ts
├── services/                    # FinanceRepository, stockage local, Supabase, auth
├── styles/                      # tokens, global, layout, sidebar, fund, admin
└── utils/                       # calcul des mois, formatage, routage, accès admin
```

## Brancher Supabase

Tout le code est écrit. Il ne manque que le projet Supabase et ses deux
variables : **dès qu'elles sont définies, l'application bascule toute seule.**

| | Sans Supabase | Avec Supabase |
| --- | --- | --- |
| Données | `localStorage`, **propres à chaque appareil** | une base, **partagée par tous** |
| Contenu au départ | une caisse vide | les tables, remplies par `seed:supabase` |
| Consulter | ouvert | **ouvert** : le lien suffit, aucun compte |
| Droit d'écrire | mot de passe vérifié dans le navigateur | `app_users.is_admin`, vérifié par la base |

Le choix se fait dans [`src/services/repository.ts`](src/services/repository.ts) au
démarrage. Les composants ne savent pas laquelle des deux ils utilisent.

### 1. Créer le projet et les tables

Sur [supabase.com](https://supabase.com), créer un projet (l'offre gratuite
suffit largement pour une caisse familiale). Puis, dans **SQL Editor**, coller et
exécuter [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

Il crée les quatre tables — `members`, `contributions`, `expenses`, `eur_rates` —,
la table des comptes `app_users`, et les règles **RLS** :

- **lecture** : tout le monde, connecté ou non ;
- **écriture** : les seuls comptes dont `is_admin` vaut `true`.

> **La lecture est délibérément ouverte.** La famille reçoit un lien, l'ouvre, et
> voit la caisse — sans compte, sans mot de passe. Le revers : la clé `anon` est
> dans le code du site publié, donc n'importe qui peut interroger la base
> directement. **Les noms et les montants sont de fait publics.** Si ce n'est pas
> ce que tu veux, remplace `to anon, authenticated` par `to authenticated` dans
> la migration et remets `AuthGate` autour de `<App />` dans `main.tsx`.

### 2. Fermer les inscriptions

**Authentication → Sign In / Providers → Email**, et décocher **Allow new users
to sign up**.

Consulter la caisse ne demande aucun compte : les seuls comptes qui existent
sont ceux des **responsables**, créés à la main dans **Authentication → Users →
Add user → Send invitation**. Laisser les inscriptions ouvertes permettrait à
n'importe qui de s'en créer un — et de tenter d'écrire.

### 3. Verser les données de départ

```bash
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="…" \
npm run seed:supabase
```

Le script lit `data/fund.seed.json` et remplit les tables. **Une seule fois, sur
une base neuve** : les identifiants des versements sont engendrés par la base, le
relancer créerait des doublons.

> La clé **service role** contourne les règles RLS. Elle se trouve dans
> *Project Settings → API*, et ne doit jamais entrer dans le dépôt ni dans le
> paquet publié.

### 4. Se donner le droit d'écrire

Après la première connexion, dans **SQL Editor** :

```sql
update public.app_users set is_admin = true where email = 'ton@adresse';
```

C'est la seule chose qui ouvre l'espace de saisie. Elle se donne et se retire à
la main, table `app_users` — le responsable de la caisse n'a pas besoin d'être
celui qui gère le dépôt.

### 5. Raccorder l'application

En local, copier `.env.example` en `.env.local` :

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ…
```

Pour le site publié, les mêmes valeurs vont dans **Settings → Secrets and
variables → Actions** du dépôt GitHub, sous les mêmes noms. Le workflow les
passe à la compilation.

La clé **anon** est publique par conception : elle se retrouve dans le paquet
publié, et c'est normal. Ce qui protège les données, ce sont les règles RLS.

### Ce que ça change pour la famille

Le responsable saisit un mouvement depuis son téléphone, **tout le monde le voit
au chargement suivant** — sans rien installer, sans compte, sans mot de passe. Il
suffit d'ouvrir le lien.

Seul l'écran `#/admin` demande à se connecter, et il n'accepte que les comptes
marqués `is_admin`.

## Mise en page selon l'écran

| Écran | Disposition |
| --- | --- |
| **Ordinateur** (> 980 px) | liste des membres à gauche, solde / mois payés / mouvements à droite |
| **Tablette et téléphone** (≤ 980 px) | une seule colonne : **Argent actuel d'abord**, puis la liste des membres, puis les mois payés et les mouvements |

Sous 640 px, le bouton admin se réduit au cadenas, les formulaires passent sur une
colonne et la grille des mois passe de 12 à 6 cases par ligne (4 sous 380 px).
Une année complète tient sur une seule ligne sur ordinateur.

## Déployer sur GitHub Pages

Le workflow est déjà fourni dans `.github/workflows/deploy-pages.yml`.

1. Pousser le projet sur `main`.
2. Sur GitHub : **Settings → Pages**.
3. Choisir **GitHub Actions** comme source.

Le `base: './'` de `vite.config.ts` permet de servir le site sous
`username.github.io/nom-du-repo/`.

## Prochaines étapes conseillées

1. Compléter la liste des membres et leurs versements déjà faits.
2. Ajouter les photos des membres (`avatarUrl`).
3. Créer le projet Supabase (le code, lui, est prêt) pour partager les données
   entre téléphones et protéger réellement l'espace de saisie.
