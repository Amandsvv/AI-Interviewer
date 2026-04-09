# AI Interviewer

This project is a full-stack AI interview practice application with:

- React + Vite frontend
- Express + MongoDB backend
- Google sign-in via Firebase on the client
- Cookie-based JWT authentication on the server
- OpenRouter LLM integration for resume analysis, question generation, and answer evaluation

## Implemented Architecture

### Frontend (client)

- Framework: React 19 with Vite
- Routing: react-router-dom
- State management: Redux Toolkit
- Styling: Tailwind CSS v4 classes + custom CSS
- Animations: motion
- Charts and score widgets: recharts, react-circular-progressbar
- Report export: jspdf, jspdf-autotable
- Voice features in browser:
   - Text to speech: window.speechSynthesis
   - Speech to text: window.webkitSpeechRecognition (when supported)

Main flow in UI:

1. User opens home page and authenticates with Google.
2. User starts interview setup (role, experience, mode, optional resume PDF).
3. Resume is uploaded and analyzed (optional).
4. Backend generates 5 interview questions and deducts credits.
5. Interview runs with timer, mic/text answer input, and per-question feedback.
6. Final report is shown with metrics and downloadable PDF.
7. History page lists previous interview attempts.

### Backend (server)

- Runtime: Node.js + Express
- Database: MongoDB (Mongoose)
- Auth: JWT in httpOnly cookie
- File upload: multer (PDF upload to server/public)
- PDF parsing: pdfjs-dist
- AI service: OpenRouter chat completions via axios

Backend modules:

- config:
   - Database connection
   - JWT generation
- middlewares:
   - Auth guard reads and verifies token cookie
   - Multer upload middleware
- models:
   - User (name, email, credits)
   - Interview (metadata + embedded question documents)
- controllers:
   - Authentication
   - User profile
   - Resume analysis, question generation, answer scoring, interview finalization, history/report APIs
- services:
   - OpenRouter request helper

## Actual Data Model

### User

- name: string
- email: unique string
- credits: number (default 100)

### Interview

- userId: reference to user
- role: string
- experience: string
- mode: Technical or HR
- resumeText: string
- questions: array with fields like:
   - question
   - difficulty
   - answer
   - timeLimit
   - feedback
   - score
   - confidence
   - communication
   - correctness
- finalScore
- status
- timestamps

## API Surface (Current)

### Auth routes

- POST /api/auth/google
- GET /api/auth/logout

### User routes

- GET /api/user/me

### Interview routes

- POST /api/interview/resume
- POST /api/interview/generate-questions
- POST /api/interview/submit-answer
- POST /api/interview/finish
- GET /api/interview/get-interview
- GET /api/interview/report/:id

All user and interview routes are protected by auth middleware except Google auth/logout.

## End-to-End Request Flow

1. Client signs in with Firebase Google popup.
2. Client sends name/email to server auth API.
3. Server creates/fetches user, signs JWT, stores token in cookie.
4. Client calls protected APIs with credentials.
5. For resume analysis:
   - PDF uploaded via multipart form
   - Text extracted with pdfjs-dist
   - LLM returns structured JSON (role, experience, projects, skills)
6. For interview generation:
   - Server validates credits and interview input
   - LLM returns 5 questions
   - Server stores interview and decrements credits
7. For answer submission:
   - Server evaluates answer via LLM
   - Stores score dimensions + short feedback per question
8. On finish:
   - Server computes averages and final score
   - Returns report payload to frontend

## Project Structure

- client: frontend app
- server: backend API app

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB connection string
- OpenRouter API key
- Firebase project with Google auth enabled

### Environment files

Create environment files:

- client/.env
   - VITE_FIREBASE_KEY
   - VITE_BACKEND_URL

- server/.env
   - PORT
   - MONGODB_URI
   - JWT_SECRET
   - OPENROUTER_API_KEY
   - FRONTEND_URL (optional, defaults to http://localhost:5173)

### Run backend

From server:

- npm install
- npm run dev

### Run frontend

From client:

- npm install
- npm run dev

## What Is Not Implemented Yet

- Real payment gateway integration (pricing page is UI-only)
- Advanced server-side audio processing pipeline
- Multi-service microservice deployment
- Vector database or RAG infrastructure
- Queue-based orchestration

This README now reflects the currently implemented codebase and runtime behavior.
