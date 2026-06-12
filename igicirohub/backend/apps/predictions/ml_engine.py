"""
IgiciroHub Coffee ML Price Prediction Engine
Real Rwanda Coffee Data: 2020-2026
Source: Rwanda Coffee Exports & Producer Prices Dataset
Algorithm: Random Forest
"""
import os, json, random
import numpy as np
import joblib
from datetime import datetime

BASE_DIR      = os.path.dirname(__file__)
MODEL_FG_PATH = os.path.join(BASE_DIR, 'model_farmgate.pkl')
MODEL_EX_PATH = os.path.join(BASE_DIR, 'model_export.pkl')
SCALER_PATH   = os.path.join(BASE_DIR, 'scaler.pkl')
META_PATH     = os.path.join(BASE_DIR, 'model_meta.json')

# ── Real Rwanda Coffee Data 2020-2026 ────────────────────────────────────
# Source: Rwanda Coffee Export Dataset (Coffeeprices2020-2026.xlsx)
RWANDA_REAL_DATA = {
    2020: {'export_usd_per_kg': 3.413622, 'producer_frw_per_kg': 216,  'export_kg': 16176203.5,  'export_usd': 55219441.03},
    2021: {'export_usd_per_kg': 4.479715, 'producer_frw_per_kg': 248,  'export_kg': 17479556.13, 'export_usd': 78303436.62},
    2022: {'export_usd_per_kg': 5.884733, 'producer_frw_per_kg': 410,  'export_kg': 17848692,    'export_usd': 105034794},
    2023: {'export_usd_per_kg': 5.007113, 'producer_frw_per_kg': 410,  'export_kg': 17536038,    'export_usd': 87804920},
    2024: {'export_usd_per_kg': 5.240076, 'producer_frw_per_kg': 480,  'export_kg': 17244657,    'export_usd': 90363306},
    2025: {'export_usd_per_kg': 6.229519, 'producer_frw_per_kg': 650,  'export_kg': 22347904,    'export_usd': 139216683.39},
    2026: {'export_usd_per_kg': 5.549103, 'producer_frw_per_kg': 750,  'export_kg': 4305875,     'export_usd': 23893744},
}

# ── Year-over-year growth rates derived from real data ─────────────────
# Producer price growth: 216->248->410->410->480->650->750 RWF/kg
# Export price growth:   3.41->4.48->5.88->5.01->5.24->6.23->5.55 USD/kg

# ── Rwanda Coffee Varieties ─────────────────────────────────────────────
VARIETIES = {
    'Bourbon Arabica': {
        'type': 'arabica', 'emoji': '☕',
        # Base multiplier relative to national average producer price
        'farmgate_multiplier': 1.00,   # baseline
        'cooperative_multiplier': 1.18,
        'export_multiplier': 1.05,
        'description': 'Most common Rwanda Arabica variety',
    },
    'Red Bourbon': {
        'type': 'arabica', 'emoji': '☕',
        'farmgate_multiplier': 1.12,
        'cooperative_multiplier': 1.28,
        'export_multiplier': 1.18,
        'description': 'Premium red-fruited Bourbon, specialty grade',
    },
    'Yellow Bourbon': {
        'type': 'arabica', 'emoji': '☕',
        'farmgate_multiplier': 1.08,
        'cooperative_multiplier': 1.24,
        'export_multiplier': 1.14,
        'description': 'Yellow-fruited Bourbon, high altitude',
    },
    'Jackson': {
        'type': 'arabica', 'emoji': '☕',
        'farmgate_multiplier': 0.95,
        'cooperative_multiplier': 1.10,
        'export_multiplier': 0.98,
        'description': 'Traditional Rwanda Arabica variety',
    },
    'Mibirizi': {
        'type': 'arabica', 'emoji': '☕',
        'farmgate_multiplier': 0.92,
        'cooperative_multiplier': 1.06,
        'export_multiplier': 0.94,
        'description': 'Early Rwanda Arabica, good yield',
    },
    'Robusta': {
        'type': 'robusta', 'emoji': '🫘',
        'farmgate_multiplier': 0.58,
        'cooperative_multiplier': 0.68,
        'export_multiplier': 0.52,
        'description': 'Robusta coffee, used in blends',
    },
}

