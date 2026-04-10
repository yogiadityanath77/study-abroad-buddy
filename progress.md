# Study Abroad Buddy — Week 1 Progress

## Project
Study Abroad Buddy — MERN stack web app with multi-agent AI chatbot for students going abroad. Students use it to get personalised visa, health, culture, and housing info based on their home country and destination, and chat with an AI assistant that routes their questions to the correct specialist agent.

---

## Stack

### Backend
- **Node.js** — runtime
- **Express** — web framework, port 5000
- **Mongoose** — MongoDB ODM
- **MongoDB Atlas** — cloud database (free M0 tier, region: ap-south-1 Mumbai)
- **bcryptjs** — password hashing (NOT bcrypt — bcryptjs is pure JS, no native build issues on Windows)
- **jsonwebtoken** — JWT creation and verification
- **dotenv** — loads .env variables
- **cors** — allows requests from React frontend

### Frontend
- **React 18** — UI library
- **Vite 8** — build tool and dev server, port 5173
- **Tailwind CSS v3** — styling (v3 specifically, NOT v4 — different config)
- **PostCSS + Autoprefixer** — required by Tailwind v3
- **React Router v6** — client-side routing
- **Axios** — HTTP client

### AI (not yet wired up — Week 3)
- **OpenAI API** — gpt-4o for agents, gpt-4o-mini for intent classifier, text-embedding-3-small for embeddings
- **ChromaDB** — local vector database, port 8000

### Auth
- JWT stored in localStorage
- bcryptjs for password hashing with salt rounds: 10
- Token expiry: 7 days

---

## Status
Week 1 complete. Starting Week 2.

---

## Complete folder and file structure

```
study-abroad-buddy/
├── CLAUDE.md                          — project context and conventions
│
├── server/
│   ├── server.js                      — Express entry point; connects MongoDB, mounts all routes
│   ├── package.json                   — server dependencies
│   ├── .env                           — server environment variables
│   │
│   ├── config/
│   │   ├── db.js                      — connectDB() function; connects Mongoose to MONGODB_URI
│   │   ├── chromaClient.js            — (empty placeholder) ChromaDB client — Week 3
│   │   └── openaiClient.js            — (empty placeholder) OpenAI client — Week 3
│   │
│   ├── models/
│   │   ├── User.js                    — Mongoose schema for users
│   │   └── ChatHistory.js             — Mongoose schema for chat messages
│   │
│   ├── middleware/
│   │   └── authMiddleware.js          — protect() — verifies JWT, attaches user to req
│   │
│   ├── routes/
│   │   ├── authRoutes.js              — POST /api/auth/register, POST /api/auth/login
│   │   ├── userRoutes.js              — GET/PATCH /api/user/profile, PATCH /api/user/checklist
│   │   ├── chatRoutes.js              — GET /api/chat/history, POST /api/chat/message
│   │   └── guideRoutes.js             — GET /api/guide/:type
│   │
│   ├── controllers/
│   │   ├── authController.js          — register(), login(), generateToken()
│   │   ├── userController.js          — getProfile(), updateProfile(), updateChecklist()
│   │   ├── chatController.js          — getHistory(), sendMessage()
│   │   └── guideController.js         — getGuide()
│   │
│   ├── agents/                        — (empty folders) — Week 3
│   │   ├── visaAgent.js
│   │   ├── healthAgent.js
│   │   ├── cultureAgent.js
│   │   ├── housingAgent.js
│   │   └── generalAgent.js
│   │
│   ├── router/                        — (empty folders) — Week 3
│   │   ├── intentClassifier.js
│   │   └── agentRouter.js
│   │
│   ├── utils/                         — (empty folders) — Week 3
│   │   ├── embedder.js
│   │   └── ragQuery.js
│   │
│   ├── scripts/                       — (empty folders) — Week 3
│   │   ├── ingest.js
│   │   ├── testAgents.js
│   │   └── testClassifier.js
│   │
│   └── data/                          — (empty folders) — Week 3
│       ├── visa/
│       ├── health/
│       └── culture/
│
└── client/
    ├── package.json                   — client dependencies
    ├── vite.config.js                 — Vite config with React plugin
    ├── tailwind.config.js             — Tailwind content paths
    ├── postcss.config.js              — PostCSS config for Tailwind
    ├── .env                           — VITE_API_URL
    ├── index.html                     — HTML entry point, mounts #root
    │
    └── src/
        ├── main.jsx                   — React entry; renders <App> in StrictMode
        ├── App.jsx                    — All 11 routes wired with React Router v6
        ├── index.css                  — Tailwind directives only
        │
        ├── context/
        │   └── AuthContext.jsx        — user state, login(), logout(), useAuth() hook
        │
        ├── api/
        │   ├── axiosInstance.js       — Axios instance; auto-attaches JWT to every request
        │   ├── auth.js                — registerUser(), loginUser()
        │   ├── user.js                — getProfile(), updateProfile(), updateChecklist()
        │   ├── chat.js                — getChatHistory(), sendMessage()
        │   └── guide.js              — getGuide(type)
        │
        ├── components/
        │   ├── ProtectedRoute.jsx     — redirects to /login if no user; redirects to /onboarding if not complete
        │   ├── Navbar.jsx             — (empty placeholder) — Week 2
        │   ├── LoadingSpinner.jsx     — (empty placeholder) — Week 2
        │   ├── Toast.jsx              — (empty placeholder) — Week 2
        │   └── ProgressBar.jsx        — (empty placeholder) — Week 2
        │
        └── pages/
            ├── LandingPage.jsx        — P-01: placeholder
            ├── LoginPage.jsx          — P-02: placeholder
            ├── RegisterPage.jsx       — P-03: placeholder
            ├── OnboardingPage.jsx     — P-04: placeholder
            ├── DashboardPage.jsx      — P-05: placeholder
            ├── VisaPage.jsx           — P-06: placeholder
            ├── CulturePage.jsx        — P-07: placeholder
            ├── HealthPage.jsx         — P-08: placeholder
            ├── HousingPage.jsx        — P-09: placeholder
            ├── ChatPage.jsx           — P-10: placeholder
            └── ProfilePage.jsx        — P-11: placeholder
```

