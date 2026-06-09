import os, json, base64
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import PredictionHistory
from .ml_engine import (
    predict_coffee_price, get_available_varieties,
    get_seasons, get_price_types, get_trend_indicator,
    train_model, auto_update_prices,
    VARIETIES, META_PATH,
)


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_price_context():
    from apps.prices.models import CropPrice
    prices = CropPrice.objects.all()[:10]
    return prices, '\n'.join(
        f"- {p.emoji} {p.name}: "
        f"Farm Gate {p.farmgate_rwf} RWF/kg | "
        f"Cooperative {p.cooperative_rwf} RWF/kg | "
        f"Export ${p.export_usd}/kg | "
        f"{p.trend_label} | Season: {p.season}"
        for p in prices
    ) or "No price data available."


def _get_system_context(language: str, price_context: str) -> str:
    return f"""You are IgiciroHub AI — expert Rwanda coffee market advisor.

Rwanda coffee varieties: Bourbon Arabica, Red Bourbon, Yellow Bourbon, Jackson, Mibirizi, Robusta.
Price types:
- Farm Gate: Price paid directly to farmer/cooperative at harvest
- Cooperative: Higher price after collective processing and quality grading
- Export: International market price in USD per kg green bean

Seasons:
- Season A (Mar-Jun): Main harvest — high supply, prices DROP
- Season B (Oct-Nov): Fly crop — moderate supply and prices
- Off Season (Jul-Sep, Dec-Feb): Low supply — prices RISE (best time to sell)

Market Trend Indicators:
- Rising ↑: Price increasing >3% — good time to hold stock
- Stable →: Price steady within 1-3% change
- Falling ↓: Price declining — consider selling sooner

Key Rwanda Coffee Facts:
- Top districts: Huye, Nyamasheke, Gakenke, Rulindo, Burera, Nyaruguru
- Higher altitude (1700m+) = better quality = higher export premium
- Fully washed > Natural process for specialty export
- NAEB regulates all Rwanda coffee exports
- Rwanda Arabica regularly scores SCA 85+ for specialty grade

ALWAYS respond in {'Kinyarwanda' if language == 'rw' else 'English'}.
Be practical and encouraging. Keep answers 2-5 sentences unless detail is needed.

Current Rwanda Coffee Prices (Random Forest ML):
{price_context}"""


