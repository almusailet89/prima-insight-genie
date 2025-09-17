import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage, getFavorabilityColor, getDepartmentDisplayName } from '@/lib/fmt';
import { cn } from '@/lib/utils';

interface VarianceRow {
  department: string;
  actual: number;
  budget: number;
  variance: number;
  percentVariance: number;
}

interface VarianceTableProps {
  data: VarianceRow[];
  title?: string;
  isLoading?: boolean;
}

export function VarianceTable({ 
  data, 
  title = 'Department Performance', 
  isLoading = false 
}: VarianceTableProps) {
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-24" />
                <div className="flex gap-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-20" />
                  <div className="h-4 bg-muted animate-pulse rounded w-20" />
                  <div className="h-4 bg-muted animate-pulse rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50">
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="text-right font-semibold">Actual</TableHead>
              <TableHead className="text-right font-semibold">Budget</TableHead>
              <TableHead className="text-right font-semibold">Variance</TableHead>
              <TableHead className="text-right font-semibold">Variance %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const favorability = getFavorabilityColor(row.percentVariance);
              
              return (
                <TableRow 
                  key={index}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    {getDepartmentDisplayName(row.department)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.actual)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.budget)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono font-medium',
                    favorability === 'success' && 'text-success',
                    favorability === 'danger' && 'text-danger',
                    favorability === 'neutral' && 'text-muted-foreground'
                  )}>
                    {formatCurrency(row.variance, 'EUR', true)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono font-medium',
                    favorability === 'success' && 'text-success',
                    favorability === 'danger' && 'text-danger',
                    favorability === 'neutral' && 'text-muted-foreground'
                  )}>
                    {formatPercentage(row.percentVariance, true)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}