"""
Updated URL Configuration for Predictions App
Location: apps/predictions/urls.py

Integrates Coffee Assistant with existing prediction endpoints
Avoids conflicts by using clear separation
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# =====================================================
# ROUTER FOR COFFEE ASSISTANT
# =====================================================

router = DefaultRouter()
router.register(
    r'coffee',
    views.CoffeeAssistantViewSet,
    basename='coffee-assistant'
)

app_name = 'predictions'

# =====================================================
# URL PATTERNS
# =====================================================

urlpatterns = [
    # ===== COFFEE ASSISTANT ROUTES (NEW) =====
    # All coffee endpoints are under /api/predictions/coffee/
    
    # POST   /api/predictions/coffee/ask/
    # GET    /api/predictions/coffee/history/
    # POST   /api/predictions/coffee/clear-history/
    path('coffee/', include(router.urls)),
    
    # GET /api/predictions/coffee/health/
    path('coffee/health/', views.coffee_assistant_health, name='coffee-health'),
    
    
    # ===== YOUR EXISTING PREDICTION ENDPOINTS (UNCHANGED) =====
    # All your original endpoints work exactly the same
    
    # GET /api/predictions/available-crops/
    path('available-crops/', views.available_crops, name='available-crops'),
    
    # GET /api/predictions/regions/
    path('regions/', views.regions, name='regions'),
    
    # POST /api/predictions/run/
    path('run/', views.run_prediction, name='run-prediction'),
    
    # GET /api/predictions/history/
    path('history/', views.prediction_history, name='prediction-history'),
    
    # POST /api/predictions/ask/
    path('ask/', views.ask_assistant, name='ask-assistant'),
    
    # GET /api/predictions/voice/
    path('voice/', views.voice_assistant, name='voice-assistant'),
    
    # POST /api/predictions/detect-disease/
    path('detect-disease/', views.detect_disease, name='detect-disease'),
    
    # POST /api/predictions/train/
    path('train/', views.train_ml_model, name='train-model'),
    
    # POST /api/predictions/update-prices/
    path('update-prices/', views.update_market_prices, name='update-prices'),
    
    # GET /api/predictions/model-info/
    path('model-info/', views.model_info, name='model-info'),
]


# =====================================================
# COMPLETE ENDPOINT REFERENCE
# =====================================================

"""
COFFEE ASSISTANT ENDPOINTS (NEW)
=================================

1. Ask Coffee Question (Bilingual)
   
   POST /api/predictions/coffee/ask/
   
   Request:
   {
     "question": "How do I grow coffee?",
     "category": "Growing",
     "language": "en",
     "history": []
   }
   
   Response:
   {
     "success": true,
     "answer": "To grow coffee plants at home...",
     "question": "How do I grow coffee?",
     "category": "Growing",
     "language": "en",
     "model": "gemini-1.5-flash"
   }
   
   Supported Languages: en (English), rw (Kinyarwanda)
   Supported Categories: Growing, Pricing & Markets, Processing, Quality & Grading, Health & Nutrition


2. Get Coffee Conversation History
   
   GET /api/predictions/coffee/history/
   
   Response:
   {
     "success": true,
     "history": [
       {"role": "user", "content": "How do I grow coffee?"},
       {"role": "assistant", "content": "To grow coffee plants..."}
     ],
     "count": 2
   }


3. Clear Coffee Conversation
   
   POST /api/predictions/coffee/clear-history/
   
   Response:
   {
     "success": true,
     "message": "Conversation history cleared"
   }


4. Coffee Assistant Health Check
   
   GET /api/predictions/coffee/health/
   
   Response:
   {
     "success": true,
     "status": "healthy",
     "service": "Coffee Assistant",
     "ai_model": "Gemini 1.5 Flash",
     "languages": ["en", "rw"],
     "categories": [
       "Growing",
       "Pricing & Markets",
       "Processing",
       "Quality & Grading",
       "Health & Nutrition"
     ]
   }


YOUR EXISTING ENDPOINTS (UNCHANGED)
====================================

1. Get Available Crops
   GET /api/predictions/available-crops/


2. Get Regions
   GET /api/predictions/regions/


3. Run Prediction
   POST /api/predictions/run/


4. Get Prediction History
   GET /api/predictions/history/


5. Ask Assistant (Your original AI)
   POST /api/predictions/ask/


6. Voice Assistant
   GET /api/predictions/voice/


7. Detect Disease
   POST /api/predictions/detect-disease/


8. Train ML Model
   POST /api/predictions/train/


9. Update Market Prices
   POST /api/predictions/update-prices/


10. Get Model Info
    GET /api/predictions/model-info/


USAGE EXAMPLES
==============

# ===== COFFEE ASSISTANT (NEW) =====

# Ask about growing coffee (English)
curl -X POST http://localhost:8000/api/predictions/coffee/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I grow coffee?",
    "category": "Growing",
    "language": "en"
  }'

# Ask about growing coffee (Kinyarwanda)
curl -X POST http://localhost:8000/api/predictions/coffee/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Niteka kubereka kawa?",
    "category": "Growing",
    "language": "rw"
  }'

# Get coffee conversation history
curl http://localhost:8000/api/predictions/coffee/history/

# Clear coffee conversation
curl -X POST http://localhost:8000/api/predictions/coffee/clear-history/

# Check coffee assistant health
curl http://localhost:8000/api/predictions/coffee/health/


# ===== YOUR EXISTING ENDPOINTS (UNCHANGED) =====

# Get available crops
curl http://localhost:8000/api/predictions/available-crops/

# Get regions
curl http://localhost:8000/api/predictions/regions/

# Your original ask endpoint (still works)
curl -X POST http://localhost:8000/api/predictions/ask/ \
  -H "Content-Type: application/json" \
  -d '{"question": "Your question"}'

# Get your prediction history
curl http://localhost:8000/api/predictions/history/

# Run prediction
curl -X POST http://localhost:8000/api/predictions/run/ \
  -H "Content-Type: application/json" \
  -d '{"crop": "maize", "region": "Kigali"}'


PYTHON REQUESTS EXAMPLES
========================

import requests

# Coffee Assistant

# Ask coffee question
response = requests.post(
    'http://localhost:8000/api/predictions/coffee/ask/',
    json={
        'question': 'How do I grow coffee?',
        'category': 'Growing',
        'language': 'en'
    }
)
print(response.json())

# Get coffee history
response = requests.get('http://localhost:8000/api/predictions/coffee/history/')
print(response.json())

# Clear coffee conversation
response = requests.post('http://localhost:8000/api/predictions/coffee/clear-history/')
print(response.json())

# Check coffee health
response = requests.get('http://localhost:8000/api/predictions/coffee/health/')
print(response.json())


# Your existing endpoints

# Get available crops
response = requests.get('http://localhost:8000/api/predictions/available-crops/')
print(response.json())

# Run prediction
response = requests.post(
    'http://localhost:8000/api/predictions/run/',
    json={'crop': 'maize', 'region': 'Kigali'}
)
print(response.json())
"""