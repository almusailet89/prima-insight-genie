import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { TemplateManager } from '@/components/reports/TemplateManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Calendar, TrendingUp, Settings, Upload } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Narratives</h1>
        <p className="text-muted-foreground">
          Generate PowerPoint reports with AI-powered narratives and Prima branding
        </p>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="quick">Quick Generate</TabsTrigger>
          <TabsTrigger value="templates">Template Manager</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Report Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Build reports slide-by-slide with live preview and Ask Jude integration.
              </p>
              <Button onClick={() => window.location.href = '/report-builder'}>
                Open Report Builder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick">
          <div className="grid gap-6 lg:grid-cols-2">
            <ReportGenerator />

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/reports?template=monthly'}>
                    <FileText className="h-4 w-4 mr-2" />
                    Monthly Corporate Update
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/reports?template=variance'}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Variance Analysis Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/reports?template=executive'}>
                    <Download className="h-4 w-4 mr-2" />
                    Quarterly Executive Summary
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <p>✓ Automated variance explanations</p>
                    <p>✓ Country-specific performance insights</p>
                    <p>✓ Forecast trend analysis</p>
                    <p>✓ Executive summary generation</p>
                    <p>✓ Prima corporate branding</p>
                    <p>✓ Smart chart selection</p>
                    <p>✓ PowerPoint generation</p>
                    <p>✓ Template customization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Q4 2024 Corporate Update</p>
                    <p className="text-sm text-muted-foreground">Generated Dec 15, 2024 • PowerPoint</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Italy Operations Review</p>
                    <p className="text-sm text-muted-foreground">Generated Dec 10, 2024 • PowerPoint</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Variance Analysis Report</p>
                    <p className="text-sm text-muted-foreground">Generated Dec 8, 2024 • PowerPoint</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}