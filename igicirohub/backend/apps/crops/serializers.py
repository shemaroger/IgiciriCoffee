from rest_framework import serializers
from .models import Crop, SavedCrop


class CropSerializer(serializers.ModelSerializer):
    farmer_id        = serializers.IntegerField(source='farmer.id',        read_only=True)
    farmer_name      = serializers.CharField(source='farmer.display_name', read_only=True)
    farmer_phone     = serializers.CharField(source='farmer.phone',        read_only=True)
    quantity_display = serializers.SerializerMethodField()
    is_saved         = serializers.SerializerMethodField()

    class Meta:
        model  = Crop
        fields = [
            'id', 'name', 'emoji', 'category', 'quantity', 'unit',
            'quantity_display', 'price', 'location', 'district',
            'description', 'status', 'farmer_id', 'farmer_name',
            'farmer_phone', 'is_saved', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'farmer_id', 'farmer_name', 'farmer_phone']

    def get_quantity_display(self, obj):
        return f"{obj.quantity} {obj.unit}"

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedCrop.objects.filter(user=request.user, crop=obj).exists()
        return False


class CropCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Crop
        fields = ['name', 'emoji', 'category', 'quantity', 'unit',
                  'price', 'location', 'district', 'description', 'status']

    def validate_price(self, v):
        if float(v) <= 0:
            raise serializers.ValidationError("Price must be > 0.")
        return v

    def validate_quantity(self, v):
        if float(v) <= 0:
            raise serializers.ValidationError("Quantity must be > 0.")
        return v

    def create(self, validated_data):
        return Crop.objects.create(farmer=self.context['request'].user, **validated_data)