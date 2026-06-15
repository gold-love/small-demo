import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request =>
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
    );

    console.log('Navigating to Vercel URL...');
    await page.goto('https://frontend-ten-drab-31.vercel.app', { waitUntil: 'networkidle2' });
    console.log('Navigation complete. Checking body...');
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('BODY HTML LENGTH:', bodyHTML.length);
    
    await browser.close();
})();
