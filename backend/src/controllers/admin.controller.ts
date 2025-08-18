import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

// Lister les fichiers de log disponibles
export const listLogFiles = (_req: Request, res: Response) => {
  fs.readdir(LOG_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Impossible de lire le dossier des logs." });
    }
    // Filtrer pour ne garder que les fichiers .log et les trier
    const logFiles = files.filter(file => file.endsWith('.log')).sort().reverse();
    res.json({ success: true, data: logFiles });
  });
};

// Lire le contenu d'un fichier de log spécifique
export const getLogFileContent = (req: Request, res: Response) => {
  const { filename } = req.params;
  // Sécurité : Valider que le nom de fichier ne contient pas de ".." pour éviter le path traversal
  if (!filename || filename.includes('..')) {
    return res.status(400).json({ success: false, message: "Nom de fichier invalide." });
  }

  const filePath = path.join(LOG_DIR, filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ success: false, message: "Fichier log introuvable." });
    }
    // Transformer chaque ligne de log JSON en un objet JavaScript
    const logs = data.split('\n').filter(line => line).map(line => JSON.parse(line));
    res.json({ success: true, data: logs });
  });
};
