import { redirect } from 'next/navigation';
import {
  BuildingIcon,
  Calendar,
  Check,
  Clock,
  FileText,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminPage() {
  redirect('/admin/events');
}
