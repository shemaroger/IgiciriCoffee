from django.urls import path
from . import views

urlpatterns = [
    path('conversations/',                     views.conversations,         name='conversations'),
    path('conversations/<int:conv_id>/',       views.conversation_messages, name='conv-messages'),
    path('conversations/<int:conv_id>/reply/', views.reply_message,         name='reply-message'),
    path('send/',                              views.send_message,          name='send-message'),
    path('unread/',                            views.unread_count,          name='unread-count'),
]