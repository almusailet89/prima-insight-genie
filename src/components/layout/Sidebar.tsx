import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Upload, 
  MessageSquare, 
  Settings, 
  Home,
  TrendingUp,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'Upload Data',
    url: '/upload',
    icon: Upload,
  },
  {
    title: 'Chat Analysis',
    url: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'NetSuite',
    url: '/netsuite',
    icon: Database,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    return path !== '/' && location.pathname.startsWith(path);
  };

  return (
    <SidebarRoot className={cn(
      'border-r border-border bg-background',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <SidebarContent className="p-4">
        <div className={cn(
          'flex items-center gap-3 mb-8 px-2',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-foreground">Prima FP&A</h1>
              <p className="text-xs text-muted-foreground">Insurance Analytics</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            'text-xs font-medium text-muted-foreground mb-2',
            collapsed && 'sr-only'
          )}>
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl transition-colors',
                        'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        isActive(item.url) && 
                          'bg-primary/10 text-primary border border-primary/20'
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarRoot>
  );
}