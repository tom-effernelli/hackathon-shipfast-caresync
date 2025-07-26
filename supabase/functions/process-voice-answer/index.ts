import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Question {
  id: string;
  text: string;
  field: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface ProcessRequest {
  question: Question;
  answer: string;
  context: {
    questionIndex: number;
    previousAnswers: Record<string, string>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, answer, context }: ProcessRequest = await req.json();

    if (!question || !answer) {
      throw new Error('Question and answer are required');
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // Create context-aware prompt for Claude
    const systemPrompt = `You are a medical intake assistant helping process patient responses during voice check-in. 

Your task is to:
1. Extract and validate the relevant information from the patient's spoken response
2. Format it appropriately for the specific field type
3. Determine if the response is complete and valid
4. Provide helpful suggestions if the response needs clarification

Field types:
- text: Free form text, clean up but preserve meaning
- number: Extract numeric value only
- select: Must match one of the provided options exactly

Be understanding of natural speech patterns, filler words, and variations in how people express things.`;

    const userPrompt = `Current question: "${question.text}"
Field: ${question.field}
Type: ${question.type}
${question.options ? `Options: ${question.options.join(', ')}` : ''}
Required: ${question.required}

Patient's spoken response: "${answer}"

Previous context: ${JSON.stringify(context.previousAnswers, null, 2)}

Please analyze this response and return a JSON object with:
{
  "processedAnswer": "cleaned/formatted answer",
  "isValid": boolean,
  "confidence": number (0-1),
  "suggestions": "helpful text if invalid or needs clarification"
}

Examples:
- "I'm 25 years old" → {"processedAnswer": "25", "isValid": true, "confidence": 0.95}
- "John Smith is my name" → {"processedAnswer": "John Smith", "isValid": true, "confidence": 0.9}
- "I'm a guy" → {"processedAnswer": "Male", "isValid": true, "confidence": 0.8}
- "um, like, maybe thirty something" → {"processedAnswer": "", "isValid": false, "confidence": 0.3, "suggestions": "Please provide your exact age"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();
    const claudeContent = claudeResponse.content[0].text;

    // Parse Claude's response
    let result;
    try {
      // Try to extract JSON from Claude's response
      const jsonMatch = claudeContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      // Fallback: create a simple validation
      result = {
        processedAnswer: answer.trim(),
        isValid: answer.trim().length > 0,
        confidence: 0.5,
        suggestions: "Please repeat your answer more clearly"
      };
    }

    // Additional validation based on field type
    if (result.isValid) {
      switch (question.type) {
        case 'number':
          const num = parseInt(result.processedAnswer);
          if (isNaN(num) || num <= 0) {
            result.isValid = false;
            result.suggestions = "Please provide a valid number";
          } else {
            result.processedAnswer = num.toString();
          }
          break;
          
        case 'select':
          if (question.options && !question.options.includes(result.processedAnswer)) {
            // Try to match case-insensitively
            const matchedOption = question.options.find(opt => 
              opt.toLowerCase() === result.processedAnswer.toLowerCase()
            );
            if (matchedOption) {
              result.processedAnswer = matchedOption;
            } else {
              result.isValid = false;
              result.suggestions = `Please choose one of: ${question.options.join(', ')}`;
            }
          }
          break;
          
        case 'text':
          if (question.required && result.processedAnswer.trim().length < 2) {
            result.isValid = false;
            result.suggestions = "Please provide a more complete answer";
          }
          break;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing voice answer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        processedAnswer: "",
        isValid: false,
        confidence: 0,
        suggestions: "There was an error processing your answer. Please try again."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});