#!/usr/bin/env node

const fs = require('fs')
const shell = require('shelljs')
const watch = require('node-watch')
const dayjs = require('dayjs')
const inquirer = require('inquirer')
const minimist = require('minimist')
const chalk = require('chalk')
const log = console.log

const readFileJSON = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        log(chalk.red(err))
        reject(err)
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

const handle = async (appsdir) => {
  log(chalk.blue('处理中，请稍后...') + `[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]`)
  const pagesDefault = await readFileJSON('./pages-default.json')
  for (i = 0; i < appsdir.length; i++) {
    const data = await readFileJSON(`${appsdir[i]}/pages.json`)
    pagesDefault.pages.push(...data.pages)
  }
  console.log(pagesDefault)
  fs.writeFile('./pages.json', JSON.stringify(pagesDefault), (err) => {
     if(err) throw err
     log(chalk.green('处理成功！') + `[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]\n`)
  })
}

const init = (apps) => {
  const appsdir = apps.map(item => {
    return `./pages/app/${item}`
  })
  if (argv._.indexOf('watch') !== -1) {
    watch([...appsdir, './pages-default.json'], { recursive: true, filter: /pages.json$/ }, () => {
      handle(appsdir)
    })
  }
  handle(appsdir)
}

const argv = minimist(process.argv.slice(2))
const apps = shell.ls('./pages/app/')
const defaultApps = argv._.filter(item => item !== 'watch')
if (argv.j) {
  init(defaultApps)
} else {
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'apps',
      message: '请选择需要编译的模块',
      choices: apps,
      default: defaultApps
    }
  ]).then(answers => {
    init(answers.apps)
    console.log(answers.apps)
  })
}

