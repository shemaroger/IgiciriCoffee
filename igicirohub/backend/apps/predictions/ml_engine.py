"""
IgiciroHub Coffee ML Price Prediction Engine
Rwanda Coffee ONLY - 6 Varieties
Algorithm: Random Forest
Seasons: Season A, Season B, Off Season
Price Types: Farm Gate, Cooperative, Export
"""
import os, json, random
import numpy as np
import joblib
from datetime import datetime

BASE_DIR      = os.path.dirname(__file__)
DATASET_PATH  = os.path.join(BASE_DIR, 'coffee_dataset.json')
MODEL_FG_PATH = os.path.join(BASE_DIR, 'model_farmgate.pkl')
MODEL_EX_PATH = os.path.join(BASE_DIR, 'model_export.pkl')
SCALER_PATH   = os.path.join(BASE_DIR, 'scaler.pkl')
META_PATH     = os.path.join(BASE_DIR, 'model_meta.json')

# ── Rwanda Coffee Varieties ONLY ──────────────────────────────────────────
VARIETIES = {
    'Bourbon Arabica': {
        'type': 'arabica', 'emoji': '☕',
        'base_farmgate_rwf': 1200,
        'base_cooperative_rwf': 1380,   # cooperative adds value
        'base_export_usd': 4.20,
        'description': 'Most common Rwanda Arabica variety',
    },
    'Red Bourbon': {
        'type': 'arabica', 'emoji': '☕',
        'base_farmgate_rwf': 1350,
        'base_cooperative_rwf': 1550,
        'base_export_usd': 5.10,
        'description': 'Premium red-fruited Bourbon, specialty grade',
    },
    'Yellow Bourbon': {
        'type': 'arabica', 'emoji': '☕',
        'base_farmgate_rwf': 1300,
        'base_cooperative_rwf': 1490,
        'base_export_usd': 4.80,
        'description': 'Yellow-fruited Bourbon, high altitude',
    },
    'Jackson': {
        'type': 'arabica', 'emoji': '☕',
        'base_farmgate_rwf': 1150,
        'base_cooperative_rwf': 1320,
        'base_export_usd': 4.00,
        'description': 'Traditional Rwanda Arabica variety',
    },
    'Mibirizi': {
        'type': 'arabica', 'emoji': '☕',
        'base_farmgate_rwf': 1100,
        'base_cooperative_rwf': 1260,
        'base_export_usd': 3.80,
        'description': 'Early Rwanda Arabica, good yield',
    },
    'Robusta': {
        'type': 'robusta', 'emoji': '🫘',
        'base_farmgate_rwf': 700,
        'base_cooperative_rwf': 820,
        'base_export_usd': 2.20,
        'description': 'Robusta coffee, used in blends',
    },
}

# ── Rwanda Coffee Seasons ─────────────────────────────────────────────────
SEASONS = {
    'Season A': {
        'months': [3, 4, 5, 6],  # Main harvest Mar-Jun
        'description': 'Main harvest season — high supply, lower prices',
        'price_factor': 0.85,
    },
    'Season B': {
        'months': [10, 11],  # Fly crop Oct-Nov
        'description': 'Fly crop season — moderate supply',
        'price_factor': 0.95,
    },
    'Off Season': {
        'months': [1, 2, 7, 8, 9, 12],  # Off season
        'description': 'Off season — low supply, higher prices',
        'price_factor': 1.15,
    },
}

# ── Price Types ────────────────────────────────────────────────────────────
PRICE_TYPES = {
    'Farm Gate':   {'multiplier': 1.00, 'description': 'Price paid directly to farmer'},
    'Cooperative': {'multiplier': 1.15, 'description': 'Price after cooperative processing'},
    'Export':      {'multiplier': None, 'description': 'International export price in USD'},
}

# ── Market Trend Indicators ────────────────────────────────────────────────
TREND_INDICATORS = {
    'rising':  {'label': 'Rising Market ↑',  'emoji': '📈', 'threshold': 3.0},
    'stable':  {'label': 'Stable Market →',  'emoji': '➡️', 'threshold': 1.0},
    'falling': {'label': 'Falling Market ↓', 'emoji': '📉', 'threshold': -999},
}


def get_season_for_month(month: int) -> str:
    for season_name, season_data in SEASONS.items():
        if month in season_data['months']:
            return season_name
    return 'Off Season'


