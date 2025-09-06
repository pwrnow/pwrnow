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
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/types';

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
  const t = useTranslations('MagicImportModal');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<MagicImportResponse | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error(t('enterTextError'));
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
        toast.success(t('parsedSuccess', { count: result.items.length }));
      } else {
        toast.error(t('parseFailed'));
      }
    } catch (error) {
      console.error('Magic import error:', error);
      if (error instanceof ApiError && error.status === 429) {
        toast.error(t('rateLimited'));
      } else {
        toast.error(t('parseFailedTryAgain'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (parsedResult?.items && parsedResult.items.length > 0) {
      onScheduleParsed(parsedResult.items);
      handleClose();
      toast.success(t('importSuccess'));
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
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {!showPreview ? (
            <>
              <div className='space-y-2'>
                <Label htmlFor='raw-text'>{t('scheduleTextLabel')}</Label>
                <Textarea
                  id='raw-text'
                  placeholder={t('scheduleTextPlaceholder')}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className='min-h-[200px]'
                />
              </div>

              <div className='text-sm text-muted-foreground'>
                <p>{t('tipsTitle')}</p>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  <li>{t('tipIncludeDates')}</li>
                  <li>{t('tipClearTitles')}</li>
                  <li>{t('tipSeparateDays')}</li>
                  <li>{t('tipIncludeDescriptions')}</li>
                </ul>
              </div>
            </>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  {t('previewTitle')}
                </h3>
                <div className='text-sm text-muted-foreground'>
                  {t('itemsFound', { count: parsedResult?.items?.length || 0 })}
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
                {t('cancel')}
              </Button>
              <Button
                onClick={handleParse}
                disabled={isLoading || !rawText.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    {t('parsing')}
                  </>
                ) : (
                  <>
                    <Wand2 className='h-4 w-4 mr-2' />
                    {t('parseSchedule')}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' onClick={handleReject}>
                <X className='h-4 w-4 mr-2' />
                {t('tryAgain')}
              </Button>
              <Button onClick={handleAccept}>
                <Check className='h-4 w-4 mr-2' />
                {t('acceptImport')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
