import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  slideAction?: any;
}

interface AskJudeChatProps {
  onSlideAction: (action: any) => void;
  currentSlides: any[];
  globalFilters: any;
}

export function AskJudeChat({ onSlideAction, currentSlides, globalFilters }: AskJudeChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Jude, your finance copilot. I can help you create and edit slides for your Prima reports. Try asking me to:\n\n• "Add a variance slide for Italy Q2 vs budget"\n• "Create a KPI overview with revenue and EBITDA"\n• "Add forecast chart for next 12 months"\n• "Change the title to Financial Performance Review"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ask-jude', {
        body: {
          message: input.trim(),
          context: {
            currentSlides,
            globalFilters,
            slideCount: currentSlides.length
          }
        }
      });

      if (response.error) throw response.error;

      const { reply, intent, actions } = response.data;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        slideAction: actions?.[0]
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
        content: 'I\'m sorry, I encountered an error processing your request. Please make sure the OpenAI API key is configured and try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your request. Check if OpenAI API key is configured.",
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
    <div className="flex flex-col h-[600px] border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Ask Jude</h3>
            <p className="text-xs text-muted-foreground">Finance Copilot</p>
          </div>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">
          <Bot className="h-3 w-3 mr-1" />
          AI Assistant
        </Badge>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
                
                {message.slideAction && (
                  <div className="mt-2 p-2 bg-accent/50 rounded text-xs">
                    <p className="font-medium">Action Applied:</p>
                    <p className="text-muted-foreground">
                      {message.slideAction.intent} - {message.slideAction.slideType || 'slide'}
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
                    <p className="text-sm">Jude is thinking...</p>
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
            placeholder="Ask Jude to create or edit slides..."
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
          Try: "Add variance slide for Italy" • "Create KPI overview" • "Change title"
        </div>
      </div>
    </div>
  );
}