const chalk = require('chalk')
const puppeteer = require('puppeteer')

const players = [
  { name: 'Björn', url: 'https://www.dndbeyond.com/characters/48002358' },
  { name: 'Einarr', url: 'https://www.dndbeyond.com/characters/43201577' },
  { name: 'Gramdoul', url: 'https://www.dndbeyond.com/characters/95971' },
  { name: 'Knuckles', url: 'https://www.dndbeyond.com/characters/37239100' },
  { name: 'Malcon', url: 'https://www.dndbeyond.com/characters/48112517' },
  { name: 'Searos', url: 'https://www.dndbeyond.com/characters/37246059' },
]

const getHP = async (browser, player) => {
  const page = await browser.newPage()

  // Get the page for the given player
  await page.goto(player.url, {timeout: 0})

  // wait for the current health element to be visible
  // note we're selecting for the mobile view, which is what shows up at the puppeteer default
  // viewport; we could resize this if required.
  await page.waitForSelector('.ct-status-summary-mobile__hp-current', {
    visible: true,
  })

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

;(async () => {
  const browser = await puppeteer.launch()

  // get the HP from each Player's sheet
  console.log(chalk`{grey Fetching data from dndbeyond.com...}`)
  const results = await Promise.all(players.map((p) => getHP(browser, p)))

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
