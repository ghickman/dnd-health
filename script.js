const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const puppeteer = require('puppeteer')

const getHP = async (browser, cookie, player) => {
  const page = await browser.newPage()
  await page.setCookie({
    name: "CobaltSession",
    value: cookie,
    domain: ".dndbeyond.com",
    httpOnly: true,
    secure: true,
  })

  // Get the page for the given player
  await page.goto(player.url, {timeout: 0})

  // The current health element is missing if the character is down or
  // something has changed with the site.
  try {
    // Wait for the current health element to be visible.  We're selecting for
    // the mobile view, which is what shows up at the puppeteer default
    // viewport.
    await page.waitForSelector('.ct-status-summary-mobile__hp-current', {
      timeout: 5000,
      visible: true,
    })
  } catch (TimeoutError) {
    return { ...player, current: "-", max: "-", half: "-" }
  }

  const current = await page.$eval(
    '.ct-status-summary-mobile__hp-current',
    (el) => parseInt(el.innerText)
  )
  const max = await page.$eval(
    '.ct-status-summary-mobile__hp-max',
    (el) => parseInt(el.innerText)
  )
  const half = Math.floor(max / 2)

  return { ...player, current, max, half }
}

const getPlayers = () => {
  const filepath = path.join(__dirname, "players.csv")

  if (!fs.existsSync(filepath)) {
    console.log(chalk`{red players.csv missing from ${__dirname}, please add one}`)
    process.exit(1)
  }

  const data = fs.readFileSync(filepath, 'utf8')
  return data.split(/\r?\n/).filter(line => line).map(line => {
    const [name, url] = line.split(',')
    return {name, url}
  })
}

;(async () => {
  if (process.argv.length < 3) {
    console.log(chalk`{red Session cookie for dndbeyond.com missing}`)
    process.exit(1)
  }
  const cookie = process.argv.pop()

  const players = getPlayers()

  const browser = await puppeteer.launch()

  // get the HP from each Player's sheet
  console.log(chalk`{grey Fetching data from dndbeyond.com...}`)
  const results = await Promise.all(players.map((p) => getHP(browser, cookie, p)))

  // write out name and hp, padded so the colons line up, obvs
  results.forEach((player) => {
    const name = player.name.padStart(8, ' ')
    const current = String(player.current).padStart(3, ' ')
    const max = String(player.max).padEnd(3, ' ')

    // Change current HP as it decreases
    let current_colour = chalk.green
    if (player.current < player.max && player.current > player.half) {
      current_colour = chalk.magenta
    }
    if (player.current < player.half) {
      current_colour = chalk.red.bold
    }

    const message = `${name}: ${current_colour(current)}/${chalk.green(max)} (${chalk.cyan(player.half)})`
    console.log(message)
  })

  await browser.close()
})()
