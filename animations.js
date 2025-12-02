console.log('🎨 Animations.js loaded');

// INJECT CSS IMMEDIATELY to prevent flash before page animation
(function() {
  const style = document.createElement('style');
  style.id = 'barba-initial-hide';
  style.textContent = `
    [data-barba="container"] {
      opacity: 0;
    }
    /* Hide slider_nav_wrap initially - it's outside Barba container but needs intro animation */
    .slider_nav_wrap > * {
      opacity: 0;
    }
    /* Nav toggle links - visibility controlled by JS */
    /* Initial state set by updateNavLinksVisibility() */
  `;
  document.head.appendChild(style);
  console.log('🎨 Injected opacity:0 CSS to prevent flash');
  
  // IMMEDIATE SCROLL TO TOP - Disable browser scroll restoration and scroll to top
  // This runs as early as possible to prevent seeing wrong scroll position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  console.log('🔝 Immediate scroll to top on page load');
})();

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

// Track previous page for "Close" navigation (not history.back which is unreliable)
let previousPageUrl = '/';

// ================================================================================
// 🔄 SCROLL POSITION HELPERS (Modal-like behavior)
// ================================================================================
// Only remember scroll when navigating TO project detail pages
// Don't remember scroll when navigating between main index pages

/**
 * Check if a path is a "main index" page (home or home-index)
 * These pages should NOT remember scroll position between each other
 * / = home (thumbnail view)
 * /home-index = index (list view)
 */
function isMainIndexPage(path) {
  const normalizedPath = path.replace(/\/$/, '') || '/'; // Remove trailing slash, default to /
  return normalizedPath === '/' || 
         normalizedPath === '/home-index';
}

/**
 * Check if a path is the homepage (projects thumbnail view)
 * URL: / (root)
 */
function isHomePage(path) {
  const normalizedPath = path.replace(/\/$/, '').replace(/\.html$/, '') || '/';
  console.log('🔍 [NAV] isHomePage check:', path, '→', normalizedPath);
  return normalizedPath === '/';
}

/**
 * Check if a path is the index page (list view)
 * URL: /home-index
 */
function isIndexPage(path) {
  const normalizedPath = path.replace(/\/$/, '').replace(/\.html$/, '') || '/';
  console.log('🔍 [NAV] isIndexPage check:', path, '→', normalizedPath);
  return normalizedPath === '/home-index';
}

/**
 * UPDATE NAV LINKS VISIBILITY
 * On homepage: show #index, hide #home
 * On index page: show #home, hide #index
 * @param {string} path - Optional path to use (for Barba transitions where URL may not be updated yet)
 */
function updateNavLinksVisibility(path) {
  const currentPath = path || window.location.pathname;
  const $homeLink = $('#home');
  const $indexLink = $('#index');
  
  console.log('🔗 [NAV] Updating nav visibility for path:', currentPath);
  
  if (!$homeLink.length || !$indexLink.length) {
    console.log('ℹ️ [NAV] Nav links #home or #index not found');
    return;
  }
  
  if (isHomePage(currentPath)) {
    // On homepage: show Index, hide Home
    console.log('🏠 [NAV] Homepage detected - showing Index, hiding Home');
    gsap.set($indexLink, { opacity: 1, pointerEvents: 'auto' });
    $indexLink.removeClass('u-pointer-off');
    gsap.set($homeLink, { opacity: 0, pointerEvents: 'none' });
    $homeLink.addClass('u-pointer-off');
  } else if (isIndexPage(currentPath)) {
    // On index page: show Home, hide Index
    console.log('📋 [NAV] Index page detected - showing Home, hiding Index');
    gsap.set($homeLink, { opacity: 1, pointerEvents: 'auto' });
    $homeLink.removeClass('u-pointer-off');
    gsap.set($indexLink, { opacity: 0, pointerEvents: 'none' });
    $indexLink.addClass('u-pointer-off');
  } else {
    // On other pages (projects, contact, etc): show both
    console.log('📄 [NAV] Other page - showing both nav links');
    gsap.set([$homeLink, $indexLink], { opacity: 1, pointerEvents: 'auto' });
    $homeLink.removeClass('u-pointer-off');
    $indexLink.removeClass('u-pointer-off');
  }
}

