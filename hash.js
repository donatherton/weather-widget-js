// Don't want to use ES6 imports as older browsers don't support it. So encapsulate hash using closure
function hashStore() {
  const hash = "7f8871108ffeac097a03c40598d0232f";
  return () => {
    return hash;
  };
};
const getHash = hashStore()
