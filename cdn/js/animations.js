console.log('🎨 Animations.js loaded');

// SVGs start hidden via Webflow (opacity: 0), just set the y position
// COMMENTED OUT - Intro animation disabled
/*
gsap.set(['.studio_svg', '.penzlien_svg'], {
  y: 30
});
*/

/*
🎯 QUICK REFERENCE - HOVER ANIMATIONS:
   • initializeProjectHoverAnimations() - Main setup function (auto-runs on page load)
   • destroyProjectHoverAnimations() - Cleanup function (auto-runs before page transitions)
   • testHoverAnimations() - Test function (run in console to debug)
   • explainHoverSystem() - Complete explanation (run in console for help)
   
🎯 QUICK REFERENCE - DETAILS PANEL ANIMATIONS:
   • initializeDetailsPanelAnimations() - Main setup function (auto-runs on detail pages)
   • destroyDetailsPanelAnimations() - Cleanup function (auto-runs before page transitions)
   • openDetailsPanel() - Opens the details panel with stagger
   • closeDetailsPanel() - Closes the details panel
   • testDetailsPanelAnimations() - Test function (run in console to debug)
   
🎯 QUICK REFERENCE - SLIDER OVERVIEW TOGGLE:
   • initializeSliderOverviewAnimations() - Main setup function (auto-runs on slider pages)
   • destroySliderOverviewAnimations() - Cleanup function (auto-runs before page transitions)
   • activateOverviewMode() - Shows all slides in grid layout
   • deactivateOverviewMode() - Returns to carousel mode
   • testSliderOverviewAnimations() - Test function (run in console to debug)
   
🎯 QUICK REFERENCE - CUSTOM CURSOR SYSTEM:
   • initializeCustomCursor() - Main setup (runs ONCE on page load, never again)
   • setupCustomCursorListeners() - Add hover behaviors (runs after each page transition)
   • updateCursorLabel(text, scaleDot) - Update cursor text and dot scale
   • testCustomCursor() - Test mousemove listener and basic functionality
   • debugCursorState() - Force cursor visible with red background for debugging

🎯 QUICK REFERENCE - PARALLAX ANIMATIONS:
   • initializeParallaxAnimations() - Main setup function (auto-runs on page load)
   • destroyParallaxAnimations() - Cleanup function (auto-runs before page transitions)

🎯 QUICK REFERENCE - INDEX ITEM HOVER ANIMATIONS:
   • initializeIndexItemHoverAnimations() - Main setup function (auto-runs on page load)
   • destroyIndexItemHoverAnimations() - Cleanup function (auto-runs before page transitions)
   
📍 Location: Search for section headers below for specific functionality
*/

// ================================================================================
// 🌍 GLOBAL VARIABLES & STATE MANAGEMENT
// ================================================================================

// Global array to store slider instances
let sliderInstances = [];

// Global scroll position storage
let scrollPositions = {};

// Global click position storage for transform origin effect
let clickPosition = { x: 50, y: 50 }; // Default to center

// Session flag for hero_wrap animation (only play once per session)
let heroAnimationPlayed = false;

// ================================================================================
// 🖱️ CUSTOM CURSOR SYSTEM
// ================================================================================
// This section handles the custom cursor that follows the mouse and changes
// based on what element is being hovered over
//
// BARBA.JS INTEGRATION:
// 1. Cursor element MUST be outside data-barba="container" (stays in DOM forever)
// 2. Initialize once on page load (mousemove listener + element references)
// 3. On page transitions: Only remove/re-add hover listeners for new elements
// 4. Cursor movement continues uninterrupted (mousemove listener never removed)

/**
 * CUSTOM CURSOR STATE TRACKING
 * Stores references to cursor elements and tracks initialization state
 */
let customCursorState = {
  isInitialized: false,
  cursor: null,
  labelText: null,
  labelDot: null
};

/**
 * CLEANUP FUNCTION FOR CUSTOM CURSOR
 * Removes all cursor event listeners and resets state
 * Called before page transitions and when reinitializing
 */
function destroyCustomCursor() {
  console.log('🧹 [CURSOR CLEANUP] Full cursor teardown...');
  document.removeEventListener('mousemove', handleCursorMove);
  $(document).off('mouseenter.customCursor mouseleave.customCursor');
  customCursorState = { isInitialized: false, cursor: null, labelText: null, labelDot: null };
  console.log('✅ [CURSOR CLEANUP] Cursor completely destroyed.');
}

/**
 * LIGHTWEIGHT SETUP FOR BARBA TRANSITIONS  
 * Only re-adds hover listeners when cursor element persists outside container
 */
function setupCustomCursorListeners() {
  console.log('🎨 [CURSOR HOVERS] Setting up hover listeners...');
  
  // Clean up any old hover listeners first
  $(document).off('mouseenter.customCursor mouseleave.customCursor');

  // PROJECT LINKS: Show dynamic location from CMS and scale dot
  $(document).on('mouseenter.customCursor', '.project_link', function() {
    // DEBUG: Log the complete structure to help identify Location field placement
    console.log('🔍 [CURSOR DEBUG] Project link structure:', $(this)[0]);
    console.log('🔍 [CURSOR DEBUG] Parent project container:', $(this).closest('.project_masonry_item, .projects_item')[0]);
    
    let locationText = "View"; // Fallback text
    const $projectContainer = $(this).closest('.project_masonry_item, .projects_item');
    
    // Method 1: Look for "Location" field by exact class name (most likely in Webflow)
    const $locationByClass = $projectContainer.find('.location, .Location, .project-location');
    console.log('🔍 [CURSOR DEBUG] Found by class (.location, .Location):', $locationByClass.length, $locationByClass.text());
    
    // Method 2: Look for Location in any text element or div within project
    const $allTextElements = $projectContainer.find('*').filter(function() {
      const text = $(this).text().trim();
      return text.length > 0 && text.length < 50; // Reasonable location text length
    });
    console.log('🔍 [CURSOR DEBUG] All text elements in project:', $allTextElements.length);
    $allTextElements.each(function(i) {
      if (i < 5) { // Log first 5 text elements
        console.log(`   Text ${i + 1}:`, $(this).text().trim(), '| Class:', $(this).attr('class'));
      }
    });
    
    // Method 3: Look for data attributes
    const dataLocation = $(this).attr('data-location') || $projectContainer.attr('data-location');
    console.log('🔍 [CURSOR DEBUG] Data-location attribute:', dataLocation);
    
    // Method 4: Try to find any element containing location-like text
    const $locationElements = $projectContainer.find('*').filter(function() {
      const classes = $(this).attr('class') || '';
      return classes.toLowerCase().includes('location') || 
             classes.toLowerCase().includes('city') ||
             classes.toLowerCase().includes('place');
    });
    console.log('🔍 [CURSOR DEBUG] Elements with location-related classes:', $locationElements.length);
    $locationElements.each(function(i) {
      console.log(`   Location element ${i + 1}:`, $(this).text().trim(), '| Class:', $(this).attr('class'));
    });
    
         // Get the FULL location text from any element that contains it
     let foundLocationText = "";
     
     // Check all text elements for location content
     $allTextElements.each(function() {
       const fullText = $(this).text().trim();
       // If text contains reasonable location-like content, use it as-is
       if (fullText.length > 2 && fullText.length < 100) {
         foundLocationText = fullText;
         console.log(`🎯 [CURSOR DEBUG] Found location text: "${fullText}"`);
         return false; // Use the first reasonable text found
       }
     });
     
     // Use the location data methods or the found text
     const classLocation = $locationByClass.first().text().trim();
     const dataLocationText = dataLocation;
     const locationElementText = $locationElements.first().text().trim();
     
     // Use the first non-empty location found - FULL TEXT AS-IS
     locationText = dataLocationText || classLocation || locationElementText || foundLocationText || "View";
    
    console.log(`🎯 [CURSOR RESULT] Final location text: "${locationText}"`);
    updateCursorLabel(locationText, true);
  });
  $(document).on('mouseleave.customCursor', '.project_link', () => updateCursorLabel("", false));

  // NAVIGATION ITEMS: Scale dot, no text
  $(document).on('mouseenter.customCursor', '.nav_link', () => updateCursorLabel("", true));
  $(document).on('mouseleave.customCursor', '.nav_link', () => updateCursorLabel("", false));
  
  // Add other hover listeners...
  $(document).on('mouseenter.customCursor', '#bw', () => updateCursorLabel("Previous", false));
  $(document).on('mouseleave.customCursor', '#bw', () => updateCursorLabel("", false));
  $(document).on('mouseenter.customCursor', '#ffwd', () => updateCursorLabel("Next", false));
  $(document).on('mouseleave.customCursor', '#ffwd', () => updateCursorLabel("", false));
  $(document).on('mouseenter.customCursor', '.swiper-slide', () => updateCursorLabel("Swipe", false));
  $(document).on('mouseleave.customCursor', '.swiper-slide', () => updateCursorLabel("", false));

  console.log('✅ [CURSOR HOVERS] Hover listeners are ready.');
}

/**
 * CURSOR MOVEMENT HANDLER
 * Updates cursor position following the mouse with smooth GSAP animation
 */
function handleCursorMove(event) {
  if (customCursorState.cursor) {
    gsap.to(customCursorState.cursor, {
      x: event.clientX,
      y: event.clientY,
      opacity: 1, // Make cursor visible on first movement
      duration: 0.1, // Slight trailing effect
      ease: "power2.out"
    });
  }
}

/**
 * UPDATE CURSOR LABEL FUNCTION
 * Changes the cursor text and optionally scales the dot
 */
function updateCursorLabel(text, scaleDot = false) {
  if (customCursorState.labelText && customCursorState.labelDot) {
    customCursorState.labelText.textContent = text || '';
    gsap.to(customCursorState.labelDot, {
      scale: scaleDot ? 1.30 : 1,
      duration: 0.1,
      ease: 'power2.out'
    });
  }
}

/**
 * MAIN INITIALIZATION FUNCTION FOR CUSTOM CURSOR
 * Sets up the custom cursor system and all hover behaviors
 */
