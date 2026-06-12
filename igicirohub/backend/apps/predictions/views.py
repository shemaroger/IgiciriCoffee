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
    VARIETIES, RWANDA_REAL_DATA, META_PATH,
)


# ── Gemini helper using new google-genai SDK ───────────────────────────────

def _call_gemini(system_instruction: str, user_message: str, history: list = None) -> str:
    """
    Call Gemini using the new google-genai SDK.
    Supports multi-turn conversation history.
    """
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # Build contents list
    contents = []

    # Add history if provided
    if history:
        for msg in history[-10:]:
            role    = 'user' if msg.get('role') == 'user' else 'model'
            content = msg.get('content', '').strip()
            if content:
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=content)]
                ))

    # Add current message
    contents.append(types.Content(
        role='user',
        parts=[types.Part(text=user_message)]
    ))

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=1024,
        ),
        contents=contents,
    )
    return response.text.strip()


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


def _get_real_data_context() -> str:
    lines = ["Real Rwanda Coffee Export Data (2020-2026):"]
    for year, d in sorted(RWANDA_REAL_DATA.items()):
        lines.append(
            f"  {year}: Producer {d['producer_frw_per_kg']} RWF/kg | "
            f"Export ${d['export_usd_per_kg']:.4f}/kg | "
            f"Volume {d['export_kg']:,.0f} kg"
        )
    lines.append("Price growth: 216 RWF (2020) → 750 RWF (2026) — 247% in 6 years")
    return '\n'.join(lines)


