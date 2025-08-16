import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, BarChart3, FileText, Calculator, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  actions?: Array<{
    type: 'navigate' | 'generate' | 'filter' | 'export';
    label: string;
    target?: string;
    params?: any;
  }>;
  isStreaming?: boolean;
}

interface AskJudeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const suggestedQueries = [
  {
    text: 'Show me the latest GWP performance by country',
    icon: BarChart3,
    category: 'analytics'
  },
  {
    text: 'Generate a PowerPoint report for Q4 results',
    icon: FileText,
    category: 'reports'
  },
  {
    text: 'Create a scenario analysis with 15% price increase',
    icon: Calculator,
    category: 'modeling'
  },
  {
    text: 'Navigate to variance analysis for Italy',
    icon: TrendingUp,
    category: 'navigation'
  },
  {
    text: 'What are the key financial trends this month?',
    icon: Sparkles,
    category: 'insights'
  }
];

export function AskJudeModal({ open, onOpenChange }: AskJudeModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const executeAction = (action: any) => {
    switch (action.type) {
      case 'navigate':
        if (action.target) {
          navigate(action.target);
          onOpenChange(false);
        }
        break;
      case 'generate':
        if (action.target === 'report') {
          navigate('/reports');
          onOpenChange(false);
        }
        break;
      case 'filter':
        // Could integrate with global filters
        toast({
          title: 'Filter Applied',
          description: `Applied filter: ${action.label}`,
        });
        break;
      case 'export':
        toast({
          title: 'Export Started',
          description: `Exporting ${action.label}...`,
        });
        break;
    }
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-jude', {
        body: {
          message: messageText,
          context: {
            currentPath: window.location.pathname,
            conversationHistory: messages.slice(-6), // Send last 6 messages for context
          },
        },
      });

      if (error) throw error;
      
      // Simulate typing effect
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        intent: data.intent,
        actions: data.actions,
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      // Simulate streaming by revealing text gradually
      const fullText = data.response;
      const words = fullText.split(' ');
      
      for (let i = 0; i <= words.length; i++) {
        const partialText = words.slice(0, i).join(' ');
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: partialText, isStreaming: i < words.length }
              : msg
          ));
        }, i * 50); // 50ms delay between words
      }

    } catch (error) {
      setIsTyping(false);
      toast({
        title: 'Error',
        description: 'Failed to get response from Jude. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[700px] flex flex-col bg-background border-2">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold">Chat with Jude</span>
              <p className="text-sm text-muted-foreground font-normal">
                Your AI-powered Prima Finance assistant
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">How can I help you today?</h3>
                <p className="text-muted-foreground max-w-md">
                  I can help with financial analysis, generate reports, navigate the app, 
                  create scenarios, and provide insights on your Prima Finance data.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                {suggestedQueries.map((query, index) => {
                  const IconComponent = query.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(query.text)}
                      className="flex items-center gap-3 p-4 text-left rounded-lg border border-border hover:bg-accent/50 hover:border-accent-foreground/20 transition-all group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{query.text}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {query.category}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
              <div className="space-y-6 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-12'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap mb-0 leading-relaxed">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                          )}
                        </p>
                      </div>
                      
                      {message.intent && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {message.intent}
                        </Badge>
                      )}
                      
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => executeAction(action)}
                              className="h-8 text-xs"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {message.type === 'user' && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex-shrink-0">
                        <span className="text-xs font-semibold text-primary-foreground">U</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="border-t pt-4 px-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Message Jude... (Shift + Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="min-h-[44px] max-h-[120px] resize-none pr-12 rounded-xl border-2 focus:border-primary/50"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2">
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="w-8 h-8 rounded-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Jude can analyze data, generate reports, and navigate the app for you
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}