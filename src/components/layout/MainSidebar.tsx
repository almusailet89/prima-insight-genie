import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Calculator, 
  FileText,
  Palette,
  Home,
  Upload,
  Settings
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Core Analytics',
    items: [
      { title: 'Overview Dashboard', url: '/', icon: Home },
      { title: 'Variance Analysis', url: '/variance', icon: BarChart },
      { title: 'Sales Analysis', url: '/sales', icon: TrendingUp },
      { title: 'Enhanced Forecasting', url: '/forecasting', icon: Calculator },
    ],
  },
  {
    title: 'Tools',
    items: [
      { title: 'Import Data', url: '/import', icon: Upload },
      { title: 'Financial Ratios', url: '/ratios', icon: Calculator },
      { title: 'NetSuite Integration', url: '/netsuite', icon: Settings },
      { title: 'Scenario Simulator', url: '/scenarios', icon: Users },
      { title: 'Reports & Narratives', url: '/reports', icon: FileText },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Theme Manager', url: '/theme', icon: Palette },
      { title: 'Account Settings', url: '/settings', icon: Settings },
    ],
  },
];

export function MainSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Prima Finance
        </h2>
        <p className="text-sm text-sidebar-foreground/70">
          Financial Planning & Analysis
        </p>
      </SidebarHeader>
      
      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}