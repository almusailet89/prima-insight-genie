import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Note: In a full implementation, you'd use pptxgenjs, but edge functions have limitations
// This is a simplified version that generates report data structure

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  title?: string;
  period?: string;
  countries?: string[];
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

    const requestData: ReportRequest = await req.json();
    const { title = "Prima Finance Report", period, countries = ['Italy', 'UK', 'Spain'] } = requestData;

    console.log('Generating report for:', { title, period, countries });

    // Fetch GWP data
    let gwpQuery = supabase.from('forecast_gwp').select('*');
    if (countries.length > 0) {
      gwpQuery = gwpQuery.in('country', countries);
    }
    if (period) {
      gwpQuery = gwpQuery.gte('month', period);
    }
    
    const { data: gwpData, error: gwpError } = await gwpQuery;
    if (gwpError) throw gwpError;

    // Fetch cost monitoring data
    let costQuery = supabase.from('cost_monitoring').select('*');
    if (period) {
      costQuery = costQuery.gte('month', period);
    }
    
    const { data: costData, error: costError } = await costQuery;
    if (costError) throw costError;

    // Generate AI commentary for each section
    const aiCommentary = await generateAICommentary(gwpData || [], costData || []);

    // Create report structure
    const reportData = {
      metadata: {
        title,
        generatedAt: new Date().toISOString(),
        period: period || 'All periods',
        countries
      },
      slides: [
        {
          type: 'title',
          title: 'Prima Finance Monthly Report',
          subtitle: `${period || 'Comprehensive'} Analysis`,
          branding: {
            primaryColor: '#003366', // Prima blue
            secondaryColor: '#FF6B35', // Prima orange
            fontFamily: 'Segoe UI'
          }
        },
        {
          type: 'overview',
          title: 'Group Overview KPIs',
          data: calculateOverviewKPIs(gwpData || [], costData || []),
          commentary: aiCommentary.overview
        },
        {
          type: 'country_breakdown',
          title: 'Country-Level Analysis',
          countries: countries.map(country => ({
            name: country,
            gwp: calculateCountryGWP(gwpData || [], country),
            costs: calculateCountryCosts(costData || [], country),
            commentary: aiCommentary.countries[country] || 'No specific insights available.'
          }))
        },
        {
          type: 'variance_analysis',
          title: 'Variance vs Plan',
          data: calculateVarianceAnalysis(costData || []),
          commentary: aiCommentary.variance
        },
        {
          type: 'forecast_summary',
          title: 'Forecast Summary',
          data: calculateForecastSummary(gwpData || []),
          commentary: aiCommentary.forecast
        }
      ]
    };

    // In a full implementation, this would generate an actual PowerPoint file
    // For now, we return the structured data that could be used to generate slides
    return new Response(JSON.stringify({
      success: true,
      reportData,
      downloadUrl: null, // Would contain actual file URL in full implementation
      message: 'Report data generated successfully. PowerPoint generation would require additional setup.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateAICommentary(gwpData: any[], costData: any[]) {
  // In a full implementation, this would call OpenAI API
  // For now, generate basic commentary based on data patterns
  
  const totalGWP = gwpData.reduce((sum, item) => sum + (item.gwp || 0), 0);
  const totalVariance = costData.reduce((sum, item) => sum + Math.abs(item.variance || 0), 0);
  
  return {
    overview: `Total GWP across all countries: €${(totalGWP / 1000000).toFixed(1)}M. Overall cost variance of €${(totalVariance / 1000000).toFixed(1)}M indicates ${totalVariance > 0 ? 'budget overrun' : 'favorable performance'}.`,
    
    countries: {
      Italy: generateCountryCommentary('Italy', gwpData, costData),
      UK: generateCountryCommentary('UK', gwpData, costData),
      Spain: generateCountryCommentary('Spain', gwpData, costData)
    },
    
    variance: `Cost monitoring shows ${costData.filter(item => (item.variance || 0) > 0).length} departments over budget. Key areas requiring attention include departments with variance >10%.`,
    
    forecast: `Growth trends indicate ${gwpData.some(item => (item.growth_rate || 0) > 0.1) ? 'strong positive momentum' : 'stable performance'} across key markets.`
  };
}

function generateCountryCommentary(country: string, gwpData: any[], costData: any[]): string {
  const countryGWP = gwpData.filter(item => item.country === country);
  const countryCosts = costData.filter(item => item.country === country);
  
  const gwpTotal = countryGWP.reduce((sum, item) => sum + (item.gwp || 0), 0);
  const avgGrowth = countryGWP.reduce((sum, item) => sum + (item.growth_rate || 0), 0) / Math.max(countryGWP.length, 1);
  
  return `${country}: €${(gwpTotal / 1000000).toFixed(1)}M GWP with ${(avgGrowth * 100).toFixed(1)}% average growth rate. ${countryCosts.length} cost centers monitored.`;
}

function calculateOverviewKPIs(gwpData: any[], costData: any[]) {
  const totalGWP = gwpData.reduce((sum, item) => sum + (item.gwp || 0), 0);
  const totalContracts = gwpData.reduce((sum, item) => sum + (item.contracts || 0), 0);
  const totalActuals = costData.reduce((sum, item) => sum + (item.actuals || 0), 0);
  const totalBudget = costData.reduce((sum, item) => sum + (item.budget || 0), 0);
  const variancePercent = totalBudget > 0 ? ((totalActuals - totalBudget) / totalBudget) * 100 : 0;
  const ebitda = totalGWP - totalActuals; // Simplified EBITDA calculation

  return {
    totalGWP: totalGWP,
    totalContracts: totalContracts,
    variancePercent: variancePercent,
    ebitda: ebitda
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

function calculateVarianceAnalysis(costData: any[]) {
  return costData.map(item => ({
    department: item.department,
    country: item.country,
    month: item.month,
    actuals: item.actuals,
    budget: item.budget,
    variance: item.variance,
    variancePercent: item.variance_pct
  })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

function calculateForecastSummary(gwpData: any[]) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const recentData = gwpData.filter(item => item.month >= currentMonth);
  
  return {
    totalForecasts: recentData.length,
    averageGrowth: recentData.reduce((sum, item) => sum + (item.growth_rate || 0), 0) / Math.max(recentData.length, 1),
    totalGWPForecast: recentData.reduce((sum, item) => sum + (item.gwp || 0), 0),
    totalContractsForecast: recentData.reduce((sum, item) => sum + (item.contracts || 0), 0)
  };
}