
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Extract text from an image using Azure Computer Vision (Read API)
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image mime type (e.g., 'image/jpeg', 'image/png')
 * @returns {Promise<string|null>} - Extracted text or null on failure
 */
export const extractTextWithAzure = async (imageBuffer, mimeType = 'image/jpeg') => {
    const key = process.env.AZURE_VISION_KEY;
    const endpoint = process.env.AZURE_VISION_ENDPOINT;

    if (!key || !endpoint) {
        console.warn('⚠️ Azure Vision credentials not found. Skipping Azure OCR.');
        return null;
    }

    try {
        console.log('☁️ Starting Azure OCR extraction...');

        // 1. Submit Image for Analysis
        const analyzeUrl = `${endpoint}/vision/v3.2/read/analyze`;

        const response = await axios.post(analyzeUrl, imageBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Ocp-Apim-Subscription-Key': key
            }
        });

        // Azure returns a specialized "Operation-Location" header to poll for results
        const operationLocation = response.headers['operation-location'];
        if (!operationLocation) {
            throw new Error('Azure API did not return an Operation-Location header.');
        }

        // 2. Poll for Results
        let status = 'running';
        let resultResponse;
        let retries = 0;
        const maxRetries = 10;

        while (status === 'running' || status === 'notStarted') {
            if (retries >= maxRetries) {
                throw new Error('Azure OCR timed out waiting for results.');
            }

            // Wait 1 second before polling
            await new Promise(resolve => setTimeout(resolve, 1000));

            resultResponse = await axios.get(operationLocation, {
                headers: { 'Ocp-Apim-Subscription-Key': key }
            });

            status = resultResponse.data.status;
            retries++;
        }

        if (status !== 'succeeded') {
            throw new Error(`Azure OCR failed with status: ${status}`);
        }

        // 3. Parse Results
        const readResults = resultResponse.data.analyzeResult.readResults;
        let extractedText = '';

        for (const page of readResults) {
            for (const line of page.lines) {
                extractedText += line.text + '\n';
            }
        }

        console.log('✅ Azure OCR Success');
        return extractedText.trim();

    } catch (error) {
        console.error('❌ Azure OCR Error:', error.response ? error.response.data : error.message);
        return null;
    }
};
