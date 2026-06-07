from django.urls import path
from . import views

urlpatterns = [
    path('register/',       views.register,           name='auth-register'),
    path('login/',          views.login,              name='auth-login'),
    path('token/refresh/',  views.token_refresh_view, name='token-refresh'),
    path('me/',             views.me,                 name='auth-me'),
    path('profile/update/', views.update_profile,     name='profile-update'),
    path('logout/',         views.logout,             name='auth-logout'),
]
