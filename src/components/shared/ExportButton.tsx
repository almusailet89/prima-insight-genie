import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface ExportButtonProps {
  period: string;
  narrative: string;
  kpiData: any[];
  varianceData: any[];
  className?: string;
}

export function ExportButton({ 
  period, 
  narrative, 
  kpiData, 
  varianceData, 
  className 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!narrative.trim()) {
      toast({
        title: 'Export Error',
        description: 'Please generate a narrative first by asking the chat assistant.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const response = await apiClient.exportPPT({
        period,
        narrative,
        kpiData,
        varianceData,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `Prima_FPA_Report_${period}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: 'Export Successful',
          description: 'Your PowerPoint report has been downloaded.',
        });
      } else {
        throw new Error('No download URL provided');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className={className}
      variant="default"
      size="sm"
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export PPT'}
    </Button>
  );
}