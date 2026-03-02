# AI Interview Taker

This repository contains the architecture and scaffolding for a production-grade AI-powered interview platform. The system is designed using a layered architecture inspired by FAANG-style systems and focusses on scalability, real-time performance, and personalization.

## 🧠 System Architecture Overview

```
┌─────────────────────────────┐
│        Frontend App         │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│        API Gateway           │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│   Interview Orchestrator     │
└──────────────┬──────────────┘
               ↓
┌────────────────────────────────────────┐
│ AI Services + Evaluation + RAG Engine  │
└──────────────┬─────────────────────────┘
               ↓
┌─────────────────────────────┐
│ Databases + Analytics Layer │
└──────────────┬──────────────┘
``` 

## Layers and Responsibilities

### 1. Frontend Layer
- **Tech:** Next.js (React) with Tailwind CSS, WebRTC for real-time audio/video.
- **Features:** Video interview UI, chat interactions, resume upload, live transcription, feedback dashboard, mic/webcam capture, streaming AI responses.

### 2. API Gateway Layer
- **Tech:** FastAPI (Python).
- **Responsibilities:** Authentication (JWT), rate limiting, request routing, session management.
- Routes user requests to the Interview Service.

### 3. Interview Orchestrator
- **Core service** controlling interview flow.
- Implements a state machine: `INIT → QUESTION → LISTEN → ANALYZE → FOLLOWUP → SCORE → NEXT`.
- Stores interview state: round, difficulty, past answers, detected weaknesses.

### 4. AI Intelligence Layer
Microservices include:

- **Resume Intelligence Service:** Extracts text from PDF, performs skill extraction, builds embeddings, stores in vector DB.
- **Question Generation Engine (RAG):** Combines resume, job role, round to retrieve relevant questions via vector search and LLM.
- **Speech Processing Service:** Transcribes audio with Whisper, analyzes transcripts for fillers, pauses, confidence.
- **Evaluation Engine:** Scores answers on clarity, correctness, structure, confidence; outputs JSON rubric.
- **Feedback Generator:** Converts scores into coaching advice and improved answer suggestions.

### 5. Data Layer
A polyglot persistence strategy:
- **PostgreSQL** for structured data (users, interviews, scores, history).
- **Vector DB** (Pinecone/Weaviate/Chroma) for embeddings, past answers, question bank.
- **Analytics DB** for performance trends and metrics.

## Real-Time Interview Flow

```
User speaks
   ↓
Audio Stream
   ↓
Speech-to-text
   ↓
Transcript
   ↓
Evaluation Engine
   ↓
Score Update
   ↓
AI Generates Next Question
   ↓
Voice Response
``` 

Latency target: < 2 seconds.

## AI Memory System
Supports short-term (current interview), long-term (user weaknesses), and semantic memory (skill profile). Past interviews influence question selection to act as a personal coach.

## Scalability Strategy
- Use queues (Redis/Kafka) to decouple requests from AI workers.
- Individual workers for question generation, evaluation, feedback.
- Horizontal scaling via containerized GPU workers.

## Deployment
- **Frontend:** Vercel.
- **Backend & Workers:** Docker on AWS/GCP with GPU instances for AI.
- **Databases:** Managed cloud services.

## Security
- JWT authentication, encrypted resumes, consent for recordings, RBAC.

## Tech Stack Justification
| Layer     | Tech         | Why                |
|-----------|--------------|--------------------|
| Frontend  | Next.js      | SSR + realtime UI  |
| Backend   | FastAPI      | async, Python AI   |
| LLM       | OpenAI/Llama | reasoning capabilities |
| STT       | Whisper      | accurate speech    |
| Vector DB | Pinecone     | semantic retrieval |
| Cache     | Redis        | low latency        |
| Queue     | Kafka/RQ     | scaling            |
| Deploy    | Docker       | portability        |


## Next Steps
1. Scaffold frontend and backend projects.
2. Implement state machine for orchestrator.
3. Set up vector database and resume parsing service.
4. Build AI microservices with LLM prompts and rubrics.
5. Establish CI/CD pipelines and containerization.

---

> "We designed an orchestrator-based AI system where interview flow is controlled by a state machine, supported by RAG-driven question generation and rubric-based evaluation. The system uses vector memory to personalize interviews over time."

This README serves as the foundation you can reference in interviews, hackathons, or investor pitches.
