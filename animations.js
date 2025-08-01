console.log('🎨 Animations.js loaded');

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
  }, 100);
  
  // Initialize Barba after a small delay
  setTimeout(() => {
  initializeBarba();
  }, 200);
  
});

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
      .swiper-slide {
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
        .swiper-slide {
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
      /* COMMENTED OUT - ORIGINAL TRANSITION
      {
        name: 'modal-style-transition',
        leave(data) {
          console.log('🚪 Leaving page:', data.current.url.path);
          
          // Store current scroll position
          scrollPositions[data.current.url.path] = window.scrollY;
          console.log(`📍 Stored scroll position: ${window.scrollY} for ${data.current.url.path}`);
          
          // Destroy sliders before leaving
          destroySliders();
          
          // Check if the page we are LEAVING is a slider page for the modal effect
          const isLeavingSliderPage = data.current.container.querySelector('.swiper');

          if (isLeavingSliderPage) {
            console.log('🎬 Starting modal-style leave animation (scale down)');
            return gsap.to(data.current.container, {
              opacity: 0,
              scale: 0.95, // MUCH MORE SUBTLE - was 0.7
              duration: 0.4, // Shorter
              ease: "power2.in",
              transformOrigin: '50% 50%'
            });
          } else {
            // OVERVIEW PAGE STAYS COMPLETELY UNCHANGED - NO SCALING, NO FADING
            console.log('🎬 Overview page staying exactly as is - true modal behavior');
            // Return a dummy animation that does nothing
            return gsap.set(data.current.container, {});
          }
        },
        
        enter(data) {
          console.log('🎯 Entering page:', data.next.url.path);
          
          // Check if this is a slider page (has .swiper elements)
          const isSliderPage = data.next.container.querySelector('.swiper');
          
          if (isSliderPage) {
            console.log('🎠 Detected slider page - using modal scale-up transition');
            
            // FIX FLICKER: Initialize sliders *before* the animation
            initializeSliders();

            // KEEP THE SCALE-UP EFFECT - this looks great!
            return gsap.fromTo(data.next.container,
              { opacity: 0, scale: 0.95, transformOrigin: '50% 50%' },
              {
                opacity: 1,
                scale: 1,
                duration: 0.5,
                ease: "power2.out",
                delay: 0,
                onComplete: function() {
                  console.log(`🎬 Modal scale-up complete`);
                  
                  // Animate the individual slides now that the page is visible
                  const slides = data.next.container.querySelectorAll('.swiper-slide');
                  gsap.fromTo(slides,
                    { opacity: 0, scale: 0.8 },
                    {
                      opacity: 1,
                      scale: 1,
                      duration: 0.4,
                      stagger: 0.15,
                      delay: 0,
                      ease: "power2.out"
                    }
                  );
                }
              }
            );
            
          } else {
            // OVERVIEW PAGE - Animate child element to avoid Barba conflicts
            console.log('🏠 Overview page - animating child element');
            
            const childElement = data.next.container.children[0];
            if (childElement) {
              return gsap.fromTo(childElement,
                { opacity: 0 },
                { 
                  opacity: 1, 
                  duration: 0.3,
                  delay: 0.1,
                  ease: "power2.out"
                }
              );
            } else {
              return Promise.resolve();
            }
          }
        },
        
        after(data) {
          console.log('🔄 After transition complete');
          
          // Restore scroll position if we have one stored
          const storedPosition = scrollPositions[data.next.url.path];
          if (storedPosition !== undefined) {
            console.log(`📍 Restoring scroll position: ${storedPosition} for ${data.next.url.path}`);
            window.scrollTo(0, storedPosition);
          } else {
            console.log('📍 No stored position, staying at top');
          }
        }
      */
      
      // TEST: SIMPLE SOFT CROSSFADE - FIXED
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

