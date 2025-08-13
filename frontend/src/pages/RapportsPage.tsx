import { useState, useEffect } from 'react';
import { RapportMission } from '@/types';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RapportForm from '@/components/forms/RapportForm';
import { rapportService } from '@/services/rapportService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function RapportsPage() {
  // Pagination locale pour DataTable
  const fetchData = async ({ page, limit, search }: { page: number; limit: number; search?: string }) => {
    let filtered = rapports;
    if (search) {
      const s = search.toLowerCase();
      filtered = rapports.filter(r =>
        r.titre.toLowerCase().includes(s) ||
        r.statut.toLowerCase().includes(s) ||
        (r.technicien?.prenom?.toLowerCase().includes(s) || false) ||
        (r.technicien?.nom?.toLowerCase().includes(s) || false)
      );
    }
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: filtered.slice(start, end),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  };
  const [rapports, setRapports] = useState<RapportMission[]>([]);
  const [selectedRapport, setSelectedRapport] = useState<RapportMission | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchRapports = async () => {
      try {
        const response = await rapportService.getRapports();
        setRapports(response.data || []);
      } catch (error) {
        // Gérer l'erreur
      }
    };
    fetchRapports();
  }, [refreshTrigger]);

  // Colonnes pour DataTable
  const columns: { key: keyof RapportMission; title: string; render: (value: unknown, record: RapportMission) => JSX.Element }[] = [
    {
      key: 'titre',
      title: 'Titre',
      render: (value, record) => <span className="font-medium text-gray-900">{String(value)}</span>,
    },
    {
      key: 'technicien',
      title: 'Technicien',
      render: (_, record) => (
        <span>{record.technicien?.prenom} {record.technicien?.nom}</span>
      ),
    },
    {
      key: 'mission',
      title: 'Mission',
      render: (_, record) => (
        <span>{record.mission?.numIntervention}</span>
      ),
    },
    {
      key: 'statut',
      title: 'Statut',
      render: (value, record) => {
        const statut = String(value);
        return (
          <span className={
            statut === 'valide' ? 'text-green-600' : statut === 'rejete' ? 'text-red-600' : 'text-yellow-600'
          }>{statut}</span>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Créé le',
      render: (value, record) => (
        <span>{value ? format(new Date(String(value)), 'dd/MM/yyyy', { locale: fr }) : '-'}</span>
      ),
    },
    {
      key: 'id',
      title: 'Actions',
      render: (_, record) => (
        <button
          className="text-blue-600 hover:text-blue-900 p-1"
          onClick={() => { setSelectedRapport(record); setShowViewModal(true); }}
        >Voir</button>
      ),
    },
  ];

  // Statistiques
  const total = rapports.length;
  const valides = rapports.filter(r => r.statut === 'valide').length;
  const rejetes = rapports.filter(r => r.statut === 'rejete').length;
  const soumis = rapports.filter(r => r.statut === 'soumis').length;

  // Création d'un rapport
  const handleCreate = async (data: any) => {
    try {
      await rapportService.createRapport(data);
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      // Gérer l'erreur
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Rapports de mission</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >Nouveau rapport</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total" value={total} color="blue" icon={FileText} />
          <StatCard title="Validés" value={valides} color="green" icon={CheckCircle} />
          <StatCard title="Rejetés" value={rejetes} color="red" icon={XCircle} />
          <StatCard title="En attente" value={soumis} color="yellow" icon={Clock} />
        </div>
  <DataTable<RapportMission> columns={columns} fetchData={fetchData} pageSize={10} searchable={true} />
      </div>

      {/* Modal création */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau rapport"
        size="lg"
      >
        <RapportForm onSubmit={handleCreate} isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      </Modal>

      {/* Modal visualisation */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedRapport(null); }}
        title="Détails du rapport"
        size="xl"
      >
        {selectedRapport && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{selectedRapport.titre}</h2>
            <p><span className="font-semibold">Technicien :</span> {selectedRapport.technicien?.prenom} {selectedRapport.technicien?.nom}</p>
            <p><span className="font-semibold">Mission :</span> {selectedRapport.mission?.numIntervention}</p>
            <p><span className="font-semibold">Statut :</span> {selectedRapport.statut}</p>
            <p><span className="font-semibold">Créé le :</span> {format(new Date(selectedRapport.createdAt), 'dd/MM/yyyy', { locale: fr })}</p>
            <div>
              <span className="font-semibold">Contenu :</span>
              <div className="bg-gray-50 p-3 rounded mt-2">{selectedRapport.contenu}</div>
            </div>
            {selectedRapport.images && selectedRapport.images.length > 0 && (
              <div>
                <span className="font-semibold">Images associées :</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRapport.images.map(img => (
                    <img key={img.id} src={img.url} alt={img.description || ''} className="h-24 rounded shadow" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}


