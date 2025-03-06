# Undercover Word Game

A multiplayer word game where players try to identify who has a different word.

## Project Structure

This project is organized into two main directories:

- `client`: React frontend built with Vite
- `server`: Express.js backend with Socket.io for real-time communication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   ```

2. Install dependencies for both client and server

   ```
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

### Running the Application

1. Start the server
   ```
   cd server
   npm run dev
   ```

2. Start the client
   ```
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Features

- Online multiplayer gameplay
- Offline mode for local play
- Real-time chat
- Role-based gameplay (Civilian, Undercover, Mr. White)
- Voting system
- Game history and statistics

## Technologies Used

- **Frontend**: React, Vite, TailwindCSS, React Router
- **Backend**: Express.js, Socket.io
- **Styling**: TailwindCSS, Shadcn UI components 