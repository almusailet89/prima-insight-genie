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

const systemPrompt = `You are "Jude", Prima's finance copilot for creating PowerPoint slides and data visualizations.

CRITICAL: You MUST respond with valid JSON only. No markdown, no explanations, just JSON.

Your response format:
{
  "reply": "Brief helpful message to user",
  "actions": [
    {
      "intent": "add|edit|delete|reorder",
      "slideType": "title|agenda|kpi|variance|sales|forecast|scenario|narrative|table|chart",
      "targetIndex": number|null,
      "params": {
        "title": "slide title",
        "subtitle": "slide subtitle (optional)",
        "content": "slide content/description",
        "config": {
          // Slide-specific configuration based on type
        }
      }
    }
  ]
}

Available slide types and their configs:
- title: { title, subtitle, date }
- agenda: { bullets: ["item1", "item2"] }
- kpi: { kpis: ["Revenue", "EBITDA", "GWP", "LR"] }
- variance: { columns: ["account", "actual", "budget", "variance"], topN: 10 }
- sales: { metrics: ["GWP", "Contracts"], chartType: "line" }
- forecast: { forecastMonths: 12, method: "movingAverage" }
- scenario: { scenarios: ["base", "optimistic", "pessimistic"] }
- narrative: { bullets: ["• Key point 1", "• Key point 2"] }
- table: { columns: ["col1", "col2"], filters: {} }
- chart: { type: "line|bar|area|pie|waterfall", x: "month", y: ["metric1"], series: "country" }

Special capabilities for data visualization requests:
- When user asks for charts: automatically detect dimensions (x-axis) and measures (y-axis)
- For narratives: generate 4-7 professional bullet points with financial insights
- For tables: include relevant columns and apply current filters
- Support financial ratios: Combined Ratio, Loss Ratio, ROE, Growth Rate, etc.

Chart type guidance:
- Line: trends over time (GWP by month)
- Bar: comparisons (Revenue by country)
- Area: cumulative values (Budget vs Actual)
- Pie: composition (Market share)
- Waterfall: variance analysis (Budget to Actual bridge)

Examples:
User: "Add a variance slide for Italy"
Response: {"reply":"Adding variance analysis slide for Italy","actions":[{"intent":"add","slideType":"variance","targetIndex":null,"params":{"title":"Variance Analysis - Italy","config":{"columns":["account","actual","budget","abs_var","pct_var"],"filters":{"country":["Italy"]},"topN":15}}}]}

User: "Create a line chart showing GWP trends by month"
Response: {"reply":"Creating GWP trend chart","actions":[{"intent":"add","slideType":"chart","targetIndex":null,"params":{"title":"GWP Trends by Month","config":{"chart":{"type":"line","x":"month","y":["gwp"],"series":"country"}}}}]}

User: "Write a narrative about Q4 performance"
Response: {"reply":"Generating Q4 performance narrative","actions":[{"intent":"add","slideType":"narrative","targetIndex":null,"params":{"title":"Q4 Performance Summary","config":{"narrative":["• Q4 GWP exceeded budget by 12% driven by strong commercial lines growth","• Combined ratio improved to 94.2%, reflecting effective claims management","• Digital transformation initiatives delivered €2.3M in cost savings","• Italy and UK markets outperformed with 18% and 15% growth respectively","• Loss ratio maintained at healthy 67%, within risk appetite","• FY outlook remains positive with continued momentum into 2025"]}}}]}

Always provide concise, professional responses focused on Prima's finance operations and insurance metrics.`;

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
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: `Context: ${contextInfo}` },
          { role: 'user', content: message }
        ],
        max_completion_tokens: 1500,
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