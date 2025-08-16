import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlideAction {
  intent: 'add' | 'edit' | 'delete' | 'reorder' | 'build_deck';
  slideType?: string;
  targetIndex?: number | null;
  fromIndex?: number | null;
  toIndex?: number | null;
  params?: {
    title?: string;
    subtitle?: string;
    period?: { from: string; to: string };
    filters?: { country: string[]; department: string[] };
    kpis?: string[];
    chart?: { type: string; x: string; y: string[] };
    table?: { columns: string[]; topN: number };
    narrative?: string[];
    content?: string;
  };
}

const systemPrompt = `You are 'Jude', a finance FP&A copilot for Prima Finance. You help users create and edit PowerPoint slides for financial reports.

IMPORTANT: You must respond with VALID JSON only, no additional text or explanations.

Your response format:
{
  "reply": "Brief confirmation of what you're doing",
  "actions": [SlideAction]
}

Available slide types:
- title: Prima branded title slide
- agenda: Auto-generated from current slides
- kpi: Key performance indicators (Revenue, EBITDA, GWP, Contracts)  
- variance: Actual vs Budget analysis with tables/charts
- sales: Sales trends and performance metrics
- forecast: Future projections and scenarios
- scenario: Scenario analysis with inputs and deltas
- narrative: Text content with bullet points
- table: Data tables with selectable columns
- chart: Charts (line, bar, area, waterfall, pie)
- blank: Empty slide

Examples:

User: "Add variance slide for Italy Q2"
Response: {"reply":"Adding variance analysis slide for Italy Q2","actions":[{"intent":"add","slideType":"variance","params":{"title":"Italy Q2 Variance Analysis","filters":{"country":["Italy"]},"period":{"from":"2024-04","to":"2024-06"}}}]}

User: "Change title to Financial Review"  
Response: {"reply":"Updating slide title","actions":[{"intent":"edit","targetIndex":0,"params":{"title":"Financial Review"}}]}

Keep responses concise and professional. Focus on financial terminology.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          reply: 'I need the OpenAI API key to be configured to help you. Please check the edge function secrets.',
          actions: []
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, context } = await req.json();
    
    const contextInfo = `
Current slides: ${context.currentSlides?.length || 0} slides
Current filters: ${JSON.stringify(context.globalFilters)}
Slide types: ${context.currentSlides?.map((s: any, i: number) => `${i}: ${s.type} - ${s.title}`).join(', ') || 'none'}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: `Context: ${contextInfo}` },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          reply: 'I encountered an error processing your request. Please try rephrasing.',
          actions: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        reply: parsedResponse.reply || 'I\'ve processed your request.',
        intent: 'slide_action',
        actions: parsedResponse.actions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ask-jude function:', error);
    return new Response(
      JSON.stringify({ 
        reply: 'I encountered an error. Please make sure the OpenAI API key is configured and try again.',
        actions: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});