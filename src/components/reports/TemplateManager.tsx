import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, Eye, Edit, Trash2, Palette, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';
import { TemplatePreview } from './TemplatePreview';

interface Template {
  id: string;
  name: string;
  description: string;
  company_name: string;
  template_type: string;
  is_default: boolean;
  branding_config: any;
  slide_layouts: any;
  chart_styles: any;
  table_styles: any;
  created_at: string;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Form state for new template
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    company_name: 'Prima',
    template_type: 'corporate',
    branding_config: {
      primaryColor: '#003366',
      secondaryColor: '#FF6B35',
      accentColor: '#E8F4FD',
      textColor: '#333333',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Segoe UI',
      logoPosition: 'top-left',
      footerText: 'Prima Finance - Confidential'
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    onDrop: handleFileDrop
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        slide_layouts: Array.isArray(template.slide_layouts) ? template.slide_layouts : []
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
    }
  };

  async function handleFileDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of acceptedFiles) {
        if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
          // Handle PowerPoint template upload
          await processPowerPointTemplate(file);
        } else {
          // Handle asset upload (logos, images)
          await processAssetUpload(file);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const processPowerPointTemplate = async (file: File) => {
    // In a real implementation, you'd parse the PPTX file to extract layouts, styles, etc.
    // For now, we'll create a template based on the filename and basic structure
    
    const templateName = file.name.replace(/\.(pptx|ppt)$/, '');
    
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: templateName,
          description: `Imported from ${file.name}`,
          company_name: 'Prima',
          template_type: 'corporate',
          branding_config: newTemplate.branding_config,
          slide_layouts: [
            { type: 'title', name: 'Title Slide', elements: ['title', 'subtitle', 'logo', 'date'] },
            { type: 'overview', name: 'KPI Overview', elements: ['title', 'kpi-grid', 'commentary', 'chart'] },
            { type: 'analysis', name: 'Analysis Slide', elements: ['title', 'chart', 'table', 'insights'] }
          ],
          chart_styles: {
            chartStyle: 'modern',
            colorPalette: ['#003366', '#FF6B35', '#E8F4FD', '#7BA7BC', '#FFA366'],
            gridLines: true,
            dataLabels: true,
            fontSize: 12
          },
          table_styles: {
            headerStyle: 'prima-blue',
            alternateRowColor: '#F8F9FA',
            borderStyle: 'minimal',
            fontSize: 11
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'Database error occurred');
      }

      toast({
        title: "Template Uploaded",
        description: `Successfully imported ${templateName}`,
      });

      await fetchTemplates();
    } catch (error) {
      console.error('Template import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to import PowerPoint template: ${errorMessage}`);
    }
  };

  const processAssetUpload = async (file: File) => {
    // Handle logo/image uploads for templates
    toast({
      title: "Asset Upload",
      description: `${file.name} ready for template association`,
    });
  };

  const createNewTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: newTemplate.name,
          description: newTemplate.description,
          company_name: newTemplate.company_name,
          template_type: newTemplate.template_type,
          branding_config: newTemplate.branding_config,
          slide_layouts: [
            { type: 'title', name: 'Title Slide', elements: ['title', 'subtitle', 'logo', 'date'] },
            { type: 'overview', name: 'KPI Overview', elements: ['title', 'kpi-grid', 'commentary', 'chart'] },
            { type: 'analysis', name: 'Analysis Slide', elements: ['title', 'chart', 'table', 'insights'] }
          ],
          chart_styles: {
            chartStyle: 'modern',
            colorPalette: [newTemplate.branding_config.primaryColor, newTemplate.branding_config.secondaryColor],
            gridLines: true,
            dataLabels: true,
            fontSize: 12
          },
          table_styles: {
            headerStyle: 'prima-blue',
            alternateRowColor: '#F8F9FA',
            borderStyle: 'minimal',
            fontSize: 11
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create template",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Template Created",
        description: `Successfully created ${newTemplate.name}`,
      });

      setShowUploadForm(false);
      setNewTemplate({
        name: '',
        description: '',
        company_name: 'Prima',
        template_type: 'corporate',
        branding_config: {
          primaryColor: '#003366',
          secondaryColor: '#FF6B35',
          accentColor: '#E8F4FD',
          textColor: '#333333',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Segoe UI',
          logoPosition: 'top-left',
          footerText: 'Prima Finance - Confidential'
        }
      });

      await fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (templateId: string) => {
    try {
      // First, remove default from all templates
      await supabase
        .from('report_templates')
        .update({ is_default: false })
        .neq('id', '');

      // Then set the selected template as default
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Default Template Set",
        description: "Template updated successfully",
      });

      await fetchTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      toast({
        title: "Error",
        description: "Failed to set default template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Management</h2>
          <p className="text-muted-foreground">Manage Prima company report templates</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload PowerPoint</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isUploading ? (
                    <p>Uploading template...</p>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">Upload Prima Template</p>
                      <p className="text-muted-foreground">
                        Drag & drop PowerPoint files (.pptx, .ppt) or logos/images here, or click to browse
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="create" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Prima Executive Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-type">Template Type</Label>
                    <Select 
                      value={newTemplate.template_type} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, template_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Template description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={newTemplate.branding_config.primaryColor}
                        onChange={(e) => setNewTemplate(prev => ({
                          ...prev,
                          branding_config: { ...prev.branding_config, primaryColor: e.target.value }
                        }))}
                        className="w-20"
                      />
                      <Input
                        value={newTemplate.branding_config.primaryColor}
                        onChange={(e) => setNewTemplate(prev => ({
                          ...prev,
                          branding_config: { ...prev.branding_config, primaryColor: e.target.value }
                        }))}
                        placeholder="#003366"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={newTemplate.branding_config.secondaryColor}
                        onChange={(e) => setNewTemplate(prev => ({
                          ...prev,
                          branding_config: { ...prev.branding_config, secondaryColor: e.target.value }
                        }))}
                        className="w-20"
                      />
                      <Input
                        value={newTemplate.branding_config.secondaryColor}
                        onChange={(e) => setNewTemplate(prev => ({
                          ...prev,
                          branding_config: { ...prev.branding_config, secondaryColor: e.target.value }
                        }))}
                        placeholder="#FF6B35"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={createNewTemplate} className="w-full">
                  <Palette className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.is_default && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge variant="outline">{template.template_type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Colors:</span>
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: template.branding_config.primaryColor }}
                  />
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: template.branding_config.secondaryColor }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                {!template.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAsDefault(template.id)}
                  >
                    Set Default
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Templates Found</p>
            <p className="text-muted-foreground mb-4">Create your first Prima template to get started</p>
            <Button onClick={() => setShowUploadForm(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </CardContent>
        </Card>
      )}

      <TemplatePreview
        template={selectedTemplate}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedTemplate(null);
        }}
        onUse={(template) => {
          setShowPreview(false);
          toast({
            title: "Template Selected",
            description: `Using ${template.name} for report generation`,
          });
        }}
      />
    </div>
  );
}