require('dotenv').config();
const axios = require('axios');

// Configuration - OLD SITE to copy FROM, NEW SITE to restore TO
const OLD_SITE_ID = '6795e1366df80683586ce64e';
const NEW_SITE_ID = '688b84e1d55545ae80e8ab02';
const OLD_API_TOKEN = process.env.WEBFLOW_API_OLD;
const NEW_API_TOKEN = process.env.WEBFLOW_API_NEW;

// API Base URL
const API_BASE = 'https://api.webflow.com/v2';

console.log('🚨 EMERGENCY DATA RESTORATION FROM OLD SITE...');
console.log(`📂 OLD Site ID: ${OLD_SITE_ID}`);
console.log(`📥 NEW Site ID: ${NEW_SITE_ID}`);
console.log(`🔑 OLD API Token: ${OLD_API_TOKEN ? OLD_API_TOKEN.substring(0, 10) + '...' : 'NOT FOUND'}`);
console.log(`🔑 NEW API Token: ${NEW_API_TOKEN ? NEW_API_TOKEN.substring(0, 10) + '...' : 'NOT FOUND'}`);

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

// Get collections from old site
async function getOldCollections() {
  try {
    console.log('📁 Fetching collections from OLD site...');
    const response = await axios.get(`${API_BASE}/sites/${OLD_SITE_ID}/collections`, { headers: oldHeaders });
    console.log(`✅ Found ${response.data.collections.length} collections in OLD site`);
    return response.data.collections;
  } catch (error) {
    console.error('❌ Error fetching OLD collections:', error.response?.data || error.message);
    throw error;
  }
}

// Get collections from new site
async function getNewCollections() {
  try {
    console.log('📁 Fetching collections from NEW site...');
    const response = await axios.get(`${API_BASE}/sites/${NEW_SITE_ID}/collections`, { headers: newHeaders });
    console.log(`✅ Found ${response.data.collections.length} collections in NEW site`);
    return response.data.collections;
  } catch (error) {
    console.error('❌ Error fetching NEW collections:', error.response?.data || error.message);
    throw error;
  }
}

// Get collection items from old site
async function getOldCollectionItems(collectionId) {
  try {
    console.log(`📄 Fetching items from OLD collection ${collectionId}...`);
    const response = await axios.get(`${API_BASE}/collections/${collectionId}/items`, { headers: oldHeaders });
    console.log(`✅ Found ${response.data.items.length} items in OLD collection`);
    return response.data.items;
  } catch (error) {
    console.error(`❌ Error fetching OLD items:`, error.response?.data || error.message);
    return [];
  }
}

// Get collection items from new site
async function getNewCollectionItems(collectionId) {
  try {
    console.log(`📄 Fetching items from NEW collection ${collectionId}...`);
    const response = await axios.get(`${API_BASE}/collections/${collectionId}/items`, { headers: newHeaders });
    console.log(`✅ Found ${response.data.items.length} items in NEW collection`);
    return response.data.items;
  } catch (error) {
    console.error(`❌ Error fetching NEW items:`, error.response?.data || error.message);
    return [];
  }
}