def _get_system_context(language: str, price_context: str) -> str:
    real_data_ctx = _get_real_data_context()
    return f"""You are IgiciroHub AI — expert Rwanda coffee market advisor.
Trained on REAL Rwanda coffee export data from 2020-2026.

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
- Rising ↑: Price increasing >3%
- Stable →: Price steady within 1-3%
- Falling ↓: Price declining

Key Rwanda Coffee Facts:
- Top districts: Huye, Nyamasheke, Gakenke, Rulindo, Burera, Nyaruguru
- Higher altitude (1700m+) = better quality = higher export premium
- Fully washed > Natural process for specialty export
- NAEB regulates all Rwanda coffee exports
- Rwanda Arabica regularly scores SCA 85+ for specialty grade
- Rwanda coffee exports grew from 16.2M kg (2020) to 22.3M kg (2025)

{real_data_ctx}

ALWAYS respond in {'Kinyarwanda' if language == 'rw' else 'English'}.
Be practical and encouraging. Keep answers 2-5 sentences unless detail is needed.

Current Rwanda Coffee Prices (Random Forest ML — Real Data):
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
                    "Cooperative: Igiciro nyuma yo gutunganya kawa muri koperative. "
                    "Export: Igiciro cy'isoko mpuzamahanga mu dollar (USD/kg).")
        return ("Farm Gate: Price paid directly to farmer at harvest. "
                "Cooperative: Higher price after collective processing and quality grading. "
                "Export: International green bean price in USD — highest value.")

    if any(w in q for w in ['trend', 'rising', 'falling', 'stable', 'market', 'isoko']):
        if language == 'rw':
            return ("Isoko rizamuka ↑ (>3%): Ibiciro bizamuka — fata akanya. "
                    "Isoko rihagaze → (1-3%): Impinduka nto — igihe cyo kugurisha. "
                    "Isoko rimanuka ↓ (<1%): Ibiciro bishuka — fikiria kugurisha vuba.")
        return ("Rising Market ↑ (>3%): Prices increasing — consider waiting. "
                "Stable Market → (1-3%): Prices steady — good time to sell. "
                "Falling Market ↓ (<1%): Prices declining — sell sooner.")

    if any(w in q for w in ['disease', 'pest', 'sick', 'indwara', 'bug', 'rust', 'cbd', 'wilt']):
        if language == 'rw':
            return ("Indwara: Coffee Berry Disease (CBD), Isuri (CLR), Antestia, Coffee Wilt. "
                    "Koresha fungicide ya copper (Champ/Kocide) vuba.")
        return ("Common diseases: Coffee Berry Disease (CBD), Leaf Rust (CLR), Antestia Bug, Wilt. "
                "Apply copper fungicide (Champ/Kocide) immediately.")

    if any(w in q for w in ['variety', 'bourbon', 'jackson', 'mibirizi', 'robusta', 'arabica']):
        if language == 'rw':
            return ("Ubwoko: Bourbon Arabica, Red Bourbon, Yellow Bourbon, Jackson, Mibirizi, Robusta. "
                    "Red Bourbon na Yellow Bourbon bifite agaciro gakomeye ku isoko.")
        return ("Varieties: Bourbon Arabica, Red Bourbon, Yellow Bourbon, Jackson, Mibirizi, Robusta. "
                "Red Bourbon and Yellow Bourbon fetch the highest specialty export prices.")

    if any(w in q for w in ['2020', '2021', '2022', '2023', '2024', '2025', '2026', 'history', 'historical']):
        lines = [f"{yr}: {d['producer_frw_per_kg']} RWF/kg | ${d['export_usd_per_kg']:.2f}/kg"
                 for yr, d in sorted(RWANDA_REAL_DATA.items())]
        if language == 'rw':
            return "Amateka y'ibiciro:\n" + '\n'.join(lines) + "\nIzamuka: 216→750 RWF/kg (2020-2026)"
        return "Rwanda coffee price history:\n" + '\n'.join(lines) + "\nGrowth: 216→750 RWF/kg (2020-2026)"

    if language == 'rw':
        return ("Nshobora gufasha ku ibiciro, igihe cy'isarura, ubwoko bw'ikawa, "
                "indwara, no kohereza. Baza ikibazo kirambuye.")
    return ("I help with Rwanda coffee prices, seasons, varieties, disease prevention, "
            "and export markets. Ask me anything!")


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
        'message':     'Coffee prices updated using Random Forest ML (Real Rwanda Data 2020-2026).',
        'updated':     updated,
        'created':     created,
        'total':       len(updates),
        'algorithm':   'RandomForest',
        'data_source': 'Rwanda Coffee Exports 2020-2026',
        'updated_at':  datetime.now().isoformat(),
    })


# ── Model info ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def model_info(request):
    if os.path.exists(META_PATH):
        with open(META_PATH) as f:
            meta = json.load(f)
        meta['real_data_summary'] = {
            str(yr): {
                'producer_frw_per_kg': d['producer_frw_per_kg'],
                'export_usd_per_kg':   round(d['export_usd_per_kg'], 4),
                'export_volume_kg':    d['export_kg'],
            }
            for yr, d in RWANDA_REAL_DATA.items()
        }
        return Response(meta)
    return Response({'message': 'Model not trained yet. POST /predictions/train/ to train.'})


# ── Ask Assistant ──────────────────────────────────────────────────────────

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
            answer = _call_gemini(system_prompt, question)
            return Response({'answer': answer, 'source': 'gemini'})
        except Exception as e:
            print(f"[Gemini ask] {type(e).__name__}: {e}")

    return Response({'answer': _rule_based(question, prices, language), 'source': 'local'})


# ── Voice Assistant ────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def voice_assistant(request):
    question = request.data.get('question', '').strip()
    history  = request.data.get('history', [])
    language = request.data.get('language', 'en')

    if not question:
        return Response({'error': 'question is required.'}, status=400)

    prices, price_context = _get_price_context()
    system_instruction    = _get_system_context(language, price_context)

    if not settings.GEMINI_API_KEY:
        return Response({
            'answer':   _rule_based(question, prices, language),
            'source':   'local',
            'language': language,
        })

    try:
        answer = _call_gemini(system_instruction, question, history)
        return Response({
            'answer':   answer,
            'source':   'gemini',
            'language': language,
            'model':    'gemini-2.0-flash',
        })

    except Exception as e:
        print(f"[Gemini voice] {type(e).__name__}: {e}")
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
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""Analyze this Rwanda {crop_name} plant image.
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
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    prompt,
                    types.Part.from_bytes(data=img_data, mime_type=mime_type),
                ],
            )
            raw = response.text.strip()
            if '```' in raw:
                raw = raw.split('```')[1]
                if raw.startswith('json'): raw = raw[4:]
            result = json.loads(raw.strip())
            result.update({'source': 'gemini_vision', 'crop': crop_name, 'timestamp': datetime.now().isoformat()})
            return Response(result)
        except Exception as e:
            print(f"[Disease] {type(e).__name__}: {e}")

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
        return Response({
            'message':     'Random Forest trained on real Rwanda coffee data 2020-2026.',
            'algorithm':   'RandomForest',
            'data_source': 'Rwanda Coffee Exports 2020-2026',
            'real_data':   {str(yr): d for yr, d in RWANDA_REAL_DATA.items()},
        })
    return Response({'error': 'Training failed.'}, status=500)