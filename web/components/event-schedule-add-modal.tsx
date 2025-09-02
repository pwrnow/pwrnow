'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventSlug: string;
  selectedDate: string; // YYYY-MM-DD (from day selector)
  initialStartTime?: string | null; // HH:MM preferred
  onCreate: (payload: {
    event_slug: string;
    date: string;
    start_time: string;
    end_time: string;
    title: string;
    description?: string;
  }) => Promise<void>;
}

export default function EventScheduleAddModal({
  open,
  onOpenChange,
  eventSlug,
  selectedDate,
  initialStartTime,
  onCreate,
}: Props) {
  const t = useTranslations('EventDetailsPage');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startHour, setStartHour] = useState('10');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('11');
  const [endMinute, setEndMinute] = useState('00');
  const [submitting, setSubmitting] = useState(false);

  const presets = useMemo(() => [15, 40, 45, 60], []);
  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')),
    []
  );

  const startTimeString = `${startHour}:${startMinute}`;
  const endTimeString = `${endHour}:${endMinute}`;
  const [selectedPreset, setSelectedPreset] = useState<number>(60);

  const setStartFromString = (val: string) => {
    const [h, m] = val.split(':');
    if (h && m) {
      setStartHour(h.padStart(2, '0'));
      setStartMinute(m.padStart(2, '0'));
    }
  };

  function getCurrentTimeHHMM(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Initialize start/end when modal opens
  React.useEffect(() => {
    if (!open) return;
    const time = initialStartTime || getCurrentTimeHHMM();
    setStartFromString(time);
    // Recompute end from the parsed time to reflect selectedPreset
    const [h, m] = time.split(':');
    const baseH = parseInt(h || '10', 10);
    const baseM = parseInt(m || '0', 10);
    const total = baseH * 60 + baseM + selectedPreset;
    const eh = Math.floor((total % (24 * 60)) / 60);
    const em = total % 60;
    setEndHour(String(eh).padStart(2, '0'));
    setEndMinute(String(em).padStart(2, '0'));
  }, [open, initialStartTime, selectedPreset]);

  const setEndFromString = (val: string) => {
    const [h, m] = val.split(':');
    if (h && m) {
      setEndHour(h.padStart(2, '0'));
      setEndMinute(m.padStart(2, '0'));
    }
  };

  const applyDuration = (minutes: number) => {
    const startH = parseInt(startHour, 10);
    const startM = parseInt(startMinute, 10);
    const total = startH * 60 + startM + minutes;
    const h = Math.floor((total % (24 * 60)) / 60);
    const m = total % 60;
    setEndHour(h.toString().padStart(2, '0'));
    setEndMinute(m.toString().padStart(2, '0'));
    setSelectedPreset(minutes);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartHour('10');
    setStartMinute('00');
    setEndHour('11');
    setEndMinute('00');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSubmitting(true);
    try {
      await onCreate({
        event_slug: eventSlug,
        date: selectedDate,
        start_time: startTimeString,
        end_time: endTimeString,
        title,
        description: description.trim() || undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addScheduleItem')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label className='mb-1 block'>{t('itemTitle')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label className='mb-1 block'>{t('itemStartTime')}</Label>
              <Input
                type='time'
                step={300}
                value={`${startHour}:${startMinute}`}
                onChange={(e) => {
                  setStartFromString(e.target.value);
                  // Keep end time aligned with currently selected preset
                  applyDuration(selectedPreset);
                }}
              />
            </div>
            <div>
              <Label className='mb-1 block'>{t('itemEndTime')}</Label>
              <Input
                type='time'
                step={300}
                value={`${endHour}:${endMinute}`}
                onChange={(e) => setEndFromString(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className='mb-1 block'>{t('durationPresets')}</Label>
            <div className='flex flex-wrap gap-2'>
              {presets.map((min) => (
                <Button
                  key={min}
                  type='button'
                  variant={selectedPreset === min ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => applyDuration(min)}
                >
                  {t('minutes', { count: min })}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className='mb-1 block'>{t('itemDescription')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
