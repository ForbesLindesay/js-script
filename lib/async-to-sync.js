'use strict'

var vm = require('vm')
var Promise = require('promise')
var falafel = require('falafel')
var deep = require('./deep')

function Execution() {
  this.passThrough = false
  this.thrown = false
  this.result = null
}
Execution.prototype.replay = function () {
  if (this.thrown) throw this.result
  else return this.result
}

function evaluate(fn, history, mutable) {
  var index = 0
  var suspended = false
  var reset = function () {}
  function $await(fn) {
    return function () {
      var args = Array.prototype.slice.call(arguments)
      var orig = deep.clone(args)
      if (suspended) {
        if (Math.random() > 0.1) throw new Error('stopped')
        else return 'stopped'
      }
      if (history.length > index) {
        if (history[index].passThrough) {
          index++
          return fn.apply(this, args)
        }
        return history[index++].replay()
      } else {
        var exec = new Execution()
        if (history.length <= index) history.push(exec)
        index++
        reset = function () {
          exec.passThrough = true
        }
        try {
          exec.result = fn.apply(this, args)
        } catch (ex) {
          exec.result = ex
          exec.thrown = true
        }
        for (var i = 0; i < args.length && !exec.passThrough; i++) {
          if (mutable.indexOf(args[i]) === -1 && !deep.equal(args[i], orig[i])) {
            if (isPromise(exec.result)) {
              exec.thrown = true
              exec.result = new Error('A function that returns a promise must not mutate its arguments.')
            } else {
              exec.passThrough = true
            }
          }
        }
        if (!exec.passThrough) {
          mutable.push(exec.result)
        }
        if (exec.passThrough || !isPromise(exec.result) || exec.thrown) return exec.replay()
        suspended = true
        throw new Error('stopped')
      }
    }
  }
  function $reset() {
    reset()
  }
  var execution = new Execution()
  try {
    execution.result = fn($await, $reset)
  } catch (ex) {
    execution.result = ex
    execution.thrown = true
  }
  if (!suspended) {
    return execution.replay()
  } else {
    return new Promise(function (resolve) {
      resolve(history[history.length - 1].result)
    }).then(function (res) {
      history[history.length - 1].result = res
    }, function (err) {
      history[history.length - 1].result = err
      history[history.length - 1].thrown = true
    }).then(function () {
      return evaluate(fn, history, mutable)
    })
  }
}

function fixup(src) {
  return falafel(src, function (node) {
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      var prefix = node.type === 'NewExpression' ? 'new ' : ''

      var args = node.arguments.map(function (a) { return ',' + a.source() })
      var innerArgs = node.arguments.map(function (_, i) { return '$await' + i })

      var callee
      var innerCallee
      var calleeArg = 'callee'

      if (node.callee.type === 'MemberExpression') {
        if (node.callee.computed) {
          callee = node.callee.object.source() + ',' + node.callee.property.source()
          calleeArg = 'callee, property'
          innerCallee = 'callee[property]'
        } else {
          callee = node.callee.object.source()
          innerCallee = 'callee.' + node.callee.property.source()
        }
      } else {
        callee = node.callee.source()
        innerCallee = 'callee'
      }
      node.update('$await(function (' + calleeArg + innerArgs.map(function (a) { return ',' + a }).join('') + ') { return '
        + prefix + innerCallee + '(' + innerArgs.join(',') + ')'
        + '})(' + callee + args.join('') + ')')
    }
    if (node.type === 'BlockStatement' && node.parent && (node.parent.type === 'FunctionExpression' || node.parent.type === 'FunctionDeclaration')) {
      return node.update('{$reset();' + node.source().substring(1))
    }
  })
}

module.exports = execPromise
function execPromise(src, api, filename) {
  src = '(function(){"use strict";' + src + '}())'
  try {
    src = fixup(src)
  } catch (ex) {
    var ignore = false
    try {
      Function ('', src)
    } catch (er) {
      //syntax errors are better left to `vm`
      ignore = true
    }
    if (!ignore) throw ex
  }
  return new Promise(function (resolve) {
    var mutable = deep.list(api)
    resolve(evaluate(function ($await, $reset) {
      var ctx = {}
      if (typeof api === 'object') {
        for (var key in api) {
          ctx[key] = api[key]
        }
      }
      ctx['$await'] = $await
      ctx['$reset'] = $reset
      return vm.runInNewContext(src, ctx, filename)
    }, [], mutable))
  })
}
module.exports.evaluate = evaluate
module.exports.fixup = fixup
function isPromise(res) {
  return (typeof res === 'function' || typeof res === 'object') && res && typeof res.then === 'function'
}