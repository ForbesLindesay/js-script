

var repl = require('repl')
var vm = require('vm')
var Promise = require('promise')
var js = require('../lib/async-to-sync')
var code = ''
var history = []


var builtins = ['assert', 'buffer', 'child_process', 'cluster',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'net',
  'os', 'path', 'punycode', 'querystring', 'readline', 'stream',
  'string_decoder', 'tls', 'tty', 'url', 'util', 'vm', 'zlib', 'smalloc'];
function newContext() {
  var context = {};
  for (var i in global) context[i] = global[i];
  context.console = console;
  context.global = context;
  context.global.global = context;

  context.module = module;
  context.require = require;

  // make built-in modules available directly
  // (loaded lazily)
  builtins.forEach(function(name) {
    Object.defineProperty(context, name, {
      get: function() {
        var lib = require(name);
        context._ = context[name] = lib;
        return lib;
      },
      // allow the creation of other globals with this name
      set: function(val) {
        delete context[name];
        context[name] = val;
      },
      configurable: true
    });
  });

  return context;
}


repl.start({
  ignoreUndefined: true,
  eval: function (cmd, context, filename, callback) {
    code += '\n' + (cmd.trim().replace(/^\(/, '').replace(/\)$/, ''))
    var res
    try {
      var src = js.fixup(code)
      res = new Promise(function (resolve) {
        resolve(js.evaluate(function ($await, $reset) {
          var ctx = newContext()
          ctx['$await'] = $await
          ctx['$reset'] = $reset
          return vm.runInNewContext(src, ctx, filename)
        }, history))
      })
    } catch (ex) {
      console.error(ex.stack)
      return callback(ex)
    }
    res.nodeify(callback)
  }
})