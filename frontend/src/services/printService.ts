import { Devis, Facture, Intervention } from '@/types';

export interface PrintOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'A4' | 'A3';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export class PrintService {
  private static getCompanyLogo(): string {
    return '/images/logo.jpeg';
  }

  private static getCompanyInfo(): string {
    return `
      <div class="company-header">
        <img src="${this.getCompanyLogo()}" alt="Progi-Teck Logo" class="logo" />
        <div class="company-details">
          <h1>Progi-Teck</h1>
          <p>Parceque le monde avance</p>
          <p>Système de Gestion Technique</p>
          <p>Email: contact@progi-teck.ci | Tél: +225 27 20 30 40 50</p>
          <p>Abidjan, Côte d'Ivoire</p>
        </div>
      </div>
    `;
  }

  private static getCommonStyles(): string {
    return `
      <style>
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
        
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #000;
        }
        
        .company-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        
        .logo {
          width: 120px;
          height: auto;
          margin-right: 30px;
        }
        
        .company-details h1 {
          color: #3b82f6;
          font-size: 24px;
          margin: 0 0 5px 0;
        }
        
        .company-details p {
          margin: 2px 0;
          color: #666;
        }
        
        .document-title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin: 30px 0;
          color: #1f2937;
          text-transform: uppercase;
        }
        
        .info-section {
          margin: 20px 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .info-box {
          border: 1px solid #e5e7eb;
          padding: 15px;
          border-radius: 5px;
        }
        
        .info-box h3 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 14px;
          font-weight: bold;
        }
        
        .info-box p {
          margin: 5px 0;
          font-size: 12px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .table th,
        .table td {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        
        .table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        
        .table .text-right {
          text-align: right;
        }
        
        .table .text-center {
          text-align: center;
        }
        
        .totals {
          margin-top: 20px;
          text-align: right;
        }
        
        .totals table {
          margin-left: auto;
          width: 300px;
        }
        
        .totals .total-line {
          font-weight: bold;
          background-color: #f9fafb;
        }
        
        .signatures {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 30px;
        }
        
        .signature-box {
          text-align: center;
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 60px;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-validated { background: #d1fae5; color: #065f46; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
      </style>
    `;
  }

