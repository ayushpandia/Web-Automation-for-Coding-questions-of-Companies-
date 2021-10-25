// node alternate.js --url=https://www.geeksforgeeks.org/ --config=config.JSON --company=ibm

// Importing all the libraries
let minimist=require('minimist')
let fs=require('fs')
let puppeteer=require('puppeteer')
let axios = require("axios");
let jsdom = require("jsdom");
let excel4node = require("excel4node");
let pdf = require("pdf-lib");

let path = require("path");
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require('constants');
let args=minimist(process.argv)

// Store the Login credentials of User
let configJSON=fs.readFileSync(args.config, "utf-8")
let configJSO=JSON.parse(configJSON)

async function app()
{
    // Part of User Data Extraction
    var required_company=args.company.toLowerCase()

    let browser=await puppeteer.launch({
        headless:false,
        args:
        ['--start-maximised'],
        defaultViewport:null
    })

    pages=await browser.pages()
    page=pages[0]

    await page.goto(args.url)
    await page.waitFor(2000)

    await page.waitForSelector("a.header-main__signup.login-modal-btn")
    await page.click("a.header-main__signup.login-modal-btn")

    await page.waitFor(2000)

    await page.waitForSelector("input[name='user']")
    await page.type("input[name='user']", configJSO.userid, {delay:60})

    await page.waitForSelector("input[name='pass']")
    await page.type("input[name='pass']", configJSO.password, {delay:60})

    await page.waitForSelector("button.btn.btn-green.signin-button")
    await page.click("button.btn.btn-green.signin-button")

    await page.waitForSelector("img[src='https://media.geeksforgeeks.org/img-practice/user_web-1598433228.svg']")
    await page.click("img[src='https://media.geeksforgeeks.org/img-practice/user_web-1598433228.svg']")

    await page.waitForSelector("span.gfg-icon.gfg-icon_user")
    await page.click("span.gfg-icon.gfg-icon_user")

    await page.waitForSelector("span.gfg-icon.leftbar-icon.gfg-icon_code")
    await page.click("span.gfg-icon.leftbar-icon.gfg-icon_code")

    // All the problems submitted by the User
    await page.waitForSelector("li.mdl-cell.mdl-cell--6-col.mdl-cell--12-col-phone")
    let problems = await page.$$eval("li.mdl-cell.mdl-cell--6-col.mdl-cell--12-col-phone", function(lists){
        let prob = [];

        for (let i = 0; i < lists.length; i++) {
            let url = lists[i].innerText;
            prob.push(url);
        }

        return prob;
    })
    
    // Part of Company Problems extraction

    let gfg_url="https://practice.geeksforgeeks.org/company-tags"
    let company_name=args.company.toLowerCase()

    await page.goto(gfg_url)
    
    // Searching the input company name in the list of companies present on gfg site
    await page.waitForSelector("b")
    let companies = await page.$$eval("b", function(tags){
        let size=tags.length
        let searched=[]
        for(let i=0;i<size;i++)
        {
            searched.push(tags[i].innerText)
        }
        return searched
    })
    
    let company_exists=0;
    let company_link="";
    for(let i=0;i<companies.length;i++)
    {
        if(companies[i].toLowerCase()==required_company)
        {
            company_exists=1
            company_link=companies[i]
            break
        }
    }
    if(company_exists==0)
    {
        return;
    }

    href=`https://practice.geeksforgeeks.org/company/${company_link}`
    await page.goto(href)

    // Infinite Scrolling to handle Lazy page loading 
    await autoScroll(page);
    
    async function autoScroll(page){
        await page.evaluate(async () => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 100;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
    
                    if(totalHeight >= scrollHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    }

    // Iterating through all the problem names.
    await page.waitForSelector("span[style='display:block;font-size: 20px !important']")
    let questions = await page.$$eval("span[style='display:block;font-size: 20px !important']", function(spans){
        company_problems=[]
        for(let i=0;i<spans.length;i++)
        {
            company_problems.push(spans[i].innerText)
        }
        return company_problems
    })
    
    excel_file_name=company_link+'.csv'
    prepareExcel(questions, company_link, excel_file_name)

    function prepareExcel(questions, company_link, excel_file_name) {

        // Adding color to a cell
        function colorCell(color, pattern) {

            return wb.createStyle({
                fill: {
                    type: 'pattern',
                    fgColor: color,
                    patternType: pattern || 'solid',
                }
            });
        }

        let wb = new excel4node.Workbook();
        let tsheet = wb.addWorksheet(company_link);
    
        tsheet.cell(1, 1).string("PROBLEM");
        tsheet.cell(1, 6).string("DONE(Y/N)");

        for (let j = 0; j < questions.length; j++) 
        {
            let this_problem=questions[j]
            tsheet.cell(3 + j, 1).string(this_problem);
            let present=false;
            // Iterating through the list of user's solved problems to check this_problem
            for(let i=0;i<problems.length;i++)
            {
                if(problems[i]==this_problem)
                {
                    present=true;
                    break
                }
            }
            if(present==true)
                tsheet.cell(3 + j, 6).style(colorCell('#47d147')); // Green Color
            else tsheet.cell(3 + j, 6).style(colorCell('#ff5c33')); // Red Color
        }
        wb.write(excel_file_name);
    }
}

app()