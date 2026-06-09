"""
Django Service for Google Gemini API Integration
Handles all coffee-related AI queries
"""

import os
import logging
from typing import Optional, Dict, List
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# =====================================================
# COFFEE SYSTEM PROMPTS
# =====================================================

COFFEE_SYSTEM_PROMPT_EN = """You are an expert coffee consultant with deep knowledge about:
- Coffee cultivation and farming in East Africa (especially Rwanda)
- Coffee processing methods (wet/dry fermentation, roasting)
- Coffee quality grading and specialty grades
- Coffee pricing and market trends
- Coffee health benefits and nutrition
- Coffee equipment and tools
- Sustainable coffee farming practices

IMPORTANT INSTRUCTIONS:
1. Always provide accurate, practical advice based on proven coffee farming methods
2. Include specific information relevant to Rwanda and East African climate
3. When discussing prices, provide realistic estimates but note they vary by season and quality
4. Recommend sustainable and organic practices when possible
5. Be encouraging to small-scale farmers and cooperatives
6. Always mention if professional help is needed for complex issues
7. Provide step-by-step explanations for processes
8. Include tips for improving quality and productivity
9. Keep responses concise but comprehensive (2-3 paragraphs max)
10. Use bullet points for lists (max 5 items)
11. If you don't know something, admit it and suggest reliable sources

RESPONSE FORMAT:
- Practical and actionable advice
- Include specific examples when relevant
- End with actionable next steps when appropriate
- Clear, simple language avoiding unnecessary jargon"""

COFFEE_SYSTEM_PROMPT_RW = """Wowe ari umuhanga mu gicuruzabirema cya kawa. Ufite ubumenyi bunini ku:
- Kubereka kawa mu Bufaranga (cyane cyane mu Rwanda)
- Uburyo bwo gukorana kawa (ubwoko bwa metili n'ubwoko bwa kumara mu ijo)
- Agahako k'akawa n'imisusire y'agaciro
- Ibiciro by'akawa n'imikorere y'ibaruva
- Ubwenge bw'akawa ku mubiri
- Ibikoresho byo gukorana kawa
- Uburyo bw'ubwenge bwo gubereka kawa

ITEGEKO RY'IBYO UGENZI:
1. Tanga inyifuzo nziza kandi ntandukanye
2. Shyiramo amakuru atandukanye ku Rwanda
3. Mugihe uwu wambaza ibiciro, gabira amakuru arigenga arivo
4. Shyiramo ibipimo by'ubwenge bw'agaciro
5. Someza abashira b'akawa nke
6. Emeza cyangwa umuntu w'ubumenyi ukeneye
7. Gabira inzira nyinshi z'ibikorwa
8. Gabira iyambire yo kunezanya agaciro
9. Koreka imyumvire nubwiyunge (parograpufu 2-3 gusa)
10. Gumba ibisigiti bitandukanye (ibiciro 5 gusa)
11. Niba ntazi, emeza kandi tanga inzira yo kubishakira

MUBURYO BW'IGISUBIZO:
- Inyifuzo y'ubwiyunge kandi itandukanye
- Shyiramo ingero z'ubwiyunge
- Yamamare n'iyambire
- Ijambo ryoroshye kandi riteganya"""

# =====================================================
# GEMINI SERVICE CLASS
# =====================================================

class GeminiCoffeeService:
    """Service for handling Gemini API calls for coffee Q&A"""

    def __init__(self):
        """Initialize Gemini API with key from settings"""
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment variables")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=COFFEE_SYSTEM_PROMPT_EN
        )
        self.conversation_history = []

    def set_language(self, language_code: str):
        """
        Set the language for responses
        
        Args:
            language_code: 'en' for English, 'rw' for Kinyarwanda
        """
        system_prompt = (
            COFFEE_SYSTEM_PROMPT_RW if language_code == 'rw'
            else COFFEE_SYSTEM_PROMPT_EN
        )
        
        self.model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=system_prompt
        )

    def build_context(
        self,
        question: str,
        category: str,
        language_code: str
    ) -> str:
        """
        Build enhanced context for better responses
        
        Args:
            question: User's question
            category: Coffee category (Growing, Pricing, etc.)
            language_code: Language code
            
        Returns:
            Enhanced question with context
        """
        context_map = {
            'Growing': 'This question is about coffee cultivation, planting, climate, and growth cycles',
            'Pricing & Markets': 'This question is about coffee market prices, selling, and business aspects',
            'Processing': 'This question is about coffee processing methods, fermentation, and roasting',
            'Quality & Grading': 'This question is about coffee quality standards, grades, and defects',
            'Health & Nutrition': 'This question is about coffee health benefits and nutritional value',
        }

        context = context_map.get(category, 'This is a coffee-related question')
        language_hint = (
            '\n[Please respond in Kinyarwanda]' if language_code == 'rw'
            else '\n[Please respond in English]'
        )

        return f"{context}.\n\nQuestion: {question}{language_hint}"

    async def ask_question(
        self,
        question: str,
        category: str = 'General',
        language_code: str = 'en',
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, str]:
        """
        Ask a question to Gemini API with coffee expert training
        
        Args:
            question: User's question
            category: Coffee category
            language_code: Language code ('en' or 'rw')
            conversation_history: Previous conversation messages
            
        Returns:
            Dictionary with answer and metadata
        """
        try:
            # Set language
            self.set_language(language_code)

            # Build enhanced question with context
            enhanced_question = self.build_context(question, category, language_code)

            # Build conversation messages for context
            messages = []
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-4:]:  # Last 2 exchanges
                    if msg['role'] == 'user':
                        messages.append({'role': 'user', 'parts': [msg['content']]})
                    else:
                        messages.append({'role': 'model', 'parts': [msg['content']]})

            # Add current question
            messages.append({'role': 'user', 'parts': [enhanced_question]})

            # Start chat session
            chat = self.model.start_chat(history=messages if messages else None)

            # Send message
            response = chat.send_message(enhanced_question)
            answer = response.text

            # Update conversation history
            self.conversation_history.extend([
                {'role': 'user', 'content': question},
                {'role': 'assistant', 'content': answer}
            ])

            # Keep only last 10 exchanges
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]

            return {
                'success': True,
                'answer': answer,
                'question': question,
                'category': category,
                'language': language_code,
                'model': 'gemini-1.5-flash'
            }

        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'answer': 'Sorry, I could not process your question at the moment. Please try again.'
            }

    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []

    def get_history(self) -> List[Dict]:
        """Get current conversation history"""
        return self.conversation_history


# =====================================================
# SINGLETON INSTANCE
# =====================================================

_gemini_service = None


def get_gemini_service() -> GeminiCoffeeService:
    """Get or create Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiCoffeeService()
    return _gemini_service


def reset_gemini_service():
    """Reset Gemini service"""
    global _gemini_service
    if _gemini_service:
        _gemini_service.clear_history()
    _gemini_service = None