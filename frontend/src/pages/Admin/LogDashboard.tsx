import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api'; // Assurez-vous que ce chemin est correct

// Définir des types clairs pour les données
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'http';
  message: string;
  metadata?: {
    source?: string;
    [key: string]: any;
  };
}

interface LogFilesResponse {
  data: string[]; // Le backend renvoie les fichiers dans la propriété 'data'
}

interface LogContentResponse {
  data: LogEntry[]; // Le backend renvoie les logs dans la propriété 'data'
}

const LogDashboard = ( ) => {
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des fichiers au montage
  useEffect(() => {
    apiClient.get<LogFilesResponse>('/api/admin/logs')
      .then(response => {
        if (response.success && Array.isArray(response.data)) {
          setLogFiles(response.data);
          
          // === CORRECTION ICI ===
          // On vérifie que le tableau n'est pas vide avant d'accéder au premier élément.
          const firstFile = response.data[0];
          if (firstFile) {
            setSelectedFile(firstFile);
          }
        }
      })
      .catch(() => setError("Impossible de charger la liste des fichiers de log. Vérifiez que vous êtes connecté en tant qu'admin."));
  }, []);

  // Charger le contenu d'un fichier quand il est sélectionné
  useEffect(() => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    apiClient.get<LogContentResponse>(`/api/admin/logs/${selectedFile}`)
      .then(response => {
        if (response.success && Array.isArray(response.data)) {
          // On s'assure que les logs sont bien un tableau avant de faire le reverse
          setLogs([...response.data].reverse());
        }
      })
      .catch(() => setError(`Impossible de charger le fichier ${selectedFile}.`))
      .finally(() => setLoading(false));
  }, [selectedFile]);

  // Fonction pour donner une couleur au niveau de log
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ff4d4f';
      case 'warn': return '#faad14';
      case 'info': return '#1890ff';
      case 'http': return '#722ed1';
      default: return '#595959';
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ borderBottom: '2px solid #ccc', paddingBottom: '1rem' }}>Tableau de Bord des Logs</h1>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="log-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>Fichier de log :</label>
        <select 
          id="log-select"
          value={selectedFile} 
          onChange={(e ) => setSelectedFile(e.target.value)} 
          style={{ padding: '8px 12px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
          disabled={logFiles.length === 0}
        >
          {logFiles.map(file => <option key={file} value={file}>{file}</option>)}
        </select>
      </div>

      {loading && <p>Chargement des logs...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
              <th style={{ padding: '16px' }}>Timestamp</th>
              <th style={{ padding: '16px' }}>Level</th>
              <th style={{ padding: '16px' }}>Message</th>
              <th style={{ padding: '16px' }}>Source</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      color: getLogLevelColor(log.level),
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${getLogLevelColor(log.level)}1a`
                    }}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>{log.message}</td>
                  <td style={{ padding: '16px' }}>{log.metadata?.source || 'backend'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  Aucun log à afficher pour ce fichier.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogDashboard;
