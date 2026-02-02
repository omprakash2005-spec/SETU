import Tesseract from 'tesseract.js';
import pool from '../config/database.js';
import { extractDataWithGemini } from '../utils/geminiExtractor.js';
import axios from 'axios'; // check if needed for URL buffer fetching

// ---- OCR WORKER (ADD THIS) ----
let worker = null;
let workerReady = false;
let ocrBusy = false;

const wait = (ms) => new Promise(r => setTimeout(r, ms));


/**
 * Perform OCR on the uploaded image buffer or URL
 */
import { extractDataWithGroq } from '../utils/groqExtractor.js';

/**
 * Perform OCR on the uploaded image buffer or URL
 * Strategies: Llama 3.2 (if enabled) -> Tesseract (Fallback)
 * @param {Buffer|string} imageSource - Buffer or URL of the image
 */
const performOCR = async (imageSource) => {
    // Strategy 1: Llama 3.2 Vision (Groq) - High Speed AI
    if (process.env.USE_LLAMA_OCR === 'true') {
        let bufferToProcess = null;

        if (Buffer.isBuffer(imageSource)) {
            bufferToProcess = imageSource;
        } else if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
            // Fetch buffer from URL for AI processing
            try {
                console.log('🌐 Fetching image for Llama OCR...');
                const response = await axios.get(imageSource, { responseType: 'arraybuffer' });
                bufferToProcess = Buffer.from(response.data);
            } catch (fetchError) {
                console.error('❌ Failed to fetch image for AI OCR:', fetchError.message);
            }
        }

        if (bufferToProcess) {
            const groqData = await extractDataWithGroq(bufferToProcess);
            if (groqData) {
                console.log('✅ Used Llama 3.2 OCR');
                // If Llama returns full structured data, we might want to use it directly
                // But performOCR typically returns text. 
                // For now, let's return a JSON string or handle strictly.
                // Actually, extractWithGroq returns an Object. 
                // We should probably adapt verifyDocument to handle this object directly
                // OR we can serialize it back to text for the regex parser to handle 
                // (or return it as a special object that verifyDocument detects).

                // SIMPLIFIED APPROACH: Return JSON string directly.
                // extractFields will detect this and parse it, skipping regex.
                return JSON.stringify(groqData);
            }
        }
        console.warn('⚠️ Llama OCR failed or skipped. Falling back to Tesseract.');
    }

    // Strategy 2: Tesseract.js (Local / Free)
    try {
        if (!worker) {
            worker = await Tesseract.createWorker('eng');
            await worker.initialize('eng');
            workerReady = true;
            console.log('✅ Tesseract worker initialized');
        }

        const { data: { text } = {} } = await worker.recognize(imageSource);
        return text || null;

    } catch (error) {
        console.error('OCR Error:', error);
        return null;
    }
};


/**
 * Detect document type from OCR text
 * @param {string} text - Raw OCR text
 * @returns {string} - 'PROVISIONAL_CERT' or 'ID_CARD'
 */
const detectDocumentType = (text) => {
    // If it's a JSON string (from Llama), check for registration_number or default to ID_CARD
    // Actually, if it's Llama, we might not need this if we return the object directly.
    // But for safety:
    try {
        if (text.trim().startsWith('{')) {
            const data = JSON.parse(text);
            if (data.registration_number && data.registration_number.length > 5) return 'PROVISIONAL_CERT';
            return 'ID_CARD';
        }
    } catch (e) { }

    const lowerText = text.toLowerCase();
    if (lowerText.includes('provisional certificate') ||
        lowerText.includes('provisional cert')) {
        return 'PROVISIONAL_CERT';
    }
    return 'ID_CARD';
};

/**
 * Extract fields from provisional certificate (Alumni only)
 * @param {string} text - Raw OCR text
 * @returns {object} - Extracted fields
 */
