# Ludo Arena 🎲

**Ludo Arena** is a sophisticated, real-time 1v1 board game built for the modern web. It combines premium "Anti-Slop" design principles with a tactical dividend economy and immersive spatial orientation.

![Ludo Arena Preview](https://images.unsplash.com/photo-1611996591269-42318f97a1fd?q=80&w=2070&auto=format&fit=crop)

## ✨ Core Features

- **Multi-Game Support**: Choose between high-stakes **Ludo**, **Checkers**, and **Callbreak** from a single unified lobby.
- **Personalized Viewpoint**: Our **Mirror-Orientation System** ensures you always occupy the prime seat, regardless of your assigned color or seat number.
- **Tactical Dividends**: Earn immediate rewards for aggressive gameplay (captures, goals, and successful calls).
- **Professional Arenas**:
  - **Ludo**: Smooth 0.8s board rotations with tactical path projections.
  - **Callbreak**: A 3D-inspired oval table with glowing HUDs, realistic bot names, and smooth card fan physics.
- **Provably Fair**: All shuffles and dice rolls are backed by SHA-256 commitment schemes, ensuring total transparency.
- **Tactical Bots**: Adaptive AI opponents with human-like naming conventions (Aria, Soren, Mira, etc.) to ensure instant matchmaking.

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
