window.postMessage({ type: 'FROM_PAGE', text: window.rawData }, '*');

function smoothScroll(target, duration) {
  var targetPosition = target;
  var startPosition = window.pageYOffset;
  var distance = targetPosition - startPosition;
  var startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    var timeElapsed = currentTime - startTime;
    var run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }

  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

function isClickable(element) {
  if (element.tagName === 'A') {
    return true;
  }

  if (element.parentElement) {
    return isClickable(element.parentElement);
  }

  return false;
}

function randomClick(y) {
  // Get x,y coordinates within the viewable area
  const x = Math.floor(Math.random() * window.innerWidth);

  // Attempt to click on the current topmost element at the random position
  const element = document.elementFromPoint(x, y);
  if (element && !isClickable(element)) {
    // Create a new click event
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });

    // Dispatch the click event
    element.dispatchEvent(clickEvent);
  }
}

function randomSmoothScroll() {
  setInterval(function () {
    var maxHeight = document.body.scrollHeight - window.innerHeight;
    var randomHeight = Math.floor(Math.random() * maxHeight);
    smoothScroll(randomHeight, 1000);
    randomClick(randomHeight);
  }, 2500);
}

randomSmoothScroll();
