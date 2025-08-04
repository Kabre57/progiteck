import { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, XCircle, FileText, Image } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { rapportService } from '@/services/rapportService';
import { useAuth } from '@/hooks/useAuth';
import { Rapport } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import RapportForm from '@/components/forms/RapportForm';

export default function RapportsPage() {
  const { hasRole } = useAuth();
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateRapport = () => {
    setSelectedRapport(null);
    setShowCreateModal(true);
  };

  const handleEditRapport = (rapport: Rapport) => {
    setSelectedRapport(rapport);
    setShowEditModal(true);
  };

  const handleCloseFormModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedRapport(null);
    setRefreshTrigger(prev => prev + 1);
  };
}


