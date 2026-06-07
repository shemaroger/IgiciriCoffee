from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from apps.accounts.models import CustomUser


def serialize_message(msg, current_user):
    return {
        'id': msg.id,
        'content': msg.content,
        'is_read': msg.is_read,
        'created_at': msg.created_at.isoformat(),
        'sender_id': msg.sender.id,
        'sender_name': msg.sender.display_name,
        'is_mine': msg.sender == current_user,
    }


def serialize_conversation(conv, current_user):
    other = conv.participants.exclude(id=current_user.id).first()
    last  = conv.last_message()
    return {
        'id': conv.id,
        'crop_name': conv.crop_name,
        'crop_price': str(conv.crop_price) if conv.crop_price else None,
        'crop_unit': conv.crop_unit,
        'other_user_id': other.id if other else None,
        'other_user_name': other.display_name if other else 'Unknown',
        'other_user_phone': other.phone if other else '',
        'unread_count': conv.unread_count(current_user),
        'last_message': last.content if last else '',
        'last_message_time': last.created_at.isoformat() if last else None,
        'updated_at': conv.updated_at.isoformat(),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations(request):
    convs = request.user.conversations.prefetch_related('participants', 'messages').all()
    return Response([serialize_conversation(c, request.user) for c in convs])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conv_id):
    conv = get_object_or_404(Conversation, id=conv_id, participants=request.user)
    # Mark messages as read
    conv.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
    msgs = conv.messages.all()
    return Response({
        'conversation': serialize_conversation(conv, request.user),
        'messages': [serialize_message(m, request.user) for m in msgs],
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """
    Start a new conversation OR send to existing.
    Body: { farmer_id, crop_name, crop_price, crop_unit, content }
    """
    farmer_id = request.data.get('farmer_id')
    crop_name = request.data.get('crop_name', '')
    crop_price = request.data.get('crop_price')
    crop_unit  = request.data.get('crop_unit', 'kg')
    content    = request.data.get('content', '').strip()

    if not content:
        return Response({'error': 'content is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        farmer = CustomUser.objects.get(pk=farmer_id)
    except (CustomUser.DoesNotExist, TypeError, ValueError):
        return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)

    if farmer == request.user:
        return Response({'error': 'Cannot message yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    # Find or create conversation
    conv = Conversation.objects.filter(
        participants=request.user
    ).filter(
        participants=farmer
    ).filter(crop_name=crop_name).first()

    if not conv:
        conv = Conversation.objects.create(
            crop_name=crop_name,
            crop_price=crop_price,
            crop_unit=crop_unit,
        )
        conv.participants.add(request.user, farmer)

    msg = Message.objects.create(conversation=conv, sender=request.user, content=content)
    conv.save()  # update updated_at

    return Response({
        'conversation_id': conv.id,
        'message': serialize_message(msg, request.user),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reply_message(request, conv_id):
    conv    = get_object_or_404(Conversation, id=conv_id, participants=request.user)
    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'content is required.'}, status=status.HTTP_400_BAD_REQUEST)
    msg = Message.objects.create(conversation=conv, sender=request.user, content=content)
    conv.save()
    return Response(serialize_message(msg, request.user), status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    total = sum(
        c.unread_count(request.user)
        for c in request.user.conversations.all()
    )
    return Response({'unread_count': total})
