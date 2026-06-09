"""
Django REST Framework Serializers for Coffee Assistant
Handles data validation and response formatting
Location: apps/predictions/serializers.py
"""

from rest_framework import serializers


# =====================================================
# CONVERSATION MESSAGE SERIALIZER
# =====================================================

class ConversationMessageSerializer(serializers.Serializer):
    """
    Serializer for conversation history messages
    
    Used to validate and format conversation history
    in request/response data
    """
    role = serializers.ChoiceField(
        choices=['user', 'assistant'],
        help_text="Message role: 'user' or 'assistant'"
    )
    content = serializers.CharField(
        max_length=2000,
        help_text="Message content/text"
    )

    def validate_content(self, value):
        """Validate message content"""
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty")
        return value.strip()


# =====================================================
# COFFEE QUESTION SERIALIZER
# =====================================================

class CoffeeQuestionSerializer(serializers.Serializer):
    """
    Serializer for coffee assistant questions
    
    Validates incoming questions and metadata
    
    Fields:
    - question: The user's question (required)
    - category: Coffee topic category (optional)
    - language: Language code - 'en' or 'rw' (optional)
    - context: Additional context (optional)
    - history: Conversation history (optional)
    """

    question = serializers.CharField(
        max_length=500,
        min_length=3,
        help_text="The question about coffee (3-500 characters)"
    )

    category = serializers.CharField(
        max_length=50,
        required=False,
        default='General',
        help_text="Coffee category: Growing, Pricing & Markets, Processing, Quality & Grading, Health & Nutrition, or General"
    )

    language = serializers.ChoiceField(
        choices=['en', 'rw'],
        required=False,
        default='en',
        help_text="Language code: 'en' for English, 'rw' for Kinyarwanda"
    )

    context = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Additional context for the question"
    )

    history = ConversationMessageSerializer(
        many=True,
        required=False,
        default=list,
        help_text="Conversation history for context"
    )

    def validate_question(self, value):
        """
        Validate question
        
        - Must not be empty after stripping whitespace
        - Must be at least 3 characters
        - Must not be too long
        """
        if not value.strip():
            raise serializers.ValidationError(
                "Question cannot be empty or only whitespace"
            )
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Question must be at least 3 characters long"
            )
        
        return value.strip()

    def validate_category(self, value):
        """
        Validate category
        
        Must be one of the valid coffee categories
        """
        valid_categories = [
            'Growing',
            'Pricing & Markets',
            'Processing',
            'Quality & Grading',
            'Health & Nutrition',
            'General'
        ]
        
        if value and value not in valid_categories:
            raise serializers.ValidationError(
                f"Category must be one of: {', '.join(valid_categories)}. "
                f"Got: {value}"
            )
        
        return value

    def validate_language(self, value):
        """
        Validate language code
        
        Must be 'en' (English) or 'rw' (Kinyarwanda)
        """
        if value not in ['en', 'rw']:
            raise serializers.ValidationError(
                "Language must be 'en' (English) or 'rw' (Kinyarwanda)"
            )
        
        return value

    def validate_history(self, value):
        """
        Validate conversation history
        
        - Must be a list of message objects
        - Each message must have role and content
        """
        if value:
            if not isinstance(value, list):
                raise serializers.ValidationError(
                    "History must be a list of messages"
                )
            
            if len(value) > 20:
                raise serializers.ValidationError(
                    "History cannot exceed 20 messages"
                )
        
        return value


# =====================================================
# COFFEE RESPONSE SERIALIZER
# =====================================================

class CoffeeResponseSerializer(serializers.Serializer):
    """
    Serializer for coffee assistant responses
    
    Formats the response returned from Gemini API
    
    Fields:
    - success: Whether the request was successful
    - answer: The AI-generated answer
    - question: Echo of the question asked
    - category: The category of the question
    - language: The language of the response
    - model: The AI model used
    - error: Error message if unsuccessful
    """

    success = serializers.BooleanField(
        help_text="Whether the request was successful"
    )

    answer = serializers.CharField(
        help_text="The AI-generated answer about coffee"
    )

    question = serializers.CharField(
        required=False,
        help_text="Echo of the user's question"
    )

    category = serializers.CharField(
        required=False,
        help_text="The coffee category"
    )

    language = serializers.CharField(
        required=False,
        help_text="The response language"
    )

    model = serializers.CharField(
        required=False,
        help_text="The AI model used (e.g., gemini-1.5-flash)"
    )

    error = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Error message if unsuccessful"
    )


# =====================================================
# CONVERSATION HISTORY SERIALIZER
# =====================================================

class ConversationHistorySerializer(serializers.Serializer):
    """
    Serializer for conversation history response
    
    Returns the full conversation history
    """

    success = serializers.BooleanField(
        help_text="Whether the request was successful"
    )

    history = ConversationMessageSerializer(
        many=True,
        help_text="List of conversation messages"
    )

    count = serializers.IntegerField(
        help_text="Number of messages in history"
    )


# =====================================================
# HEALTH CHECK SERIALIZER
# =====================================================

class HealthCheckSerializer(serializers.Serializer):
    """
    Serializer for health check response
    
    Indicates service status and capabilities
    """

    success = serializers.BooleanField(
        help_text="Whether the service is healthy"
    )

    status = serializers.CharField(
        help_text="Service status (healthy/unhealthy)"
    )

    service = serializers.CharField(
        help_text="Service name"
    )

    ai_model = serializers.CharField(
        help_text="AI model being used"
    )

    languages = serializers.ListField(
        child=serializers.CharField(),
        help_text="Supported languages"
    )

    categories = serializers.ListField(
        child=serializers.CharField(),
        help_text="Supported coffee categories"
    )

    error = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Error message if unhealthy"
    )


# =====================================================
# CLEAR HISTORY RESPONSE SERIALIZER
# =====================================================

class ClearHistoryResponseSerializer(serializers.Serializer):
    """
    Serializer for clear history response
    """

    success = serializers.BooleanField(
        help_text="Whether the request was successful"
    )

    message = serializers.CharField(
        help_text="Success message"
    )

    error = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Error message if unsuccessful"
    )