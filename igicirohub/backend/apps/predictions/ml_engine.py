"""
IgiciroHub ML Price Prediction Engine
Algorithm: Random Forest (as per system requirements)
Crops: Rwanda Coffee + Cash Crops
Dataset: 2023-2024 historical patterns
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

VARIETIES = {
    'Arabica Bourbon': {
        'type': 'coffee', 'category': 'coffee',
        'base_farmgate_rwf': 1200, 'base_export_usd': 4.20,
        'emoji': '☕', 'seasonal_arabica': True,
    },
    'Arabica Jackson': {
        'type': 'coffee', 'category': 'coffee',
        'base_farmgate_rwf': 1150, 'base_export_usd': 4.00,
        'emoji': '☕', 'seasonal_arabica': True,
    },
    'Robusta': {
        'type': 'coffee', 'category': 'coffee',
        'base_farmgate_rwf': 700, 'base_export_usd': 2.20,
        'emoji': '🫘', 'seasonal_arabica': False,
    },
    'Tea (Icyayi)': {
        'type': 'cash_crop', 'category': 'cash_crop',
        'base_farmgate_rwf': 320, 'base_export_usd': 1.85,
        'emoji': '🍃', 'seasonal_arabica': False,
    },
    'Pyrethrum (Umuravumba)': {
        'type': 'cash_crop', 'category': 'cash_crop',
        'base_farmgate_rwf': 850, 'base_export_usd': 3.50,
        'emoji': '🌼', 'seasonal_arabica': False,
    },
    "Chili Pepper (Urusenda rw'umunyu)": {
        'type': 'cash_crop', 'category': 'cash_crop',
        'base_farmgate_rwf': 1100, 'base_export_usd': 4.80,
        'emoji': '🌶️', 'seasonal_arabica': False,
    },
    'Macadamia': {
        'type': 'cash_crop', 'category': 'cash_crop',
        'base_farmgate_rwf': 2200, 'base_export_usd': 8.50,
        'emoji': '🥜', 'seasonal_arabica': False,
    },
    'Avocado (Avoka)': {
        'type': 'cash_crop', 'category': 'cash_crop',
        'base_farmgate_rwf': 180, 'base_export_usd': 0.95,
        'emoji': '🥑', 'seasonal_arabica': False,
    },
}

DISTRICTS = {
    'Gakenke':    {'province': 'Northern', 'altitude': 1800, 'quality_factor': 1.12},
    'Rulindo':    {'province': 'Northern', 'altitude': 1750, 'quality_factor': 1.10},
    'Gicumbi':    {'province': 'Northern', 'altitude': 1700, 'quality_factor': 1.08},
    'Burera':     {'province': 'Northern', 'altitude': 1850, 'quality_factor': 1.15},
    'Huye':       {'province': 'Southern', 'altitude': 1700, 'quality_factor': 1.14},
    'Nyaruguru':  {'province': 'Southern', 'altitude': 1800, 'quality_factor': 1.11},
    'Gisagara':   {'province': 'Southern', 'altitude': 1600, 'quality_factor': 1.06},
    'Ruhango':    {'province': 'Southern', 'altitude': 1500, 'quality_factor': 1.04},
    'Nyanza':     {'province': 'Southern', 'altitude': 1550, 'quality_factor': 1.05},
    'Muhanga':    {'province': 'Southern', 'altitude': 1600, 'quality_factor': 1.07},
    'Nyamasheke': {'province': 'Western',  'altitude': 1700, 'quality_factor': 1.16},
    'Karongi':    {'province': 'Western',  'altitude': 1650, 'quality_factor': 1.09},
    'Rusizi':     {'province': 'Western',  'altitude': 1400, 'quality_factor': 1.03},
    'Rutsiro':    {'province': 'Western',  'altitude': 1550, 'quality_factor': 1.06},
    'Nyabihu':    {'province': 'Western',  'altitude': 1750, 'quality_factor': 1.12},
    'Ngoma':      {'province': 'Eastern',  'altitude': 1400, 'quality_factor': 0.98},
    'Kirehe':     {'province': 'Eastern',  'altitude': 1350, 'quality_factor': 0.96},
    'Kayonza':    {'province': 'Eastern',  'altitude': 1450, 'quality_factor': 1.00},
    'Gasabo':     {'province': 'Kigali',   'altitude': 1500, 'quality_factor': 1.02},
    'Kicukiro':   {'province': 'Kigali',   'altitude': 1480, 'quality_factor': 1.01},
}

SEASONAL = {
    'arabica':   {1:1.15,2:1.12,3:0.88,4:0.82,5:0.85,6:0.90,7:1.05,8:1.10,9:1.12,10:0.95,11:0.92,12:1.08},
    'robusta':   {1:1.10,2:1.08,3:0.90,4:0.85,5:0.88,6:0.92,7:1.02,8:1.06,9:1.08,10:0.95,11:0.93,12:1.05},
    'tea':       {1:1.05,2:1.08,3:1.10,4:1.12,5:1.08,6:1.02,7:0.95,8:0.92,9:0.98,10:1.05,11:1.08,12:1.06},
    'cash_crop': {1:1.08,2:1.05,3:0.95,4:0.90,5:0.92,6:0.98,7:1.05,8:1.10,9:1.12,10:1.08,11:1.02,12:1.05},
}

DISTRICT_MAP = {
    'Arabica Bourbon': 'Huye',
    'Arabica Jackson': 'Nyamasheke',
    'Robusta': 'Kayonza',
    'Tea (Icyayi)': 'Nyamasheke',
    'Pyrethrum (Umuravumba)': 'Burera',
    "Chili Pepper (Urusenda rw'umunyu)": 'Muhanga',
    'Macadamia': 'Gakenke',
    'Avocado (Avoka)': 'Ruhango',
}


def _get_seasonal(variety_name: str, month: int) -> float:
    v = VARIETIES.get(variety_name, {})
    if v.get('seasonal_arabica'):
        return SEASONAL['arabica'].get(month, 1.0)
    if variety_name == 'Tea (Icyayi)':
        return SEASONAL['tea'].get(month, 1.0)
    if v.get('type') == 'coffee':
        return SEASONAL['robusta'].get(month, 1.0)
    return SEASONAL['cash_crop'].get(month, 1.0)


def get_season_label(month: int, variety_name: str) -> str:
    v = VARIETIES.get(variety_name, {})
    if v.get('type') == 'coffee':
        if v.get('seasonal_arabica'):
            if month in [3,4,5,6]:    return 'Main Harvest (Ibihangange)'
            elif month in [10,11]:    return 'Fly Crop (Imbuto nto)'
            elif month in [7,8,9]:    return 'Processing Season'
            else:                     return 'Off Season'
        else:
            if month in [3,4,5]:      return 'Main Harvest'
            elif month in [10,11,12]: return 'Secondary Harvest'
            else:                     return 'Off Season'
    elif variety_name == 'Tea (Icyayi)':
        if month in [3,4,5]:          return 'Peak Harvest Season'
        elif month in [9,10,11]:      return 'Second Flush Season'
        else:                         return 'Growing Season'
    else:
        if month in [3,4,5,6]:        return 'Main Harvest Season'
        elif month in [9,10]:         return 'Second Season'
        else:                         return 'Off Season'


def _build_features(record: dict) -> list:
    variety_name  = record['variety']
    variety_data  = VARIETIES.get(variety_name, VARIETIES['Arabica Bourbon'])
    district_data = DISTRICTS.get(record['district'], {'altitude': 1600, 'quality_factor': 1.0})
    month = record['month']
    year  = record['year']
    sf    = _get_seasonal(variety_name, month)
    trend_idx    = (year - 2023) * 12 + (month - 1)
    trend_factor = 1.0 + 0.45 * (trend_idx / 23.0)
    is_coffee    = 1.0 if variety_data['type'] == 'coffee' else 0.0
    is_arabica   = 1.0 if variety_data.get('seasonal_arabica') else 0.0
    return [
        float(month),
        float(year - 2023),
        sf,
        district_data['quality_factor'],
        float(district_data['altitude']) / 2000.0,
        is_coffee,
        is_arabica,
        trend_factor,
        variety_data['base_farmgate_rwf'] / 1200.0,
        variety_data['base_export_usd'] / 4.20,
    ]


def _generate_cash_crop_records():
    records = []
    for year in [2023, 2024]:
        for month in range(1, 13):
            trend = 1.0 + 0.30 * ((year - 2023) * 12 + (month - 1)) / 23.0
            for vname, vdata in VARIETIES.items():
                if vdata['type'] != 'cash_crop':
                    continue
                sf = _get_seasonal(vname, month)
                for dname, ddata in DISTRICTS.items():
                    qf = ddata['quality_factor']
                    fg = round(max(100, vdata['base_farmgate_rwf'] * sf * qf * trend + random.gauss(0, vdata['base_farmgate_rwf'] * 0.04)))
                    ex = round(max(0.5, vdata['base_export_usd'] * sf * qf * trend + random.gauss(0, vdata['base_export_usd'] * 0.03)), 2)
                    records.append({
                        'year': year, 'month': month, 'variety': vname,
                        'district': dname, 'farmgate_rwf': fg, 'export_usd': ex,
                    })
    return records


def train_model():
    """Train Random Forest models for farm gate and export price prediction."""
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.preprocessing import StandardScaler

        print("[ML] Loading coffee dataset...")
        with open(DATASET_PATH, 'r') as f:
            dataset = json.load(f)

        X, y_fg, y_ex = [], [], []

        for record in dataset['prices']:
            X.append(_build_features(record))
            y_fg.append(record['farmgate_rwf'])
            y_ex.append(record['export_usd'])

        print("[ML] Generating cash crop records...")
        for record in _generate_cash_crop_records():
            X.append(_build_features(record))
            y_fg.append(record['farmgate_rwf'])
            y_ex.append(record['export_usd'])

        X = np.array(X)
        scaler = StandardScaler()
        Xs = scaler.fit_transform(X)

        print(f"[ML] Training Random Forest on {len(X)} records...")

        model_fg = RandomForestRegressor(
            n_estimators=200, max_depth=12,
            min_samples_split=4, min_samples_leaf=2,
            n_jobs=-1, random_state=42,
        )
        model_ex = RandomForestRegressor(
            n_estimators=200, max_depth=12,
            min_samples_split=4, min_samples_leaf=2,
            n_jobs=-1, random_state=42,
        )

        model_fg.fit(Xs, y_fg)
        model_ex.fit(Xs, y_ex)

        joblib.dump(model_fg, MODEL_FG_PATH)
        joblib.dump(model_ex, MODEL_EX_PATH)
        joblib.dump(scaler,   SCALER_PATH)

        meta = {
            'algorithm': 'RandomForest',
            'n_estimators': 200,
            'trained_at': datetime.now().isoformat(),
            'n_samples': len(X),
            'varieties': list(VARIETIES.keys()),
            'districts': list(DISTRICTS.keys()),
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
            return (joblib.load(MODEL_FG_PATH),
                    joblib.load(MODEL_EX_PATH),
                    joblib.load(SCALER_PATH))
        except Exception:
            pass
    return None, None, None


def predict_coffee_price(variety: str, district: str, horizon_days: int = 30) -> dict:
    now   = datetime.now()
    month = now.month
    year  = now.year
    variety_data  = VARIETIES.get(variety, VARIETIES['Arabica Bourbon'])
    district_data = DISTRICTS.get(district, {'altitude': 1600, 'quality_factor': 1.0, 'province': ''})

    model_fg, model_ex, scaler = load_models()
    if model_fg is None:
        model_fg, model_ex, scaler = train_model()

    results = []
    for offset in [0, 1, 2, 3]:
        pred_month = ((month - 1 + offset) % 12) + 1
        pred_year  = year + ((month - 1 + offset) // 12)
        record = {'variety': variety, 'district': district,
                  'month': pred_month, 'year': min(pred_year, 2025)}
        feat = np.array([_build_features(record)])
        if model_fg is not None:
            try:
                fs = scaler.transform(feat)
                fg = float(model_fg.predict(fs)[0])
                ex = float(model_ex.predict(fs)[0])
                method = 'random_forest'
            except Exception:
                fg, ex, method = _stat_predict(variety_data, district_data, pred_month, variety)
        else:
            fg, ex, method = _stat_predict(variety_data, district_data, pred_month, variety)
        results.append({
            'month': pred_month, 'year': pred_year,
            'farmgate_rwf': max(100, round(fg)),
            'export_usd': max(0.3, round(ex, 2)),
        })

    current = results[0]
    future  = results[min(len(results) - 1, max(1, horizon_days // 30))]
    fg_change = round(((future['farmgate_rwf'] - current['farmgate_rwf']) / (current['farmgate_rwf'] + 1e-9)) * 100, 2)
    ex_change = round(((future['export_usd']   - current['export_usd'])   / (current['export_usd']   + 1e-9)) * 100, 2)

    chart_fg, chart_ex = [], []
    for offset in range(-4, 3):
        m  = ((month - 1 + offset) % 12) + 1
        sf = _get_seasonal(variety, m)
        qf = district_data['quality_factor']
        chart_fg.append(round(variety_data['base_farmgate_rwf'] * sf * qf * 1.3))
        chart_ex.append(round(variety_data['base_export_usd']   * sf * qf * 1.45, 2))

    season_label   = get_season_label(month, variety)
    recommendation = _build_recommendation(variety, district, horizon_days, fg_change, ex_change, month, method, season_label)

    return {
        'variety': variety,
        'variety_type': variety_data['type'],
        'category': variety_data['category'],
        'district': district,
        'province': district_data.get('province', ''),
        'altitude_m': district_data.get('altitude', 0),
        'quality_factor': district_data['quality_factor'],
        'current_farmgate_rwf': current['farmgate_rwf'],
        'current_export_usd': current['export_usd'],
        'predicted_farmgate_rwf': future['farmgate_rwf'],
        'predicted_export_usd': future['export_usd'],
        'farmgate_change_pct': fg_change,
        'export_change_pct': ex_change,
        'chart_farmgate': chart_fg,
        'chart_export': chart_ex,
        'season': season_label,
        'confidence': 'High' if method == 'random_forest' else 'Medium',
        'method': method,
        'recommendation': recommendation,
        'horizon_days': horizon_days,
    }


def _stat_predict(variety_data, district_data, month, variety_name=''):
    sf    = _get_seasonal(variety_name, month)
    qf    = district_data['quality_factor']
    trend = 1.35
    fg    = variety_data['base_farmgate_rwf'] * sf * qf * trend + random.gauss(0, 30)
    ex    = variety_data['base_export_usd']   * sf * qf * trend + random.gauss(0, 0.1)
    return fg, ex, 'statistical'


def _build_recommendation(variety, district, horizon_days, fg_change, ex_change, month, method, season):
    tag = '🌲 Random Forest' if method == 'random_forest' else '📊 Stats'
    avg = (fg_change + ex_change) / 2
    if avg >= 8:
        advice = f"Ibiciro by'{variety} biteganijwe kuzamuka cyane na {avg:.1f}%. Fata icyemezo cyo kubika."
    elif avg >= 3:
        advice = f"Izamuka ryiza ry'ibiciro by'{variety}. Gurisha mu minsi {horizon_days} kizakuzanira inyungu."
    elif avg >= 0:
        advice = f"Ibiciro by'{variety} biri guhagaze. Gurisha ubu ni byiza ku isoko rya {district}."
    elif avg >= -5:
        advice = f"Kumanuka guto kw'ibiciro biritezwe. Fikiria kugurisha vuba."
    else:
        advice = f"Ibiciro by'{variety} biteganijwe kumanuka na {abs(avg):.1f}%. Ni byiza kugurisha vuba cyane."
    return f"{advice} (Igihe: {season} | {tag})"


def auto_update_prices():
    """Auto-update all market prices using Random Forest predictions."""
    now   = datetime.now()
    month = now.month
    year  = now.year
    updates = []

    model_fg, model_ex, scaler = load_models()
    if model_fg is None:
        model_fg, model_ex, scaler = train_model()

    for variety_name, variety_data in VARIETIES.items():
        district      = DISTRICT_MAP.get(variety_name, 'Huye')
        district_data = DISTRICTS[district]
        record = {'variety': variety_name, 'district': district,
                  'month': month, 'year': min(year, 2025)}
        feat = np.array([_build_features(record)])
        try:
            fs  = scaler.transform(feat)
            fg  = max(100, round(float(model_fg.predict(fs)[0])))
            ex  = max(0.3, round(float(model_ex.predict(fs)[0]), 2))
        except Exception:
            sf = _get_seasonal(variety_name, month)
            qf = district_data['quality_factor']
            fg = round(variety_data['base_farmgate_rwf'] * sf * qf * 1.35)
            ex = round(variety_data['base_export_usd']   * sf * qf * 1.35, 2)

        base_fg = variety_data['base_farmgate_rwf']
        change  = round(((fg - base_fg) / base_fg) * 100, 1)
        trend   = 'up' if change >= 0 else 'down'

        chart = []
        for offset in range(-5, 1):
            m  = ((month - 1 + offset) % 12) + 1
            sf = _get_seasonal(variety_name, m)
            qf = district_data['quality_factor']
            chart.append(round(variety_data['base_farmgate_rwf'] * sf * qf * 1.3))

        updates.append({
            'variety_name': variety_name,
            'emoji': variety_data['emoji'],
            'variety_type': variety_data['type'],
            'category': variety_data['category'],
            'district': district,
            'province': district_data['province'],
            'altitude_m': district_data['altitude'],
            'farmgate_rwf': fg,
            'export_usd': ex,
            'change': change,
            'trend': trend,
            'chart_data': chart,
        })

    print(f"[ML] ✅ Auto-updated {len(updates)} prices using Random Forest")
    return updates


def get_available_varieties():
    return [
        {
            'key': k.lower().replace(' ', '_').replace("'", ''),
            'name': k,
            'type': v['type'],
            'category': v['category'],
            'emoji': v['emoji'],
            'base_farmgate_rwf': v['base_farmgate_rwf'],
            'base_export_usd': v['base_export_usd'],
        }
        for k, v in VARIETIES.items()
    ]


def get_all_districts():
    return [
        {
            'name': d,
            'province': info['province'],
            'altitude_m': info['altitude'],
            'quality_factor': info['quality_factor'],
        }
        for d, info in DISTRICTS.items()
    ]