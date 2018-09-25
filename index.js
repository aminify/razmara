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

app.post('/azmoon', upload.array('attach'), function (req, res) {
     fs.readFile(path.join(__dirname, "razmara.html"), "utf8", function(err, data) {
        const $ = cheerio.load(data)
        $('input[type="text"], select').each(function(i) {
            $(this).replaceWith(' ' + req.body.in[i])
        })
        const filename = Math.random().toString(36).substr(2, 5)
        fs.writeFile(path.join(__dirname, filename) + '.html', $.html(), () => {
            exec(`google-chrome --headless --disable-gpu --print-to-pdf=${path.join(__dirname, filename)}.pdf ${path.join(__dirname, filename)}.html`, () => {
                if (req.files.length > 0) {
                    const footer = $('.footer')
                    $('body').empty()
                    $('body').append(footer)
                    fs.writeFile(path.join(__dirname, filename) + '.html', $.html(), () => {
                        exec(`google-chrome --headless --disable-gpu --screenshot=${path.join(__dirname, filename)}.png --window-size=794,150 ${path.join(__dirname, filename)}.html`, () => {
                            try {
                                const pdfaccPath = path.join(__dirname, Date.now() + '.pdf')
                                let pdfacc = new HummusRecipe('new', pdfaccPath)
                                for(let i = 0; i < req.files.length; i++) {
                                    pdfacc.appendPage(req.files[i].path)
                                }
                                pdfacc.endPDF(() => {
                                    let attachedpdf = new HummusRecipe(pdfaccPath, pdfaccPath)
                                    for (let i = 1; i <= attachedpdf.metadata.pages; i++) {
                                        attachedpdf = attachedpdf.editPage(i)
                                            .image(path.join(__dirname, 'static', 'khadamat-logo.png'), 480, 0, {width: 75, keepAspectRatio: true})
                                            .text('Certificate NO: ' + req.body.in[0], 230, 30)
                                            .image(path.join(__dirname, filename) + '.png', 0, 730, {width: 595, keepAspectRatio: true})
                                            .endPage()
                                    }
                                    attachedpdf.endPDF(() => {
                                        let pdf = new HummusRecipe(path.join(__dirname, filename + '.pdf'), path.join(__dirname, filename + '.pdf'))
                                        pdf = pdf.appendPage(pdfaccPath)
                                        pdf.endPDF(() => {
                                            let finalpdf = new HummusRecipe(path.join(__dirname, filename + '.pdf'), path.join(__dirname, filename + 'final.pdf'))
                                            for (let i = 1; i <= finalpdf.metadata.pages; i++) {
                                                finalpdf = finalpdf.editPage(i).text(`page ${i}/${finalpdf.metadata.pages}`, 30, 30).endPage()
                                            }
                                            finalpdf.endPDF(() => {
                                                res.sendFile(path.join(__dirname, filename + 'final.pdf'), undefined, () => {
                                                    fs.unlink(path.join(__dirname, filename + '.pdf'), () => {})
                                                    fs.unlink(path.join(__dirname, filename + 'final.pdf'), () => {})
                                                    fs.unlink(path.join(__dirname, filename + '.html'), () => {})
                                                    fs.unlink(path.join(__dirname, filename + '.png'), () => {})
                                                    fs.unlink(pdfaccPath, () => {})
                                                })
                                            })
                                        })
                                    })
                                })
                            } catch (err) {
                                res.send('<body dir="rtl">فایل ارسالی قابل پردازش نبود. لطفا از pdf بودن فرمت اطمینان حاصل کنید.</body>')
                                fs.unlink(path.join(__dirname, filename + '.pdf'), () => {})
                                fs.unlink(path.join(__dirname, filename + 'final.pdf'), () => {})
                                fs.unlink(path.join(__dirname, filename + '.html'), () => {})
                                fs.unlink(path.join(__dirname, filename + '.png'), () => {})
                                fs.unlink(pdfaccPath, () => {})
                            }
                        })
                    })
                } else {
                    let finalpdf = new HummusRecipe(path.join(__dirname, filename + '.pdf'), path.join(__dirname, filename + 'final.pdf'))
                    finalpdf.editPage(1).text(`page 1/1`, 30, 30).endPage().endPDF(() => {
                        res.sendFile(path.join(__dirname, filename + 'final.pdf'), undefined, () => {
                            fs.unlink(path.join(__dirname, filename + '.pdf'), () => {})
                            fs.unlink(path.join(__dirname, filename + 'final.pdf'), () => {})
                            fs.unlink(path.join(__dirname, filename + '.html'), () => {})
                        })
                    })
                }
            })
        })
    });
})


app.listen(3000, '0.0.0.0')