/**
 * Check if a path is a project detail page
 * These are the "modal" pages - when leaving them, restore scroll
 */
function isProjectDetailPage(path) {
  const normalizedPath = path.replace(/\/$/, '');
  // Project detail pages typically have /projects/ in the path or similar patterns
  // Also include any page that's not a main index page (for safety)
  return normalizedPath.includes('/projects/') || 
         normalizedPath.includes('/project/') ||
         (!isMainIndexPage(normalizedPath) && normalizedPath !== '/contact' && normalizedPath !== '/studio');
}

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
  labelText: null
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
  customCursorState = { isInitialized: false, cursor: null, labelText: null };
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

  // PROJECT LINKS: Always show "View" and scale dot
  $(document).on('mouseenter.customCursor', '.project_link', function() {
    updateCursorLabel("View", true);
  });
  $(document).on('mouseleave.customCursor', '.project_link', () => updateCursorLabel("", false));

  // NAVIGATION ITEMS: Scale dot, no text
  $(document).on('mouseenter.customCursor', '.nav_link, .footer_link', () => updateCursorLabel("", true));
  $(document).on('mouseleave.customCursor', '.nav_link, .footer_link', () => updateCursorLabel("", false));
  
  // SLIDER NAVIGATION: Show current slide count (e.g. "1 / 11")
  // Hide in overview mode
  function getSlideCountLabel() {
    // Don't show count in overview mode
    if (sliderOverviewState.isOverviewMode) {
      return "";
    }
    if (sliderInstances.length > 0) {
      const slider = sliderInstances[0];
      const current = slider.getCurrentSlide() + 1; // 1-based for display
      const total = slider.slides.length;
      return `${current} / ${total}`;
    }
    return "";
  }
  
  // Update cursor on hover
  $(document).on('mouseenter.customCursor', '#bw, #ffwd, .swiper-slide', function() {
    updateCursorLabel(getSlideCountLabel(), true);
  });
  $(document).on('mouseleave.customCursor', '#bw, #ffwd, .swiper-slide', () => updateCursorLabel("", false));
  
  // Update cursor after clicking nav buttons (with small delay for slide change)
  $(document).on('click.customCursor', '#bw, #ffwd', function() {
    setTimeout(() => {
      updateCursorLabel(getSlideCountLabel(), true);
    }, 50);
  });

  // DETAILS WRAP: Show "Close" when hovering over the open details panel
  $(document).on('mouseenter.customCursor', '.details_wrap', function() {
    if (detailsPanelState.isOpen) {
      updateCursorLabel("Close", true);
    }
  });
  $(document).on('mouseleave.customCursor', '.details_wrap', () => updateCursorLabel("", false));

  // PROJECTS WRAP: Hide label text inside projects list
  $(document).on('mouseenter.customCursor', '.projects_wrap', () => updateCursorLabel("", false));

  // SLIDER PAGE: Show "Close" when OUTSIDE .slider_ghost_wrap (the far left/right margins)
  $(document).on('mouseenter.sliderClose', '.slider_wrap', function(e) {
    // Only trigger when entering slider_wrap but NOT on ghost_wrap or its children
    const $target = $(e.target);
    if ($target.closest('.slider_ghost_wrap').length === 0 && !sliderOverviewState.isOverviewMode) {
      updateCursorLabel("Close", true);
    }
  });
  
  $(document).on('mousemove.sliderClose', '.slider_wrap', function(e) {
    if (sliderOverviewState.isOverviewMode) return;
    
    const $target = $(e.target);
    // If we're directly on slider_wrap (not inside ghost_wrap), show Close
    if ($target.closest('.slider_ghost_wrap').length === 0) {
      updateCursorLabel("Close", true);
    }
  });
  
  $(document).on('click.sliderClose', '.slider_wrap', function(e) {
    if (sliderOverviewState.isOverviewMode) return;
    
    const $target = $(e.target);
    // If clicking on slider_wrap but NOT inside ghost_wrap, go to stored previous page
    if ($target.closest('.slider_ghost_wrap').length === 0) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ [SLIDER CLOSE] Using barba.go() to:', previousPageUrl);
      barba.go(previousPageUrl);
    }
  });

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
 * Changes the cursor text and scales cursor
 * Default: cursor is small (0.5), on hover grows to normal (1.0)
 * Counter-scales the text so it stays the same size
 */
