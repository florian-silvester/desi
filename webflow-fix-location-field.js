#!/usr/bin/env node

/**
 * WEBFLOW LOCATION FIELD CLEANUP
 * 
 * Specifically targets the "location" field in the "Projects" collection
 * to remove ", Germany" from all project locations.
 */

require('dotenv').config();
const axios = require('axios');

// ===== CONFIGURATION =====
const SITE_ID = '688b84e1d55545ae80e8ab02'; // NEW SITE ID
const PROJECTS_COLLECTION_ID = '688b86535785c8eea36d65c7'; // Projects collection ID from inspection
const API_TOKEN = process.env.WEBFLOW_API_NEW;
const BASE_URL = 'https://api.webflow.com/v2';

console.log('🎯 [LOCATION CLEANUP] Targeting location field in Projects collection...');
console.log(`📁 [TARGET] Collection: Projects (${PROJECTS_COLLECTION_ID})`);
console.log(`📍 [TARGET] Field: location`);
console.log(`🔧 [ACTION] Remove ", Germany" from all location values`);

// ===== API CLIENT SETUP =====
const webflowAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

/**
 * Get all project items
 */
async function getAllProjects() {
  console.log('\n📦 [PROJECTS] Fetching all project items...');
  
  try {
    const response = await webflowAPI.get(`/collections/${PROJECTS_COLLECTION_ID}/items`);
    const projects = response.data.items || [];
    
    console.log(`✅ [PROJECTS] Found ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error('❌ [PROJECTS] Error fetching projects:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update a project's location field
 */
async function updateProjectLocation(projectId, projectName, newLocation) {
  console.log(`🔄 [UPDATE] Updating "${projectName}"...`);
  
  try {
    const response = await webflowAPI.patch(`/collections/${PROJECTS_COLLECTION_ID}/items/${projectId}`, {
      fieldData: {
        location: newLocation
      }
    });
    
    console.log(`✅ [UPDATE] Successfully updated "${projectName}"`);
    return response.data;
  } catch (error) {
    console.error(`❌ [UPDATE] Error updating "${projectName}":`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Preview mode - show what would be changed
 */
async function previewChanges() {
  console.log('\n👀 [PREVIEW MODE] Showing what would be changed...');
  
  const projects = await getAllProjects();
  let changesFound = 0;
  
  console.log('\n📋 [PREVIEW] Scanning all projects:');
  
  for (const project of projects) {
    const projectName = project.fieldData?.name || `Project ${project.id}`;
    const currentLocation = project.fieldData?.location || '';
    
    if (currentLocation.includes(', Germany')) {
      const newLocation = currentLocation.replace(/, Germany/g, '');
      changesFound++;
      
      console.log(`\n🌍 [CHANGE ${changesFound}] Project: "${projectName}"`);
      console.log(`   📍 BEFORE: "${currentLocation}"`);
      console.log(`   ✨ AFTER:  "${newLocation}"`);
    } else {
      console.log(`   ✅ "${projectName}": No Germany found - "${currentLocation}"`);
    }
  }
  
  console.log(`\n📊 [PREVIEW SUMMARY]:`);
  console.log(`   • Total projects: ${projects.length}`);
  console.log(`   • Projects that would be updated: ${changesFound}`);
  console.log(`   • Projects already clean: ${projects.length - changesFound}`);
  
  if (changesFound > 0) {
    console.log('\n🚀 [NEXT STEP] To apply these changes, run with --apply flag:');
    console.log('   node webflow-fix-location-field.js --apply');
  } else {
    console.log('\n🎉 [RESULT] All project locations are already clean!');
  }
  
  return changesFound;
}

/**
 * Apply mode - actually make the changes
 */
async function applyChanges() {
  console.log('\n🔥 [APPLY MODE] Making actual changes to your CMS...');
  
  const projects = await getAllProjects();
  let updatedCount = 0;
  let errorCount = 0;
  
  console.log('\n🛠️ [PROCESSING] Updating projects:');
  
  for (const project of projects) {
    const projectName = project.fieldData?.name || `Project ${project.id}`;
    const currentLocation = project.fieldData?.location || '';
    
    if (currentLocation.includes(', Germany')) {
      const newLocation = currentLocation.replace(/, Germany/g, '');
      
      console.log(`\n🌍 [UPDATING] Project: "${projectName}"`);
      console.log(`   📍 FROM: "${currentLocation}"`);
      console.log(`   ✨ TO:   "${newLocation}"`);
      
      try {
        await updateProjectLocation(project.id, projectName, newLocation);
        updatedCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`   ❌ Failed to update "${projectName}"`);
        errorCount++;
      }
    } else {
      console.log(`   ✅ "${projectName}": Already clean`);
    }
  }
  
  console.log(`\n📊 [FINAL SUMMARY]:`);
  console.log(`   • Total projects: ${projects.length}`);
  console.log(`   • Successfully updated: ${updatedCount}`);
  console.log(`   • Errors: ${errorCount}`);
  console.log(`   • Already clean: ${projects.length - updatedCount - errorCount}`);
  
  if (updatedCount > 0) {
    console.log('\n🎉 [SUCCESS] Location cleanup completed!');
    console.log('💡 [TIP] Check your Webflow CMS to see the updated locations');
  }
}

/**
 * Main function
 */
async function main() {
  const shouldApply = process.argv.includes('--apply');
  
  if (shouldApply) {
    console.log('\n⚠️ [WARNING] APPLY MODE - This will modify your CMS data!');
    await applyChanges();
  } else {
    console.log('\n🔍 [SAFE MODE] Preview only - no changes will be made');
    await previewChanges();
  }
}

// ===== EXECUTION =====
if (require.main === module) {
  main().catch(error => {
    console.error('💥 [FATAL] Error:', error);
    process.exit(1);
  });
} 