# ── Rwanda Coffee Seasons ────────────────────────────────────────────────
SEASONS = {
    'Season A': {
        'months': [3, 4, 5, 6],
        'description': 'Main harvest season (Mar-Jun) — high supply, prices DROP',
        'price_factor': 0.88,
    },
    'Season B': {
        'months': [10, 11],
        'description': 'Fly crop season (Oct-Nov) — moderate supply',
        'price_factor': 0.96,
    },
    'Off Season': {
        'months': [1, 2, 7, 8, 9, 12],
        'description': 'Off season (Jul-Sep, Dec-Feb) — low supply, prices RISE',
        'price_factor': 1.14,
    },
}

PRICE_TYPES = {
    'Farm Gate':   {'description': 'Price paid directly to farmer at harvest'},
    'Cooperative': {'description': 'Price after cooperative processing and grading'},
    'Export':      {'description': 'International export price in USD/kg'},
}

TREND_INDICATORS = {
    'rising':  {'label': 'Rising Market ↑',  'emoji': '📈', 'threshold': 3.0},
    'stable':  {'label': 'Stable Market →',  'emoji': '➡️', 'threshold': 1.0},
    'falling': {'label': 'Falling Market ↓', 'emoji': '📉', 'threshold': -999},
}


def get_season_for_month(month: int) -> str:
    for name, data in SEASONS.items():
        if month in data['months']:
            return name
    return 'Off Season'


def get_season_price_factor(month: int) -> float:
    return SEASONS[get_season_for_month(month)]['price_factor']


def get_trend_indicator(change_pct: float) -> dict:
    if change_pct >= TREND_INDICATORS['rising']['threshold']:
        return {'key': 'rising', **TREND_INDICATORS['rising']}
    elif change_pct >= TREND_INDICATORS['stable']['threshold']:
        return {'key': 'stable', **TREND_INDICATORS['stable']}
    else:
        return {'key': 'falling', **TREND_INDICATORS['falling']}


def _get_base_price_for_year(year: int) -> dict:
    """Get real Rwanda producer & export prices for a given year."""
    if year in RWANDA_REAL_DATA:
        return RWANDA_REAL_DATA[year]
    # Extrapolate beyond 2026 using 2025-2026 trend
    last_year = max(RWANDA_REAL_DATA.keys())
    last_data = RWANDA_REAL_DATA[last_year]
    # Use 2024→2025 growth rate for extrapolation
    prev_data = RWANDA_REAL_DATA[2024]
    fg_growth = last_data['producer_frw_per_kg'] / prev_data['producer_frw_per_kg']
    ex_growth = last_data['export_usd_per_kg']   / prev_data['export_usd_per_kg']
    years_ahead = year - last_year
    return {
        'producer_frw_per_kg': last_data['producer_frw_per_kg'] * (fg_growth ** years_ahead),
        'export_usd_per_kg':   last_data['export_usd_per_kg']   * (ex_growth ** years_ahead),
    }


def _generate_training_data():
    """
    Generate monthly training records 2020-2026 for all 6 varieties.
    Uses REAL Rwanda annual data interpolated to monthly with seasonal factors.
    Total: 7 years × 12 months × 6 varieties = 504 records
    """
    records = []
    years = list(RWANDA_REAL_DATA.keys())

    for year in years:
        base = _get_base_price_for_year(year)
        base_fg = base['producer_frw_per_kg']
        base_ex = base['export_usd_per_kg']

        for month in range(1, 13):
            # Skip future months in 2026 (data only Jan-Apr)
            if year == 2026 and month > 4:
                continue

            sf     = get_season_price_factor(month)
            season = get_season_for_month(month)

            for vname, vdata in VARIETIES.items():
                # Apply variety multiplier + seasonal factor + small noise
                fg   = base_fg * vdata['farmgate_multiplier'] * sf
                fg   = max(100, round(fg + random.gauss(0, fg * 0.03)))
                coop = round(fg * vdata['cooperative_multiplier'] / vdata['farmgate_multiplier'])
                ex   = base_ex * vdata['export_multiplier'] * sf
                ex   = max(0.5, round(ex + random.gauss(0, ex * 0.02), 2))

                records.append({
                    'variety':          vname,
                    'year':             year,
                    'month':            month,
                    'farmgate_rwf':     fg,
                    'cooperative_rwf':  coop,
                    'export_usd':       ex,
                    'season':           season,
                    'base_fg':          base_fg,
                    'base_ex':          base_ex,
                })
    return records


