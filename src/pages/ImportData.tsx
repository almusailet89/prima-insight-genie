import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ImportData() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress(30);

      const response = await fetch('https://cgvdtcmchxkbnsdgbcvz.functions.supabase.co/process-file-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64Content,
          fileType: file.type,
        }),
      });

      setUploadProgress(80);

      const result = await response.json();
      
      if (result.success) {
        setUploadProgress(100);
        toast({
          title: "Upload Complete",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">
          Upload and import financial data from Excel, CSV, or other formats
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Supports Excel (.xlsx, .xls), CSV, and JSON formats
              </p>
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Mapping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Configure how your data maps to Prima Finance structure
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">GWP/Revenue</span>
                <span className="text-sm text-muted-foreground">gwp, premium, revenue</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Country/Region</span>
                <span className="text-sm text-muted-foreground">country, nation, region</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Department</span>
                <span className="text-sm text-muted-foreground">department, dept, division</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Budget/Actuals</span>
                <span className="text-sm text-muted-foreground">budget, actual, spent</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Supported formats:</strong> CSV files with headers for GWP forecasts or cost monitoring data.
                The system auto-detects table type based on column headers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Imports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Q1_2024_Actuals.xlsx</p>
                  <p className="text-sm text-muted-foreground">Imported May 15, 2024</p>
                </div>
              </div>
              <span className="text-sm text-green-600">Success</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Budget_2024.csv</p>
                  <p className="text-sm text-muted-foreground">Imported May 10, 2024</p>
                </div>
              </div>
              <span className="text-sm text-green-600">Success</span>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Forecast_Data.xlsx</p>
                  <p className="text-sm text-muted-foreground">Imported May 8, 2024</p>
                </div>
              </div>
              <span className="text-sm text-yellow-600">Partial</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}