// Don't want to use ES6 imports as older browsers don't support it. So encapsulate appid using iife method
function appidStore() {
  const appid = "Your APPID here";
  return () => {
    return appid;
  };
};
const getAppid = appidStore()
