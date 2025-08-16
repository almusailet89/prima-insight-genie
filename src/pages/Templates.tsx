import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Palette, Type, Download, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDropzone } from 'react-dropzone';

interface Template {
  id: string;
  name: string;
  storage_path: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  layouts_json: any;
  created_at: string;
}

interface AppSettings {
  active_template_id: string | null;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    primary_color: '#003366',
    secondary_color: '#FF6B35',
    accent_color: '#E8F4FD',
    heading_font: 'Segoe UI',
    body_font: 'Segoe UI'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
    fetchAppSettings();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
    }
  };

  const fetchAppSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('app_settings')
        .select('active_template_id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveTemplateId(data?.active_template_id || '');
    } catch (error) {
      console.error('Error fetching app settings:', error);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast({
        title: "Invalid File",
        description: "Please upload a PowerPoint (.pptx) file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: newTemplate.name || file.name.replace('.pptx', ''),
          storage_path: filePath,
          primary_color: newTemplate.primary_color,
          secondary_color: newTemplate.secondary_color,
          accent_color: newTemplate.accent_color,
          heading_font: newTemplate.heading_font,
          body_font: newTemplate.body_font,
          branding_config: {
            primaryColor: newTemplate.primary_color,
            secondaryColor: newTemplate.secondary_color,
            accentColor: newTemplate.accent_color,
            fontFamily: newTemplate.heading_font
          }
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      setNewTemplate({
        name: '',
        primary_color: '#003366',
        secondary_color: '#FF6B35',
        accent_color: '#E8F4FD',
        heading_font: 'Segoe UI',
        body_font: 'Segoe UI'
      });

      toast({
        title: "Template Uploaded",
        description: "Your PowerPoint template has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload template',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: false
  });

  const setActiveTemplate = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          active_template_id: templateId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setActiveTemplateId(templateId);
      toast({
        title: "Active Template Set",
        description: "Template is now active for report generation",
      });
    } catch (error) {
      console.error('Error setting active template:', error);
      toast({
        title: "Error",
        description: "Failed to set active template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('templates')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await fetchTemplates();
      
      if (activeTemplateId === templateId) {
        setActiveTemplateId('');
      }

      toast({
        title: "Template Deleted",
        description: "Template has been removed successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Template Manager</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage PowerPoint templates with Prima branding tokens
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Prima Corporate Template"
              />
            </div>
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Input
                value={newTemplate.heading_font}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, heading_font: e.target.value }))}
                placeholder="Segoe UI"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Primary Color
              </Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newTemplate.primary_color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={newTemplate.primary_color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, primary_color: e.target.value }))}
                  placeholder="#003366"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newTemplate.secondary_color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={newTemplate.secondary_color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, secondary_color: e.target.value }))}
                  placeholder="#FF6B35"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newTemplate.accent_color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, accent_color: e.target.value }))}
                  className="w-12 h-8 rounded border"
                />
                <Input
                  value={newTemplate.accent_color}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, accent_color: e.target.value }))}
                  placeholder="#E8F4FD"
                />
              </div>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the PowerPoint file here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">Upload PowerPoint Template</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag & drop a .pptx file or click to browse
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Available Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No templates uploaded</p>
              <p className="text-sm text-muted-foreground">Upload a PowerPoint template to get started</p>
            </div>
          ) : (
            <RadioGroup value={activeTemplateId} onValueChange={setActiveTemplate} className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <RadioGroupItem value={template.id} id={template.id} />
                  <div className="flex-1">
                    <Label htmlFor={template.id} className="text-base font-medium cursor-pointer">
                      {template.name}
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: template.primary_color }}
                        />
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: template.secondary_color }}
                        />
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: template.accent_color }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Type className="h-3 w-3 mr-1" />
                        {template.heading_font}
                      </Badge>
                      {activeTemplateId === template.id && (
                        <Badge className="text-xs">Active</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id, template.storage_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {!activeTemplateId && templates.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700">
              <Settings className="h-5 w-5" />
              <p className="font-medium">Select an active template to enable report building</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}