def _build_features(record: dict) -> list:
    """9 features for Random Forest."""
    variety_data = VARIETIES.get(record['variety'], VARIETIES['Bourbon Arabica'])
    month        = record['month']
    year         = record['year']
    sf           = get_season_price_factor(month)

    # Year trend index: 0 at 2020, scales with real price growth
    base_2020_fg = RWANDA_REAL_DATA[2020]['producer_frw_per_kg']
    base_year_fg = record.get('base_fg', base_2020_fg)
    trend_factor = base_year_fg / base_2020_fg

    return [
        float(month),
        float(year - 2020),
        sf,
        trend_factor,
        1.0 if variety_data['type'] == 'robusta' else 0.0,
        variety_data['farmgate_multiplier'],
        variety_data['export_multiplier'],
        float(get_season_for_month(month) == 'Season A'),
        float(get_season_for_month(month) == 'Season B'),
    ]


def train_model():
    """Train Random Forest on real Rwanda coffee data 2020-2026."""
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.preprocessing import StandardScaler

        print("[ML] Generating training data from Rwanda coffee dataset (2020-2026)...")
        records = _generate_training_data()
        print(f"[ML] Generated {len(records)} training records")

        X, y_fg, y_coop, y_ex = [], [], [], []
        for r in records:
            X.append(_build_features(r))
            y_fg.append(r['farmgate_rwf'])
            y_coop.append(r['cooperative_rwf'])
            y_ex.append(r['export_usd'])

        X = np.array(X)
        scaler = StandardScaler()
        Xs     = scaler.fit_transform(X)

        print("[ML] Training Random Forest (200 estimators)...")
        model_fg   = RandomForestRegressor(n_estimators=200, max_depth=14, n_jobs=-1, random_state=42)
        model_ex   = RandomForestRegressor(n_estimators=200, max_depth=14, n_jobs=-1, random_state=42)
        model_fg.fit(Xs, y_fg)
        model_ex.fit(Xs, y_ex)

        joblib.dump(model_fg, MODEL_FG_PATH)
        joblib.dump(model_ex, MODEL_EX_PATH)
        joblib.dump(scaler,   SCALER_PATH)

        # Print real data summary
        print("\n[ML] Real Rwanda Coffee Price Data Used:")
        print(f"{'Year':<6} {'Producer(RWF)':<15} {'Export(USD)':<12} {'ExportVol(kg)':<15}")
        for yr, d in RWANDA_REAL_DATA.items():
            print(f"{yr:<6} {d['producer_frw_per_kg']:<15} {d['export_usd_per_kg']:<12.4f} {d['export_kg']:<15,.0f}")

        meta = {
            'algorithm':       'RandomForest',
            'n_estimators':    200,
            'max_depth':       14,
            'trained_at':      datetime.now().isoformat(),
            'n_samples':       len(X),
            'data_source':     'Rwanda Coffee Exports 2020-2026',
            'years':           list(RWANDA_REAL_DATA.keys()),
            'varieties':       list(VARIETIES.keys()),
            'seasons':         list(SEASONS.keys()),
            'price_types':     list(PRICE_TYPES.keys()),
            'real_data': {
                str(yr): {
                    'producer_frw_per_kg': d['producer_frw_per_kg'],
                    'export_usd_per_kg':   d['export_usd_per_kg'],
                }
                for yr, d in RWANDA_REAL_DATA.items()
            }
        }
        with open(META_PATH, 'w') as f:
            json.dump(meta, f, indent=2)

        print(f"\n[ML] ✅ Random Forest trained on {len(X)} records from real Rwanda data")
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
    """Predict coffee price using Random Forest trained on real Rwanda data."""
    now    = datetime.now()
    month  = now.month
    year   = now.year
    variety_data   = VARIETIES.get(variety, VARIETIES['Bourbon Arabica'])
    current_season = get_season_for_month(month)

    model_fg, model_ex, scaler = load_models()
    if model_fg is None:
        model_fg, model_ex, scaler = train_model()

    # Get real base prices for current year
    base = _get_base_price_for_year(min(year, 2026))

    results = []
    for offset in range(4):
        pred_month = ((month - 1 + offset) % 12) + 1
        pred_year  = year + ((month - 1 + offset) // 12)
        use_year   = min(pred_year, 2026)

        base_pred = _get_base_price_for_year(use_year)
        record = {
            'variety': variety, 'month': pred_month, 'year': use_year,
            'base_fg': base_pred['producer_frw_per_kg'],
            'base_ex': base_pred['export_usd_per_kg'],
        }
        feat = np.array([_build_features(record)])
        try:
            fs   = scaler.transform(feat)
            fg   = float(model_fg.predict(fs)[0])
            ex   = float(model_ex.predict(fs)[0])
            method = 'random_forest'
        except Exception:
            sf = get_season_price_factor(pred_month)
            fg = base['producer_frw_per_kg'] * variety_data['farmgate_multiplier'] * sf
            ex = base['export_usd_per_kg']   * variety_data['export_multiplier']   * sf
            method = 'statistical'

        coop = fg * (variety_data['cooperative_multiplier'] / variety_data['farmgate_multiplier'])
        results.append({
            'month': pred_month, 'year': pred_year,
            'farmgate':    max(100, round(fg)),
            'cooperative': max(120, round(coop)),
            'export_usd':  max(0.5, round(ex, 2)),
        })

    current = results[0]
    future  = results[min(len(results)-1, max(1, horizon_days // 30))]

    if price_type == 'Export':
        cur_price = current['export_usd']
        fut_price = future['export_usd']
        price_unit = 'USD/kg'
    elif price_type == 'Cooperative':
        cur_price = current['cooperative']
        fut_price = future['cooperative']
        price_unit = 'RWF/kg'
    else:
        cur_price = current['farmgate']
        fut_price = future['farmgate']
        price_unit = 'RWF/kg'

    change_pct = round(((fut_price - cur_price) / (cur_price + 1e-9)) * 100, 2)
    trend_info = get_trend_indicator(change_pct)

    # Historical chart using real data
    history    = _get_historical(variety, historical_period, base['producer_frw_per_kg'], base['export_usd_per_kg'], variety_data)
    if price_type == 'Export':
        chart_data = [h['export_usd'] for h in history]
    elif price_type == 'Cooperative':
        chart_data = [h['cooperative'] for h in history]
    else:
        chart_data = [h['farmgate'] for h in history]

    recommendation = _build_recommendation(variety, price_type, horizon_days, change_pct, month, method, current_season, trend_info)

    return {
        'variety':               variety,
        'variety_type':          variety_data['type'],
        'emoji':                 variety_data['emoji'],
        'price_type':            price_type,
        'price_unit':            price_unit,
        'current_price':         cur_price,
        'predicted_price':       fut_price,
        'change_pct':            change_pct,
        'trend':                 trend_info,
        'current_farmgate':      current['farmgate'],
        'current_cooperative':   current['cooperative'],
        'current_export_usd':    current['export_usd'],
        'predicted_farmgate':    future['farmgate'],
        'predicted_cooperative': future['cooperative'],
        'predicted_export_usd':  future['export_usd'],
        'chart_data':            chart_data,
        'chart_farmgate':        [h['farmgate']    for h in history],
        'chart_cooperative':     [h['cooperative'] for h in history],
        'chart_export':          [h['export_usd']  for h in history],
        'season':                current_season,
        'season_description':    SEASONS[current_season]['description'],
        'confidence':            'High' if method == 'random_forest' else 'Medium',
        'method':                method,
        'recommendation':        recommendation,
        'horizon_days':          horizon_days,
        'historical_months':     historical_period,
        # Real data reference
        'real_2025_producer_frw': RWANDA_REAL_DATA[2025]['producer_frw_per_kg'],
        'real_2025_export_usd':   RWANDA_REAL_DATA[2025]['export_usd_per_kg'],
        'real_2026_producer_frw': RWANDA_REAL_DATA[2026]['producer_frw_per_kg'],
        'real_2026_export_usd':   RWANDA_REAL_DATA[2026]['export_usd_per_kg'],
    }


def _get_historical(variety: str, months: int, base_fg: float, base_ex: float, vdata: dict) -> list:
    now = datetime.now()
    result = []
    for i in range(months, 0, -1):
        m = ((now.month - i - 1) % 12) + 1
        y = now.year - ((now.month - i - 1) // 12 + 1 if (now.month - i) <= 0 else 0)
        sf = get_season_price_factor(m)
        # Use real data if available for that year
        real = _get_base_price_for_year(min(y, 2026))
        fg   = max(100, round(real['producer_frw_per_kg'] * vdata['farmgate_multiplier'] * sf))
        coop = round(fg * vdata['cooperative_multiplier'] / vdata['farmgate_multiplier'])
        ex   = max(0.5, round(real['export_usd_per_kg'] * vdata['export_multiplier'] * sf, 2))
        result.append({
            'month': m, 'year': y,
            'farmgate': fg, 'cooperative': coop, 'export_usd': ex,
            'season': get_season_for_month(m),
        })
    return result


def _build_recommendation(variety, price_type, horizon_days, change_pct, month, method, season, trend):
    tag = '🌲 Random Forest (Real Rwanda Data)' if method == 'random_forest' else '📊 Statistical'
    season_tip = {
        'Season A':   'Main harvest — high supply keeps prices lower.',
        'Season B':   'Fly crop — moderate prices expected.',
        'Off Season': 'Off season — low supply drives prices higher.',
    }.get(season, '')
    if change_pct >= 8:
        advice = f"Ibiciro by'{variety} biteganijwe kuzamuka cyane (+{change_pct:.1f}%). Fata icyemezo cyo kubika kawa yawe."
    elif change_pct >= 3:
        advice = f"Izamuka ryiza (+{change_pct:.1f}%). Gurisha mu minsi {horizon_days} ni byiza."
    elif change_pct >= -2:
        advice = f"Ibiciro biri guhagaze ({change_pct:+.1f}%). {season_tip}"
    else:
        advice = f"Ibiciro biteganijwe kumanuka ({change_pct:.1f}%). Fikiria kugurisha vuba."
    return f"{advice} | {trend['label']} | {tag}"


def auto_update_prices():
    """Auto-update all prices using Random Forest trained on real Rwanda data."""
    now   = datetime.now()
    month = now.month
    year  = now.year
    base  = _get_base_price_for_year(min(year, 2026))

    model_fg, model_ex, scaler = load_models()
    if model_fg is None:
        model_fg, model_ex, scaler = train_model()

    updates = []
    for vname, vdata in VARIETIES.items():
        record = {
            'variety': vname, 'month': month, 'year': min(year, 2026),
            'base_fg': base['producer_frw_per_kg'],
            'base_ex': base['export_usd_per_kg'],
        }
        feat = np.array([_build_features(record)])
        try:
            fs   = scaler.transform(feat)
            fg   = max(100, round(float(model_fg.predict(fs)[0])))
            ex   = max(0.5, round(float(model_ex.predict(fs)[0]), 2))
        except Exception:
            sf = get_season_price_factor(month)
            fg = round(base['producer_frw_per_kg'] * vdata['farmgate_multiplier'] * sf)
            ex = round(base['export_usd_per_kg']   * vdata['export_multiplier']   * sf, 2)

        coop    = round(fg * vdata['cooperative_multiplier'] / vdata['farmgate_multiplier'])
        season  = get_season_for_month(month)
        base_fg = base['producer_frw_per_kg'] * vdata['farmgate_multiplier']
        change  = round(((fg - base_fg) / base_fg) * 100, 1)
        trend   = get_trend_indicator(change)

        # 6-month chart from real data
        chart = []
        for offset in range(-5, 1):
            m   = ((month - 1 + offset) % 12) + 1
            yr  = min(year + ((month - 1 + offset) // 12), 2026)
            sf  = get_season_price_factor(m)
            rb  = _get_base_price_for_year(yr)
            chart.append(max(100, round(rb['producer_frw_per_kg'] * vdata['farmgate_multiplier'] * sf)))

        updates.append({
            'variety_name':    vname,
            'emoji':           vdata['emoji'],
            'variety_type':    vdata['type'],
            'farmgate_rwf':    fg,
            'cooperative_rwf': coop,
            'export_usd':      ex,
            'change':          change,
            'trend':           trend['key'],
            'trend_label':     trend['label'],
            'season':          season,
            'chart_data':      chart,
        })

    print(f"[ML] ✅ Updated {len(updates)} varieties using real Rwanda coffee data 2020-2026")
    return updates


def get_available_varieties():
    return [
        {
            'key':         k.lower().replace(' ', '_'),
            'name':        k,
            'type':        v['type'],
            'emoji':       v['emoji'],
            'description': v['description'],
        }
        for k, v in VARIETIES.items()
    ]


def get_seasons():
    return [
        {
            'name':         k,
            'months':       v['months'],
            'description':  v['description'],
            'price_factor': v['price_factor'],
        }
        for k, v in SEASONS.items()
    ]


def get_price_types():
    return [
        {'key': k, 'description': v['description']}
        for k, v in PRICE_TYPES.items()
    ]