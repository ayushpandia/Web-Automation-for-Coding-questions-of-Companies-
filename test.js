// Lecture-17
// node test.js --url=https://www.hackerrank.com --config=config.json

let minimist=require('minimist')
let fs=require('fs')
let puppeteer=require('puppeteer')
const { POINT_CONVERSION_COMPRESSED } = require('constants')
let args=minimist(process.argv)

let configJSON=fs.readFileSync(args.config, "utf-8")
let configJSO=JSON.parse(configJSON)

async function run()
{
    let browser=await puppeteer.launch({
        headless:false,
        args:
        ['--start-maximised'],
        defaultViewport:null
    })

    pages=await browser.pages()
    page=pages[0]

    await page.goto(args.url)

    await page.waitForSelector("a[data-event-action='Login']")
    await page.click("a[data-event-action='Login']")

    await page.waitForSelector("a[href='https://www.hackerrank.com/login']")
    await page.click("a[href='https://www.hackerrank.com/login']")

    await page.waitForSelector("input[name='username']")
    await page.type("input[name='username']", configJSO.userid, {delay:20})

    await page.waitForSelector("input[name='password']")
    await page.type("input[name='password']", configJSO.password, {delay:20})

    await page.waitForSelector("button[type='submit']")
    await page.click("button[type='submit']")

    await page.waitForSelector("a[data-analytics='NavBarContests']")
    await page.click("a[data-analytics='NavBarContests']")

    await page.waitForSelector("a[href='/administration/contests/']")
    await page.click("a[href='/administration/contests/']")

    await page.waitForSelector("a[data-attr1='Last']")
    let numPages=await page.$eval("a[data-attr1='Last']", function(atag){
        return parseInt(atag.getAttribute("data-page"))
    })
    console.log(numPages)


}

run()