# 🏀 NBA LiveScore

[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=nba-live-score)](https://nba-live-score.vercel.app/)
[![Angular](https://img.shields.io/badge/Angular-17-DD0031.svg?style=flat&logo=angular)](https://angular.io/)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4.svg?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, high-performance, real-time web application for tracking basketball matches, live scores, and team standings.

This project combines an **Angular 17** frontend with a robust **ASP.NET Core 8** backend to deliver a seamless experience, complete with a dark mode, bilingual interface (English/French), and real-time WebSockets updates.

---

## ✨ Features

- **Real-time Live Scores**: Live matches are updated instantly using WebSockets (SignalR). No manual refresh required!
- **Encoder Dashboard**: Secured features for authenticated "Encoder" accounts to manage matches, add scores, timeouts, and fouls live.
- **ESPN API Integration (Backend Proxy)**: Automatically fetches the next 7 days of NBA upcoming matches. The backend proxies and caches these requests to bypass CORS limitations and heavily optimize API calls.
- **Dynamic UI/UX**:
  - Fully responsive, mobile-first design using **Tailwind CSS**.
  - Custom "Sports" typography for that authentic scoreboard feel.
  - Micro-animations, glow effects, and a persistent Dark/Light Mode.
- **Internationalization (i18n)**: Instantly switch between English and French without reloading.
- **Legal & GDPR Compliance**: Integrated pages for Legal Notices, Privacy Policy, and Terms of Service (TOS), fully translated.
- **Performance Optimized**: Uses Angular's `ChangeDetectionStrategy.OnPush` and `trackBy` functions for buttery smooth array updates.

---

## 🛠️ Tech Stack

### Frontend (`nba_livescore.client`)
- **Framework**: Angular 17 (Standalone Components)
- **Styling**: Tailwind CSS
- **Translation**: `@ngx-translate/core`
- **Real-time**: `@microsoft/signalr`
- **Analytics**: Vercel Analytics

### Backend (`NBA_LiveScore.Server`)
- **Framework**: ASP.NET Core 8 Web API
- **Database**: Entity Framework Core (In-Memory / SQL Server)
- **Real-time**: SignalR Hubs
- **Proxy**: HTTP Client factory for external API (ESPN) consumption

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Angular CLI](https://angular.io/cli) (v17+)
- [.NET 8 SDK](https://dotnet.microsoft.com/download)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/NBA_LiveScore.git
cd NBA_LiveScore
```

### 2. Setup the Backend (.NET)
```bash
cd NBA_LiveScore.Server
dotnet restore
dotnet run
```
The API will run on `http://localhost:61961` (or the port specified in `launchSettings.json`).

### 3. Setup the Frontend (Angular)
```bash
cd ../nba_livescore.client
npm install
npm start
```
The frontend proxy is configured to automatically route `/api` and `/NBAHub` to the local backend. Access the app at `https://localhost:61961/` or `http://localhost:4200/` depending on your CLI settings.

---

## 📝 Architecture & Deployment

- **State Management**: The application makes heavy use of **RxJS** for state management and reactive data flows.
- **ESPN Proxy**: Due to ESPN's API throwing CORS and 400 Bad Request errors on date ranges directly from the browser, the backend actively pulls the API's calendar, parallelizes requests for the next 7 days, and serves it as a clean merged JSON object to the frontend.
- **Deployment**: 
  - Frontend is optimized for [Vercel](https://vercel.com/) (Set Root Directory to `nba_livescore.client`).
  - Backend is optimized for hosting on platforms like [Render](https://render.com/).

## 📄 License
This project is licensed under the MIT License.
