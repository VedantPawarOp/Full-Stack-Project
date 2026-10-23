# Esports Tournament Manager - Full Stack Mini Project

A full-stack web app for running esports tournaments: teams, players, brackets,
match results, player K/D/A stats and leaderboards. Same domain as the
reference Java + MySQL desktop project, rebuilt end-to-end with the
**HTML/CSS/JavaScript + Node.js/Express + MongoDB** stack taught in this
course (Course Code F0002), covering Units 1-5 of the syllabus.

| Unit | Syllabus topic | Where it is in this project |
|---|---|---|
| 1 | HTML5 structure, semantic elements, forms, validation | `public/*.html` (header/nav/section/footer/article, `<form>` with `required`, `type=email`, `minlength`) |
| 2 | CSS selectors, box model, Flexbox, Grid, responsive/media queries | `public/css/styles.css` |
| 3 | Advanced JS, DOM, RegExp, secure validation/sanitization; Node core (HTTP, fs, URL, events); file upload; email automation | `public/js/validation.js`, `public/js/*.js`; `server/node-core-demo/httpServer.js`; `server/middleware/upload.js`; `server/utils/matchEvents.js`; `server/utils/emailAutomation.js` |
| 4 | MongoDB setup, CRUD, data modeling, relationships, aggregation, Atlas | `server/models/*.js`, `server/controllers/*.js`, `server/controllers/leaderboardController.js` (aggregation pipelines) |
| 5 | Git, Jenkins, Apache Tomcat | this repo + `Jenkinsfile` + `DEPLOYMENT.md` (Tomcat section) |
| 6 | Auth, env vars, deployment, Render | `server/middleware/auth.js`, `server/.env.example`, `DEPLOYMENT.md` |

## 1. Project structure

```
esports-fullstack/
├── server/                     Node.js + Express API
│   ├── config/db.js            MongoDB connection
│   ├── models/                 Mongoose schemas (User, Game, Developer, Venue, Team, Tournament, Match)
│   ├── controllers/            business logic (auth, teams, tournaments, matches, leaderboard, admin, search, catalog)
│   ├── routes/                 Express route definitions
│   ├── middleware/              auth.js (JWT), upload.js (multer/fs)
│   ├── node-core-demo/         raw http/url/fs module demo server (Unit 3)
│   ├── utils/                  seed.js, selftest.js, matchEvents.js (EventEmitter), emailAutomation.js
│   ├── .env.example
│   └── package.json
├── public/                     static frontend (served by Express)
│   ├── index.html              login / register
│   ├── dashboard.html, teams.html, tournaments.html, matches.html,
│   │   leaderboard.html, search.html, admin.html
│   ├── css/styles.css
│   └── js/                     api.js, validation.js, nav.js, + one file per page
├── Jenkinsfile                 Unit 5 CI pipeline
├── DEPLOYMENT.md                Render + Apache Tomcat instructions
├── postman_collection.json     import into Postman to test every endpoint
└── .gitignore
```

## 2. How the features map onto the reference (Java/MySQL) project

| Reference project (Java Swing + MySQL) | This project (Node/Express + MongoDB) |
|---|---|
| `app_user` + `player`/`organizer`/`viewer` tables | single `User` collection with role-specific optional fields |
| `team`, `team_player` tables | `Team` collection + `User.team` reference |
| `tournament`, `tournament_registration` tables | `Tournament` collection with an embedded `registrations[]` array |
| `matches` table with bracket pointers | `Match` collection with `nextMatch`/`nextSlot` pointers |
| `match_player_stat` table | embedded `playerStats[]` array on each `Match` |
| SQL views / `fn_team_points`, `fn_player_kd` | MongoDB **aggregation pipelines** in `leaderboardController.js` |
| `BracketPlan.java` (double elimination) | `tournamentController.js` `startAndGenerateBracket` (single elimination - simplified on purpose, same bracket-pointer idea) |
| Triggers (one captain, roster lock, status flow) | plain JS checks in the controllers (e.g. `setCaptain`, `recordResult`) |
| Swing `LoginFrame`, `*Panel.java` screens | `public/*.html` + `public/js/*.js` pages |
| `05_queries.sql` (SELECT/WHERE/LIKE/joins) | `searchController.js` (`$regex`, `$or`, population = joins) |

## 3. Running it locally

Requirements: Node.js 18+, a MongoDB server (local, or Atlas - see `DEPLOYMENT.md`).

```bash
cd server
cp .env.example .env        # edit MONGO_URI if needed
npm install
npm run seed                 # loads demo data (see accounts below)
npm start                    # -> http://localhost:5000
```

Open `http://localhost:5000` in a browser.

### Demo accounts (password for all: `Pass@123`)
| Role | Email |
|---|---|
| Administrator | admin@esportsdb.edu |
| Organizer | rahul.bose@example.com (Skyline Esports) |
| Player | aarav.deshmukh@example.com (captain, Pune Phoenix) |
| Viewer | amit.jain@example.com |

New users can also self-register (Player / Organizer / Viewer) from the login page.

### Live demo story
1. Log in as the **Organizer** -> **Tournaments** -> open "Valorant Winter
   Championship" (already has 2 teams registered from the seed data).
2. **Open registration** if still in DRAFT, register another team or two from
   **Teams**, then **Close registration**.
3. **Start & generate bracket** - the app builds a single-elimination bracket
   automatically (with byes if the team count isn't a power of two).
4. Go to **Matches**, pick the tournament, **Start match** on a round-1 match,
   then **Record result** (enter the score) - the winner is advanced into the
   next round automatically.
5. **Leaderboard** -> pick the tournament to see team standings, and check the
   player K/D ranking below it.
6. **Search** -> filter players / teams / tournaments / matches.
7. Log in as **Administrator** -> **Admin** tab -> manage users, add
   games/developers/venues, and browse raw collections.

### Node core-module demo (separate from the main app, Unit 3)
```bash
npm run core-demo            # -> http://localhost:6000
```
Try `/`, `/games` (reads a JSON file with `fs`) and `/echo?name=Pune` (parses
the query string with the `url` module) - built with **only** Node's `http`,
`fs` and `url` core modules, no Express, to show the raw HTTP server concept
separately from the Express API.

### Automated check (used by Jenkins, see `Jenkinsfile`)
```bash
npm test
```

## 4. Testing the API with Postman

Import `postman_collection.json` into Postman. Run **Auth -> Login (Admin)**
or **Login (Organizer)** first - the request's test script automatically
saves the JWT into the collection's `{{token}}` variable, which every other
protected request reuses via its `Authorization: Bearer {{token}}` header.

## 5. Git & deployment

See `DEPLOYMENT.md` for:
- Initializing the Git repository and a sample commit history
- Deploying to Render (used for the live demo link)
- Satisfying the Apache Tomcat lab requirement for this stack
- Setting up MongoDB Atlas

## 6. Submission checklist
- [ ] Project code zipped as one file (this whole `esports-fullstack/` folder)
- [ ] Pushed to a Git repository, link included in the submission form
- [ ] `npm run seed` run once against the grading database (or Atlas) before demo
- [ ] Demo walkthrough rehearsed (see "Live demo story" above)
