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
    const { message, context } = await req.json();

    // Classify intent based on message
    const intent = classifyIntent(message);
    
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
            content: `You are Jude, an AI financial analyst assistant for Prima Finance. 
            You help with variance analysis, forecasting, scenario planning, and financial reporting.
            
            Context: User is currently on ${context?.currentPath || 'unknown page'}.
            
            Provide concise, actionable financial insights. Focus on:
            - Variance explanations with business context
            - Forecast recommendations
            - Scenario impact analysis
            - Report generation guidance
            
            Keep responses professional but friendly.`
          },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    // Generate suggested actions based on intent
    const actions = generateActions(intent, message);

    return new Response(JSON.stringify({
      response: assistantResponse,
      intent,
      actions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-jude function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function classifyIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('variance') || lowerMessage.includes('vs budget') || lowerMessage.includes('vs forecast')) {
    return 'variance_analysis';
  }
  if (lowerMessage.includes('forecast') || lowerMessage.includes('predict') || lowerMessage.includes('future')) {
    return 'forecasting';
  }
  if (lowerMessage.includes('scenario') || lowerMessage.includes('what if') || lowerMessage.includes('simulate')) {
    return 'scenario';
  }
  if (lowerMessage.includes('report') || lowerMessage.includes('ppt') || lowerMessage.includes('presentation') || lowerMessage.includes('deck')) {
    return 'report_generation';
  }
  if (lowerMessage.includes('sales') || lowerMessage.includes('conversion') || lowerMessage.includes('retention')) {
    return 'sales_analysis';
  }
  
  return 'general_inquiry';
}

function generateActions(intent: string, message: string): string[] {
  switch (intent) {
    case 'variance_analysis':
      return ['View Variance Analysis', 'Export Variance Report'];
    case 'forecasting':
      return ['Go to Forecasting', 'Run Forecast Model'];
    case 'scenario':
      return ['Open Scenario Simulator', 'Create New Scenario'];
    case 'report_generation':
      return ['Generate Report', 'Build PowerPoint'];
    case 'sales_analysis':
      return ['View Sales Dashboard', 'Analyze Conversion Funnel'];
    default:
      return ['View Dashboard', 'Ask Another Question'];
  }
}