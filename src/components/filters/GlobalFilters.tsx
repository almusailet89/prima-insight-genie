import { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Building, Globe, Package, Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FilterState } from '@/types';

interface GlobalFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showQuickRanges?: boolean;
}

export function GlobalFilters({ filters, onFiltersChange, showQuickRanges = true }: GlobalFiltersProps) {
  const [dimensions, setDimensions] = useState({
    businessUnits: [],
    markets: [],
    products: [],
    channels: [],
  });

  useEffect(() => {
    loadDimensions();
  }, []);

  const loadDimensions = async () => {
    try {
      const [businessUnits, markets, products, channels] = await Promise.all([
        supabase.from('business_units').select('id, name'),
        supabase.from('dim_markets').select('id, country'),
        supabase.from('dim_products').select('id, name'),
        supabase.from('dim_channels').select('id, name'),
      ]);

      setDimensions({
        businessUnits: businessUnits.data || [],
        markets: markets.data || [],
        products: products.data || [],
        channels: channels.data || [],
      });
    } catch (error) {
      console.error('Error loading dimensions:', error);
    }
  };

  const quickRanges = [
    { label: 'Last 3 months', months: 3 },
    { label: 'Last 6 months', months: 6 },
    { label: 'Last 12 months', months: 12 },
    { label: 'YTD', months: 'ytd' },
  ];

  const setQuickRange = (months: number | string) => {
    const now = new Date();
    let startDate: string;
    
    if (months === 'ytd') {
      startDate = `${now.getFullYear()}-01`;
    } else {
      const start = new Date(now.getFullYear(), now.getMonth() - (months as number) + 1, 1);
      startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    onFiltersChange({
      ...filters,
      dateRange: [startDate, endDate],
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              <input
                type="month"
                value={filters.dateRange[0]}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateRange: [e.target.value, filters.dateRange[1]]
                })}
                className="px-3 py-1 border rounded text-sm"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="month"
                value={filters.dateRange[1]}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateRange: [filters.dateRange[0], e.target.value]
                })}
                className="px-3 py-1 border rounded text-sm"
              />
            </div>
          </div>

          {/* Quick Range Buttons */}
          {showQuickRanges && (
            <div className="flex gap-1">
              {quickRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange(range.months)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          )}

          {/* Business Units */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.businessUnits[0] || 'all'}
              onValueChange={(value) => onFiltersChange({
                ...filters,
                businessUnits: value === 'all' ? [] : [value]
              })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Business Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Units</SelectItem>
                {dimensions.businessUnits.map((bu: any) => (
                  <SelectItem key={bu.id} value={bu.id}>
                    {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Markets */}
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.markets[0] || 'all'}
              onValueChange={(value) => onFiltersChange({
                ...filters,
                markets: value === 'all' ? [] : [value]
              })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Markets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                {dimensions.markets.map((market: any) => (
                  <SelectItem key={market.id} value={market.id}>
                    {market.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products */}
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.products[0] || 'all'}
              onValueChange={(value) => onFiltersChange({
                ...filters,
                products: value === 'all' ? [] : [value]
              })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {dimensions.products.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channels */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.channels[0] || 'all'}
              onValueChange={(value) => onFiltersChange({
                ...filters,
                channels: value === 'all' ? [] : [value]
              })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {dimensions.channels.map((channel: any) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.businessUnits.length > 0 && filters.businessUnits[0] !== 'all' && (
            <Badge variant="secondary">
              BU: {filters.businessUnits.length} selected
            </Badge>
          )}
          {filters.markets.length > 0 && filters.markets[0] !== 'all' && (
            <Badge variant="secondary">
              Markets: {filters.markets.length} selected
            </Badge>
          )}
          {filters.products.length > 0 && filters.products[0] !== 'all' && (
            <Badge variant="secondary">
              Products: {filters.products.length} selected
            </Badge>
          )}
          {filters.channels.length > 0 && filters.channels[0] !== 'all' && (
            <Badge variant="secondary">
              Channels: {filters.channels.length} selected
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}