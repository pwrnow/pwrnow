'use client';

import {
  Plus,
  Search,
  MoreHorizontal,
  Upload,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Dropzone } from '@/components/ui/dropzone';

interface Organization {
  id: string;
  name: string;
  image_url: string | null;
  code: string;
  created_at: string;
}

function generateCode(name: string): string {
  // Convert name to lowercase and take first letters of each word
  const prefix = name
    .toLowerCase()
    .split(' ')
    .map((word) => word[0])
    .join('');

  // Generate random string of numbers and lowercase letters
  const randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32 - prefix.length;
  let result = prefix;

  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }

  return result;
}

export function OrganizationsTable({
  organizations: initialOrganizations,
}: {
  organizations: Organization[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditCodeDialogOpen, setIsEditCodeDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState({
    name: '',
    code: '',
    imageFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleNameChange = (name: string) => {
    if (name.trim()) {
      const code = generateCode(name);
      setNewOrg((prev) => ({ ...prev, name, code }));
    } else {
      setNewOrg((prev) => ({ ...prev, name: '', code: '' }));
    }
  };

  const handleImageDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      if (acceptedFiles[0].size > 5 * 1024 * 1024) {
        setImageError('Rozmiar obrazka nie może przekraczać 5MB');
        setNewOrg((prev) => ({ ...prev, imageFile: null }));
        setPreviewUrl(null);
      } else {
        setImageError(null);
        setNewOrg((prev) => ({ ...prev, imageFile: acceptedFiles[0] }));
        setPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
      }
    }
  };

  const handleAddOrganization = async () => {
    if (!newOrg.name.trim()) return;

    setIsSubmitting(true);
    setImageError(null);
    setFormError(null);
    const supabase = createClient();

    try {
      // Insert organization first
      const { data: org, error: insertError } = await supabase
        .from('organizations')
        .insert([
          {
            name: newOrg.name.trim(),
            code: newOrg.code,
            image_url: null, // We'll update this after upload
          },
        ])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          setFormError('Organizacja o takim kodzie już istnieje');
        } else {
          setFormError('Wystąpił błąd podczas dodawania organizacji');
        }
        console.error('Error inserting organization:', insertError);
        return;
      }

      if (!org) {
        setFormError('Nie udało się utworzyć organizacji');
        return;
      }

      let finalOrg = org;

      // Handle image upload if provided
      if (newOrg.imageFile) {
        try {
          // Ensure storage bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const orgImagesBucket = buckets?.find(
            (bucket) => bucket.name === 'organization-images'
          );

          if (!orgImagesBucket) {
            const { error: createBucketError } =
              await supabase.storage.createBucket('organization-images', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
              });

            if (createBucketError) {
              console.error('Error creating bucket:', createBucketError);
            }
          }

          // Convert File to ArrayBuffer for upload
          const arrayBuffer = await newOrg.imageFile.arrayBuffer();
          const fileBuffer = new Uint8Array(arrayBuffer);

          // Generate a unique filename
          const fileExtension = newOrg.imageFile.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExtension}`;
          const filePath = `${org.code}/${fileName}`;

          // Upload file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('organization-images')
            .upload(filePath, fileBuffer, {
              contentType: newOrg.imageFile.type,
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL for the uploaded image
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('organization-images')
            .getPublicUrl(filePath);

          // Update organization with new image URL
          const { data: updatedOrg, error: updateError } = await supabase
            .from('organizations')
            .update({ image_url: publicUrl })
            .eq('id', org.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          if (updatedOrg) {
            finalOrg = updatedOrg;
          }
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          // Don't return here, we still want to add the organization without the image
          if (uploadError.message.includes('exceeded')) {
            setImageError('Rozmiar obrazka nie może przekraczać 5MB');
          } else {
            setImageError('Wystąpił błąd podczas przesyłania obrazka');
          }
        }
      }

      // Add the organization to the list (with or without image)
      setOrganizations([...organizations, finalOrg]);

      // Reset form
      setNewOrg({ name: '', code: '', imageFile: null });
      setPreviewUrl(null);
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error in handleAddOrganization:', error);
      setFormError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCodeChange = (value: string) => {
    if (!editingOrg) return;

    if (!value.trim()) {
      // Generate new code if input is empty
      const newCode = generateCode(editingOrg.name);
      setEditingOrg((prev) => (prev ? { ...prev, code: newCode } : null));
    } else {
      setEditingOrg((prev) => (prev ? { ...prev, code: value } : null));
    }
  };

  const handleUpdateCode = async () => {
    if (!editingOrg) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('organizations')
      .update({ code: editingOrg.code })
      .eq('id', editingOrg.id);

    if (error) {
      console.error('Error updating organization code:', error);
      // Here you might want to show an error toast
    } else {
      setOrganizations(
        organizations.map((org) =>
          org.id === editingOrg.id ? { ...org, code: editingOrg.code } : org
        )
      );
      setIsEditCodeDialogOpen(false);
      setEditingOrg(null);
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting organization:', error);
      // Here you might want to show an error toast
    } else {
      setOrganizations(organizations.filter((org) => org.id !== id));
    }
  };

  return (
    <>
      <div className='flex items-center justify-between gap-2 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Szukaj organizacji...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Dodaj organizację
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nową organizację</DialogTitle>
              <DialogDescription>
                Wypełnij poniższe pola aby dodać nową organizację.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Nazwa organizacji</Label>
                <Input
                  id='name'
                  value={newOrg.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder='np. Politechnika Wrocławska'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='code'>Kod organizacji</Label>
                <Input
                  id='code'
                  value={newOrg.code}
                  readOnly
                  className='bg-muted'
                  placeholder={
                    newOrg.name.trim()
                      ? ''
                      : 'Najpierw wprowadź nazwę organizacji'
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label>Logo organizacji (opcjonalne)</Label>
                <Dropzone onDrop={handleImageDrop} />
                {newOrg.imageFile && !imageError && (
                  <div className='flex items-center gap-4 mt-2'>
                    <img
                      src={previewUrl || undefined}
                      alt='Preview'
                      className='w-16 h-16 object-contain rounded-lg border'
                    />
                    <p className='text-sm'>
                      {newOrg.imageFile.name} (
                      {Math.round(newOrg.imageFile.size / 1024)} KB)
                    </p>
                  </div>
                )}
                {imageError && (
                  <p className='text-sm text-destructive'>{imageError}</p>
                )}
              </div>
            </div>
            {formError && (
              <p className='text-sm text-destructive'>{formError}</p>
            )}
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewOrg({ name: '', code: '', imageFile: null });
                  setPreviewUrl(null);
                  setImageError(null);
                  setFormError(null);
                }}
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button
                onClick={handleAddOrganization}
                disabled={!newOrg.name.trim() || isSubmitting}
              >
                {isSubmitting ? 'Dodawanie...' : 'Dodaj organizację'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={isEditCodeDialogOpen}
        onOpenChange={setIsEditCodeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj kod organizacji</DialogTitle>
            <DialogDescription>
              Zmień kod organizacji {editingOrg?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code'>Kod organizacji</Label>
              <Input
                id='edit-code'
                value={editingOrg?.code || ''}
                onChange={(e) => handleEditCodeChange(e.target.value)}
                placeholder='Wprowadź nowy kod'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsEditCodeDialogOpen(false);
                setEditingOrg(null);
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleUpdateCode}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'></TableHead>
                <TableHead>Nazwa</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead className='text-right'>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <Avatar className='h-9 w-9 border border-primary/20'>
                      <AvatarImage
                        src={org.image_url || undefined}
                        alt={org.name}
                      />
                      <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-white text-xs'>
                        {getInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className='font-medium'>{org.name}</TableCell>
                  <TableCell className='flex items-center gap-2'>
                    <Button
                      variant='link'
                      className='h-auto p-0 text-sm font-normal hover:no-underline'
                      asChild
                    >
                      <Link
                        href={`/${org.code}`}
                        target='_blank'
                        className='flex items-center gap-1'
                      >
                        <span>{org.code}</span>
                        <ExternalLink className='h-3 w-3' />
                      </Link>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 ml-1'
                      onClick={() => {
                        setEditingOrg(org);
                        setIsEditCodeDialogOpen(true);
                      }}
                    >
                      <Pencil className='h-3 w-3' />
                    </Button>
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size='icon' variant='ghost' className='h-8 w-8'>
                          <MoreHorizontal className='h-4 w-4' />
                          <span className='sr-only'>Otwórz menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => handleDeleteOrganization(org.id)}
                        >
                          Usuń
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
