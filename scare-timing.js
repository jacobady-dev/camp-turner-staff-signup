(() => {
  const nativeSetTimeout = window.setTimeout.bind(window);

  window.setTimeout = function(callback, delay, ...args) {
    const adjustedDelay = delay === 4700 ? 14200 : delay;
    return nativeSetTimeout(callback, adjustedDelay, ...args);
  };
})();