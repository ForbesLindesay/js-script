exports.equal = deepEqual
function deepEqual(a, b, circularA, circularB) {
  circularA = circularA || []
  circularB = circularB || []
  if (circularA.indexOf(a) != -1) return circularA.indexOf(a) === circularB.indexOf(b)
  circularA.push(a)
  circularB.push(b)
  if (a === b) return true
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (var i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], circularA, circularB)) return false
    }
    return true
  }
  if (Object.prototype.toString.call(a) === '[object RegExp]') {
    if (Object.prototype.toString.call(b) !== '[object RegExp]') return false
    return a.global === b.global && a.ignoreCase === b.ignoreCase && a.lastIndex === b.lastIndex && a.multiline === b.multiline && a.source === b.source
  }
  if (Object.prototype.toString.call(a) === '[object Date]') {
    if (Object.prototype.toString.call(b) !== '[object Date]') return false
    return a.getTime() === b.getTime()
  }
  if (a && typeof a === 'object') {
    if (typeof b != 'object' || !b) return false
    for (var key in a) {
      if (!deepEqual(a[key], b[key], circularA, circularB)) return false
    }
    for (var key in b) {
      if (!deepEqual(a[key], b[key], circularA, circularB)) return false
    }
    return true
  }
  return false
}
exports.clone = deepClone
function deepClone(a, circularA, circularB) {
  circularA = circularA || []
  circularB = circularB || []
  if (circularA.indexOf(a) != -1) return circularB[circularA.indexOf(a)]
  if (typeof a !== 'object') return a
  if (a == null) return a

  circularA.push(a)
  circularB.push(b)
  if (Array.isArray(a)) {
    var b = []
    circularA.push(a)
    circularB.push(b)
    for (var i = 0; i < a.length; i++) {
      b.push(deepClone(a[i], circularA, circularB))
    }
    return b
  }
  if (Object.prototype.toString.call(a) === '[object RegExp]') {
    var flags = ''
    if (a.global) flags += 'g'
    if (a.ignoreCase) flags += 'i'
    if (a.multiline) flags += 'm'
    var b = new RegExp(a.source, flags)
    b.lastIndex = a.lastIndex
    return b
  }
  if (Object.prototype.toString.call(a) === '[object Date]') {
    return new Date(a.getTime())
  }
  if (a && typeof a === 'object') {
    var b = {}
    circularA.push(a)
    circularB.push(b)
    for (var key in a) {
      b[key] = deepClone(a[key], circularA, circularB)
    }
    return b
  }
  return a
}