function initializeCustomCursor() {
  console.log('🎯 [CURSOR INIT] Starting ONE-TIME setup...');
  
  if (customCursorState.isInitialized) {
    console.log('✅ [CURSOR INIT] Already initialized, skipping.');
    return;
  }
  
  const cursor = document.querySelector('.projects_mouse_label');
  const labelText = cursor ? cursor.querySelector('.label_text') : null;
  const labelDot = cursor ? cursor.querySelector('.label_dot') : null;
  
  if (!cursor || !labelText || !labelDot) {
    console.warn('❌ [CURSOR INIT] Cursor elements not found. Aborting.');
    return;
  }
  
  // Store references ONCE
  customCursorState.cursor = cursor;
  customCursorState.labelText = labelText;
  customCursorState.labelDot = labelDot;
  
  // Set initial position and state to prevent cursor appearing at (0,0)
  gsap.set(cursor, {
    x: -100, // Start off-screen
    y: -100,
    opacity: 0 // Start invisible until first mouse movement
  });
  
  // Clear any existing text
  labelText.textContent = '';
  
  // Attach mousemove listener ONCE and NEVER remove it
  document.addEventListener('mousemove', handleCursorMove);
  
  // Set initial hover listeners
  setupCustomCursorListeners();
  
  customCursorState.isInitialized = true;
  console.log('🎉 [CURSOR INIT] ===== ONE-TIME CURSOR SETUP COMPLETE! =====');
  console.log('   - Mouse movement tracking is now active permanently.');
}

// ================================================================================
// 🎲 MASONRY RANDOMIZER
// ================================================================================

/**
 * MASONRY VERTICAL OFFSET RANDOMIZER
 * Adds random vertical gaps to small and medium masonry items
 * Needs to run on every page transition since Barba doesn't trigger DOMContentLoaded
 */
function randomizeMasonryOffsets() {
  console.log('🎲 Randomizing masonry item vertical offsets...');
  
  const gaps = ['0', '5vw', '15vw', '25vw'];
  const masonryItems = document.querySelectorAll(
    '.project_masonry_item[item-style="small"],' +
    '.project_masonry_item[item-style="medium"]'
  );
  
  if (masonryItems.length > 0) {
    masonryItems.forEach((item, index) => {
      const gap = gaps[Math.floor(Math.random() * gaps.length)];
      item.style.marginTop = gap;
      console.log(`🎲 Item ${index + 1}: Applied ${gap} margin-top`);
    });
    console.log(`✅ Applied random offsets to ${masonryItems.length} masonry items`);
  } else {
    console.log('ℹ️ No small/medium masonry items found on this page');
  }
}

// ================================================================================
// 🎢 PARALLAX ANIMATIONS
// ================================================================================

/**
 * PARALLAX SCROLL EFFECT FOR MASONRY ITEMS
 * Adds subtle parallax movement to small masonry items during scroll
 * Uses GSAP ScrollTrigger for smooth performance
 */
let parallaxScrollTriggers = []; // Store ScrollTrigger instances for cleanup

function initializeParallaxAnimations() {
  try {
    console.log('🎢 ============================================');
    console.log('🎢 PARALLAX INITIALIZATION - START');
    console.log('🎢 ============================================');
  
  // Check for GSAP and ScrollTrigger
  console.log('🔍 Checking for GSAP:', !!window.gsap);
  console.log('🔍 Checking for ScrollTrigger on window:', !!window.ScrollTrigger);
  console.log('🔍 Checking for gsap.ScrollTrigger:', !!gsap?.ScrollTrigger);
  console.log('🔍 What is gsap:', typeof gsap, gsap);
  console.log('🔍 GSAP plugins:', gsap?.plugins);
  
  // Try to access ScrollTrigger from gsap object
  const ScrollTriggerPlugin = window.ScrollTrigger || gsap?.ScrollTrigger;
  
  if (!window.gsap || !ScrollTriggerPlugin) {
    console.log('❌ GSAP or ScrollTrigger not available for parallax');
    return;
  }
  
  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTriggerPlugin);
  console.log('✅ ScrollTrigger plugin registered with:', ScrollTriggerPlugin);
  
  // Disable parallax on touch / small screens (performance + UX)
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isTouch = matchMedia('(hover: none)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  console.log('🔍 Device checks:');
  console.log('   - isMobile (≤768px):', isMobile);
  console.log('   - isTouch device:', isTouch);
  console.log('   - prefersReduced:', prefersReduced);
  
  if (isMobile || isTouch || prefersReduced) {
    console.log('⚠️ Parallax disabled (mobile/touch device or reduced motion preference)');
    return;
  }
  
  // Target small and medium masonry items for parallax
  console.log('🔍 Searching for .project_masonry_item[item-style="small"] and [item-style="medium"]...');
  const smallItems = gsap.utils.toArray('.project_masonry_item[item-style="small"]');
  const mediumItems = gsap.utils.toArray('.project_masonry_item[item-style="medium"]');
  const allParallaxItems = [...smallItems, ...mediumItems];
  
  console.log(`📦 Found ${smallItems.length} small and ${mediumItems.length} medium masonry items`);
  
  if (allParallaxItems.length === 0) {
    console.log('❌ No small/medium masonry items found for parallax');
    console.log('🔍 Checking all masonry items on page:');
    const allItems = document.querySelectorAll('.project_masonry_item');
    console.log(`   Total masonry items: ${allItems.length}`);
    allItems.forEach((item, i) => {
      console.log(`   Item ${i + 1}: item-style="${item.getAttribute('item-style')}"`);
    });
    return;
  }
  
  allParallaxItems.forEach((el, i) => {
    const itemStyle = el.getAttribute('item-style');
    
    // More pronounced: small items move more, medium items move less
    let yPercentStart, yPercentEnd;
    if (itemStyle === 'small') {
      yPercentStart = -15;  // Start further up
      yPercentEnd = 15;     // End further down (30% total range)
    } else {
      yPercentStart = -10;  // Medium items: less movement
      yPercentEnd = 10;     // (20% total range)
    }
    
    console.log(`🎢 Setting up parallax for ${itemStyle} item ${i + 1}/${allParallaxItems.length}:`);
    console.log(`   - Movement: ${yPercentStart}% to ${yPercentEnd}%`);
    
    // Parallax using transform to avoid conflicts with other animations
    const tl = gsap.fromTo(el,
      { 
        yPercent: yPercentStart
      },
      {
        yPercent: yPercentEnd,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,  // Smooth scrubbing with 1 second delay
          // markers: false  // Disabled - set to true for debugging
        }
      }
    );
    
    // Store the ScrollTrigger for cleanup
    parallaxScrollTriggers.push(tl.scrollTrigger);
    console.log(`✅ Parallax item ${i + 1} configured`);
  });
  
  console.log('🎢 ============================================');
  console.log(`✅ Parallax initialized for ${allParallaxItems.length} items (${smallItems.length} small, ${mediumItems.length} medium)`);
  console.log('🎢 ============================================');
  
  } catch (error) {
    console.error('❌❌❌ ERROR IN initializeParallaxAnimations:', error);
    console.error('Stack trace:', error.stack);
  }
}

function destroyParallaxAnimations() {
  console.log('🧹 Cleaning up parallax animations...');
  
  // Kill all ScrollTrigger instances
  parallaxScrollTriggers.forEach(trigger => {
    if (trigger) trigger.kill();
  });
  
  parallaxScrollTriggers = [];
  console.log('✅ Parallax animations cleaned up');
}

// ================================================================================
// 📜 SCROLL-TRIGGERED ANIMATIONS
// ================================================================================

// Global scroll animation elements
let scrollAnimationElements = [];

function destroyScrollAnimations() {
  console.log('🧹 Cleaning up scroll animations...');
  // Remove scroll event listener
  window.removeEventListener('scroll', handleScroll);
  scrollAnimationElements = [];
  console.log('✅ Scroll animations cleaned up');
}

function handleScroll() {
  scrollAnimationElements.forEach((item, index) => {
    const rect = item.element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // IMPROVED: Check if element is visible OR 85% into viewport
    // For large elements: any part visible triggers animation
    // For normal elements: 85% trigger still applies
    const isLargeElement = item.element.classList.contains('project_masonry_item');
    const isVisible = isLargeElement 
      ? (rect.bottom > 0 && rect.top < windowHeight) // Large: any part visible
      : (rect.top <= windowHeight * 0.85); // Normal: 85% trigger
    
    if (isVisible) {
      if (!item.animated) {
        console.log(`✨ Animating project element ${index + 1}`);
        gsap.to(item.element, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out"
        });
        item.animated = true;
      }
    } else {
      // Reset animation state when element goes back above viewport
      // This allows re-animation on next scroll down
      if (item.animated) {
        console.log(`🔄 Resetting animation state for element ${index + 1}`);
        gsap.set(item.element, {
          opacity: 0,
          y: 30
        });
        item.animated = false;
      }
    }
  });
}

function initializeScrollAnimations() {
  console.log('📜 Initializing scroll animations...');
  
  // Animate .project_img_wrap elements with fade-in and move-up effect
  // BUT EXCLUDE those inside .projects_item (home page handles those with stagger)
  // AND EXCLUDE those inside .swiper-slide (slider entrance animation handles those)
  const projectImgWraps = document.querySelectorAll('.project_img_wrap:not(.projects_item .project_img_wrap):not(.swiper-slide .project_img_wrap)');
  
  // Also animate .project_masonry_item elements with the same effect
  const projectMasonryItems = document.querySelectorAll('.project_masonry_item');
  
  // Combine both types of elements
  const allScrollElements = [...projectImgWraps, ...projectMasonryItems];
  
  if (allScrollElements.length > 0) {
    console.log(`🖼️ Found ${projectImgWraps.length} project image wraps and ${projectMasonryItems.length} masonry items to animate (excluding home page and slider items)`);
    
    // Reset scroll elements array
    scrollAnimationElements = [];
    
    // Set initial state and prepare for animation
    allScrollElements.forEach((element, index) => {
      // Set initial state (invisible, slightly below final position)
      gsap.set(element, {
        opacity: 0,
        y: 30
      });
      
      // Add to tracking array
      scrollAnimationElements.push({
        element: element,
        animated: false
      });
    });
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check immediately in case elements are already in view
    handleScroll();
    
    // FORCE ANIMATE LARGE MASONRY ITEMS: They often fail scroll detection due to size/positioning
    setTimeout(() => {
      scrollAnimationElements.forEach((item, index) => {
        const element = item.element;
        
        // Only target large masonry items that haven't animated yet
        if (element.classList.contains('project_masonry_item') && !item.animated) {
          const style = element.getAttribute('item-style');
          
          // Force animate large and x-large items immediately
          if (style === 'large' || style === 'x-large') {
            console.log(`🎯 [BIG ELEMENT FIX] Force animating large masonry item: ${style}`);
            gsap.to(element, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
              delay: index * 0.1
            });
            item.animated = true;
          }
        }
      });
    }, 200); // Small delay to ensure DOM is ready
    
    console.log('✅ Scroll animations for project elements initialized');
  } else {
    console.log('ℹ️ No project elements found on this page (or all are handled by home page stagger or slider entrance)');
  }
}

