import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcribedText } = await req.json();

    if (!transcribedText) {
      throw new Error('No transcribed text provided');
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Classify this gender response into exactly one of: "Male", "Female", or "Other"
Patient said: "${transcribedText}"
Return only the classification word.`
        }]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${await claudeResponse.text()}`);
    }

    const claudeData = await claudeResponse.json();
    const classification = claudeData.content[0].text.trim();

    // Validate the classification
    const validGenders = ['Male', 'Female', 'Other'];
    const finalClassification = validGenders.includes(classification) ? classification : 'Other';

    return new Response(
      JSON.stringify({ 
        classification: finalClassification,
        originalText: transcribedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in classify-gender function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});