const extractFromProvisionalCert = (text) => {
    console.log('[DEBUG] Full OCR text for provisional cert:');
    console.log(text);
    console.log('[DEBUG] Text length:', text.length);

    const extracted = {
        full_name: '',
        roll_number: '',
        college_id: '',
        college_name: '',
        department: '',
        passing_year: '',
        registration_number: ''
    };

    // Extract Name: Look for "certify that [NAME]"
    let nameMatch = text.match(/(?:certify that|that)\s+([A-Z][A-Z\s]+?)\s*\(/i);
    if (nameMatch) {
        extracted.full_name = nameMatch[1].trim();
    }

    // Extract Roll Number: Handle OCR errors like "RolIN0" instead of "RollNo"
    // OCR often confuses: l/I, l/1, o/0, O/0
    let rollMatch = text.match(/Ro[l1I][l1I]?[Nn]?[o0O]?\s*:?\s*([0-9]{8,15})/i);
    if (!rollMatch) {
        // Try finding pattern in parentheses: "(RolIN0:16931121009"
        rollMatch = text.match(/\([Rr]o[l1I][l1I]?[Nn]?[o0O]?\s*:?\s*([0-9]{8,15})/i);
    }
    if (!rollMatch) {
        // Last resort: look for long number after opening parenthesis
        rollMatch = text.match(/\([^0-9]*([0-9]{10,12})/);
    }
    if (rollMatch) {
        extracted.roll_number = rollMatch[1].trim();
        console.log('[DEBUG] Found roll number:', extracted.roll_number);
    }

    // Extract Registration Number: Handle OCR errors and line breaks
    // OCR often splits "Reg No:" across lines as "Reg" and "No0:" (with zero)
    let regMatch = text.match(/[Rr]eg\s*[Nn]?[o0O]?\s*:?\s*([0-9]{10,15})/i);
    if (!regMatch) {
        // Handle line break: "Reg\nNo0:211690100110192"
        regMatch = text.match(/[Rr]eg[\s\n]+[Nn][o0O][o0O]?\s*:?\s*([0-9]{10,15})/i);
    }
    if (!regMatch) {
        // More flexible: just look for "of 2021-22)" followed by space and long number
        regMatch = text.match(/of\s+\d{4}-\d{2}\)[^0-9]*([0-9]{14,15})/);
    }
    if (regMatch) {
        extracted.registration_number = regMatch[1].trim();
        console.log('[DEBUG] Found registration number:', extracted.registration_number);
    }

    // Extract College Name from certificate text
    // Pattern: "of 2021-23) [COLLEGE NAME], has successfully"
    let collegeName = '';
    const collegeMatch = text.match(/of\s+\d{4}-\d{2}\)\s+([A-Z][A-Z\s&]+?),\s+has\s+successfully/i);
    if (collegeMatch) {
        collegeName = collegeMatch[1].trim().toUpperCase();
        console.log('[DEBUG] Raw college name extracted:', collegeName);

        // STRICT: Only normalize OCR variations of Academy of Technology itself
        // Do NOT normalize different colleges like "ABC INSTITUTE" 
        if (collegeName === 'ACADEMY OF TECHNOLOGY' ||
            (collegeName.includes('ACADEMY') && collegeName.includes('TECHNOLOGY'))) {
            extracted.college_name = 'Academy of Technology';
        } else {
            // Different college - keep as-is (title case)
            extracted.college_name = collegeName
                .toLowerCase()
                .replace(/(?:^|\s)\S/g, a => a.toUpperCase());
            console.log('[WARNING] Different college detected:', extracted.college_name);
        }
    } else {
        // Fallback: try to find in text
        if (text.toLowerCase().includes('academy of technology')) {
            extracted.college_name = 'Academy of Technology';
        } else {
            extracted.college_name = '';
            console.log('[WARNING] Could not extract college name');
        }
    }

    console.log('[DEBUG] Final college name:', extracted.college_name);

    // Extract Department
    const deptMatch = text.match(/(?:in|Technology in)\s+([A-Za-z\s&]+?)\s+degree/i);
    if (deptMatch) {
        extracted.department = deptMatch[1].trim();
    }

    // Extract Passing Year: Look for completion year pattern
    const yearMatch = text.match(/in\s+(202\d)-(\d{2})/i);
    if (yearMatch) {
        // Format: "in 2024-25" means passing year is 2025
        const firstYear = parseInt(yearMatch[1]);
        extracted.passing_year = firstYear + 1;
    }

    // Normalize name to title case
    if (extracted.full_name) {
        extracted.full_name = extracted.full_name.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    }

    console.log('[DEBUG] Extraction Results:');
    console.log('  - Roll Number:', extracted.roll_number);
    console.log('  - Registration Number:', extracted.registration_number);

    return extracted;
};

/**
 * Parse OCR text to extract fields
 * @param {string} text - Raw OCR text or JSON string
 * @param {string} userType - 'student' or 'alumni'
 */
const extractFields = (text, userType) => {
    // 1. AI Bypass: If text is valid JSON, use it directly!
    if (text.trim().startsWith('{')) {
        try {
            console.log('🤖 AI JSON Detected. Bypassing Regex...');
            const data = JSON.parse(text);

            // Normalize keys if needed (Groq returns matched keys mostly)
            return {
                full_name: data.full_name || '',
                roll_number: data.roll_number || '',
                college_id: data.college_id || '',
                college_name: data.college_name || '',
                department: data.department || '',
                passing_year: data.passing_year || '',
                registration_number: data.registration_number || '',
                degree: data.degree || '',
                university_name: data.university_name || ''
            };
        } catch (e) {
            console.warn('⚠️ Failed to parse AI JSON. Falling back to Regex.');
        }
    }

    // NEW: Detect document type and route to appropriate extractor
    const docType = detectDocumentType(text);
    if (docType === 'PROVISIONAL_CERT') {
        console.log('[EXTRACTION] Detected: Provisional Certificate');
        return extractFromProvisionalCert(text);
    }

    // EXISTING: ID Card extraction (unchanged)
    console.log('[EXTRACTION] Detected: ID Card');
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    // Basic regex patterns (can be improved based on actual ID card format)
    // Assuming format like: Name: John Doe, Roll: 12345, College: Academy of Technology

    const extracted = {
        full_name: '',
        roll_number: '',
        college_id: '',
        college_name: '',
        department: '',
        passing_year: ''
    };

    // Extract Name
    // Strategy 1: Look for "Name:" prefix
    const nameMatch = text.match(/(?:Name|Student Name)[:\s]+([a-zA-Z\s\.]+)/i);
    if (nameMatch) {
        extracted.full_name = nameMatch[1].trim();
    } else {
        // Strategy 2: Find the longest ALL CAPS line with multiple words (likely the name)
        // For AOT cards, name appears as standalone line like "OM PRAKASH MISHRA"
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let candidates = [];

        for (const line of lines) {
            // Ignore lines with common labels
            if (/^(College|Dept|Department|Blood|Valid|Phone|Address|AOT|G\.T\.|AICTE|Approved|Engineering|Affiliated)/i.test(line)) continue;
            // Ignore lines with dates or too many digits
            if (/\d{2,4}/.test(line)) continue;

            // If line is ALL CAPS with spaces (multi-word name) and doesn't contain "TECHNOLOGY"
            if (line.length > 5 && /^[A-Z\s\.]+$/.test(line) && !line.includes('TECHNOLOGY') && line.includes(' ')) {
                candidates.push(line);
            }
        }

        // Pick the longest candidate (most likely to be the full name)
        if (candidates.length > 0) {
            extracted.full_name = candidates.sort((a, b) => b.length - a.length)[0];
        }
    }

    // Extract Roll Number or College ID
    // Update: Allow forward slashes and dashes for IDs like AOT/CSE/2023/081
    const rollMatch = text.match(/(?:Roll|Roll No|Registration No)[:\s]+([a-zA-Z0-9\/\-]+)/i);
    if (rollMatch) extracted.roll_number = rollMatch[1].trim();

    // Extract College ID - CRITICAL FIX
    // The ID card has "College ID:" on one line and "AOT/CSE/2023/081" on the next line
    // "Blood Group:" appears on the same line as "College ID:" causing contamination

    // Strategy 1: Look for AOT pattern anywhere in the text first (most reliable)
    const aotPattern = text.match(/(AOT\/[A-Z]+\/\d{4}\/\d{3})/);
    if (aotPattern) {
        extracted.college_id = aotPattern[1];
    }

    // Strategy 2: If not found, look for "College ID:" and check subsequent lines
    if (!extracted.college_id) {
        const lines = text.split('\n').map(l => l.trim());
        for (let i = 0; i < lines.length; i++) {
            if (/College ID/i.test(lines[i])) {
                // Check next few lines for a valid ID pattern
                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    const nextLine = lines[j].trim();
                    // Valid ID should have alphanumeric + slashes, no "Blood" contamination
                    if (nextLine.length > 4 &&
                        /[A-Z0-9\/]/.test(nextLine) &&
                        !nextLine.toLowerCase().includes('blood') &&
                        !nextLine.toLowerCase().includes('valid') &&
                        !nextLine.toLowerCase().includes('date')) {
                        extracted.college_id = nextLine;
                        break;
                    }
                }
                if (extracted.college_id) break;
            }
        }
    }

    // CLEANUP: Remove Blood Group contamination and fix common OCR errors
    if (extracted.college_id) {
        let cleaned = extracted.college_id;

        // Remove "B+" or "B-" or similar blood group suffixes
        cleaned = cleaned.replace(/\s*[ABOabo][+-]?\s*$/i, '');

        // Fix common OCR error: "AOTICSE" -> "AOT/CSE"
        cleaned = cleaned.replace(/^AOTIC([A-Z]+)\//, 'AOT/$1/');

        // Fix common OCR error: "AOT/SE/" -> "AOT/CSE/" (missing C in CSE)
        cleaned = cleaned.replace(/^AOT\/SE\//, 'AOT/CSE/');

        // Remove any other trailing junk
        cleaned = cleaned.trim();

        extracted.college_id = cleaned;
    }

    // Extract College Name (Look for known college keywords)
    if (text.toLowerCase().includes('academy of technology') || text.includes('AOT')) {
        extracted.college_name = 'ACADEMY OF TECHNOLOGY';
    } else {
        // ... generic fallback
        const collegeMatch = text.match(/(?:College|Institute)[:\s]+([a-zA-Z\s]+)/i);
        if (collegeMatch) extracted.college_name = collegeMatch[1].toUpperCase().trim();
    }

    // Extract Department
    const deptMatch = text.match(/(?:Dept|Department|Branch)[:\s]+([a-zA-Z\s&]+)/i);
    if (deptMatch) {
        let dept = deptMatch[1].trim();
        // STRICT CLEANING: Remove "Address" lines or trailing noise immediately
        // Example input: "CSE N\nADDRESS..."
        dept = dept.split('\n')[0].trim(); // Take only the first line
        dept = dept.replace(/\s+Address.*/i, ''); // Remove "Address" keyword if on same line
        dept = dept.replace(/\s+Road.*/i, '');
        dept = dept.replace(/\s+Dist.*/i, '');

        // Remove 'Department :' prefix if repeated
        dept = dept.replace(/^Department\s*[:.-]?\s*/i, '');

        // AUTOCORRECT: If it starts with a known department AND has noise, force it to be just that code
        const knownDepts = ['CSE', 'ECE', 'IT', 'EE', 'ME', 'CE', 'AEIE', 'MCA', 'BCA', 'CSBS'];
        for (const known of knownDepts) {
            // Check if dept starts with known code (e.g. "CSE N" or "ECE Dept")
            if (dept.toUpperCase().startsWith(known)) {
                dept = known; // Force clean value
                break;
            }
        }

        extracted.department = dept.toUpperCase().trim();
    }

    // Extract Passing Year (for Alumni)
    if (userType === 'alumni') {
        const yearMatch = text.match(/(?:Year|Passing Year|Batch)[:\s]+([0-9]{4})/i);
        if (yearMatch) extracted.passing_year = parseInt(yearMatch[1]);
    }

    // Normalization
    if (extracted.full_name) {
        extracted.full_name = extracted.full_name.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    }

    return extracted;
};

/**
 * Match match extracted data with Master DB
 */
const matchWithMasterDB = async (extractedData, userType) => {
    const table = userType === 'student' ? 'college_students_master' : 'college_alumni_master';

    // STRICT MATCHING LOGIC
    // 1. College Name must match exactly (normalized)
    // 2. Roll Number OR College ID must match exactly

    if (!extractedData.college_name || (!extractedData.roll_number && !extractedData.college_id)) {
        return { match: false, reason: 'Missing College Name or valid ID (Roll/College ID) in ID Card' };
    }

    // Check Roll Number match OR College ID match
    // NEW: For alumni, also check Registration Number
    let query, params;

    if (userType === 'alumni' && extractedData.registration_number) {
        // Alumni: check ONLY registration_number (ignoring roll_number as per user request)
        query = `SELECT * FROM ${table} WHERE LOWER(college_name) = LOWER($1) AND registration_number = $2`;
        const regNum = extractedData.registration_number;
        params = [extractedData.college_name, regNum];
        console.log('[DEBUG] Alumni query strictly by Registration Number:', { college: extractedData.college_name, regNum });
    } else {
        // EXISTING: Students or alumni without registration number
        // NEW: Also use case-insensitive matching for consistency
        query = `SELECT * FROM ${table} WHERE LOWER(college_name) = LOWER($1) AND (roll_number = $2 OR college_id = $3)`;
        const roll = extractedData.roll_number || 'UNKNOWN_ROLL';
        const colId = extractedData.college_id || 'UNKNOWN_COL_ID';
        params = [extractedData.college_name, roll, colId];
    }

    console.log('🔍 Executing DB Master Match:', {
        table,
        college_name: extractedData.college_name,
        roll: extractedData.roll_number,
        regNum: extractedData.registration_number,
        params
    });

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
        return { match: false, reason: 'No record found matching your ID details. Please contact your college.' };
    }

    const masterRecord = result.rows[0];

    // Optional: Verify Name matches reasonably well to prevent identity spoofing
    // Simple check: does master name contain extracted first name?
    const extractedNameLower = extractedData.full_name.toLowerCase();
    const masterNameLower = masterRecord.full_name.toLowerCase();

    if (!masterNameLower.includes(extractedNameLower.split(' ')[0])) {
        return { match: false, reason: 'Name mismatch. ID Card name does not match College records.' };
    }

    // Alumni passing year check
    if (userType === 'alumni') {
        // Loose comparison (String vs Number)
        if (String(masterRecord.passing_year) !== String(extractedData.passing_year)) {
            return { match: false, reason: 'Passing Year mismatch.' };
        }
    }

    return { match: true, reason: 'Verified successfully' };
};

/**
 * Main Verification Function
 * @param {string} userId - User ID to update
 * @param {string|Buffer} imageSource - Image URL or Buffer
 * @param {string} userType - 'student' or 'alumni'
 */
export const verifyDocument = async (userId, imageSource, userType) => {
    console.log(`Starting verification for user ${userId} (${userType})`);

    // 1. OCR
    while (ocrBusy) {
        await wait(300);
    }
    ocrBusy = true;

    const ocrText = await performOCR(imageSource);

    ocrBusy = false;

    if (!ocrText) {
        return { status: 'FAILED', reason: 'OCR failed to read document' };
    }
    console.log('OCR Text:', ocrText.substring(0, 100) + '...');

    // 2. Extraction
    const extractedData = extractFields(ocrText, userType);
    console.log('Extracted Data:', extractedData);

    // 3. Validation
    // ENHANCEMENT: If LLM is enabled, run it to clean/verify data even if OCR succeeded partially
    if (process.env.USE_LLM_EXTRACTION === 'true') {
        console.log('🤖 LLM Enabled: Attempting advanced extraction with Gemini...');
        try {
            let imageBufferForGemini = imageSource;

            // Check if imageSource is a specific URL string that needs fetching
            // (Cloudinary URLs etc.)
            if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
                console.log('📥 Fetching image for Gemini from URL...');
                const response = await axios.get(imageSource, { responseType: 'arraybuffer' });
                imageBufferForGemini = Buffer.from(response.data);
            }

            const llmExtracted = await extractDataWithGemini(imageBufferForGemini);

            if (llmExtracted) {
                console.log('✅ Gemini Extraction Success:', llmExtracted);

                // Overlay LLM data (usually more accurate) onto extracted data
                if (llmExtracted.full_name) extractedData.full_name = llmExtracted.full_name;
                if (llmExtracted.roll_number) extractedData.roll_number = llmExtracted.roll_number;
                if (llmExtracted.college_id) extractedData.college_id = llmExtracted.college_id;
                if (llmExtracted.college_name) extractedData.college_name = llmExtracted.college_name;
                // CLEANUP: LLM usually extracts strictly 'CSE', avoiding 'CSE N ADDRESS' issues
                if (llmExtracted.department) extractedData.department = llmExtracted.department;
                if (llmExtracted.passing_year) extractedData.passing_year = llmExtracted.passing_year;
                if (llmExtracted.registration_number) extractedData.registration_number = llmExtracted.registration_number;
            }
        } catch (llmError) {
            console.error('❌ LLM Extraction Failed:', llmError);
        }
    } else if (!extractedData.full_name || (!extractedData.roll_number && !extractedData.college_id)) {
        // Fallback logic for when LLM is NOT enabled but OCR failed
        console.log('⚠️ OCR incomplete and LLM disabled.');
    }

    if (!extractedData.full_name || (!extractedData.roll_number && !extractedData.college_id)) {
        // Logic: If OCR fails to get critical fields, we might mark FAILED or PENDING for manual review.
        // Prompt says: "If required fields are missing, mark verification as FAILED"
        return { status: 'FAILED', reason: 'Missing mandatory fields (Name or College) in ID card', extractedData };
    }

    // 4. DB Matching
    let matchResult = { match: false, reason: 'Database error' };
    try {
        matchResult = await matchWithMasterDB(extractedData, userType);
    } catch (err) {
        console.error('DB Match Error:', err);
        // Fallback to pending on DB error
        return { status: 'PENDING', reason: 'Database matching error', extractedData };
    }

    const status = matchResult.match ? 'VERIFIED' : 'PENDING';
    const reason = matchResult.reason;

    console.log(`Verification Result: ${status}. Reason: ${reason}`);

    // 5. Update User Record
    await pool.query(
        'UPDATE users SET verification_status = $1, is_verified = $2 WHERE id = $3',
        [status, matchResult.match, userId]
    );

    return {
        status,
        isVerified: matchResult.match,
        reason,
        extractedData
    };
};
