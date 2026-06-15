import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto('https://frontend-ten-drab-31.vercel.app', { waitUntil: 'networkidle0' });
    
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity/brain/d7587df5-f498-4666-9f7c-51a9dee888a1/screenshot.png' });
    console.log('Screenshot saved');
    
    await browser.close();
})();
