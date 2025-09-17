import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storeUploadedData } from '@/lib/storage';
import { apiClient } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import * as Papa from 'papaparse';

interface ParsedRow {
  period: string;
  entity: string;
  department: string;
  metric: string;
  actual: number;
  budget: number;
  currency: string;
}

interface ColumnMapping {
  [key: string]: string;
}

const EXPECTED_COLUMNS = [
  'period',
  'entity', 
  'department',
  'metric',
  'actual',
  'budget',
  'currency'
];

export default function UploadPage() {
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV or Excel file.',
        variant: 'destructive',
      });
      return;
    }

    setFile(uploadedFile);
    parseFile(uploadedFile);
  }, []);

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(25);

    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            handleParsedData(results.data, results.meta.fields || []);
          },
          error: (error) => {
            throw new Error(`CSV parsing error: ${error.message}`);
          }
        });
      } else {
        // For Excel files, we'd use a library like xlsx
        throw new Error('Excel file parsing not implemented yet. Please use CSV files.');
      }
    } catch (error: any) {
      console.error('File parsing error:', error);
      toast({
        title: 'Parsing Error',
        description: error.message || 'Failed to parse file',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleParsedData = (data: any[], columns: string[]) => {
    setProgress(50);
    setParsedData(data);
    setFileColumns(columns);

    // Auto-detect column mappings
    const autoMapping: ColumnMapping = {};
    EXPECTED_COLUMNS.forEach(expectedCol => {
      const matchedCol = columns.find(col => 
        col.toLowerCase().includes(expectedCol.toLowerCase()) ||
        expectedCol.toLowerCase().includes(col.toLowerCase())
      );
      if (matchedCol) {
        autoMapping[expectedCol] = matchedCol;
      }
    });

    setColumnMapping(autoMapping);
    setProgress(75);
    setUploadStep('mapping');
    setIsProcessing(false);
  };

  const handleColumnMapping = (expectedColumn: string, fileColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [expectedColumn]: fileColumn
    }));
  };

  const previewMappedData = () => {
    setUploadStep('preview');
  };

  const processMappedData = (): ParsedRow[] => {
    return parsedData.slice(0, 10).map(row => {
      const mapped: any = {};
      Object.entries(columnMapping).forEach(([expectedCol, fileCol]) => {
        mapped[expectedCol] = row[fileCol];
      });

      // Convert numeric fields
      return {
        ...mapped,
        actual: parseFloat(mapped.actual) || 0,
        budget: parseFloat(mapped.budget) || 0,
      };
    });
  };

  const completeImport = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Process all data
      const processedData: ParsedRow[] = parsedData.map(row => {
        const mapped: any = {};
        Object.entries(columnMapping).forEach(([expectedCol, fileCol]) => {
          mapped[expectedCol] = row[fileCol];
        });

        return {
          ...mapped,
          actual: parseFloat(mapped.actual) || 0,
          budget: parseFloat(mapped.budget) || 0,
        };
      });

      setProgress(50);

      // Store in browser storage
      await storeUploadedData(processedData);
      setProgress(75);

      // Try to push to backend if available
      try {
        const response = await apiClient.seedReset(processedData);
        if (response.error) {
          console.warn('Backend seed failed:', response.error);
        }
      } catch (error) {
        console.warn('Backend not available, data stored locally only');
      }

      setProgress(100);
      setUploadStep('complete');
      
      toast({
        title: 'Import Successful',
        description: `Imported ${processedData.length} records successfully.`,
      });

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadStep('upload');
    setFile(null);
    setParsedData([]);
    setFileColumns([]);
    setColumnMapping({});
    setProgress(0);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Data</h1>
        <p className="text-muted-foreground">Import your financial data from CSV or Excel files</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className={cn(
          'flex items-center gap-2',
          uploadStep === 'upload' && 'text-primary font-medium'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            uploadStep === 'upload' ? 'bg-primary' : 'bg-muted-foreground'
          )} />
          Upload
        </div>
        <div className={cn(
          'flex items-center gap-2',
          uploadStep === 'mapping' && 'text-primary font-medium'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            ['mapping', 'preview', 'complete'].includes(uploadStep) ? 'bg-primary' : 'bg-muted-foreground'
          )} />
          Mapping
        </div>
        <div className={cn(
          'flex items-center gap-2',
          uploadStep === 'preview' && 'text-primary font-medium'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            ['preview', 'complete'].includes(uploadStep) ? 'bg-primary' : 'bg-muted-foreground'
          )} />
          Preview
        </div>
        <div className={cn(
          'flex items-center gap-2',
          uploadStep === 'complete' && 'text-primary font-medium'
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            uploadStep === 'complete' ? 'bg-success' : 'bg-muted-foreground'
          )} />
          Complete
        </div>
      </div>

      {/* Step Content */}
      {uploadStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg text-primary">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">Drag & drop your file here, or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV, XLS, XLSX files. Expected columns: period, entity, department, metric, actual, budget, currency
                  </p>
                </>
              )}
            </div>

            {isProcessing && (
              <div className="mt-6">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-center text-muted-foreground">Processing file...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {uploadStep === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Map your file columns to the expected data fields:
            </p>

            <div className="grid grid-cols-2 gap-4">
              {EXPECTED_COLUMNS.map(expectedCol => (
                <div key={expectedCol} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {expectedCol.replace('_', ' ')}
                  </label>
                  <Select
                    value={columnMapping[expectedCol] || ''}
                    onValueChange={(value) => handleColumnMapping(expectedCol, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fileColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={previewMappedData} disabled={Object.keys(columnMapping).length < EXPECTED_COLUMNS.length}>
                Preview Data
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadStep === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Preview of first 10 rows with your column mapping:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {EXPECTED_COLUMNS.map(col => (
                      <th key={col} className="text-left p-2 font-medium capitalize">
                        {col.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processMappedData().map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row.period}</td>
                      <td className="p-2">{row.entity}</td>
                      <td className="p-2">{row.department}</td>
                      <td className="p-2">{row.metric}</td>
                      <td className="p-2">{row.actual}</td>
                      <td className="p-2">{row.budget}</td>
                      <td className="p-2">{row.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={completeImport} disabled={isProcessing}>
                Import {parsedData.length} Records
              </Button>
              <Button variant="outline" onClick={() => setUploadStep('mapping')}>
                Back to Mapping
              </Button>
            </div>

            {isProcessing && (
              <div className="mt-4">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-center text-muted-foreground">Importing data...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {uploadStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg">
              <Database className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium text-success">Successfully imported {parsedData.length} records</p>
                <p className="text-sm text-muted-foreground">Data is now available in your dashboard</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => window.location.href = '/'}>
                View Dashboard
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Upload Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}