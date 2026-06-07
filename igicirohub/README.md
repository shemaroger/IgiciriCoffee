# IgiciroHub — Full Stack

Rwanda Smart Agricultural Platform. Django REST backend + Expo React Native frontend.

---

## 🔧 Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY for AI features

# 4. Run migrations
python manage.py makemigrations accounts crops prices predictions chat
python manage.py migrate

# 5. Seed database (creates test users + prices + trains ML)
python seed.py

# 6. Start server
python manage.py runserver 0.0.0.0:8000
```

**Test accounts (created by seed.py):**
- Farmer: `farmer@test.com` / `1234`
- Buyer:  `buyer@test.com`  / `1234`

**API base:** `http://<your-ip>:8000/api/`

---

## 📱 Frontend Setup

```bash
cd frontend

# 1. Install packages
npm install

# 2. Set your backend IP
# Edit: src/services/api.ts → BASE_URL
# Use your machine's local IP (not localhost for physical device)
# Android emulator: http://10.0.2.2:8000/api
# Physical device: http://192.168.x.x:8000/api
# Web browser: http://localhost:8000/api

# 3. Start Expo
npx expo start --clear

# Press 'a' for Android emulator
# Press 'w' for web browser
# Scan QR with Expo Go app on physical device
```

---

## 📡 API Endpoints

| Module      | Endpoints |
|-------------|-----------|
| Auth        | POST /auth/register/ · /login/ · /logout/ · GET /auth/me/ · PATCH /auth/profile/update/ |
| Crops       | GET /crops/marketplace/ · /my-crops/ · POST /crops/create/ · GET /crops/:id/detail/ |
| Prices      | GET /prices/list/ · /prices/:id/detail/ · /prices/trending/ |
| Predictions | POST /predictions/run/ · /predictions/ask/ · /predictions/detect-disease/ |
| Chat        | GET /chat/conversations/ · POST /chat/send/ · POST /chat/conversations/:id/reply/ |

---

## 🤖 AI Features

### Price Prediction
- GradientBoostingRegressor trained on Rwanda seasonal crop data
- 8 crop types × 29 districts × seasonal factors
- Auto-trains on first run, falls back to statistical model

### Voice/Text Assistant
- Powered by Google Gemini 1.5 Flash (requires GEMINI_API_KEY)
- Fallback to smart rule-based responses
- Supports English, Kinyarwanda, French, Swahili

### Disease Detection
- Gemini Vision API analyzes uploaded leaf photos
- Fallback to local disease database when no API key
- Returns: disease name, confidence, severity, treatment, prevention

---

## 🏗 Architecture

```
backend/
├── apps/
│   ├── accounts/     CustomUser, JWT auth
│   ├── crops/        Crop, SavedCrop, marketplace
│   ├── prices/       CropPrice, market data
│   ├── predictions/  ML engine, Gemini AI, disease detection
│   └── chat/         Conversation, Message
├── config/           Django settings, URLs
└── seed.py           Database seeder + ML trainer

frontend/src/
├── auth/             AuthContext (JWT), rbac
├── navigation/       RootNavigator, AppNavigator, CustomTabBar
├── screens/          26 screens — all connected to real API
├── services/         api.ts (token refresh, error handling)
├── components/       GradientButton, GradientCard, ScreenWrapper
└── theme/            ThemeContext, tokens (light/dark/nature)
```
