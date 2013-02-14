// Taken from https://github.com/superjoe30/node-plan/blob/master/lib/extend.js, thanks superjoe30!
var own = {}.hasOwnProperty;
function extend(obj, src){
  for (var key in src) {
    if (own.call(src, key)) obj[key] = src[key];
  }
  return obj;
}

module.exports = extend;