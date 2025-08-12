const axios = require('axios');

const API_BASE = 'https://3000-ixm48sljnwnt6qlg8ufwf-d3e1c6a3.manusvm.computer';

let authToken = null;

async function authenticate() {
  console.log('🔐 Test d\'authentification...');
  
  // Créer un utilisateur de test d'abord
  try {
    const registerResponse = await axios.post(`${API_BASE}/api/users`, {
      nom: 'Test',
      prenom: 'User',
      email: 'test@progitek.com',
      motDePasse: 'TestPassword123!',
      role: 'ADMIN'
    });
    console.log('✅ Utilisateur de test créé');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Utilisateur de test existe déjà');
    } else {
      console.log('⚠️  Erreur création utilisateur:', error.response?.status);
    }
  }
  
  // Tenter la connexion
  try {
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'test@progitek.com',
      motDePasse: 'TestPassword123!'
    });
    
    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Authentification réussie');
    return true;
  } catch (error) {
    console.log('❌ Échec authentification:', error.response?.status);
    console.log('📄 Détails:', error.response?.data);
    return false;
  }
}

async function testCRUDOperations() {
  console.log('\n📋 Test des opérations CRUD...\n');
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  // Test CRUD Clients
  console.log('👥 Test CRUD Clients:');
  let clientId = null;
  
  try {
    // CREATE
    const createClient = await axios.post(`${API_BASE}/api/clients`, {
      nom: 'Client Test',
      email: 'client@test.com',
      telephone: '0123456789',
      adresse: '123 Rue Test'
    }, { headers });
    clientId = createClient.data.data.id;
    console.log('✅ CREATE Client - Status:', createClient.status);
    
    // READ
    const readClient = await axios.get(`${API_BASE}/api/clients/${clientId}`, { headers });
    console.log('✅ READ Client - Status:', readClient.status);
    
    // UPDATE
    const updateClient = await axios.put(`${API_BASE}/api/clients/${clientId}`, {
      nom: 'Client Test Modifié',
      email: 'client@test.com',
      telephone: '0123456789',
      adresse: '123 Rue Test Modifiée'
    }, { headers });
    console.log('✅ UPDATE Client - Status:', updateClient.status);
    
    // DELETE
    const deleteClient = await axios.delete(`${API_BASE}/api/clients/${clientId}`, { headers });
    console.log('✅ DELETE Client - Status:', deleteClient.status);
    
  } catch (error) {
    console.log('❌ Erreur CRUD Clients:', error.response?.status, error.response?.data?.message);
  }
  
  // Test CRUD Spécialités
  console.log('\n🔧 Test CRUD Spécialités:');
  let specialiteId = null;
  
  try {
    // CREATE
    const createSpecialite = await axios.post(`${API_BASE}/api/specialites`, {
      nom: 'Spécialité Test',
      description: 'Description de test'
    }, { headers });
    specialiteId = createSpecialite.data.data.id;
    console.log('✅ CREATE Spécialité - Status:', createSpecialite.status);
    
    // READ
    const readSpecialite = await axios.get(`${API_BASE}/api/specialites/${specialiteId}`, { headers });
    console.log('✅ READ Spécialité - Status:', readSpecialite.status);
    
    // UPDATE
    const updateSpecialite = await axios.put(`${API_BASE}/api/specialites/${specialiteId}`, {
      nom: 'Spécialité Test Modifiée',
      description: 'Description modifiée'
    }, { headers });
    console.log('✅ UPDATE Spécialité - Status:', updateSpecialite.status);
    
    // DELETE
    const deleteSpecialite = await axios.delete(`${API_BASE}/api/specialites/${specialiteId}`, { headers });
    console.log('✅ DELETE Spécialité - Status:', deleteSpecialite.status);
    
  } catch (error) {
    console.log('❌ Erreur CRUD Spécialités:', error.response?.status, error.response?.data?.message);
  }
  
  // Test CRUD Types de Paiement
  console.log('\n💳 Test CRUD Types de Paiement:');
  let typePaiementId = null;
  
  try {
    // CREATE
    const createTypePaiement = await axios.post(`${API_BASE}/api/types-paiement`, {
      libelle: 'Type Test',
      description: 'Description test',
      delaiPaiement: 30,
      tauxRemise: 0,
      actif: true
    }, { headers });
    typePaiementId = createTypePaiement.data.data.id;
    console.log('✅ CREATE Type Paiement - Status:', createTypePaiement.status);
    
    // READ
    const readTypePaiement = await axios.get(`${API_BASE}/api/types-paiement/${typePaiementId}`, { headers });
    console.log('✅ READ Type Paiement - Status:', readTypePaiement.status);
    
    // UPDATE
    const updateTypePaiement = await axios.put(`${API_BASE}/api/types-paiement/${typePaiementId}`, {
      libelle: 'Type Test Modifié',
      description: 'Description modifiée',
      delaiPaiement: 45,
      tauxRemise: 5,
      actif: true
    }, { headers });
    console.log('✅ UPDATE Type Paiement - Status:', updateTypePaiement.status);
    
    // DELETE
    const deleteTypePaiement = await axios.delete(`${API_BASE}/api/types-paiement/${typePaiementId}`, { headers });
    console.log('✅ DELETE Type Paiement - Status:', deleteTypePaiement.status);
    
  } catch (error) {
    console.log('❌ Erreur CRUD Types Paiement:', error.response?.status, error.response?.data?.message);
  }
}

async function testDashboard() {
  console.log('\n📊 Test Dashboard:');
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    const dashboardResponse = await axios.get(`${API_BASE}/api/dashboard`, { headers });
    console.log('✅ Dashboard accessible - Status:', dashboardResponse.status);
    console.log('📊 Données dashboard:', Object.keys(dashboardResponse.data.data || {}));
  } catch (error) {
    console.log('❌ Erreur Dashboard:', error.response?.status, error.response?.data?.message);
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests fonctionnels complets...\n');
  
  const isAuthenticated = await authenticate();
  
  if (isAuthenticated) {
    await testCRUDOperations();
    await testDashboard();
    console.log('\n🎉 Tests fonctionnels terminés !');
  } else {
    console.log('\n❌ Impossible de continuer sans authentification');
  }
}

runAllTests().catch(console.error);

