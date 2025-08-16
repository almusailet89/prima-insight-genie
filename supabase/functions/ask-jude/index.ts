import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommandAction {
  type: 'navigate' | 'generate' | 'filter' | 'export';
  label: string;
  target?: string;
  params?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, context } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Received message:', message);
    console.log('Context:', context);

    // Analyze the query to determine intent and fetch relevant data
    const { intent, queryData, actions } = await analyzeQueryAndFetchData(supabase, message, context);
    
    // Build conversation history for context
    const conversationHistory = context?.conversationHistory || [];
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nConversation history:\n${conversationHistory.map((msg: any) => `${msg.type}: ${msg.content}`).join('\n')}`
      : '';
    
    const dataContext = queryData.length > 0 
      ? `\n\nRelevant data context:\n${JSON.stringify(queryData, null, 2)}`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07', // Using the latest GPT-5 model
        messages: [
          {
            role: 'system',
            content: `You are Jude, Prima Finance's advanced AI assistant. You're conversational, helpful, and can perform actions within the Prima Finance application.

CORE CAPABILITIES:
- Financial data analysis and insights
- Report generation and PowerPoint creation  
- App navigation and feature control
- Scenario modeling and forecasting
- Variance analysis and KPI monitoring

AVAILABLE DATA SOURCES:
- forecast_gwp: Country-level GWP forecasts with growth rates (Italy, UK, Spain)
- cost_monitoring: Departmental costs with budget vs actuals
- fact_ledger: Comprehensive financial transactions
- Business units across Italy, UK, Spain operations

COMMUNICATION STYLE:
- Be conversational and natural like ChatGPT
- Provide specific insights with actual numbers when data is available
- Use clear formatting with bullet points, tables when helpful
- Be proactive in suggesting actions the user can take
- Format currency in EUR (€) and percentages appropriately

COMMAND RECOGNITION:
When users ask to:
- "Navigate to [page]" or "Show me [page]" → Suggest navigation actions
- "Generate report" or "Create PowerPoint" → Offer report generation
- "Analyze [data]" or "Show variance" → Provide analysis with action buttons
- "Filter by [criteria]" → Suggest filtering actions
- "Export data" → Offer export options