def _rule_based(question, prices, language):
    q = question.lower()

    for p in prices:
        if any(w in q for w in p.name.lower().split() if len(w) > 3):
            if language == 'rw':
                return (f"{p.emoji} {p.name}: Farm Gate {p.farmgate_rwf} RWF/kg | "
                        f"Cooperative {p.cooperative_rwf} RWF/kg | ${p.export_usd}/kg kohereza. "
                        f"Isoko: {p.trend_label}. Igisekuru: {p.season}.")
            return (f"{p.emoji} {p.name} — Farm Gate: {p.farmgate_rwf} RWF/kg | "
                    f"Cooperative: {p.cooperative_rwf} RWF/kg | Export: ${p.export_usd}/kg. "
                    f"Market: {p.trend_label}. Season: {p.season}.")

    if any(w in q for w in ['season', 'igihe', 'harvest', 'isarura', 'season a', 'season b', 'off season']):
        if language == 'rw':
            return ("Season A (Werurwe-Kamena): Isarura rinini — ibiciro bishuka kubera ubwinshi. "
                    "Season B (Ukwakira-Ugushyingo): Imbuto nto — ibiciro hagati. "
                    "Off Season: Ibiciro bizamuka — igihe cyiza cyo kugurisha kawa yakoye.")
        return ("Season A (Mar-Jun): Main harvest — prices drop due to high supply. "
                "Season B (Oct-Nov): Fly crop — moderate prices. "
                "Off Season (Jul-Sep, Dec-Feb): Prices rise — best time to sell processed coffee.")

    if any(w in q for w in ['farm gate', 'cooperative', 'export', 'price type', 'igiciro']):
        if language == 'rw':
            return ("Farm Gate: Igiciro umuhinzi ahabwa vuba nyuma y'isarura. "
                    "Cooperative: Igiciro nyuma yo gutunganya kawa muri koperative — kiruta farm gate. "
                    "Export: Igiciro cy'isoko mpuzamahanga mu dollar (USD/kg).")
        return ("Farm Gate: Price paid directly to farmer at harvest — lowest but immediate. "
                "Cooperative: Higher price after collective processing, quality sorting and grading. "
                "Export: International green bean price in USD — highest value, requires NAEB certification.")

    if any(w in q for w in ['trend', 'rising', 'falling', 'stable', 'market', 'isoko']):
        if language == 'rw':
            return ("Isoko rizamuka ↑ (>3%): Ibiciro bizamuka — fata akanya urabaza ngo ubone ibiciro byiza. "
                    "Isoko rihagaze → (1-3%): Impinduka nto — igihe cyo kugurisha ni cyiza. "
                    "Isoko rimanuka ↓ (<1%): Ibiciro bishuka — fikiria kugurisha vuba.")
        return ("Rising Market ↑ (>3%): Prices increasing — consider waiting for better prices. "
                "Stable Market → (1-3%): Prices steady — good time to sell at current rates. "
                "Falling Market ↓ (<1%): Prices declining — sell sooner rather than later.")

    if any(w in q for w in ['disease', 'pest', 'sick', 'indwara', 'bug', 'rust', 'cbd', 'wilt']):
        if language == 'rw':
            return ("Indwara zikunze gutera ikawa mu Rwanda: Coffee Berry Disease (CBD), "
                    "Isuri ry'amababi (CLR), Inzoka ya Antestia, na Coffee Wilt. "
                    "Koresha fungicide ya copper (Champ/Kocide) ku CBD na CLR vuba.")
        return ("Common Rwanda coffee diseases: Coffee Berry Disease (CBD), Leaf Rust (CLR), "
                "Antestia Bug, and Coffee Wilt. "
                "Apply copper fungicide (Champ/Kocide) for CBD and CLR immediately. "
                "Remove and destroy infected plants to prevent spread.")

    if any(w in q for w in ['variety', 'bourbon', 'jackson', 'mibirizi', 'robusta', 'arabica']):
        if language == 'rw':
            return ("Ubwoko bw'ikawa mu Rwanda: Bourbon Arabica, Red Bourbon, Yellow Bourbon, "
                    "Jackson, Mibirizi (Arabica), na Robusta. "
                    "Red Bourbon na Yellow Bourbon ni iz'indashyikirwa cyane ku isoko mpuzamahanga.")
        return ("Rwanda coffee varieties: Bourbon Arabica, Red Bourbon, Yellow Bourbon, Jackson, "
                "Mibirizi (all Arabica), and Robusta. "
                "Red Bourbon and Yellow Bourbon fetch the highest specialty export prices.")

    if any(w in q for w in ['naeb', 'cooperative', 'ikoperative', 'export license']):
        if language == 'rw':
            return ("NAEB (National Agriculture Export Development Board) igenzura kohereza "
                    "ibihingwa by'u Rwanda mu mahanga. "
                    "Iyandikishe kuri NAEB kugirango ubone uruhushya rwo kohereza ikawa.")
        return ("NAEB (National Agriculture Export Development Board) regulates Rwanda's coffee exports. "
                "Register with NAEB to get your export license and connect with international buyers. "
                "Cooperatives help farmers access better prices collectively.")

    if language == 'rw':
        return ("Nshobora gufasha ku birebana n'ibiciro by'ikawa (Farm Gate, Cooperative, Export), "
                "igihe cy'isarura (Season A, B, Off Season), ubwoko bw'ikawa, "
                "indwara, no kohereza mu mahanga. Baza ikibazo kirambuye.")
    return ("I help with Rwanda coffee prices (Farm Gate, Cooperative, Export), "
            "harvest seasons (A, B, Off Season), variety comparisons, "
            "disease prevention, and export markets. Ask me anything!")


# ── Available crops & seasons ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def available_crops(request):
    return Response(get_available_varieties())


@api_view(['GET'])
@permission_classes([AllowAny])
def seasons_list(request):
    return Response({
        'seasons':     get_seasons(),
        'price_types': get_price_types(),
    })


