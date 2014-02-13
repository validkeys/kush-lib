;(function() {

  window.KenBurns = function KenBurns(el, options) {
    var self = this;

    var defaults = {
      fadeDuration: 2000,
      animationDuration: 4000,
      randomize: true,
      paused: false,
      playFunc: function() {},
      pauseFunc: function() {}
    };

    this.element = $(el);
    this.options = _.extend(defaults, options);

    // This wrapper contains the slides it needs to be position relative and
    // expands to 100% of the size of the element
    this.wrapper = $("<div>").addClass("slide-container");

    // Add slide container to the element
    this.element.append(this.wrapper);

    this.createSlides(this.options.images);
  };

  KenBurns.prototype.createSlides = function(images) {
    var self = this;

    this.transitions = [];

    var animations = this.options.animations || [
      "zoom-in",
      "zoom-out",
      "zoom-in-nw",
      "zoom-in-ne",
      "zoom-in-sw",
      "zoom-in-se",
      "zoom-out-nw",
      "zoom-out-ne",
      "zoom-out-sw",
      "zoom-out-se",
      "rotate-left",
      "rotate-right",
      "pan-w",
      "pan-e",
      "pan-n",
      "pan-s",
      "pan-nw",
      "pan-se",
      "pan-ne",
      "pan-sw"
    ];

    var animationIdx = -1;
    
    function nextAnimation() {
      animationIdx = ++animationIdx >= animations.length ? 0 : animationIdx;

      if (self.options.randomize) {
        animationIdx = Math.floor(Math.random() * animations.length);
      }

      return animations[animationIdx];
    }

    _.each(images, function(src) {
      var slide = $("<div>").addClass("slide");
      self.wrapper.append(slide);

      // Set initial opacity state and image src
      slide.css({
        "opacity": "0",
        "background-image": "url(" + src + ")"
      });

      self.transitions.push(new Transition(slide, {
        vendorPrefix: true,
        property: "opacity",
        duration: self.options.fadeDuration,
        on: function() {
          // Add animation class
          $(this.element).addClass(nextAnimation());
          $(this.element).addClass("animate");

          // Make sure the current slide has the current class added so that we can increase its z-index
          self.slides.removeClass("current").eq(self.idx).addClass("current");
          
          return 1;
        },
        off: 0,
        transitionEnd: function(ev) {
          var transition = this;

          switch (this.state) {
            case "on":
              // We are on set the active state of the container
              self.wrapper.addClass("active");

              // Start the next slide transition after a specified duration
              setTimeout(function() {
                // Only continue if we are currently animating
                if ($(transition.element).hasClass("animate")) {
                  self.nextSlide();

                  // Wait for the next slide to fade in and then set opacity to 0
                  setTimeout(function() {
                    // Fire an immediate transition
                    transition.off({ duration: 0 });
                  }, self.options.fadeDuration);
                }
              }, self.options.animationDuration);
              break;

            case "off":
              // Remove animation class
              $(this.element).removeClass("animate");
              $(this.element).removeClass(animations.join(" "));
              break;
          }
        }
      }));
    });

    this.slides = this.wrapper.find(".slide");

    // Set the animation duration on the slides
    this.slides.css("-webkit-animation-duration", (this.options.fadeDuration * 2 + this.options.animationDuration) + "ms");

    this.start();
  };

  KenBurns.prototype.start = function() {
    var self = this;

    this.idx = this.options.randomize ? Math.floor(Math.random() * this.options.images.length) : 0;

    if (!this.options.paused) {
      // XXX Make sure we start this async so the opacity transition works.
      setTimeout(function() {
        self.transitions[self.idx].on();
      }, 0);
    } else {
      // When paused make sure the first slide is revealed
      this.slides.eq(this.idx).css("opacity", 1);
    }
  };

  KenBurns.prototype.nextSlide = function() {
    this.idx = ++this.idx >= this.options.images.length ? 0 : this.idx;
    this.transitions[this.idx].on();
  };

  KenBurns.prototype.pause = function() {
    this.wrapper.removeClass("active");
    this.wrapper.find(".slide.animate").removeClass("animate");
  };

  KenBurns.prototype.play = function() {
    if (!this.slides.hasClass("animate")) {
      this.transitions[this.idx].off();
      
      this.nextSlide();
    }
  };

}());