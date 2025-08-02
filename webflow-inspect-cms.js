#!/usr/bin/env node

/**
 * WEBFLOW CMS INSPECTOR
 * 
 * Let's see what's actually in your CMS structure
 */

require('dotenv').config();
const axios = require('axios');

// ===== CONFIGURATION =====
const SITE_ID = '688b84e1d55545ae80e8ab02'; // NEW SITE ID (hardcoded to avoid .env confusion)
const API_TOKEN = process.env.WEBFLOW_API_NEW; // NEW SITE API token from .env
const BASE_URL = 'https://api.webflow.com/v2';

console.log('🔍 [CMS INSPECTOR] Let\'s see what\'s actually in your CMS...');

// ===== API CLIENT SETUP =====
const webflowAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

async function inspectCMS() {
  try {
    // Get collections
    console.log('📚 [INSPECTOR] Fetching collections...');
    const collectionsResponse = await webflowAPI.get(`/sites/${SITE_ID}/collections`);
    const collections = collectionsResponse.data.collections || [];
    
    console.log(`\n✅ [INSPECTOR] Found ${collections.length} collections:`);
    
    for (const collection of collections) {
      console.log(`\n📁 [COLLECTION] ${collection.displayName} (${collection.id})`);
      
      // Get the collection details including fields
      try {
        const collectionDetail = await webflowAPI.get(`/collections/${collection.id}`);
        const fields = collectionDetail.data.fields || [];
        
        console.log(`   🏗️ [FIELDS] ${fields.length} fields:`);
        fields.forEach((field, index) => {
          console.log(`      ${index + 1}. "${field.slug}" (${field.type}) - "${field.displayName}"`);
        });
        
        // Get some sample items to see the data
        const itemsResponse = await webflowAPI.get(`/collections/${collection.id}/items?limit=3`);
        const items = itemsResponse.data.items || [];
        
        if (items.length > 0) {
          console.log(`   📦 [SAMPLE DATA] First ${Math.min(3, items.length)} items:`);
          items.forEach((item, itemIndex) => {
            const itemName = item.fieldData?.name || item.fieldData?.title || `Item ${item.id}`;
            console.log(`      📝 Item ${itemIndex + 1}: "${itemName}"`);
            
            // Show all field data
            Object.entries(item.fieldData || {}).forEach(([key, value]) => {
              const fieldInfo = fields.find(f => f.slug === key);
              const fieldType = fieldInfo ? `(${fieldInfo.type})` : '';
              
              if (typeof value === 'string' && value.length > 100) {
                console.log(`         • ${key} ${fieldType}: "${value.substring(0, 100)}..."`);
              } else {
                console.log(`         • ${key} ${fieldType}: "${value}"`);
              }
            });
          });
        } else {
          console.log(`   📦 [SAMPLE DATA] No items found in this collection`);
        }
        
      } catch (error) {
        console.log(`   ❌ [ERROR] Could not get details for ${collection.displayName}: ${error.message}`);
      }
      
      // Add delay between collections
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } catch (error) {
    console.error('💥 [INSPECTOR] Error:', error.response?.data || error.message);
  }
}

inspectCMS(); 