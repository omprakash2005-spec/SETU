
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Extract structured data from an image using Gemini
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image mime type (e.g., 'image/jpeg', 'image/png')
 * @returns {object|null} - Extracted structured data or null on failure
 */
export const extractDataWithGemini = async (imageBuffer, mimeType = 'image/jpeg') => {
    if (!genAI) {
        console.warn('⚠️ Gemini API Key not found. Skipping LLM extraction.');
        return null;
    }

    try {
        console.log('🤖 Starting Gemini LLM extraction...');

        // Helper for delay
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Switching to 'gemini-2.0-flash-lite'
        // Reason: 'gemini-1.5-flash' is NOT available for this key (resulted in 404).
        // Reason: 'gemini-2.0-flash' hit Rate Limits (429).
        // 'Lite' models are more efficient and typically have better availability/quotas.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `
        Analyze this image of a Student ID Card or Provisional Certificate.
        Extract the following fields and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
        
        Fields to extract:
        - full_name (Student Name - Name ONLY, no labels)
        - roll_number (Roll No / ID No)
        - college_id (College ID / Registration ID)
        - college_name (Name of Institute/College)
        - department (Department/Stream - STRICTLY return only the code e.g. 'CSE', 'ECE'. NEVER include 'Address', 'Road', 'Dist', 'Pin' or multiline text.)
        - passing_year (Year of completion/passing)
        - registration_number (Reg No - mostly for certificates)

        If a field is not visible, return an empty string "".
        Fix any obvious OCR typos (e.g., "0" vs "O", "1" vs "I").
        Ensure values are cleanStrings without field labels.
        `;

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
            }
        };

        // Retry logic for 429 (Rate Limit) errors
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const result = await model.generateContent([prompt, imagePart]);
                const response = await result.response;
                const text = response.text();

                console.log('🤖 Gemini Raw Response:', text);
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(jsonStr);

                // STRICT CODE-LEVEL CLEANING
                if (data.department) {
                    // 1. Keep only the first line (removes address lines below)
                    data.department = data.department.split('\n')[0].trim();
                    // 2. Remove any "Department:" prefix
                    data.department = data.department.replace(/^Department\s*[:.-]?\s*/i, '');
                    // 3. Remove "Address" keyword if it snuck in
                    data.department = data.department.replace(/\s+Address.*/i, '').trim();
                }

                return data;
            } catch (err) {
                if (err.message.includes('429') || err.status === 429) {
                    attempts++;
                    // Reduced wait time to 10s as requested (was 20s)
                    const waitTime = attempts * 10000;
                    console.warn(`⚠️ Rate limit (429) hit. Retrying in ${waitTime / 1000}s... (Attempt ${attempts}/${maxAttempts})`);
                    await delay(waitTime);
                } else {
                    throw err; // Re-throw non-retriable errors
                }
            }
        }
        console.error('❌ Gemini Extraction Failed: Max retries exceeded.');
        return null;

    } catch (error) {
        console.error('❌ Gemini Extraction Error:', error);
        return null;
    }
};
