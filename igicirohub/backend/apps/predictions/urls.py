from django.urls import path
from . import views

urlpatterns = [
    path('available-crops/',  views.available_crops,      name='available-crops'),
    path('seasons/',          views.seasons_list,         name='seasons'),
    path('run/',              views.run_prediction,       name='run-prediction'),
    path('history/',          views.prediction_history,   name='prediction-history'),
    path('ask/',              views.ask_assistant,        name='ask-assistant'),
    path('voice/',            views.voice_assistant,      name='voice-assistant'),
    path('detect-disease/',   views.detect_disease,       name='detect-disease'),
    path('train/',            views.train_ml_model,       name='train-model'),
    path('update-prices/',    views.update_market_prices, name='update-prices'),
    path('model-info/',       views.model_info,           name='model-info'),
]