// ================================================================================
// 🖱️ CLICK POSITION TRACKING & DOM READY
// ================================================================================

$(document).ready(function() {
  console.log('📱 DOM ready - animations.js connected to Webflow');
  
  // Track click positions for transform origin effect
  $(document).on('click', 'a, .w-inline-block, [data-wf-page], .clickable_link', function(e) {
    const rect = this.getBoundingClientRect();
    clickPosition = {
      x: (rect.left + rect.width/2) / window.innerWidth * 100,
      y: (rect.top + rect.height/2) / window.innerHeight * 100
    };
    console.log(`📍 Click detected on:`, this.tagName, this.className);
    console.log(`📍 Click position stored: ${clickPosition.x.toFixed(1)}%, ${clickPosition.y.toFixed(1)}%`);
    console.log(`📍 Element:`, this);
  });
  
  // Initialize components immediately for direct page loads
  console.log('🚀🚀🚀 STARTING INITIALIZATION TIMEOUT 🚀🚀🚀');
  setTimeout(() => {
    console.log('⏰⏰⏰ INSIDE TIMEOUT - STARTING INITIALIZATIONS ⏰⏰⏰');
    initializeSliders();
    initializeScrollAnimations();
    initializeProjectHoverAnimations();
    initializeIndexItemHoverAnimations();
    initializeDetailsPanelAnimations();
    initializeSliderOverviewAnimations();
    console.log('🔥🔥🔥 ABOUT TO CALL initializeParallaxAnimations() 🔥🔥🔥');
    initializeParallaxAnimations();
    console.log('🔥🔥🔥 AFTER CALLING initializeParallaxAnimations() 🔥🔥🔥');
    
    // CRITICAL: Initialize cursor ONCE on page load
    initializeCustomCursor();
    
    // Apply random masonry offsets on initial page load
    randomizeMasonryOffsets();
    
    // REMOVED DIRECT PAGE LOAD ANIMATION - Let Barba handle it to avoid double animation
    
    // Check if we're on the index page and animate immediately
    if (document.querySelector('.index_item')) {
      animateIndexPage();
    }
    
    // Initialize SVG scroll animations if SVGs exist
    // COMMENTED OUT - Intro animation disabled
    /*
    if (document.querySelector('.studio_svg') || document.querySelector('.penzlien_svg')) {
      initializeSVGScrollAnimations();
    }
    */
  }, 100);
  
  // Initialize Barba after a small delay
  setTimeout(() => {
  initializeBarba();
  }, 200);
  
});

// ================================================================================
// 🎯 PROJECT HOVER ANIMATIONS SYSTEM
// ================================================================================
// This section handles the fade-in/fade-out animations for project overlays
// when hovering over .project_img_wrap elements

/**
 * CLEANUP FUNCTION
 * Removes all hover event listeners to prevent memory leaks
 * Called before page transitions and when reinitializing
 */
function destroyProjectHoverAnimations() {
  console.log('🧹 [HOVER CLEANUP] Removing all project hover event listeners...');
  // Remove all hover event listeners
  $(document).off('mouseenter.projectHover mouseleave.projectHover', '.project_img_wrap');
  console.log('✅ [HOVER CLEANUP] Project hover animations cleaned up successfully');
}

/**
 * MAIN INITIALIZATION FUNCTION
 * Sets up hover animations for all .project_img_wrap elements
 * Finds sibling .project_img_overlay and .project_thumb_wrap elements
 * Animates them with staggered fade-in on hover, quick fade-out on mouse leave
 */
function initializeProjectHoverAnimations() {
  console.log('🎯 [HOVER INIT] Starting project hover animations setup...');
  
  // STEP 1: Clean up any existing listeners first
  console.log('📋 [HOVER INIT] Step 1: Cleaning up existing listeners...');
  destroyProjectHoverAnimations();
  
  // STEP 2: Find all project image wrapper elements
  console.log('🔍 [HOVER INIT] Step 2: Searching for .project_img_wrap elements...');
  const $projectWraps = $('.project_img_wrap');
  
  if ($projectWraps.length > 0) {
    console.log(`✅ [HOVER INIT] Found ${$projectWraps.length} project image wraps - setting up animations`);
    
    // STEP 3: Set up MOUSE ENTER animation (hover start)
    console.log('🎨 [HOVER INIT] Step 3: Setting up MOUSE ENTER animations...');
    $(document).on('mouseenter.projectHover', '.project_img_wrap', function() {
      console.log('🔥 [HOVER START] ==================== MOUSE ENTERED PROJECT ====================');
      
      // Find the sibling overlay and thumb wrap elements
      const $overlay = $(this).siblings('.project_img_overlay');
      const $thumbWrap = $(this).siblings('.project_thumb_wrap');
      
      console.log(`🔍 [HOVER START] Element detection:`, {
        overlay: $overlay.length > 0 ? '✅ Found' : '❌ Not found',
        thumbWrap: $thumbWrap.length > 0 ? '✅ Found' : '❌ Not found',
        overlayCount: $overlay.length,
        thumbWrapCount: $thumbWrap.length
      });
      
      // Kill any existing animations to prevent conflicts
      console.log('🛑 [HOVER START] Stopping any existing animations...');
      gsap.killTweensOf([$overlay, $thumbWrap]);
      
      // Create staggered fade-in animation
      console.log('✨ [HOVER START] Starting staggered fade-in animation...');
      const timeline = gsap.timeline();
      
      // ANIMATION SEQUENCE:
      // 1. Overlay fades in first (at 0 seconds)
      timeline.to($overlay, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onStart: () => console.log('   🎭 [HOVER START] Overlay fade-in started'),
        onComplete: () => console.log('   ✅ [HOVER START] Overlay fade-in complete')
      }, 0)
      
      // 2. Thumb wrap fades in 0.1 seconds later (stagger effect)
      .to($thumbWrap, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onStart: () => console.log('   🖼️ [HOVER START] Thumb wrap fade-in started (staggered)'),
        onComplete: () => console.log('   ✅ [HOVER START] Thumb wrap fade-in complete')
      }, 0.1); // 0.1s stagger delay
      
      console.log('🚀 [HOVER START] Staggered animation timeline launched!');
    });
    
    // STEP 4: Set up MOUSE LEAVE animation (hover end)
    console.log('🎨 [HOVER INIT] Step 4: Setting up MOUSE LEAVE animations...');
    $(document).on('mouseleave.projectHover', '.project_img_wrap', function() {
      console.log('💨 [HOVER END] ==================== MOUSE LEFT PROJECT ====================');
      
      // Find the sibling overlay and thumb wrap elements
      const $overlay = $(this).siblings('.project_img_overlay');
      const $thumbWrap = $(this).siblings('.project_thumb_wrap');
      
      console.log(`🔍 [HOVER END] Element detection:`, {
        overlay: $overlay.length > 0 ? '✅ Found' : '❌ Not found',
        thumbWrap: $thumbWrap.length > 0 ? '✅ Found' : '❌ Not found'
      });
      
      // Kill any existing animations to prevent conflicts
      console.log('🛑 [HOVER END] Stopping any existing animations...');
      gsap.killTweensOf([$overlay, $thumbWrap]);
      
      // Quick simultaneous fade-out (no stagger for responsive feel)
      console.log('⚡ [HOVER END] Starting quick simultaneous fade-out...');
      gsap.to([$overlay, $thumbWrap], {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
        onStart: () => console.log('   🌫️ [HOVER END] Both elements fading out together'),
        onComplete: () => console.log('   ✅ [HOVER END] Fade-out complete - elements hidden')
      });
      
      console.log('🏁 [HOVER END] Exit animation launched!');
    });
    
    console.log('🎉 [HOVER INIT] ===== PROJECT HOVER ANIMATIONS READY! =====');
    console.log('📋 [HOVER INIT] Animation Summary:');
    console.log('   • Hover IN: Overlay fades in → Thumb wrap fades in (0.1s stagger)');
    console.log('   • Hover OUT: Both fade out together (quick response)');
    console.log('   • Duration: 0.3s in, 0.2s out');
    console.log('   • Easing: power2.out (smooth)');
    
  } else {
    console.log('ℹ️ [HOVER INIT] No .project_img_wrap elements found on this page');
    console.log('💡 [HOVER INIT] Make sure your Webflow elements have the correct class names:');
    console.log('   • .project_img_wrap (trigger element)');
    console.log('   • .project_img_overlay (sibling element)');
    console.log('   • .project_thumb_wrap (sibling element)');
  }
}

// ================================================================================
// 🎯 INDEX ITEM HOVER ANIMATIONS
// ================================================================================

/**
 * CLEANUP FUNCTION FOR INDEX ITEM HOVER ANIMATIONS
 * Removes all event listeners before page transitions
 */
function destroyIndexItemHoverAnimations() {
  console.log('🧹 [INDEX HOVER CLEANUP] Removing index item hover listeners...');
  $(document).off('mouseenter.indexHover mouseleave.indexHover', '.index_item');
  console.log('✅ [INDEX HOVER CLEANUP] Index hover animations cleaned up');
}

/**
 * INITIALIZE INDEX ITEM HOVER ANIMATIONS
 * Fades in .index_left_title_wrap and .index_view_wrap on hover
 */
