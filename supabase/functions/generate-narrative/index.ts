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
    const { tab, data, period, companyId } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate narrative based on tab and data
    let prompt = '';
    switch (tab) {
      case 'overview':
        prompt = `Generate a concise executive summary for Prima Assicurazioni's overview dashboard. Data: ${JSON.stringify(data)}. Focus on KPIs, variance performance, and key highlights. Keep it under 150 words with 3 bullet points.`;
        break;
      case 'variance':
        prompt = `Analyze variance data for Prima Assicurazioni: ${JSON.stringify(data)}. Identify key drivers of variances, highlight significant over/under performance, and provide actionable insights. Keep it under 150 words with 3 bullet points.`;
        break;
      case 'sales':
        prompt = `Analyze sales performance for Prima Assicurazioni: ${JSON.stringify(data)}. Focus on revenue by product/market/channel, margin analysis, and key movers. Keep it under 150 words with 3 bullet points.`;
        break;
      case 'forecast':
        prompt = `Analyze forecast data for Prima Assicurazioni: ${JSON.stringify(data)}. Summarize scenarios, growth projections, and key assumptions. Keep it under 150 words with 3 bullet points.`;
        break;
      case 'ratios':
        prompt = `Analyze financial ratios for Prima Assicurazioni: ${JSON.stringify(data)}. Explain ratio movements, benchmark performance, and identify trends. Keep it under 150 words with 3 bullet points.`;
        break;
      case 'scenario':
        prompt = `Analyze scenario simulation results for Prima Assicurazioni: ${JSON.stringify(data)}. Summarize impact of assumptions, compare scenarios, and highlight key insights. Keep it under 150 words with 3 bullet points.`;
        break;
      default:
        prompt = `Generate a financial analysis summary for Prima Assicurazioni based on: ${JSON.stringify(data)}. Keep it professional and under 150 words.`;
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
            content: 'You are a financial analyst AI for Prima Assicurazioni. Generate concise, professional narratives with clear executive insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const narrative = aiData.choices[0].message.content;

    // Save narrative to database
    const { data: savedNarrative, error } = await supabase
      .from('narratives')
      .insert({
        company_id: companyId,
        period_id: period,
        tab: tab,
        summary: narrative,
        details: narrative,
        generated_by: 'AI'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving narrative:', error);
    }

    return new Response(JSON.stringify({ 
      narrative,
      id: savedNarrative?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-narrative:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});