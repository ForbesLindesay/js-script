//This code looks synchronous, but it really isn't

try {
  mkdir('output')
} catch (ex) {
  console.warn('overwriting file')
}
var url = 'http://octodex.github.com/'
var html = get(url).toString()
var pattern = /(http:\/\/octodex.github.com\/images\/[a-z0-9\-]+\.[a-z]+)/ig;
var match;
while (match = pattern.exec(html)) {
  var start = new Date()
  writeFile('output/' + match[1].replace(/^.*\//g, ''), get(match[1]))
  var end = new Date()
  console.log(match[1].replace(/^.*\//g, '').replace(/\....$/, '') + ' (' + (end - start) + 'ms)')
}