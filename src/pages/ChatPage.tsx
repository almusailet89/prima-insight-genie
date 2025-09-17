import { ChatPanel } from '@/components/chat/ChatPanel';
import { getUploadedData } from '@/lib/storage';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [contextData, setContextData] = useState<any[]>([]);

  useEffect(() => {
    loadContextData();
  }, []);

  const loadContextData = async () => {
    try {
      const data = await getUploadedData();
      setContextData(data || []);
    } catch (error) {
      console.error('Failed to load context data:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Financial Analysis Chat</h1>
        <p className="text-muted-foreground">Ask questions about your financial data</p>
      </div>
      
      <div className="max-w-4xl mx-auto h-[600px]">
        <ChatPanel 
          contextData={contextData}
          currentFilters={{}}
        />
      </div>
    </div>
  );
}