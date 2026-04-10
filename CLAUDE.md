# Study Abroad Buddy — project context

## What this project is
MERN stack web app. Students going abroad use it to get visa, health, culture, housing info and chat with an AI assistant personalised to their destination.

## Stack
- React + Vite + Tailwind + React Router v6 + Axios (frontend)
- Node.js + Express (backend, port 5000)
- MongoDB Atlas + Mongoose
- ChromaDB running locally (port 8000)
- OpenAI API (gpt-4o, gpt-4o-mini, text-embedding-3-small)
- JWT + bcrypt for auth

## Folder structure
study-abroad-buddy/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── agents/
│   ├── router/
│   ├── middleware/
│   └── scripts/
├── CLAUDE.md
├── .env (server)
└── .env (client)

## MongoDB models
- User: name, email, password, homeCountry, destinationCountry, destinationCity, university, travelStartDate, travelEndDate, onboardingComplete, checklist[]
- ChatHistory: userId, role (user|bot), message, intent, createdAt

## Environment variables needed
Server: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, CHROMA_URL=http://localhost:8000
Client: VITE_API_URL=http://localhost:5000

## Naming conventions
- React components: PascalCase (VisaPage.jsx)
- API routes: kebab-case (/api/chat/history)
- JS functions: camelCase (classifyIntent)
- MongoDB collections: camelCase plural (chatHistories)

## Do not
- Use TypeScript
- Use .then() — always async/await
- Use var — always const/let
- Use LangChain
- Add Redis