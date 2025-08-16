import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileData, fileName, existingRatios } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a financial analysis expert specializing in identifying financial ratios and KPIs from data files. 

            Analyze the provided file data and identify potential financial ratios that could be calculated from the available data fields. 

            Focus on:
            - Insurance industry ratios (Combined Ratio, Loss Ratio, etc.)
            - Standard financial ratios (ROE, ROA, Current Ratio, etc.)
            - Industry-specific KPIs
            - Custom ratios that make sense for the data provided

            For each suggested ratio, provide:
            - name: Clear, professional name
            - formula: Mathematical formula using field names from the data
            - description: Brief explanation of what it measures
            - category: One of: profitability, efficiency, liquidity, leverage, growth, custom
            - displayFormat: One of: percentage, ratio, currency, number
            - confidence: Float between 0-1 indicating how confident you are this ratio is relevant
            - source: Brief description of where/how you identified this ratio

            Exclude ratios that already exist: ${existingRatios.join(', ')}

            Return ONLY a JSON object with "suggestedRatios" array. No other text.`
          },
          {
            role: 'user',
            content: `Analyze this file data from ${fileName}:\n\n${fileData.substring(0, 3000)}...`
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      
      // Add unique IDs to each suggestion
      const suggestedRatios = parsed.suggestedRatios.map((ratio: any, index: number) => ({
        id: `suggestion_${Date.now()}_${index}`,
        ...ratio
      }));

      return new Response(JSON.stringify({ suggestedRatios }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        suggestedRatios: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in analyze-financial-ratios function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestedRatios: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});