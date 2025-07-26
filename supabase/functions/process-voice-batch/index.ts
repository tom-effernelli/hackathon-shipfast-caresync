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

interface QuestionAnswerPair {
  question: Question;
  answer: string;
  questionIndex: number;
}

interface ProcessBatchRequest {
  questionAnswerPairs: QuestionAnswerPair[];
  context: {
    allAnswers: Record<string, string>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: ProcessBatchRequest = await req.json();
    const { questionAnswerPairs, context } = requestData;

    // Prepare optimized prompt for batch processing
    const systemPrompt = `You are a medical intake assistant processing multiple patient responses efficiently. 

For each question-answer pair, provide:
1. processedAnswer: cleaned/standardized answer
2. isValid: true/false
3. confidence: 0.0-1.0

Field types and validation:
- text: Clean formatting, proper capitalization
- number: Extract numeric value only
- select: Match to closest option if possible

Be lenient with validation for efficiency. Focus on extracting key information rather than perfection.

Return JSON array with results for each pair in order.`;

    const userPrompt = `Process these ${questionAnswerPairs.length} responses:

${questionAnswerPairs.map((pair, idx) => `
${idx + 1}. Question: "${pair.question.text}"
   Field: ${pair.question.field} (${pair.question.type})
   ${pair.question.options ? `Options: ${pair.question.options.join(', ')}` : ''}
   Answer: "${pair.answer}"
`).join('')}

Context: Previous answers = ${JSON.stringify(context.allAnswers)}

Respond with JSON array only:`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fastest model for batch processing
        max_tokens: 2000,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    let results;
    try {
      // Try to parse Claude's response
      results = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content);
      // Fallback: create basic validation results
      results = questionAnswerPairs.map(pair => ({
        processedAnswer: pair.answer.trim(),
        isValid: pair.answer.trim().length > 0,
        confidence: 0.6
      }));
    }

    // Ensure we have results for all pairs
    if (!Array.isArray(results) || results.length !== questionAnswerPairs.length) {
      results = questionAnswerPairs.map(pair => ({
        processedAnswer: pair.answer.trim(),
        isValid: pair.answer.trim().length > 0,
        confidence: 0.6
      }));
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in process-voice-batch function:', error);
    
    // Fallback response for errors
    const requestData = await req.json().catch(() => ({ questionAnswerPairs: [] }));
    const fallbackResults = requestData.questionAnswerPairs?.map((pair: QuestionAnswerPair) => ({
      processedAnswer: pair.answer.trim(),
      isValid: pair.answer.trim().length > 0,
      confidence: 0.5
    })) || [];

    return new Response(
      JSON.stringify({ 
        results: fallbackResults,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to allow fallback processing
      }
    );
  }
});