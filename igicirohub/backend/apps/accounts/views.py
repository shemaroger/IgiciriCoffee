from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, UserUpdateSerializer


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    s = RegisterSerializer(data=request.data)
    if s.is_valid():
        user = s.save()
        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        }, status=status.HTTP_201_CREATED)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    s = LoginSerializer(data=request.data)
    if s.is_valid():
        user = s.validated_data['user']
        return Response({
            'user': UserSerializer(user).data,
            'tokens': get_tokens(user),
        })
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    from rest_framework_simplejwt.serializers import TokenRefreshSerializer
    s = TokenRefreshSerializer(data=request.data)
    if s.is_valid():
        return Response(s.validated_data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    s = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(UserSerializer(request.user).data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        RefreshToken(request.data.get('refresh')).blacklist()
    except Exception:
        pass
    return Response({'message': 'Logged out.'})