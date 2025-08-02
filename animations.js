console.log('🎨 Animations.js loaded');

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
   
📍 Location: Search for "PROJECT HOVER ANIMATIONS", "DETAILS PANEL ANIMATIONS", or "SLIDER OVERVIEW TOGGLE" sections below
*/

// Global array to store slider instances
let sliderInstances = [];

// Global scroll position storage
let scrollPositions = {};

// Global click position storage for transform origin effect
let clickPosition = { x: 50, y: 50 }; // Default to center

// ===== SCROLL ANIMATIONS =====
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
    if (item.animated) return; // Skip if already animated
    
    const rect = item.element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Check if element is 85% into viewport
    if (rect.top <= windowHeight * 0.85) {
      console.log(`✨ Animating project image wrap ${index + 1}`);
      gsap.to(item.element, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      });
      item.animated = true;
    }
  });
}

function initializeScrollAnimations() {
  console.log('📜 Initializing scroll animations...');
  
  // Animate .project_img_wrap elements with fade-in and move-up effect
  // BUT EXCLUDE those inside .projects_item (home page handles those with stagger)
  // AND EXCLUDE those inside .swiper-slide (slider entrance animation handles those)
  const projectImgWraps = document.querySelectorAll('.project_img_wrap:not(.projects_item .project_img_wrap):not(.swiper-slide .project_img_wrap)');
  
  if (projectImgWraps.length > 0) {
    console.log(`🖼️ Found ${projectImgWraps.length} project image wraps to animate (excluding home page and slider items)`);
    
    // Reset scroll elements array
    scrollAnimationElements = [];
    
    // Set initial state and prepare for animation
    projectImgWraps.forEach((element, index) => {
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
    
    console.log('✅ Scroll animations for project image wraps initialized');
  } else {
    console.log('ℹ️ No project image wraps found on this page (or all are handled by home page stagger or slider entrance)');
  }
}

// ===== CLICK POSITION TRACKING =====
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
  setTimeout(() => {
  initializeSliders();
  initializeScrollAnimations();
  initializeProjectHoverAnimations();
  initializeDetailsPanelAnimations();
  initializeSliderOverviewAnimations();
  }, 100);
  
  // Initialize Barba after a small delay
  setTimeout(() => {
  initializeBarba();
  }, 200);
  
});

// ===== PROJECT HOVER ANIMATIONS =====
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

// ===== GSAP SLIDER IMPLEMENTATION =====
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
      @media (min-width: 992px) {
        .swiper-wrapper:not(.is-overview) .swiper-slide {
          width: 50% !important;
        }
      }
      /* Hide navigation until GSAP creates it */
      .slider-prev,
      .slider-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: rgba(0,0,0,0.5);
        color: white;
        border: none;
        padding: 10px 15px;
        cursor: pointer;
        font-size: 18px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .slider-prev { left: 10px; }
      .slider-next { right: 10px; }
      .slider-prev:hover,
      .slider-next:hover {
        background: rgba(0,0,0,0.7);
      }
      .slider-prev.disabled,
      .slider-next.disabled {
        opacity: 0.3;
        cursor: not-allowed;
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
    const slidesPerView = isMobile ? 1 : 2;
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
    
    // Create navigation buttons (if they don't exist)
    let $prevBtn = $slider.find('.slider-prev, .swiper-prev');
    let $nextBtn = $slider.find('.slider-next, .swiper-next');
    
    // If no nav buttons found, create them
    if (!$prevBtn.length || !$nextBtn.length) {
      $slider.append(`
        <button class="slider-prev">←</button>
        <button class="slider-next">→</button>
      `);
      $prevBtn = $slider.find('.slider-prev');
      $nextBtn = $slider.find('.slider-next');
    }
    
    // Show navigation buttons
    gsap.set([$prevBtn, $nextBtn], { opacity: 1 });
    
    // Animation function
    function updateSlider(direction = 0) {
      const offset = -(currentSlide * slideWidth);
      
      gsap.to($wrapper, {
        x: offset + '%',
        duration: 0.4,  // Faster: was 0.6
        ease: "power2.inOut"  // Snappier: was "power2.out"
      });
      
      // With looping enabled, buttons are never disabled
      $prevBtn.removeClass('disabled');
      $nextBtn.removeClass('disabled');
      
      console.log(`📱 Slider ${index + 1} moved to slide ${currentSlide} (offset: ${offset}%)`);
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
    
    // Bind events
    $prevBtn.on('click', goToPrev);
    $nextBtn.on('click', goToNext);
    
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
      const newMaxSlide = Math.max(0, totalSlides - newSlidesPerView);
      
      // Update slide widths via CSS
      if (newIsMobile) {
        $slides.css('width', '100%');
      } else {
        $slides.css('width', '50%');
      }
      
      // Adjust current slide if needed (with looping, just ensure it's within bounds)
      if (currentSlide > newMaxSlide) {
        currentSlide = newMaxSlide;
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
      $prevBtn.off('click');
      $nextBtn.off('click');
      $(document).off('keydown.slider' + index);
      $(window).off('resize.slider' + index);
      console.log(`🧹 Slider ${index + 1} cleaned up`);
    };
    
    sliderInstances.push({ cleanup, element: $slider });
    
    console.log(`✅ GSAP slider ${index + 1} initialized successfully`);
  });
  
  console.log(`🎯 Total GSAP sliders created: ${sliderInstances.length}`);
  
  console.log('✅ GSAP sliders setup started');
}

