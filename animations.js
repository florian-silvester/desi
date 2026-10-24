console.log('🎨 Animations.js loaded');

// INJECT CSS IMMEDIATELY to prevent flash before page animation
(function() {
  const style = document.createElement('style');
  style.id = 'barba-initial-hide';
  style.textContent = `
    [data-barba="container"] {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
  console.log('🎨 Injected opacity:0 CSS to prevent flash');
  
  // Inject cursor label CSS
  const blobStyle = document.createElement('style');
  blobStyle.textContent = `
    .projects_mouse_label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px 28px;
      box-sizing: border-box;
    }
    
    .projects_mouse_label .label_text {
      white-space: nowrap;
      text-align: center;
    }

    /* Project title image count — the typeface's real superior figures */
    .title_count {
      font-feature-settings: "sups" 1;
      margin-left: 0.1em;
    }
  `;
  document.head.appendChild(blobStyle);
  console.log('🎨 Injected cursor label CSS');
  
  // IMMEDIATE SCROLL TO TOP - Disable browser scroll restoration and scroll to top
  // This runs as early as possible to prevent seeing wrong scroll position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  console.log('🔝 Immediate scroll to top on page load');
  
  // Hide slider_nav_wrap children on homepage (for intro animation)
  // Will be shown later by JS
  if (window.location.pathname === '/' || window.location.pathname === '') {
    const sliderNavItems = document.querySelectorAll('.slider_nav_wrap > *');
    sliderNavItems.forEach(item => item.style.opacity = '0');
  }
})();

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
   • updateCursorLabel(text) - Update cursor text (default: "↗", links: "+")
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

// Track clicked thumb item for custom leave animation
let clickedThumbItem = null;

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
 * LIGHTWEIGHT SETUP FOR BARBA TRANSITIONS  
 * Custom cursor only active on .thumbs_id_wrap and .slider_wrap
 */
function setupCustomCursorListeners() {
  console.log('🎨 [CURSOR HOVERS] Setting up hover listeners...');
  
  // Clean up any old hover listeners first
  $(document).off('mouseenter.customCursor mouseleave.customCursor');
  $(document).off('click.sliderClose mouseenter.sliderClose mousemove.sliderClose');
  $(document).off('mouseenter.navHover mouseleave.navHover');
  $(document).off('click.thumbsClick');
  
  // ========================================
  // SLIDER (.slider_wrap) - Show slide counter
  // ========================================
  function getSlideCountLabel() {
    if (sliderOverviewState.isOverviewMode) {
      return "";
    }
    if (sliderInstances.length > 0) {
      const slider = sliderInstances[0];
      const current = slider.getCurrentSlide() + 1;
      const total = slider.slides.length;
      return `${current} / ${total}`;
    }
    return "";
  }
  
  // Show slide counter on slider elements
  $(document).on('mouseenter.customCursor', '.slider_wrap #bw, .slider_wrap #ffwd, .slider_wrap .swiper-slide', function() {
    updateCursorLabel(getSlideCountLabel());
  });
  
  // Update cursor after clicking nav buttons
  $(document).on('click.customCursor', '.slider_wrap #bw, .slider_wrap #ffwd', function() {
    setTimeout(() => {
      updateCursorLabel(getSlideCountLabel());
    }, 50);
  });

  // Show "Close" when OUTSIDE .slider_ghost_wrap (margins)
  $(document).on('mouseenter.sliderClose', '.slider_wrap', function(e) {
    const $target = $(e.target);
    if ($target.closest('.slider_ghost_wrap').length === 0 && !sliderOverviewState.isOverviewMode) {
      updateCursorLabel("Close");
    }
  });
  
  $(document).on('mousemove.sliderClose', '.slider_wrap', function(e) {
    if (sliderOverviewState.isOverviewMode) return;
    const $target = $(e.target);
    if ($target.closest('.slider_ghost_wrap').length === 0) {
      updateCursorLabel("Close");
    }
  });
  
  $(document).on('click.sliderClose', '.slider_wrap', function(e) {
    // Disable click-to-close on mobile - only button navigation
    const isDesktop = window.innerWidth >= 992;
    if (!isDesktop) return;
    
    if (sliderOverviewState.isOverviewMode) return;
    const $target = $(e.target);
    if ($target.closest('.slider_ghost_wrap').length === 0) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ [SLIDER CLOSE] Using barba.go() to:', previousPageUrl);
      barba.go(previousPageUrl);
    }
  });

  // ========================================
  // THUMBS (.thumbs_id_wrap) - handled by initializeThumbsProjectsListHoverAnimations
  // Shows project names on hover
  // ========================================

  // ========================================
  // NAV LINKS & FOOTER LINKS - children move up on hover
  // ========================================
  $(document).on('mouseenter.navHover', '.nav_link, .footer_link', function() {
    gsap.to($(this).children(), {
      y: -5,
      duration: 0.15,
      ease: "power2.out"
    });
  });
  
  $(document).on('mouseleave.navHover', '.nav_link, .footer_link', function() {
    gsap.to($(this).children(), {
      y: 0,
      duration: 0.15,
      ease: "power2.out"
    });
  });

  // ========================================
  // THUMBS CLICK TRACKING - for custom leave animation
  // ========================================
  $(document).on('click.thumbsClick', '.thumbs_id_wrap .projects_item', function() {
    clickedThumbItem = this;
    console.log('📍 [THUMBS CLICK] Stored clicked thumb item for leave animation');
  });

  console.log('✅ [CURSOR HOVERS] Hover listeners are ready (thumbs + slider only).');
}

/**
 * CURSOR MOVEMENT HANDLER
 * Updates cursor position following the mouse with smooth GSAP animation
 * Only shows cursor when inside .thumbs_id_wrap or .slider_wrap
 */
function handleCursorMove(event) {
  if (customCursorState.cursor) {
    // Check if mouse is inside allowed areas
    const target = event.target;
    const isInSlider = target.closest('.slider_wrap');
    const isOnProjectsItem = target.closest('.thumbs_id_wrap .projects_item');
    
    // Hide custom cursor in overview mode (let CSS pointer show instead)
    const isOverviewMode = sliderOverviewState.isOverviewMode;
    const shouldShowCursor = (isInSlider && !isOverviewMode) || isOnProjectsItem;
    
    gsap.to(customCursorState.cursor, {
      x: event.clientX,
      y: event.clientY,
      opacity: shouldShowCursor ? 1 : 0,
      duration: 0.1,
      ease: "power2.out"
    });
  }
}

/**
 * UPDATE CURSOR LABEL FUNCTION
 * Changes the cursor text - only shows text when specifically provided
 */
function updateCursorLabel(text) {
  if (customCursorState.cursor && customCursorState.labelText) {
    customCursorState.labelText.textContent = text || '';
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
    
    // About page animation (only if on about page)
    if (document.querySelector('.about_id_wrap')) {
      animateAboutPage(true);  // true = initial load
    }
    
    // Imprint page animation (only if on imprint page)
    if (document.querySelector('.imprint_id_wrap')) {
      animateImprintPage(true);  // true = initial load
    }
    
    // CRITICAL: Initialize cursor ONCE on page load
    initializeCustomCursor();

    // Mobile project titles: append image count as superior figures
    applyTitleCounts();
    
    // REMOVED DIRECT PAGE LOAD ANIMATION - Let Barba handle it to avoid double animation
    
    // Check if we're on the index page and animate immediately
    if (document.querySelector('.index_item')) {
      animateIndexPage();
    }
    
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
  
  // Mouse enter - scale up image and show project name in cursor
  $(document).on('mouseenter.thumbsListHover', '.thumbs_id_wrap .projects_list .projects_item', function() {
    const $imgWrap = $(this).find('.projects_img_wrap');
    const $textWrap = $(this).find('.projects_text_wrap');
    
    if ($imgWrap.length) {
      gsap.killTweensOf($imgWrap);
      
      gsap.to($imgWrap, {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    
    // Show project name in cursor label
    if ($textWrap.length) {
      // Exclude the image-count superscript so the label is just the name
      const projectName = $textWrap.clone().find('.title_count').remove().end().text().trim();
      updateCursorLabel(projectName);
    }
  });
  
  // Mouse leave - scale back to normal and reset cursor label
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
    
    // Reset cursor label to default
    updateCursorLabel("");
  });
  
  console.log('✅ [THUMBS LIST HOVER] Thumbs projects list hover animations initialized');
}

// ================================================================================
// 🔢 PROJECT TITLE IMAGE COUNT (MOBILE)
// ================================================================================
// Appends each project's image count to its title on tablet/mobile, rendered with the
// typeface's own superior figures (OpenType `sups`) — no synthetic <sup>.
// The count is read from a hidden `.image_count_source` inside each item — a
// Lightbox (or Collection List) bound to the Views field, so it's always in
// sync with the CMS with nothing to run on publish. A `data-image-count`
// attribute is accepted as a fallback.

// Tablet and below — wherever the title is shown under the image (matches the
// breakpoint of the projects_text_wrap opacity override).
const titleCountQuery = window.matchMedia('(max-width: 991px)');

// Resolves the image count for one .projects_item, trying in order:
// 1. hidden Collection List bound to Views (one .w-dyn-item per image)
// 2. hidden Lightbox bound to Views (its .w-json lists every image)
// 3. data-image-count attribute (CMS "Image Count" field)
function getImageCount(item) {
  const source = item.querySelector('.image_count_source');

  if (source) {
    const listItems = source.querySelectorAll('.w-dyn-item').length;
    if (listItems) return listItems;

    const json = source.querySelector('.w-json');
    if (json) {
      try {
        return (JSON.parse(json.textContent).items || []).length;
      } catch (e) {
        console.warn('⚠️ [TITLE COUNT] Could not parse lightbox JSON', e);
      }
    }
  }

  return Number(item.getAttribute('data-image-count')) || 0;
}

function applyTitleCounts() {
  const isMobile = titleCountQuery.matches;
  const items = document.querySelectorAll('.thumbs_id_wrap .projects_item');

  items.forEach((item) => {
    const title = item.querySelector('.projects_title_mobile');
    if (!title) return;

    // Always remove first so re-runs (Barba, resize) never duplicate it
    title.querySelector('.title_count')?.remove();

    if (!isMobile) return; // Desktop shows the name in the cursor label instead

    const count = getImageCount(item);
    if (!count) return;

    // A plain span, not <sup>: the browser's default <sup> styling would
    // shrink and raise a glyph that the font already sizes and positions.
    const sup = document.createElement('span');
    sup.className = 'title_count';
    sup.textContent = count;
    title.appendChild(sup);
  });
}

// Add/remove when crossing the mobile breakpoint (rotation, resize)
titleCountQuery.addEventListener('change', applyTitleCounts);

// ================================================================================
// 🎯 PROJECTS ITEM HOVER ANIMATIONS (SLIDE IN)
// ================================================================================

/**
 * CLEANUP FUNCTION FOR PROJECTS ITEM HOVER ANIMATIONS
 * Removes all event listeners before page transitions
 */
function destroyProjectsItemHoverAnimations() {
  console.log('🧹 [PROJECTS HOVER CLEANUP] Removing projects item hover listeners...');
  $(document).off('mouseenter.projectsItemHover mouseleave.projectsItemHover', '.projects_layout .projects_item');
  console.log('✅ [PROJECTS HOVER CLEANUP] Projects item hover animations cleaned up');
}

/**
 * INITIALIZE PROJECTS ITEM HOVER ANIMATIONS
 * Slides .projects_img_wrap from xPercent: 100 to 0 on hover
 * Reverses on hover out
 * Only targets .projects_item inside .projects_layout
 * Only on desktop (992px+) - smaller screens show image always visible
 */
function initializeProjectsItemHoverAnimations() {
  console.log('🎯 [PROJECTS HOVER INIT] Starting projects item hover animations...');
  
  // Clean up any existing listeners first
  destroyProjectsItemHoverAnimations();
  
  const projectsItems = $('.projects_layout .projects_item');
  
  if (projectsItems.length === 0) {
    console.log('ℹ️ [PROJECTS HOVER INIT] No .projects_item elements found inside .projects_layout');
    return;
  }
  
  // Check if desktop (992px+)
  const isDesktop = window.innerWidth >= 992;
  
  if (!isDesktop) {
    console.log('📱 [PROJECTS HOVER INIT] Mobile/tablet detected - keeping images visible, no hover animation');
    // Ensure images are visible on mobile/tablet (excludes thumbs_id_wrap items)
    projectsItems.each(function() {
      // Skip if inside thumbs_id_wrap
      if ($(this).closest('.thumbs_id_wrap').length) return;
      
      const $imgWrap = $(this).find('.projects_img_wrap');
      if ($imgWrap.length) {
        gsap.set($imgWrap, { xPercent: 0 });
      }
    });
    return;
  }
  
  console.log(`✅ [PROJECTS HOVER INIT] Desktop detected - Found ${projectsItems.length} projects items - setting up hovers...`);
  
  // Set initial state - .projects_img_wrap starts offset -101% to the left (extra 1% hides border)
  // EXCLUDES items inside .thumbs_id_wrap (those have no offset)
  projectsItems.each(function() {
    // Skip if inside thumbs_id_wrap
    if ($(this).closest('.thumbs_id_wrap').length) return;
    
    const $imgWrap = $(this).find('.projects_img_wrap');
    if ($imgWrap.length) {
      gsap.set($imgWrap, { xPercent: -101 });
    }
  });
  
  // Mouse enter - slide in from right (fast & snappy) + scale up to 150%
  // EXCLUDES items inside .thumbs_id_wrap (those have their own animation)
  $(document).on('mouseenter.projectsItemHover', '.projects_layout .projects_item', function() {
    // Skip if inside thumbs_id_wrap - those have separate animation (no offset)
    if ($(this).closest('.thumbs_id_wrap').length) return;
    
    const $imgWrap = $(this).find('.projects_img_wrap');
    
    if ($imgWrap.length) {
      // Kill any existing animations for responsive hover-in
      gsap.killTweensOf($imgWrap);
      
      // Slide in to normal position + scale up to 150%
      gsap.to($imgWrap, {
        xPercent: 0,
        scale: 1.5,
        duration: 0.15,
        ease: "power3.out"
      });
    }
  });
  
  // Mouse leave - slide back out + scale back to normal
  // EXCLUDES items inside .thumbs_id_wrap (those have their own animation)
  $(document).on('mouseleave.projectsItemHover', '.projects_layout .projects_item', function() {
    // Skip if inside thumbs_id_wrap - those have separate animation (no offset)
    if ($(this).closest('.thumbs_id_wrap').length) return;
    
    const $imgWrap = $(this).find('.projects_img_wrap');
    
    if ($imgWrap.length) {
      // Don't kill - let hover-in complete first, then animate out
      // Slide back to left offset position + scale back to normal
      gsap.to($imgWrap, {
        xPercent: -101,
        scale: 1,
        duration: 0.5,
        ease: "power2.inOut",
        delay: 0.1  // Small delay ensures hover-in finishes
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

      /* Re-enable cursor in overview mode (custom cursor is hidden) */
      body.overview-mode .slider_wrap,
      body.overview-mode .slider_wrap * {
        cursor: auto !important;
      }
      
      /* Show pointer cursor on slides in overview mode (clickable to return to slider) */
      body.overview-mode .swiper-slide,
      body.overview-mode .swiper-slide * {
        cursor: pointer !important;
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
    const maxSlide = Math.max(0, totalSlides - slidesPerView);
    
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
      
      // Semantic hook only - #bw/#ffwd are invisible hit areas with no .disabled styling
      $prevBtn.toggleClass('disabled', currentSlide === 0);
      $nextBtn.toggleClass('disabled', currentSlide === maxSlide);
      
      console.log(`�� Slider ${index + 1} moved to slide ${currentSlide} (offset: ${offset}%)`);
    }
    
    // Navigation handlers
    // The sequence stops at both ends rather than wrapping, because wrapping tweens the
    // wrapper across every slide at once and reads as a rewind.
    const BOUNCE_PERCENT = 3;
    
    // Nudge the strip and spring back to signal there is nothing further this way.
    // Shared by swipe, buttons and keyboard so every input behaves the same at the edge.
    function bounceAtEdge(direction) {
      const base = -(currentSlide * slideWidth);
      
      gsap.killTweensOf($wrapper);
      gsap.timeline()
        .to($wrapper, { x: (base + direction * BOUNCE_PERCENT) + '%', duration: 0.15, ease: "power2.out" })
        .to($wrapper, { x: base + '%', duration: 0.35, ease: "power2.out" });
    }
    
    function goToPrev() {
      if (currentSlide === 0) {
        bounceAtEdge(1);
        return;
      }
      currentSlide--;
      updateSlider();
    }
    
    function goToNext() {
      if (currentSlide === maxSlide) {
        bounceAtEdge(-1);
        return;
      }
      currentSlide++;
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
    
    // ----------------------------------------------------------------------------
    // TOUCH SWIPE (mobile)
    // ----------------------------------------------------------------------------
    // Bound to .slider_wrap rather than .swiper because #bw/#ffwd are absolutely
    // positioned over the slides, so gestures starting on them never reach .swiper.
    // Native listeners are used instead of jQuery so touchmove can be registered
    // non-passive, which is required to cancel page scroll mid-gesture.
    const $swipeArea = $slider.closest('.slider_wrap').length ? $slider.closest('.slider_wrap') : $slider;
    const swipeEl = $swipeArea[0];
    
    const AXIS_LOCK_PX = 8;        // movement before committing to horizontal or vertical
    const SWIPE_RATIO = 0.15;      // share of slider width that commits to a slide change
    const EDGE_RESISTANCE = 0.35;
    const CLICK_SUPPRESS_MS = 400;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let isSwiping = false;
    let swipeAxis = null;
    let swipeEndedAt = 0;
    
    function swipeEnabled() {
      return window.innerWidth < 992 &&
        !sliderOverviewState.isOverviewMode &&
        !sliderOverviewState.isAnimating;
    }
    
    function dragWrapperTo(deltaX) {
      const width = $wrapper[0].offsetWidth || 1;
      let travel = (deltaX / width) * slideWidth;
      
      // Dampen movement that would expose empty space before the first or after the last slide
      if ((currentSlide === 0 && travel > 0) || (currentSlide === maxSlide && travel < 0)) {
        travel *= EDGE_RESISTANCE;
      }
      
      gsap.set($wrapper, { x: (-(currentSlide * slideWidth) + travel) + '%' });
    }
    
    function onTouchStart(e) {
      swipeEndedAt = 0;
      if (!swipeEnabled() || e.touches.length !== 1) return;
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDeltaX = 0;
      isSwiping = false;
      swipeAxis = null;
      gsap.killTweensOf($wrapper);
    }
    
    function onTouchMove(e) {
      if (!swipeEnabled() || e.touches.length !== 1) return;
      
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      
      if (!swipeAxis) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_PX) return;
        swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        isSwiping = swipeAxis === 'x';
      }
      
      // Vertical gestures stay with the page scroll
      if (swipeAxis !== 'x') return;
      
      touchDeltaX = dx;
      e.preventDefault();
      dragWrapperTo(dx);
    }
    
    function onTouchEnd() {
      if (!isSwiping) return;
      
      const threshold = Math.max(40, ($wrapper[0].offsetWidth || 1) * SWIPE_RATIO);
      
      if (touchDeltaX <= -threshold) {
        goToNext();
      } else if (touchDeltaX >= threshold) {
        goToPrev();
      } else {
        updateSlider();
      }
      
      swipeEndedAt = Date.now();
      isSwiping = false;
      swipeAxis = null;
      touchDeltaX = 0;
    }
    
    function onTouchCancel() {
      if (!isSwiping) return;
      
      updateSlider();
      isSwiping = false;
      swipeAxis = null;
      touchDeltaX = 0;
    }
    
    function onClickCapture(e) {
      // Some browsers still synthesize a click after a swipe, which would reach the
      // #bw/#ffwd overlays and advance the slider a second time.
      if (!swipeEndedAt || Date.now() - swipeEndedAt > CLICK_SUPPRESS_MS) return;
      
      swipeEndedAt = 0;
      e.preventDefault();
      e.stopPropagation();
    }
    
    swipeEl.addEventListener('touchstart', onTouchStart, { passive: true });
    swipeEl.addEventListener('touchmove', onTouchMove, { passive: false });
    swipeEl.addEventListener('touchend', onTouchEnd);
    swipeEl.addEventListener('touchcancel', onTouchCancel);
    swipeEl.addEventListener('click', onClickCapture, true);
    
    console.log(`👆 Swipe navigation bound to .${swipeEl.className.split(' ')[0]} for slider ${index + 1}`);
    
    // Handle window resize
    function handleResize() {
      // Overview mode lays the slides out as a grid, so leave its transform alone
      if (sliderOverviewState.isOverviewMode) return;
      
      // Slide widths are pinned to 100% by the injected CSS at every breakpoint;
      // setting them inline here would leak into overview mode and break the grid.
      gsap.set($wrapper, { x: -(currentSlide * slideWidth) + '%' });
      
      console.log(`📐 Slider ${index + 1} resized: realigned to slide ${currentSlide}`);
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
      swipeEl.removeEventListener('touchstart', onTouchStart);
      swipeEl.removeEventListener('touchmove', onTouchMove);
      swipeEl.removeEventListener('touchend', onTouchEnd);
      swipeEl.removeEventListener('touchcancel', onTouchCancel);
      swipeEl.removeEventListener('click', onClickCapture, true);
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
        
        // CRITICAL: Hide next container AND items BEFORE visible
        beforeEnter(data) {
          console.log('🔒 BEFORE ENTER: Hiding container and items');
          gsap.set(data.next.container, { opacity: 0 });
          
          // Pre-hide items that will be stagger-animated
          const layoutItems = data.next.container.querySelectorAll('.projects_layout .w-dyn-item');
          const thumbsItems = data.next.container.querySelectorAll('#Thumbs .w-dyn-item');
          const aboutItems = data.next.container.querySelectorAll('.about_id_wrap .u-content-wrapper');
          const imprintItems = data.next.container.querySelectorAll('.imprint_id_wrap .u-content-wrapper');
          if (layoutItems.length > 0) gsap.set(layoutItems, { opacity: 0, y: 30 });
          if (thumbsItems.length > 0) gsap.set(thumbsItems, { opacity: 0, y: 30 });
          if (aboutItems.length > 0) gsap.set(aboutItems, { opacity: 0, y: 30 });
          if (imprintItems.length > 0) gsap.set(imprintItems, { opacity: 0, y: 30 });
        },
        
        // First page load - no leave, just fade in
        once(data) {
          console.log('🌅 ONCE: First page load');
          
          // ALWAYS start at top on first page load (refresh)
          window.scrollTo(0, 0);
          console.log('🔝 Scrolled to top on first page load');
          
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

            // Webflow hides .hero_header_wrap at ≤767px (the nav carries the name there),
            // so on phones the intro ran invisibly: ~5s of blank page. Show it for the
            // intro only, then hand display back to the stylesheet.
            const heroHiddenByCss = getComputedStyle(heroHeaderWrap).display === 'none';
            if (heroHiddenByCss) heroHeaderWrap.style.display = 'flex';

            // Don't fade the type in before ABC Solar has arrived (font-display: swap would
            // show Arial on a cold mobile load). Capped so a slow font never stalls the page.
            const fontReady = Promise.race([
              document.fonts ? document.fonts.load('500 1em Abcsolar') : Promise.resolve(),
              new Promise(resolve => setTimeout(resolve, 1200))
            ]).catch(() => {});

            return fontReady.then(() => {
            // Create intro timeline
            const introTimeline = gsap.timeline({
              onComplete: () => {
                console.log('✅ Full intro sequence complete');
                heroAnimationPlayed = true;
                if (heroHiddenByCss) heroHeaderWrap.style.removeProperty('display');

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
            });
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
          
          // IMPORTANT: Only remove hover listeners. The cursor element and
          // its mousemove listener will persist.
          $(document).off('mouseenter.customCursor mouseleave.customCursor');

          // Check if we clicked a thumbs item - do custom staggered leave
          const $thumbsItems = $(data.current.container).find('.thumbs_id_wrap .projects_item');
          
          if (clickedThumbItem && $thumbsItems.length > 0) {
            console.log('🎬 [LEAVE] Custom thumbs leave animation - clicked item fades last');
            
            const $otherItems = $thumbsItems.not(clickedThumbItem);
            const $clickedItem = $(clickedThumbItem);
            
            // Create timeline for coordinated animation
            const leaveTimeline = gsap.timeline();
            
            // 1. Other items scale down + fade out
            if ($otherItems.length > 0) {
              leaveTimeline.to($otherItems, {
                opacity: 0,
                scale: 0.85,
                duration: 0.35,
                ease: 'power2.inOut',
                stagger: 0.02
              }, 0);
            }
            
            // 2. Clicked item fades out LAST (no scale, stays at hover size)
            leaveTimeline.to($clickedItem, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.inOut'
            }, 0.15);
            
            // 3. Fade out container after items
            leaveTimeline.to(data.current.container, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out"
            }, 0.35);
            
            // Clear the clicked item reference
            clickedThumbItem = null;
            
            return leaveTimeline;
          }
          
          // Clear clicked item reference (if any)
          clickedThumbItem = null;

          // Default: Simple fade out
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
          
          // Check if entering homepage with intro not yet played
          const heroHeaderWrap = data.next.container.querySelector('.hero_header_wrap');
          const isEnteringHomepage = heroHeaderWrap !== null;
          
          if (isEnteringHomepage && !heroAnimationPlayed) {
            // Homepage entry via Barba with intro not played - run intro sequence
            console.log('🏠 [BARBA ENTER] Homepage detected, intro not played - running intro');
            
            // Find items to animate
            const projectsListItems = data.next.container.querySelectorAll('.projects_list .w-dyn-item');
            const sliderNavItems = document.querySelectorAll('.slider_nav_wrap > *');
            
            if (projectsListItems.length > 0) {
              gsap.set(projectsListItems, { opacity: 0, y: 30 });
              gsap.to(projectsListItems, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                delay: 0.3  // Small delay after page fade in
              });
            }
            
            if (sliderNavItems.length > 0) {
              gsap.set(sliderNavItems, { opacity: 0 });
              gsap.to(sliderNavItems, {
                opacity: 1,
                duration: 0.5,
                stagger: { each: 0.1, from: "random" },
                ease: "power2.out",
                delay: 0.3
              });
            }
            
            heroAnimationPlayed = true;
            console.log('✅ [BARBA ENTER] Homepage intro complete, heroAnimationPlayed = true');
          } else {
            // Animate sections normally (intro already played or not homepage)
          animateThumbsSection();
          animateProjectsLayout();
            
            // About page animation - only if .about_id_wrap exists
            if (data.next.container.querySelector('.about_id_wrap')) {
              animateAboutPage();
            }
            
            // Imprint page animation - only if .imprint_id_wrap exists
            if (data.next.container.querySelector('.imprint_id_wrap')) {
              animateImprintPage();
            }
          }
          
          // Initialize details panel animations for new page
          initializeDetailsPanelAnimations();
          
          // Initialize slider overview animations for new page
          initializeSliderOverviewAnimations();

          // Re-setup hover listeners for the new page's content
          setupCustomCursorListeners();

          // Re-apply mobile title image counts for the new page's content
          applyTitleCounts();
          
          // HOMEPAGE ANIMATIONS - Check if we're entering the homepage
          if (data.next.container.querySelector('.studio_svg') || data.next.container.querySelector('.penzlien_svg')) {
            console.log('🎯 Homepage detected in Barba transition');
            
            // CRITICAL: Check stored scroll position to determine if at top
            const nextPagePath = data.next.url.path;
            const storedScrollPosition = scrollPositions[nextPagePath] || 0;
            console.log(`📍 Stored scroll position for homepage: ${storedScrollPosition}px`);
            
            // Pass scroll info to animation function
            animateHomepageElements('Barba transition', storedScrollPosition);
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
      },
      {
        namespace: 'about',
        afterEnter() {
          console.log('📋 About page loaded');
          // Animation handled in enter() based on .about_id_wrap presence
        }
      },
      {
        namespace: 'imprint',
        afterEnter() {
          console.log('📋 Imprint page loaded');
          // Animation handled in enter() based on .imprint_id_wrap presence
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
  isAnimating: false,
  targetSlide: null,    // Store target slide when clicking in overview
  clickedSlide: null    // Store clicked slide element for special animation
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
  
  // CRITICAL: Remove overview-mode from body
  document.body.classList.remove('overview-mode');
  
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
    
    // Store target slide and clicked element - for special animation handling
    sliderOverviewState.targetSlide = slideIndex;
    sliderOverviewState.clickedSlide = this;  // Store the clicked slide element
    
    // Deactivate overview mode (navigation happens during the animation)
    deactivateOverviewMode();
  });
  
  // STEP 6: Set up hover effect for images in overview mode (scale up 110%)
  // Uses same timing as thumbs hover: duration 0.3s, ease power2.out
  console.log('🎨 [OVERVIEW INIT] Step 6: Setting up image hover scale effect...');
  $(document).on('mouseenter.overviewHover', '.swiper_img_wrap', function() {
    if (!sliderOverviewState.isOverviewMode) return;
    
    // Raise z-index so hovered slide appears on top
    $(this).closest('.swiper-slide').css('z-index', 10);
    
    gsap.killTweensOf(this);
    gsap.to(this, {
      scale: 1.1,
      duration: 0.3,
      ease: "power2.out"
    });
  });
  
  $(document).on('mouseleave.overviewHover', '.swiper_img_wrap', function() {
    if (!sliderOverviewState.isOverviewMode) return;
    
    // Reset z-index
    $(this).closest('.swiper-slide').css('z-index', '');
    
    gsap.killTweensOf(this);
    gsap.to(this, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
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
  // 1. Fade out slides with scale effect (smooth exit)
  activateTimeline.to($slides, {
    scale: 0.85,
    opacity: 0,
    duration: 0.4,
    stagger: 0.03,
    ease: 'power2.inOut',
    onStart: () => console.log('   📉 [OVERVIEW ON] Fading out slides for transition'),
    onComplete: () => {
      console.log('   ✅ [OVERVIEW ON] Slides faded out');
      
      // 2. LOCK invisible state before layout changes
      gsap.set($slides, { opacity: 0, scale: 0.85 });
      
      // 3. Reset wrapper position while slides are invisible (no visual jump)
      gsap.set($swiperWrapper, { x: '0%' });
      console.log('   🔄 [OVERVIEW ON] Wrapper position reset for grid layout');
      
      // 4. Add classes and update layout (happens instantly when slides are hidden)
      $swiperWrapper.addClass('is-overview');
      $swiper.addClass('overview-active');
      $overviewBtn.addClass('active');
      console.log('   🏷️ [OVERVIEW ON] Classes added for grid layout');
      
      // 5. Small delay to let layout settle, then stagger slides back in
      gsap.delayedCall(0.05, () => {
        console.log('   🎬 [OVERVIEW ON] Animating slides back in...');
      gsap.to($slides, {
        scale: 1,
        opacity: 1,
          duration: 0.5,
        ease: 'power2.out',
          stagger: 0.06
        });
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
  
  // Set animating state but keep isOverviewMode TRUE until animations complete
  sliderOverviewState.isAnimating = true;
  // NOTE: isOverviewMode stays TRUE until fade out completes - this keeps CSS layout intact
  
  // Kill any existing animations on slides to prevent conflicts
  const $allSlides = $('.swiper-slide');
  gsap.killTweensOf($allSlides);
  gsap.killTweensOf('.swiper_img_wrap');
  
  // Get clicked slide's image to preserve its hover scale
  const clickedSlide = sliderOverviewState.clickedSlide;
  const $clickedImgWrap = clickedSlide ? $(clickedSlide).find('.swiper_img_wrap') : null;
  
  // Reset OTHER images' scale - keep clicked one at hover size (1.1)
  if ($clickedImgWrap && $clickedImgWrap.length) {
    const $otherImgWraps = $('.swiper_img_wrap').not($clickedImgWrap);
    gsap.set($otherImgWraps, { scale: 1 });
  } else {
    gsap.set('.swiper_img_wrap', { scale: 1 });
  }

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
  // clickedSlide already defined above for hover scale preservation
  
  // Separate clicked slide from others for different animation
  const $otherSlides = clickedSlide 
    ? $slides.not(clickedSlide) 
    : $slides;

  // ANIMATION SEQUENCE:
  // 1a. Fade out OTHER slides with scale down (smooth exit)
  deactivateTimeline.to($otherSlides, {
    duration: 0.35,
    opacity: 0,
    scale: 0.85,
    ease: 'power2.inOut',
    stagger: 0.02
  }, 0);
  
  // 1b. Clicked slide fades out LAST, NO scale (stays big until gone)
  if (clickedSlide) {
    deactivateTimeline.to(clickedSlide, {
      duration: 0.3,
      opacity: 0,
      ease: 'power2.inOut'
    }, 0.2);  // Start slightly later so it fades last
  }
  
  // 2. After all fade out, change layout
  deactivateTimeline.add(() => {
    console.log('   ✅ [OVERVIEW OFF] Fade out complete, now changing layout...');
    
    // Clear clicked slide reference
    sliderOverviewState.clickedSlide = null;
    
    // LOCK in the invisible state before layout changes
    gsap.set($slides, { opacity: 0, scale: 1 });  // Reset scale to 1 for slider mode
    gsap.set($navButtons, { opacity: 0 });
    
    // NOW remove body class and other classes (layout changes while hidden)
    document.body.classList.remove('overview-mode');
    sliderOverviewState.isOverviewMode = false;
      $swiperWrapper.removeClass('is-overview');
      $swiper.removeClass('overview-active');
      $overviewBtn.removeClass('active');
      console.log('   🏷️ [OVERVIEW OFF] Classes removed, slider layout restored.');

    // Navigate to target slide (set when clicking on a slide in overview)
    // or resync to current slide if toggling via Overview button
      if (sliderInstance) {
      const targetSlide = sliderOverviewState.targetSlide !== null 
        ? sliderOverviewState.targetSlide 
        : sliderInstance.getCurrentSlide();
      sliderInstance.goToSlide(targetSlide, false);
      console.log(`   🎯 [OVERVIEW OFF] Navigated to slide ${targetSlide}`);
      sliderOverviewState.targetSlide = null;  // Clear for next time
    }

    // Small delay to let layout settle, then animate slides back in
    gsap.delayedCall(0.05, () => {
      console.log('   🎬 [OVERVIEW OFF] Animating slides back in...');
      gsap.to($slides, {
          opacity: 1,
          scale: 1,
          duration: 0.5,
        ease: 'power2.out'
      });
      gsap.to($navButtons, {
        opacity: 1,
        duration: 0.4,
          ease: 'power2.out',
        delay: 0.2
      });
    });
  });
}

// ================================================================================
// 🎨 REUSABLE HOMEPAGE ANIMATIONS
// ================================================================================

/**
 * CENTRALIZED HOMEPAGE ANIMATION FUNCTION
 * Handles hero wrap height animation
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
          delay: 0.8,
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
  
  // Animate each item with stagger (delay to start after container fade-in)
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: {
      each: 0.05,
      from: "start"
    },
    ease: "power2.out",
    delay: 0.4,  // Wait for container to become visible
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
  
  // Animate each item with stagger (delay to start after container fade-in)
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: {
      each: 0.05,
      from: "start"
    },
    ease: "power2.out",
    delay: 0.4,  // Wait for container to become visible
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
}

/**
 * ABOUT PAGE FADE-IN ANIMATION
 * Animates content wrappers inside .about_id_wrap with staggered fade-in
 */
function animateAboutPage(isInitialLoad = false) {
  console.log('📋 [ABOUT] Animating about page elements...');
  
  // Target .u-content-wrapper elements inside .about_id_wrap for deeper stagger
  const aboutItems = document.querySelectorAll('.about_id_wrap .u-content-wrapper');
  
  if (aboutItems.length === 0) {
    console.log('ℹ️ [ABOUT] No .u-content-wrapper elements found in .about_id_wrap');
    return;
  }
  
  console.log(`✅ [ABOUT] Found ${aboutItems.length} content wrappers - animating with stagger...`);
  
  // Set initial state - hidden and slightly below
  gsap.set(aboutItems, {
    opacity: 0,
    y: 30
  });
  
  // Delay: longer on initial load (page fade in), shorter on Barba transition
  const animDelay = isInitialLoad ? 0.2 : 0.4;
  
  // Animate each item with stagger
  gsap.to(aboutItems, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: {
      each: 0.15,
      from: "start"
    },
    ease: "power2.out",
    delay: animDelay,
    onComplete: () => {
      console.log('✅ [ABOUT] Fade-in animation complete');
    }
  });
}

/**
 * IMPRINT PAGE FADE-IN ANIMATION
 * Animates content wrappers inside .imprint_id_wrap with staggered fade-in
 */
function animateImprintPage(isInitialLoad = false) {
  console.log('📋 [IMPRINT] Animating imprint page elements...');
  
  // Target .u-content-wrapper elements inside .imprint_id_wrap for deeper stagger
  const imprintItems = document.querySelectorAll('.imprint_id_wrap .u-content-wrapper');
  
  if (imprintItems.length === 0) {
    console.log('ℹ️ [IMPRINT] No .u-content-wrapper elements found in .imprint_id_wrap');
    return;
  }
  
  console.log(`✅ [IMPRINT] Found ${imprintItems.length} content wrappers - animating with stagger...`);
  
  // Set initial state - hidden and slightly below
  gsap.set(imprintItems, {
    opacity: 0,
    y: 30
  });
  
  // Delay: longer on initial load (page fade in), shorter on Barba transition
  const animDelay = isInitialLoad ? 0.2 : 0.4;
  
  // Animate each item with stagger
  gsap.to(imprintItems, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: {
      each: 0.15,
      from: "start"
    },
    ease: "power2.out",
    delay: animDelay,
    onComplete: () => {
      console.log('✅ [IMPRINT] Fade-in animation complete');
    }
  });
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
