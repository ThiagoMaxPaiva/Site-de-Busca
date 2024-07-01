const express = require('express');
const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(stealth());

const app = express();

// Configuração para servir arquivos estáticos a partir do diretório 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'output')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', async (req, res) => {
    const searchTerm = req.query.searchTerm;

    if (!searchTerm) {
        return res.status(400).send('Search term is required');
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

    const url = 'https://www.bondfaro.com.br/';
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.type('.AutoCompleteStyle_input__WAC2Y', searchTerm);
    await page.click('.AutoCompleteStyle_submitButton__VwVxN');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const products = await page.evaluate(() => {
        const productCards = document.querySelectorAll('.ProductCard_ProductCard_Inner__gapsh');
        const productList = [];
        productCards.forEach((card, index) => {
            if (index < 5) {
                const name = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_DesktopLabelSAtLarge__wWsED.ProductCard_ProductCard_Name__U_mUQ')?.innerText;
                const priceText = card.querySelector('.Text_Text__ARJdp.Text_MobileHeadingS__HEz7L')?.innerText;
                const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.')); // Converte o preço para número, removendo separadores de milhar e substituindo vírgula por ponto

                const imageSrc = card.querySelector('img')?.getAttribute('src');
                const link = card.querySelector('a')?.getAttribute('href');
                
                let bestMerchant = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD.ProductCard_ProductCard_BestMerchant__JQo_V')?.innerText;
                if (!bestMerchant) {
                    bestMerchant = card.querySelector('.Text_Text__ARJdp.Text_MobileParagraphS__mbPGc.ProductCard_ProductCard_Link__vMbJq')?.innerText;
                }

                const installment = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD.ProductCard_ProductCard_Installment__XZEnD')?.innerText;
                productList.push({ name, price, imageSrc, link, bestMerchant, installment });
            }
        });

        // Ordena os produtos pelo preço em ordem crescente
        productList.sort((a, b) => a.price - b.price);

        // Adiciona o campo rank depois da ordenação
        productList.forEach((product, index) => {
            product.rank = index + 1;
        });

        return productList;
    });

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    for (let product of products) {
        const productDir = path.join(outputDir, `product_${product.rank}`);
        if (!fs.existsSync(productDir)) {
            fs.mkdirSync(productDir);
        }

        // Adiciona o seletor OfferCard
        const offerCards = await page.evaluate(() => {
            const offerCardElements = document.querySelectorAll('.OfferCard_OfferCardWrapper__kMD1T.OfferCard_isBestOffer__uNtJu.OfferCard_WithoutPromotions__wl_Q_.OfferCard_Responsive__RKPw1');
            const offerList = [];
            offerCardElements.forEach((card) => {
                const offerPriceText = card.querySelector('.Text_Text__ARJdp.Text_MobileHeadingS__HEz7L')?.innerText;
                const offerPrice = parseFloat(offerPriceText.replace('R$', '').replace(/\./g, '').replace(',', '.'));
                const offerMerchant = card.querySelector('.Text_Text__ARJdp.Text_MobileLabelXs__dHwGG.Text_MobileLabelSAtLarge__m0whD')?.innerText;

                offerList.push({ offerPrice, offerMerchant });
            });
            return offerList;
        });

        const offerContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ofertas para ${product.name}</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <h1>Ofertas para ${product.name}</h1>
    <div id="offers">
        ${offerCards.map(offer => `
        <div class="offer">
            <p>Preço: R$ ${offer.offerPrice.toFixed(2)}</p>
            <p>Vendedor: ${offer.offerMerchant || 'Não disponível'}</p>
        </div>
        `).join('')}
    </div>
</body>
</html>
`;

        const offerFilePath = path.join(productDir, 'offers.html');
        fs.writeFileSync(offerFilePath, offerContent);
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados da Busca</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <h1>Resultados da Busca</h1>
    <div id="products">
        ${products.map(product => `
        <div class="product">
            <h2>${product.name}</h2>
            <p>Ranking: ${product.rank}</p>
            <p>Menor Preço: R$ ${product.price.toFixed(2)}</p>
            <p>Parcelamento: ${product.installment}</p>
            <p>Melhor Vendedor: ${product.bestMerchant || 'Não disponível'}</p>
            <a href="${product.link}" target="_blank">
                <img src="${product.imageSrc}" alt="${product.name}">
            </a>
            <a href="/product_${product.rank}/offers.html" target="_blank">Ver Ofertas</a> <!-- Ajustado o caminho do link -->
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
