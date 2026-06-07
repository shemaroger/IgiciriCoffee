from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Crop, SavedCrop
from .serializers import CropSerializer, CropCreateSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def marketplace(request):
    qs = Crop.objects.filter(status='listed').select_related('farmer')
    category = request.GET.get('category')
    district = request.GET.get('district')
    search   = request.GET.get('search')
    if category:
        qs = qs.filter(category__iexact=category)
    if district:
        qs = qs.filter(district__iexact=district)
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
    return Response(CropSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_crops(request):
    qs = Crop.objects.filter(farmer=request.user).select_related('farmer')
    return Response(CropSerializer(qs, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_crop(request):
    if request.user.role not in ['farmer', 'cooperative']:
        return Response(
            {'error': 'Only cooperatives can post listings.'},
            status=status.HTTP_403_FORBIDDEN
        )
    s = CropCreateSerializer(data=request.data, context={'request': request})
    if s.is_valid():
        crop = s.save()
        return Response(
            CropSerializer(crop, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def crop_detail(request, pk):
    try:
        crop = Crop.objects.select_related('farmer').get(pk=pk)
    except Crop.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(CropSerializer(crop, context={'request': request}).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_crop(request, pk):
    try:
        crop = Crop.objects.get(pk=pk, farmer=request.user)
    except Crop.DoesNotExist:
        return Response({'error': 'Not found or not yours.'}, status=status.HTTP_404_NOT_FOUND)
    s = CropCreateSerializer(crop, data=request.data, partial=True, context={'request': request})
    if s.is_valid():
        s.save()
        return Response(CropSerializer(crop, context={'request': request}).data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_crop(request, pk):
    try:
        crop = Crop.objects.get(pk=pk, farmer=request.user)
    except Crop.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    crop.delete()
    return Response({'message': 'Crop deleted.'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_status(request, pk):
    try:
        crop = Crop.objects.get(pk=pk, farmer=request.user)
    except Crop.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    new_status = request.data.get('status')
    if new_status not in ['listed', 'harvesting', 'sold', 'inactive']:
        return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
    crop.status = new_status
    crop.save()
    return Response(CropSerializer(crop, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_crops(request):
    saved = SavedCrop.objects.filter(user=request.user).select_related('crop__farmer')
    crops = [s.crop for s in saved]
    return Response(CropSerializer(crops, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_crop(request):
    crop_id = request.data.get('crop_id')
    try:
        crop = Crop.objects.get(pk=crop_id)
    except Crop.DoesNotExist:
        return Response({'error': 'Crop not found.'}, status=status.HTTP_404_NOT_FOUND)
    SavedCrop.objects.get_or_create(user=request.user, crop=crop)
    return Response({'message': 'Saved.'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsave_crop(request, pk):
    SavedCrop.objects.filter(user=request.user, crop_id=pk).delete()
    return Response({'message': 'Removed from saved.'})