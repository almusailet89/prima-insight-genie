import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportWizardProps {
  tableName: string;
  tableDisplayName: string;
  expectedColumns: string[];
  onImportComplete: (data: any[]) => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  tableName,
  tableDisplayName,
  expectedColumns,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>('upload');
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [mappedData, setMappedData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setFileHeaders(results.meta.fields || []);
          setFileData(results.data as any[]);
          setStep('map');
        },
        error: (error) => {
          toast({
            title: "Error",
            description: `Failed to parse CSV: ${error.message}`,
            variant: "destructive",
          });
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = (row as any[])[index] || '';
              });
              return obj;
            });
            
            setFileHeaders(headers);
            setFileData(rows);
            setStep('map');
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to parse Excel file",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Unsupported Format",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handleMapping = (expectedColumn: string, fileColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [expectedColumn]: fileColumn
    }));
  };

  const previewData = () => {
    const mapped = fileData.slice(0, 10).map(row => {
      const mappedRow: any = {};
      expectedColumns.forEach(col => {
        const fileCol = columnMapping[col];
        mappedRow[col] = fileCol ? row[fileCol] : '';
      });
      return mappedRow;
    });
    setMappedData(mapped);
    setStep('preview');
  };

  const completeImport = () => {
    const allMappedData = fileData.map(row => {
      const mappedRow: any = {};
      expectedColumns.forEach(col => {
        const fileCol = columnMapping[col];
        mappedRow[col] = fileCol ? row[fileCol] : '';
      });
      return mappedRow;
    });

    onImportComplete(allMappedData);
    setStep('complete');
    
    toast({
      title: "Import Complete",
      description: `Successfully imported ${allMappedData.length} records`,
    });
  };

  const reset = () => {
    setStep('upload');
    setFileData([]);
    setFileHeaders([]);
    setColumnMapping({});
    setMappedData([]);
    setFileName('');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Import {tableDisplayName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports CSV, Excel (.xlsx, .xls)
              </p>
              <Button variant="outline">Choose File</Button>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Expected columns:</h4>
              <div className="flex flex-wrap gap-2">
                {expectedColumns.map(col => (
                  <Badge key={col} variant="outline">{col}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Map Columns</h3>
              <Badge variant="outline">{fileName}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expectedColumns.map(expectedCol => (
                <div key={expectedCol} className="space-y-2">
                  <label className="text-sm font-medium">{expectedCol}</label>
                  <Select
                    value={columnMapping[expectedCol] || ''}
                    onValueChange={(value) => handleMapping(expectedCol, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Skip Column --</SelectItem>
                      {fileHeaders.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={previewData} disabled={Object.keys(columnMapping).length === 0}>
                Preview Data
              </Button>
              <Button variant="outline" onClick={reset}>
                Start Over
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview Data</h3>
              <Badge variant="outline">First 10 rows</Badge>
            </div>

            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    {expectedColumns.map(col => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedData.map((row, index) => (
                    <TableRow key={index}>
                      {expectedColumns.map(col => (
                        <TableCell key={col} className="max-w-32 truncate">
                          {row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button onClick={completeImport}>
                Import {fileData.length} Records
              </Button>
              <Button variant="outline" onClick={() => setStep('map')}>
                Back to Mapping
              </Button>
              <Button variant="outline" onClick={reset}>
                Start Over
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h3 className="text-lg font-medium">Import Complete!</h3>
            <p className="text-muted-foreground">
              Successfully imported {fileData.length} records into {tableDisplayName}
            </p>
            <Button onClick={reset}>
              Import Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};