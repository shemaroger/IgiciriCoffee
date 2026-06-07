from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [('cooperative', 'Cooperative'), ('buyer', 'Buyer')]

    role          = models.CharField(max_length=20, choices=ROLE_CHOICES, default='cooperative')
    phone         = models.CharField(max_length=20, blank=True)
    location      = models.CharField(max_length=100, blank=True)
    district      = models.CharField(max_length=100, blank=True)
    business_name = models.CharField(max_length=100, blank=True)
    display_name  = models.CharField(max_length=100, blank=True)
    avatar_url    = models.URLField(blank=True)
    is_verified   = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_joined']

    def save(self, *args, **kwargs):
        if not self.display_name:
            self.display_name = self.get_full_name() or self.username
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.display_name} ({self.role})"