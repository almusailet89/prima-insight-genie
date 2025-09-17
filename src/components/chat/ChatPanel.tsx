import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Send, Bot, User, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { storeChatHistory, getChatHistory } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  narrative?: string;
  dataUsed?: any[];
  timestamp: Date;
}

interface ChatPanelProps {
  contextData?: any[];
  currentFilters?: {
    entity?: string;
    period?: string;
    department?: string;
  };
}

export function ChatPanel({ contextData = [], currentFilters = {} }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataViewOpen, setDataViewOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory();
      if (history) {
        setMessages(history.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      await storeChatHistory(newMessages);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.chat({
        question: input,
        context: currentFilters,
        data: contextData,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data?.response || 'Sorry, I could not process your request.',
        narrative: response.data?.narrative,
        dataUsed: response.data?.dataUsed,
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveChatHistory(updatedMessages);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
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

  const formatNarrative = (narrative: string) => {
    const lines = narrative.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <li key={index} className="ml-4 text-sm text-muted-foreground">
            {line.substring(1).trim()}
          </li>
        );
      } else if (line.trim() && !line.startsWith(' ')) {
        return (
          <h4 key={index} className="font-semibold text-foreground mb-2">
            {line}
          </h4>
        );
      }
      return null;
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          CFO Analysis Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm">Ask me anything about your financial data.</p>
                <p className="text-xs mt-1">Try: "Q4 sales vs budget and last year"</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {message.narrative && (
                        <div className="mt-3 p-3 bg-background/50 rounded-lg">
                          <div className="space-y-1">
                            {formatNarrative(message.narrative)}
                          </div>
                        </div>
                      )}

                      {message.dataUsed && message.dataUsed.length > 0 && (
                        <Collapsible 
                          open={dataViewOpen} 
                          onOpenChange={setDataViewOpen}
                          className="mt-3"
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                              {dataViewOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              Data Used ({message.dataUsed.length} records)
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <pre className="text-xs bg-background/50 p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(message.dataUsed.slice(0, 5), null, 2)}
                              {message.dataUsed.length > 5 && `\n... and ${message.dataUsed.length - 5} more records`}
                            </pre>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 animate-pulse" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Q4 performance, variance analysis, trends..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="sm"
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}