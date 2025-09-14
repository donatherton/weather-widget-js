// Don't want to use ES6 imports as older browsers don't support it. So encapsulate appid using iife method
const	appidStore = (() => {
  return {
    getAppid: () => {
      return "Your APPID here";
    }
  }
})();