def get_season_price_factor(month: int) -> float:
    season = get_season_for_month(month)
    return SEASONS[season]['price_factor']


def get_trend_indicator(change_pct: float) -> dict:
    if change_pct >= TREND_INDICATORS['rising']['threshold']:
        return {'key': 'rising', **TREND_INDICATORS['rising']}
    elif change_pct >= TREND_INDICATORS['stable']['threshold']:
        return {'key': 'stable', **TREND_INDICATORS['stable']}
    else:
        return {'key': 'falling', **TREND_INDICATORS['falling']}


def get_historical_data(variety_name: str, months: int = 6) -> list:
    """Generate historical price data for last N months."""
    now = datetime.now()
    variety = VARIETIES.get(variety_name, VARIETIES['Bourbon Arabica'])
    history = []
    for i in range(months, 0, -1):
        month = ((now.month - i - 1) % 12) + 1
        year  = now.year - ((now.month - i - 1) // 12 + 1 if (now.month - i) <= 0 else 0)
        sf    = get_season_price_factor(month)
        trend = 1.0 + 0.40 * ((year - 2023) * 12 + (month - 1)) / 23.0
        fg    = round(variety['base_farmgate_rwf'] * sf * trend + random.gauss(0, 20))
        coop  = round(fg * 1.15)
        ex    = round(variety['base_export_usd'] * sf * trend, 2)
        history.append({
            'month': month, 'year': year,
            'farmgate': max(400, fg),
            'cooperative': max(460, coop),
            'export_usd': max(1.0, ex),
            'season': get_season_for_month(month),
        })
    return history


def _build_features(record: dict) -> list:
    variety_name = record.get('variety', 'Bourbon Arabica')
    variety_data = VARIETIES.get(variety_name, VARIETIES['Bourbon Arabica'])
    month        = record.get('month', 1)
    year         = record.get('year', 2023)
    sf           = get_season_price_factor(month)
    trend_idx    = (year - 2023) * 12 + (month - 1)
    trend_factor = 1.0 + 0.45 * (trend_idx / 23.0)
    is_robusta   = 1.0 if variety_data['type'] == 'robusta' else 0.0
    return [
        float(month),
        float(year - 2023),
        sf,
        trend_factor,
        is_robusta,
        variety_data['base_farmgate_rwf'] / 1200.0,
        variety_data['base_export_usd'] / 4.20,
        float(get_season_for_month(month) == 'Season A'),
        float(get_season_for_month(month) == 'Season B'),
    ]


def _generate_training_data():
    """Generate 2023-2024 training records for all 6 varieties."""
    records = []
    for year in [2023, 2024]:
        for month in range(1, 13):
            trend = 1.0 + 0.45 * ((year - 2023) * 12 + (month - 1)) / 23.0
            sf    = get_season_price_factor(month)
            for vname, vdata in VARIETIES.items():
                fg   = round(max(400, vdata['base_farmgate_rwf'] * sf * trend + random.gauss(0, vdata['base_farmgate_rwf'] * 0.04)))
                coop = round(fg * 1.15)
                ex   = round(max(1.0, vdata['base_export_usd'] * sf * trend + random.gauss(0, 0.1)), 2)
                records.append({
                    'variety': vname, 'month': month, 'year': year,
                    'farmgate_rwf': fg, 'cooperative_rwf': coop, 'export_usd': ex,
                })
    return records


def train_model():
    """Train Random Forest on all 6 Rwanda coffee varieties."""
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.preprocessing import StandardScaler

        print("[ML] Generating training data for 6 coffee varieties...")
        records = _generate_training_data()
        X, y_fg, y_ex = [], [], []
        for r in records:
            X.append(_build_features(r))
            y_fg.append(r['farmgate_rwf'])
            y_ex.append(r['export_usd'])

        X = np.array(X)
        scaler = StandardScaler()
        Xs = scaler.fit_transform(X)

        print(f"[ML] Training Random Forest on {len(X)} records...")
        model_fg = RandomForestRegressor(n_estimators=200, max_depth=12, n_jobs=-1, random_state=42)
        model_ex = RandomForestRegressor(n_estimators=200, max_depth=12, n_jobs=-1, random_state=42)
        model_fg.fit(Xs, y_fg)
        model_ex.fit(Xs, y_ex)

        joblib.dump(model_fg, MODEL_FG_PATH)
        joblib.dump(model_ex, MODEL_EX_PATH)
        joblib.dump(scaler, SCALER_PATH)

        meta = {
            'algorithm': 'RandomForest',
            'n_estimators': 200,
            'trained_at': datetime.now().isoformat(),
            'n_samples': len(X),
            'varieties': list(VARIETIES.keys()),
            'seasons': list(SEASONS.keys()),
            'price_types': list(PRICE_TYPES.keys()),
        }
        with open(META_PATH, 'w') as f:
            json.dump(meta, f, indent=2)

        print(f"[ML] ✅ Random Forest trained on {len(X)} records")
        return model_fg, model_ex, scaler
    except Exception as e:
        print(f"[ML] Training failed: {e}")
        import traceback; traceback.print_exc()
        return None, None, None


def load_models():
    if all(os.path.exists(p) for p in [MODEL_FG_PATH, MODEL_EX_PATH, SCALER_PATH]):
        try:
            return joblib.load(MODEL_FG_PATH), joblib.load(MODEL_EX_PATH), joblib.load(SCALER_PATH)
        except Exception:
            pass
    return None, None, None


def predict_coffee_price(
    variety: str,
    price_type: str = 'Farm Gate',
    horizon_days: int = 30,
    historical_period: int = 6,
) -> dict:
    """
    Predict coffee price for a variety.
    No district — uses season-based prediction.
    """
    now   = datetime.now()
    month = now.month
    year  = now.year
    variety_data = VARIETIES.get(variety, VARIETIES['Bourbon Arabica'])
    current_season = get_season_for_month(month)

    model_fg, model_ex, scaler = load_models()
    if model_fg is None:
        model_fg, model_ex, scaler = train_model()

    results = []
    for offset in [0, 1, 2, 3]:
        pred_month = ((month - 1 + offset) % 12) + 1
        pred_year  = year + ((month - 1 + offset) // 12)
        record = {'variety': variety, 'month': pred_month, 'year': min(pred_year, 2025)}
        feat   = np.array([_build_features(record)])
        try:
            fs = scaler.transform(feat)
            fg = float(model_fg.predict(fs)[0])
            ex = float(model_ex.predict(fs)[0])
            method = 'random_forest'
        except Exception:
            sf = get_season_price_factor(pred_month)
            fg = variety_data['base_farmgate_rwf'] * sf * 1.35
            ex = variety_data['base_export_usd']   * sf * 1.35
            method = 'statistical'

        coop = fg * 1.15
        results.append({
            'month': pred_month, 'year': pred_year,
            'farmgate': max(400, round(fg)),
            'cooperative': max(460, round(coop)),
            'export_usd': max(1.0, round(ex, 2)),
        })

    current = results[0]
    future  = results[min(len(results) - 1, max(1, horizon_days // 30))]

    # Select price based on price_type
    if price_type == 'Export':
        cur_price  = current['export_usd']
        fut_price  = future['export_usd']
        price_unit = 'USD/kg'
    elif price_type == 'Cooperative':
        cur_price  = current['cooperative']
        fut_price  = future['cooperative']
        price_unit = 'RWF/kg'
    else:  # Farm Gate
        cur_price  = current['farmgate']
        fut_price  = future['farmgate']
        price_unit = 'RWF/kg'

    change_pct = round(((fut_price - cur_price) / (cur_price + 1e-9)) * 100, 2)
    trend_info = get_trend_indicator(change_pct)

    # Historical data
    history = get_historical_data(variety, historical_period)
    if price_type == 'Export':
        chart_data = [h['export_usd'] for h in history]
    elif price_type == 'Cooperative':
        chart_data = [h['cooperative'] for h in history]
    else:
        chart_data = [h['farmgate'] for h in history]

    # All 3 current prices
    recommendation = _build_recommendation(
        variety, price_type, horizon_days, change_pct, month, method, current_season, trend_info
    )

    return {
        'variety': variety,
        'variety_type': variety_data['type'],
        'emoji': variety_data['emoji'],
        'price_type': price_type,
        'price_unit': price_unit,
        'current_price': cur_price,
        'predicted_price': fut_price,
        'change_pct': change_pct,
        'trend': trend_info,
        'current_farmgate': current['farmgate'],
        'current_cooperative': current['cooperative'],
        'current_export_usd': current['export_usd'],
        'predicted_farmgate': future['farmgate'],
        'predicted_cooperative': future['cooperative'],
        'predicted_export_usd': future['export_usd'],
        'chart_data': chart_data,
        'chart_farmgate': [h['farmgate'] for h in history],
        'chart_cooperative': [h['cooperative'] for h in history],
        'chart_export': [h['export_usd'] for h in history],
        'season': current_season,
        'season_description': SEASONS[current_season]['description'],
        'confidence': 'High' if method == 'random_forest' else 'Medium',
        'method': method,
        'recommendation': recommendation,
        'horizon_days': horizon_days,
        'historical_months': historical_period,
    }


def _build_recommendation(variety, price_type, horizon_days, change_pct, month, method, season, trend):
    tag     = '🌲 Random Forest' if method == 'random_forest' else '📊 Stats'
    season_tip = {
        'Season A':   'Main harvest — high supply keeps prices lower.',
        'Season B':   'Fly crop — moderate prices expected.',
        'Off Season': 'Off season — low supply drives prices higher.',
    }.get(season, '')

    if change_pct >= 8:
        advice = f"Ibiciro by'{variety} biteganijwe kuzamuka cyane (+{change_pct:.1f}%). Fata icyemezo cyo kubika kawa yawe."
    elif change_pct >= 3:
        advice = f"Izamuka ryiza ry'ibiciro (+{change_pct:.1f}%). Gurisha mu minsi {horizon_days} ni byiza."
    elif change_pct >= -2:
        advice = f"Ibiciro biri guhagaze ({change_pct:+.1f}%). {season_tip}"
    else:
        advice = f"Ibiciro biteganijwe kumanuka ({change_pct:.1f}%). Fikiria kugurisha vuba."

    return f"{advice} | {trend['label']} | {tag}"


def auto_update_prices():
    """Auto-update all 6 coffee variety prices using Random Forest."""
    now   = datetime.now()
    month = now.month
    year  = now.year
    updates = []

    model_fg, model_ex, scaler = load_models()
    if model_fg is None:
        model_fg, model_ex, scaler = train_model()

    for variety_name, variety_data in VARIETIES.items():
        record = {'variety': variety_name, 'month': month, 'year': min(year, 2025)}
        feat   = np.array([_build_features(record)])
        try:
            fs   = scaler.transform(feat)
            fg   = max(400, round(float(model_fg.predict(fs)[0])))
            ex   = max(1.0, round(float(model_ex.predict(fs)[0]), 2))
        except Exception:
            sf = get_season_price_factor(month)
            fg = round(variety_data['base_farmgate_rwf'] * sf * 1.35)
            ex = round(variety_data['base_export_usd']   * sf * 1.35, 2)

        coop   = round(fg * 1.15)
        season = get_season_for_month(month)
        base   = variety_data['base_farmgate_rwf']
        change = round(((fg - base) / base) * 100, 1)
        trend  = get_trend_indicator(change)

        chart = []
        for offset in range(-5, 1):
            m  = ((month - 1 + offset) % 12) + 1
            sf = get_season_price_factor(m)
            chart.append(round(base * sf * 1.3))

        updates.append({
            'variety_name': variety_name,
            'emoji': variety_data['emoji'],
            'variety_type': variety_data['type'],
            'farmgate_rwf': fg,
            'cooperative_rwf': coop,
            'export_usd': ex,
            'change': change,
            'trend': trend['key'],
            'trend_label': trend['label'],
            'season': season,
            'chart_data': chart,
        })

    print(f"[ML] ✅ Auto-updated {len(updates)} coffee variety prices")
    return updates


def get_available_varieties():
    return [
        {
            'key': k.lower().replace(' ', '_'),
            'name': k,
            'type': v['type'],
            'emoji': v['emoji'],
            'base_farmgate_rwf': v['base_farmgate_rwf'],
            'base_cooperative_rwf': v['base_cooperative_rwf'],
            'base_export_usd': v['base_export_usd'],
            'description': v['description'],
        }
        for k, v in VARIETIES.items()
    ]


def get_seasons():
    return [
        {
            'name': k,
            'months': v['months'],
            'description': v['description'],
            'price_factor': v['price_factor'],
        }
        for k, v in SEASONS.items()
    ]


def get_price_types():
    return [
        {'key': k, 'description': v['description']}
        for k, v in PRICE_TYPES.items()
    ]