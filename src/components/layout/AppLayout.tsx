import { ReactNode, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MainSidebar } from './MainSidebar';
import { TopBar } from './TopBar';
import { AskJudeModal } from '../ask-jude/AskJudeModal';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isAskJudeOpen, setIsAskJudeOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MainSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar onOpenAskJude={() => setIsAskJudeOpen(true)} />
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
      
      <AskJudeModal 
        open={isAskJudeOpen} 
        onOpenChange={setIsAskJudeOpen} 
      />
    </SidebarProvider>
  );
}