function initializeIndexItemHoverAnimations() {
  console.log('🎯 [INDEX HOVER INIT] Starting index item hover animations...');
  
  // Clean up any existing listeners first
  destroyIndexItemHoverAnimations();
  
  const indexItems = $('.index_item');
  
  if (indexItems.length === 0) {
    console.log('ℹ️ [INDEX HOVER INIT] No .index_item elements found on this page');
    return;
  }
  
  console.log(`✅ [INDEX HOVER INIT] Found ${indexItems.length} index items - setting up hovers...`);
  
  // Mouse enter - fade in elements
  $(document).on('mouseenter.indexHover', '.index_item', function() {
    const $leftTitle = $(this).find('.index_left_title_wrap');
    const $viewWrap = $(this).find('.index_view_wrap');
    
    // Kill any existing animations
    gsap.killTweensOf([$leftTitle, $viewWrap]);
    
    // Fade in both elements
    gsap.to([$leftTitle, $viewWrap], {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  });
  
  // Mouse leave - fade out elements
  $(document).on('mouseleave.indexHover', '.index_item', function() {
    const $leftTitle = $(this).find('.index_left_title_wrap');
    const $viewWrap = $(this).find('.index_view_wrap');
    
    // Kill any existing animations
    gsap.killTweensOf([$leftTitle, $viewWrap]);
    
    // Fade out both elements
    gsap.to([$leftTitle, $viewWrap], {
      opacity: 0,
      duration: 0.2,
      ease: "power2.out"
    });
  });
  
  console.log('✅ [INDEX HOVER INIT] Index item hover animations initialized');
}

// ================================================================================
// 🎠 GSAP SLIDER SYSTEM
// ================================================================================

function destroySliders() {
  console.log('🗑️ Destroying existing slider instances...');
  
  // Clean up event listeners and animations
  sliderInstances.forEach(instance => {
    if (instance.cleanup) {
      instance.cleanup();
    }
  });
  
  // Clear the instances array
  sliderInstances = [];
  
  console.log('✅ Slider instances destroyed');
}

function initializeSliders() {
  console.log('🎯 Initializing GSAP sliders...');
  
  // PREVENT FLASH: Set initial CSS immediately
  const sliderCSS = `
    <style id="gsap-slider-css">
      .swiper {
        position: relative;
        overflow: hidden;
      }
      .swiper-wrapper {
        display: flex !important;
        width: 100% !important;
        height: 100% !important;
        transition: none !important;
      }
      .swiper-wrapper:not(.is-overview) .swiper-slide {
        flex-shrink: 0 !important;
        display: block !important;
        width: 100% !important;
      }
      /* PREVENT IMAGE FLICKERING */
      .swiper-slide img {
        transition: none !important;
        transform: none !important;
        width: 100%;
        height: auto;
        display: block;
      }
      /* Hide ghost elements in overview mode - but don't touch their positioning */
      .swiper.overview-active .slider_ghost_clickable {
        display: none !important;
      }
      /* Hide global navigation when in overview mode - simple and reliable */
      body.overview-mode #bw,
      body.overview-mode #ffwd {
        display: none !important;
      }

      /* Hide global navigation and the entire ghost wrap in overview mode */
      body.overview-mode .slider_ghost_wrap,
      body.overview-mode #bw,
      body.overview-mode #ffwd {
        display: none !important;
      }

      /* --- DEBUG: Red Container of Truth --- */
      body.overview-mode .page_wrap {
        background-color: red !important;
      }
    </style>
  `;
  
  // Remove existing styles and add new ones
  $('#gsap-slider-css').remove();
  $('head').append(sliderCSS);
  
  // DEBUG: Check what we have in the DOM
  console.log('🔍 DEBUG - DOM Analysis:');
  console.log('  - Slider containers found:', $('.swiper').length);
  console.log('  - Slider wrappers found:', $('.swiper-wrapper').length);
  console.log('  - Slider slides found:', $('.swiper-slide').length);
  
  // First destroy any existing sliders
  destroySliders();
  
  // Find global navigation elements (outside of sliders)
  const $globalPrevBtn = $('#bw');
  const $globalNextBtn = $('#ffwd');
  
  console.log(`🔍 Global navigation found:`, {
    prev: $globalPrevBtn.length > 0 ? '✅ Found' : '❌ Missing',
    next: $globalNextBtn.length > 0 ? '✅ Found' : '❌ Missing'
  });
  
  // Run synchronously to prevent flash of unstyled content
  $('.swiper').each(function(index) {
    console.log(`🎠 Setting up GSAP slider ${index + 1}`);
    
    const $slider = $(this);
    const $wrapper = $slider.find('.swiper-wrapper');
    const $slides = $slider.find('.swiper-slide');
    
    // Skip if no slides found
    if (!$slides.length) {
      console.warn(`❌ No slides found in slider ${index + 1}`);
      return;
    }
    
    console.log(`🔍 Slider ${index + 1} structure:`, {
      slider: $slider.length,
      wrapper: $wrapper.length,
      slides: $slides.length
    });
    
    // Get responsive settings - ALWAYS 1 SLIDE PER VIEW
    const slidesPerView = 1;
    const slideWidth = 100;
    
    let currentSlide = 0;
    const totalSlides = $slides.length;
    let maxSlide = Math.max(0, totalSlides - slidesPerView);
    
    console.log(`📊 Slider ${index + 1} config:`, {
      slidesPerView,
      slideWidth,
      totalSlides,
      maxSlide,
      isMobile
    });
    
    // Use global navigation elements instead of looking inside slider
    let $prevBtn = $globalPrevBtn;
    let $nextBtn = $globalNextBtn;
    
    // Store reference to this slider's functions for global navigation
    const sliderControls = {
      goToPrev: null,
      goToNext: null,
      index: index
    };
    
    // If no nav buttons found, skip this slider (Webflow should provide them)
    if (!$prevBtn.length || !$nextBtn.length) {
      console.warn(`❌ No #bw or #ffwd found in slider ${index + 1}`);
      return;
    }
    
    console.log(`🎯 Using Webflow navigation: #bw and #ffwd for slider ${index + 1}`);
    
    // Make sure ghost clickable elements are visible in slider mode
    gsap.set([$prevBtn, $nextBtn], { 
      opacity: 1, 
      pointerEvents: 'auto'
    });
    
    // Show navigation buttons
    gsap.set([$prevBtn, $nextBtn], { opacity: 1 });
    
    // Animation function
    function updateSlider(animated = true) {
      const offset = -(currentSlide * slideWidth);
      
      gsap.to($wrapper, {
        x: offset + '%',
        duration: animated ? 0.4 : 0,  // Faster: was 0.6
        ease: "power2.inOut"  // Snappier: was "power2.out"
      });
      
      // With looping enabled, buttons are never disabled
      $prevBtn.removeClass('disabled');
      $nextBtn.removeClass('disabled');
      
      console.log(`�� Slider ${index + 1} moved to slide ${currentSlide} (offset: ${offset}%)`);
    }
    
    // Navigation handlers
    function goToPrev() {
      if (currentSlide > 0) {
        currentSlide--;
      } else {
        // LOOP: Go to last slide when at first slide
        currentSlide = maxSlide;
      }
      updateSlider();
    }
    
    function goToNext() {
      if (currentSlide < maxSlide) {
        currentSlide++;
      } else {
        // LOOP: Go to first slide when at last slide
        currentSlide = 0;
      }
      updateSlider();
    }
    
    // Store functions in slider controls
    sliderControls.goToPrev = goToPrev;
    sliderControls.goToNext = goToNext;
    
    function goToSlide(slideIndex, animated = true) {
      const newSlideIndex = Math.max(0, Math.min(slideIndex, maxSlide));
      console.log(`🚀 Navigating to slide: ${slideIndex} -> clamped to ${newSlideIndex}`);
      currentSlide = newSlideIndex;
      updateSlider(animated);
    }
    
    function getCurrentSlide() {
      return currentSlide;
    }
    
    // Master on/off controls for the slider
    function disable() {
      console.log(`🛑 Disabling slider ${index + 1}`);
      // DON'T reset position - preserve current slide position for overview mode
      // The wrapper will be handled by CSS classes for overview mode
      
      // Hide global navigation elements when slider is disabled (for overview mode)
      gsap.set([$globalPrevBtn, $globalNextBtn], { 
        opacity: 0, 
        pointerEvents: 'none' 
      });
      // Disable keyboard navigation for this slider
      $(document).off('keydown.slider' + index);
    }
    
    function enable() {
      console.log(`✅ Enabling slider ${index + 1}`);
      // Update to current position
      updateSlider(false);
      // Show global navigation elements when slider is enabled
      gsap.set([$globalPrevBtn, $globalNextBtn], { 
        opacity: 1, 
        pointerEvents: 'auto' 
      });
      // Re-enable keyboard navigation
      $(document).on('keydown.slider' + index, function(e) {
        if (e.key === 'ArrowLeft') goToPrev();
        if (e.key === 'ArrowRight') goToNext();
      });
    }
    
    // Bind events to the global navigation elements (only for the first slider for now)
    if (index === 0 && $globalPrevBtn.length && $globalNextBtn.length) {
      console.log(`🔗 Binding global navigation to slider ${index + 1}`);
      
      // Remove any existing bindings first
      $globalPrevBtn.off('click.slider');
      $globalNextBtn.off('click.slider');
      
      // Bind to this slider's functions
      $globalPrevBtn.on('click.slider', goToPrev);
      $globalNextBtn.on('click.slider', goToNext);
      
      // Make sure they're visible
      gsap.set([$globalPrevBtn, $globalNextBtn], { 
        opacity: 1, 
        pointerEvents: 'auto'
      });
    }
    
    // Keyboard navigation
    $(document).on('keydown.slider' + index, function(e) {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    });
    
    // Handle window resize
    function handleResize() {
      // ALWAYS 1 SLIDE PER VIEW
      const newSlidesPerView = 1;
      const newSlideWidth = 100;
      maxSlide = Math.max(0, totalSlides - newSlidesPerView);
      
      // Always set slides to 100% width
      $slides.css('width', '100%');
      
      // Adjust current slide if needed (with looping, just ensure it's within bounds)
      if (currentSlide > maxSlide) {
        currentSlide = maxSlide;
      }
      
      // Update position
      const offset = -(currentSlide * newSlideWidth);
      gsap.set($wrapper, { x: offset + '%' });
      
      console.log(`📐 Slider ${index + 1} resized: ${newSlidesPerView} slide per view (looping enabled)`);
    }
    
    $(window).on('resize.slider' + index, handleResize);
    
    // Initial update
    updateSlider();
    
    // PRELOAD IMAGES: Load adjacent slides to prevent delays
    function preloadSlideImages() {
      $slides.each(function(index) {
        const $img = $(this).find('img');
        if ($img.length) {
          // Force image loading by accessing the src
          const img = new Image();
          img.src = $img.attr('src');
          console.log(`🖼️ Preloading image for slide ${index + 1}`);
        }
      });
    }
    
    // Preload all images immediately
    preloadSlideImages();
    
    // Store cleanup function
    const cleanup = function() {
      // Only clean up global navigation for the first slider
      if (index === 0) {
        $globalPrevBtn.off('click.slider');
        $globalNextBtn.off('click.slider');
      }
      $(document).off('keydown.slider' + index);
      $(window).off('resize.slider' + index);
      console.log(`🧹 Slider ${index + 1} cleaned up`);
    };
    
    sliderInstances.push({
      cleanup,
      element: $slider,
      slides: $slides,
      goToSlide,
      getCurrentSlide,
      disable,
      enable
    });
    
    console.log(`✅ GSAP slider ${index + 1} initialized successfully`);
  });
  
  console.log(`🎯 Total GSAP sliders created: ${sliderInstances.length}`);
  
  console.log('✅ GSAP sliders setup started');
}

// ================================================================================
// 🎭 BARBA.JS PAGE TRANSITIONS
// ================================================================================

function initializeBarba() {
  console.log('🎭 Initializing Barba.js transitions...');
  
  barba.init({
    sync: true, 
    
    transitions: [
      {
        name: 'soft-crossfade',
        leave(data) {
          console.log('🌅 CROSSFADE LEAVE: Starting fade out');
          
          // Store scroll position
          scrollPositions[data.current.url.path] = window.scrollY;
          
          // Destroy all page-specific components
          destroySliders();
          destroyScrollAnimations();
          destroyProjectHoverAnimations();
          destroyIndexItemHoverAnimations();
          destroyDetailsPanelAnimations();
          destroySliderOverviewAnimations();
          destroyParallaxAnimations();
          // destroySVGScrollAnimations(); // COMMENTED OUT - Intro animation disabled
          
          // IMPORTANT: Only remove hover listeners. The cursor element and
          // its mousemove listener will persist.
          $(document).off('mouseenter.customCursor mouseleave.customCursor');

          // Simple fade out
          return gsap.to(data.current.container, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
          });
        },
        
        enter(data) {
          console.log('🌅 CROSSFADE ENTER: Starting fade in');
          
          // Check if this is a slider page
          const isSliderPage = data.next.container.querySelector('.swiper');
          
          // Initialize sliders if needed
          if (isSliderPage) {
            initializeSliders();
          }
          
          // Initialize scroll animations for new page
          initializeScrollAnimations();
          
          // Initialize hover animations for new page
          initializeProjectHoverAnimations();
          initializeIndexItemHoverAnimations();
          
          // Initialize details panel animations for new page
          initializeDetailsPanelAnimations();
          
          // Initialize slider overview animations for new page
          initializeSliderOverviewAnimations();
          
          // Initialize parallax animations for new page
          console.log('🔥🔥🔥 [BARBA] ABOUT TO CALL initializeParallaxAnimations() 🔥🔥🔥');
          initializeParallaxAnimations();
          console.log('🔥🔥🔥 [BARBA] AFTER CALLING initializeParallaxAnimations() 🔥🔥🔥');

          // Re-setup hover listeners for the new page's content
          setupCustomCursorListeners();
          
          // Apply random masonry offsets for new page content
          randomizeMasonryOffsets();
          
          // HOMEPAGE ANIMATIONS - Check if we're entering the homepage
          if (data.next.container.querySelector('.studio_svg') || data.next.container.querySelector('.penzlien_svg')) {
            console.log('🎯 Homepage detected in Barba transition');
            
            // CRITICAL: Check stored scroll position to determine if at top
            const nextPagePath = data.next.url.path;
            const storedScrollPosition = scrollPositions[nextPagePath] || 0;
            console.log(`📍 Stored scroll position for homepage: ${storedScrollPosition}px`);
            
            // Pass scroll info to animation function
            animateHomepageElements('Barba transition', storedScrollPosition);
            
            // CRITICAL: Also initialize scroll animations for SVGs
            // COMMENTED OUT - SVG scroll animations disabled
            // initializeSVGScrollAnimations();
          }

          // Simple fade in - NO DELAY
          return gsap.fromTo(data.next.container,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
              onStart: () => console.log('🌅 Enter animation started'),
              onComplete: () => {
                console.log('🌅 Enter animation complete');
                
                // Animate slider slides with stagger if this is a slider page
                if (isSliderPage) {
                  animateSliderEntrance();
                }
              }
            }
          );
        },
         
         after(data) {
           console.log('🔄 After crossfade complete');
           
           // Restore scroll position
           const storedPosition = scrollPositions[data.next.url.path];
           if (storedPosition !== undefined) {
             window.scrollTo(0, storedPosition);
           }
         }
       }
    ],
    
    views: [

      {
        namespace: 'contact',
        afterEnter() {
          console.log('📧 Contact page loaded');
          animateContactPage();
        }
      },
      {
        namespace: 'index',
        afterEnter() {
          console.log('🏠 Index page loaded');
          animateIndexPage();
        }
      },
      {
        namespace: 'studio',
        afterEnter() {
          console.log('🎨 Studio page loaded');
          animateIndexPage(); // Uses same animation as index page since it has .index_item elements
        }
      }
    ]
  });
  
  console.log('✅ Barba.js initialized successfully!');
}

