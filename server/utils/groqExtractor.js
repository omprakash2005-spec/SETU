
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Extract data from image using Llama 3.2 Vision (via Groq)
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<object|null>} - Extracted JSON data
 */
export const extractDataWithGroq = async (imageBuffer) => {
    if (!groq) {
        console.warn('⚠️ GROQ_API_KEY not found. Skipping Llama extraction.');
        return null;
    }

    try {
        console.log('🦙 Starting Llama 3.2 Vision extraction...');

        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract fields from this ID Card or Provisional Certificate. Return JSON with keys: full_name, roll_number, college_id, college_name, department, passing_year, registration_number (Reg No), degree (e.g. B.Tech), university_name. IMPORTANT: \n1. For 'passing_year', return ONLY the single 4-digit ending year.\n2. **Digit Accuracy:** visual ambiguity between '9' and '3' is common. **Check the top loop**: if it's closed, it's a '9'. If you see '...132' and it looks like '...192', it is likely '192'. \n3. **Context:** \n   - 'registration_number': MUST be strictly numeric. Double-check every digit.\n   - 'roll_number': Can be alphanumeric for ID Cards, but numeric for Certificates.\n4. Transcribe exactly as appeared."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": dataUrl
                            }
                        }
                    ]
                }
            ],
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "temperature": 0,
            "stream": false,
            "response_format": { "type": "json_object" }
        });

        const content = chatCompletion.choices[0].message.content;
        console.log('🦙 Groq Raw Response:', content);

        return JSON.parse(content);

    } catch (error) {
        console.error('❌ Groq/Llama Extraction Error:', error.message);
        return null;
    }
};
