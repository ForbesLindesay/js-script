
var barrage = require('barrage')
var hyperquest = require('hyperquest')

module.exports = get
function get(url) {
  return barrage(hyperquest(url)).buffer('buffer')
}