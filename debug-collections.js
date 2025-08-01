require('dotenv').config();
const axios = require('axios');

// Configuration
const OLD_SITE_ID = '6795e1366df80683586ce64e';
const NEW_SITE_ID = '688b84e1d55545ae80e8ab02';
const OLD_API_TOKEN = process.env.WEBFLOW_API_OLD;
const NEW_API_TOKEN = process.env.WEBFLOW_API_NEW;

// API Base URL
const API_BASE = 'https://api.webflow.com/v2';

// Headers for API requests
const oldHeaders = {
  'Authorization': `Bearer ${OLD_API_TOKEN}`,
  'accept': 'application/json',
  'content-type': 'application/json'
};

const newHeaders = {
  'Authorization': `Bearer ${NEW_API_TOKEN}`,
  'accept': 'application/json',
  'content-type': 'application/json'
};

async function debugCollections() {
  try {
    console.log('🔍 DEBUGGING COLLECTIONS IN BOTH SITES...\n');
    
    // OLD SITE
    console.log('📂 OLD SITE COLLECTIONS:');
    const oldResponse = await axios.get(`${API_BASE}/sites/${OLD_SITE_ID}/collections`, { headers: oldHeaders });
    const oldCollections = oldResponse.data.collections;
    
    if (oldCollections.length === 0) {
      console.log('   ❌ NO COLLECTIONS FOUND IN OLD SITE');
    } else {
      oldCollections.forEach((collection, index) => {
        console.log(`   ${index + 1}. "${collection.displayName}" (slug: "${collection.slug}") - ID: ${collection.id}`);
      });
    }
    
    console.log('\n📥 NEW SITE COLLECTIONS:');
    const newResponse = await axios.get(`${API_BASE}/sites/${NEW_SITE_ID}/collections`, { headers: newHeaders });
    const newCollections = newResponse.data.collections;
    
    if (newCollections.length === 0) {
      console.log('   ❌ NO COLLECTIONS FOUND IN NEW SITE');
    } else {
      newCollections.forEach((collection, index) => {
        console.log(`   ${index + 1}. "${collection.displayName}" (slug: "${collection.slug}") - ID: ${collection.id}`);
      });
    }
    
    // Try to get some sample items from OLD site if any collections exist
    if (oldCollections.length > 0) {
      console.log('\n🔍 SAMPLE DATA from OLD SITE:');
      const firstCollection = oldCollections[0];
      try {
        const itemsResponse = await axios.get(`${API_BASE}/collections/${firstCollection.id}/items`, { headers: oldHeaders });
        const items = itemsResponse.data.items;
        console.log(`   Collection: ${firstCollection.displayName} has ${items.length} items`);
        
        if (items.length > 0) {
          console.log('   Sample item data:');
          const sampleItem = items[0];
          console.log('   Field Data:');
          Object.keys(sampleItem.fieldData).forEach(key => {
            console.log(`      ${key}: "${sampleItem.fieldData[key]}"`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Could not fetch items: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugCollections(); 