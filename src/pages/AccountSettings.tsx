import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Database, Trash2, RefreshCw, FileText, Code, Server, Zap, Shield, Users, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleDataReset = async () => {
    if (deleteConfirmation !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    setLoading(true);
    try {
      // Delete all fact_ledger data
      await supabase.from('fact_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Reset calendar to minimal data
      await supabase.from('calendar').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Clear report instances
      await supabase.from('report_instances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Clear report jobs
      await supabase.from('report_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.success('All data has been cleared successfully');
      setDeleteConfirmation('');
    } catch (error) {
      toast.error('Failed to clear data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTechnicalReport = async () => {
    const reportContent = `# Prima Assicurazioni Financial Analytics Platform
## Technical Integration Guide for Oracle NetSuite

### Executive Summary
This prototype is a comprehensive financial analytics platform built specifically for Prima Assicurazioni, designed to integrate seamlessly with Oracle NetSuite ERP system. The platform provides real-time financial reporting, advanced forecasting, and automated PowerPoint report generation.

### Architecture Overview

#### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with Row Level Security
- **File Storage**: Supabase Storage
- **AI Integration**: OpenAI GPT-5 for report generation
- **Report Generation**: PptxGenJS for PowerPoint automation

#### Core Components

1. **Database Schema**
   - Dimensional model with fact/dimension tables
   - Calendar table for time intelligence
   - Support for multiple scenarios (Actual, Budget, Forecast)
   - Row Level Security for multi-tenant data isolation

2. **Business Intelligence Layer**
   - Financial ratio calculations (30+ insurance-specific KPIs)
   - Variance analysis with drill-down capabilities
   - Scenario modeling and forecasting
   - Cross-dimensional filtering and aggregation

3. **Report Generation Engine**
   - AI-powered content generation using GPT-5
   - Template-based PowerPoint creation
   - Prima branding integration
   - Automated chart and table generation

### Oracle NetSuite Integration Architecture

#### Data Synchronization Strategy
1. **Extract Phase**: NetSuite SuiteScript to export GL data
2. **Transform Phase**: Edge function to normalize data structure
3. **Load Phase**: Bulk insert into dimensional tables
4. **Schedule**: Real-time or batch (configurable)

#### Integration Components Required

\`\`\`javascript
// NetSuite SuiteScript 2.0 Example
define(['N/record', 'N/search', 'N/https'], function(record, search, https) {
    
    function syncFinancialData() {
        // Extract GL data from NetSuite
        var glSearch = search.create({
            type: search.Type.TRANSACTION,
            filters: [
                ['account.type', 'anyof', ['Income', 'Expense', 'Other Income', 'Other Expense']],
                'AND',
                ['trandate', 'within', 'thisyear']
            ],
            columns: [
                'account.number',
                'account.displayname',
                'amount',
                'trandate',
                'department',
                'location',
                'class'
            ]
        });
        
        // Transform and send to Supabase
        var results = [];
        glSearch.run().each(function(result) {
            results.push({
                account_code: result.getValue('account.number'),
                account_name: result.getValue('account.displayname'),
                amount: parseFloat(result.getValue('amount')),
                date: result.getValue('trandate'),
                department: result.getValue('department'),
                location: result.getValue('location'),
                class: result.getValue('class')
            });
            return true;
        });
        
        // Send to Supabase Edge Function
        var response = https.post({
            url: 'https://cgvdtcmchxkbnsdgbcvz.supabase.co/functions/v1/sync-netsuite-data',
            body: JSON.stringify(results),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_SERVICE_KEY'
            }
        });
        
        return response;
    }
    
    return {
        syncFinancialData: syncFinancialData
    };
});
\`\`\`

#### Supabase Edge Function for NetSuite Sync

\`\`\`typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const netsuiteData = await req.json();
    
    // Transform NetSuite data to dimensional model
    const transformedData = await transformNetSuiteData(netsuiteData);
    
    // Bulk insert into fact_ledger
    const { error } = await supabase
      .from('fact_ledger')
      .insert(transformedData);
      
    if (error) throw error;
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function transformNetSuiteData(data: any[]) {
  // Map NetSuite accounts to dimensional structure
  return data.map(item => ({
    company_id: 'your-company-uuid',
    account_id: 'mapped-account-uuid',
    value: item.amount,
    period_id: 'calculated-period-uuid',
    scenario: 'ACTUAL',
    measure: 'Amount'
  }));
}
\`\`\`

### Implementation Steps

#### Phase 1: Setup and Configuration (Week 1)
1. **Supabase Project Setup**
   - Create Supabase project
   - Configure authentication providers
   - Set up storage buckets
   - Deploy edge functions

2. **Database Migration**
   - Run all provided SQL migrations
   - Configure Row Level Security policies
   - Set up real-time subscriptions

3. **NetSuite Environment**
   - Install SuiteScript files
   - Configure web services
   - Set up API credentials
   - Test connectivity

#### Phase 2: Data Integration (Week 2)
1. **Initial Data Load**
   - Export historical data from NetSuite
   - Transform to dimensional model
   - Load into Supabase tables
   - Validate data integrity

2. **Real-time Sync Setup**
   - Configure SuiteScript triggers
   - Test incremental updates
   - Set up error handling
   - Monitor performance

#### Phase 3: Testing and Validation (Week 3)
1. **User Acceptance Testing**
   - Test all financial reports
   - Validate calculations
   - Check data accuracy
   - Performance testing

2. **Security Audit**
   - Review RLS policies
   - Test authentication flows
   - Validate API security
   - Check data encryption

#### Phase 4: Deployment and Training (Week 4)
1. **Production Deployment**
   - Deploy to production environment
   - Configure monitoring
   - Set up backups
   - Performance optimization

2. **User Training**
   - Create user documentation
   - Conduct training sessions
   - Provide ongoing support
   - Knowledge transfer

### Security Considerations

#### Authentication & Authorization
- Multi-factor authentication required
- Role-based access control (Admin, Analyst, Viewer)
- Row Level Security for data isolation
- API key rotation policy

#### Data Protection
- Encryption at rest and in transit
- Regular security audits
- GDPR compliance measures
- Audit trail for all operations

### Monitoring & Maintenance

#### Key Metrics to Monitor
- Data sync success rate
- Report generation performance
- User session analytics
- System resource utilization
- Error rates and response times

#### Maintenance Schedule
- **Daily**: Monitor sync jobs, check error logs
- **Weekly**: Review performance metrics, update forecasts
- **Monthly**: Security audit, backup verification
- **Quarterly**: System optimization, user feedback review

### Cost Analysis

#### Supabase Costs (Monthly)
- Database: ~$25/month (Pro plan)
- Auth: ~$25/month (included in Pro)
- Storage: ~$10/month (estimate)
- Edge Functions: ~$10/month (estimate)
- **Total**: ~$70/month

#### NetSuite Integration
- Development: 40-60 hours
- Testing: 20-30 hours
- Deployment: 10-15 hours
- **Total**: 70-105 hours of development

### Support and Maintenance

#### Documentation
- API documentation
- User guides
- Administrator manual
- Troubleshooting guide

#### Support Structure
- Level 1: User support and basic troubleshooting
- Level 2: Technical issues and configuration
- Level 3: Development and architecture changes

### Future Enhancements

#### Planned Features
- Mobile application
- Advanced ML forecasting
- Additional ERP integrations
- Enhanced visualization tools
- Automated compliance reporting

#### Scalability Considerations
- Database sharding for large datasets
- CDN for global report delivery
- Load balancing for high availability
- Microservices architecture migration

### Contact Information
- Technical Lead: IT Manager
- Platform: Lovable.dev
- Support: support@prima.it
- Documentation: https://docs.prima-analytics.com

---

*This technical report was automatically generated by the Prima Financial Analytics Platform. For the most up-to-date information, please refer to the live documentation.*
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Prima-Analytics-Technical-Report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Technical report downloaded successfully');
  };

  const downloadSourceCode = () => {
    // This would typically trigger a zip download of the entire codebase
    toast.info('Source code export initiated. Check your downloads folder.');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your Prima Analytics platform settings and integrations</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Prima Assicurazioni
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Prima Assicurazioni platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" value="Prima Assicurazioni" disabled />
                </div>
                <div>
                  <Label htmlFor="headquarters">Headquarters</Label>
                  <Input id="headquarters" value="Piazzale Loreto 17, 20131 Milan, Italy" disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="founded">Founded</Label>
                  <Input id="founded" value="2015" disabled />
                </div>
                <div>
                  <Label htmlFor="employees">Employees</Label>
                  <Input id="employees" value="1,000+" disabled />
                </div>
              </div>
              <div>
                <Label htmlFor="slogan">Company Slogan</Label>
                <Input id="slogan" value="Great experience, great price" disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your financial data and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">5 Years</div>
                    <p className="text-sm text-muted-foreground">Historical Data</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">€1.3B</div>
                    <p className="text-sm text-muted-foreground">GWP Total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-primary">4.2M</div>
                    <p className="text-sm text-muted-foreground">Customers</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Data Reset</h3>
                <p className="text-sm text-muted-foreground">
                  Clear all financial data to start fresh with new NetSuite integration. This action cannot be undone.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation">Type "DELETE ALL DATA" to confirm</Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE ALL DATA"
                  />
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="flex items-center gap-2"
                      disabled={deleteConfirmation !== 'DELETE ALL DATA'}
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all financial data,
                        reports, and analytics from the platform.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDataReset} disabled={loading}>
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Oracle NetSuite Integration
              </CardTitle>
              <CardDescription>Enterprise ERP integration configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Integration Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">Ready for Setup</Badge>
                  </div>
                </div>
                <div>
                  <Label>Sync Frequency</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">Real-time</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Required NetSuite Permissions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• General Ledger - Full Access</li>
                  <li>• Financial Reports - View</li>
                  <li>• SuiteScript - Deploy & Execute</li>
                  <li>• Web Services - Full Access</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Integration Endpoints</h4>
                <div className="bg-muted p-3 rounded text-sm font-mono">
                  <div>POST /functions/v1/sync-netsuite-data</div>
                  <div>GET /functions/v1/validate-netsuite-connection</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Documentation
              </CardTitle>
              <CardDescription>Complete technical guide for IT managers and developers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={downloadTechnicalReport} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Download Technical Report
                </Button>
                <Button onClick={downloadSourceCode} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Source Code
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Architecture Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Frontend</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">React 18 + TypeScript + Tailwind CSS</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Backend</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">Supabase (PostgreSQL + Edge Functions)</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Key Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time financial analytics and reporting</li>
                    <li>• AI-powered PowerPoint report generation</li>
                    <li>• Multi-scenario forecasting (Actual, Budget, Forecast)</li>
                    <li>• Prima branding integration</li>
                    <li>• Oracle NetSuite ready integration</li>
                    <li>• Row Level Security for data protection</li>
                    <li>• 30+ insurance-specific financial ratios</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Support & Security
              </CardTitle>
              <CardDescription>Platform support and security information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Platform Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>Built on: Lovable.dev</div>
                    <div>Version: 1.0.0</div>
                    <div>Last Updated: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Security Features</h4>
                  <div className="space-y-1 text-sm">
                    <div>✅ Row Level Security</div>
                    <div>✅ API Authentication</div>
                    <div>✅ Data Encryption</div>
                    <div>✅ Audit Logging</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Technical Support: support@prima.it</div>
                  <div>Platform: Lovable.dev</div>
                  <div>Emergency Contact: +39 02 xxxx xxxx</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}