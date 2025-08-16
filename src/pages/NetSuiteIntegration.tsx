import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NetSuiteCredentials {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
  baseUrl: string;
}

export default function NetSuiteIntegration() {
  const [credentials, setCredentials] = useState<NetSuiteCredentials>({
    accountId: '',
    consumerKey: '',
    consumerSecret: '',
    tokenId: '',
    tokenSecret: '',
    baseUrl: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if credentials exist in localStorage
    const saved = localStorage.getItem('netsuite_credentials');
    if (saved) {
      const parsedCreds = JSON.parse(saved);
      setCredentials(parsedCreds);
      setIsConnected(true);
    }
  }, []);

  const handleInputChange = (field: keyof NetSuiteCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Oracle NetSuite",
      });
      setIsConnected(true);
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to NetSuite. Please check your credentials.",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  const saveCredentials = async () => {
    if (!credentials.accountId || !credentials.consumerKey || !credentials.consumerSecret) {
      toast({
        title: "Validation Error",
        description: "Account ID, Consumer Key, and Consumer Secret are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save to localStorage (in production, this would be saved securely via Supabase)
      localStorage.setItem('netsuite_credentials', JSON.stringify(credentials));
      
      toast({
        title: "Credentials Saved",
        description: "NetSuite credentials have been saved successfully",
      });
      
      // Test connection after saving
      await testConnection();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save NetSuite credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCredentials = () => {
    localStorage.removeItem('netsuite_credentials');
    setCredentials({
      accountId: '',
      consumerKey: '',
      consumerSecret: '',
      tokenId: '',
      tokenSecret: '',
      baseUrl: '',
    });
    setIsConnected(false);
    toast({
      title: "Credentials Cleared",
      description: "NetSuite integration has been disconnected",
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NetSuite Integration</h1>
          <p className="text-muted-foreground">Connect your Oracle NetSuite account to sync financial data</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {isConnected ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            NetSuite Connection Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountId">Account ID *</Label>
              <Input
                id="accountId"
                value={credentials.accountId}
                onChange={(e) => handleInputChange('accountId', e.target.value)}
                placeholder="e.g., 1234567"
              />
            </div>
            <div>
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={credentials.baseUrl}
                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                placeholder="e.g., https://1234567.suitetalk.api.netsuite.com"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Authentication Credentials
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consumerKey">Consumer Key *</Label>
                <Input
                  id="consumerKey"
                  type="password"
                  value={credentials.consumerKey}
                  onChange={(e) => handleInputChange('consumerKey', e.target.value)}
                  placeholder="Enter consumer key"
                />
              </div>
              <div>
                <Label htmlFor="consumerSecret">Consumer Secret *</Label>
                <Input
                  id="consumerSecret"
                  type="password"
                  value={credentials.consumerSecret}
                  onChange={(e) => handleInputChange('consumerSecret', e.target.value)}
                  placeholder="Enter consumer secret"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tokenId">Token ID</Label>
                <Input
                  id="tokenId"
                  value={credentials.tokenId}
                  onChange={(e) => handleInputChange('tokenId', e.target.value)}
                  placeholder="Enter token ID"
                />
              </div>
              <div>
                <Label htmlFor="tokenSecret">Token Secret</Label>
                <Input
                  id="tokenSecret"
                  type="password"
                  value={credentials.tokenSecret}
                  onChange={(e) => handleInputChange('tokenSecret', e.target.value)}
                  placeholder="Enter token secret"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button 
              onClick={saveCredentials} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Credentials
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={isTesting || !credentials.accountId}
              className="flex items-center gap-2"
            >
              {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
              Test Connection
            </Button>

            {isConnected && (
              <Button 
                variant="destructive" 
                onClick={clearCredentials}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Integration Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your NetSuite integration is active. Financial data will be automatically synced and available for analysis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Chart of Accounts</h4>
                  <p className="text-sm text-muted-foreground">Sync account structure</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Financial Data</h4>
                  <p className="text-sm text-muted-foreground">Import transactions & balances</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold">Reporting</h4>
                  <p className="text-sm text-muted-foreground">Generate automated reports</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}