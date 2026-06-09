from django.db import models


class CropPrice(models.Model):
    SEASON_CHOICES = [
        ('Season A',   'Season A — Main Harvest'),
        ('Season B',   'Season B — Fly Crop'),
        ('Off Season', 'Off Season'),
    ]
    TREND_CHOICES = [
        ('rising',  'Rising Market'),
        ('stable',  'Stable Market'),
        ('falling', 'Falling Market'),
    ]

    name             = models.CharField(max_length=100)
    emoji            = models.CharField(max_length=20, default='☕')
    variety_type     = models.CharField(max_length=20, default='arabica')

    # Three price types
    farmgate_rwf     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cooperative_rwf  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    export_usd       = models.DecimalField(max_digits=8,  decimal_places=2, default=0)

    # Keep price as farmgate for backward compat
    price            = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit             = models.CharField(max_length=20, default='kg')
    change           = models.DecimalField(max_digits=6,  decimal_places=2, default=0)
    trend            = models.CharField(max_length=10, choices=TREND_CHOICES, default='stable')
    trend_label      = models.CharField(max_length=30, default='Stable Market →')

    # Season instead of district
    season           = models.CharField(max_length=20, choices=SEASON_CHOICES, default='Off Season')

    chart_data       = models.JSONField(default=list)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.emoji} {self.name}: {self.farmgate_rwf} RWF | ${self.export_usd}"