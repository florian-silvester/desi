require('dotenv').config();
const axios = require('axios');

// Configuration from .env - NEW SITE ONLY
const SITE_ID = '688b84e1d55545ae80e8ab02'; // NEW SITE ONLY
const API_TOKEN = process.env.WEBFLOW_API_NEW;

// Alignment options to randomly choose from
const ALIGNMENT_OPTIONS = [
  'left',
  'center', 
  'right',
  'justify',
  'start',
  'end',
  'flex-start',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly'
];

// Size options to randomly choose from
const SIZE_OPTIONS = [
  'xs',
  'small',
  'sm',
  'medium',
  'md',
  'large',
  'lg',
  'xl',
  'xxl',
  '2xl',
  '3xl',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '36px',
  '48px',
  '64px',
  'tiny',
  'huge',
  'massive'
];

// API Base URL
const API_BASE = 'https://api.webflow.com/v2';

// Headers for API requests
const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'accept': 'application/json',
  'content-type': 'application/json'
};

console.log('🚀 Starting Webflow CMS Dropdown Randomizer (ALIGNMENT & STYLE ONLY)...');
console.log(`📊 Site ID: ${SITE_ID} (NEW SITE ONLY)`);
console.log(`🔑 API Token: ${API_TOKEN ? API_TOKEN.substring(0, 10) + '...' : 'NOT FOUND'}`);
console.log('🎯 ONLY randomizing dropdown Option fields - NO MORE TEXT FIELD GARBAGE!');

