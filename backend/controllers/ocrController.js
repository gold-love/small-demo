const Tesseract = require('tesseract.js');
const path = require('path');
const logger = require('../utils/logger');

const scanReceipt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No receipt file provided' });
        }

        const imagePath = path.resolve(req.file.path);
        logger.info(`Starting AI Scan on receipt: ${imagePath}`);

        // Simple OCR without worker (fallback to direct recognize)
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
            logger: m => logger.debug(`${m.status} ${m.progress}`)
        });

        if (!text || text.trim().length < 5) {
            logger.warn(`OCR returned empty or very short text. Length: ${text ? text.length : 0}`);
            return res.status(422).json({
                success: false,
                message: 'Could not read clear text from this receipt. Please ensure the image is sharp and well-lit.'
            });
        }

        logger.info(`AI Scan completed. Found ${text.length} characters.`);

        // --- 1. Extract Amount (Improved) ---
        const amountPatterns = [
            /(?:total|amount|sum|due|pay|grand total|net|balance|balance due|total due)[:\s]*[$€£]?\s*([\d,]+\.\d{2})/i,
            /(?:total|amount|sum|due|pay|grand total|net|balance|balance due|total due)[:\s]*[$€£]?\s*(\d+)/i,
            /([0-9,]+\.[0-9]{2})/ // First clear decimal match on line
        ];
        let amount = 0;
        const linesArr = text.split('\n');
        for (let i = linesArr.length - 1; i >= 0; i--) {
            for (const pattern of amountPatterns) {
                const match = linesArr[i].match(pattern);
                if (match) {
                    const val = match[1].replace(/,/g, '');
                    const parsed = parseFloat(val);
                    if (parsed > 0 && parsed < 1000000) {
                        amount = parsed;
                        break;
                    }
                }
            }
            if (amount > 0) break;
        }

        // --- 2. Extract Date ---
        const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/g;
        const dateMatch = text.match(dateRegex);
        let date = new Date().toISOString().split('T')[0];
        if (dateMatch) {
            try {
                const rawDate = dateMatch[0].replace(/[\.\-]/g, '/');
                const parsedDate = new Date(rawDate);
                if (!isNaN(parsedDate)) date = parsedDate.toISOString().split('T')[0];
            } catch (e) { /* ignore */ }
        }

        // --- 3. Extract Merchant ---
        const merchantLines = linesArr
            .map(l => l.trim())
            .filter(l => l.length > 4 && !/\d{2,}/.test(l));
        const title = merchantLines[0] || 'Scanned Receipt';

        res.json({
            success: true,
            data: {
                amount: amount || 0,
                date,
                title: title.substring(0, 50).replace(/[^\w\s]/gi, '').trim(),
                confidence: amount > 0 ? 'High' : 'Low'
            }
        });
    } catch (error) {
        logger.error('AI Scan Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI Scan service failed. Error: ' + error.message
        });
    }
};

module.exports = { scanReceipt };
