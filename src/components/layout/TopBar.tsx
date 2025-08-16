import { Search, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface TopBarProps {
  onOpenAskJude: () => void;
}

export function TopBar({ onOpenAskJude }: TopBarProps) {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Button
            variant="outline"
            className="w-96 justify-start text-muted-foreground pl-10"
            onClick={onOpenAskJude}
          >
            Ask Jude anything about your finances...
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onOpenAskJude}
          className="gap-2"
        >
          <Bot className="h-4 w-4" />
          Ask Jude
        </Button>
      </div>
    </header>
  );
}