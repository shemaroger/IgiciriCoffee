from django.db import models
from apps.accounts.models import CustomUser


class Conversation(models.Model):
    participants = models.ManyToManyField(CustomUser, related_name='conversations')
    crop_name    = models.CharField(max_length=100, blank=True)
    crop_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    crop_unit    = models.CharField(max_length=20, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def unread_count(self, user):
        return self.messages.filter(is_read=False).exclude(sender=user).count()

    def last_message(self):
        return self.messages.order_by('-created_at').first()

    def __str__(self):
        return f"Conversation about {self.crop_name}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_messages')
    content      = models.TextField()
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.display_name}: {self.content[:40]}"