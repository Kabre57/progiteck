const axios = require('axios');

const FRONTEND_URL = 'https://5173-ixm48sljnwnt6qlg8ufwf-d3e1c6a3.manusvm.computer';
const API_BASE = 'https://3000-ixm48sljnwnt6qlg8ufwf-d3e1c6a3.manusvm.computer';

async function testFrontendAPI() {
  console.log('🔍 Test de la configuration API du frontend...\n');
  
  try {
    // Test 1: Vérifier si le frontend est accessible
    console.log('1. Test d\'accès au frontend...');
    const frontendResponse = await axios.get(FRONTEND_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Test-Script/1.0'
      }
    });
    console.log(`✅ Frontend accessible - Status: ${frontendResponse.status}`);
    
    // Test 2: Vérifier la configuration CORS
    console.log('\n2. Test de la configuration CORS...');
    const corsResponse = await axios.options(`${API_BASE}/api/info`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log(`✅ CORS configuré - Status: ${corsResponse.status}`);
    console.log(`📊 CORS Headers:`, corsResponse.headers['access-control-allow-origin']);
    
    // Test 3: Simuler un appel API depuis le frontend
    console.log('\n3. Test d\'appel API simulé...');
    const apiResponse = await axios.get(`${API_BASE}/api/info`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Referer': FRONTEND_URL,
        'User-Agent': 'Mozilla/5.0 (Frontend-Test)'
      }
    });
    console.log(`✅ API accessible depuis frontend - Status: ${apiResponse.status}`);
    
    // Test 4: Test d'authentification
    console.log('\n4. Test d\'endpoint d\'authentification...');
    try {
      const authResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'test@example.com',
        motDePasse: 'testpassword'
      }, {
        headers: {
          'Origin': FRONTEND_URL,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Endpoint auth accessible - Status: ${authResponse.status}`);
    } catch (authError) {
      if (authError.response?.status === 400 || authError.response?.status === 401) {
        console.log(`✅ Endpoint auth fonctionne - Status: ${authError.response.status} (erreur attendue)`);
      } else {
        console.log(`❌ Erreur auth inattendue: ${authError.response?.status || 'Network Error'}`);
      }
    }
    
    console.log('\n🎉 Tous les tests de configuration API réussis !');
    
  } catch (error) {
    console.log(`❌ Erreur lors des tests: ${error.message}`);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📄 Data:`, error.response.data);
    }
  }
}

testFrontendAPI();

