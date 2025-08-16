import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileUploadData {
  fileName: string;
  fileContent: string; // base64 encoded
  fileType: string;
}

interface ParsedRow {
  [key: string]: string | number | null;
}

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

    const { fileName, fileContent, fileType }: FileUploadData = await req.json();
    
    console.log(`Processing file: ${fileName}, type: ${fileType}`);

    // Decode base64 content
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let parsedData: ParsedRow[] = [];
    let detectedTable = '';

    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      // Parse CSV using simple parsing (since we can't import papaparse in edge functions)
      const textContent = new TextDecoder().decode(bytes);
      parsedData = await parseCSV(textContent);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // For Excel files, we'll need the user to convert to CSV first
      // In a full implementation, you'd use a library like SheetJS
      throw new Error('Excel files not yet supported. Please convert to CSV first.');
    }

    if (parsedData.length === 0) {
      throw new Error('No data found in file');
    }

    // Auto-detect table type based on headers
    const headers = Object.keys(parsedData[0]).map(h => h.toLowerCase().trim());
    console.log('Detected headers:', headers);

    if (headers.some(h => ['gwp', 'contracts', 'growth'].some(keyword => h.includes(keyword)))) {
      detectedTable = 'forecast_gwp';
      await processGWPData(supabase, parsedData);
    } else if (headers.some(h => ['department', 'actuals', 'budget', 'cost'].some(keyword => h.includes(keyword)))) {
      detectedTable = 'cost_monitoring';
      await processCostData(supabase, parsedData);
    } else {
      throw new Error('Could not auto-detect table type. Please ensure headers contain relevant keywords.');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully processed ${parsedData.length} rows into ${detectedTable}`,
      recordsProcessed: parsedData.length,
      tableType: detectedTable
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function parseCSV(csvText: string): Promise<ParsedRow[]> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/\"/g, ''));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/\"/g, ''));
    const row: ParsedRow = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      // Try to parse as number, otherwise keep as string
      row[header] = isNaN(Number(value)) ? value : Number(value);
    });
    
    rows.push(row);
  }

  return rows;
}

async function processGWPData(supabase: any, data: ParsedRow[]) {
  const transformedData = data.map(row => {
    // Map common header variations to standard fields
    const country = findValue(row, ['country', 'nation', 'region']) || 'Unknown';
    const month = findValue(row, ['month', 'date', 'period']) || new Date().toISOString().split('T')[0];
    const gwp = Number(findValue(row, ['gwp', 'gross_written_premium', 'premium']) || 0);
    const contracts = Number(findValue(row, ['contracts', 'policies', 'count']) || 0);
    const growth_rate = Number(findValue(row, ['growth_rate', 'growth', 'rate']) || 0);

    return {
      country: String(country),
      month: formatDate(month),
      gwp,
      contracts,
      growth_rate: growth_rate > 1 ? growth_rate / 100 : growth_rate, // Convert percentage to decimal
    };
  });

  // Upsert data (insert or update on conflict)
  const { error } = await supabase
    .from('forecast_gwp')
    .upsert(transformedData, { 
      onConflict: 'country,month',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error inserting GWP data:', error);
    throw new Error(`Failed to insert GWP data: ${error.message}`);
  }

  console.log(`Successfully upserted ${transformedData.length} GWP records`);
}

async function processCostData(supabase: any, data: ParsedRow[]) {
  const transformedData = data.map(row => {
    const country = findValue(row, ['country', 'nation', 'region']);
    const department = findValue(row, ['department', 'dept', 'division']) || 'Unknown';
    const month = findValue(row, ['month', 'date', 'period']) || new Date().toISOString().split('T')[0];
    const actuals = Number(findValue(row, ['actuals', 'actual', 'spent']) || 0);
    const budget = Number(findValue(row, ['budget', 'budgeted', 'planned']) || 0);

    return {
      country: country ? String(country) : null,
      department: String(department),
      month: formatDate(month),
      actuals,
      budget,
    };
  });

  // Upsert data
  const { error } = await supabase
    .from('cost_monitoring')
    .upsert(transformedData, { 
      onConflict: 'department,month',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error inserting cost data:', error);
    throw new Error(`Failed to insert cost data: ${error.message}`);
  }

  console.log(`Successfully upserted ${transformedData.length} cost monitoring records`);
}

function findValue(row: ParsedRow, possibleKeys: string[]): string | number | null {
  for (const key of possibleKeys) {
    // Try exact match first
    if (row[key] !== undefined) return row[key];
    
    // Try case-insensitive match
    const foundKey = Object.keys(row).find(k => 
      k.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(k.toLowerCase())
    );
    if (foundKey && row[foundKey] !== undefined) return row[foundKey];
  }
  return null;
}

function formatDate(dateValue: string | number): string {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    // If parsing fails, try to extract year/month and create month-end date
    const dateStr = String(dateValue);
    const yearMatch = dateStr.match(/20\d{2}/);
    const monthMatch = dateStr.match(/\b(0?[1-9]|1[012])\b/);
    
    if (yearMatch && monthMatch) {
      const year = parseInt(yearMatch[0]);
      const month = parseInt(monthMatch[0]);
      return new Date(year, month - 1, 1).toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  }
  
  return date.toISOString().split('T')[0];
}
