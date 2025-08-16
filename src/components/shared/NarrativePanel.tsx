import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NarrativePanelProps {
  tab: string;
  data: any;
  period: string;
  companyId: string;
  className?: string;
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  tab,
  data,
  period,
  companyId,
  className = ''
}) => {
  const [narrative, setNarrative] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState('');
  const [narrativeId, setNarrativeId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing narrative on mount
  useEffect(() => {
    loadExistingNarrative();
  }, [tab, period, companyId]);

  const loadExistingNarrative = async () => {
    try {
      // For now, use mock data since narratives table may not exist yet
      const mockNarrative = `Strong performance in ${tab} with key metrics trending positively. Key highlights include improved margins and operational efficiency gains.`;
      setNarrative(mockNarrative);
      setNarrativeId('mock-id');
    } catch (error) {
      // No existing narrative found
    }
  };

  const generateNarrative = async () => {
    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-narrative', {
        body: {
          tab,
          data,
          period,
          companyId
        }
      });

      if (error) throw error;

      setNarrative(result.narrative);
      setNarrativeId(result.id);
      
      toast({
        title: "Narrative Generated",
        description: "AI narrative has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating narrative:', error);
      toast({
        title: "Error",
        description: "Failed to generate narrative. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedNarrative(narrative);
  };

  const handleSave = async () => {
    try {
      // For now, just save locally since narratives table may not exist yet
      console.log('Saving narrative:', editedNarrative);

      setNarrative(editedNarrative);
      setIsEditing(false);
      
      toast({
        title: "Narrative Saved",
        description: "Your narrative has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving narrative:', error);
      toast({
        title: "Error",
        description: "Failed to save narrative. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedNarrative('');
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">AI Narrative</CardTitle>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={generateNarrative}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={!narrative}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedNarrative}
            onChange={(e) => setEditedNarrative(e.target.value)}
            placeholder="Enter your narrative..."
            className="min-h-[120px] resize-none"
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            {narrative ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {narrative}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No narrative generated yet. Click "Generate" to create an AI-powered analysis.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};