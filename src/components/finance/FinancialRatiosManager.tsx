import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Calculator, TrendingUp, Percent, DollarSign, Upload, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

interface FinancialRatio {
  id: string;
  name: string;
  formula: string;
  description: string;
  category: 'profitability' | 'efficiency' | 'liquidity' | 'leverage' | 'growth' | 'custom';
  displayFormat: 'percentage' | 'ratio' | 'currency' | 'number';
  isActive: boolean;
}

interface SuggestedRatio extends FinancialRatio {
  confidence: number;
  source: string;
}

interface FinancialRatiosManagerProps {
  onRatiosChange?: (ratios: FinancialRatio[]) => void;
}

const defaultRatios: FinancialRatio[] = [
  {
    id: '1',
    name: 'Combined Ratio',
    formula: '(Claims + Expenses) / GWP * 100',
    description: 'Combined ratio measures underwriting profitability',
    category: 'profitability',
    displayFormat: 'percentage',
    isActive: true
  },
  {
    id: '2',
    name: 'Loss Ratio',
    formula: 'Claims / GWP * 100',
    description: 'Percentage of claims to gross written premiums',
    category: 'profitability',
    displayFormat: 'percentage',
    isActive: true
  },
  {
    id: '3',
    name: 'Expense Ratio',
    formula: 'Operating_Expenses / GWP * 100',
    description: 'Operating expenses as percentage of GWP',
    category: 'efficiency',
    displayFormat: 'percentage',
    isActive: true
  },
  {
    id: '4',
    name: 'ROE',
    formula: 'Net_Income / Shareholders_Equity * 100',
    description: 'Return on Equity measures profitability relative to equity',
    category: 'profitability',
    displayFormat: 'percentage',
    isActive: true
  },
  {
    id: '5',
    name: 'Growth Rate',
    formula: '(Current_GWP - Previous_GWP) / Previous_GWP * 100',
    description: 'YoY growth rate for gross written premiums',
    category: 'growth',
    displayFormat: 'percentage',
    isActive: true
  },
  {
    id: '6',
    name: 'Premium to Surplus',
    formula: 'GWP / Surplus',
    description: 'Leverage ratio showing premium volume relative to surplus',
    category: 'leverage',
    displayFormat: 'ratio',
    isActive: false
  }
];