Always be helpful and suggest next steps the user might want to take.${conversationContext}${dataContext}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_completion_tokens: 1200,
        // Note: temperature not supported in GPT-5
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
    console.log('Intent:', intent);
    console.log('Actions:', actions);

    return new Response(JSON.stringify({ 
      response: reply,
      intent: intent,
      actions: actions,
      timestamp: new Date().toISOString(),
      dataUsed: queryData.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-jude function:', error);
    return new Response(JSON.stringify({ 
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
      error: 'Failed to process your request. Please try again.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeQueryAndFetchData(supabase: any, query: string, context: any): Promise<{ intent: string, queryData: any[], actions: CommandAction[] }> {
  const queryLower = query.toLowerCase();
  let relevantData: any[] = [];
  let intent = 'general_inquiry';
  let actions: CommandAction[] = [];

  try {
    // Detect navigation intents
    if (queryLower.includes('navigate') || queryLower.includes('go to') || queryLower.includes('show me') && (
      queryLower.includes('dashboard') || queryLower.includes('variance') || queryLower.includes('forecast') || 
      queryLower.includes('scenario') || queryLower.includes('import') || queryLower.includes('report')
    )) {
      intent = 'navigation';
      if (queryLower.includes('variance')) {
        actions.push({ type: 'navigate', label: 'Go to Variance Analysis', target: '/variance' });
      } else if (queryLower.includes('forecast')) {
        actions.push({ type: 'navigate', label: 'Go to Forecasting', target: '/forecasting' });
      } else if (queryLower.includes('scenario')) {
        actions.push({ type: 'navigate', label: 'Go to Scenario Simulator', target: '/scenario' });
      } else if (queryLower.includes('report')) {
        actions.push({ type: 'navigate', label: 'Go to Reports', target: '/reports' });
      } else if (queryLower.includes('import')) {
        actions.push({ type: 'navigate', label: 'Go to Import Data', target: '/import' });
      } else {
        actions.push({ type: 'navigate', label: 'Go to Dashboard', target: '/' });
      }
    }

    // Detect report generation intents
    if (queryLower.includes('generate') || queryLower.includes('create') || queryLower.includes('build')) {
      if (queryLower.includes('report') || queryLower.includes('powerpoint') || queryLower.includes('presentation') || queryLower.includes('ppt')) {
        intent = 'report_generation';
        actions.push({ type: 'generate', label: 'Generate PowerPoint Report', target: 'report' });
      } else if (queryLower.includes('scenario')) {
        intent = 'scenario_modeling';
        actions.push({ type: 'navigate', label: 'Create Scenario Analysis', target: '/scenario' });
      }
    }

    // Detect data analysis intents
    if (queryLower.includes('analyze') || queryLower.includes('analysis') || queryLower.includes('show') || queryLower.includes('variance')) {
      intent = 'data_analysis';
    }

    // Check if query is about GWP/forecasts
    if (queryLower.includes('gwp') || queryLower.includes('premium') || queryLower.includes('forecast') || queryLower.includes('revenue')) {
      const { data: gwpData } = await supabase
        .from('forecast_gwp')
        .select('*')
        .order('month', { ascending: false })
        .limit(20);
      
      if (gwpData && gwpData.length > 0) {
        relevantData.push({ table: 'forecast_gwp', data: gwpData });
      }
      
      if (intent === 'general_inquiry') intent = 'gwp_analysis';
      actions.push({ type: 'export', label: 'Export GWP Data', params: { type: 'gwp' } });
    }

    // Check if query is about costs/departments/variance
    if (queryLower.includes('cost') || queryLower.includes('department') || queryLower.includes('variance') || 
        queryLower.includes('budget') || queryLower.includes('actual')) {
      const { data: costData } = await supabase
        .from('cost_monitoring')
        .select('*')
        .order('month', { ascending: false })
        .limit(20);
      
      if (costData && costData.length > 0) {
        relevantData.push({ table: 'cost_monitoring', data: costData });
      }
      
      if (intent === 'general_inquiry') intent = 'cost_analysis';
      actions.push({ type: 'navigate', label: 'View Variance Analysis', target: '/variance' });
      actions.push({ type: 'export', label: 'Export Cost Data', params: { type: 'costs' } });
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
      
      // Add country-specific filtering action
      actions.push({ 
        type: 'filter', 
        label: `Filter by ${mentionedCountries.join(', ').toUpperCase()}`, 
        params: { countries: mentionedCountries } 
      });
    }

    // If it's a general query, get recent summary data
    if (relevantData.length === 0 && (queryLower.includes('overview') || queryLower.includes('summary') || 
        queryLower.includes('kpi') || queryLower.includes('performance') || queryLower.includes('trend'))) {
      const [{ data: recentGwp }, { data: recentCosts }] = await Promise.all([
        supabase.from('forecast_gwp').select('*').order('month', { ascending: false }).limit(5),
        supabase.from('cost_monitoring').select('*').order('month', { ascending: false }).limit(5)
      ]);
      
      if (recentGwp && recentGwp.length > 0) {
        relevantData.push({ table: 'recent_gwp', data: recentGwp });
      }
      if (recentCosts && recentCosts.length > 0) {
        relevantData.push({ table: 'recent_costs', data: recentCosts });
      }
      
      if (intent === 'general_inquiry') intent = 'performance_overview';
      actions.push({ type: 'navigate', label: 'View Full Dashboard', target: '/' });
    }

    // Export actions for data queries
    if (relevantData.length > 0 && !actions.some(a => a.type === 'export')) {
      actions.push({ type: 'export', label: 'Export Analysis', params: { type: 'analysis' } });
    }

  } catch (error) {
    console.error('Error analyzing query and fetching data:', error);
  }

  return { intent, queryData: relevantData, actions };
}