// ================================================================================
// 🎬 SLIDER ENTRANCE ANIMATION
// ================================================================================

function animateSliderEntrance() {
  console.log('✨ Animating slider entrance with stagger');
  
  const slides = document.querySelectorAll('.swiper-slide');
  
  if (slides.length > 0) {
    // Set initial state for slides (hidden and scaled down)
    gsap.set(slides, {
      opacity: 0,
      scale: 0.8,
      y: 0
    });
    
    // Animate slides in with stagger (same as modal opening)
    gsap.to(slides, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.2,  // Same stagger timing as modal
      ease: "power2.out",
      delay: 0.1,
      onComplete: () => {
        console.log('✅ Slider entrance animation complete');
      }
    });
  }
}

// ================================================================================
// 🎨 PAGE-SPECIFIC ANIMATIONS
// ================================================================================


  

  
  // Animate project items with stagger
  gsap.from('.projects_item', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power2.out",
    delay: 0.5
  });
  
// ================================================================================
// 🎨 page load SVGs  
// ================================================================================
  
  

// ================================================================================
// 🧪 UTILITY & TEST FUNCTIONS
// ================================================================================

window.testTransition = function() {
  console.log('🧪 Testing page transition...');
  
  // Simulate a page transition effect
  gsap.to('.page_wrap', {
    opacity: 0,
    scale: 0.95,
    duration: 0.3,
    ease: "power2.inOut",
    onComplete: function() {
      gsap.to('.page_wrap', {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });
};

window.testAnimation = function() {
  console.log('🧪 Test animation function ready');
  animateHomePage();
};

window.testSliders = function() {
  console.log('🎠 Testing slider initialization...');
  initializeSliders();
};

window.testScrollAnimations = function() {
  console.log('📜 Testing scroll animations...');
  initializeScrollAnimations();
};

window.testHoverAnimations = function() {
  console.log('🧪 [TEST] ==================== TESTING HOVER ANIMATIONS ====================');
  console.log('🔧 [TEST] Manually triggering hover animation initialization...');
  initializeProjectHoverAnimations();
  console.log('✅ [TEST] Test complete - check above logs for detailed setup process');
};

window.testDetailsPanelAnimations = function() {
  console.log('🧪 [TEST] ==================== TESTING DETAILS PANEL ANIMATIONS ====================');
  console.log('🔧 [TEST] Manually triggering details panel animation initialization...');
  initializeDetailsPanelAnimations();
  console.log('✅ [TEST] Test complete - check above logs for detailed setup process');
  console.log('💡 [TEST] If on a detail page, click the "Details" trigger to test opening/closing');
};

window.testSliderOverviewAnimations = function() {
  console.log('🧪 [TEST] ==================== TESTING SLIDER OVERVIEW ANIMATIONS ====================');
  console.log('🔧 [TEST] Manually triggering slider overview animation initialization...');
  initializeSliderOverviewAnimations();
  console.log('✅ [TEST] Test complete - check above logs for detailed setup process');
  console.log('💡 [TEST] If on a detail page with slider, click the "Overview" button to test toggle');
};

window.testCustomCursor = function() {
  console.log('🧪 [TEST] ==================== TESTING CUSTOM CURSOR ====================');
  
  // Check cursor state
  console.log('Current state:', customCursorState);
  
  const cursor = document.querySelector('.projects_mouse_label');
  console.log('Cursor element found:', !!cursor);
  
  if (!cursor) {
    console.error('❌ [TEST] Cursor element not found! Check Webflow structure.');
    return;
  }
  
  // Test if mousemove listener is working
  const testMove = (e) => {
    console.log('🖱️ Mouse at:', e.clientX, e.clientY);
    document.removeEventListener('mousemove', testMove);
  };
  document.addEventListener('mousemove', testMove);
  console.log('Move your mouse to test if mousemove listener is working...');
  
  // Test label update
  updateCursorLabel("TEST", true);
  setTimeout(() => updateCursorLabel("", false), 2000);
  
  console.log('✅ Cursor test initiated. Watch console for mouse movement.');
};

window.debugCursorState = function() {
  console.log('🔍 [DEBUG] ==================== CURSOR STATE DEBUG ====================');
  console.log('State:', customCursorState);
  
  const cursor = document.querySelector('.projects_mouse_label');
  console.log('Cursor element found:', !!cursor);
  
  if (cursor) {
    // Force make visible and test positioning
    cursor.style.cssText = `
      position: fixed !important;
      top: 50px !important;
      left: 50px !important;
      background: red !important;
      padding: 20px !important;
      z-index: 9999 !important;
      pointer-events: none !important;
      display: flex !important;
      gap: 10px !important;
      border: 2px solid blue !important;
    `;
    
    const labelText = cursor.querySelector('.label_text');
    const labelDot = cursor.querySelector('.label_dot');
    
    if (labelText) {
      labelText.textContent = 'DEBUG MODE';
      labelText.style.cssText = 'color: white !important; font-size: 16px !important;';
    }
    
    if (labelDot) {
      labelDot.style.cssText = 'background: yellow !important; width: 20px !important; height: 20px !important; border-radius: 50% !important;';
    }
    
    console.log('✅ Cursor forced visible with red background and "DEBUG MODE" text');
    console.log('If you can see this, the cursor element exists and can be styled.');
    
    // Test if we can move it with GSAP
    setTimeout(() => {
      gsap.to(cursor, { x: 200, y: 200, duration: 1 });
      console.log('🎯 Testing GSAP movement to 200,200');
    }, 1000);
    
  } else {
    console.error('❌ Cursor element not found!');
    console.log('All elements with "mouse" or "label":', document.querySelectorAll('[class*="mouse"], [class*="label"]'));
  }
};

// DEBUG: Summary function to explain the hover system
window.explainHoverSystem = function() {
  console.log('📚 [EXPLAIN] ==================== HOVER ANIMATION SYSTEM EXPLANATION ====================');
  console.log('');
  console.log('🎯 [EXPLAIN] PURPOSE:');
  console.log('   Creates smooth fade-in/fade-out effects when hovering over project images');
  console.log('');
  console.log('🏗️ [EXPLAIN] REQUIRED HTML STRUCTURE:');
  console.log('   <div class="project_img_wrap">        <!-- TRIGGER: Mouse hover target -->');
  console.log('     <!-- Your project image content -->');
  console.log('   </div>');
  console.log('   <div class="project_img_overlay">     <!-- ANIMATED: Fades in first -->');
  console.log('     <!-- Overlay content -->');
  console.log('   </div>');
  console.log('   <div class="project_thumb_wrap">      <!-- ANIMATED: Fades in second (staggered) -->');
  console.log('     <!-- Thumbnail content -->');
  console.log('   </div>');
  console.log('');
  console.log('⚡ [EXPLAIN] ANIMATION SEQUENCE:');
  console.log('   1. Mouse enters .project_img_wrap');
  console.log('   2. .project_img_overlay fades in (0.3s)');
  console.log('   3. .project_thumb_wrap fades in (0.3s, starts 0.1s later)');
  console.log('   4. Mouse leaves .project_img_wrap');
  console.log('   5. Both elements fade out together (0.2s, quick response)');
  console.log('');
  console.log('🎛️ [EXPLAIN] CURRENT SETTINGS:');
  console.log('   • Fade-in duration: 0.3 seconds');
  console.log('   • Fade-out duration: 0.2 seconds');
  console.log('   • Stagger delay: 0.1 seconds');
  console.log('   • Easing: power2.out (smooth)');
  console.log('');
  console.log('🔧 [EXPLAIN] WEBFLOW SETUP REQUIRED:');
  console.log('   • Set .project_img_overlay initial opacity to 0');
  console.log('   • Set .project_thumb_wrap initial opacity to 0');
  console.log('   • Position fixed elements work perfectly with GSAP');
  console.log('');
  console.log('🧪 [EXPLAIN] TESTING:');
  console.log('   • Run testHoverAnimations() to reinitialize');
  console.log('   • Watch console for detailed hover logs');
  console.log('   • Look for [HOVER START] and [HOVER END] sections');
  console.log('==================================================================================');
};


// Test transform origin effect
window.testOriginEffect = function(x = 25, y = 75) {
  console.log(`🧪 Testing transform origin effect from ${x}%, ${y}%`);
  
  // Set manual click position
  clickPosition = { x, y };
  
  // Test on the actual container that Barba uses
  const testElement = $('[data-barba="container"]');
  
  console.log(`🧪 Testing on element:`, testElement[0]);
  
  gsap.set(testElement, {
    opacity: 0,
    scale: 0.1,
    transformOrigin: `${x}% ${y}%`
  });
  
  gsap.to(testElement, {
    opacity: 1,
    scale: 1,
    duration: 0.8,
    ease: "expo.inOut",
    onUpdate: function() {
      console.log(`🧪 Test scale: ${gsap.getProperty(testElement[0], 'scale')}`);
    },
    onComplete: () => {
      console.log('✅ Transform origin test complete');
    }
  });
};

// Force test current page scale
window.forceTestScale = function() {
  console.log('🧪 Force testing page scale effect...');
  
  const container = $('[data-barba="container"]');
  
  // Create dramatic scale effect for testing
  gsap.fromTo(container, 
    { 
      scale: 0.1, 
      opacity: 0.5,
      transformOrigin: '25% 75%'
    },
    {
      scale: 1,
      opacity: 1,
      duration: 1.2,
      ease: "expo.inOut",
      onStart: () => console.log('🧪 Forced scale started'),
      onComplete: () => console.log('🧪 Forced scale complete')
    }
  );
};

// ================================================================================
// 📱 DETAILS PANEL ANIMATIONS SYSTEM
// ================================================================================
// This section handles the expandable details panel on project detail pages
// Triggered by clicking the "Details" nav link with ID "Trigger"

/**
 * DETAILS PANEL STATE TRACKING
 * Keeps track of whether the details panel is currently open or closed
 */
let detailsPanelState = {
  isOpen: false,
  isAnimating: false
};

/**
 * CLEANUP FUNCTION FOR DETAILS PANEL
 * Removes all event listeners and resets state
 * Called before page transitions and when reinitializing
 */
function destroyDetailsPanelAnimations() {
  console.log('🧹 [DETAILS CLEANUP] Removing details panel event listeners...');
  
  // Remove click event listeners
  $(document).off('click.detailsPanel', '#Trigger');
  $(document).off('click.detailsPanel');
  
  // Reset state
  detailsPanelState.isOpen = false;
  detailsPanelState.isAnimating = false;
  
  console.log('✅ [DETAILS CLEANUP] Details panel animations cleaned up successfully');
}

/**
 * MAIN INITIALIZATION FUNCTION FOR DETAILS PANEL
 * Sets up the expandable details panel animations
 * - Click "Details" trigger to open panel from bottom
 * - Click outside to close panel
 * - Staggered fade-in of content elements
 */
function initializeDetailsPanelAnimations() {
  console.log('🎯 [DETAILS INIT] Starting details panel animations setup...');
  
  // STEP 1: Clean up any existing listeners first
  console.log('📋 [DETAILS INIT] Step 1: Cleaning up existing listeners...');
  destroyDetailsPanelAnimations();
  
  // STEP 2: Check if we're on a detail page with the required elements
  console.log('🔍 [DETAILS INIT] Step 2: Checking for required elements...');
  const $trigger = $('#Trigger');
  const $detailsWrap = $('.details_wrap');
  const $detailsLayout = $('.details_layout');
  const $projectOverlay = $('.project_img_overlay');
  
  if (!$trigger.length || !$detailsWrap.length) {
    console.log('ℹ️ [DETAILS INIT] Not a detail page or missing elements - skipping details panel setup');
    return;
  }
  
  console.log('✅ [DETAILS INIT] Found required elements:', {
    trigger: $trigger.length > 0 ? '✅ Found' : '❌ Missing',
    detailsWrap: $detailsWrap.length > 0 ? '✅ Found' : '❌ Missing',
    detailsLayout: $detailsLayout.length > 0 ? '✅ Found' : '❌ Missing',
    projectOverlay: $projectOverlay.length > 0 ? '✅ Found' : '❌ Missing'
  });
  
  // STEP 3: Set initial state (details panel hidden)
  console.log('🎨 [DETAILS INIT] Step 3: Setting initial state...');
  gsap.set($detailsWrap, {
    transformOrigin: 'bottom',
    scaleY: 0,
    visibility: 'hidden'
  });
  
  gsap.set($detailsLayout, {
    opacity: 0
  });
  
  // Only animate overlay if it exists
  if ($projectOverlay.length > 0) {
    gsap.set($projectOverlay, {
      opacity: 0
    });
  }
  
  console.log('✅ [DETAILS INIT] Initial state set - panel hidden with scaleY(0)');
  
  // STEP 4: Set up click handler for the trigger button
  console.log('🎨 [DETAILS INIT] Step 4: Setting up trigger click handler...');
  $(document).on('click.detailsPanel', '#Trigger', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔥 [DETAILS TRIGGER] ==================== DETAILS BUTTON CLICKED ====================');
    
    // Prevent multiple animations running at once
    if (detailsPanelState.isAnimating) {
      console.log('⏳ [DETAILS TRIGGER] Animation already in progress, ignoring click');
      return;
    }
    
    if (!detailsPanelState.isOpen) {
      openDetailsPanel();
    } else {
      closeDetailsPanel();
    }
  });
  
  // STEP 5: Set up click handler for closing when clicking outside
  console.log('🎨 [DETAILS INIT] Step 5: Setting up outside click handler...');
  $(document).on('click.detailsPanel', function(e) {
    // Only close if panel is open and click is outside the details wrap
    if (detailsPanelState.isOpen && !$(e.target).closest('.details_wrap').length && !$(e.target).is('#Trigger')) {
      console.log('👆 [DETAILS OUTSIDE] Click detected outside details panel - closing...');
      closeDetailsPanel();
    }
  });
  
  console.log('🎉 [DETAILS INIT] ===== DETAILS PANEL ANIMATIONS READY! =====');
  console.log('📋 [DETAILS INIT] Animation Summary:');
  console.log('   • Click "Details" trigger to open panel from bottom (scaleY 0 → 1)');
  console.log('   • Content fades in with stagger (layout + overlay)');
  console.log('   • Click outside to close panel');
  console.log('   • Uses scaleY animation (works with absolute positioning)');
}

/**
 * OPEN DETAILS PANEL ANIMATION
 * Expands the details panel from bottom and fades in content with stagger
 */
function openDetailsPanel() {
  console.log('🚀 [DETAILS OPEN] ==================== OPENING DETAILS PANEL ====================');
  
  // Set state
  detailsPanelState.isAnimating = true;
  
  const $detailsWrap = $('.details_wrap');
  const $detailsLayout = $('.details_layout');
  const $projectOverlay = $('.project_img_overlay');
  
  // Create timeline for staggered animation
  const openTimeline = gsap.timeline({
    onStart: () => {
      console.log('✨ [DETAILS OPEN] Open animation started');
    },
    onComplete: () => {
      console.log('✅ [DETAILS OPEN] Open animation complete - panel fully opened');
      detailsPanelState.isOpen = true;
      detailsPanelState.isAnimating = false;
    }
  });
  
  console.log('📏 [DETAILS OPEN] Step 1: Expanding panel from bottom using scaleY...');
  
  // ANIMATION SEQUENCE:
  // 1. Scale the details wrap from scaleY(0) to scaleY(1) - grows from bottom
  openTimeline.set($detailsWrap, {
    visibility: 'visible'
  })
  .to($detailsWrap, {
    scaleY: 1,
    duration: 0.6,
    ease: 'power2.out',
    onStart: () => console.log('   📐 [DETAILS OPEN] ScaleY expansion started'),
    onComplete: () => console.log('   ✅ [DETAILS OPEN] ScaleY expansion complete')
  }, 0)
  
  // 2. Fade in the details layout (starts 0.2s after height animation begins)
  .to($detailsLayout, {
    opacity: 1,
    duration: 0.4,
    ease: 'power2.out',
    onStart: () => console.log('   🎭 [DETAILS OPEN] Layout fade-in started'),
    onComplete: () => console.log('   ✅ [DETAILS OPEN] Layout fade-in complete')
  }, 0.2)
  
  // 3. Fade in the project overlay (starts 0.1s after layout fade begins - stagger effect) - ONLY IF IT EXISTS
  if ($projectOverlay.length > 0) {
    openTimeline.to($projectOverlay, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
      onStart: () => console.log('   🌫️ [DETAILS OPEN] Overlay fade-in started (staggered)'),
      onComplete: () => console.log('   ✅ [DETAILS OPEN] Overlay fade-in complete')
    }, 0.3);
  }
  
  console.log('🎬 [DETAILS OPEN] Staggered open animation timeline launched!');
}

/**
 * CLOSE DETAILS PANEL ANIMATION
 * Fades out content and collapses the panel to height 0
 */
function closeDetailsPanel() {
  console.log('💨 [DETAILS CLOSE] ==================== CLOSING DETAILS PANEL ====================');
  
  // Set state
  detailsPanelState.isAnimating = true;
  
  const $detailsWrap = $('.details_wrap');
  const $detailsLayout = $('.details_layout');
  const $projectOverlay = $('.project_img_overlay');
  
  // Create timeline for close animation (reverse order)
  const closeTimeline = gsap.timeline({
    onStart: () => {
      console.log('✨ [DETAILS CLOSE] Close animation started');
    },
    onComplete: () => {
      console.log('✅ [DETAILS CLOSE] Close animation complete - panel fully closed');
      detailsPanelState.isOpen = false;
      detailsPanelState.isAnimating = false;
    }
  });
  
  console.log('🌫️ [DETAILS CLOSE] Step 1: Fading out content simultaneously...');
  
  // CLOSE ANIMATION SEQUENCE:
  // 1. Fade out layout (always exists)
  closeTimeline.to($detailsLayout, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
    onStart: () => console.log('   🌪️ [DETAILS CLOSE] Content fade-out started'),
    onComplete: () => console.log('   ✅ [DETAILS CLOSE] Content fade-out complete')
  }, 0);
  
  // 2. Fade out overlay simultaneously (only if it exists)
  if ($projectOverlay.length > 0) {
    closeTimeline.to($projectOverlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, 0);
  }
  
  // 3. Scale down to 0 (starts shortly after fade-out begins)
  closeTimeline.to($detailsWrap, {
    scaleY: 0,
    duration: 0.4,
    ease: 'power2.in',
    onStart: () => console.log('   📐 [DETAILS CLOSE] ScaleY collapse started'),
    onComplete: () => console.log('   ✅ [DETAILS CLOSE] ScaleY collapse complete')
  }, 0.1)
  
  // 4. Hide completely when animation is done
  .set($detailsWrap, {
    visibility: 'hidden'
  });
  
  console.log('🏁 [DETAILS CLOSE] Close animation timeline launched!');
}

