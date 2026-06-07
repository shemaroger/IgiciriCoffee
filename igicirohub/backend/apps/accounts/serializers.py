from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=4)
    password2 = serializers.CharField(write_only=True)
    username  = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = CustomUser
        fields = ['username', 'email', 'password', 'password2',
                  'first_name', 'last_name', 'role', 'phone',
                  'location', 'district', 'business_name', 'display_name']

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError('Email is required.')
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')

        # Auto-generate username from email
        base     = validated_data.get('email', '').split('@')[0]
        username = validated_data.get('username') or base
        if not username:
            username = base
        # Ensure unique username
        original = username
        n = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{original}{n}"
            n += 1
        validated_data['username'] = username

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField()
    role     = serializers.ChoiceField(choices=['cooperative', 'buyer'], required=False)

    def validate(self, data):
        email    = data['email'].lower()
        password = data['password']
        try:
            user_obj = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('No account with this email.')
        user = authenticate(username=user_obj.username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid password.')
        if not user.is_active:
            raise serializers.ValidationError('Account disabled.')
        role = data.get('role')
        if role and user.role != role:
            raise serializers.ValidationError(f'This account is registered as a {user.role}.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'location', 'district', 'business_name',
                  'display_name', 'avatar_url', 'is_verified', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'is_verified']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CustomUser
        fields = ['first_name', 'last_name', 'phone', 'location',
                  'district', 'business_name', 'display_name', 'avatar_url']