export function FinancialRatiosManager({ onRatiosChange }: FinancialRatiosManagerProps) {
  const [ratios, setRatios] = useState<FinancialRatio[]>(() => {
    const saved = localStorage.getItem('financial_ratios');
    return saved ? JSON.parse(saved) : defaultRatios;
  });
  const [editingRatio, setEditingRatio] = useState<FinancialRatio | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [suggestedRatios, setSuggestedRatios] = useState<SuggestedRatio[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('financial_ratios', JSON.stringify(ratios));
    onRatiosChange?.(ratios);
  }, [ratios, onRatiosChange]);

  const createNewRatio = () => {
    const newRatio: FinancialRatio = {
      id: Date.now().toString(),
      name: '',
      formula: '',
      description: '',
      category: 'custom',
      displayFormat: 'percentage',
      isActive: true
    };
    setEditingRatio(newRatio);
    setIsCreating(true);
  };

  const saveRatio = () => {
    if (!editingRatio?.name || !editingRatio?.formula) {
      toast({
        title: "Validation Error",
        description: "Name and formula are required",
        variant: "destructive",
      });
      return;
    }

    if (isCreating) {
      setRatios(prev => [...prev, editingRatio]);
      toast({
        title: "Ratio Created",
        description: `${editingRatio.name} has been created successfully`,
      });
    } else {
      setRatios(prev => prev.map(r => r.id === editingRatio.id ? editingRatio : r));
      toast({
        title: "Ratio Updated",
        description: `${editingRatio.name} has been updated successfully`,
      });
    }

    setEditingRatio(null);
    setIsCreating(false);
  };

  const deleteRatio = (id: string) => {
    setRatios(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Ratio Deleted",
      description: "Financial ratio has been removed",
    });
  };

  const toggleRatioActive = (id: string) => {
    setRatios(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profitability': return <DollarSign className="h-4 w-4" />;
      case 'efficiency': return <TrendingUp className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'leverage': return <Percent className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profitability': return 'bg-green-100 text-green-800';
      case 'efficiency': return 'bg-blue-100 text-blue-800';
      case 'growth': return 'bg-purple-100 text-purple-800';
      case 'leverage': return 'bg-orange-100 text-orange-800';
      case 'liquidity': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const analyzeFileForRatios = async (fileData: string, fileName: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('https://cgvdtcmchxkbnsdgbcvz.supabase.co/functions/v1/analyze-financial-ratios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNndmR0Y21jaHhrYm5zZGdiY3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTk4NjUsImV4cCI6MjA3MDkzNTg2NX0.bGTEfgu5ry1-yiPp6ZMO_TtObHnoaHwKNssCGbZsJJg'}`,
        },
        body: JSON.stringify({
          fileData,
          fileName,
          existingRatios: ratios.map(r => r.name)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }

      const { suggestedRatios: suggestions } = await response.json();
      setSuggestedRatios(suggestions);
      setShowSuggestions(true);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${suggestions.length} potential financial ratios in ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the file for financial ratios",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const fileData = await file.arrayBuffer();
      let content = '';

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(fileData);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        content = XLSX.utils.sheet_to_csv(worksheet);
      } else if (file.name.endsWith('.csv')) {
        content = new TextDecoder().decode(fileData);
      } else {
        toast({
          title: "Unsupported File",
          description: "Please upload Excel (.xlsx, .xls) or CSV files",
          variant: "destructive",
        });
        return;
      }

      await analyzeFileForRatios(content, file.name);
    } catch (error) {
      toast({
        title: "File Read Error",
        description: "Unable to read the uploaded file",
        variant: "destructive",
      });
    }
  }, [ratios]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleSuggestionToggle = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const addSelectedSuggestions = () => {
    const ratiosToAdd = suggestedRatios
      .filter(suggestion => selectedSuggestions.has(suggestion.id))
      .map(suggestion => ({
        id: Date.now().toString() + Math.random().toString(),
        name: suggestion.name,
        formula: suggestion.formula,
        description: suggestion.description,
        category: suggestion.category,
        displayFormat: suggestion.displayFormat,
        isActive: true,
      }));

    setRatios(prev => [...prev, ...ratiosToAdd]);
    setShowSuggestions(false);
    setSelectedSuggestions(new Set());
    setSuggestedRatios([]);
    
    toast({
      title: "Ratios Added",
      description: `Successfully added ${ratiosToAdd.length} financial ratios`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Ratios & KPIs</h2>
          <p className="text-muted-foreground">Manage custom financial ratios and formulas for your reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createNewRatio}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ratio
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Analyze File
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const files = e.target.files;
              if (files) onDrop(Array.from(files));
            }}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Editing Form */}
      {editingRatio && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {isCreating ? 'Create New Ratio' : 'Edit Ratio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ratio Name</Label>
                <Input
                  id="name"
                  value={editingRatio.name}
                  onChange={(e) => setEditingRatio(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Combined Ratio"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editingRatio.category}
                  onValueChange={(value) => setEditingRatio(prev => prev ? { ...prev, category: value as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profitability">Profitability</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="liquidity">Liquidity</SelectItem>
                    <SelectItem value="leverage">Leverage</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="formula">Formula</Label>
              <Input
                id="formula"
                value={editingRatio.formula}
                onChange={(e) => setEditingRatio(prev => prev ? { ...prev, formula: e.target.value } : null)}
                placeholder="e.g., (Claims + Expenses) / GWP * 100"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use field names like GWP, Claims, Expenses, Net_Income, etc.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingRatio.description}
                onChange={(e) => setEditingRatio(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Brief description of what this ratio measures"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="displayFormat">Display Format</Label>
              <Select
                value={editingRatio.displayFormat}
                onValueChange={(value) => setEditingRatio(prev => prev ? { ...prev, displayFormat: value as any } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="ratio">Ratio (x:1)</SelectItem>
                  <SelectItem value="currency">Currency (€)</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveRatio}>
                Save Ratio
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingRatio(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Drop Zone */}
      <Card className="border-dashed border-2">
        <CardContent className="p-8">
          <div 
            {...getRootProps()} 
            className={`text-center cursor-pointer transition-colors ${
              isDragActive ? 'bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing file for financial ratios...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop Excel or CSV files here to auto-detect financial ratios
                </p>
                <p className="text-xs text-muted-foreground">
                  AI will analyze your data and suggest relevant financial formulas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Suggested Financial Ratios
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI has detected {suggestedRatios.length} potential financial ratios in your file. 
              Select the ones you'd like to add to your ratio library:
            </p>
            
            <div className="space-y-3">
              {suggestedRatios.map((suggestion) => (
                <Card key={suggestion.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSuggestions.has(suggestion.id)}
                      onCheckedChange={() => handleSuggestionToggle(suggestion.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{suggestion.name}</h4>
                        <Badge variant="secondary" className={getCategoryColor(suggestion.category)}>
                          {getCategoryIcon(suggestion.category)}
                          <span className="ml-1 capitalize">{suggestion.category}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-mono bg-muted p-2 rounded">
                        {suggestion.formula}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {suggestion.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Source: {suggestion.source}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>Format: {suggestion.displayFormat}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                {selectedSuggestions.size} of {suggestedRatios.length} ratios selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSuggestions(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addSelectedSuggestions}
                  disabled={selectedSuggestions.size === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Selected ({selectedSuggestions.size})
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ratios List */}
      <div className="grid gap-4">
        {ratios.map((ratio) => (
          <Card key={ratio.id} className={`${ratio.isActive ? '' : 'opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{ratio.name}</h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getCategoryColor(ratio.category)}`}
                    >
                      {getCategoryIcon(ratio.category)}
                      <span className="ml-1 capitalize">{ratio.category}</span>
                    </Badge>
                    <Badge variant={ratio.isActive ? 'default' : 'secondary'}>
                      {ratio.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    {ratio.formula}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {ratio.description}
                  </p>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">Format:</span>
                    <Badge variant="outline" className="text-xs">
                      {ratio.displayFormat}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRatioActive(ratio.id)}
                  >
                    {ratio.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRatio(ratio);
                      setIsCreating(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRatio(ratio.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ratios.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Financial Ratios</h3>
            <p className="text-muted-foreground mb-4">
              Create custom financial ratios and KPIs for your reports
            </p>
            <Button onClick={createNewRatio}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Ratio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}