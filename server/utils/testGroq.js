
import { extractDataWithGroq } from './groqExtractor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testGroq = async () => {
    console.log('🧪 Testing Groq (Llama 3.2 Vision) Connectivity...');

    const testImagePath = path.join(__dirname, '../test_card.jpg');

    if (fs.existsSync(testImagePath)) {
        console.log(`Found test image at: ${testImagePath}`);
        const imageBuffer = fs.readFileSync(testImagePath);
        const data = await extractDataWithGroq(imageBuffer);
        console.log('\n--- Extraction Result ---');
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log('⚠️ No test_card.jpg found in server root.');

        if (process.env.GROQ_API_KEY) {
            console.log('✅ Groq API Key found in environment.');
            console.log('To fully test, add a file named "test_card.jpg" and run: node utils/testGroq.js');
        } else {
            console.log('❌ Missing GROQ_API_KEY in .env');
        }
    }
};

testGroq();
