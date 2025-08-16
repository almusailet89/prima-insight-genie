import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { AskJudeSidebar } from '@/components/ask-jude/AskJudeSidebar';
import { useLocation } from 'react-router-dom';

export const GlobalAskJude: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Determine current tab from pathname
  const getCurrentTab = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('overview')) return 'overview';
    if (path.includes('variance')) return 'variance';
    if (path.includes('sales')) return 'sales';
    if (path.includes('forecast')) return 'forecast';
    if (path.includes('ratios')) return 'ratios';
    if (path.includes('scenario')) return 'scenario';
    if (path.includes('reports')) return 'reports';
    return 'dashboard';
  };

  return (
    <>
      {/* Floating Ask Jude Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
          size="sm"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      )}

      {/* Ask Jude Sidebar */}
      <AskJudeSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentTab={getCurrentTab()}
        contextData={{}}
      />
    </>
  );
};