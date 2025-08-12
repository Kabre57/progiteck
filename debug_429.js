const axios = require('axios');

const API_BASE = 'https://3000-ixm48sljnwnt6qlg8ufwf-d3e1c6a3.manusvm.computer';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n🔍 Test ${method} ${endpoint}`);
    
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0'
      },
      timeout: 10000
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Headers:`, response.headers);
    
    if (response.data) {
      console.log(`📄 Data:`, JSON.stringify(response.data, null, 2));
    }
    
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || 'Network Error'}`);
    console.log(`📝 Message: ${error.message}`);
    
    if (error.response?.headers) {
      console.log(`📊 Error Headers:`, error.response.headers);
    }
    
    if (error.response?.data) {
      console.log(`📄 Error Data:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return { 
      success: false, 
      status: error.response?.status, 
      message: error.message,
      headers: error.response?.headers 
    };
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests d\'endpoints...\n');
  
  const endpoints = [
    '/health',
    '/api/info',
    '/api/auth/profile',
    '/api/users',
    '/api/clients',
    '/api/dashboard',
    '/api/specialites',
    '/api/types-paiement'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, ...result });
    
    // Attendre un peu entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.endpoint} - Status: ${result.status || 'Error'}`);
  });
  
  const errors429 = results.filter(r => r.status === 429);
  if (errors429.length > 0) {
    console.log(`\n⚠️  ${errors429.length} endpoints retournent des erreurs 429`);
    console.log('Endpoints affectés:', errors429.map(r => r.endpoint));
  } else {
    console.log('\n✅ Aucune erreur 429 détectée');
  }
}

runTests().catch(console.error);

