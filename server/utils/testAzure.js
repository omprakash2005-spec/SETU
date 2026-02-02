
import { extractTextWithAzure } from './azureExtractor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testAzure = async () => {
    console.log('🧪 Testing Azure OCR Connectivity...');

    // Create a simple text image buffer (conceptually) or try to read a real file
    // For this test, we'll try to read a dummy file if it exists, or just warn.
    // Ideally, the user should put a file named 'test_card.jpg' in this folder.

    // Check for a test image in the parent directory or current
    const testImagePath = path.join(__dirname, '../test_card.jpg');

    if (fs.existsSync(testImagePath)) {
        console.log(`Found test image at: ${testImagePath}`);
        const imageBuffer = fs.readFileSync(testImagePath);
        const text = await extractTextWithAzure(imageBuffer);
        console.log('\n--- Extraction Result ---');
        console.log(text);
    } else {
        console.log('⚠️ No test_card.jpg found in server root.');
        console.log('Please place an image named "test_card.jpg" in the server folder to test actual extraction.');
        console.log('Checking API credentials presence only...');

        if (process.env.AZURE_VISION_KEY && process.env.AZURE_VISION_ENDPOINT) {
            console.log('✅ Credentials found in environment.');
            console.log('To fully test, add a file and run: node utils/testAzure.js');
        } else {
            console.log('❌ Missing credentials in .env');
        }
    }
};

testAzure();
