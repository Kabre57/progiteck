import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Devis, Facture } from '../types/api';

// Fonction pour générer un PDF de devis
export const generateDevisPDF = async (devis: Devis) => {
  // Créer un nouveau document PDF
  const doc = new jsPDF();
  
  // Ajouter le logo et les informations d'en-tête
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 255);
  doc.text('Progiteck SYSTEM', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('DEVIS', 105, 30, { align: 'center' });
  
  // Informations du devis
  doc.setFontSize(10);
  doc.text(`Numéro: ${devis.numero}`, 15, 40);
  doc.text(`Date: ${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}`, 15, 45);
  doc.text(`Validité: ${new Date(devis.dateValidite).toLocaleDateString('fr-FR')}`, 15, 50);
  
  // Informations du client
  doc.text('Client:', 130, 40);
  doc.text(`${devis.client?.nom || ''}`, 130, 45);
  doc.text(`${devis.client?.entreprise || ''}`, 130, 50);
  doc.text(`${devis.client?.email || ''}`, 130, 55);
  
  // Titre et description
  doc.setFontSize(12);
  doc.text(devis.titre, 15, 65);
  
  if (devis.description) {
    doc.setFontSize(10);
    doc.text(devis.description, 15, 72);
  }
  
  // Tableau des lignes de devis
  const tableColumn = ["Désignation", "Quantité", "Prix unitaire", "Montant HT"];
  const tableRows: any[] = [];
  
  devis.lignes?.forEach(ligne => {
    const ligneData = [
      ligne.designation,
      ligne.quantite.toString(),
      ligne.prixUnitaire.toLocaleString('fr-FR') + ' XOF',
      ligne.montantHT.toLocaleString('fr-FR') + ' XOF'
    ];
    tableRows.push(ligneData);
  });
  
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 153] }
  });
  
  // Calcul du total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text(`Montant HT: ${devis.montantHT.toLocaleString('fr-FR')} XOF`, 130, finalY);
  doc.text(`TVA (${devis.tauxTVA}%): ${(devis.montantTTC - devis.montantHT).toLocaleString('fr-FR')} XOF`, 130, finalY + 5);
  doc.text(`Montant TTC: ${devis.montantTTC.toLocaleString('fr-FR')} XOF`, 130, finalY + 10);
  
  // Statut du devis
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 204);
  
  let statutText = '';
  switch (devis.statut) {
    case 'brouillon': statutText = 'BROUILLON'; break;
    case 'envoye': statutText = 'EN ATTENTE DE VALIDATION'; break;
    case 'valide_dg': statutText = 'VALIDÉ PAR LA DIRECTION'; break;
    case 'refuse_dg': statutText = 'REFUSÉ PAR LA DIRECTION'; break;
    case 'accepte_client': statutText = 'ACCEPTÉ PAR LE CLIENT'; break;
    case 'refuse_client': statutText = 'REFUSÉ PAR LE CLIENT'; break;
    case 'facture': statutText = 'FACTURÉ'; break;
  }
  
  doc.text(statutText, 105, finalY + 20, { align: 'center' });
  
  // Commentaires
  if (devis.commentaireDG) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Commentaire Direction:', 15, finalY + 30);
    doc.text(devis.commentaireDG, 15, finalY + 35);
  }
  
  if (devis.commentaireClient) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Commentaire Client:', 15, finalY + 45);
    doc.text(devis.commentaireClient, 15, finalY + 50);
  }
  
  // Pied de page
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Progiteck System - Tous droits réservés', 105, pageHeight - 10, { align: 'center' });
  
  // Ouvrir le PDF dans un nouvel onglet
  window.open(URL.createObjectURL(doc.output('blob')));
};

// Fonction pour générer un PDF de facture
export const generateFacturePDF = async (facture: Facture) => {
  // Créer un nouveau document PDF
  const doc = new jsPDF();
  
  // Ajouter le logo et les informations d'en-tête
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 255);
  doc.text('Progiteck SYSTEM', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURE', 105, 30, { align: 'center' });
  
  // Informations de la facture
  doc.setFontSize(10);
  doc.text(`Numéro: ${facture.numero}`, 15, 40);
  doc.text(`Date d'émission: ${new Date(facture.dateEmission).toLocaleDateString('fr-FR')}`, 15, 45);
  doc.text(`Date d'échéance: ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`, 15, 50);
  
  // Informations du client
  doc.text('Client:', 130, 40);
  doc.text(`${facture.client?.nom || ''}`, 130, 45);
  doc.text(`${facture.client?.entreprise || ''}`, 130, 50);
  doc.text(`${facture.client?.email || ''}`, 130, 55);
  
  // Référence au devis
  doc.text(`Référence devis: ${facture.devis?.numero || ''}`, 15, 60);
  
  // Tableau des lignes de facture
  const tableColumn = ["Désignation", "Quantité", "Prix unitaire", "Montant HT"];
  const tableRows: any[] = [];
  
  facture.lignes?.forEach(ligne => {
    const ligneData = [
      ligne.designation,
      ligne.quantite.toString(),
      ligne.prixUnitaire.toLocaleString('fr-FR') + ' XOF',
      ligne.montantHT.toLocaleString('fr-FR') + ' XOF'
    ];
    tableRows.push(ligneData);
  });
  
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 153] }
  });
  
  // Calcul du total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text(`Montant HT: ${facture.montantHT.toLocaleString('fr-FR')} XOF`, 130, finalY);
  doc.text(`TVA (${facture.tauxTVA}%): ${(facture.montantTTC - facture.montantHT).toLocaleString('fr-FR')} XOF`, 130, finalY + 5);
  doc.text(`Montant TTC: ${facture.montantTTC.toLocaleString('fr-FR')} XOF`, 130, finalY + 10);
  
  // Statut de la facture
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 204);
  
  let statutText = '';
  switch (facture.statut) {
    case 'emise': statutText = 'ÉMISE'; break;
    case 'envoyee': statutText = 'ENVOYÉE'; break;
    case 'payee': statutText = 'PAYÉE'; break;
    case 'annulee': statutText = 'ANNULÉE'; break;
  }
  
  doc.text(statutText, 105, finalY + 20, { align: 'center' });
  
  // Informations de paiement
  if (facture.statut === 'payee') {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informations de paiement:', 15, finalY + 30);
    doc.text(`Date de paiement: ${facture.datePaiement ? new Date(facture.datePaiement).toLocaleDateString('fr-FR') : '-'}`, 15, finalY + 35);
    doc.text(`Mode de paiement: ${facture.modePaiement || '-'}`, 15, finalY + 40);
    if (facture.referenceTransaction) {
      doc.text(`Référence: ${facture.referenceTransaction}`, 15, finalY + 45);
    }
  }
  
  // Pied de page
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Progiteck System - Tous droits réservés', 105, pageHeight - 10, { align: 'center' });
  
  // Ouvrir le PDF dans un nouvel onglet
  window.open(URL.createObjectURL(doc.output('blob')));
};