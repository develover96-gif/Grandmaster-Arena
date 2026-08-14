# Ludo Arena 🎲

**Ludo Arena** is a sophisticated, real-time 1v1 board game built for the modern web. It combines premium "Anti-Slop" design principles with a tactical dividend economy and immersive spatial orientation.

![Ludo Arena Preview](https://images.unsplash.com/photo-1611996591269-42318f97a1fd?q=80&w=2070&auto=format&fit=crop)

## ✨ Core Features

- **Personalized Viewpoint**: Our **Mirror-Orientation System** automatically rotates the board so you are always in the "Home" seat.
- **Dividend Economy**: Earn a **10% Stake Bonus** every time you capture a token or reach the home goal.
- **Tactical Visuals**:
  - **Timer Alerts**: Progress bar pulses red when you have less than 10 seconds remaining.
  - **Particle Celebrations**: High-energy confetti and sparks powered by `canvas-confetti`.
  - **Token Styles**: Choose between **Classic**, **Neon**, and **Metallic** visual identities.
- **Fair Play**: Server-authoritative logic ensures every dice roll and move is synchronized and secure.
- **Tactical Bot**: Integrated engine for solo play and training.

## 🚀 Technical Stack

- **Framework**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Visuals**: [Lucide React](https://lucide.dev/) (Icons) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Backend**: [Node.js](https://nodejs.org/) / [Express](https://expressjs.com/)

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🎮 How to Play

1. **Join the Arena**: Enter the matchmaking lobby and select your stake.
2. **Roll the Dice**: Click the active player badge to roll. You need a **6** to move a token out of the yard.
3. **Move Tactically**: Click a movable token to advance. 
4. **Win Dividends**: Capturing opponents or reaching home adds to your match dividend balance.
5. **Goal**: Get all 4 tokens to the center to win the match.

## 🎨 Design Philosophy
This project adheres to the **"Anti-Slop" UI Manifesto**:
- **No generic gradients**: Sophisticated neutral tones with purposeful accents.
- **Perfect Spacing**: Mathematical padding and nested border-radius logic (`Inner = Outer - Padding`).
- **Typography First**: Paired display and body fonts for clear information hierarchy.

---
*Built with precision in the Ludo Arena.*
