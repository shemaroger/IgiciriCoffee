#!/usr/bin/env python
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.accounts.models import CustomUser
from apps.crops.models import Crop
from apps.prices.models import CropPrice
from apps.predictions.ml_engine import train_model, auto_update_prices

print("🌱 Seeding IgiciroHub — Coffee Only...\n")

coop, _ = CustomUser.objects.get_or_create(
    email='farmer@test.com',
    defaults=dict(username='jean_cooperative', role='cooperative', first_name='Jean',
                  last_name='Baptiste', phone='+250788123456', location='Huye',
                  district='Huye', display_name='Jean Baptiste Coffee Coop')
)
if coop.role == 'farmer': coop.role = 'cooperative'
coop.set_password('1234'); coop.save()
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

print("\n🌲 Training Random Forest on 6 coffee varieties...")
fg, ex, sc = train_model()
print("✅ Random Forest trained!" if fg else "⚠️  Fallback mode")

print("\n📊 Auto-updating prices...")
CropPrice.objects.all().delete()
updates = auto_update_prices()
for u in updates:
    CropPrice.objects.create(
        name=u['variety_name'], emoji=u['emoji'], variety_type=u['variety_type'],
        farmgate_rwf=u['farmgate_rwf'], cooperative_rwf=u['cooperative_rwf'],
        export_usd=u['export_usd'], price=u['farmgate_rwf'],
        unit='kg', change=u['change'], trend=u['trend'],
        trend_label=u['trend_label'], season=u['season'], chart_data=u['chart_data'],
    )
    print(f"✅ {u['emoji']} {u['variety_name']} | FG:{u['farmgate_rwf']} | COOP:{u['cooperative_rwf']} | ${u['export_usd']} | {u['trend_label']}")

Crop.objects.filter(farmer=coop).delete()
crops = [
    ('Bourbon Arabica Cherry',  '☕', 2000, 1580, 'Huye',       'Fully washed, hand-picked. SCA 85+'),
    ('Red Bourbon Parchment',   '☕',  800, 1650, 'Nyamasheke', 'Dried parchment, natural process'),
    ('Yellow Bourbon Green Bean','☕', 500, 5200, 'Gakenke',    'Export-ready, fully washed 60kg bags'),
    ('Jackson Cherry',          '☕', 1500, 1450, 'Rulindo',    'Fresh cherry, multiple varieties'),
    ('Mibirizi Parchment',      '☕',  600, 1380, 'Nyaruguru',  'Sun-dried natural process'),
    ('Robusta Green Bean',      '🫘', 1500,  780, 'Kayonza',   'Clean Robusta, good for blending'),
]
for name, emoji, qty, price, loc, desc in crops:
    Crop.objects.create(
        farmer=coop, name=name, emoji=emoji, category='other',
        quantity=qty, unit='kg', price=price, location=loc,
        district=loc, description=desc, status='listed'
    )
    print(f"✅ {emoji} {name}")

print(f"\n🎉 Seed complete!")
print(f"   Varieties: Bourbon Arabica, Red Bourbon, Yellow Bourbon, Jackson, Mibirizi, Robusta")
print(f"   Prices: Farm Gate | Cooperative | Export")
print(f"   Seasons: Season A | Season B | Off Season")
print(f"   farmer@test.com / buyer@test.com → 1234")