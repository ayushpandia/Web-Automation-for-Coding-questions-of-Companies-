let fs=require('fs')

let s=new Set()

let compJSON = fs.readFileSync("Companies.json", "utf-8");
let compJSO = JSON.parse(compJSON);

for(let i=0;i<compJSO.length;i++)
    s.add(compJSO[i].toLowerCase())
console.log(s)