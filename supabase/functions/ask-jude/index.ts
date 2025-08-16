import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Received message:', message);

    // Analyze the query to determine if we need to fetch specific data
    const queryData = await analyzeAndFetchData(supabase, message);
    
    const contextualInfo = queryData.length > 0 
      ? `\n\nRelevant data context:\n${JSON.stringify(queryData, null, 2)}`
      : '';

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
            content: `You are Jude, Prima Finance's AI assistant specialized in financial analysis. You help analyze GWP forecasts, cost monitoring, variance analysis, and financial KPIs.

Available data sources:
- forecast_gwp: country-level GWP forecasts with growth rates
- cost_monitoring: departmental costs with budget vs actuals
- fact_ledger: comprehensive financial transactions
- Business units: Italy, UK, Spain operations

When users ask about:
- "GWP" or "premiums" → Query forecast_gwp table
- "costs", "departments", "variance" → Query cost_monitoring table  
- "Italy", "UK", "Spain" → Filter by country
- "budget vs actual" → Focus on variance analysis

Provide specific insights with numbers when data is available. Format currency in EUR (€) and percentages appropriately.${contextualInfo}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    console.log('Generated response:', reply);

    return new Response(JSON.stringify({ 
      response: reply,
      timestamp: new Date().toISOString(),
      dataUsed: queryData.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-jude function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process your request. Please try again.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeAndFetchData(supabase: any, query: string): Promise<any[]> {
  const queryLower = query.toLowerCase();
  let relevantData: any[] = [];

  try {
    // Check if query is about GWP/forecasts
    if (queryLower.includes('gwp') || queryLower.includes('premium') || queryLower.includes('forecast')) {
      const { data: gwpData } = await supabase
        .from('forecast_gwp')
        .select('*')
        .order('month', { ascending: false })
        .limit(20);
      
      if (gwpData && gwpData.length > 0) {
        relevantData.push({ table: 'forecast_gwp', data: gwpData });
      }
    }

    // Check if query is about costs/departments/variance
    if (queryLower.includes('cost') || queryLower.includes('department') || queryLower.includes('variance') || queryLower.includes('budget')) {
      const { data: costData } = await supabase
        .from('cost_monitoring')
        .select('*')
        .order('month', { ascending: false })
        .limit(20);
      
      if (costData && costData.length > 0) {
        relevantData.push({ table: 'cost_monitoring', data: costData });
      }
    }

    // Check if query mentions specific countries
    const countries = ['italy', 'uk', 'spain'];
    const mentionedCountries = countries.filter(country => queryLower.includes(country));
    
    if (mentionedCountries.length > 0) {
      // Fetch country-specific data
      const { data: countryGwp } = await supabase
        .from('forecast_gwp')
        .select('*')
        .in('country', mentionedCountries.map(c => c.charAt(0).toUpperCase() + c.slice(1)))
        .order('month', { ascending: false })
        .limit(10);
      
      if (countryGwp && countryGwp.length > 0) {
        relevantData.push({ table: 'country_gwp', data: countryGwp });
      }
    }

    // If it's a general query, get recent summary data
    if (relevantData.length === 0 && (queryLower.includes('overview') || queryLower.includes('summary') || queryLower.includes('kpi'))) {
      const { data: recentFacts } = await supabase
        .from('fact_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentFacts && recentFacts.length > 0) {
        relevantData.push({ table: 'recent_facts', data: recentFacts });
      }
    }

  } catch (error) {
    console.error('Error fetching contextual data:', error);
  }

  return relevantData;
}