
var tools = module.exports = {};

tools.argArray = function(args) {
  return Array.prototype.slice.call(args, 0);
}