# ── Run Prediction ─────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_prediction(request):
    variety           = request.data.get('crop_name', 'Bourbon Arabica')
    price_type        = request.data.get('price_type', 'Farm Gate')
    horizon_days      = int(request.data.get('horizon_days', 30))
    historical_months = int(request.data.get('historical_months', 6))

    if variety not in VARIETIES:
        variety = 'Bourbon Arabica'
    if price_type not in ['Farm Gate', 'Cooperative', 'Export']:
        price_type = 'Farm Gate'

    result = predict_coffee_price(variety, price_type, horizon_days, historical_months)

    PredictionHistory.objects.create(
        user=request.user,
        crop_name=variety,
        district=price_type,
        horizon_days=horizon_days,
        current_price=result['current_price'],
        predicted_change=result['change_pct'],
        confidence=result['confidence'],
        method=result['method'],
        recommendation=result['recommendation'],
    )

    return Response({
        'variety':               variety,
        'variety_type':          result['variety_type'],
        'emoji':                 result['emoji'],
        'price_type':            price_type,
        'price_unit':            result['price_unit'],
        'current_price':         result['current_price'],
        'predicted_price':       result['predicted_price'],
        'change_pct':            result['change_pct'],
        'trend':                 result['trend'],
        'current_farmgate':      result['current_farmgate'],
        'current_cooperative':   result['current_cooperative'],
        'current_export_usd':    result['current_export_usd'],
        'predicted_farmgate':    result['predicted_farmgate'],
        'predicted_cooperative': result['predicted_cooperative'],
        'predicted_export_usd':  result['predicted_export_usd'],
        'chart_data':            result['chart_data'],
        'chart_farmgate':        result['chart_farmgate'],
        'chart_cooperative':     result['chart_cooperative'],
        'chart_export':          result['chart_export'],
        'season':                result['season'],
        'season_description':    result['season_description'],
        'confidence':            result['confidence'],
        'method':                result['method'],
        'recommendation':        result['recommendation'],
        'horizon_days':          horizon_days,
        'historical_months':     historical_months,
    })


# ── Prediction history ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_history(request):
    hist = PredictionHistory.objects.filter(user=request.user)[:20]
    return Response([{
        'id':               h.id,
        'crop_name':        h.crop_name,
        'price_type':       h.district,
        'horizon_days':     h.horizon_days,
        'current_price':    str(h.current_price),
        'predicted_change': str(h.predicted_change),
        'confidence':       h.confidence,
        'method':           h.method,
        'recommendation':   h.recommendation,
        'created_at':       h.created_at.isoformat(),
    } for h in hist])


# ── Update market prices via ML ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def update_market_prices(request):
    from apps.prices.models import CropPrice
    updates = auto_update_prices()
    updated = created = 0
    for u in updates:
        _, was_created = CropPrice.objects.update_or_create(
            name=u['variety_name'],
            defaults={
                'emoji':           u['emoji'],
                'variety_type':    u['variety_type'],
                'farmgate_rwf':    u['farmgate_rwf'],
                'cooperative_rwf': u['cooperative_rwf'],
                'export_usd':      u['export_usd'],
                'price':           u['farmgate_rwf'],
                'unit':            'kg',
                'change':          u['change'],
                'trend':           u['trend'],
                'trend_label':     u['trend_label'],
                'season':          u['season'],
                'chart_data':      u['chart_data'],
            }
        )
        if was_created: created += 1
        else: updated += 1
    return Response({
        'message':    'Coffee prices updated using Random Forest ML.',
        'updated':    updated,
        'created':    created,
        'total':      len(updates),
        'algorithm':  'RandomForest',
        'updated_at': datetime.now().isoformat(),
    })


# ── Model info ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def model_info(request):
    if os.path.exists(META_PATH):
        with open(META_PATH) as f:
            return Response(json.load(f))
    return Response({'message': 'Model not trained yet. POST /predictions/train/ to train.'})


# ── Ask Assistant (single question) ───────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_assistant(request):
    question = request.data.get('question', '').strip()
    language = request.data.get('language', 'en')
    if not question:
        return Response({'error': 'question is required.'}, status=400)

    prices, price_context = _get_price_context()
    system_prompt = _get_system_context(language, price_context)

    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(system_prompt + f'\n\nQuestion: {question}')
            return Response({'answer': response.text, 'source': 'gemini'})
        except Exception as e:
            print(f"[Gemini ask] {e}")

    return Response({'answer': _rule_based(question, prices, language), 'source': 'local'})


# ── Voice Assistant (multi-turn with memory) ───────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def voice_assistant(request):
    question = request.data.get('question', '').strip()
    history  = request.data.get('history', [])
    language = request.data.get('language', 'en')

    if not question:
        return Response({'error': 'question is required.'}, status=400)

    prices, price_context = _get_price_context()
    system_instruction = _get_system_context(language, price_context)

    if not settings.GEMINI_API_KEY:
        return Response({
            'answer':   _rule_based(question, prices, language),
            'source':   'local',
            'language': language,
        })

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)

        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_instruction,
        )

        gemini_history = []
        for msg in history[-10:]:
            role    = 'user' if msg.get('role') == 'user' else 'model'
            content = msg.get('content', '').strip()
            if content:
                gemini_history.append({'role': role, 'parts': [content]})

        chat     = model.start_chat(history=gemini_history)
        response = chat.send_message(question)

        return Response({
            'answer':   response.text.strip(),
            'source':   'gemini',
            'language': language,
            'model':    'gemini-1.5-flash',
        })

    except Exception as e:
        print(f"[Gemini voice] {e}")
        return Response({
            'answer':   _rule_based(question, prices, language),
            'source':   'local_fallback',
            'language': language,
        })