// Function to get all collections for the site
async function getCollections() {
  try {
    console.log('📁 Fetching collections...');
    const response = await axios.get(`${API_BASE}/sites/${SITE_ID}/collections`, { headers });
    console.log(`✅ Found ${response.data.collections.length} collections`);
    
    return response.data.collections;
  } catch (error) {
    console.error('❌ Error fetching collections:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get collection fields/schema
async function getCollectionFields(collectionId) {
  try {
    console.log(`📋 Fetching fields for collection ${collectionId}...`);
    const response = await axios.get(`${API_BASE}/collections/${collectionId}`, { headers });
    console.log(`✅ Collection details retrieved`);
    
    // Collection fetched successfully
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching collection fields for ${collectionId}:`, error.response?.data || error.message);
    return null;
  }
}

// Function to get collection items
async function getCollectionItems(collectionId) {
  try {
    console.log(`📄 Fetching items for collection ${collectionId}...`);
    const response = await axios.get(`${API_BASE}/collections/${collectionId}/items`, { headers });
    console.log(`✅ Found ${response.data.items.length} items in collection`);
    return response.data.items;
  } catch (error) {
    console.error(`❌ Error fetching items for collection ${collectionId}:`, error.response?.data || error.message);
    return [];
  }
}

// Function to update a collection item
async function updateCollectionItem(collectionId, itemId, fieldData) {
  try {
    const response = await axios.patch(
      `${API_BASE}/collections/${collectionId}/items/${itemId}`,
      { fieldData },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Error updating item ${itemId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Function to find ONLY Option fields (dropdowns) related to alignment and style
function findAlignmentAndSizeFields(collection) {
  const targetFields = [];
  
  if (collection.fields) {
    collection.fields.forEach(field => {
      // ONLY target Option fields (dropdowns) - NO MORE TEXT FIELD GARBAGE!
      if (field.type === 'Option') {
        const fieldName = field.slug.toLowerCase();
        const displayName = field.displayName.toLowerCase();
        
        // Check if it's alignment or style related
        const isAlignmentField = fieldName.includes('align') || displayName.includes('align');
        const isStyleField = fieldName.includes('style') || displayName.includes('style');
        
        if (isAlignmentField || isStyleField) {
          const fieldType = isAlignmentField ? 'alignment' : 'style';
          
          targetFields.push({
            slug: field.slug,
            displayName: field.displayName,
            type: field.type,
            fieldType: fieldType,
            options: field.validations?.options || []
          });
        }
      }
    });
  }
  
  return targetFields;
}

// Main function to randomize ONLY dropdown fields
async function randomizeDropdownFields() {
  try {
    console.log('🎯 Starting dropdown field randomization (ONLY Option fields)...');
    
    const collections = await getCollections();
    
    for (const collection of collections) {
      console.log(`\n🔍 Processing collection: ${collection.displayName} (${collection.id})`);
      
      // Get the full collection with fields
      const collectionWithFields = await getCollectionFields(collection.id);
      if (!collectionWithFields) {
        console.log(`❌ Could not fetch fields for ${collection.displayName}`);
        continue;
      }
      
      // Find alignment and size-related fields
      const targetFields = findAlignmentAndSizeFields(collectionWithFields);
      
      if (targetFields.length === 0) {
        console.log(`⏭️  No alignment or style dropdown fields found in ${collection.displayName}`);
        continue;
      }
      
      console.log(`🎯 Found ${targetFields.length} dropdown fields to randomize:`);
      targetFields.forEach(field => {
        console.log(`   - ${field.displayName} (${field.slug}) - Type: ${field.type} - Field Type: ${field.fieldType}`);
      });
      
      // Get items in this collection
      const items = await getCollectionItems(collection.id);
      
      if (items.length === 0) {
        console.log(`⏭️  No items found in ${collection.displayName}`);
        continue;
      }
      
      // Update each item with random alignment and size values
      for (const item of items) {
        console.log(`\n🎯 Randomizing dropdown fields for item: ${item.fieldData.name || item.id}`);
        
        const updates = {};
        let hasUpdates = false;
        
        targetFields.forEach(field => {
          // Since we only target Option fields now, just pick from valid options
          const validOptions = field.options.map(opt => opt.name);
          const randomValue = validOptions[Math.floor(Math.random() * validOptions.length)];
          
          const fieldTypeIcon = field.fieldType === 'alignment' ? '🎯' : '🎨';
          console.log(`   ${fieldTypeIcon} ${field.displayName}: ${randomValue} (from: ${validOptions.join(', ')})`);
          
          updates[field.slug] = randomValue;
          hasUpdates = true;
        });
        
        if (hasUpdates) {
          try {
            await updateCollectionItem(collection.id, item.id, updates);
            console.log(`✅ Updated item successfully`);
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.log(`❌ Failed to update item: ${error.message}`);
            continue;
          }
        }
      }
    }
    
    console.log('\n🎉 Dropdown field randomization complete!');
    
  } catch (error) {
    console.error('💥 Error in main function:', error.message);
  }
}

// Function to preview what would be changed (dry run)
async function previewChanges() {
  try {
    console.log('👀 Preview mode - showing what would be changed...');
    
    const collections = await getCollections();
    
    for (const collection of collections) {
      console.log(`\n📁 Collection: ${collection.displayName}`);
      
      // Get the full collection with fields
      const collectionWithFields = await getCollectionFields(collection.id);
      if (!collectionWithFields) {
        console.log(`❌ Could not fetch fields for ${collection.displayName}`);
        continue;
      }
      
      // Show ALL fields first for debugging
      console.log(`🔍 ALL FIELDS IN COLLECTION:`);
      if (collectionWithFields.fields) {
        collectionWithFields.fields.forEach(field => {
          console.log(`   📝 ${field.displayName} (${field.slug}) - Type: ${field.type}`);
        });
      }
      
      const targetFields = findAlignmentAndSizeFields(collectionWithFields);
      
      if (targetFields.length > 0) {
        console.log(`\n🎯 Fields that would be randomized:`);
        targetFields.forEach(field => {
          const typeIcon = field.fieldType === 'alignment' ? '🎯' : field.fieldType === 'size' ? '📏' : '🎲';
          console.log(`   ${typeIcon} ${field.displayName} (${field.slug}) - ${field.fieldType}`);
        });
        
        const items = await getCollectionItems(collection.id);
        console.log(`📄 Would update ${items.length} items in this collection`);
      } else {
        console.log(`\n⏭️  No alignment or style dropdown fields found`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error in preview:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'preview') {
  previewChanges();
} else if (command === 'run') {
  randomizeDropdownFields();
} else {
  console.log(`
🎯 Webflow CMS Dropdown Randomizer (NEW SITE ONLY)

ONLY randomizes dropdown Option fields (Item Style, Item Align, etc.)
NO MORE GARBAGE in text fields!

Usage:
  node webflow-alignment-randomizer.js preview  - Show dropdown fields that will be randomized
  node webflow-alignment-randomizer.js run      - Randomize ONLY dropdown fields

Site: ${SITE_ID} (NEW SITE ONLY)
`);
} 