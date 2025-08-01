require('dotenv').config();
const axios = require('axios');

// Configuration
const OLD_SITE_ID = '6795e1366df80683586ce64e';
const NEW_SITE_ID = '688b84e1d55545ae80e8ab02';
const OLD_API_TOKEN = process.env.WEBFLOW_API_OLD;
const NEW_API_TOKEN = process.env.WEBFLOW_API_NEW;

// API Base URL
const API_BASE = 'https://api.webflow.com/v2';

console.log('💥 NUKE AND REBUILD CMS DATA FROM OLD SITE...');
console.log(`📂 OLD Site ID: ${OLD_SITE_ID}`);
console.log(`📥 NEW Site ID: ${NEW_SITE_ID}`);

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

// Get all items from NEW site (to delete)
async function getNewCollectionItems(collectionId) {
  try {
    console.log(`📄 Fetching ALL items from NEW collection...`);
    const response = await axios.get(`${API_BASE}/collections/${collectionId}/items`, { headers: newHeaders });
    console.log(`✅ Found ${response.data.items.length} items to DELETE`);
    return response.data.items;
  } catch (error) {
    console.error(`❌ Error fetching NEW items:`, error.response?.data || error.message);
    return [];
  }
}

// Delete item from NEW site
async function deleteNewCollectionItem(collectionId, itemId, itemName) {
  try {
    await axios.delete(`${API_BASE}/collections/${collectionId}/items/${itemId}`, { headers: newHeaders });
    console.log(`   🗑️  DELETED: "${itemName}"`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to delete "${itemName}": ${error.response?.data || error.message}`);
    return false;
  }
}

// Get all items from OLD site (to import)
async function getOldCollectionItems(collectionId) {
  try {
    console.log(`📄 Fetching ALL items from OLD collection...`);
    const response = await axios.get(`${API_BASE}/collections/${collectionId}/items`, { headers: oldHeaders });
    console.log(`✅ Found ${response.data.items.length} items to IMPORT`);
    return response.data.items;
  } catch (error) {
    console.error(`❌ Error fetching OLD items:`, error.response?.data || error.message);
    return [];
  }
}

// Create new item in NEW site
async function createNewCollectionItem(collectionId, fieldData, oldItemName) {
  try {
    const response = await axios.post(
      `${API_BASE}/collections/${collectionId}/items`,
      { fieldData },
      { headers: newHeaders }
    );
    console.log(`   ✅ CREATED: "${oldItemName}"`);
    return response.data;
  } catch (error) {
    console.error(`   ❌ Failed to create "${oldItemName}":`, JSON.stringify(error.response?.data, null, 2) || error.message);
    return null;
  }
}

// Main nuke and rebuild function
async function nukeAndRebuild() {
  try {
    console.log('\n🚀 Starting NUKE AND REBUILD process...\n');
    
    // Get collections from both sites
    console.log('📁 Getting collections...');
    const oldResponse = await axios.get(`${API_BASE}/sites/${OLD_SITE_ID}/collections`, { headers: oldHeaders });
    const newResponse = await axios.get(`${API_BASE}/sites/${NEW_SITE_ID}/collections`, { headers: newHeaders });
    
    const oldCollections = oldResponse.data.collections;
    const newCollections = newResponse.data.collections;
    
    // Find Projects collections (different slugs!)
    const oldProjectsCollection = oldCollections.find(c => c.slug === 'project'); // OLD = "project" (singular)
    const newProjectsCollection = newCollections.find(c => c.slug === 'projects'); // NEW = "projects" (plural)
    
    if (!oldProjectsCollection || !newProjectsCollection) {
      console.error('❌ Could not find Projects collections in both sites');
      return;
    }
    
    console.log(`✅ Found Projects collections:`);
    console.log(`📂 OLD: ${oldProjectsCollection.displayName} (${oldProjectsCollection.id})`);
    console.log(`📥 NEW: ${newProjectsCollection.displayName} (${newProjectsCollection.id})`);
    
    // STEP 1: NUKE - Delete all current items from NEW site
    console.log('\n💥 STEP 1: NUKING ALL CURRENT ITEMS...\n');
    const currentItems = await getNewCollectionItems(newProjectsCollection.id);
    
    let deletedCount = 0;
    for (const item of currentItems) {
      const itemName = item.fieldData.name || item.fieldData.slug || 'Unknown';
      const success = await deleteNewCollectionItem(newProjectsCollection.id, item.id, itemName);
      if (success) deletedCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n💥 NUKE COMPLETE: Deleted ${deletedCount}/${currentItems.length} items\n`);
    
    // STEP 2: REBUILD - Import all items from OLD site
    console.log('🔄 STEP 2: REBUILDING FROM OLD SITE...\n');
    const oldItems = await getOldCollectionItems(oldProjectsCollection.id);
    
    let createdCount = 0;
    for (const oldItem of oldItems) {
      const itemName = oldItem.fieldData.name || oldItem.fieldData.slug || 'Unknown';
      console.log(`🔄 Importing: "${itemName}"`);
      
      // Prepare field data for import (copy all fields from old item, BUT REMOVE SLUG)
      const fieldData = { ...oldItem.fieldData };
      
      // REMOVE SLUG - let Webflow auto-generate new unique slugs
      delete fieldData.slug;
      
      // REMOVE ITEM-STYLE - different option IDs between old/new sites
      delete fieldData['item-style'];
      
      console.log(`   📝 Importing fields: ${Object.keys(fieldData).join(', ')}`);
      
      // Create new item
      const success = await createNewCollectionItem(newProjectsCollection.id, fieldData, itemName);
      if (success) createdCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 REBUILD COMPLETE!`);
    console.log(`📊 Final Stats:`);
    console.log(`   - Items DELETED: ${deletedCount}`);
    console.log(`   - Items CREATED: ${createdCount}/${oldItems.length}`);
    console.log(`   - SUCCESS: ${createdCount === oldItems.length ? '✅ Perfect!' : '⚠️ Some items failed'}`);
    
  } catch (error) {
    console.error('💥 Error in nuke and rebuild:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'run') {
  console.log('⚠️  WARNING: This will DELETE ALL current items and replace with OLD site data!');
  console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  setTimeout(() => {
    nukeAndRebuild();
  }, 5000);
} else {
  console.log(`
💥 NUKE AND REBUILD CMS TOOL

This will:
1. DELETE ALL current items from NEW site Projects collection
2. IMPORT ALL items fresh from OLD site Projects collection

⚠️  WARNING: This is DESTRUCTIVE! All current data will be lost!

Usage:
  node nuke-and-rebuild-cms.js run  - Execute the nuke and rebuild

OLD Site: ${OLD_SITE_ID}
NEW Site: ${NEW_SITE_ID}
`);
} 