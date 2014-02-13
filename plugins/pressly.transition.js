(function() {

  function Transition(el, options) {
    this.defaults = {
      disableGestures: true,
      vendorPrefix: false,
      curve: "ease-out"
    };

    this.options = _.extend(this.defaults, options);

    this.element = $(el).get(0);

    this.init();
  }

  Transition.transitions = [];

  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  Transition.prototype.init = function() {
    var self = this;

    this.state = this.options.state || "off";

    // Set transitionEnd Handler
    if (this.options.transitionEnd) {
      this.addTransitionEndListener(this.options.transitionEnd);
    } else {
      // Set empty stub function
      this.addTransitionEndListener(function() {});
    }

    // Set the transition property
    this.property = this.options.property;

    this.prefix = "webkit";

    if (navigator.userAgent.search("Firefox") !== -1) {
      this.prefix = "moz";
    }

    this.vendorProperty = capitalize(this.prefix) + capitalize(this.property);
    this.vendorTransitionProperty = capitalize(this.prefix) + "Transition";
    this.vendorCssProperty = "-" + this.prefix + "-" + this.property;

    // Set the default timing function
    this.curve = this.options.curve;

    Transition.transitions.push(this);
  };

  Transition.prototype.addTransitionEndListener = function(func) {
    var self = this;

    // Bind the callbacks context to this transition object
    func = _.bind(func, self);

    this.transitionEnd = function(ev) {
      if (self.state === "turning-on") {
        self.state = "on";
      } else if (self.state === "turning-off") {
        self.state = "off";
      }

      self.busy = false;

      func(ev);
    };

    $(this.element).bind("webkitTransitionEnd transitionend", self.transitionEnd);
  };

  // Fire a transition with params and duration
  //  params is the actual style param you want set
  //  duration is either a number or undefined:
  //    if 0 duration we force an immediate transition and manually fire the transitionEnd function
  //    if undefined duration the transition still happens immediately but the transitionEnd function is suppressed
  Transition.prototype.fire = function(params, duration, state) {
    this.state = state; // default to undefined

    // Filter translateZ from moz transforms
    if (this.prefix === "moz") {
      params = params.replace(/\stranslateZ\(.+\)/, "");
    }

    if (this.isBusy()) {
      this.aborted();
    }

    this.duration = duration;

    this.busy = true;
    this.startTime = (new Date()).getTime();
    this.endTime = this.startTime + (duration || 0);

    if (typeof duration === "number" && duration > 0) {
      this.element.style[this.vendorTransitionProperty] = (this.options.vendorPrefix ? this.vendorCssProperty : this.property) + " " + duration + "ms " + this.curve;
    } else {
      // Clear transitions
      this.element.style[this.vendorTransitionProperty] = "";
    }

    // If the requested params have previously been set just fire the
    // transitionEnd function otherwise set the params
    if (this.isAlreadySet(params)) {
      // When no duration is given we do not want to fire the transitionEnd
      if (duration !== undefined) {
        this.transitionEnd();
      } else {
        this.busy = false;
      }
    } else {
      this.setParams(params);

      // Instant transition: transitionEnd event listeners don't fire
      // when a zero transition time is requested so we do it manually
      if (duration === 0) {
        this.transitionEnd();
      } else if (duration === undefined) {
        // allow user to avoid transitionEnd when no duration is supplied
        this.busy = false;
      }
    }

    this.params = params;
  };

  Transition.prototype.on = function(options) {
    options = options || {};

    var value = options.value || this.options.on || "";
    var duration = options.duration !== undefined ? options.duration : this.options.duration;

    if (typeof value === "function") {
      value = value.call(this);
    }

    this.fire(value, duration, "turning-on");
  };

  Transition.prototype.off = function(options) {
    options = options || {};

    var value = options.value || this.options.off;
    var duration = options.duration !== undefined ? options.duration : this.options.duration;

    if (typeof value === "function") {
      value = value.call(this);
    }

    this.fire(value, duration, "turning-off");
  };

  Transition.prototype.is = function(state) {
    return this.state === state;
  };

  Transition.prototype.isBusy = function() {
    return this.busy && this.duration;
  };

  // Validates the requested transition parameters
  Transition.prototype.isAlreadySet = function(params) {
    var currentValue = this.options.vendorPrefix ? this.element.style[this.vendorProperty] : this.element.style[this.property];
    return params === currentValue;
  };

  Transition.prototype.setParams = function(params) {
    if (this.options.vendorPrefix) {
      this.element.style[this.vendorProperty] = params;
    } else {
      this.element.style[this.property] = params;
    }
  };

  // Current transition was aborted. Values were changed in the middle of a transition.
  Transition.prototype.aborted = function() {
  };

  Transition.analyze = function(){
    Pressly.Util.analyze(Transition, "transitions");
  };

  // Destroy event listeners
  Transition.prototype.destroy = function() {
    $(this.element).unbind("webkitTransitionEnd transitionend", this.transitionEnd);

    Transition.transitions.splice(Transition.transitions.indexOf(this), 1);
  };

  window.Transition = Transition;

}());