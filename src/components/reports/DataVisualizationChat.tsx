import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User, Loader2, BarChart3, Table, FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionApplied?: any;
}

interface DataField {
  name: string;
  type: 'number' | 'string' | 'date';
  category: 'dimension' | 'measure';
}

interface DataVisualizationChatProps {
  onSlideAction: (action: any) => void;
  currentSlides: any[];
  globalFilters: any;
  availableData?: DataField[];
}

const defaultDataFields: DataField[] = [
  { name: 'month', type: 'date', category: 'dimension' },
  { name: 'country', type: 'string', category: 'dimension' },
  { name: 'department', type: 'string', category: 'dimension' },
  { name: 'gwp', type: 'number', category: 'measure' },
  { name: 'contracts', type: 'number', category: 'measure' },
  { name: 'revenue', type: 'number', category: 'measure' },
  { name: 'actuals', type: 'number', category: 'measure' },
  { name: 'budget', type: 'number', category: 'measure' },
  { name: 'variance', type: 'number', category: 'measure' },
  { name: 'growth_rate', type: 'number', category: 'measure' }
];

export function DataVisualizationChat({ 
  onSlideAction, 
  currentSlides, 
  globalFilters,
  availableData = defaultDataFields 
}: DataVisualizationChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your data visualization assistant. I can help you create charts, tables, and narratives from your financial data. Try asking me:\n\n• "Create a line chart showing GWP trends by month"\n• "Generate a variance table for Italy and UK"\n• "Show me a bar chart of revenue by department"\n• "Write a narrative about our Q4 performance"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
  const [chartType, setChartType] = useState<string>('line');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const dimensions = availableData.filter(field => field.category === 'dimension');
  const measures = availableData.filter(field => field.category === 'measure');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  const generateVisualization = async (type: 'chart' | 'table' | 'narrative') => {
    if (!selectedMeasures.length && type !== 'narrative') {
      toast({
        title: "Selection Required",
        description: "Please select at least one measure for the visualization",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const prompt = type === 'narrative' 
      ? `Generate an executive narrative about ${selectedMeasures.join(', ')} performance across ${selectedDimensions.join(', ')} with current filters: ${JSON.stringify(globalFilters)}`
      : `Create a ${type} showing ${selectedMeasures.join(', ')} by ${selectedDimensions.join(', ')} with chart type ${chartType}`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await supabase.functions.invoke('ask-jude', {
        body: {
          message: prompt,
          context: {
            currentSlides,
            globalFilters,
            selectedFields: {
              dimensions: selectedDimensions,
              measures: selectedMeasures,
              chartType: type === 'chart' ? chartType : undefined
            },
            visualizationType: type
          }
        }
      });

      if (response.error) throw response.error;

      const { reply, actions } = response.data;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        actionApplied: actions?.[0]
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Execute slide actions
      if (actions && actions.length > 0) {
        actions.forEach((action: any) => {
          // Enhance action with selected data
          const enhancedAction = {
            ...action,
            params: {
              ...action.params,
              chart: type === 'chart' ? {
                type: chartType,
                x: selectedDimensions[0] || 'month',
                y: selectedMeasures,
                series: selectedDimensions[1]
              } : action.params?.chart,
              table: type === 'table' ? {
                columns: [...selectedDimensions, ...selectedMeasures],
                filters: globalFilters
              } : action.params?.table
            }
          };
          onSlideAction(enhancedAction);
        });

        toast({
          title: "Visualization Created",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been added to your report`,
        });
      }

    } catch (error) {
      console.error('Error generating visualization:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error generating the visualization. Please check the data selection and try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to generate visualization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ask-jude', {
        body: {
          message: currentInput,
          context: {
            currentSlides,
            globalFilters,
            availableFields: availableData,
            slideCount: currentSlides.length
          }
        }
      });

      if (response.error) throw response.error;

      const { reply, actions } = response.data;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        actionApplied: actions?.[0]
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Execute slide actions
      if (actions && actions.length > 0) {
        actions.forEach((action: any) => {
          onSlideAction(action);
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Data Visualization Assistant</h3>
            <p className="text-xs text-muted-foreground">Create charts, tables & narratives</p>
          </div>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">
          <Bot className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Data Selection Panel */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Data Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium">Dimensions</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {dimensions.map(dim => (
                <Badge 
                  key={dim.name}
                  variant={selectedDimensions.includes(dim.name) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    if (selectedDimensions.includes(dim.name)) {
                      setSelectedDimensions(prev => prev.filter(d => d !== dim.name));
                    } else {
                      setSelectedDimensions(prev => [...prev, dim.name]);
                    }
                  }}
                >
                  {dim.name}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Measures</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {measures.map(measure => (
                <Badge 
                  key={measure.name}
                  variant={selectedMeasures.includes(measure.name) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    if (selectedMeasures.includes(measure.name)) {
                      setSelectedMeasures(prev => prev.filter(m => m !== measure.name));
                    } else {
                      setSelectedMeasures(prev => [...prev, measure.name]);
                    }
                  }}
                >
                  {measure.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium">Chart Type</label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="waterfall">Waterfall</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => generateVisualization('chart')}
              disabled={isLoading}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Chart
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => generateVisualization('table')}
              disabled={isLoading}
            >
              <Table className="h-3 w-3 mr-1" />
              Table
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => generateVisualization('narrative')}
              disabled={isLoading}
            >
              <FileText className="h-3 w-3 mr-1" />
              Narrative
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 pt-2" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0 mt-1">
                  <Bot className="h-3 w-3" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {message.actionApplied && (
                  <div className="mt-2 p-2 bg-accent/50 rounded text-xs">
                    <p className="font-medium">Visualization Created:</p>
                    <p className="text-muted-foreground">
                      {message.actionApplied.slideType} - {message.actionApplied.intent}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground shrink-0 mt-1 order-3">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground shrink-0 mt-1">
                <Bot className="h-3 w-3" />
              </div>
              <div className="max-w-[80%]">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Creating visualization...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for charts, tables, or narratives..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Select data above and click Chart/Table/Narrative, or type a custom request
        </div>
      </div>
    </div>
  );
}