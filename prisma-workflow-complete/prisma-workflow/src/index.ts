import prisma, { checkDatabaseConnection, getDatabaseStats, disconnectPrisma } from './utils/prisma';
import { UtilisateurService } from './services/utilisateur.service';
import { MissionService } from './services/mission.service';

async function main() {
  console.log('🚀 Démarrage de l\'application Prisma Workflow...\n');

  // Vérifier la connexion à la base de données
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Impossible de se connecter à la base de données');
    process.exit(1);
  }

  try {
    // Afficher les statistiques de la base de données
    console.log('📊 Statistiques de la base de données:');
    const stats = await getDatabaseStats();
    console.log(`- Utilisateurs: ${stats.utilisateurs}`);
    console.log(`- Clients: ${stats.clients}`);
    console.log(`- Missions: ${stats.missions}`);
    console.log(`- Interventions: ${stats.interventions}`);
    console.log(`- Devis: ${stats.devis}`);
    console.log(`- Matériels: ${stats.materiels}\n`);

    // Exemple 1: Récupérer tous les utilisateurs avec pagination
    console.log('👥 Exemple 1: Récupération des utilisateurs avec pagination');
    const utilisateurs = await UtilisateurService.getAllUtilisateurs(1, 5);
    console.log(`Trouvé ${utilisateurs.data.length} utilisateurs sur ${utilisateurs.pagination.total} total`);
    utilisateurs.data.forEach(user => {
      console.log(`- ${user.prenom} ${user.nom} (${user.email}) - Rôle: ${user.role.libelle}`);
    });
    console.log('');

    // Exemple 2: Récupérer les techniciens
    console.log('🔧 Exemple 2: Récupération des techniciens');
    const techniciens = await UtilisateurService.getUtilisateursByRole('Technicien');
    console.log(`Trouvé ${techniciens.length} techniciens:`);
    techniciens.forEach(tech => {
      const specialite = tech.technicien?.specialite?.libelle || 'Non spécifiée';
      console.log(`- ${tech.prenom} ${tech.nom} - Spécialité: ${specialite}`);
    });
    console.log('');

    // Exemple 3: Récupérer les missions avec filtres
    console.log('📋 Exemple 3: Récupération des missions');
    const missions = await MissionService.getAllMissions(1, 5);
    console.log(`Trouvé ${missions.data.length} missions sur ${missions.pagination.total} total`);
    missions.data.forEach(mission => {
      console.log(`- ${mission.numIntervention}: ${mission.natureIntervention}`);
      console.log(`  Client: ${mission.client.nom}`);
      console.log(`  Statut: ${mission.statut} | Priorité: ${mission.priorite}`);
      console.log(`  Interventions: ${mission._count.interventions} | Devis: ${mission._count.devis}`);
    });
    console.log('');

    // Exemple 4: Récupérer une mission spécifique avec tous les détails
    console.log('🔍 Exemple 4: Détails d\'une mission spécifique');
    const missionDetail = await MissionService.getMissionByNumIntervention('INT-2024-001');
    if (missionDetail) {
      console.log(`Mission: ${missionDetail.numIntervention}`);
      console.log(`Nature: ${missionDetail.natureIntervention}`);
      console.log(`Client: ${missionDetail.client.nom} (${missionDetail.client.email})`);
      console.log(`Interventions (${missionDetail.interventions.length}):`);
      
      missionDetail.interventions.forEach(intervention => {
        console.log(`  - ID: ${intervention.id}`);
        console.log(`    Début: ${intervention.dateHeureDebut.toLocaleString()}`);
        console.log(`    Fin: ${intervention.dateHeureFin?.toLocaleString() || 'En cours'}`);
        console.log(`    Durée: ${intervention.duree ? `${intervention.duree} minutes` : 'N/A'}`);
        console.log(`    Techniciens (${intervention.techniciens.length}):`);
        
        intervention.techniciens.forEach(techInt => {
          const tech = techInt.technicien;
          console.log(`      - ${tech.utilisateur?.prenom} ${tech.utilisateur?.nom} (${techInt.role})`);
          console.log(`        Spécialité: ${tech.specialite.libelle}`);
        });
      });

      console.log(`Devis (${missionDetail.devis.length}):`);
      missionDetail.devis.forEach(devis => {
        console.log(`  - ${devis.numero}: ${devis.titre}`);
        console.log(`    Montant TTC: ${devis.montantTTC}€`);
        console.log(`    Statut: ${devis.statut}`);
      });
    }
    console.log('');

    // Exemple 5: Statistiques des missions
    console.log('📈 Exemple 5: Statistiques des missions');
    const missionStats = await MissionService.getMissionStats();
    console.log(`Total des missions: ${missionStats.totalMissions}`);
    console.log(`Missions ce mois: ${missionStats.missionsThisMonth}`);
    console.log(`Interventions en cours: ${missionStats.interventionsEnCours}`);
    
    console.log('Répartition par statut:');
    missionStats.missionsByStatus.forEach(stat => {
      console.log(`  - ${stat.statut}: ${stat._count} missions`);
    });
    
    console.log('Répartition par priorité:');
    missionStats.missionsByPriority.forEach(stat => {
      console.log(`  - ${stat.priorite}: ${stat._count} missions`);
    });
    console.log('');

    // Exemple 6: Créer une notification pour un utilisateur
    console.log('🔔 Exemple 6: Création d\'une notification');
    const adminUser = await UtilisateurService.getUtilisateurByEmail('admin@intervention.com');
    if (adminUser) {
      await UtilisateurService.createNotification(
        adminUser.id,
        'info',
        'Nouvelle mission créée: INT-2024-003',
        JSON.stringify({ missionId: 'INT-2024-003', type: 'nouvelle_mission' })
      );
      console.log('Notification créée pour l\'administrateur');
    }
    console.log('');

    // Exemple 7: Créer un log d'audit
    console.log('📝 Exemple 7: Création d\'un log d\'audit');
    if (adminUser) {
      await UtilisateurService.createAuditLog(
        adminUser.id,
        adminUser.email,
        'READ',
        'Mission',
        'INT-2024-001',
        'Consultation des détails de la mission',
        '127.0.0.1'
      );
      console.log('Log d\'audit créé');
    }
    console.log('');

    console.log('✅ Tous les exemples ont été exécutés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des exemples:', error);
  } finally {
    // Déconnexion propre de Prisma
    await disconnectPrisma();
    console.log('🔌 Déconnexion de la base de données');
  }
}

// Gestion des signaux pour une fermeture propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt de l\'application...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt de l\'application...');
  await disconnectPrisma();
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  await disconnectPrisma();
  process.exit(1);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Exception non capturée:', error);
  await disconnectPrisma();
  process.exit(1);
});

// Exécuter le programme principal
if (require.main === module) {
  main();
}

export default main;

