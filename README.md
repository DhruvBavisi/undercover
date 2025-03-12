# Code - Undercover Word Game

## Project Overview
This is a real-time multiplayer word game built with React, Express, and Socket.io. The game allows players to join rooms, guess words, and interact in real-time.

## Project Structure

This project is organized into two main directories:

- `client`: React frontend built with Vite
- `server`: Express.js backend with Socket.io for real-time communication

## Setup Instructions
1. Clone the repository.
2. Navigate to the `server` directory and run `npm install`.
3. Navigate to the `client` directory and run `npm install`.
4. Create `.env` files in both `server` and `client` directories using the provided `.env.example` files.

## Environment Variables
### Server
- `MONGODB_URI`: MongoDB connection string.
- `PORT`: Server port (default: 3001).

### Client
- `VITE_API_URL`: API URL for local development.
- `VITE_SOCKET_URL`: Socket URL for local development.
- `VITE_VERCEL_URL`: Vercel deployment URL.

## Deployment
1. Deploy the server to Vercel.
2. Deploy the client to Vercel.
3. Ensure environment variables are set in the Vercel dashboard.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

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