---

## Every model schema

### `server/models/User.js`
```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    homeCountry: {
      type: String,
      default: '',
    },
    destinationCountry: {
      type: String,
      default: '',
    },
    destinationCity: {
      type: String,
      default: '',
    },
    university: {
      type: String,
      default: '',
    },
    travelStartDate: {
      type: Date,
      default: null,
    },
    travelEndDate: {
      type: Date,
      default: null,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    checklist: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
```

### `server/models/ChatHistory.js`
```js
const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'bot'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      enum: ['visa', 'health', 'culture', 'housing', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
```

---

## Every route defined

| Method | Path | What it does | Controller |
|--------|------|-------------|------------|
| POST | /api/auth/register | Creates a new user, returns JWT + user object | authController.register |
| POST | /api/auth/login | Validates credentials, returns JWT + user object | authController.login |
| GET | /api/user/profile | Returns logged-in user's full profile (no password) | userController.getProfile |
| PATCH | /api/user/profile | Updates one or more profile fields | userController.updateProfile |
| PATCH | /api/user/checklist | Replaces the user's checklist array | userController.updateChecklist |
| GET | /api/chat/history | Returns last 30 messages for logged-in user, sorted oldest first | chatController.getHistory |
| POST | /api/chat/message | Saves user message + placeholder bot reply to DB | chatController.sendMessage |
| GET | /api/guide/:type | Returns guide content for visa/health/culture/housing | guideController.getGuide |

All routes except `/api/auth/register` and `/api/auth/login` are protected by `authMiddleware.js`.

---

## Every piece of logic written

### `server/config/db.js`
```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### `server/middleware/authMiddleware.js`
```js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = protect;
```

### `server/controllers/authController.js`
```js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Creates a signed JWT — expires in 7 days
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Validates input, checks for duplicate email, hashes password, saves user, returns JWT
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Finds user by email, compares password, returns JWT
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    res.status(200).json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };
```

### `server/controllers/userController.js`
```js
const User = require('../models/User');