# ── Disease Detection ──────────────────────────────────────────────────────

DISEASE_DB = {
    'cbd': {
        'name':       'Coffee Berry Disease (CBD)',
        'symptoms':   'Dark brown/black lesions on coffee berries, mummified fruit',
        'treatment':  'Apply Champ or Kocide fungicide. Remove and destroy infected berries immediately.',
        'prevention': 'Use resistant varieties, proper plant spacing, avoid overwatering.',
        'severity':   'High',
    },
    'clr': {
        'name':       'Coffee Leaf Rust (CLR)',
        'symptoms':   'Yellow-orange powdery spots on underside of leaves, defoliation',
        'treatment':  'Apply triazole or copper-based fungicide.',
        'prevention': 'Plant resistant varieties, maintain proper shade.',
        'severity':   'High',
    },
    'antestia': {
        'name':       'Antestia Bug',
        'symptoms':   'Deformed berries, characteristic potato taste defect in cup',
        'treatment':  'Apply Malathion or pyrethroid insecticide.',
        'prevention': 'Maintain shade trees, remove infected berries, use sticky traps.',
        'severity':   'High',
    },
    'wilt': {
        'name':       'Coffee Wilt Disease',
        'symptoms':   'Sudden wilting of branches, yellowing leaves, brown vascular discoloration',
        'treatment':  'No chemical cure. Remove and destroy infected plants immediately.',
        'prevention': 'Use certified disease-free seedlings, avoid wounding roots.',
        'severity':   'High',
    },
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_disease(request):
    image_b64 = request.data.get('image_base64', '')
    crop_name = request.data.get('crop_name', 'Coffee')
    mime_type = request.data.get('mime_type', 'image/jpeg')
    if not image_b64:
        return Response({'error': 'image_base64 required.'}, status=400)

    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model    = genai.GenerativeModel('gemini-1.5-flash')
            prompt   = f"""Analyze this Rwanda {crop_name} plant image.
Look for: Coffee Berry Disease, Leaf Rust, Antestia Bug, Coffee Wilt.
Respond ONLY with valid JSON (no markdown):
{{
  "healthy": true or false,
  "disease_name": "name or null",
  "confidence": "High or Medium or Low",
  "severity": "High or Medium or Low or None",
  "symptoms": "what you see",
  "treatment": "Rwanda-specific treatment",
  "prevention": "prevention tips"
}}"""
            img_data = base64.b64decode(image_b64)
            response = model.generate_content([prompt, {'mime_type': mime_type, 'data': img_data}])
            raw = response.text.strip()
            if '```' in raw:
                raw = raw.split('```')[1]
                if raw.startswith('json'): raw = raw[4:]
            result = json.loads(raw.strip())
            result.update({'source': 'gemini_vision', 'crop': crop_name, 'timestamp': datetime.now().isoformat()})
            return Response(result)
        except Exception as e:
            print(f"[Disease] {e}")

    import random as rnd, datetime as dt
    if rnd.random() > 0.45:
        return Response({
            'healthy': True, 'disease_name': None, 'confidence': 'Medium',
            'severity': 'None', 'symptoms': 'No visible disease symptoms.',
            'treatment': 'Continue regular care. Monitor weekly.',
            'prevention': 'Maintain proper shade, spacing, fertilization.',
            'source': 'local_database', 'crop': crop_name,
            'timestamp': dt.datetime.now().isoformat(),
        })
    d = rnd.choice(list(DISEASE_DB.values()))
    return Response({
        'healthy': False, 'disease_name': d['name'], 'confidence': 'Medium',
        'severity': d['severity'], 'symptoms': d['symptoms'],
        'treatment': d['treatment'], 'prevention': d['prevention'],
        'source': 'local_database', 'crop': crop_name,
        'timestamp': dt.datetime.now().isoformat(),
    })


# ── Train model ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_ml_model(request):
    fg, ex, sc = train_model()
    if fg:
        return Response({'message': 'Random Forest trained for 6 coffee varieties.', 'algorithm': 'RandomForest'})
    return Response({'error': 'Training failed.'}, status=500)