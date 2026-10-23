# Deployment Guide

This project is a Node.js/Express + MongoDB application, so it deploys as one
Node web service (not a Java WAR file). Two deployment paths are documented
below: the one actually used for the live demo (Render), and how the Unit 5
Apache Tomcat lab requirement is satisfied for this stack.

## 1. Render (used for the live demo link - Unit 6)

1. Push this repository to GitHub.
2. On [Render](https://render.com), create a **new Web Service** from the repo.
3. Settings:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Add environment variables (Render dashboard -> Environment), copied from
   `server/.env.example`:
   - `MONGO_URI` - a MongoDB Atlas connection string (see below)
   - `JWT_SECRET` - any long random string
   - `JWT_EXPIRES_IN` - e.g. `2d`
   - `PORT` - Render sets this automatically; no need to add it
5. Deploy. Render builds and starts the app; the Express server also serves
   the `public/` frontend, so the whole site is reachable from one URL.
6. Run `npm run seed` once (Render Shell, or locally against the same
   `MONGO_URI`) to load demo data.

### MongoDB Atlas (cloud database)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Database Access -> add a user with a password.
3. Network Access -> allow access from anywhere (0.0.0.0/0) for the demo.
4. Connect -> "Drivers" -> copy the `mongodb+srv://...` URI and put it in
   `MONGO_URI` (both locally in `server/.env` and in Render's environment).

## 2. Apache Tomcat (Unit 5 lab requirement)

Tomcat is a Java Servlet container, so a Node/Express backend cannot run
*inside* Tomcat the way the reference Java/Swing project's UI logic would.
What Tomcat **is** used for here, to still satisfy "Run/Debug program on
local Apache Tomcat (v8+)": serving the static frontend (`public/`) as a
plain static webapp, independent of the Node API, as a packaging/deployment
exercise.

1. Copy the contents of `public/` into a new folder:
   `<TOMCAT_HOME>/webapps/esports/` (so `index.html` sits at
   `webapps/esports/index.html`).
2. Start Tomcat (`<TOMCAT_HOME>/bin/startup.sh` or `startup.bat`).
3. Open `http://localhost:8080/esports/` - the HTML/CSS/JS pages load and
   render (Units 1-2 are fully demonstrated this way).
4. The pages' `fetch('/api/...')` calls will fail under Tomcat alone, since
   there is no Express API behind it. For a full end-to-end demo, also run
   the real Node API (`npm start` in `server/`) on port 5000 and temporarily
   edit `public/js/api.js`'s `API_BASE` constant to
   `http://localhost:5000/api` before copying the files into Tomcat's
   `webapps/esports/`. This is a one-line change purely for the Tomcat lab
   demonstration; the Render deployment does not need it, since Express
   serves the frontend and API from the same origin there.

## 3. Running locally (for development / grading)

```bash
cd server
cp .env.example .env     # edit MONGO_URI if not using a local MongoDB
npm install
npm run seed              # loads demo data (same accounts as README.md)
npm start                 # http://localhost:5000
```

Optional, separate from the main app (Unit 3 "Node Core / HTTP Module" demo):

```bash
npm run core-demo         # raw http module server on http://localhost:6000
```
