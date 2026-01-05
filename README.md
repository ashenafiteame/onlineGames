# 🕹️ Online Game Studio

A full-stack arcade platform featuring a **React** frontend and **Spring Boot** backend. Users can create accounts, play games, earn experience (XP), level up, and compete for high scores.

## 🚀 Features

-   **Authentication**: Secure Signup and Login system using Spring Security.
-   **User Progression**:
    -   **XP System**: Earn XP based on game performance.
    -   **Leveling**: Level up every 1000 XP.
    -   **Stats**: Persistent high scores for each game.
-   **Social Features**:
    -   **Friends System**: Add/Remove friends and view their status.
    -   **Activity Feed**: See what your friends are playing.
    -   **Leaderboards**: Global rankings for every game.
-   **Game Library UI Enhancements**:
    -   **Dynamic Categorization**: Games are automatically sorted into **Multiplayer** and **Solo** sections.
    -   **Library Filtering**: A sleek menu bar allows you to filter the library by **All**, **Multiplayer**, or **Solo** games.
    -   **Recently Played**: A horizontal scrolling section at the top shows your last 5 played games with "time ago" timestamps for quick resumption.
-   **🎮 Multiplayer & Dual-Mode Games**:
    -   *These games support both local **Solo** play against AI and **Online** play via a real-time lobby system.*
    -   **Uno**: Classic card matching vs 3 Bots or online friends.
    -   **Checkers**: Classic board game logic.
    -   **Chess**: Standard chess against AI or human opponents.
    -   **Tic-Tac-Toe**: Classic 3x3 grid matching.
    -   **Connect Four**: Drop discs to connect 4 in a row.
-   **🎯 Solo Arcade & Puzzles**:
    -   **🧠 Memory Match**: Test your memory by finding card pairs.
    -   **🔢 Guess the Number**: Logic puzzle to find the hidden number.
    -   **🐍 Snake**: Classic arcade snake game.
    -   **🎈 Balloon Popper**: Fast-paced reaction clicker.
    -   **🏎️ Lane Racer**: Highway traffic dodging game.
    -   **🏍️ Moto Racer**: High-speed motorbike racing with smooth steering.
    -   **🧩 Puzzles**: 2048, Sudoku, Tetris, Minesweeper, Reversi, Battleship.
    -   **⚡ Quick Play**: Whack-a-Mole, Flappy Bird, Brick Breaker.
    -   **🃏 Casino**: Blackjack, Solitaire.
-   **Tech Stack**:
    -   **Backend**: Spring Boot 3 (Java 21), Spring Data JPA, WebSockets for Multiplayer.
    -   **Database**: PostgreSQL 15 (Dockerized).
    -   **Frontend**: React + Vite with premium dark-mode styling and glassmorphism UI.

## 📋 Prerequisites

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## 🛠️ How to Play

1.  **Start the Studio**:
    ```bash
    docker-compose up --build
    ```
    *Wait for all 3 containers (db, backend, frontend) to start.*

2.  **Access the App**:
    -   Open via Browser: [http://localhost:5173](http://localhost:5173)

3.  **Gameplay**:
    -   **Sign Up**: Create a username/password.
    -   **Select a Game**: Choose from the library.
    -   **Play**: Follow the on-screen instructions.
    -   **Win**: Your scores are automatically submitted. Check the menu bar to see your Level increase!

## 📁 Project Structure

```
/Users/ashenafi/antiGravityProjects/
├── backend/                # Spring Boot App (API, Auth, Game Logic)
├── frontend/               # React App (UI, Game Components)
└── docker-compose.yml      # Orchestration
```
