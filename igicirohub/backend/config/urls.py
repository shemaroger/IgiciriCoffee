from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',        include('apps.accounts.urls')),
    path('api/crops/',       include('apps.crops.urls')),
    path('api/prices/',      include('apps.prices.urls')),
    path('api/predictions/', include('apps.predictions.urls')),
    path('api/chat/',        include('apps.chat.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