// Update item in new site
async function updateNewCollectionItem(collectionId, itemId, fieldData) {
  try {
    const response = await axios.patch(
      `${API_BASE}/collections/${collectionId}/items/${itemId}`,
      { fieldData },
      { headers: newHeaders }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating NEW item ${itemId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Main restoration function
async function restoreData() {
  try {
    console.log('🔄 Starting data restoration...');
    
    const oldCollections = await getOldCollections();
    const newCollections = await getNewCollections();
    
    // Find Projects collection in both sites (different slugs!)
    const oldProjectsCollection = oldCollections.find(c => c.slug === 'project'); // OLD = "project" (singular)
    const newProjectsCollection = newCollections.find(c => c.slug === 'projects'); // NEW = "projects" (plural)
    
    if (!oldProjectsCollection) {
      console.error('❌ Could not find Projects collection in OLD site');
      return;
    }
    
    if (!newProjectsCollection) {
      console.error('❌ Could not find Projects collection in NEW site');
      return;
    }
    
    console.log(`✅ Found Projects collections in both sites`);
    console.log(`📂 OLD: ${oldProjectsCollection.displayName} (${oldProjectsCollection.id})`);
    console.log(`📥 NEW: ${newProjectsCollection.displayName} (${newProjectsCollection.id})`);
    
    // Get items from both sites
    const oldItems = await getOldCollectionItems(oldProjectsCollection.id);
    const newItems = await getNewCollectionItems(newProjectsCollection.id);
    
    console.log(`\n🔍 Matching items by name/slug to restore data...`);
    
    let restoredCount = 0;
    let matchedCount = 0;
    
    for (const newItem of newItems) {
      const newName = newItem.fieldData.name || newItem.fieldData.slug;
      console.log(`\n🔍 Looking for match for: "${newName}"`);
      
      // Try to find matching item in old site by name or slug
      const matchingOldItem = oldItems.find(oldItem => {
        const oldName = oldItem.fieldData.name || oldItem.fieldData.slug;
        return oldName === newName || 
               (oldItem.fieldData.name && oldItem.fieldData.name === newItem.fieldData.name) ||
               (oldItem.fieldData.slug && oldItem.fieldData.slug === newItem.fieldData.slug);
      });
      
      if (matchingOldItem) {
        matchedCount++;
        console.log(`✅ Found match in OLD site: "${matchingOldItem.fieldData.name || matchingOldItem.fieldData.slug}"`);
        
        // Restore the REAL DATA (not the random garbage we put in)
        const restorationData = {};
        
        // Restore text fields that we corrupted
        if (matchingOldItem.fieldData.location) {
          restorationData.location = matchingOldItem.fieldData.location;
          console.log(`   📍 Location: "${matchingOldItem.fieldData.location}"`);
        }
        
        if (matchingOldItem.fieldData.size) {
          restorationData.size = matchingOldItem.fieldData.size;
          console.log(`   📏 Size: "${matchingOldItem.fieldData.size}"`);
        }
        
        if (matchingOldItem.fieldData.type) {
          restorationData.type = matchingOldItem.fieldData.type;
          console.log(`   🏷️  Type: "${matchingOldItem.fieldData.type}"`);
        }
        
        // Also restore name if it got corrupted
        if (matchingOldItem.fieldData.name && matchingOldItem.fieldData.name !== newItem.fieldData.name) {
          restorationData.name = matchingOldItem.fieldData.name;
          console.log(`   📝 Name: "${matchingOldItem.fieldData.name}"`);
        }
        
        if (Object.keys(restorationData).length > 0) {
          try {
            await updateNewCollectionItem(newProjectsCollection.id, newItem.id, restorationData);
            console.log(`   ✅ RESTORED data for "${newName}"`);
            restoredCount++;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.log(`   ❌ Failed to restore "${newName}": ${error.message}`);
          }
        } else {
          console.log(`   ℹ️  No data to restore for "${newName}"`);
        }
      } else {
        console.log(`   ❌ No match found in OLD site for "${newName}"`);
      }
    }
    
    console.log(`\n🎉 RESTORATION COMPLETE!`);
    console.log(`📊 Stats:`);
    console.log(`   - Items in NEW site: ${newItems.length}`);
    console.log(`   - Items in OLD site: ${oldItems.length}`);
    console.log(`   - Matches found: ${matchedCount}`);
    console.log(`   - Items restored: ${restoredCount}`);
    
  } catch (error) {
    console.error('💥 Error in restoration:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'run') {
  restoreData();
} else {
  console.log(`
🚨 EMERGENCY DATA RESTORATION TOOL

This will restore the REAL data from your OLD site to fix the damage caused
by putting random garbage in your text fields.

Usage:
  node restore-from-old-site.js run  - Restore data from OLD site to NEW site

OLD Site: ${OLD_SITE_ID}
NEW Site: ${NEW_SITE_ID}
`);
} 