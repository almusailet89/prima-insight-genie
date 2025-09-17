import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Send, Bot, User, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  dataUsed?: string[];
}

interface FinancialChatPanelProps {
  className?: string;
}

export function FinancialChatPanel({ className }: FinancialChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your CFO assistant. I can help you analyze financial performance, explain variances, and provide insights about your insurance portfolio.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedData, setExpandedData] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: 'financial_analysis'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(),
        dataUsed: data.dataUsed || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
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

  const formatContent = (content: string) => {
    // Simple formatting for CFO narrative style
    const lines = content.split('\n');
    let formattedContent = '';
    let inBulletList = false;

    for (let line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        if (!inBulletList) {
          formattedContent += '<ul class="list-disc list-inside ml-4 space-y-1">';
          inBulletList = true;
        }
        formattedContent += `<li>${trimmedLine.substring(1).trim()}</li>`;
      } else {
        if (inBulletList) {
          formattedContent += '</ul>';
          inBulletList = false;
        }
        if (trimmedLine) {
          // Check if it's a headline (short line ending with colon or all caps)
          if (trimmedLine.length < 50 && (trimmedLine.endsWith(':') || trimmedLine === trimmedLine.toUpperCase())) {
            formattedContent += `<h4 class="font-semibold text-primary mt-3 mb-2">${trimmedLine}</h4>`;
          } else {
            formattedContent += `<p class="mb-2">${trimmedLine}</p>`;
          }
        }
      }
    }
    
    if (inBulletList) {
      formattedContent += '</ul>';
    }
    
    return formattedContent;
  };

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="bg-gradient-to-r from-primary to-success text-white rounded-t-2xl">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          CFO Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`chat-bubble ${message.role}`}>
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 mt-1 text-primary" />
                      ) : (
                        <User className="w-4 h-4 mt-1 text-primary-foreground" />
                      )}
                      <div className="flex-1">
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ 
                            __html: message.role === 'assistant' 
                              ? formatContent(message.content)
                              : message.content 
                          }}
                        />
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {message.dataUsed && message.dataUsed.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-6"
                        onClick={() => setExpandedData(expandedData === message.id ? null : message.id)}
                      >
                        <Database className="w-3 h-3 mr-1" />
                        Data Used ({message.dataUsed.length})
                        {expandedData === message.id ? (
                          <ChevronUp className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-6 mt-2">
                      <div className="text-xs bg-muted p-3 rounded-lg">
                        <ul className="space-y-1">
                          {message.dataUsed.map((data, index) => (
                            <li key={index} className="text-muted-foreground">• {data}</li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble assistant">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about financial performance, variances, or insights..."
              className="flex-1 rounded-xl"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-financial rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}