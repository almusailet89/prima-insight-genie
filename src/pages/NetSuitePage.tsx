import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, CheckCircle } from 'lucide-react';

export default function NetSuitePage() {
  const [config, setConfig] = useState({
    accountId: '',
    consumerKey: '',
    consumerSecret: '',
    tokenId: '',
    tokenSecret: '',
    scriptId: '',
    deploymentId: ''
  });
  const [isConnected, setIsConnected] = useState(false);

  const handleSave = async () => {
    // Mock save - in real app would call API
    console.log('Saving NetSuite config:', config);
    setIsConnected(true);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">NetSuite Integration</h1>
        <p className="text-muted-foreground">Configure your NetSuite connection for automated data sync</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connection Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && (
            <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg mb-4">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-success font-medium">Connected to NetSuite</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value={config.accountId}
                onChange={(e) => setConfig(prev => ({ ...prev, accountId: e.target.value }))}
                placeholder="Enter Account ID"
              />
            </div>
            
            <div>
              <Label htmlFor="consumerKey">Consumer Key</Label>
              <Input
                id="consumerKey"
                value={config.consumerKey}
                onChange={(e) => setConfig(prev => ({ ...prev, consumerKey: e.target.value }))}
                placeholder="Enter Consumer Key"
              />
            </div>
            
            <div>
              <Label htmlFor="consumerSecret">Consumer Secret</Label>
              <Input
                id="consumerSecret"
                type="password"
                value={config.consumerSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, consumerSecret: e.target.value }))}
                placeholder="Enter Consumer Secret"
              />
            </div>
            
            <div>
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                value={config.tokenId}
                onChange={(e) => setConfig(prev => ({ ...prev, tokenId: e.target.value }))}
                placeholder="Enter Token ID"
              />
            </div>
            
            <div>
              <Label htmlFor="tokenSecret">Token Secret</Label>
              <Input
                id="tokenSecret"
                type="password"
                value={config.tokenSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, tokenSecret: e.target.value }))}
                placeholder="Enter Token Secret"
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}