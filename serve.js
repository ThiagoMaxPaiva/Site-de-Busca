const express = require('express');
const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(stealth());

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'output')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const categorias = ['monitor', 'perifericos', 'computador','memoriaram'];

categorias.forEach(categoria => {
    app.get(`/categoria/${categoria}`, async (req, res) => {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });

        const searchUrl = `https://www.bondfaro.com.br/search?q=${encodeURIComponent(categoria)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        const products = await page.evaluate(() => {
            const productCards = document.querySelectorAll('.ProductCard_ProductCard_Inner__gapsh');
            const productList = [];
            productCards.forEach((card, index) => {
                if (index < 8) {
                    const nome = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_DesktopLabelSAtLarge__wWsED.ProductCard_ProductCard_Name__U_mUQ')?.innerText;
                    const preçotexto = card.querySelector('.Text_Text__ARJdp.Text_MobileHeadingS__HEz7L')?.innerText;
                    const preço = parseFloat(preçotexto.replace('R$', '').replace(/\./g, '').replace(',', '.'));

                    const imageSrc = card.querySelector('img')?.getAttribute('src');
                    const link = card.querySelector('a')?.getAttribute('href');

                    let barato = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD.ProductCard_ProductCard_BestMerchant__JQo_V')?.innerText;
                    if (!barato) {
                        barato = card.querySelector('.Text_Text__ARJdp.Text_MobileParagraphS__mbPGc.ProductCard_ProductCard_Link__vMbJq')?.innerText;
                    }

                    const parcelamento = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD.ProductCard_ProductCard_Installment__XZEnD')?.innerText;
                    productList.push({ nome, preçotexto, imageSrc, link, barato, parcelamento });
                }
            });

            productList.sort((a, b) => a.preço - b.preço);

            productList.forEach((product, index) => {
                product.rank = index + 1;
            });

            return productList;
        });

        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</title>
            <link rel="stylesheet" href="/estilos.css">
        </head>
        <body>
            <h1>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h1>
            
            <div id="produtos">
                ${products.map(product => `
                <div class="produto" data-name="${product.nome}" data-image="${product.imageSrc}" data-price="${product.preçotexto}" data-merchant="${product.barato}" data-installment="${product.parcelamento}">
                    <h2>${product.nome}</h2>
                    <img src="${product.imageSrc}" alt="${product.nome}" class="product-image">
                   
                        <p>Ranking: ${product.rank}</p>
                        <p>Preço: R$ ${product.preçotexto}</p>
                        <p>Melhor Vendedor: ${product.barato || 'Não disponível'}</p>
                        <p>Parcelamento: ${product.parcelamento || 'sem parcelamento'}</p>
                </div>
                `).join('')}
            </div>
            
          
        </body>
        </html>
        `;

        const filePath = path.join(outputDir, `${categoria}.html`);
        fs.writeFileSync(filePath, htmlContent);

        await browser.close();

        res.sendFile(filePath);
    });
});

app.get('/search', async (req, res) => {
    const searchTerm = req.query.searchTerm;

    if (!searchTerm) {
        return res.status(400).send('digite o campo de pesquisa');
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    const searchUrl = `https://www.bondfaro.com.br/search?q=${encodeURIComponent(searchTerm)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    const products = await page.evaluate(() => {
        const productCards = document.querySelectorAll('.ProductCard_ProductCard_Inner__gapsh');
        const productList = [];
        productCards.forEach((card, index) => {
            if (index < 8) {
                const nome = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_DesktopLabelSAtLarge__wWsED.ProductCard_ProductCard_Name__U_mUQ')?.innerText;
                const preçotexto = card.querySelector('.Text_Text__ARJdp.Text_MobileHeadingS__HEz7L')?.innerText;
                const preço = parseFloat(preçotexto.replace('R$', '').replace(/\./g, '').replace(',', '.'));

                const imageSrc = card.querySelector('img')?.getAttribute('src');
                const link = card.querySelector('a')?.getAttribute('href');

                let barato = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD.ProductCard_ProductCard_BestMerchant__JQo_V')?.innerText;
                if (!barato) {
                    barato = card.querySelector('.Text_Text__ARJdp.Text_MobileParagraphS__mbPGc.ProductCard_ProductCard_Link__vMbJq')?.innerText;
                }
                const parcelamento = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD.ProductCard_ProductCard_Installment__XZEnD')?.innerText;
                productList.push({ nome, preçotexto, imageSrc, link, barato, parcelamento });
            }
        });

        productList.sort((a, b) => a.preço - b.preço);

        productList.forEach((product, index) => {
            product.rank = index + 1;
        });

        return productList;
    });

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resultados da Busca</title>
        <link rel="stylesheet" href="/estilos.css">
    </head>
    <body>
        <h1>Resultados da Busca</h1>
        
        <div id="produtos">
            ${products.map(product => `
            <div class="produto" data-name="${product.nome}" data-image="${product.imageSrc}" data-price="${product.preçotexto}" data-merchant="${product.barato}" data-installment="${product.parcelamento}">
                <h2>${product.nome}</h2>
                <img src="${product.imageSrc}" alt="${product.nome}" class="product-image">
                <p>Ranking: ${product.rank}</p>
                    <p>Preço: R$ ${product.preçotexto}</p>
                    <p>Melhor Vendedor: ${product.barato || 'Não disponível'}</p>
                    <p>Parcelamento: ${product.parcelamento || 'sem parcelamento'}</p>
            </div>
            `).join('')}
        </div>
        
       
    </body>
    </html>
    `;

    const filePath = path.join(outputDir, 'resultados.html');
    fs.writeFileSync(filePath, htmlContent);

    await browser.close();

    res.sendFile(filePath);
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server rodando em http://localhost:${port}`);
});
