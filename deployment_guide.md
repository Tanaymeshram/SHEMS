# 🌐 Deployment Guide - Smart Hospital Energy Management System (SHEMS)

This guide outlines two ways to deploy your full-stack React + Flask + MySQL application:
1. **Ngrok (Instant Public URL)**: Best for live demonstrations/vivas.
2. **Render (24/7 Cloud Hosting)**: Best for permanent public hosting.

---

## ⚡ Method 1: Ngrok (लोकल टनलिंग - Best for Live Demos)

If you just want your evaluator or friends to open your project from their phone or laptop anywhere in the world, you don't need complex cloud hosting. You can use **Ngrok** to create a secure public tunnel to your `localhost:5000`.

### Step-by-Step:
1. Make sure your unified server is running locally on port 5000 (`python app.py`).
2. Download and install [Ngrok](https://ngrok.com/download).
3. Open your terminal/command prompt and run:
   ```bash
   ngrok http 5000
   ```
4. Ngrok will generate a secure public link like:
   `https://a1b2-34-56-78.ngrok-free.app`
5. Open this URL in any browser (mobile, tablet, or external PC). It will serve your complete frontend and backend directly from your local machine!

---

## ☁️ Method 2: Render.com (24/7 Cloud Deployment)

Since your project is configured for **Unified Single-URL Hosting**, deploying it on the cloud is extremely simple! We only need to deploy the Flask backend—it will automatically serve the React compiled frontend from the `frontend/dist` folder!

### Step 1: Create a Cloud MySQL Database
Since your local MySQL server is on `localhost`, you need a cloud-hosted MySQL database.
1. Sign up for a free account on [Aiven.io](https://aiven.io/) or [Railway.app](https://railway.app/).
2. Create a new **MySQL Database**.
3. Note down the Connection URI (Host, Port, User, Password, Database Name).

### Step 2: Configure Environment Variables
On your cloud hosting provider (Render), configure the following environment variables under settings:
* `DB_TYPE` = `mysql`
* `MYSQL_HOST` = `[your-cloud-db-host]`
* `MYSQL_USER` = `[your-cloud-db-username]`
* `MYSQL_PASSWORD` = `[your-cloud-db-password]`
* `MYSQL_DB` = `smart_hospital_energy`
* `FLASK_PORT` = `10000` (Render's default port)
* `FLASK_DEBUG` = `False`

### Step 3: Deploy on Render
1. Go to [Render.com](https://render.com/) and log in using your GitHub account.
2. Click **New +** ➔ **Web Service**.
3. Select your repository `SHEMS`.
4. Configure the Web Service settings:
   * **Name**: `smart-hospital-energy`
   * **Runtime**: `Python`
   * **Build Command**:
     ```bash
     pip install -r backend/requirements.txt && npm --prefix frontend install && npm --prefix frontend run build
     ```
     *(This installs backend dependencies, installs frontend dependencies, and builds the React app into the static folder before startup).*
   * **Start Command**:
     ```bash
     cd backend && python app.py
     ```
5. Click **Deploy Web Service**. Render will build and deploy your project on a single URL (e.g. `https://smart-hospital-energy.onrender.com`).