// ===== BARBA.JS PAGE TRANSITIONS =====
function initializeBarba() {
  console.log('🎭 Initializing Barba.js transitions...');
  
  barba.init({
    sync: true, // ADD BACK - needed for crossfade to work
    
    transitions: [
      {
        name: 'soft-crossfade',
        leave(data) {
          console.log('🌅 CROSSFADE LEAVE: Starting fade out');
          
          // Store scroll position
          scrollPositions[data.current.url.path] = window.scrollY;
          
          // Destroy sliders
          destroySliders();
          
          // Destroy scroll animations
          destroyScrollAnimations();
          
          // Destroy hover animations
          destroyProjectHoverAnimations();
          
          // Destroy details panel animations
          destroyDetailsPanelAnimations();
          
          // Destroy slider overview animations
          destroySliderOverviewAnimations();

          // Simple fade out - NO DELAY
          return gsap.to(data.current.container, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onStart: () => console.log('🌅 Leave animation started'),
            onComplete: () => console.log('🌅 Leave animation complete')
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
          
          // Initialize details panel animations for new page
          initializeDetailsPanelAnimations();
          
          // Initialize slider overview animations for new page
          initializeSliderOverviewAnimations();

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
           
           // Restore scroll position if we have one stored
           const storedPosition = scrollPositions[data.next.url.path];
           if (storedPosition !== undefined) {
             console.log(`📍 Restoring scroll position: ${storedPosition} for ${data.next.url.path}`);
             window.scrollTo(0, storedPosition);
           } else {
             console.log('📍 No stored position, staying at top');
           }
         }
       }
    ],
    
    views: [
      {
        namespace: 'home',
        afterEnter() {
          console.log('🏠 Home page loaded');
          animateHomePage();
        }
      },
      {
        namespace: 'contact',
        afterEnter() {
          console.log('📧 Contact page loaded');
          animateContactPage();
        }
      }
    ]
  });
  
  console.log('✅ Barba.js initialized successfully!');
}

// ===== SLIDER ENTRANCE ANIMATION =====
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
    
    // Also animate navigation buttons if they exist
    const navButtons = document.querySelectorAll('.slider-prev, .slider-next');
    if (navButtons.length > 0) {
      gsap.set(navButtons, { opacity: 0, scale: 0.8 });
      gsap.to(navButtons, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.5,
        ease: "back.out(1.7)"
      });
    }
  }
}

// ===== PAGE-SPECIFIC ANIMATIONS =====
function animateHomePage() {
  console.log('🎨 Animating home page elements...');
  
  // Animate logo
  gsap.from('.intro_logo_wrap', {
    scale: 0.8,
    opacity: 0,
    duration: 1,
    ease: "power2.out",
    delay: 0.3
  });
  
  // Animate project items with stagger
  gsap.from('.projects_item', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power2.out",
    delay: 0.5
  });
}

function animateContactPage() {
  console.log('📧 Animating contact page elements...');
  
  // Add contact page specific animations here
  gsap.from('.contact-content', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out",
    delay: 0.3
  });
}

// ===== UTILITY FUNCTIONS =====
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


// ===== DETAILS PANEL ANIMATIONS =====
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
  
  gsap.set([$detailsLayout, $projectOverlay], {
    opacity: 0
  });
  
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
  
  // 3. Fade in the project overlay (starts 0.1s after layout fade begins - stagger effect)
  .to($projectOverlay, {
    opacity: 1,
    duration: 0.4,
    ease: 'power2.out',
    onStart: () => console.log('   🌫️ [DETAILS OPEN] Overlay fade-in started (staggered)'),
    onComplete: () => console.log('   ✅ [DETAILS OPEN] Overlay fade-in complete')
  }, 0.3);
  
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
  // 1. Fade out both layout and overlay simultaneously (quick)
  closeTimeline.to([$detailsLayout, $projectOverlay], {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
    onStart: () => console.log('   🌪️ [DETAILS CLOSE] Content fade-out started'),
    onComplete: () => console.log('   ✅ [DETAILS CLOSE] Content fade-out complete')
  }, 0)
  
  // 2. Scale down to 0 (starts shortly after fade-out begins)
  .to($detailsWrap, {
    scaleY: 0,
    duration: 0.4,
    ease: 'power2.in',
    onStart: () => console.log('   📐 [DETAILS CLOSE] ScaleY collapse started'),
    onComplete: () => console.log('   ✅ [DETAILS CLOSE] ScaleY collapse complete')
  }, 0.1)
  
  // 3. Hide completely when animation is done
  .set($detailsWrap, {
    visibility: 'hidden'
  });
  
  console.log('🏁 [DETAILS CLOSE] Close animation timeline launched!');
}


