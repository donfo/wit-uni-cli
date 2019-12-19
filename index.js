#!/usr/bin/env node

let fs = require('fs')
let shell = require('shelljs')
let watch = require('node-watch')
let dayjs = require('dayjs')

let readFileJSON = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

let init = async () => {
  console.log(`处理中，请稍后...[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]`)
  let pagesDefault = await readFileJSON('./pages-default.json')
  let files = shell.find('./pages/app/**/pages.json')
  for (i = 0; i < files.length; i++) { 
    let data = await readFileJSON(files[i])
    pagesDefault.pages.push(...data.pages)
  }
  console.log(pagesDefault)
  fs.writeFile('./pages.json', JSON.stringify(pagesDefault), (err) => {
     if(err) throw err
     console.log(`处理成功！[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]\n`)
  })
}

if (process.argv[2] === 'watch') {
  watch(['./pages/app/', './pages-default.json'], { recursive: true, filter: /pages.json$/ }, () => {
    init()
  })
}

init()
