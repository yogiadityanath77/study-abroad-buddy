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

## Exact next task

Week 2 Day 1 — Build real UI for Landing page (P-01), Login page (P-02), and Register page (P-03).

**P-01 Landing** — hero section with app name + tagline + two CTA buttons (Register, Login), features section with 3 cards (visa help, health guide, culture guide). Static, no API calls.

**P-02 Login** — email + password fields, POST /api/auth/login via `loginUser()` from `api/auth.js`, store token + user via `login()` from AuthContext, redirect to /dashboard on success, show inline error on wrong credentials.

**P-03 Register** — name, email, password, confirm password fields, POST /api/auth/register via `registerUser()` from `api/auth.js`, store token + user via `login()` from AuthContext, redirect to /onboarding on success, show inline error on failure.

All three pages should use Tailwind CSS for styling. No external component libraries — plain Tailwind only.
