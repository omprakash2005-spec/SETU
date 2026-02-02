
import Groq from 'groq-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const listModels = async () => {
    if (!groq) {
        console.error('❌ No GROQ_API_KEY found in .env');
        return;
    }

    try {
        console.log('🔍 Fetching available Groq models...');
        const models = await groq.models.list();

        fs.writeFileSync('models.json', JSON.stringify(models.data, null, 2));
        console.log('✅ Models written to models.json');

    } catch (err) {
        console.error('❌ Error fetching models:', err.message);
    }
};

listModels();
