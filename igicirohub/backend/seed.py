#!/usr/bin/env python
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.accounts.models import CustomUser
from apps.crops.models import Crop
from apps.prices.models import CropPrice
from apps.predictions.ml_engine import train_model, auto_update_prices

print("🌱 Seeding IgiciroHub Coffee + Cash Crops...\n")

cooperative, _ = CustomUser.objects.get_or_create(
    email='farmer@test.com',
    defaults=dict(username='jean_cooperative', role='cooperative', first_name='Jean',
                  last_name='Baptiste', phone='+250788123456', location='Huye',
                  district='Huye', display_name='Jean Baptiste Coffee Coop')
)
if cooperative.role == 'farmer':
    cooperative.role = 'cooperative'
cooperative.set_password('1234'); cooperative.save()
print("✅ Cooperative: farmer@test.com / 1234")

buyer, _ = CustomUser.objects.get_or_create(
    email='buyer@test.com',
    defaults=dict(username='marie_buyer', role='buyer', first_name='Marie',
                  last_name='Claire', phone='+250788234567', location='Kigali',
                  district='Gasabo', display_name='Marie Claire Exports Ltd')
)
buyer.set_password('1234'); buyer.save()
print("✅ Buyer: buyer@test.com / 1234")

CustomUser.objects.filter(role='farmer').update(role='cooperative')

print("\n🌲 Training Random Forest model...")
model_fg, model_ex, scaler = train_model()
print("✅ Random Forest trained!" if model_fg else "⚠️  Training failed")

print("\n📊 Auto-updating prices using Random Forest ML...")
CropPrice.objects.all().delete()
updates = auto_update_prices()
for u in updates:
    CropPrice.objects.create(
        name=u['variety_name'], emoji=u['emoji'],
        price=u['farmgate_rwf'], export_usd=u['export_usd'],
        unit='kg', change=u['change'], trend=u['trend'],
        variety_type=u['variety_type'], location=u['district'],
        district=u['district'], province=u['province'],
        altitude_m=u['altitude_m'], chart_data=u['chart_data'],
    )
    print(f"✅ {u['emoji']} {u['variety_name']} ({u['district']}) = {u['farmgate_rwf']} RWF | ${u['export_usd']}/kg")

Crop.objects.filter(farmer=cooperative).delete()
crops_data = [
    ('Arabica Bourbon Cherry',    '☕','other',2000,'kg', 1580,'Huye',      'Huye',      'Fully washed Arabica Bourbon, hand-picked. SCA score 85+'),
    ('Arabica Jackson Parchment', '☕','other', 800,'kg', 1520,'Nyamasheke','Nyamasheke','Dried parchment coffee, natural process. Altitude 1700m'),
    ('Robusta Green Bean',        '🫘','other',1500,'kg',  780,'Kayonza',   'Kayonza',   'Clean Robusta green bean, good for blending'),
    ('Arabica Bourbon Green Bean','☕','other', 500,'kg', 5200,'Huye',      'Huye',      'Export-ready green bean, fully washed, 60kg bags'),
    ('Fresh Tea Leaves',          '🍃','other',3000,'kg',  320,'Nyamasheke','Nyamasheke','First flush green tea, hand-picked from high altitude'),
    ('Dried Pyrethrum Flowers',   '🌼','other', 400,'kg',  850,'Burera',    'Burera',    'Sun-dried pyrethrum for natural insecticide production'),
    ('Red Chili Pepper',          '🌶️','other', 200,'kg', 1100,'Muhanga',   'Muhanga',   'Dried red chili, cleaned and sorted for export'),
    ('Macadamia Nuts',            '🥜','other', 300,'kg', 2200,'Gakenke',   'Gakenke',   'Premium macadamia nuts, shelled and graded for export'),
    ('Hass Avocado',              '🥑','other',2500,'kg',  180,'Ruhango',   'Ruhango',   'Ripe Hass avocados, export quality. Min order 500kg'),
]
for name,emoji,cat,qty,unit,price,loc,dist,desc in crops_data:
    Crop.objects.create(
        farmer=cooperative, name=name, emoji=emoji, category=cat,
        quantity=qty, unit=unit, price=price, location=loc,
        district=dist, description=desc, status='listed'
    )
    print(f"✅ {emoji} {name}")

print(f"\n🎉 Seed complete!")
print(f"   Coffee: Arabica Bourbon, Arabica Jackson, Robusta")
print(f"   Cash Crops: Tea, Pyrethrum, Chili Pepper, Macadamia, Avocado")
print(f"   Algorithm: Random Forest | Prices: {len(updates)} ML-updated")
print(f"   farmer@test.com / buyer@test.com → password: 1234")