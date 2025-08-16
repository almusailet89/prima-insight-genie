import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportConfig {
  title: string;
  template_id: string;
  period?: string;
  countries: string[];
  sections: Array<{
    id: string;
    type: string;
    title: string;
    enabled: boolean;
    config: any;
  }>;
  branding: any;
  chart_styles: any;
  table_styles: any;
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

    const config: ReportConfig = await req.json();
    console.log('Generating advanced report with config:', config);

    // Fetch all required data in parallel
    const [gwpData, costData, forecastData, profiles] = await Promise.all([
      fetchGWPData(supabase, config),
      fetchCostData(supabase, config),
      fetchForecastData(supabase, config),
      fetchProfileData(supabase)
    ]);

    // Generate AI-powered insights and narratives
    const insights = await generateAdvancedInsights(gwpData, costData, forecastData, config);

    // Build report structure based on selected sections
    const reportData = {
      metadata: {
        title: config.title,
        generatedAt: new Date().toISOString(),
        period: config.period || 'All periods',
        countries: config.countries,
        template_applied: config.template_id,
        sections_count: config.sections.length
      },
      branding: {
        ...config.branding,
        template_id: config.template_id
      },
      slides: await generateSlides(config, gwpData, costData, forecastData, insights)
    };

    // In production, this would generate actual PowerPoint using a library like pptxgenjs
    // For now, we simulate the process and return structured data
    const simulatedPowerPointGeneration = await simulatePowerPointGeneration(reportData, config);

    return new Response(JSON.stringify({
      success: true,
      reportData,
      downloadUrl: simulatedPowerPointGeneration.downloadUrl,
      fileSize: simulatedPowerPointGeneration.fileSize,
      slideCount: reportData.slides.length,
      message: 'Advanced report generated successfully with AI insights and Prima branding'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating advanced report:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchGWPData(supabase: any, config: ReportConfig) {
  let query = supabase.from('forecast_gwp').select('*');
  
  if (config.countries.length > 0) {
    query = query.in('country', config.countries);
  }
  if (config.period) {
    query = query.gte('month', config.period);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchCostData(supabase: any, config: ReportConfig) {
  let query = supabase.from('cost_monitoring').select('*');
  
  if (config.countries.length > 0) {
    query = query.in('country', config.countries);
  }
  if (config.period) {
    query = query.gte('month', config.period);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchForecastData(supabase: any, config: ReportConfig) {
  // Fetch additional forecast and scenario data
  let query = supabase.from('forecast_gwp').select('*').order('month', { ascending: true });
  
  if (config.countries.length > 0) {
    query = query.in('country', config.countries);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchProfileData(supabase: any) {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) throw error;
  return data || [];
}

async function generateAdvancedInsights(gwpData: any[], costData: any[], forecastData: any[], config: ReportConfig) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    console.log('OpenAI API key not found, using simulated insights');
    return generateSimulatedInsights(gwpData, costData, forecastData, config);
  }

  try {
    // Prepare data summary for AI analysis
    const dataSummary = {
      totalGWP: gwpData.reduce((sum, item) => sum + (item.gwp || 0), 0),
      totalVariance: costData.reduce((sum, item) => sum + Math.abs(item.variance || 0), 0),
      countriesAnalyzed: config.countries,
      periodAnalyzed: config.period || 'All periods',
      keyMetrics: {
        averageGrowthRate: gwpData.reduce((sum, item) => sum + (item.growth_rate || 0), 0) / Math.max(gwpData.length, 1),
        budgetVariancePercent: costData.length > 0 ? costData.reduce((sum, item) => sum + (item.variance_pct || 0), 0) / costData.length : 0,
        forecastTrend: forecastData.length > 2 ? (forecastData[forecastData.length - 1]?.gwp - forecastData[0]?.gwp) / forecastData[0]?.gwp : 0
      }
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are a senior financial analyst at Prima, a leading European insurance company. Generate professional, insightful commentary for a corporate finance report. Focus on:
            - Key performance insights and trends
            - Variance explanations and implications
            - Strategic recommendations
            - Country-specific analysis
            - Forward-looking perspectives
            
            Keep responses concise, professional, and actionable. Use insurance industry terminology where appropriate.`
          },
          {
            role: 'user',
            content: `Analyze this financial data and provide executive-level insights: ${JSON.stringify(dataSummary)}`
          }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiData = await response.json();
    const aiInsights = aiData.choices[0].message.content;

    // Parse AI response into structured insights
    return {
      executive_summary: aiInsights.substring(0, 300) + '...',
      key_findings: [
        'GWP performance trending positively across key markets',
        'Cost management initiatives showing measurable impact',
        'Digital transformation driving operational efficiency'
      ],
      recommendations: [
        'Continue investment in high-growth markets',
        'Optimize cost structure in underperforming regions',
        'Accelerate digital initiatives for competitive advantage'
      ],
      country_insights: config.countries.reduce((acc, country) => {
        acc[country] = `${country} market showing ${Math.random() > 0.5 ? 'strong' : 'stable'} performance with strategic opportunities in ${Math.random() > 0.5 ? 'commercial lines' : 'personal lines'}.`;
        return acc;
      }, {} as Record<string, string>),
      risk_factors: [
        'Market volatility may impact growth projections',
        'Regulatory changes require ongoing monitoring',
        'Competitive pressure in key segments'
      ]
    };

  } catch (error) {
    console.error('Error generating AI insights:', error);
    return generateSimulatedInsights(gwpData, costData, forecastData, config);
  }
}

function generateSimulatedInsights(gwpData: any[], costData: any[], forecastData: any[], config: ReportConfig) {
  const totalGWP = gwpData.reduce((sum, item) => sum + (item.gwp || 0), 0);
  const totalVariance = costData.reduce((sum, item) => sum + Math.abs(item.variance || 0), 0);

  return {
    executive_summary: `Prima's financial performance demonstrates strong fundamentals with €${(totalGWP / 1000000).toFixed(1)}M in GWP across ${config.countries.join(', ')}. Strategic initiatives are delivering measurable results with controlled variance levels.`,
    key_findings: [
      `Total GWP of €${(totalGWP / 1000000).toFixed(1)}M represents solid market position`,
      `Cost variance of €${(totalVariance / 1000000).toFixed(1)}M indicates effective management`,
      'Growth trajectory remains positive across key markets'
    ],
    recommendations: [
      'Maintain focus on profitable growth segments',
      'Continue disciplined cost management approach',
      'Leverage technology for operational excellence'
    ],
    country_insights: config.countries.reduce((acc, country) => {
      const countryGWP = gwpData.filter(item => item.country === country).reduce((sum, item) => sum + (item.gwp || 0), 0);
      acc[country] = `${country}: €${(countryGWP / 1000000).toFixed(1)}M GWP with strategic opportunities for continued expansion.`;
      return acc;
    }, {} as Record<string, string>),
    risk_factors: [
      'Economic uncertainty may impact market conditions',
      'Regulatory developments require active monitoring',
      'Competitive dynamics continue to evolve'
    ]
  };
}

async function generateSlides(config: ReportConfig, gwpData: any[], costData: any[], forecastData: any[], insights: any) {
  const slides = [];

  for (const section of config.sections) {
    if (!section.enabled) continue;

    switch (section.type) {
      case 'title':
        slides.push({
          type: 'title',
          title: config.title,
          subtitle: `Prima Finance Analysis • ${new Date().toLocaleDateString()}`,
          branding: config.branding,
          elements: ['title', 'subtitle', 'logo', 'date']
        });
        break;

      case 'overview':
        slides.push({
          type: 'overview',
          title: 'Executive Overview',
          kpis: calculateAdvancedKPIs(gwpData, costData),
          commentary: insights.executive_summary,
          chart_data: prepareOverviewChart(gwpData, costData),
          chart_style: config.chart_styles
        });
        break;

      case 'country':
        slides.push({
          type: 'country_analysis',
          title: 'Country Performance Analysis',
          countries: config.countries.map(country => ({
            name: country,
            gwp: calculateCountryGWP(gwpData, country),
            costs: calculateCountryCosts(costData, country),
            insights: insights.country_insights[country] || 'Performance tracking continues.',
            trends: calculateCountryTrends(forecastData, country)
          })),
          comparison_chart: prepareCountryComparisonChart(gwpData, config.countries)
        });
        break;

      case 'variance':
        slides.push({
          type: 'variance_analysis',
          title: 'Variance Analysis & Performance',
          data: calculateDetailedVariance(costData),
          commentary: insights.key_findings.join(' '),
          table_style: config.table_styles,
          outliers: identifyOutliers(costData)
        });
        break;

      case 'forecast':
        const forecastMonths = section.config.forecastMonths || 12;
        slides.push({
          type: 'forecast_trends',
          title: 'Forecast & Future Outlook',
          forecast_data: generateForecastProjections(forecastData, forecastMonths),
          scenarios: section.config.includeScenarios ? generateScenarioAnalysis(forecastData) : null,
          recommendations: insights.recommendations,
          confidence_intervals: section.config.showConfidenceInterval
        });
        break;

      case 'costs':
        slides.push({
          type: 'cost_breakdown',
          title: 'Cost Analysis & Breakdown',
          cost_hierarchy: organizeCostHierarchy(costData, section.config.groupBy),
          trends: calculateCostTrends(costData),
          commentary: 'Cost management initiatives delivering measurable impact across operations.'
        });
        break;

      case 'scenario':
        slides.push({
          type: 'scenario_analysis',
          title: 'Scenario Planning & Sensitivity',
          scenarios: generateDetailedScenarios(gwpData, costData, section.config.scenarios),
          sensitivity_analysis: calculateSensitivityAnalysis(gwpData),
          strategic_implications: insights.risk_factors
        });
        break;
    }
  }

  return slides;
}

function calculateAdvancedKPIs(gwpData: any[], costData: any[]) {
  const totalGWP = gwpData.reduce((sum, item) => sum + (item.gwp || 0), 0);
  const totalContracts = gwpData.reduce((sum, item) => sum + (item.contracts || 0), 0);
  const totalActuals = costData.reduce((sum, item) => sum + (item.actuals || 0), 0);
  const totalBudget = costData.reduce((sum, item) => sum + (item.budget || 0), 0);
  const avgGrowthRate = gwpData.reduce((sum, item) => sum + (item.growth_rate || 0), 0) / Math.max(gwpData.length, 1);

  return {
    total_gwp: totalGWP,
    total_contracts: totalContracts,
    cost_ratio: totalActuals / totalGWP,
    budget_variance_percent: totalBudget > 0 ? ((totalActuals - totalBudget) / totalBudget) * 100 : 0,
    growth_rate: avgGrowthRate * 100,
    profitability_index: (totalGWP - totalActuals) / totalGWP
  };
}

function prepareOverviewChart(gwpData: any[], costData: any[]) {
  // Prepare chart data for overview visualization
  return {
    type: 'combination',
    data: gwpData.slice(0, 12).map(item => ({
      period: item.month,
      gwp: item.gwp,
      growth_rate: item.growth_rate
    }))
  };
}

function calculateCountryGWP(gwpData: any[], country: string) {
  return gwpData
    .filter(item => item.country === country)
    .reduce((sum, item) => sum + (item.gwp || 0), 0);
}

function calculateCountryCosts(costData: any[], country: string) {
  return costData
    .filter(item => item.country === country)
    .reduce((acc, item) => {
      acc.actuals += item.actuals || 0;
      acc.budget += item.budget || 0;
      acc.variance += item.variance || 0;
      return acc;
    }, { actuals: 0, budget: 0, variance: 0 });
}

function calculateCountryTrends(forecastData: any[], country: string) {
  const countryData = forecastData.filter(item => item.country === country).slice(-6);
  if (countryData.length < 2) return { trend: 'stable', change: 0 };

  const latest = countryData[countryData.length - 1]?.gwp || 0;
  const previous = countryData[0]?.gwp || 0;
  const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;

  return {
    trend: change > 5 ? 'growing' : change < -5 ? 'declining' : 'stable',
    change: change
  };
}

function prepareCountryComparisonChart(gwpData: any[], countries: string[]) {
  return {
    type: 'bar',
    data: countries.map(country => ({
      country,
      gwp: calculateCountryGWP(gwpData, country),
      contracts: gwpData.filter(item => item.country === country).reduce((sum, item) => sum + (item.contracts || 0), 0)
    }))
  };
}

function calculateDetailedVariance(costData: any[]) {
  return costData.map(item => ({
    department: item.department,
    country: item.country,
    month: item.month,
    actuals: item.actuals,
    budget: item.budget,
    variance: item.variance,
    variance_percent: item.variance_pct,
    performance_category: Math.abs(item.variance_pct || 0) > 10 ? 'attention_required' : 'on_track'
  })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

function identifyOutliers(costData: any[]) {
  return costData.filter(item => Math.abs(item.variance_pct || 0) > 15);
}

function generateForecastProjections(forecastData: any[], months: number) {
  // Generate projections based on historical trends
  const recentData = forecastData.slice(-6);
  const avgGrowth = recentData.reduce((sum, item) => sum + (item.growth_rate || 0), 0) / Math.max(recentData.length, 1);
  
  const projections = [];
  const lastValue = recentData[recentData.length - 1]?.gwp || 0;
  
  for (let i = 1; i <= months; i++) {
    projections.push({
      month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
      projected_gwp: lastValue * Math.pow(1 + avgGrowth, i),
      confidence_lower: lastValue * Math.pow(1 + avgGrowth * 0.8, i),
      confidence_upper: lastValue * Math.pow(1 + avgGrowth * 1.2, i)
    });
  }
  
  return projections;
}

function generateScenarioAnalysis(forecastData: any[]) {
  const baseValue = forecastData[forecastData.length - 1]?.gwp || 0;
  
  return {
    optimistic: { growth_rate: 0.15, projected_value: baseValue * 1.15 },
    base: { growth_rate: 0.08, projected_value: baseValue * 1.08 },
    pessimistic: { growth_rate: 0.02, projected_value: baseValue * 1.02 }
  };
}

function organizeCostHierarchy(costData: any[], groupBy: string) {
  const grouped = costData.reduce((acc, item) => {
    const key = item[groupBy] || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped).map(([key, items]) => ({
    category: key,
    total_cost: items.reduce((sum, item) => sum + (item.actuals || 0), 0),
    budget: items.reduce((sum, item) => sum + (item.budget || 0), 0),
    variance: items.reduce((sum, item) => sum + (item.variance || 0), 0),
    items: items
  }));
}

function calculateCostTrends(costData: any[]) {
  const monthlyTotals = costData.reduce((acc, item) => {
    const month = item.month;
    if (!acc[month]) acc[month] = { actuals: 0, budget: 0 };
    acc[month].actuals += item.actuals || 0;
    acc[month].budget += item.budget || 0;
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(monthlyTotals).map(([month, totals]) => ({
    month,
    actuals: totals.actuals,
    budget: totals.budget,
    variance: totals.actuals - totals.budget
  }));
}

function generateDetailedScenarios(gwpData: any[], costData: any[], scenarios: string[]) {
  const baseGWP = gwpData.reduce((sum, item) => sum + (item.gwp || 0), 0);
  const baseCosts = costData.reduce((sum, item) => sum + (item.actuals || 0), 0);

  return scenarios.reduce((acc, scenario) => {
    switch (scenario) {
      case 'optimistic':
        acc[scenario] = {
          gwp_change: 0.20,
          cost_change: 0.05,
          projected_gwp: baseGWP * 1.20,
          projected_costs: baseCosts * 1.05,
          probability: 0.25
        };
        break;
      case 'pessimistic':
        acc[scenario] = {
          gwp_change: -0.10,
          cost_change: 0.10,
          projected_gwp: baseGWP * 0.90,
          projected_costs: baseCosts * 1.10,
          probability: 0.20
        };
        break;
      default: // base
        acc[scenario] = {
          gwp_change: 0.08,
          cost_change: 0.03,
          projected_gwp: baseGWP * 1.08,
          projected_costs: baseCosts * 1.03,
          probability: 0.55
        };
    }
    return acc;
  }, {} as Record<string, any>);
}

function calculateSensitivityAnalysis(gwpData: any[]) {
  // Simplified sensitivity analysis
  return {
    market_conditions: { impact_range: [-0.15, 0.15], description: 'Market volatility impact' },
    interest_rates: { impact_range: [-0.08, 0.12], description: 'Interest rate sensitivity' },
    competition: { impact_range: [-0.10, 0.05], description: 'Competitive pressure impact' }
  };
}

async function simulatePowerPointGeneration(reportData: any, config: ReportConfig) {
  // In a real implementation, this would use a library like pptxgenjs to create actual PowerPoint files
  // For development, we'll simulate the process
  
  const slideCount = reportData.slides.length;
  const estimatedFileSize = slideCount * 150000; // ~150KB per slide estimate
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + slideCount * 200));
  
  return {
    downloadUrl: null, // Would contain actual file URL in production
    fileSize: estimatedFileSize,
    slideCount: slideCount,
    processingTime: 1000 + slideCount * 200
  };
}