// ================================================================================
// 🌐 SLIDER OVERVIEW TOGGLE SYSTEM
// ================================================================================
// This section handles toggling between slider mode and overview (grid) mode
// on project detail pages with GSAP sliders

/**
 * SLIDER OVERVIEW STATE TRACKING
 * Keeps track of whether the slider is in overview mode or slider mode
 */
let sliderOverviewState = {
  isOverviewMode: false,
  isAnimating: false
};

/**
 * CLEANUP FUNCTION FOR SLIDER OVERVIEW
 * Removes all event listeners and resets state
 * Called before page transitions and when reinitializing
 */
function destroySliderOverviewAnimations() {
  console.log('🧹 [OVERVIEW CLEANUP] Removing slider overview event listeners...');
  
  // Remove click event listeners
  $(document).off('click.sliderOverview', '#Overview');
  $('.swiper-wrapper').off('click.sliderOverview', '.swiper-slide');
  
  // CRITICAL: Clean up DOM state completely
  const $swiper = $('.swiper');
  const $swiperWrapper = $('.swiper-wrapper');
  const $overviewBtn = $('#Overview');
  
  if ($swiper.length && $swiperWrapper.length) {
    // Remove all overview classes
    $swiperWrapper.removeClass('is-overview');
    $swiper.removeClass('overview-active');
    $overviewBtn.removeClass('active');
    
    // Re-enable slider if it was disabled
    const sliderInstance = sliderInstances.length > 0 ? sliderInstances[0] : null;
    if (sliderInstance && sliderInstance.enable) {
      sliderInstance.enable();
    }
    
    console.log('🎯 [OVERVIEW CLEANUP] DOM classes cleaned, slider re-enabled');
  }
  
  // Reset state
  sliderOverviewState.isOverviewMode = false;
  sliderOverviewState.isAnimating = false;
  
  console.log('✅ [OVERVIEW CLEANUP] Slider overview animations cleaned up successfully');
}