// ===== SLIDER OVERVIEW TOGGLE =====
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
  
  // STEP 3: Add CSS for overview mode
  console.log('🎨 [OVERVIEW INIT] Step 3: Adding overview mode CSS...');
  const overviewCSS = `
    <style id="slider-overview-css">
      /* Hide navigation buttons in overview mode */
      .swiper.overview-active .slider-prev,
      .swiper.overview-active .slider-next {
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Overview button active state */
      #Overview.active {
        background-color: rgba(0,0,0,0.1) !important;
        color: #000 !important;
      }
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
  // sliderOverviewState.isOverviewMode = true; // BUG: State updated too early
  
  const $overviewBtn = $('#Overview');
  const $swiper = $('.swiper');
  const $swiperWrapper = $('.swiper-wrapper');
  const $slides = $('.swiper-slide');
  const $navButtons = $('.slider-prev, .slider-next');
  
  // Create timeline for smooth transition
  const activateTimeline = gsap.timeline({
    onStart: () => {
      console.log('✨ [OVERVIEW ON] Overview activation started');
    },
    onComplete: () => {
      console.log('✅ [OVERVIEW ON] Overview mode activated - all slides visible');
      sliderOverviewState.isAnimating = false;
      sliderOverviewState.isOverviewMode = true; // CORRECT: State updated on completion
    }
  });
  
  console.log('🎭 [OVERVIEW ON] Step 1: Simple smooth transition to grid...');
  
  // ANIMATION SEQUENCE:
  // 1. Fade out navigation buttons
  activateTimeline.to($navButtons, {
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
    onComplete: () => console.log('   ✅ [OVERVIEW ON] Navigation buttons faded out')
  }, 0)
  
  // 2. Add classes and animate slides into grid
  .add(() => {
    $swiperWrapper.addClass('is-overview');
    $swiper.addClass('overview-active');
    $overviewBtn.addClass('active');
    console.log('   🏷️ [OVERVIEW ON] Classes added: is-overview, overview-active, active');
  }, 0.2)
  
  // 3. Simple fade in of all slides
  .to($slides, {
    opacity: 1,
    duration: 0.4,
    stagger: 0.05,
    ease: 'power2.out',
    onStart: () => console.log('   📋 [OVERVIEW ON] Slides fading into grid layout'),
    onComplete: () => console.log('   ✅ [OVERVIEW ON] All slides visible in grid')
  }, 0.3);
  
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
  // sliderOverviewState.isOverviewMode = false; // BUG: State updated too early
  
  const $overviewBtn = $('#Overview');
  const $swiper = $('.swiper');
  const $swiperWrapper = $('.swiper-wrapper');
  const $slides = $('.swiper-slide');
  const $navButtons = $('.slider-prev, .slider-next');
  
  // Create timeline for smooth transition back
  const deactivateTimeline = gsap.timeline({
    onStart: () => {
      console.log('✨ [OVERVIEW OFF] Overview deactivation started');
    },
    onComplete: () => {
      console.log('✅ [OVERVIEW OFF] Slider mode restored - carousel behavior active');
      sliderOverviewState.isAnimating = false;
      sliderOverviewState.isOverviewMode = false; // CORRECT: State updated on completion
    }
  });
  
  console.log('🎭 [OVERVIEW OFF] Step 1: Simple smooth transition back to slider...');
  
  // ANIMATION SEQUENCE:
  // 1. Fade out slides slightly
  deactivateTimeline.to($slides, {
    opacity: 0.8,
    duration: 0.2,
    ease: 'power2.out',
    onComplete: () => console.log('   📐 [OVERVIEW OFF] Slides fading for transition')
  }, 0)
  
  // 2. Remove classes and switch layout
  .add(() => {
    $swiperWrapper.removeClass('is-overview');
    $swiper.removeClass('overview-active');
    $overviewBtn.removeClass('active');
    console.log('   🏷️ [OVERVIEW OFF] Classes removed: is-overview, overview-active, active');
  }, 0.15)
  
  // 3. Fade slides back to full opacity
  .to($slides, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out',
    onStart: () => console.log('   🎠 [OVERVIEW OFF] Slides returning to carousel layout'),
    onComplete: () => console.log('   ✅ [OVERVIEW OFF] Slides back in carousel mode')
  }, 0.2)
  
  // 4. Fade navigation buttons back in
  .to($navButtons, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out',
    onComplete: () => console.log('   ✅ [OVERVIEW OFF] Navigation buttons restored')
  }, 0.4);
  
  console.log('🚀 [OVERVIEW OFF] Overview deactivation timeline launched!');
}

