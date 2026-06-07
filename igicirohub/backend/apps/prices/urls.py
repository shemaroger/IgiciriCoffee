from django.urls import path
from . import views

urlpatterns = [
    path('list/',            views.price_list,   name='price-list'),
    path('<int:pk>/detail/', views.price_detail, name='price-detail'),
    path('trending/',        views.trending,     name='price-trending'),
    path('districts/',       views.districts,    name='price-districts'),
]
