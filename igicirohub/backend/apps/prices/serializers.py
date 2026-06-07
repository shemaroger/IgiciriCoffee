from rest_framework import serializers
from .models import CropPrice


class CropPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CropPrice
        fields = '__all__'