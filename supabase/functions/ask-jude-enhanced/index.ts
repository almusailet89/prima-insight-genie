import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine if this is a specific command
    const lowerMessage = message.toLowerCase();
    let systemPrompt = `You are Jude, Prima Assicurazioni's AI financial assistant. You help analyze financial data, create narratives, and provide insights. 

Current context: You are viewing the ${context.tab} section.
Available data: ${JSON.stringify(context.data).substring(0, 1000)}...

You can help with:
- Analyzing financial performance and trends
- Generating executive summaries and narratives
- Explaining variances and key drivers
- Creating PowerPoint reports
- Comparing different periods or markets
- Answering questions about insurance metrics (GWP, loss ratios, combined ratios, etc.)

Be professional, concise, and provide actionable insights. Use Prima's context when relevant.`;

    // Handle specific commands
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      systemPrompt += `\n\nThe user wants a summary of the current view. Focus on key metrics, trends, and insights from the data.`;
    } else if (lowerMessage.includes('narrative') || lowerMessage.includes('create narrative')) {
      systemPrompt += `\n\nThe user wants you to generate a professional narrative for this section. Create a concise executive summary with key highlights and bullet points.`;
    } else if (lowerMessage.includes('ppt') || lowerMessage.includes('powerpoint')) {
      systemPrompt += `\n\nThe user wants to generate a PowerPoint report. Explain what sections would be included and suggest key slides based on the current data.`;
    } else if (lowerMessage.includes('variance') || lowerMessage.includes('explain')) {
      systemPrompt += `\n\nThe user wants explanations of variances or performance drivers. Focus on identifying key factors causing differences between actual and budget/forecast.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    // If the user asked for a narrative and we're not in narrative generation mode, 
    // we could trigger the narrative generation function here
    if (lowerMessage.includes('create narrative') || lowerMessage.includes('generate narrative')) {
      try {
        const { data: narrativeResult } = await supabase.functions.invoke('generate-narrative', {
          body: {
            tab: context.tab,
            data: context.data,
            period: '44444444-4444-4444-4444-44444444444e', // Current period
            companyId: '11111111-1111-1111-1111-111111111111'
          }
        });
        
        return new Response(JSON.stringify({ 
          response: `${aiResponse}\n\n**Generated Narrative:**\n${narrativeResult?.narrative || 'Narrative generation failed'}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error generating narrative:', error);
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-jude-enhanced:', error);
    return new Response(JSON.stringify({ 
      response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});