/**
 * MAIN INITIALIZATION FUNCTION FOR SLIDER OVERVIEW
 * Sets up the toggle between slider mode and overview (grid) mode
 * - Click "Overview" to show all slides at once
 * - Click again to return to slider mode
 */
function initializeSliderOverviewAnimations() {
  console.log('🎯 [OVERVIEW INIT] Starting slider overview toggle setup...');
  
  // STEP 1: Clean up any existing listeners first
  console.log('📋 [OVERVIEW INIT] Step 1: Cleaning up existing listeners...');
  destroySliderOverviewAnimations();
  
  // STEP 2: Check if we're on a page with slider and overview button
  console.log('🔍 [OVERVIEW INIT] Step 2: Checking for required elements...');
  const $overviewBtn = $('#Overview');
  const $swiper = $('.swiper');
  const $swiperWrapper = $('.swiper-wrapper');
  const $slides = $('.swiper-slide');
  
  if (!$overviewBtn.length || !$swiper.length || !$swiperWrapper.length) {
    console.log('ℹ️ [OVERVIEW INIT] Not a slider page or missing elements - skipping overview toggle setup');
    return;
  }
  
  console.log('✅ [OVERVIEW INIT] Found required elements:', {
    overviewBtn: $overviewBtn.length > 0 ? '✅ Found' : '❌ Missing',
    swiper: $swiper.length > 0 ? '✅ Found' : '❌ Missing',
    swiperWrapper: $swiperWrapper.length > 0 ? '✅ Found' : '❌ Missing',
    slides: $slides.length
  });
  
  // Get the primary slider instance for this page
  const sliderInstance = sliderInstances[0]; // Assuming one slider per page
  
  // STEP 3: Add CSS for overview mode
  console.log('🎨 [OVERVIEW INIT] Step 3: Adding overview mode CSS...');
  const overviewCSS = `
    <style id="slider-overview-css">
      /* Ghost clickable elements are already hidden via main slider CSS */
    </style>
  `;
  
  // Remove existing styles and add new ones
  $('#slider-overview-css').remove();
  $('head').append(overviewCSS);
  
  // STEP 4: Set up click handler for the overview toggle
  console.log('🎨 [OVERVIEW INIT] Step 4: Setting up overview toggle click handler...');
  $(document).on('click.sliderOverview', '#Overview', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔥 [OVERVIEW TRIGGER] ==================== OVERVIEW BUTTON CLICKED ====================');
    
    // Prevent multiple animations running at once
    if (sliderOverviewState.isAnimating) {
      console.log('⏳ [OVERVIEW TRIGGER] Animation already in progress, ignoring click');
      return;
    }
    
    if (!sliderOverviewState.isOverviewMode) {
      activateOverviewMode();
    } else {
      deactivateOverviewMode();
    }
  });
  
  // STEP 5: Set up click handler for slides in overview mode
  console.log('🎨 [OVERVIEW INIT] Step 5: Setting up slide click handler for navigation...');
  $swiperWrapper.on('click.sliderOverview', '.swiper-slide', function(e) {
    console.log('🖱️ [THUMBNAIL CLICK] Slide clicked!', {
      isOverviewMode: sliderOverviewState.isOverviewMode,
      isAnimating: sliderOverviewState.isAnimating,
      target: e.target,
      currentTarget: this
    });
    
    // Only act if we are in overview mode
    if (!sliderOverviewState.isOverviewMode || sliderOverviewState.isAnimating) {
      console.log('❌ [THUMBNAIL CLICK] Click ignored - not in overview mode or animating');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const slideIndex = $(this).index();
    console.log(`🖼️ [OVERVIEW NAV] Clicked on thumbnail for slide index: ${slideIndex}`);
    
    // Use the exposed slider controls to go to the correct slide (without animation)
    if (sliderInstance && sliderInstance.goToSlide) {
      sliderInstance.goToSlide(slideIndex, false);
      console.log(`✅ [OVERVIEW NAV] Navigated to slide ${slideIndex}`);
    } else {
      console.warn('❌ [OVERVIEW NAV] No slider instance available');
    }
    
    // Deactivate overview mode to return to the slider
    deactivateOverviewMode();
  });
  
  console.log('🎉 [OVERVIEW INIT] ===== SLIDER OVERVIEW TOGGLE READY! =====');
  console.log('📋 [OVERVIEW INIT] Animation Summary:');
  console.log('   • Click "Overview" to show all slides at once (grid mode)');
  console.log('   • Click again to return to slider mode');
  console.log('   • Smooth GSAP transitions between modes');
  console.log('   • Navigation buttons hide/show automatically');
}

/**
 * ACTIVATE OVERVIEW MODE
 * Transform slider into grid layout showing all slides with smooth animation
 */
function activateOverviewMode() {
  console.log('🌐 [OVERVIEW ON] ==================== ACTIVATING OVERVIEW MODE ====================');
  
  // Set state IMMEDIATELY 
  sliderOverviewState.isAnimating = true;
  
  // --- DEBUG: Add body class using Vanilla JS for reliability ---
  console.log("   - Will attempt to add 'overview-mode' to body...");
  console.log("   - Class list BEFORE:", document.body.className);
  document.body.classList.add('overview-mode');
  console.log("   - Class list AFTER:", document.body.className);
  console.log("   - Successfully added 'overview-mode' to body.");

  const $overviewBtn = $('#Overview');
  const $swiper = $('.swiper');
  const $swiperWrapper = $('.swiper-wrapper');
  const $slides = $('.swiper-slide');
  const $navButtons = $('#bw, #ffwd'); // CORRECT: Use the correct IDs
  
  // CRITICAL: Disable slider functionality first
  const sliderInstance = sliderInstances.length > 0 ? sliderInstances[0] : null;
  if (sliderInstance && sliderInstance.disable) {
    sliderInstance.disable();
  }
  
  // Create timeline for smooth transition
  const activateTimeline = gsap.timeline({
    onStart: () => {
      console.log('✨ [OVERVIEW ON] Overview activation started');
    },
    onComplete: () => {
      console.log('✅ [OVERVIEW ON] Overview mode activated - all slides visible');
      sliderOverviewState.isAnimating = false;
      sliderOverviewState.isOverviewMode = true; // State updated on completion
    }
  });
  
  console.log('🎭 [OVERVIEW ON] Step 1: Simple smooth transition to grid...');
  
  // ANIMATION SEQUENCE:
  // 1. Fade out slides with scale effect
  activateTimeline.to($slides, {
    scale: 0.9,
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: 'power2.inOut',
    onStart: () => console.log('   📉 [OVERVIEW ON] Fading out slides for transition'),
    onComplete: () => {
      console.log('   ✅ [OVERVIEW ON] Slides faded out');
      
      // 2. Reset wrapper position while slides are invisible (no visual jump)
      gsap.set($swiperWrapper, { x: '0%' });
      console.log('   🔄 [OVERVIEW ON] Wrapper position reset for grid layout');
      
      // 3. Add classes and update layout (happens instantly when slides are hidden)
      $swiperWrapper.addClass('is-overview');
      $swiper.addClass('overview-active');
      $overviewBtn.addClass('active');
      console.log('   🏷️ [OVERVIEW ON] Classes added for grid layout');
      
      // 4. Stagger slides back in
      gsap.to($slides, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1
      });
    }
  }, 0);
  
  console.log('🚀 [OVERVIEW ON] Overview activation timeline launched!');
}

