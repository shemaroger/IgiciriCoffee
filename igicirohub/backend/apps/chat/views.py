from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Conversation, Message
from apps.accounts.models import CustomUser


def serialize_conversation(conv, user):
    last = conv.last_message()
    other = conv.participants.exclude(id=user.id).first()
    return {
        'id':           conv.id,
        'crop_name':    conv.crop_name,
        'crop_price':   str(conv.crop_price) if conv.crop_price else None,
        'crop_unit':    conv.crop_unit,
        'unread_count': conv.unread_count(user),
        'updated_at':   conv.updated_at.isoformat(),
        'created_at':   conv.created_at.isoformat(),
        'other_user': {
            'id':           other.id if other else None,
            'name':         other.display_name if other else 'Unknown',
            'role':         other.role if other else '',
            'phone':        other.phone if other else '',
            'district':     other.district if other else '',
        } if other else None,
        'last_message': {
            'content':    last.content,
            'sender_id':  last.sender_id,
            'is_read':    last.is_read,
            'created_at': last.created_at.isoformat(),
        } if last else None,
    }


def serialize_message(msg, user):
    return {
        'id':         msg.id,
        'content':    msg.content,
        'sender_id':  msg.sender_id,
        'sender_name': msg.sender.display_name,
        'is_mine':    msg.sender_id == user.id,
        'is_read':    msg.is_read,
        'created_at': msg.created_at.isoformat(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations(request):
    convs = Conversation.objects.filter(
        participants=request.user
    ).prefetch_related('participants', 'messages__sender')
    return Response([serialize_conversation(c, request.user) for c in convs])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conv_id):
    try:
        conv = Conversation.objects.prefetch_related(
            'participants', 'messages__sender'
        ).get(id=conv_id, participants=request.user)
    except Conversation.DoesNotExist:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Mark all unread messages as read
    conv.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    messages = conv.messages.select_related('sender').all()
    return Response({
        'conversation': serialize_conversation(conv, request.user),
        'messages':     [serialize_message(m, request.user) for m in messages],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """Start a new conversation or find existing one."""
    farmer_id  = request.data.get('farmer_id')
    crop_name  = request.data.get('crop_name', '')
    crop_price = request.data.get('crop_price')
    crop_unit  = request.data.get('crop_unit', 'kg')
    content    = request.data.get('content', '').strip()

    if not content:
        return Response({'error': 'Message content required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not farmer_id:
        return Response({'error': 'farmer_id required.'}, status=status.HTTP_400_BAD_REQUEST)
    if farmer_id == request.user.id:
        return Response({'error': 'Cannot message yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        other_user = CustomUser.objects.get(id=farmer_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Find existing conversation between these two users about this crop
    existing = Conversation.objects.filter(
        participants=request.user
    ).filter(
        participants=other_user
    ).filter(
        crop_name=crop_name
    ).first()

    if existing:
        conv = existing
    else:
        conv = Conversation.objects.create(
            crop_name=crop_name,
            crop_price=crop_price,
            crop_unit=crop_unit,
        )
        conv.participants.add(request.user, other_user)

    msg = Message.objects.create(
        conversation=conv,
        sender=request.user,
        content=content,
    )

    return Response({
        'conversation_id': conv.id,
        'message':         serialize_message(msg, request.user),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reply_message(request, conv_id):
    """Reply to an existing conversation."""
    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Message content required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        conv = Conversation.objects.get(id=conv_id, participants=request.user)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

    msg = Message.objects.create(
        conversation=conv,
        sender=request.user,
        content=content,
    )
    conv.save()  # update updated_at

    return Response(serialize_message(msg, request.user), status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    convs = Conversation.objects.filter(participants=request.user)
    total = sum(c.unread_count(request.user) for c in convs)
    return Response({'unread_count': total})