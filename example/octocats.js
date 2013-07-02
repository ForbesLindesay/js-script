//This code looks synchronous, but it really isn't

mkdir('output')
var url = 'http://octodex.github.com/'
var html = get(url).toString()
var pattern = /(http:\/\/octodex.github.com\/images\/[a-z0-9\-]+\.[a-z]+)/ig;
var match;
while (match = pattern.exec(html)) {
  console.log(match[1].replace(/^.*\//g, '').replace(/\....$/, ''))
  writeFile('output/' + match[1].replace(/^.*\//g, ''), get(match[1]))
}