/**
 * DEACTIVATE OVERVIEW MODE
 * Return to normal slider layout with smooth animation
 */
function deactivateOverviewMode() {
  console.log('🎠 [OVERVIEW OFF] ==================== DEACTIVATING OVERVIEW MODE ====================');
  
  // Set state IMMEDIATELY
  sliderOverviewState.isAnimating = true;
  sliderOverviewState.isOverviewMode = false; // State updated on completion
  
  // --- DEBUG: Remove body class using Vanilla JS for reliability ---
  console.log("   - Will attempt to remove 'overview-mode' from body...");
  console.log("   - Class list BEFORE:", document.body.className);
  document.body.classList.remove('overview-mode');
  console.log("   - Class list AFTER:", document.body.className);
  console.log("   - Successfully removed 'overview-mode' from body.");

  const $overviewBtn = $('#Overview');
  const $swiper = $('.swiper');
  const $swiperWrapper = $('.swiper-wrapper');
  const $slides = $('.swiper-slide');
  const $navButtons = $('#bw, #ffwd'); // CORRECT: Use the correct IDs
  
  // Create timeline for smooth transition back
  const deactivateTimeline = gsap.timeline({
    onStart: () => {
      console.log('✨ [OVERVIEW OFF] Overview deactivation started');
    },
    onComplete: () => {
      console.log('✅ [OVERVIEW OFF] Slider mode restored - carousel behavior active');
      sliderOverviewState.isAnimating = false;
      
      // CRITICAL: Re-enable slider functionality after animation
      const sliderInstance = sliderInstances.length > 0 ? sliderInstances[0] : null;
      if (sliderInstance && sliderInstance.enable) {
        sliderInstance.enable();
      }
    }
  });
  
  console.log('🎭 [OVERVIEW OFF] Step 1: Fading out grid to reveal slider...');
  
  const sliderInstance = sliderInstances.length > 0 ? sliderInstances[0] : null;

  // ANIMATION SEQUENCE:
  // 1. Fade out all the slides in the grid
  deactivateTimeline.to($slides, {
    duration: 0.4,
    opacity: 0,
    scale: 0.9,
    ease: 'power2.inOut',
    stagger: 0.05,
    onComplete: () => {
      // 2. After they are faded out, change the classes
      $swiperWrapper.removeClass('is-overview');
      $swiper.removeClass('overview-active');
      $overviewBtn.removeClass('active');
      console.log('   🏷️ [OVERVIEW OFF] Classes removed, slider layout restored.');

      // Resync the slider's visual position instantly
      if (sliderInstance) {
        sliderInstance.goToSlide(sliderInstance.getCurrentSlide(), false);
      }

      // 3. Explicitly animate FROM invisible TO visible using fromTo for robustness
      gsap.fromTo([$slides, $navButtons], 
        { // FROM state
          opacity: 0,
          scale: 0.9
        }, 
        { // TO state
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out',
          stagger: {
            each: 0.05,
            from: "start"
          }
        }
      );
    }
  });
}

// ================================================================================
// 🎨 REUSABLE HOMEPAGE ANIMATIONS
// ================================================================================

/**
 * CENTRALIZED HOMEPAGE ANIMATION FUNCTION
 * Handles hero wrap height animation (SVG animations disabled)
 * Called from: direct page load, Barba transitions, and index page view
 */
function animateHomepageElements(context = 'unknown', overrideScrollY = null) {
  console.log(`🎨 Starting homepage animations (${context})...`);
  
  const heroWrap = document.querySelector('.hero_wrap');
  
  // Hero wrap - only animate ONCE per session
  if (heroWrap) {
    console.log(`🔍 Current hero_wrap height (${context}):`, getComputedStyle(heroWrap).height);
    
    if (!heroAnimationPlayed) {
      // FIRST TIME: Animate to 70vh
      console.log(`🎬 First session load - animating hero_wrap to 70vh (${context})`);
      gsap.fromTo(heroWrap, 
        {
          height: getComputedStyle(heroWrap).height
        },
        {
          height: '70vh',
          duration: 0.8,
          ease: "power2.out",
          delay: 0.8, // Reduced from 1.8s since no SVG animation
          onStart: () => console.log(`✨ Hero wrap animating to 70vh height (${context})`),
          onComplete: () => {
            console.log(`✅ Hero wrap animation complete (${context})`);
            heroAnimationPlayed = true; // Mark as played for session
          }
        }
      );
    } else {
      // SUBSEQUENT TIMES: Set to 70vh immediately (no animation)
      console.log(`🔄 Hero animation already played this session - setting to 70vh instantly (${context})`);
      gsap.set(heroWrap, { height: '70vh' });
    }
  } else {
    console.log(`ℹ️ No .hero_wrap found (${context})`);
  }
}

/**
 * SCROLL-TRIGGERED SVG ANIMATIONS
 * Fade out SVGs on scroll down (reverse stagger)
 * Fade in SVGs on scroll up (normal stagger)
 * 
 * COMMENTED OUT - Intro animation disabled
 */
/*
let lastScrollY = 0;
let svgsVisible = true;
let svgScrollHandler = null; // Store reference for cleanup
let svgScrollInitialized = false; // Prevent multiple initialization
let scrollTimeout = null; // For detecting when scrolling stops

function initializeSVGScrollAnimations() {
  // CRITICAL: Don't initialize if already running
  if (svgScrollInitialized) {
    console.log('⚠️ SVG scroll animations already initialized - skipping');
    return;
  }
  
  console.log('📜 Initializing SVG scroll animations...');
  
  const svgElements = document.querySelectorAll('.studio_svg, .penzlien_svg');
  
  if (svgElements.length === 0) {
    console.log('ℹ️ No SVG elements found for scroll animations');
    return;
  }
  
  svgScrollHandler = function handleSVGScroll() {
    const currentScrollY = window.scrollY;
    const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
    const isAtTop = currentScrollY <= 50;
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Handle immediate scroll actions
    if (currentScrollY > 50) { // Past initial position
      
      if (scrollDirection === 'down' && svgsVisible) {
        // SCROLL DOWN: Fade out with reverse stagger
        console.log('🔽 Scrolling down - fading out SVGs (reverse stagger)');
        gsap.to(['.penzlien_svg', '.studio_svg'], { // REVERSE ORDER
          opacity: 0,
          duration: 0.4,
          stagger: 0.1, // Penzlien first, then studio
          ease: "power2.out"
        });
        svgsVisible = false;
        
      } else if (scrollDirection === 'up' && !svgsVisible) {
        // SCROLL UP: Fade in with normal stagger (temporarily)
        console.log('🔼 Scrolling up - fading in SVGs temporarily (normal stagger)');
        gsap.to(['.studio_svg', '.penzlien_svg'], { // NORMAL ORDER
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1, // Studio first, then penzlien
          ease: "power2.out"
        });
        svgsVisible = true;
      }
      
      // Set timeout to fade out when scrolling stops (unless at top)
      scrollTimeout = setTimeout(() => {
        if (window.scrollY > 50 && svgsVisible) {
          console.log('⏸️ Scrolling stopped (not at top) - fading out SVGs');
          gsap.to(['.penzlien_svg', '.studio_svg'], {
            opacity: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out"
          });
          svgsVisible = false;
        }
      }, 150); // 150ms delay after scrolling stops
      
    } else if (isAtTop && !svgsVisible) {
      // At top - ensure SVGs are visible and stay visible
      console.log('🔝 At top of page - showing SVGs permanently');
      gsap.to(['.studio_svg', '.penzlien_svg'], {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out"
      });
      svgsVisible = true;
    }
    
    lastScrollY = currentScrollY;
  }; // End of svgScrollHandler function
  
  // Add scroll listener
  window.addEventListener('scroll', svgScrollHandler, { passive: true });
  svgScrollInitialized = true; // Mark as initialized
  console.log('✅ SVG scroll animations initialized');
}
*/

/*
function destroySVGScrollAnimations() {
  console.log('🧹 Cleaning up SVG scroll animations...');
  if (svgScrollHandler) {
    window.removeEventListener('scroll', svgScrollHandler);
    svgScrollHandler = null;
  }
  // Clear any pending timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }
  // Reset all state
  lastScrollY = 0;
  svgsVisible = true;
  svgScrollInitialized = false; // Allow re-initialization
  console.log('✅ SVG scroll animations cleaned up');
}
*/

// ================================================================================
// 🎨 PAGE-SPECIFIC ANIMATIONS
// ================================================================================

function animateIndexPage() {
  console.log('📋 Animating index page elements...');
  
  const indexItems = document.querySelectorAll('.index_item');
  
  if (indexItems.length > 0) {
    // Set initial state (hidden and slightly below, matched to project_masonry_item)
    gsap.set(indexItems, {
      opacity: 0,
      y: 30  // Increased from 20 to match masonry y position
    });
    
    // Animate in with stagger (matched to project_masonry_item timing)
    gsap.to(indexItems, {
      opacity: 1,
      y: 0,
      stagger: 0.1,       // Increased from 0.02 to match masonry stagger timing
      duration: 0.8,      // Increased from 0.2 to match masonry duration
      ease: 'power2.out', // Changed from power1.out to match masonry easing
      delay: 0.2
    });
    
    console.log(`✅ Animated ${indexItems.length} index items with stagger`);
  } else {
    console.log('ℹ️ No .index_item elements found on this page');
  }
  
  // HOMEPAGE ANIMATIONS - Clean single function call
  animateHomepageElements('index page view');
  
  // CRITICAL: Also initialize scroll animations for SVGs
  // COMMENTED OUT - SVG scroll animations disabled
  // initializeSVGScrollAnimations();
}

function animateContactPage() {
  console.log('📧 Animating contact page elements...');
  
  // Add contact page specific animations here
  const contactContent = document.querySelector('.contact-content');
  if (contactContent) {
    gsap.from('.contact-content', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.3
    });
  }
}
