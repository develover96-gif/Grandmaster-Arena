# Product Requirements Document (PRD) - Ludo Arena

## 1. Vision & Executive Summary
**Ludo Arena** is a premium, high-stakes digital adaptation of the classic Ludo board game. It focuses on tactical precision, immersive spatial awareness, and a rewarding "Skill-to-Dividend" economy. Unlike generic board games, Ludo Arena prioritizes a "Tabletop First" philosophy, ensuring every player feels they are in the primary seat through dynamic board mirroring and high-fidelity visual feedback.

## 2. Core Archetypes & Goals
- **The Competitive Player**: Seeks low-latency, fair gameplay with tangible rewards for aggressive tactics.
- **The Casual Enthusiast**: Desires a polished, visually "expensive" interface with intuitive controls and personalization.
- **Goal**: To provide the most immersive 1v1 Ludo experience on the web, blending classic rules with modern economic incentives.

## 3. Functional Requirements

### 3.1 Gameplay Mechanics
- **Ludo Logic**: 1v1 match (Pink vs Cyan) with 4 tokens each.
- **Callbreak Logic**: 4-player trick-taking game. Spades are permanent trumps. 5 deals per match.
- **Dynamic Mirroring**:
  - **Ludo**: Board rotates 180° based on the player's assigned color.
  - **Callbreak**: Table layout always centers the user at the bottom (South) seat for intuitive control.
- **Turn Forfeiture**: A 30-second turn timer. Failing to move results in a turn skip (Ludo) or auto-play (Callbreak).
- **Bot Integration**: Automated tactical engine with realistic naming conventions and adaptive skill levels.

### 3.2 Tactical Reward System (Dividends)
- **Stake Mechanics**: Matches are played with a defined "Stake."
- **Ludo Dividends**:
  - **Capture Bonus**: Capturing an opponent's token yields an immediate **10% Dividend**.
  - **Goal Bonus**: Moving a token "Home" yields an immediate **10% Dividend**.
- **Callbreak Dividends**:
  - **Success Bonus**: Meeting or exceeding a call yields a performance-based dividend.
  - **Trick Mastery**: Winning a trick with a low-rank trump or over-trumping an opponent triggers high-fidelity feedback.

### 3.3 Visuals & Personalization
- **High-Fidelity UI**: 
  - **Ludo**: Tactile board with precision-mode rotation.
  - **Callbreak**: 3D-feel oval table with glowing HUDs and fanned card hands.
- **Token/Card Styles**: Multiple visual identifies including **Classic**, **Neon**, and **Metallic**.
- **Dynamic Transitions**: 0.8s - 1.0s cubic-bezier transitions for all spatial actions to provide context and reduce jarring state changes.

### 3.4 Safety & Integrity
- **Exit Confirmation**: Prevent accidental leaves during active matches via a modal dialog.
- **Server-Authoritative**: All dice rolls, movements, and dividend calculations are handled server-side to prevent cheating.

## 4. Design Philosophy (Anti-Slop)
- **Flatten Depth**: Minimal use of nested cards. Reliance on typography and whitespace.
- **Mathematical Scaling**: 0.8s transition durations for all spatial actions.
- **Neutral Palette**: Sophisticated dark/neutral theme with HSB-saturated accents (<5% saturation for neutrals).
- **Legibility**: High-contrast ratios (WCAG AA compliant) even in "Neon" mode.

## 5. Technical Architecture
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Real-time**: Socket.io for bidirectional game state synchronization.
- **Particles**: `canvas-confetti` for high-performance visual rewards.
- **State Management**: Server-authoritative JSON state tree mirrored to clients.

## 6. Future Roadmap
- **Tournament Mode**: Bracket-style elimination matches.
- **Custom Arenas**: Unlockable board skins and audio packs.
- **Social Integration**: Global leaderboards based on total dividends earned.
