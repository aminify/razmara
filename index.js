var express = require('express')
var app = express()
var path = require('path')
var fs = require('fs')
const cheerio = require('cheerio')
const { exec } = require('child_process');

app.use('/static', express.static('static'))
app.use(express.urlencoded({ extended: true }))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'razmara.html'))
})

app.post('/azmoon', function (req, res) {
     console.log(req.body)
     fs.readFile("razmara.html", "utf8", function(err, data) {
        const $ = cheerio.load(data)
        $('input[type="text"]').each(function(i) {
            $(this).replaceWith(req.body['' + i])
        })
        const filename = Math.random().toString(36).substr(2, 5)
        fs.writeFile(filename + '.html', $.html(), () => {
            exec(`google-chrome --headless --disable-gpu --print-to-pdf=${filename}.pdf ${filename}.html`, () => {
                res.sendFile(path.join(__dirname, filename + '.pdf'), undefined, () => {
                    fs.unlink(filename + '.pdf', () => {})
                    fs.unlink(filename + '.html', () => {})
                })
            })
        })
    });
})


app.listen(3000, '0.0.0.0')