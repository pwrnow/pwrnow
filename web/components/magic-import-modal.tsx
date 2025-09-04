'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, Check, X } from 'lucide-react';
import {
  parseScheduleWithAI,
  MagicImportRequest,
  MagicImportResponse,
} from '@/lib/api';
import { toast } from 'sonner';

interface MagicImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventSlug: string;
  onScheduleParsed: (
    scheduleItems: Array<{
      date: string;
      start_time: string;
      end_time: string;
      title: string;
      description?: string;
    }>
  ) => void;
}

export default function MagicImportModal({
  open,
  onOpenChange,
  eventSlug,
  onScheduleParsed,
}: MagicImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<MagicImportResponse | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error('Please enter some schedule text to parse');
      return;
    }

    setIsLoading(true);
    try {
      const request: MagicImportRequest = {
        raw_text: rawText.trim(),
      };

      const result = await parseScheduleWithAI(request);
      setParsedResult(result);

      if (result && result.items && result.items.length > 0) {
        setShowPreview(true);
        toast.success(
          `Successfully parsed ${result.items.length} schedule items`
        );
      } else {
        toast.error('Failed to parse schedule');
      }
    } catch (error) {
      console.error('Magic import error:', error);
      toast.error('Failed to parse schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (parsedResult?.items && parsedResult.items.length > 0) {
      onScheduleParsed(parsedResult.items);
      handleClose();
      toast.success('Schedule imported successfully!');
    }
  };

  const handleReject = () => {
    setShowPreview(false);
    setParsedResult(null);
  };

  const handleClose = () => {
    setRawText('');
    setParsedResult(null);
    setShowPreview(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Wand2 className='h-5 w-5' />
            Magic Import Schedule
          </DialogTitle>
          <DialogDescription>
            Paste your raw schedule text (from Excel, Word, or any document) and
            let AI parse it into structured schedule items.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {!showPreview ? (
            <>
              <div className='space-y-2'>
                <Label htmlFor='raw-text'>Schedule Text</Label>
                <Textarea
                  id='raw-text'
                  placeholder='Paste your schedule text here... For example:&#10;&#10;Monday, Jan 15&#10;9:00 AM - 10:00 AM: Opening Ceremony&#10;10:30 AM - 12:00 PM: Keynote Presentation&#10;12:00 PM - 1:00 PM: Lunch Break&#10;&#10;Tuesday, Jan 16&#10;9:00 AM - 10:30 AM: Workshop Session 1&#10;11:00 AM - 12:30 PM: Panel Discussion'
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className='min-h-[200px]'
                />
              </div>

              <div className='text-sm text-muted-foreground'>
                <p>Tips for better results:</p>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  <li>Include dates and times for each item</li>
                  <li>Use clear titles for sessions</li>
                  <li>Separate different days clearly</li>
                  <li>Include descriptions when available</li>
                </ul>
              </div>
            </>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  Parsed Schedule Preview
                </h3>
                <div className='text-sm text-muted-foreground'>
                  {parsedResult?.items?.length} items found
                </div>
              </div>

              <div className='max-h-[400px] overflow-y-auto space-y-3'>
                {parsedResult?.items?.map((item, index) => (
                  <div
                    key={index}
                    className='border rounded-lg p-4 bg-muted/50'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='font-medium'>{item.title}</h4>
                        {item.description && (
                          <p className='text-sm text-muted-foreground mt-1'>
                            {item.description}
                          </p>
                        )}
                        <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
                          <span>📅 {item.date}</span>
                          <span>
                            🕐 {item.start_time} - {item.end_time}
                          </span>
                        </div>
                      </div>
                      <Check className='h-5 w-5 text-green-500' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!showPreview ? (
            <>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={isLoading || !rawText.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Wand2 className='h-4 w-4 mr-2' />
                    Parse Schedule
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' onClick={handleReject}>
                <X className='h-4 w-4 mr-2' />
                Try Again
              </Button>
              <Button onClick={handleAccept}>
                <Check className='h-4 w-4 mr-2' />
                Accept & Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
