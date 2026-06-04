# do.it — Task Manager with Clerk Auth

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Clerk
1. Go to https://clerk.com and create a free account
2. Create a new application
3. Copy your **Publishable Key** from the dashboard (API Keys section)
4. Create a `.env` file in the project root:

```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. Run the app
```bash
npm start
```

## Features
- 🔐 Clerk authentication (email, Google, GitHub, etc.)
- 👤 Per-user data isolation — each user's tasks stored separately
- 📅 Weekly task grid (Mon–Sun) with progress bars
- ✅ Add, edit, delete, and complete tasks
- 📊 Dashboard with stats (total, completed, streak, today %)
- 🔥 LeetCode-style yearly heatmap with hover tooltips
- 💾 Persistent localStorage (keyed by Clerk user ID)

## File Structure
```
src/
  App.js       — All React components + auth logic
  index.css    — Styles
  index.js     — Entry point with ClerkProvider
public/
  index.html   — HTML shell
.env.example   — Environment variable template
```
