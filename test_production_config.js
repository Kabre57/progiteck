const axios = require('axios');

const API_BASE = 'https://3000-ixm48sljnwnt6qlg8ufwf-d3e1c6a3.manusvm.computer';

async function testProductionConfiguration() {
  console.log('🔧 Test de la configuration de production...\n');
  
  let authToken = null;
  
  // Test 1: Authentification avec l'utilisateur admin
  console.log('1. Test d\'authentification avec l\'utilisateur admin...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@progitek.com',
      motDePasse: 'Admin123!'
    });
    
    authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Authentification admin réussie');
    console.log(`📧 Utilisateur: ${loginResponse.data.data.user.email}`);
    console.log(`👤 Rôle: ${loginResponse.data.data.user.role.libelle}`);
  } catch (error) {
    console.log('❌ Échec authentification admin:', error.response?.status, error.response?.data?.message);
    return;
  }
  
  // Test 2: Vérification du rate limiting
  console.log('\n2. Test du rate limiting...');
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
  
  let rateLimitHit = false;
  for (let i = 0; i < 15; i++) {
    try {
      await axios.get(`${API_BASE}/api/dashboard`, { headers });
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitHit = true;
        console.log(`✅ Rate limiting activé - Limite atteinte après ${i + 1} requêtes`);
        break;
      }
    }
  }
  
  if (!rateLimitHit) {
    console.log('⚠️  Rate limiting non déclenché (limite élevée ou désactivé)');
  }
  
  // Attendre un peu pour que le rate limit se réinitialise
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Test des endpoints CRUD avec l'admin
  console.log('\n3. Test des opérations CRUD avec admin...');
  
  try {
    // Test création client
    const createClient = await axios.post(`${API_BASE}/api/clients`, {
      nom: 'Client Test Production',
      email: 'test.prod@client.com',
      telephone: '0123456789',
      adresse: '123 Rue de la Production'
    }, { headers });
    
    const clientId = createClient.data.data.id;
    console.log('✅ CREATE Client - Status:', createClient.status);
    
    // Test lecture client
    const readClient = await axios.get(`${API_BASE}/api/clients/${clientId}`, { headers });
    console.log('✅ READ Client - Status:', readClient.status);
    
    // Test mise à jour client
    const updateClient = await axios.put(`${API_BASE}/api/clients/${clientId}`, {
      nom: 'Client Test Production Modifié',
      email: 'test.prod@client.com',
      telephone: '0123456789',
      adresse: '123 Rue de la Production Modifiée'
    }, { headers });
    console.log('✅ UPDATE Client - Status:', updateClient.status);
    
    // Test suppression client
    const deleteClient = await axios.delete(`${API_BASE}/api/clients/${clientId}`, { headers });
    console.log('✅ DELETE Client - Status:', deleteClient.status);
    
  } catch (error) {
    console.log('❌ Erreur CRUD:', error.response?.status, error.response?.data?.message);
  }
  
  // Test 4: Test des spécialités créées par le seed
  console.log('\n4. Test des données de base (spécialités)...');
  try {
    const specialites = await axios.get(`${API_BASE}/api/specialites`, { headers });
    console.log('✅ Spécialités récupérées - Count:', specialites.data.data.length);
    console.log('📋 Spécialités disponibles:', specialites.data.data.map(s => s.libelle).join(', '));
  } catch (error) {
    console.log('❌ Erreur spécialités:', error.response?.status);
  }
  
  // Test 5: Test des types de paiement
  console.log('\n5. Test des types de paiement...');
  try {
    const typesPaiement = await axios.get(`${API_BASE}/api/types-paiement`, { headers });
    console.log('✅ Types de paiement récupérés - Count:', typesPaiement.data.data.length);
    console.log('💳 Types disponibles:', typesPaiement.data.data.map(t => t.libelle).join(', '));
  } catch (error) {
    console.log('❌ Erreur types paiement:', error.response?.status);
  }
  
  // Test 6: Test du dashboard
  console.log('\n6. Test du dashboard...');
  try {
    const dashboard = await axios.get(`${API_BASE}/api/dashboard`, { headers });
    console.log('✅ Dashboard accessible - Status:', dashboard.status);
    console.log('📊 Données dashboard disponibles:', Object.keys(dashboard.data.data || {}));
  } catch (error) {
    console.log('❌ Erreur dashboard:', error.response?.status);
  }
  
  // Test 7: Test des métriques de santé
  console.log('\n7. Test des métriques de santé...');
  try {
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check - Status:', health.data.status);
    console.log('⏱️  Uptime:', health.data.uptime, 'secondes');
    console.log('💾 Mémoire:', health.data.memory.used, 'MB /', health.data.memory.total, 'MB');
    console.log('🔄 Requêtes totales:', health.data.requests.total);
    console.log('📈 Temps de réponse moyen:', health.data.requests.averageResponseTime, 'ms');
    console.log('❌ Taux d\'erreur:', health.data.requests.errorRate, '%');
  } catch (error) {
    console.log('❌ Erreur health check:', error.response?.status);
  }
  
  // Test 8: Test des métriques détaillées
  console.log('\n8. Test des métriques détaillées...');
  try {
    const metrics = await axios.get(`${API_BASE}/metrics`);
    console.log('✅ Métriques accessibles - Status:', metrics.status);
  } catch (error) {
    console.log('❌ Erreur métriques:', error.response?.status);
  }
  
  console.log('\n🎉 Tests de configuration de production terminés !');
}

async function testSecurityHeaders() {
  console.log('\n🔒 Test des headers de sécurité...');
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    const headers = response.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'referrer-policy'
    ];
    
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`✅ ${header}: ${headers[header]}`);
      } else {
        console.log(`❌ ${header}: manquant`);
      }
    });
    
  } catch (error) {
    console.log('❌ Erreur test headers:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests de validation de production...\n');
  
  await testProductionConfiguration();
  await testSecurityHeaders();
  
  console.log('\n✅ Tous les tests de production terminés !');
}

runAllTests().catch(console.error);

