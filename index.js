const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')
const { exec } = require('child_process')
const multer  = require('multer')
const HummusRecipe = require('hummus-recipe')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, 'uploads'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
const upload = multer({ storage: storage })

app.use('/static', express.static(path.join(__dirname, 'static')))
// app.use(express.urlencoded({ extended: true }))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'razmara.html'))
})

app.post('/azmoon', upload.single('attach'), function (req, res) {
    console.log(req.file)
     fs.readFile(path.join(__dirname, "razmara.html"), "utf8", function(err, data) {
        const $ = cheerio.load(data)
        $('input[type="text"], select').each(function(i) {
            $(this).replaceWith(' ' + req.body.in[i])
        })
        const filename = Math.random().toString(36).substr(2, 5)
        fs.writeFile(path.join(__dirname, filename) + '.html', $.html(), () => {
            exec(`google-chrome --headless --disable-gpu --print-to-pdf=${path.join(__dirname, filename)}.pdf ${path.join(__dirname, filename)}.html`, () => {
                let pdf = new HummusRecipe(path.join(__dirname, filename + '.pdf'), path.join(__dirname, filename + '.pdf'))
                pdf = pdf.appendPage(req.file.path)
                pdf.endPDF(() => {
                    let finalpdf = new HummusRecipe(path.join(__dirname, filename + '.pdf'), path.join(__dirname, filename + 'final.pdf'))
                    for (let i = 1; i <= finalpdf.metadata.pages; i++) {
                        finalpdf = finalpdf.editPage(i).text(`page ${i}/${finalpdf.metadata.pages}`, 0, 0).endPage()
                    }
                    finalpdf.endPDF(() => {
                        res.sendFile(path.join(__dirname, filename + 'final.pdf'), undefined, () => {
                            fs.unlink(path.join(__dirname, filename + '.pdf'), () => {})
                            fs.unlink(path.join(__dirname, filename + 'final.pdf'), () => {})
                            fs.unlink(path.join(__dirname, filename + '.html'), () => {})
                        })
                    })
                })
            })
        })
    });
})


app.listen(3000, '0.0.0.0')