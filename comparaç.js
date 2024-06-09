const  puppeteer = require ('puppeteer')

(async ()=>{
    const browser = await puppeteer.laucher({ headless: false})
    const page = await browser.newPage()

    async function getprice (urlS, selector){
       await page.goto(urlS,{ waitUntil: 'networkidle2' });
       const price = await  page.$eval(selector, el => el.textContent);
       return parseFloat(price.replace(/[^0-9,.]/g, '').replace(',', '.'));
    }

    const url1 = ''
    const selecto1 = ''

    const url2 = ''
    const selector2 =''

    const price1 = await getprice(url1, selecto1)
    const price2 = await getprice(url2,selector2)

    console.log(`Preço no site 1: R$${price1}`);
  console.log(`Preço no site 2: R$${price2}`);

  // Compara os preços
  if (price1 < price2) {
    console.log('O produto é mais barato no site 1.');
  } else if (price1 > price2) {
    console.log('O produto é mais barato no site 2.');
  } else {
    console.log('Os preços são iguais nos dois sites.');
  }

  // Fecha o navegador
  await browser.close();
})();
