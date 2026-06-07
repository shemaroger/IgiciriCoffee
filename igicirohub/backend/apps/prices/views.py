from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import CropPrice
from .serializers import CropPriceSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def price_list(request):
    qs = CropPrice.objects.all()
    district = request.GET.get('district')
    search   = request.GET.get('search')
    trending = request.GET.get('trending')
    if district:
        qs = qs.filter(district__iexact=district)
    if search:
        qs = qs.filter(name__icontains=search)
    if trending == 'true':
        qs = qs.filter(trend='up').order_by('-change')[:6]
    return Response(CropPriceSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def price_detail(request, pk):
    try:
        p = CropPrice.objects.get(pk=pk)
    except CropPrice.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    return Response(CropPriceSerializer(p).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def trending(request):
    qs = CropPrice.objects.filter(trend='up').order_by('-change')[:6]
    return Response(CropPriceSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def districts(request):
    ds = CropPrice.objects.values_list('district', flat=True).distinct()
    return Response({'districts': sorted(d for d in ds if d)})