function updateCursorLabel(text, isHovering = false) {
  if (customCursorState.cursor && customCursorState.labelText) {
    customCursorState.labelText.textContent = text || '';
    
    // Default small (0.5), grow to normal (1.0) on hover
    const cursorScale = isHovering ? 1 : 0.5;
    const textScale = isHovering ? 1 : 2; // Counter-scale: when cursor is 0.5, text is 2x to stay same size
    
    gsap.to(customCursorState.cursor, {
      scale: cursorScale,
      duration: 0.15,
      ease: 'power2.out'
    });
    
    gsap.to(customCursorState.labelText, {
      scale: textScale,
      duration: 0.15,
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
  
  if (!cursor || !labelText) {
    console.warn('❌ [CURSOR INIT] Cursor elements not found. Aborting.');
    return;
  }
  
  // Store references ONCE
  customCursorState.cursor = cursor;
  customCursorState.labelText = labelText;
  
  // Set initial position and state to prevent cursor appearing at (0,0)
  // Start small (0.5 scale) - grows to 1.0 on hover
  gsap.set(cursor, {
    x: -100, // Start off-screen
    y: -100,
    opacity: 0, // Start invisible until first mouse movement
    scale: 0.5 // Default small size
  });
  
  // Counter-scale text so it appears normal size when cursor is small
  gsap.set(labelText, {
    scale: 2
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
  
  // DISABLE BROWSER SCROLL RESTORATION - Always start at top on refresh
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
    console.log('🔝 Browser scroll restoration disabled - refresh starts at top');
  }
  
  // Always scroll to top on page load (handles refresh)
  window.scrollTo(0, 0);
  
  // Update nav links visibility based on current page
  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    updateNavLinksVisibility();
  }, 50);
  
  // PREVENT SAME-PAGE NAVIGATION - Stop clicks on links to current page
  $(document).on('click', 'a', function(e) {
    const linkPath = new URL(this.href, window.location.origin).pathname;
    const currentPath = window.location.pathname;
    
    if (linkPath === currentPath) {
      e.preventDefault();
      e.stopPropagation();
      console.log('⛔ Blocked same-page navigation:', linkPath);
      return false;
    }
  });
  
  // Back button - navigate to previous page
  $(document).on('click', '#is-back', function(e) {
    e.preventDefault();
    console.log('⬅️ [BACK] Navigating to previous page...');
    history.back();
  });
  
  // Track click positions for transform origin effect
  $(document).on('click', 'a, .w-inline-block, [data-wf-page], .clickable_link', function(e) {
    // Skip if click was on HTML or BODY (likely bubbled up)
    if (this.tagName === 'HTML' || this.tagName === 'BODY') {
      return;
    }
    
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
    initializeProjectsItemHoverAnimations();
    initializeThumbsProjectsListHoverAnimations();
    initializeDetailsPanelAnimations();
    initializeSliderOverviewAnimations();
    
    // Animate sections on page load with stagger
    animateThumbsSection();
    animateProjectsLayout();
    
    // CRITICAL: Initialize cursor ONCE on page load
    initializeCustomCursor();
    
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
// 🎯 THUMBS PROJECTS LIST HOVER ANIMATIONS (SCALE)
// ================================================================================

/**
 * CLEANUP FUNCTION FOR THUMBS PROJECTS LIST HOVER ANIMATIONS
 * Removes all event listeners before page transitions
 */
function destroyThumbsProjectsListHoverAnimations() {
  console.log('🧹 [THUMBS LIST CLEANUP] Removing thumbs projects list hover listeners...');
  $(document).off('mouseenter.thumbsListHover mouseleave.thumbsListHover', '.thumbs_id_wrap .projects_list .projects_item');
  console.log('✅ [THUMBS LIST CLEANUP] Thumbs projects list hover animations cleaned up');
}

/**
 * INITIALIZE THUMBS PROJECTS LIST HOVER ANIMATIONS
 * Scales .projects_img_wrap to 102% on hover
 * ONLY targets .projects_item inside .projects_list inside .thumbs_id_wrap
 */
function initializeThumbsProjectsListHoverAnimations() {
  console.log('🎯 [THUMBS LIST HOVER] Starting thumbs projects list hover animations...');
  
  // Clean up any existing listeners first
  destroyThumbsProjectsListHoverAnimations();
  
  const projectsItems = $('.thumbs_id_wrap .projects_list .projects_item');
  
  if (projectsItems.length === 0) {
    console.log('ℹ️ [THUMBS LIST HOVER] No .projects_item elements found inside .thumbs_id_wrap .projects_list');
    return;
  }
  
  console.log(`✅ [THUMBS LIST HOVER] Found ${projectsItems.length} projects items - setting up scale hovers...`);
  
  // Mouse enter - scale up
  $(document).on('mouseenter.thumbsListHover', '.thumbs_id_wrap .projects_list .projects_item', function() {
    const $imgWrap = $(this).find('.projects_img_wrap');
    
    if ($imgWrap.length) {
      gsap.killTweensOf($imgWrap);
      
      gsap.to($imgWrap, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });
  
  // Mouse leave - scale back to normal
  $(document).on('mouseleave.thumbsListHover', '.thumbs_id_wrap .projects_list .projects_item', function() {
    const $imgWrap = $(this).find('.projects_img_wrap');
    
    if ($imgWrap.length) {
      gsap.killTweensOf($imgWrap);
      
      gsap.to($imgWrap, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });
  
  console.log('✅ [THUMBS LIST HOVER] Thumbs projects list hover animations initialized');
}

// ================================================================================
// 🎯 PROJECTS ITEM HOVER ANIMATIONS (SLIDE IN)
// ================================================================================

/**
 * CLEANUP FUNCTION FOR PROJECTS ITEM HOVER ANIMATIONS
 * Removes all event listeners before page transitions
 */
function destroyProjectsItemHoverAnimations() {
  console.log('🧹 [PROJECTS HOVER CLEANUP] Removing projects item hover listeners...');
  $(document).off('mouseenter.projectsItemHover mouseleave.projectsItemHover', '.projects_wrap .projects_item');
  console.log('✅ [PROJECTS HOVER CLEANUP] Projects item hover animations cleaned up');
}

/**
 * INITIALIZE PROJECTS ITEM HOVER ANIMATIONS
 * Slides .projects_img_wrap from xPercent: 100 to 0 on hover
 * Reverses on hover out
 * Only targets .projects_item inside .projects_wrap
 * Only on desktop (992px+) - smaller screens show image always visible
 */
function initializeProjectsItemHoverAnimations() {
  console.log('🎯 [PROJECTS HOVER INIT] Starting projects item hover animations...');
  
  // Clean up any existing listeners first
  destroyProjectsItemHoverAnimations();
  
  const projectsItems = $('.projects_wrap .projects_item');
  
  if (projectsItems.length === 0) {
    console.log('ℹ️ [PROJECTS HOVER INIT] No .projects_item elements found inside .projects_wrap');
    return;
  }
  
  // Check if desktop (992px+)
  const isDesktop = window.innerWidth >= 992;
  
  if (!isDesktop) {
    console.log('📱 [PROJECTS HOVER INIT] Mobile/tablet detected - keeping images visible, no hover animation');
    // Ensure images are visible on mobile/tablet
    projectsItems.each(function() {
      const $imgWrap = $(this).find('.projects_img_wrap');
      if ($imgWrap.length) {
        gsap.set($imgWrap, { xPercent: 0 });
      }
    });
    return;
  }
  
  console.log(`✅ [PROJECTS HOVER INIT] Desktop detected - Found ${projectsItems.length} projects items - setting up hovers...`);
  
  // Set initial state - .projects_img_wrap starts offset -101% to the left (extra 1% hides border)
  projectsItems.each(function() {
    const $imgWrap = $(this).find('.projects_img_wrap');
    if ($imgWrap.length) {
      gsap.set($imgWrap, { xPercent: -101 });
    }
  });
  
  // Mouse enter - slide in from right (fast & snappy)
  $(document).on('mouseenter.projectsItemHover', '.projects_wrap .projects_item', function() {
    const $imgWrap = $(this).find('.projects_img_wrap');
    const $textWrap = $(this).find('.projects_text_wrap');
    
    if ($imgWrap.length) {
      // Kill any existing animations for responsive hover-in
      gsap.killTweensOf($imgWrap);
      
      // Slide in to normal position - instant start, soft landing
      gsap.to($imgWrap, {
        xPercent: 0,
        duration: 0.15,
        ease: "power3.out"
      });
    }
    
    if ($textWrap.length) {
      gsap.killTweensOf($textWrap);
      
      // Move text to the right by 1rem
      gsap.to($textWrap, {
        x: '1rem',
        duration: 0.15,
        ease: "power3.out"
      });
    }
  });
  
  // Mouse leave - slide back out to the right (waits for hover-in to complete)
  $(document).on('mouseleave.projectsItemHover', '.projects_wrap .projects_item', function() {
    const $imgWrap = $(this).find('.projects_img_wrap');
    const $textWrap = $(this).find('.projects_text_wrap');
    
    if ($imgWrap.length) {
      // Don't kill - let hover-in complete first, then animate out
      // Slide back to left offset position (-101% hides border)
      gsap.to($imgWrap, {
        xPercent: -101,
        duration: 0.5,
        ease: "power2.inOut",
        delay: 0.1  // Small delay ensures hover-in finishes
      });
    }
    
    if ($textWrap.length) {
      // Move text back to original position
      gsap.to($textWrap, {
        x: 0,
        duration: 0.5,
        ease: "power2.inOut",
        delay: 0.1
      });
    }
  });
  
  console.log('✅ [PROJECTS HOVER INIT] Projects item hover animations initialized');
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
      /* Removed desktop media query - now using 100% width (1 slide) on all screen sizes */
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
    
    // Get responsive settings
    const isMobile = window.innerWidth < 992;
    const slidesPerView = 1; // Changed from 2 to 1 - show one slide at a time
    const slideWidth = 100 / slidesPerView;
    
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
      const newIsMobile = window.innerWidth < 992;
      const newSlidesPerView = newIsMobile ? 1 : 2;
      const newSlideWidth = 100 / newSlidesPerView;
      maxSlide = Math.max(0, totalSlides - newSlidesPerView);
      
      // Update slide widths via CSS
      if (newIsMobile) {
        $slides.css('width', '100%');
      } else {
        $slides.css('width', '50%');
      }
      
      // Adjust current slide if needed (with looping, just ensure it's within bounds)
      if (currentSlide > maxSlide) {
        currentSlide = maxSlide;
      }
      
      // Update position
      const offset = -(currentSlide * newSlideWidth);
      gsap.set($wrapper, { x: offset + '%' });
      
      console.log(`📐 Slider ${index + 1} resized: ${newSlidesPerView} slides per view (looping enabled)`);
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
    preventRunning: true,  // Prevent transitions while one is running
    
    transitions: [
      {
        name: 'soft-crossfade',
        
        // CRITICAL: Hide next container BEFORE it's added to DOM
        beforeEnter(data) {
          console.log('🔒 BEFORE ENTER: Hiding next container immediately');
          gsap.set(data.next.container, { opacity: 0 });
        },
        
        // First page load - no leave, just fade in
        once(data) {
          console.log('🌅 ONCE: First page load');
          
          // ALWAYS start at top on first page load (refresh)
          window.scrollTo(0, 0);
          console.log('🔝 Scrolled to top on first page load');
          
          // Update nav links visibility for initial page
          updateNavLinksVisibility(data.next.url.path);
          
          // Check if this is the homepage with hero animation
          const heroHeaderWrap = data.next.container.querySelector('.hero_header_wrap');
          const isHomepage = heroHeaderWrap !== null;
          
          if (isHomepage && !heroAnimationPlayed) {
            console.log('🏠 Homepage detected - running intro sequence');
            
            // Make page visible immediately
            gsap.set(data.next.container, { opacity: 1 });
            
            // Find text elements
            const nameText = data.next.container.querySelector('#name');
            const headerText = data.next.container.querySelector('#header');
            
            // Find .projects_list CMS items to animate after intro
            const projectsListItems = data.next.container.querySelectorAll('.projects_list .w-dyn-item');
            console.log('🔍 Found .projects_list .w-dyn-item:', projectsListItems.length);
            if (projectsListItems.length > 0) {
              gsap.set(projectsListItems, { opacity: 0, y: 30 });
            }
            
            // Find .slider_nav_wrap children to animate after intro
            // NOTE: .slider_nav_wrap is OUTSIDE Barba container, so query from document
            const sliderNavItems = document.querySelectorAll('.slider_nav_wrap > *');
            console.log('🔍 Found .slider_nav_wrap children:', sliderNavItems.length);
            if (sliderNavItems.length > 0) {
              gsap.set(sliderNavItems, { opacity: 0 });
            }
            
            // Set initial state - both texts hidden
            if (nameText) gsap.set(nameText, { opacity: 0 });
            if (headerText) gsap.set(headerText, { opacity: 0 });
            
            // Create intro timeline
            const introTimeline = gsap.timeline({
              onComplete: () => {
                console.log('✅ Full intro sequence complete');
                heroAnimationPlayed = true;
                
                // Stagger .projects_list children
                if (projectsListItems.length > 0) {
                  console.log('🎬 Starting stagger animation for', projectsListItems.length, 'items');
                  gsap.to(projectsListItems, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "power2.out"
                  });
                }
                
                // Fade in .slider_nav_wrap children with random stagger
                if (sliderNavItems.length > 0) {
                  console.log('🎬 Starting random stagger for', sliderNavItems.length, 'nav items');
                  gsap.to(sliderNavItems, {
                    opacity: 1,
                    duration: 0.5,
                    stagger: {
                      each: 0.1,
                      from: "random"
                    },
                    ease: "power2.out"
                  });
                }
              }
            });
            
            // Step 1: Fade in #name
            if (nameText) {
              introTimeline.to(nameText, {
                opacity: 1,
                duration: 0.5,
                ease: "power2.out"
              });
            }
            
            // Step 2: Wait, then fade out #name
            if (nameText) {
              introTimeline.to(nameText, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
                delay: 1  // Wait 1 second before fading out
              });
            }
            
            // Step 3: Fade in #header
            if (headerText) {
              introTimeline.to(headerText, {
                opacity: 1,
                duration: 0.5,
                ease: "power2.out"
              });
            }
            
            // Step 4: Wait, then fade out #header
            if (headerText) {
              introTimeline.to(headerText, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
                delay: 1  // Wait 1 second before fading out
              });
            }
            
            // Step 5: Shrink hero from 100vh
            introTimeline.from(heroHeaderWrap, {
              height: '100vh',
              duration: 0.8,
              ease: "power2.out",
              delay: 0.3
            });
            
            return introTimeline;
          } else {
            // Regular fade in for non-homepage or return visit
            
            // On homepage return visits, keep #name and #header hidden
            if (isHomepage) {
              const nameText = data.next.container.querySelector('#name');
              const headerText = data.next.container.querySelector('#header');
              if (nameText) gsap.set(nameText, { opacity: 0 });
              if (headerText) gsap.set(headerText, { opacity: 0 });
              console.log('👁️ Set #name and #header to opacity 0 (return visit)');
            }
            
            // Show slider_nav_wrap immediately (no intro animation on return visits)
            // It's hidden by CSS initially, so we need to make it visible
            const sliderNavItems = document.querySelectorAll('.slider_nav_wrap > *');
            if (sliderNavItems.length > 0) {
              gsap.set(sliderNavItems, { opacity: 1 });
              console.log('👁️ Made slider_nav_wrap visible (return visit)');
            }
            
            return gsap.fromTo(data.next.container,
              { opacity: 0 },
              { opacity: 1, duration: 0.5, ease: "power2.out" }
            );
          }
        },
        
        leave(data) {
          console.log('🌅 CROSSFADE LEAVE: Starting fade out');
          
          // Store current URL for "Close" navigation
          previousPageUrl = data.current.url.href;
          console.log('📍 Stored previous page URL:', previousPageUrl);
          
          const currentPath = data.current.url.path;
          const nextPath = data.next.url.path;
          
          // SCROLL POSITION LOGIC (Modal-like behavior):
          // Only store scroll when leaving a main index page TO go to a project
          // Don't store when navigating between index pages
          if (isMainIndexPage(currentPath) && isProjectDetailPage(nextPath)) {
            scrollPositions[currentPath] = window.scrollY;
            console.log(`📍 Stored scroll position for ${currentPath}: ${window.scrollY}px (going to project)`);
          } else if (isMainIndexPage(currentPath) && isMainIndexPage(nextPath)) {
            // Navigating between main pages - clear any stored position for destination
            delete scrollPositions[nextPath];
            console.log(`🔄 Navigating between main pages - will start at top`);
          } else {
            console.log(`📍 Not storing scroll (current: ${currentPath}, next: ${nextPath})`);
          }
          
          // Destroy all page-specific components
          destroySliders();
          destroyScrollAnimations();
          destroyProjectHoverAnimations();
          destroyIndexItemHoverAnimations();
          destroyProjectsItemHoverAnimations();
          destroyThumbsProjectsListHoverAnimations();
          destroyDetailsPanelAnimations();
          destroySliderOverviewAnimations();
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
          
          // Keep #name and #header hidden on homepage (intro already played)
          const nameText = data.next.container.querySelector('#name');
          const headerText = data.next.container.querySelector('#header');
          if (nameText) gsap.set(nameText, { opacity: 0 });
          if (headerText) gsap.set(headerText, { opacity: 0 });
          if (nameText || headerText) {
            console.log('👁️ Set #name and #header to opacity 0 (page transition)');
          }
          
          // Show slider_nav_wrap (it's outside Barba container, hidden by CSS)
          const sliderNavItems = document.querySelectorAll('.slider_nav_wrap > *');
          if (sliderNavItems.length > 0) {
            gsap.set(sliderNavItems, { opacity: 1 });
            console.log('👁️ Made slider_nav_wrap visible (page transition)');
          }
          
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
          initializeProjectsItemHoverAnimations();
          initializeThumbsProjectsListHoverAnimations();
          
          // Animate sections on page transition
          animateThumbsSection();
          animateProjectsLayout();
          
          // Initialize details panel animations for new page
          initializeDetailsPanelAnimations();
          
          // Initialize slider overview animations for new page
          initializeSliderOverviewAnimations();

          // Re-setup hover listeners for the new page's content
          setupCustomCursorListeners();
          
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
           
           const previousPath = data.current.url.path;
           const nextPath = data.next.url.path;
           
           // SCROLL POSITION LOGIC (Modal-like behavior):
           // Only restore scroll when coming FROM a project page TO a main index page
           if (isProjectDetailPage(previousPath) && isMainIndexPage(nextPath)) {
             const storedPosition = scrollPositions[nextPath];
             if (storedPosition !== undefined) {
               window.scrollTo(0, storedPosition);
               console.log(`📍 Restored scroll position for ${nextPath}: ${storedPosition}px (returning from project)`);
             } else {
               console.log(`📍 No stored scroll position for ${nextPath}`);
             }
           } else {
             // Not returning from a project - start at top
             window.scrollTo(0, 0);
             console.log(`🔝 Starting at top of page (not returning from project)`);
           }
           
           // Update nav links visibility for new page (pass path from Barba data)
           updateNavLinksVisibility(data.next.url.path);
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

// Note: .projects_item animation removed - was causing GSAP target not found errors
// If this animation is needed, it should be moved into animateIndexPage() or another
// page-specific initialization function with proper element existence checks
  
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
    
    if (labelText) {
      labelText.textContent = 'DEBUG MODE';
      labelText.style.cssText = 'color: white !important; font-size: 16px !important;';
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
  
  // STEP 5: Set up click handler for closing when clicking on details_wrap
  console.log('🎨 [DETAILS INIT] Step 5: Setting up details_wrap click-to-close handler...');
  $(document).on('click.detailsPanel', '.details_wrap', function(e) {
    // Close when clicking anywhere on the details_wrap (but not on the trigger)
    if (detailsPanelState.isOpen && !$(e.target).is('#Trigger') && !$(e.target).closest('#Trigger').length) {
      console.log('👆 [DETAILS WRAP] Click detected on details_wrap - closing...');
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
  
  const heroHeaderWrap = document.querySelector('.hero_header_wrap');
  const heroWrap = document.querySelector('.hero_wrap');
  
  // Hero header wrap - shrink from 100vh to natural height
  if (heroHeaderWrap && !heroAnimationPlayed) {
    console.log(`🎬 Animating .hero_header_wrap from 100vh (${context})`);
    gsap.from(heroHeaderWrap, {
      height: '100vh',
      duration: 0.8,
      ease: "power2.out",
      delay: 2  // 2 second delay - sits at 100vh first
    });
  }
  
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

/**
 * PROJECTS LAYOUT FADE-IN ANIMATION
 * Animates CMS items in .projects_layout with staggered fade-in on page load
 */
function animateProjectsLayout() {
  console.log('🖼️ [PROJECTS LAYOUT] Animating .projects_layout items...');
  
  // Skip if homepage intro animation is playing (will be handled by intro stagger)
  const isHomepage = document.querySelector('.hero_header_wrap') !== null;
  if (isHomepage && !heroAnimationPlayed) {
    console.log('⏭️ [PROJECTS LAYOUT] Skipping - homepage intro animation will handle this');
    return;
  }
  
  // Target Webflow CMS items inside .projects_layout
  const items = gsap.utils.toArray('.projects_layout .w-dyn-item');
  
  if (items.length === 0) {
    console.log('ℹ️ [PROJECTS LAYOUT] No .w-dyn-item elements found in .projects_layout');
    return;
  }
  
  console.log(`✅ [PROJECTS LAYOUT] Found ${items.length} CMS items - animating with stagger...`);
  
  // Set initial state - hidden and slightly below
  gsap.set(items, {
    opacity: 0,
    y: 30
  });
  
  // Animate each item with stagger
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: {
      each: 0.1,
      from: "start"
    },
    ease: "power2.out",
    delay: 0.2,
    onComplete: () => {
      console.log('✅ [PROJECTS LAYOUT] Fade-in animation complete');
    }
  });
}

/**
 * THUMBS SECTION FADE-IN ANIMATION
 * Animates CMS items in #Thumbs section with staggered fade-in on page load
 */
function animateThumbsSection() {
  console.log('🖼️ [THUMBS] Animating #Thumbs section items...');
  
  // Skip if homepage intro animation is playing (will be handled by intro stagger)
  const isHomepage = document.querySelector('.hero_header_wrap') !== null;
  if (isHomepage && !heroAnimationPlayed) {
    console.log('⏭️ [THUMBS] Skipping - homepage intro animation will handle this');
    return;
  }
  
  // Target Webflow CMS items inside #Thumbs
  const items = gsap.utils.toArray('#Thumbs .w-dyn-item');
  
  if (items.length === 0) {
    console.log('ℹ️ [THUMBS] No .w-dyn-item elements found in #Thumbs section');
    return;
  }
  
  console.log(`✅ [THUMBS] Found ${items.length} CMS items - animating with stagger...`);
  
  // Set initial state - hidden and slightly below
  gsap.set(items, {
    opacity: 0,
    y: 30
  });
  
  // Animate each item with stagger
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: {
      each: 0.1,
      from: "start"
    },
    ease: "power2.out",
    delay: 0.2,
    onComplete: () => {
      console.log('✅ [THUMBS] Fade-in animation complete');
    }
  });
}

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
