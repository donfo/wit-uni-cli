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

const isFileExisted = (file) => {
  return new Promise(function(resolve, reject) {
    fs.access(file, (err) => {
      if (err) {
        reject(false)
      } else {
        resolve(true)
      }
    })
  })
}

const handle = async (appsdir) => {
  
  log(chalk.blue('store处理中，请稍后...') + `[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]`)
  let storeDefault = await fs.readFileSync('./store/store.js', 'utf-8')
  for (i = 0; i < appsdir.length; i++) {
    try {
      const isExisted = await isFileExisted(`${appsdir[i]}/store.js`)
      if (isExisted) {
        const store = await fs.readFileSync(`${appsdir[i]}/store.js`, 'utf-8')
        // 处理state
        const storeState = store.match(/state:(.|\n|\r)*getters:/gi)[0].replace(/,?(\s|\n|\r)*},(\s|\n|\r)*getters:/gi, '')
        if (!/state:(.|\n|\r)*{$/gi.test(storeState)) {
          storeDefault = storeDefault.replace(/state:(\s|\n|\r)*{{1}/gi, storeState + ',')
        }
        // 处理getters
        const storeGetters = store.match(/getters:(.|\n|\r)*mutations:/gi)[0].replace(/,?(\s|\n|\r)*},(\s|\n|\r)*mutations:/gi, '')
        if (!/getters:(.|\n|\r)*{$/gi.test(storeGetters)) {
          storeDefault = storeDefault.replace(/getters:(\s|\n|\r)*{{1}/gi, storeGetters + ',')
        }
        // 处理mutations
        const storeMutations = store.match(/mutations:(.|\n|\r)*actions:/gi)[0].replace(/,?(\s|\n|\r)*},(\s|\n|\r)*actions:/gi, '')
        if (!/mutations:(.|\n|\r)*{$/gi.test(storeMutations)) {
          storeDefault = storeDefault.replace(/mutations:(\s|\n|\r)*{{1}/gi, storeMutations + ',')
        }
        // 处理actions
        const storeActions = store.match(/actions:(.|\n|\r)*}(\s|\n|\r)*$/gi)[0].replace(/(,?(\s|\n|\r)*}(\s|\n|\r)*){2}$/gi, '')
        if (!/actions:(.|\n|\r)*{$/gi.test(storeActions)) {
          storeDefault = storeDefault.replace(/actions:(\s|\n|\r)*{{1}/gi, storeActions + ',')
        }
      }
    } catch (error) {}
  }
  log(storeDefault)
  fs.writeFile('./store/index.js', storeDefault, (err) => {
     if(err) throw err
     log(chalk.green('store处理成功！') + `[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]\n`)
  })
  
  
  log(chalk.blue('page处理中，请稍后...') + `[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]`)
  const pagesDefault = await readFileJSON('./pages-default.json')
  for (i = 0; i < appsdir.length; i++) {
    const data = await readFileJSON(`${appsdir[i]}/pages.json`)
    pagesDefault.pages.push(...data.pages)
  }
  log(pagesDefault)
  fs.writeFile('./pages.json', JSON.stringify(pagesDefault), (err) => {
     if(err) throw err
     log(chalk.green('page处理成功！') + `[${dayjs().format('YYYY-MM-DD hh:mm:ss')}]\n`)
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
    log(answers.apps)
  })
}

