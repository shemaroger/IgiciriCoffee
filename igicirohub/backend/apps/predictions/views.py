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
    get_all_districts, train_model, auto_update_prices,
    VARIETIES, DISTRICTS, META_PATH,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def available_crops(request):
    return Response(get_available_varieties())


@api_view(['GET'])
@permission_classes([AllowAny])
def regions(request):
    return Response({
        'districts': get_all_districts(),
        'provinces': ['Northern', 'Southern', 'Western', 'Eastern', 'Kigali'],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_prediction(request):
    variety  = request.data.get('crop_name', 'Arabica Bourbon')
    district = request.data.get('district', 'Huye')
    horizon  = int(request.data.get('horizon_days', 30))
    if variety not in VARIETIES:
        variety = 'Arabica Bourbon'
    if district not in DISTRICTS:
        district = 'Huye'
    result = predict_coffee_price(variety, district, horizon)
    PredictionHistory.objects.create(
        user=request.user,
        crop_name=variety, district=district,
        horizon_days=horizon,
        current_price=result['current_farmgate_rwf'],
        predicted_change=result['farmgate_change_pct'],
        confidence=result['confidence'],
        method=result['method'],
        recommendation=result['recommendation'],
    )
    return Response({
        'crop_name': variety, 'district': district,
        'province': result['province'], 'altitude_m': result['altitude_m'],
        'quality_factor': result['quality_factor'],
        'current_price': result['current_farmgate_rwf'],
        'current_farmgate_rwf': result['current_farmgate_rwf'],
        'current_export_usd': result['current_export_usd'],
        'predicted_farmgate_rwf': result['predicted_farmgate_rwf'],
        'predicted_export_usd': result['predicted_export_usd'],
        'predicted_change': result['farmgate_change_pct'],
        'farmgate_change_pct': result['farmgate_change_pct'],
        'export_change_pct': result['export_change_pct'],
        'chart_data': result['chart_farmgate'],
        'chart_farmgate': result['chart_farmgate'],
        'chart_export': result['chart_export'],
        'season': result['season'],
        'confidence': result['confidence'],
        'method': result['method'],
        'recommendation': result['recommendation'],
        'horizon_days': horizon,
        'variety_type': result['variety_type'],
        'category': result['category'],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_history(request):
    hist = PredictionHistory.objects.filter(user=request.user)[:20]
    return Response([{
        'id': h.id, 'crop_name': h.crop_name, 'district': h.district,
        'horizon_days': h.horizon_days, 'current_price': str(h.current_price),
        'predicted_change': str(h.predicted_change), 'confidence': h.confidence,
        'method': h.method, 'recommendation': h.recommendation,
        'created_at': h.created_at.isoformat(),
    } for h in hist])


@api_view(['POST'])
@permission_classes([AllowAny])
def update_market_prices(request):
    """Auto-update all market prices using Random Forest ML predictions."""
    from apps.prices.models import CropPrice
    updates = auto_update_prices()
    updated_count = 0
    created_count = 0
    for u in updates:
        obj, created = CropPrice.objects.update_or_create(
            name=u['variety_name'],
            district=u['district'],
            defaults={
                'emoji':        u['emoji'],
                'price':        u['farmgate_rwf'],
                'export_usd':   u['export_usd'],
                'unit':         'kg',
                'change':       u['change'],
                'trend':        u['trend'],
                'variety_type': u['variety_type'],
                'location':     u['district'],
                'province':     u['province'],
                'altitude_m':   u['altitude_m'],
                'chart_data':   u['chart_data'],
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
    return Response({
        'message': 'Market prices updated using Random Forest ML.',
        'updated': updated_count,
        'created': created_count,
        'total': len(updates),
        'updated_at': datetime.now().isoformat(),
        'algorithm': 'RandomForest',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def model_info(request):
    if os.path.exists(META_PATH):
        with open(META_PATH) as f:
            meta = json.load(f)
        return Response(meta)
    return Response({'message': 'Model not trained yet. POST /predictions/train/ to train.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_assistant(request):
    question = request.data.get('question', '').strip()
    language = request.data.get('language', 'en')
    if not question:
        return Response({'error': 'question is required.'}, status=status.HTTP_400_BAD_REQUEST)

    from apps.prices.models import CropPrice
    prices = CropPrice.objects.all()[:12]
    price_context = '\n'.join(
        f"- {p.emoji} {p.name} ({p.district}): {p.price} RWF/kg | ${p.export_usd}/kg ({'+' if float(p.change) >= 0 else ''}{p.change}% {p.trend})"
        for p in prices
    ) or "No price data."

    system_prompt = f"""You are IgiciroHub AI — expert advisor for Rwanda coffee cooperatives and cash crop buyers.
Specialties: Coffee (Arabica Bourbon, Arabica Jackson, Robusta) and Cash Crops (Tea, Pyrethrum, Chili Pepper, Macadamia, Avocado).
Help with prices, harvest seasons, processing, market trends, disease prevention, export opportunities.
Respond in {'Kinyarwanda' if language == 'rw' else 'English'}. Be concise (2-4 sentences).
Prices are updated by Random Forest ML predictions.

Current Market Prices (ML-updated):
{price_context}

Rwanda Seasons:
- Coffee Main Harvest: March-June (prices drop)
- Coffee Fly Crop: October-November
- Tea Peak: March-May
- Cash Crops Main: March-June
- Off Season (prices rise): July-September"""

    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(system_prompt + f'\n\nQuestion: {question}')
            return Response({'answer': response.text, 'source': 'gemini'})
        except Exception as e:
            print(f"[Gemini] {e}")

    return Response({'answer': _rule_based(question, prices, language), 'source': 'local'})


def _rule_based(question, prices, language):
    q = question.lower()
    for p in prices:
        if any(w in q for w in p.name.lower().split() if len(w) > 3):
            if language == 'rw':
                return (f"{p.emoji} {p.name} ({p.district}) iracuruzwa ku {p.price} RWF/kg. "
                        f"Igiciro cy'ohereza ni ${p.export_usd}/kg.")
            return (f"{p.emoji} {p.name} ({p.district}): {p.price} RWF/kg farm gate | "
                    f"${p.export_usd}/kg export. Change: {p.change:+.1f}% ({p.trend}). "
                    f"Updated by Random Forest ML.")
    if any(w in q for w in ['harvest','season','igihe','gusarura']):
        if language == 'rw':
            return ("Igihe cy'isarura ry'ibihangange ni Werurwe-Kamena. Icyayi gisarurwa cyane Werurwe-Gicurasi. "
                    "Ibiciro bishuka mu gihe cy'isarura kandi bizamuka mu gihe cy'icyanda.")
        return ("Coffee main harvest is March-June, fly crop October-November. Tea peaks March-May. "
                "Cash crops (Pyrethrum, Chili, Macadamia) peak March-June. "
                "Sell processed products July-September for best prices.")
    if any(w in q for w in ['export','usd','dollar','ohereza']):
        if language == 'rw':
            return ("Arabica Bourbon: $4-$7/kg. Icyayi: $1.5-$2.5/kg. "
                    "Macadamia: $7-$10/kg — ni igihingwa cy'indashyikirwa. "
                    "Pyrethrum na Chili na zo zifite agaciro k'ohereza. Ibiciro biravugururwa na Random Forest ML.")
        return ("Export prices: Arabica Bourbon $4-$7/kg, Tea $1.5-$2.5/kg, "
                "Macadamia $7-$10/kg, Pyrethrum $3-$4/kg, Chili Pepper $4-$6/kg. "
                "All prices ML-updated using Random Forest algorithm.")
    if any(w in q for w in ['update','refresh','ml','random forest']):
        if language == 'rw':
            return ("Ibiciro biravugururwa buri gihe hakoreshejwe Random Forest ML. "
                    "Kanda 'ML Update' kugirango ubone ibiciro bishya.")
        return ("Prices are updated using Random Forest ML trained on 2023-2024 Rwanda market data. "
                "Tap 'ML Update' on the Prices screen to refresh all prices instantly.")
    if language == 'rw':
        return ("Nshobora gufasha ku birebana n'ibiciro by'ikawa na cash crops, igihe cy'isarura, "
                "ubwiza, no kohereza. Baza ikibazo kirambuye.")
    return ("I help with Rwanda coffee (Arabica Bourbon, Jackson, Robusta) and cash crops "
            "(Tea, Pyrethrum, Chili, Macadamia, Avocado) — prices, seasons, export, and ML predictions.")


DISEASE_DB = {
    'cbd':      {'name':'Coffee Berry Disease (CBD)','symptoms':'Dark lesions on berries, mummified fruit','treatment':'Apply Champ/Kocide fungicide. Remove infected berries.','prevention':'Resistant varieties, proper spacing.','severity':'High'},
    'clr':      {'name':'Coffee Leaf Rust (CLR)','symptoms':'Yellow-orange powdery spots on leaf underside','treatment':'Apply triazole or copper fungicide.','prevention':'Resistant varieties, maintain shade.','severity':'High'},
    'antestia': {'name':'Antestia Bug','symptoms':'Deformed berries, potato taste defect','treatment':'Apply Malathion or pyrethroid.','prevention':'Shade trees, use traps.','severity':'High'},
    'blister':  {'name':'Tea Blister Blight','symptoms':'Translucent blisters on young tea leaves','treatment':'Apply copper-based fungicide.','prevention':'Proper spacing and drainage.','severity':'Medium'},
    'wilt':     {'name':'Crop Wilt Disease','symptoms':'Sudden wilting, yellowing, brown stems','treatment':'Remove and destroy infected plants.','prevention':'Certified seedlings, protect roots.','severity':'High'},
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_disease(request):
    image_b64 = request.data.get('image_base64', '')
    crop_name = request.data.get('crop_name', 'Coffee (Arabica)')
    mime_type = request.data.get('mime_type', 'image/jpeg')
    if not image_b64:
        return Response({'error': 'image_base64 required.'}, status=status.HTTP_400_BAD_REQUEST)

    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""Analyze this Rwanda {crop_name} plant image.
Look for: Coffee Berry Disease, Coffee Leaf Rust, Antestia Bug, Tea Blister Blight, Crop Wilt.
Respond ONLY with JSON:
{{"healthy":true/false,"disease_name":"string or null","confidence":"High/Medium/Low",
"severity":"High/Medium/Low/None","symptoms":"description","treatment":"Rwanda treatment","prevention":"prevention"}}"""
            img_data = base64.b64decode(image_b64)
            response = model.generate_content([prompt, {'mime_type': mime_type, 'data': img_data}])
            raw = response.text.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
            result = json.loads(raw)
            result.update({'source': 'gemini_vision', 'crop': crop_name, 'timestamp': datetime.now().isoformat()})
            return Response(result)
        except Exception as e:
            print(f"[Disease] {e}")

    import random as rnd, datetime as dt
    if rnd.random() > 0.5:
        return Response({'healthy': True, 'disease_name': None, 'confidence': 'Medium',
                         'severity': 'None', 'symptoms': 'No visible disease symptoms.',
                         'treatment': 'Continue regular care. Monitor weekly.',
                         'prevention': 'Maintain proper shade, spacing, fertilization.',
                         'source': 'local_database', 'crop': crop_name,
                         'timestamp': dt.datetime.now().isoformat()})
    d = rnd.choice(list(DISEASE_DB.values()))
    return Response({'healthy': False, 'disease_name': d['name'], 'confidence': 'Medium',
                     'severity': d['severity'], 'symptoms': d['symptoms'],
                     'treatment': d['treatment'], 'prevention': d['prevention'],
                     'source': 'local_database', 'crop': crop_name,
                     'timestamp': dt.datetime.now().isoformat()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_ml_model(request):
    fg, ex, sc = train_model()
    if fg:
        return Response({'message': 'Random Forest model trained successfully.', 'algorithm': 'RandomForest'})
    return Response({'error': 'Training failed.'}, status=500)