// Returns full user document excluding password field
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Updates only the fields that are present in req.body — does not overwrite missing fields
const updateProfile = async (req, res) => {
  const {
    homeCountry, destinationCountry, destinationCity,
    university, travelStartDate, travelEndDate, onboardingComplete,
  } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (homeCountry !== undefined) user.homeCountry = homeCountry;
    if (destinationCountry !== undefined) user.destinationCountry = destinationCountry;
    if (destinationCity !== undefined) user.destinationCity = destinationCity;
    if (university !== undefined) user.university = university;
    if (travelStartDate !== undefined) user.travelStartDate = travelStartDate;
    if (travelEndDate !== undefined) user.travelEndDate = travelEndDate;
    if (onboardingComplete !== undefined) user.onboardingComplete = onboardingComplete;
    const updatedUser = await user.save();
    res.status(200).json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      homeCountry: updatedUser.homeCountry,
      destinationCountry: updatedUser.destinationCountry,
      destinationCity: updatedUser.destinationCity,
      university: updatedUser.university,
      travelStartDate: updatedUser.travelStartDate,
      travelEndDate: updatedUser.travelEndDate,
      onboardingComplete: updatedUser.onboardingComplete,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Replaces entire checklist array — validates that input is an array
const updateChecklist = async (req, res) => {
  const { checklist } = req.body;
  try {
    if (!Array.isArray(checklist)) {
      return res.status(400).json({ message: 'Checklist must be an array' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { checklist },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ checklist: user.checklist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, updateChecklist };
```

### `server/controllers/chatController.js`
```js
const ChatHistory = require('../models/ChatHistory');

// Returns last 30 messages for the user sorted oldest first
const getHistory = async (req, res) => {
  try {
    const messages = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: 1 })
      .limit(30);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Saves user message + placeholder bot reply — real agent will replace placeholder in Week 4
const sendMessage = async (req, res) => {
  const { message } = req.body;
  try {
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    const userMessage = await ChatHistory.create({
      userId: req.user.id,
      role: 'user',
      message: message.trim(),
      intent: 'general',
    });
    const botMessage = await ChatHistory.create({
      userId: req.user.id,
      role: 'bot',
      message: 'I am still being set up. Check back soon!',
      intent: 'general',
    });
    res.status(201).json({ userMessage, botMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getHistory, sendMessage };
```

### `server/controllers/guideController.js`
```js
const User = require('../models/User');

const placeholderContent = {
  visa: {
    visaType: 'Student Visa (Type D)',
    requiredDocuments: [
      'Valid passport',
      'University acceptance letter',
      'Proof of financial means',
      'Health insurance',
      'Passport photos',
    ],
    processingTime: '4 to 8 weeks',
    embassyLink: 'https://www.auswaertiges-amt.de',
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
  health: {
    vaccines: ['Routine vaccines (MMR, Tdap)', 'Hepatitis A', 'Hepatitis B'],
    foodWaterSafety: 'Tap water is generally safe in most of Europe.',
    insuranceTips: 'Get an EHIC card if travelling within Europe.',
    emergencyContacts: { police: '110', ambulance: '112' },
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
  culture: {
    socialNorms: 'Punctuality is highly valued.',
    tipping: 'Round up the bill or tip 5 to 10% in restaurants.',
    transport: 'Excellent public transport — get a monthly pass.',
    food: 'Try local markets for affordable fresh food.',
    simCards: 'Prepaid SIMs available at airports and supermarkets.',
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
  housing: {
    accommodationTypes: [
      'Student dormitory (Studentenwohnheim)',
      'Shared apartment (WG)',
      'Private studio',
    ],
    rentRanges: '300 to 800 EUR per month depending on city and type.',
    searchPlatforms: [
      'https://www.uniplaces.com',
      'https://www.wg-gesucht.de',
      'https://www.studitemps.de',
    ],
    leaseTips: 'Start searching at least 3 months before arrival.',
    notes: 'This is placeholder content — real data will be loaded in Week 3.',
  },
};

// Validates type param, loads user profile, returns guide content with destination info
const getGuide = async (req, res) => {
  const { type } = req.params;
  const validTypes = ['visa', 'health', 'culture', 'housing'];
  try {
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid guide type' });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({
      type,
      destination: {
        country: user.destinationCountry || 'Not set',
        city: user.destinationCity || 'Not set',
      },
      homeCountry: user.homeCountry || 'Not set',
      content: placeholderContent[type],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getGuide };
```

### `client/src/context/AuthContext.jsx`
```jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Saves token + user to localStorage and state
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Clears token + user from localStorage and state
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### `client/src/components/ProtectedRoute.jsx`
```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.onboardingComplete && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### `client/src/api/axiosInstance.js`
```js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attaches JWT Bearer token to every outgoing request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
```

### `client/src/api/auth.js`
```js
import axiosInstance from './axiosInstance';

const registerUser = async (name, email, password) => {
  const response = await axiosInstance.post('/api/auth/register', { name, email, password });
  return response.data; // { token, user: { id, name, email, onboardingComplete } }
};

const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/api/auth/login', { email, password });
  return response.data; // { token, user: { id, name, email, onboardingComplete } }
};

export { registerUser, loginUser };
```

### `client/src/api/user.js`
```js
import axiosInstance from './axiosInstance';

const getProfile = async () => {
  const response = await axiosInstance.get('/api/user/profile');
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await axiosInstance.patch('/api/user/profile', profileData);
  return response.data;
};

const updateChecklist = async (checklist) => {
  const response = await axiosInstance.patch('/api/user/checklist', { checklist });
  return response.data;
};

export { getProfile, updateProfile, updateChecklist };
```

### `client/src/api/chat.js`
```js
import axiosInstance from './axiosInstance';

const getChatHistory = async () => {
  const response = await axiosInstance.get('/api/chat/history');
  return response.data;
};

const sendMessage = async (message) => {
  const response = await axiosInstance.post('/api/chat/message', { message });
  return response.data; // { userMessage, botMessage }
};

export { getChatHistory, sendMessage };
```

### `client/src/api/guide.js`
```js
import axiosInstance from './axiosInstance';

const getGuide = async (type) => {
  const response = await axiosInstance.get(`/api/guide/${type}`);
  return response.data;
};

export { getGuide };
```

---

## Environment variables

### `server/.env`
```
MONGODB_URI=mongodb+srv://studybuddy:<password>@study-abroad-buddy.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=<your_long_random_string>
OPENAI_API_KEY=sk-<your_key>
CHROMA_URL=http://localhost:8000
PORT=5000
```

### `client/.env`
```
VITE_API_URL=http://localhost:5000
```

---

## What is fully working

- MongoDB Atlas connected and verified (cluster: study-abroad-buddy, region: ap-south-1)
- MongoDB Compass connected to Atlas
- Express server running on port 5000
- `POST /api/auth/register` — creates user, hashes password, returns JWT
- `POST /api/auth/login` — validates credentials, returns JWT
- Duplicate email registration blocked with 400 error
- Wrong password blocked with 400 error
- `GET /api/user/profile` — returns user profile, password excluded
- `PATCH /api/user/profile` — updates profile fields selectively
- `PATCH /api/user/checklist` — replaces checklist array
- `GET /api/chat/history` — returns last 30 messages sorted oldest first
- `POST /api/chat/message` — saves user message + placeholder bot reply
- Empty message blocked with 400 error
- `GET /api/guide/visa` — returns visa guide with user destination
- `GET /api/guide/health` — returns health guide
- `GET /api/guide/culture` — returns culture guide
- `GET /api/guide/housing` — returns housing guide
- Invalid guide type blocked with 400 error
- All protected routes return 401 when no token provided
- React + Vite frontend running on port 5173
- Tailwind CSS v3 configured and working
- React Router v6 with all 11 routes set up
- AuthContext providing user state, login(), logout() globally
- ProtectedRoute redirecting unauthenticated users to /login
- ProtectedRoute redirecting authenticated users without onboarding to /onboarding
- axiosInstance auto-attaching JWT to every request
- All 11 placeholder pages rendering at correct URLs

---

## What is incomplete or has known issues

- All 11 pages are placeholders — no real UI yet
- `chatController.sendMessage` returns a hardcoded bot reply — real agent not wired up until Week 4
- `guideController.getGuide` returns hardcoded placeholder content — real agent not wired up until Week 3
- `config/chromaClient.js` and `config/openaiClient.js` are empty — Week 3
- All agent files in `server/agents/` are empty — Week 3
- `server/router/intentClassifier.js` and `agentRouter.js` are empty — Week 3
- `server/utils/embedder.js` and `ragQuery.js` are empty — Week 3
- `server/scripts/ingest.js`, `testAgents.js`, `testClassifier.js` are empty — Week 3
- `client/src/components/Navbar.jsx`, `Toast.jsx`, `LoadingSpinner.jsx`, `ProgressBar.jsx` are empty placeholders — Week 2
- No input validation on the frontend yet
- No error handling UI on the frontend yet
- `ProtectedRoute` uses `window.location.pathname` for the onboarding check — this works but could be improved with React Router's `useLocation` hook in a future refactor

---

## Decisions made and why

- **bcryptjs not bcrypt** — bcryptjs is pure JavaScript and works on Windows without native build tools. bcrypt requires node-gyp which causes issues on Windows.
- **Tailwind CSS v3 not v4** — v4 has a completely different config setup (no tailwind.config.js). v3 is stable and well-documented.
- **JWT stored in localStorage** — simple for a student project. In production you would use httpOnly cookies.
- **JWT expiry 7 days** — long enough that users won't get logged out constantly during development.
- **bcrypt salt rounds: 10** — industry standard default. Higher = slower but more secure.
- **`process.exit(1)` in connectDB** — if MongoDB fails to connect the server should not run at all. Failing fast is better than running with no database.
- **Selective field update in updateProfile** — only fields present in req.body are updated using `if (field !== undefined)` checks. This prevents accidentally wiping fields that weren't sent.
- **`findByIdAndUpdate` with `{ new: true }` in updateChecklist** — returns the updated document not the old one, so the response always reflects the current state.
- **Chat history sorted `createdAt: 1`** — oldest first so the frontend can render messages top to bottom in chronological order.
- **Guide routes use `:type` param** — one route handles all four guide types instead of four separate routes. Validated against a whitelist array.
- **AuthContext reads localStorage on init** — `useState(() => JSON.parse(localStorage.getItem('user')))` means page refresh does not log the user out.
- **All API helpers in separate files per resource** — `api/auth.js`, `api/user.js`, `api/chat.js`, `api/guide.js` — keeps files focused and easy to find.
- **Naming conventions**: React components PascalCase, API routes kebab-case, JS functions camelCase, MongoDB collections camelCase plural.
- **No TypeScript, no LangChain, no Redis, no .then()** — project constraints defined in CLAUDE.md.

---

---

## Week 2 — completed

---

### New files created this week

**Server:**
- `server/controllers/userController.js` — added `changePassword()` function (see New logic written below); existing file was updated, not created fresh

**Client pages (all were placeholders, now fully built):**
- `client/src/pages/LandingPage.jsx` — P-01: static hero + 3 feature cards, no API calls
- `client/src/pages/LoginPage.jsx` — P-02: email/password login form, calls POST /api/auth/login
- `client/src/pages/RegisterPage.jsx` — P-03: name/email/password/confirm form, calls POST /api/auth/register
- `client/src/pages/OnboardingPage.jsx` — P-04: 3-step wizard, calls PATCH /api/user/profile
- `client/src/pages/DashboardPage.jsx` — P-05: welcome card, checklist progress bar, 4 module nav cards, AI chat CTA
- `client/src/pages/VisaPage.jsx` — P-06: visa type, interactive document checklist, embassy link, calls GET /api/guide/visa
- `client/src/pages/CulturePage.jsx` — P-07: accordion sections for social norms/tipping/transport/food/SIM, calls GET /api/guide/culture
- `client/src/pages/HealthPage.jsx` — P-08: vaccine checklist, food/water safety, insurance tips, emergency contacts grid, calls GET /api/guide/health
- `client/src/pages/HousingPage.jsx` — P-09: rent range banner, accommodation types, platform links, lease tips, calls GET /api/guide/housing
- `client/src/pages/ChatPage.jsx` — P-10: full chat UI with message history, optimistic send, typing indicator, agent badges, calls GET /api/chat/history + POST /api/chat/message
- `client/src/pages/ProfilePage.jsx` — P-11: editable trip details form + password change section, calls GET /api/user/profile + PATCH /api/user/profile + PATCH /api/user/password

---

### New routes added

| Method | Path | What it does | Controller |
|--------|------|-------------|------------|
| PATCH | /api/user/password | Verifies current password then replaces it with a new bcrypt hash | userController.changePassword |

Added to `server/routes/userRoutes.js`:
```js
router.patch('/password', protect, changePassword);
```

---

### New components and pages built

#### P-01 `LandingPage.jsx`
- **Renders:** sticky nav with logo + Login/Register links; hero section with badge pill, headline, sub-headline, two CTA buttons, social proof line; features section with 3 `FeatureCard` sub-components (Visa, Health, Culture); footer
- **API calls:** none — fully static
- **State:** none
- **Sub-components:** `FeatureCard({ emoji, title, description, accent })` — renders a gradient-topped card; defined in same file

#### P-02 `LoginPage.jsx`
- **Renders:** split-panel layout — decorative left panel (hidden on mobile) with quote + destination chips; right panel with email/password form, error banner, submit button, link to Register
- **API calls:** `loginUser(email, password)` from `api/auth.js` on form submit
- **State:** `formData { email, password }`, `error` string, `loading` boolean
- **Logic:**
  - `handleChange` updates formData and clears error banner as user retypes
  - `handleSubmit` validates both fields are non-empty, calls `loginUser()`, stores result via `login()` from AuthContext, navigates to `/dashboard`
  - Server error message (e.g. "Invalid email or password") shown in red banner above form
  - `loading` disables submit button and changes label to "Logging in…"

#### P-03 `RegisterPage.jsx`
- **Renders:** split-panel layout — decorative left panel with 3-step onboarding preview; right panel with name/email/password/confirmPassword form, per-field inline errors, server error banner, live password match indicator, submit button
- **API calls:** `registerUser(name, email, password)` from `api/auth.js` on form submit
- **State:** `formData { name, email, password, confirmPassword }`, `errors` object (per-field), `serverError` string, `loading` boolean
- **Logic:**
  - `validate()` checks all fields client-side — empty fields, password length < 6, password mismatch — returns errors object
  - `handleChange` clears only the changed field's error, not other fields
  - `passwordsMatch` boolean drives green "✓ Passwords match" indicator below confirm field
  - On success: stores JWT + user via `login()`, navigates to `/onboarding`
  - `name.trim()` and `email.trim()` applied on submit, not on keystroke
- **Sub-components:** `FormField({ id, label, type, name, value, onChange, placeholder, autoComplete, error, hint })` — labelled input with red border + inline error when error prop set; defined in same file

#### P-04 `OnboardingPage.jsx`
- **Renders:** centred single-column layout; progress bar with step dots and percentage; card containing step content; Back/Next/Submit navigation buttons
- **API calls:** `updateProfile(formData + onboardingComplete: true)` from `api/user.js` on final step submit
- **State:** `step` (1–3), `formData { homeCountry, destinationCountry, destinationCity, university, travelStartDate, travelEndDate }`, `errors` object, `serverError` string, `loading` boolean
- **Logic:**
  - `validateStep(n)` validates only fields relevant to the current step — prevents premature errors on future steps
  - Changing `destinationCountry` resets `destinationCity` to `''` automatically
  - City dropdown disabled until a country is selected
  - `travelEndDate` gets `min` prop equal to `travelStartDate`
  - On submit: calls `updateProfile`, then calls `login(token, { ...user, ...updated, onboardingComplete: true })` to sync AuthContext so `ProtectedRoute` stops redirecting to `/onboarding` without a page reload
  - Progress bar width driven by `((step - 1) / TOTAL_STEPS) * 100`
- **Data:** `COUNTRIES` array (42 countries) and `CITIES_BY_COUNTRY` object (cities keyed by country name) defined at top of file
- **Sub-components:** `StepHeading({ emoji, title, subtitle })`, `SelectField({ id, label, name, value, onChange, options, placeholder, error, disabled })`, `DateField({ id, label, name, value, onChange, error, min })` — all defined in same file

#### P-05 `DashboardPage.jsx`
- **Renders:** sticky navbar with logo + profile link + logout; welcome card with name, destination, dates, university, countdown pill, checklist progress bar; 4 module nav cards (Visa, Health, Culture, Housing); AI chat CTA banner
- **API calls:** `getProfile()` from `api/user.js` on mount
- **State:** `profile` object, `loading` boolean, `error` string
- **Logic:**
  - `formatDate(dateStr)` — converts ISO string to "12 Jan 2025" using `toLocaleDateString`
  - `daysUntil(dateStr)` — returns number of days until a future date, or `null` if date has passed; countdown pill only renders if result is non-null
  - `checkedCount` = `profile.checklist.length`; `totalItems` hardcoded to 8 (placeholder until Week 4 AI checklist)
  - Logout calls `logout()` from AuthContext then navigates to `/login`
  - Full profile fetched from DB on mount — AuthContext only holds minimal user data from JWT
- **Sub-components:** `ModuleCard({ to, emoji, title, description, accent })` — nav card linking to guide page with per-card hover colour; `LoadingScreen` — full-screen spinner; both defined in same file

#### P-06 `VisaPage.jsx`
- **Renders:** sticky navbar; page header with homeCountry → destination breadcrumb; visa type + processing time info cards; interactive required documents checklist with progress bar; embassy link button; placeholder notice; ask AI CTA
- **API calls:** `getGuide('visa')` from `api/guide.js` on mount
- **State:** `guide` object, `loading` boolean, `error` string, `checkedDocs` array
- **Logic:**
  - `toggleDoc(doc)` adds/removes a document from `checkedDocs` — local state only, resets on refresh (Week 4 will persist to DB)
  - `allChecked` boolean drives green success banner and progress pill colour change
  - Document rows are full-width buttons with green circle checkmark SVG + strikethrough text when checked
  - Embassy link opens in new tab with `rel="noopener noreferrer"`
- **Sub-components:** `InfoCard({ emoji, label, value, accent })`, `LoadingScreen` — defined in same file

#### P-07 `CulturePage.jsx`
- **Renders:** sticky navbar; page header with destination; 5 accordion sections (Social norms, Tipping, Transport, Food, SIM cards); placeholder notice; ask AI CTA
- **API calls:** `getGuide('culture')` from `api/guide.js` on mount
- **State:** `guide` object, `loading` boolean, `error` string; each accordion item manages its own `open` boolean state internally
- **Logic:**
  - `AccordionItem` is a self-contained component with its own `useState(defaultOpen)` — sections open/close independently
  - Open/close animation uses `max-h-0` / `max-h-96` + `opacity` CSS transition — no JS animation library
  - `+` rotates to `×` via `rotate-45` Tailwind class when open
  - Social norms section has `defaultOpen={true}` so page is not empty on load
- **Sub-components:** `AccordionItem({ emoji, title, children, defaultOpen })`, `LoadingScreen` — defined in same file

#### P-08 `HealthPage.jsx`
- **Renders:** sticky navbar; page header with destination; interactive vaccines checklist with progress bar + doctor disclaimer; food/water safety + insurance tips side-by-side cards; emergency contacts grid; placeholder notice; ask AI CTA
- **API calls:** `getGuide('health')` from `api/guide.js` on mount
- **State:** `guide` object, `loading` boolean, `error` string, `checkedVaccines` array
- **Logic:**
  - `toggleVaccine(vaccine)` — same pattern as `toggleDoc` in VisaPage — local state only
  - Vaccine progress bar uses `bg-sky-400` instead of amber to visually distinguish from visa page
  - Emergency contacts rendered via `Object.entries(guide.content.emergencyContacts)` — renders dynamically regardless of how many contacts the agent returns in Week 3
  - Doctor disclaimer always rendered — matches health agent spec which always appends "Consult a doctor before travelling."
  - Emergency contact keys displayed with `capitalize` CSS class — `{ police: '110' }` renders as "Police / 110"
- **Sub-components:** `LoadingScreen` — defined in same file

#### P-09 `HousingPage.jsx`
- **Renders:** sticky navbar; page header with destination; rent range banner; accommodation types numbered list; search platforms link list; lease tips card; placeholder notice; ask AI CTA
- **API calls:** `getGuide('housing')` from `api/guide.js` on mount
- **State:** `guide` object, `loading` boolean, `error` string
- **Logic:**
  - `getHostname(url)` — uses `new URL(url).hostname.replace('www.', '')` to extract readable domain from full URL; wrapped in try/catch for safety
  - Platform links extracted into `PlatformLink` sub-component to avoid `<a>` tag inside `.map()` causing Vite OXC parse errors
  - First letter of hostname used as avatar initial (e.g. `U` for uniplaces.com)
  - All platform links open in new tab with `rel="noopener noreferrer"`
- **Sub-components:** `AccommodationRow({ index, type })`, `PlatformLink({ url })`, `LoadingScreen` — defined in same file

#### P-10 `ChatPage.jsx`
- **Renders:** sticky navbar; scrollable message list (user bubbles right / bot bubbles left with robot avatar); agent badge + timestamp below each bot bubble; typing indicator (3 animated dots); empty state with suggestion chips; sticky input bar with textarea + send button
- **API calls:** `getChatHistory()` from `api/chat.js` on mount; `sendMessage(message)` from `api/chat.js` on send
- **State:** `messages` array, `input` string, `loading` boolean (initial history fetch), `sending` boolean (per-message), `error` string
- **Refs:** `bottomRef` for auto-scroll to bottom; `inputRef` for refocusing textarea after send
- **Logic:**
  - **Optimistic UI:** user message appended to state immediately with a temporary `_id` before the server responds; if request fails, optimistic message is removed and error shown; on success, optimistic message replaced with real server response
  - `AGENT_BADGE` map — `{ visa, health, culture, housing, general }` — each maps to a `{ label, color }` object; bot bubble badge driven by `msg.intent` field from DB
  - `formatTime(dateStr)` — formats timestamp to "2:34 PM" using `toLocaleTimeString`
  - Enter sends message; Shift+Enter inserts newline — handled in `handleKeyDown`
  - `useEffect` on `[messages, sending]` calls `bottomRef.current?.scrollIntoView({ behavior: 'smooth' })` — auto-scrolls on new messages and when typing indicator appears
  - Suggestion chips in empty state fire `window.dispatchEvent(new CustomEvent('suggestion', { detail: label }))` — ChatPage listens with `window.addEventListener('suggestion', ...)` to pre-fill input without prop drilling
  - Textarea `rows={1}` with `maxHeight: 120px` — grows with content, capped at 120px
- **Sub-components:** `MessageBubble({ msg })`, `TypingIndicator`, `EmptyState`, `SuggestionChip({ label })` — defined in same file

#### P-11 `ProfilePage.jsx`
- **Renders:** sticky navbar; page header with name + email; "Trip details" card with editable destination/city/university/dates form + Save button + inline toast; "Change password" card with current/new/confirm password fields + Update button + inline toast; home country shown as read-only field
- **API calls:** `getProfile()` on mount; `updateProfile(data)` on profile save; `axiosInstance.patch('/api/user/password', { currentPassword, newPassword })` on password save
- **State:** `profile { homeCountry, destinationCountry, destinationCity, university, travelStartDate, travelEndDate }`, `profileErrors` object, `profileLoading` boolean, `profileSaving` boolean, `profileToast` string; `passwords { currentPassword, newPassword, confirmPassword }`, `passwordErrors` object, `passwordSaving` boolean, `passwordToast` string, `passwordToastMsg` string
- **Logic:**
  - `toDateInputValue(dateStr)` — converts ISO date string to `yyyy-MM-dd` format required by `<input type="date">` via `.toISOString().split('T')[0]`
  - Profile and password sections have completely independent state — saving one does not affect the other
  - `showToast(setter, value)` — sets toast value then calls `setTimeout(() => setter(''), 3000)` to auto-dismiss after 3 seconds
  - Home country rendered as a read-only styled div, not a select — changing home country would invalidate the visa guide and should be a deliberate support action
  - Password validation checks: current password non-empty, new password >= 6 chars, confirm matches, new password different from current
  - On profile save: calls `login(token, { ...user, ...updated })` to sync AuthContext with any updated fields
  - Password change calls `PATCH /api/user/password` directly via `axiosInstance` (no dedicated API helper file function)
- **Sub-components:** `SelectField`, `DateField`, `PasswordField`, `Toast({ text, type })`, `LoadingScreen` — defined in same file

---

### New logic written

#### `changePassword()` — added to `server/controllers/userController.js`

Verifies the user's current password against the stored hash, then replaces it with a new bcrypt hash. Called by `PATCH /api/user/password`.

```js
// Verifies current password then replaces it with a new hashed password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

`bcrypt` import added to top of `userController.js`:
```js
const bcrypt = require('bcryptjs');
```

Updated exports in `userController.js`:
```js
module.exports = { getProfile, updateProfile, updateChecklist, changePassword };
```

---

### Environment variables added

None. No new environment variables were added in Week 2. All pages use the existing `VITE_API_URL` on the client and the existing server variables.

---

### What is fully working after Week 2

- MongoDB Atlas connected and verified (cluster: study-abroad-buddy, region: ap-south-1)
- MongoDB Compass connected to Atlas
- Express server running on port 5000
- `POST /api/auth/register` — creates user, hashes password, returns JWT
- `POST /api/auth/login` — validates credentials, returns JWT
- Duplicate email registration blocked with 400 error
- Wrong password blocked with 400 error
- `GET /api/user/profile` — returns user profile, password excluded
- `PATCH /api/user/profile` — updates profile fields selectively
- `PATCH /api/user/checklist` — replaces checklist array
- `PATCH /api/user/password` — verifies current password, replaces with new hash
- `GET /api/chat/history` — returns last 30 messages sorted oldest first
- `POST /api/chat/message` — saves user message + placeholder bot reply
- Empty message blocked with 400 error
- `GET /api/guide/visa` — returns visa guide with user destination
- `GET /api/guide/health` — returns health guide
- `GET /api/guide/culture` — returns culture guide
- `GET /api/guide/housing` — returns housing guide
- Invalid guide type blocked with 400 error
- All protected routes return 401 when no token provided
- React + Vite frontend running on port 5173
- Tailwind CSS v3 configured and working
- React Router v6 with all 11 routes set up
- AuthContext providing user state, login(), logout() globally
- ProtectedRoute redirecting unauthenticated users to /login
- ProtectedRoute redirecting authenticated users without onboarding to /onboarding
- axiosInstance auto-attaching JWT to every request
- P-01 LandingPage — fully built, static, renders at `/`
- P-02 LoginPage — fully built, auth working, redirects to `/dashboard` on success
- P-03 RegisterPage — fully built, auth working, redirects to `/onboarding` on success
- P-04 OnboardingPage — fully built, saves to DB, sets onboardingComplete, redirects to `/dashboard`
- P-05 DashboardPage — fully built, loads real profile data, countdown pill, checklist progress bar, module nav cards
- P-06 VisaPage — fully built, loads guide data, interactive document checklist, embassy link
- P-07 CulturePage — fully built, loads guide data, accordion sections all working
- P-08 HealthPage — fully built, loads guide data, vaccine checklist, emergency contacts grid
- P-09 HousingPage — fully built, loads guide data, platform links, accommodation types
- P-10 ChatPage — fully built, loads history, sends messages, optimistic UI, typing indicator, agent badges, suggestion chips
- P-11 ProfilePage — fully built, loads and saves profile, password change working
- All 11 pages mobile responsive
- Per-field inline validation on Register and Onboarding
- Client-side validation on all forms before API calls
- Error banners on all pages
- Loading spinners on all pages while data fetches
- Auto-scroll to bottom of chat on new messages
- Suggestion chips in chat empty state pre-fill input

---

### What is incomplete or has known issues after Week 2

- `chatController.sendMessage` returns a hardcoded bot reply ("I am still being set up. Check back soon!") — real agent router not wired up until Week 4
- `guideController.getGuide` returns hardcoded placeholder content for all four guide types — real AI agents not wired up until Week 3
- `config/chromaClient.js` and `config/openaiClient.js` are empty — Week 3
- All agent files in `server/agents/` are empty — Week 3
- `server/router/intentClassifier.js` and `agentRouter.js` are empty — Week 3
- `server/utils/embedder.js` and `ragQuery.js` are empty — Week 3
- `server/scripts/ingest.js`, `testAgents.js`, `testClassifier.js` are empty — Week 3
- `client/src/components/Navbar.jsx`, `Toast.jsx`, `LoadingSpinner.jsx`, `ProgressBar.jsx` are still empty placeholder files — shared components were not needed because each page implements its own inline loading state and toast; these can be populated or deleted in a future polish pass
- Document checklist ticks (VisaPage) reset on page refresh — local state only; Week 4 will wire to `PATCH /api/user/checklist`
- Vaccine checklist ticks (HealthPage) reset on page refresh — same reason
- Dashboard checklist progress bar `totalItems` hardcoded to 8 — Week 4 will replace with AI-generated checklist count
- `server/data/visa/`, `server/data/health/`, `server/data/culture/` folders are empty — source documents for RAG ingestion collected in Week 3
- `ProtectedRoute` uses `window.location.pathname` for the onboarding check — works correctly but could be refactored to use React Router's `useLocation` hook

---

### Decisions made in Week 2 and why

- **Optimistic UI in ChatPage** — user message appended to state immediately before the API call resolves, then replaced with the real server response. Makes the chat feel instant even with latency. Optimistic message uses a temporary `_id` prefixed with `optimistic-` so it can be identified and replaced without affecting real messages.
- **`CustomEvent` for suggestion chips** — `SuggestionChip` fires `window.dispatchEvent(new CustomEvent('suggestion', ...))` instead of receiving a setter via props. This avoids threading a `setInput` prop through `EmptyState` → `SuggestionChip`. `ChatPage` listens with `window.addEventListener` in a `useEffect`. Clean decoupling for a component that only exists in one place.
- **Per-page inline loading screens and toasts** — each page defines its own `LoadingScreen` sub-component and toast logic rather than using the shared placeholder components (`LoadingSpinner.jsx`, `Toast.jsx`). This was faster to build and keeps each page self-contained. The shared components can be filled in during a Week 4 polish pass if needed.
- **`AccordionItem` with own state** — each accordion section manages its own `open` boolean rather than using a shared parent state. This means sections open and close independently. If exclusive accordion behaviour (only one open at a time) is wanted in future, a single `openIndex` state in the parent would replace this.
- **`max-h` CSS transition for accordion** — `max-h-0` / `max-h-96` with `transition-all` gives smooth open/close without any JS animation library. The `max-h-96` cap (24rem) is sufficient for placeholder content; if Week 3 AI content is longer, bump to `max-h-[500px]`.
- **Extracting `PlatformLink` and `AccommodationRow` as sub-components in HousingPage** — Vite's OXC parser (used from Vite 6+) is stricter than the old Babel parser and throws parse errors on `<a>` tags returned directly inside `.map()` arrow functions. Extracting into named sub-components eliminates the ambiguity. This pattern is now applied to all native HTML tags inside `.map()` across all pages.
- **`toDateInputValue()` in ProfilePage** — MongoDB stores dates as ISO strings. `<input type="date">` requires `yyyy-MM-dd` format. Without this conversion the date fields appear blank on load even when data exists in the DB. The function uses `.toISOString().split('T')[0]` which is reliable across timezones at midnight.
- **Home country read-only in ProfilePage** — `homeCountry` is displayed as a styled div rather than a select. Changing home country would silently invalidate the visa guide (which is keyed on homeCountry + destinationCountry). Making it read-only prevents accidental corruption of guide data.
- **Password change calls `axiosInstance` directly in ProfilePage** — no dedicated API helper function was added to `api/user.js` for password change since it is only called from one place. Calling `axiosInstance.patch('/api/user/password', ...)` directly is simpler and keeps `api/user.js` focused on profile data.
- **`showToast(setter, value)` pattern** — a single reusable function sets a toast string then schedules its clearance with `setTimeout`. Used for both the profile toast and the password toast independently. Avoids importing a toast library for two use cases.
- **Arrow characters wrapped in `{'→'}` expressions** — Vite's OXC parser throws `[PARSE_ERROR]` on bare `→`, `←`, `↗` characters in JSX text nodes. All arrow characters are wrapped as JS string expressions `{'→'}` throughout all pages to prevent this.

---

### Updated folder and file structure

```
study-abroad-buddy/
├── CLAUDE.md                          — project context and conventions
│
├── server/
│   ├── server.js                      — Express entry point; connects MongoDB, mounts all routes
│   ├── package.json                   — server dependencies
│   ├── .env                           — server environment variables
│   │
│   ├── config/
│   │   ├── db.js                      — connectDB() — connects Mongoose to MONGODB_URI
│   │   ├── chromaClient.js            — (empty placeholder) ChromaDB client — Week 3
│   │   └── openaiClient.js            — (empty placeholder) OpenAI client — Week 3
│   │
│   ├── models/
│   │   ├── User.js                    — Mongoose schema: name, email, password, homeCountry, destinationCountry, destinationCity, university, travelStartDate, travelEndDate, onboardingComplete, checklist[]
│   │   └── ChatHistory.js             — Mongoose schema: userId, role, message, intent, timestamps
│   │
│   ├── middleware/
│   │   └── authMiddleware.js          — protect() — verifies JWT, attaches req.user = { id, name, email }
│   │
│   ├── routes/
│   │   ├── authRoutes.js              — POST /api/auth/register, POST /api/auth/login
│   │   ├── userRoutes.js              — GET /api/user/profile, PATCH /api/user/profile, PATCH /api/user/checklist, PATCH /api/user/password
│   │   ├── chatRoutes.js              — GET /api/chat/history, POST /api/chat/message
│   │   └── guideRoutes.js             — GET /api/guide/:type
│   │
│   ├── controllers/
│   │   ├── authController.js          — register(), login(), generateToken()
│   │   ├── userController.js          — getProfile(), updateProfile(), updateChecklist(), changePassword()
│   │   ├── chatController.js          — getHistory(), sendMessage()
│   │   └── guideController.js         — getGuide() with hardcoded placeholder content
│   │
│   ├── agents/                        — all empty — Week 3
│   │   ├── visaAgent.js
│   │   ├── healthAgent.js
│   │   ├── cultureAgent.js
│   │   ├── housingAgent.js
│   │   └── generalAgent.js
│   │
│   ├── router/                        — all empty — Week 3
│   │   ├── intentClassifier.js
│   │   └── agentRouter.js
│   │
│   ├── utils/                         — all empty — Week 3
│   │   ├── embedder.js
│   │   └── ragQuery.js
│   │
│   ├── scripts/                       — all empty — Week 3
│   │   ├── ingest.js
│   │   ├── testAgents.js
│   │   └── testClassifier.js
│   │
│   └── data/                          — all empty — Week 3
│       ├── visa/
│       ├── health/
│       └── culture/
│
└── client/
    ├── package.json                   — client dependencies
    ├── vite.config.js                 — Vite config with React plugin
    ├── tailwind.config.js             — Tailwind content paths
    ├── postcss.config.js              — PostCSS config for Tailwind
    ├── .env                           — VITE_API_URL=http://localhost:5000
    ├── index.html                     — HTML entry point, mounts #root
    │
    └── src/
        ├── main.jsx                   — React entry; renders <App> in StrictMode
        ├── App.jsx                    — All 11 routes wired with React Router v6
        ├── index.css                  — Tailwind directives only
        │
        ├── context/
        │   └── AuthContext.jsx        — user state, login(), logout(), useAuth() hook; reads localStorage on init
        │
        ├── api/
        │   ├── axiosInstance.js       — Axios instance with baseURL=VITE_API_URL; interceptor auto-attaches JWT Bearer token
        │   ├── auth.js                — registerUser(name, email, password), loginUser(email, password)
        │   ├── user.js                — getProfile(), updateProfile(profileData), updateChecklist(checklist)
        │   ├── chat.js                — getChatHistory(), sendMessage(message)
        │   └── guide.js              — getGuide(type)
        │
        ├── components/
        │   ├── ProtectedRoute.jsx     — redirects to /login if no user; redirects to /onboarding if onboardingComplete is false
        │   ├── Navbar.jsx             — empty placeholder (not used — each page has its own inline nav)
        │   ├── LoadingSpinner.jsx     — empty placeholder (not used — each page has its own inline LoadingScreen)
        │   ├── Toast.jsx              — empty placeholder (not used — each page has its own inline Toast)
        │   └── ProgressBar.jsx        — empty placeholder (not used — each page has its own inline progress bar)
        │
        └── pages/
            ├── LandingPage.jsx        — P-01: hero + 3 feature cards; static; FeatureCard sub-component
            ├── LoginPage.jsx          — P-02: split-panel login; calls loginUser(); stores JWT via AuthContext
            ├── RegisterPage.jsx       — P-03: split-panel register; per-field validation; calls registerUser(); FormField sub-component
            ├── OnboardingPage.jsx     — P-04: 3-step wizard; country/city dropdowns; date fields; calls updateProfile(); StepHeading, SelectField, DateField sub-components
            ├── DashboardPage.jsx      — P-05: welcome card; countdown; checklist progress; 4 ModuleCard nav cards; calls getProfile(); ModuleCard, LoadingScreen sub-components
            ├── VisaPage.jsx           — P-06: document checklist; visa type + processing time; embassy link; calls getGuide('visa'); InfoCard, LoadingScreen sub-components
            ├── CulturePage.jsx        — P-07: accordion sections; calls getGuide('culture'); AccordionItem, LoadingScreen sub-components
            ├── HealthPage.jsx         — P-08: vaccine checklist; emergency contacts grid; calls getGuide('health'); LoadingScreen sub-component
            ├── HousingPage.jsx        — P-09: rent range; accommodation types; platform links; calls getGuide('housing'); AccommodationRow, PlatformLink, LoadingScreen sub-components
            ├── ChatPage.jsx           — P-10: full chat UI; optimistic send; typing indicator; agent badges; suggestion chips; calls getChatHistory() + sendMessage(); MessageBubble, TypingIndicator, EmptyState, SuggestionChip sub-components
            └── ProfilePage.jsx        — P-11: editable trip details; password change; inline toasts; calls getProfile() + updateProfile() + PATCH /api/user/password; SelectField, DateField, PasswordField, Toast, LoadingScreen sub-components
```

---

## Exact next task

Week 3 Day 1 — ChromaDB setup, chromaClient.js, embedder.js, 3 collections created.

**chromaClient.js** — initialise ChromaDB client pointing at `CHROMA_URL=http://localhost:8000`. Export a single `chromaClient` instance used by all agents.

**embedder.js** — `embedText(text)` function using OpenAI `text-embedding-3-small` model. Takes a string, returns a vector (array of floats). Used by `ingest.js` to embed source documents and by `ragQuery.js` to embed user queries at runtime.

**3 ChromaDB collections** — `visa_docs`, `health_docs`, `culture_docs`. Each created via `chromaClient.getOrCreateCollection(name)`. Housing agent and General agent use LLM only — no ChromaDB collection needed for them.

Verify ChromaDB is running locally on port 8000 before starting. Collections should be created and confirmed empty before Day 2 ingestion begins.
