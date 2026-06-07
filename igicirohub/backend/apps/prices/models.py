from django.db import models


class CropPrice(models.Model):
    name         = models.CharField(max_length=100)
    emoji        = models.CharField(max_length=10, default='☕')
    price        = models.DecimalField(max_digits=10, decimal_places=2)
    export_usd   = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    unit         = models.CharField(max_length=20, default='kg')
    change       = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    trend        = models.CharField(max_length=10, default='up')
    variety_type = models.CharField(max_length=20, default='arabica')
    location     = models.CharField(max_length=100, blank=True)
    district     = models.CharField(max_length=100, blank=True)
    province     = models.CharField(max_length=100, blank=True)
    altitude_m   = models.IntegerField(default=1600)
    chart_data   = models.JSONField(default=list)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.emoji} {self.name}: {self.price} RWF/kg | ${self.export_usd}/kg"