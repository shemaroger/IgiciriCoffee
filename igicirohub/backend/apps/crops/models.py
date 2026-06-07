from django.db import models
from apps.accounts.models import CustomUser


class Crop(models.Model):
    STATUS_CHOICES = [
        ('listed',     'Listed'),
        ('harvesting', 'Harvesting'),
        ('sold',       'Sold'),
        ('inactive',   'Inactive'),
    ]
    CATEGORY_CHOICES = [
        ('vegetables', 'Vegetables'),
        ('grains',     'Grains'),
        ('fruits',     'Fruits'),
        ('tubers',     'Tubers'),
        ('legumes',    'Legumes'),
        ('other',      'Other'),
    ]

    farmer      = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='crops')
    name        = models.CharField(max_length=100)
    emoji       = models.CharField(max_length=20, default='☕')
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    quantity    = models.DecimalField(max_digits=10, decimal_places=2)
    unit        = models.CharField(max_length=20, default='kg')
    price       = models.DecimalField(max_digits=10, decimal_places=2)
    location    = models.CharField(max_length=100, blank=True)
    district    = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='listed')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.emoji} {self.name} by {self.farmer.display_name}"

    @property
    def quantity_display(self):
        return f"{self.quantity} {self.unit}"


class SavedCrop(models.Model):
    user     = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='saved_crops')
    crop     = models.ForeignKey(Crop, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'crop')
        ordering        = ['-saved_at']