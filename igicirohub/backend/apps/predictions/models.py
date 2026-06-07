from django.db import models
from apps.accounts.models import CustomUser


class PredictionHistory(models.Model):
    user             = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='predictions')
    crop_name        = models.CharField(max_length=100)
    district         = models.CharField(max_length=100)
    province         = models.CharField(max_length=100, blank=True)
    horizon_days     = models.IntegerField(default=7)
    current_price    = models.DecimalField(max_digits=10, decimal_places=2)
    predicted_change = models.DecimalField(max_digits=6, decimal_places=2)
    confidence       = models.CharField(max_length=20, default='Medium')
    method           = models.CharField(max_length=30, default='ml')
    recommendation   = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.crop_name} in {self.district}: {self.predicted_change:+.1f}%"