  // Impression des devis
  static printDevis(devis: Devis): void {
    const statusLabels = {
      brouillon: 'Brouillon',
      envoye: 'Envoyé',
      valide_dg: 'Validé DG',
      valide_pdg: 'Validé PDG',
      accepte_client: 'Accepté Client',
      refuse_client: 'Refusé Client',
      facture: 'Facturé'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Devis ${devis.numero}</title>
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.getCompanyInfo()}
        
        <div class="document-title">Devis N° ${devis.numero}</div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>Informations Client</h3>
            <p><strong>Nom:</strong> ${devis.client?.nom ?? '-'}</p>
            <p><strong>Entreprise:</strong> ${devis.client?.entreprise ?? 'Particulier'}</p>
            <p><strong>Email:</strong> ${devis.client?.email ?? '-'}</p>
            <p><strong>Téléphone:</strong> ${devis.client?.telephone ?? '-'}</p>
            <p><strong>Adresse:</strong> ${devis.client?.localisation ?? '-'}</p>
          </div>
          
          <div class="info-box">
            <h3>Informations Devis</h3>
            <p><strong>Date création:</strong> ${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</p>
            <p><strong>Date validité:</strong> ${new Date(devis.dateValidite).toLocaleDateString('fr-FR')}</p>
            <p><strong>Statut:</strong> <span class="status-badge status-${devis.statut}">${statusLabels[devis.statut as keyof typeof statusLabels]}</span></p>
            ${devis.mission ? `<p><strong>Mission:</strong> ${devis.mission.numIntervention}</p>` : ''}
          </div>
        </div>
        
        <div class="info-section">
          <h3>Objet du Devis</h3>
          <p><strong>${devis.titre}</strong></p>
          ${devis.description ? `<p>${devis.description}</p>` : ''}
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50%">Désignation</th>
              <th style="width: 10%" class="text-center">Qté</th>
              <th style="width: 20%" class="text-right">Prix Unitaire</th>
              <th style="width: 20%" class="text-right">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            ${devis.lignes.map(ligne => `
              <tr>
                <td>${ligne.designation}</td>
                <td class="text-center">${ligne.quantite}</td>
                <td class="text-right">${ligne.prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
                <td class="text-right">${ligne.montantHT.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table class="table">
            <tr>
              <td><strong>Total HT:</strong></td>
              <td class="text-right"><strong>${devis.montantHT.toLocaleString('fr-FR')} FCFA</strong></td>
            </tr>
            <tr>
              <td><strong>TVA (${devis.tauxTVA}%):</strong></td>
              <td class="text-right"><strong>${(devis.montantTTC - devis.montantHT).toLocaleString('fr-FR')} FCFA</strong></td>
            </tr>
            <tr class="total-line">
              <td><strong>Total TTC:</strong></td>
              <td class="text-right"><strong>${devis.montantTTC.toLocaleString('fr-FR')} FCFA</strong></td>
            </tr>
          </table>
        </div>
        
        ${devis.commentaireDG || devis.commentairePDG ? `
          <div class="info-section">
            <h3>Commentaires</h3>
            ${devis.commentaireDG ? `<p><strong>DG:</strong> ${devis.commentaireDG}</p>` : ''}
            ${devis.commentairePDG ? `<p><strong>PDG:</strong> ${devis.commentairePDG}</p>` : ''}
          </div>
        ` : ''}
        
        <div class="signatures">
          <div class="signature-box">Progi-Teck</div>
          <div class="signature-box">Direction</div>
          <div class="signature-box">Client</div>
        </div>
        
        <div class="footer">
          <p>Devis généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Progi-Teck - Système de Gestion Technique - www.progi-teck.ci</p>
        </div>
      </body>
      </html>
    `;

    this.openPrintWindow(html, `Devis_${devis.numero}`);
  }

  // Impression des factures
  static printFacture(facture: Facture): void {
    const statusLabels = {
      emise: 'Émise',
      envoyee: 'Envoyée',
      payee: 'Payée',
      annulee: 'Annulée'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Facture ${facture.numero}</title>
        ${this.getCommonStyles()}
      </head>
      <body>
        ${this.getCompanyInfo()}
        
        <div class="document-title">Facture N° ${facture.numero}</div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>Informations Client</h3>
            <p><strong>Nom:</strong> ${facture.client?.nom ?? '-'}</p>
            <p><strong>Entreprise:</strong> ${facture.client?.entreprise ?? 'Particulier'}</p>
            <p><strong>Email:</strong> ${facture.client?.email ?? '-'}</p>
            <p><strong>Téléphone:</strong> ${facture.client?.telephone ?? '-'}</p>
            <p><strong>Adresse:</strong> ${facture.client?.localisation ?? '-'}</p>
          </div>
          
          <div class="info-box">
            <h3>Informations Facture</h3>
            <p><strong>Date émission:</strong> ${new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</p>
            <p><strong>Date échéance:</strong> ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</p>
            <p><strong>Statut:</strong> <span class="status-badge status-${facture.statut}">${statusLabels[facture.statut as keyof typeof statusLabels]}</span></p>
            ${facture.devis ? `<p><strong>Devis:</strong> ${facture.devis.numero}</p>` : ''}
            ${facture.datePaiement ? `<p><strong>Date paiement:</strong> ${new Date(facture.datePaiement).toLocaleDateString('fr-FR')}</p>` : ''}
            ${facture.modePaiement ? `<p><strong>Mode paiement:</strong> ${facture.modePaiement}</p>` : ''}
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50%">Désignation</th>
              <th style="width: 10%" class="text-center">Qté</th>
              <th style="width: 20%" class="text-right">Prix Unitaire</th>
              <th style="width: 20%" class="text-right">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            ${facture.lignes.map(ligne => `
              <tr>
                <td>${ligne.designation}</td>
                <td class="text-center">${ligne.quantite}</td>
                <td class="text-right">${ligne.prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
                <td class="text-right">${ligne.montantHT.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table class="table">
            <tr>
              <td><strong>Total HT:</strong></td>
              <td class="text-right"><strong>${facture.montantHT.toLocaleString('fr-FR')} FCFA</strong></td>
            </tr>
            <tr>
              <td><strong>TVA (${facture.tauxTVA}%):</strong></td>
              <td class="text-right"><strong>${(facture.montantTTC - facture.montantHT).toLocaleString('fr-FR')} FCFA</strong></td>
            </tr>
            <tr class="total-line">
              <td><strong>Total TTC:</strong></td>
              <td class="text-right"><strong>${facture.montantTTC.toLocaleString('fr-FR')} FCFA</strong></td>
            </tr>
          </table>
        </div>
        
        <div class="signatures">
          <div class="signature-box">Progi-Teck</div>
          <div class="signature-box">Comptabilité</div>
          <div class="signature-box">Client</div>
        </div>
        
        <div class="footer">
          <p>Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Progi-Teck - Système de Gestion Technique - www.progi-teck.ci</p>
        </div>
      </body>
      </html>
    `;

    this.openPrintWindow(html, `Facture_${facture.numero}`);
  }

  // Impression des fiches d'intervention
  static printFicheIntervention(intervention: Intervention): void {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
  <title>Fiche Intervention ${intervention.mission?.numIntervention ?? '-'}</title>
        ${this.getCommonStyles()}
        <style>
          .intervention-header {
            background: #f8fafc;
            padding: 15px;
            border: 2px solid #3b82f6;
            margin: 20px 0;
            text-align: center;
          }
          
          .checkbox-group {
            display: flex;
            gap: 20px;
            margin: 10px 0;
          }
          
          .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .checkbox {
            width: 15px;
            height: 15px;
            border: 1px solid #000;
            display: inline-block;
          }
          
          .material-table {
            margin: 20px 0;
          }
          
          .observations {
            min-height: 100px;
            border: 1px solid #d1d5db;
            padding: 10px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        ${this.getCompanyInfo()}
        
        <div class="intervention-header">
          <h2>FICHE DE SORTIE TECHNICIEN - INTERVENTION TECHNIQUE</h2>
        </div>
        
        <div class="info-section">
          <h3>Informations Générales</h3>
          <table class="table">
            <tr>
              <td style="width: 25%"><strong>Réf. Fiche:</strong></td>
              <td style="width: 25%">${intervention.mission?.numIntervention ?? '-'}</td>
              <td style="width: 25%"><strong>Date:</strong></td>
              <td style="width: 25%">${intervention.dateHeureDebut ? new Date(intervention.dateHeureDebut).toLocaleDateString('fr-FR') : '-'}</td>
            </tr>
            <tr>
              <td><strong>Heure de départ:</strong></td>
              <td>${intervention.dateHeureDebut ? new Date(intervention.dateHeureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
              <td><strong>Heure de retour:</strong></td>
              <td>${intervention.dateHeureFin ? new Date(intervention.dateHeureFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '___:___'}</td>
            </tr>
          </table>
        </div>
        
        <div class="info-section">
          <h3>Informations du Technicien</h3>
          <table class="table">
            <thead>
              <tr>
                <th style="width: 40%">Nom et Prénoms</th>
                <th style="width: 30%">Compétences Techniques</th>
                <th style="width: 30%">Contact</th>
              </tr>
            </thead>
            <tbody>
              ${(intervention.techniciens ?? []).map(tech => `
                <tr>
                  <td>${tech.technicien?.prenom ?? '-'} ${tech.technicien?.nom ?? '-'}</td>
                  <td>${tech.technicien?.specialite?.libelle ?? '-'}</td>
                  <td>${tech.technicien?.contact ?? '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="info-section">
          <h3>Informations de l'Intervention</h3>
          <table class="table">
            <tr>
              <td style="width: 33%"><strong>Client:</strong></td>
              <td style="width: 33%"><strong>Adresse:</strong></td>
              <td style="width: 34%"><strong>Contact sur site:</strong></td>
            </tr>
            <tr>
              <td>${intervention.mission?.client?.nom ?? '-'}<br>${intervention.mission?.client?.entreprise ?? ''}</td>
              <td>${intervention.mission?.client?.localisation ?? '___________________'}</td>
              <td>${intervention.mission?.client?.telephone ?? '___________________'}</td>
            </tr>
          </table>
        </div>
        
        <div class="info-section">
          <h3>Détails de la Mission</h3>
          <p><strong>Nature de l'intervention:</strong></p>
          <div class="checkbox-group">
            <div class="checkbox-item">
              <span class="checkbox"></span>
              <span>Installation</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox"></span>
              <span>Inspection</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox"></span>
              <span>Dépannage</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox"></span>
              <span>Visite Technique</span>
            </div>
          </div>
          
          <p><strong>Équipements concernés:</strong></p>
          <p>${intervention.mission?.natureIntervention ?? '-'}</p>
          <p>${intervention.mission?.description ?? ''}</p>
        </div>
        
        <div class="info-section">
          <h3>Matériel / Outillage emporté</h3>
          <table class="table material-table">
            <thead>
              <tr>
                <th style="width: 20%">Référence</th>
                <th style="width: 40%">Désignation</th>
                <th style="width: 15%">Quantité</th>
                <th style="width: 25%">Observations</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 8 }, (_, i) => `
                <tr>
                  <td style="height: 25px;"></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="info-section">
          <h3>Observations / Commentaires du Technicien</h3>
          <div class="observations"></div>
        </div>
        
        <div class="signatures">
          <div class="signature-box">
            <strong>Technicien</strong><br>
            ${(intervention.techniciens?.[0]?.technicien?.prenom ?? '-')} ${(intervention.techniciens?.[0]?.technicien?.nom ?? '-')}
          </div>
          <div class="signature-box">
            <strong>Responsable Technique</strong>
          </div>
          <div class="signature-box">
            <strong>Client (si sur site)</strong>
          </div>
        </div>
        
        <div class="footer">
          <p>Fiche générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Progi-Teck - Système de Gestion Technique - www.progi-teck.ci</p>
        </div>
      </body>
      </html>
    `;

  this.openPrintWindow(html, `Fiche_Intervention_${intervention.mission?.numIntervention ?? '-'}`);
  }

  private static openPrintWindow(html: string, filename: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Attendre que les images se chargent avant d'imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  }
}

export default PrintService;