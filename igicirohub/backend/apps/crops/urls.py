from django.urls import path
from . import views

urlpatterns = [
    path('marketplace/',        views.marketplace,    name='marketplace'),
    path('my-crops/',           views.my_crops,       name='my-crops'),
    path('create/',             views.create_crop,    name='crop-create'),
    path('<int:pk>/detail/',    views.crop_detail,    name='crop-detail'),
    path('<int:pk>/update/',    views.update_crop,    name='crop-update'),
    path('<int:pk>/delete/',    views.delete_crop,    name='crop-delete'),
    path('<int:pk>/status/',    views.update_status,  name='crop-status'),
    path('saved/',              views.saved_crops,    name='saved-crops'),
    path('save/',               views.save_crop,      name='save-crop'),
    path('<int:pk>/unsave/',    views.unsave_crop,    name='unsave-crop'),
]
