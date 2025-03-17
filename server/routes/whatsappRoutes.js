const path = require('path');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');
const { Message, Sequelize } = require('../models');
const winston = require('winston'); // צריך להתקין: npm install winston
const notifier = require('node-notifier'); // צריך להתקין: npm install node-notifier
const cron = require('node-cron'); // צריך להתקין: npm install node-cron
require('dotenv').config(); // טעינת משתני הסביבה

router.use(bodyParser.json());

// הגדרת logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.join(__dirname, '../logs/whatsapp-messages.log') })
    ]
});

// פונקציה לשליחת הודעות WhatsApp
async function sendWhatsAppResponse(to, content, type = 'text') {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        logger.error('WhatsApp API credentials missing. Check environment variables.');
        throw new Error('WhatsApp API credentials missing');
    }
    
    try {
        logger.info(`Sending WhatsApp ${type} message to: ${to}`);
        
        let requestBody = {
            messaging_product: 'whatsapp',
            to: to,
            // נשתמש בסוג המתאים של הודעה בהתאם לפרמטר type
        };
        
        // התאמת המבנה לפי סוג ההודעה
        if (type === 'text') {
            requestBody.text = { body: content };
        } else if (type === 'template') {
            requestBody.template = content; // content צריך להיות אובייקט תבנית תקין
        }
        
        const response = await axios.post(
            `https://graph.facebook.com/v16.0/${PHONE_NUMBER_ID}/messages`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        logger.info(`Message sent successfully to ${to}, response status: ${response.status}`);
        return response.data;
    } catch (error) {
        logger.error(`Error sending WhatsApp message to ${to}:`, error.response?.data || error.message);
        throw error;
    }
}

// פונקציה לשליחת הודעת ברוכים הבאים
async function sendWelcomeTemplate(phoneNumber, customerName) {
    try {
        const templateBody = {
            name: 'welcome_message', // או השם שבחרת לתבנית
            language: { code: 'he' },
            components: [
                {
                    type: 'body',
                    parameters: [
                        {
                            type: 'text',
                            text: customerName
                        }
                    ]
                }
            ]
        };
        
        return await sendWhatsAppResponse(phoneNumber, templateBody, 'template');
    } catch (error) {
        console.error('Error sending welcome template:', error);
        logger.error('Failed to send welcome template', error);
        // נשלח הודעת טקסט פשוטה במקרה של כישלון בשליחת התבנית
        try {
            return await sendWhatsAppResponse(
                phoneNumber,
                `שלום ${customerName}, תודה שפנית ל-NM Digital HUB! אנחנו כאן לעזור לך עם ניהול המסמכים שלך.`,
                'text'
            );
        } catch (secondError) {
            logger.error('Failed to send fallback text message', secondError);
            throw secondError;
        }
    }
}

// נתיב GET עבור אימות ה-Webhook
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info(`Webhook verification attempt. Mode: ${mode}, Token match: ${token === VERIFY_TOKEN}`);

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('\x1b[32m%s\x1b[0m', '✅ Webhook Verified Successfully');
            logger.info('Webhook verification successful');
            res.status(200).send(challenge);
        } else {
            console.error('\x1b[31m%s\x1b[0m', '❌ Webhook verification failed: Invalid token');
            logger.error('Webhook verification failed: Invalid token');
            res.sendStatus(403);
        }
    } else {
        console.error('\x1b[31m%s\x1b[0m', '❌ Webhook verification failed: Missing parameters');
        logger.error('Webhook verification failed: Missing parameters');
        res.sendStatus(400);
    }
});

// נתיב POST שמאזין להודעות נכנסות מ-WhatsApp
router.post('/webhook', async (req, res) => {
    try {
        logger.info('Received webhook callback');
        
        if (!req.body.entry || !req.body.entry[0] || !req.body.entry[0].changes) {
            logger.error('Invalid webhook data structure', { body: JSON.stringify(req.body) });
            return res.status(400).json({ error: 'Invalid Webhook Data' });
        }

        const changes = req.body.entry[0].changes;
        for (const change of changes) {
            if (change.value && change.value.messages) {
                for (const msg of change.value.messages) {
                    // שמירת ההודעה במסד הנתונים
                    const timestamp = new Date(msg.timestamp * 1000);
                    const savedMessage = await Message.create({
                        sender: msg.from,
                        text: msg.text?.body || '',
                        timestamp: timestamp
                    });
                    
                    // הצגת הודעה בטרמינל על קבלת הודעה חדשה
                    console.log('\x1b[34m%s\x1b[0m', `📩 New message received from: ${msg.from}`);
                    console.log(`   Content: ${msg.text?.body || '[no text content]'}`);
                    console.log(`   Time: ${timestamp.toLocaleString()}`);
                    console.log('-----------------------------------');
                    
                    // שמירה ללוג
                    logger.info(`New message from ${msg.from}: ${msg.text?.body || '[no text content]'}`);
                    
                    // שליחת התראה למערכת
                    notifier.notify({
                        title: 'WhatsApp Bot',
                        message: `New message from: ${msg.from}`,
                        sound: true
                    });
                    
                    // בדיקה אם זו הודעה ראשונה מהמשתמש
                    const messagesCount = await Message.count({ where: { sender: msg.from } });
                    if (messagesCount <= 1) { // אם זו ההודעה הראשונה (כולל זו שהרגע נשמרה)
                        try {
                            // קבל את שם הלקוח או השתמש בברירת מחדל
                            const customerName = msg.contacts?.[0]?.profile?.name || 'לקוח יקר';
                            await sendWelcomeTemplate(msg.from, customerName);
                            console.log(`✅ Welcome template sent to ${msg.from}`);
                            logger.info(`Welcome template sent to ${msg.from}`);
                        } catch (sendError) {
                            console.error(`❌ Error sending welcome template: ${sendError.message}`);
                            logger.error(`Error sending welcome message to ${msg.from}:`, sendError);
                        }
                    } else {
                        // בדיקה האם צריך לשלוח תגובה אוטומטית
                        const messageText = msg.text?.body?.toLowerCase() || '';
                        if (messageText.includes('שלום') || 
                            messageText.includes('hello') || 
                            messageText.includes('hi') || 
                            messageText === 'היי') {
                            try {
                                await sendWhatsAppResponse(msg.from, 'שלום! אנחנו שמחים שפנית אלינו. נציג יחזור אליך בהקדם.', 'text');
                                console.log(`✅ Auto-reply sent to ${msg.from}`);
                                logger.info(`Auto-reply sent to ${msg.from}`);
                            } catch (sendError) {
                                console.error(`❌ Error sending auto-reply: ${sendError.message}`);
                                logger.error(`Error sending auto-reply to ${msg.from}:`, sendError);
                            }
                        }
                    }
                }
            }
        }

        res.status(200).json({ message: 'Messages processed' });
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Webhook Error: ${error.message}`);
        logger.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// נתיב GET להצגת כל ההודעות
router.get('/whatsapp-messages', async (req, res) => {
    try {
        logger.info('Retrieving all WhatsApp messages');
        
        // בדיקה לגבי קיום הטבלה לפני השאילתה
        const tableExists = await Message.sequelize.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='Messages';",
            { type: Message.sequelize.QueryTypes.SELECT }
        );
        
        if (tableExists.length === 0) {
            logger.error('Table Messages does not exist');
            return res.status(500).json({ 
                error: 'Database configuration error',
                details: 'Messages table not found'
            });
        }
        
        const messages = await Message.findAll({ 
            order: [['timestamp', 'DESC']]
        });
        
        logger.info(`Retrieved ${messages.length} messages`);
        res.json(messages);
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Error fetching messages: ${error.message}`);
        logger.error('Error fetching messages:', error);
        res.status(500).json({ 
            error: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// הגדרת משימה שרצה כל שעה לבדיקת הודעות שלא טופלו
cron.schedule('0 * * * *', async () => {
    try {
        logger.info('Running scheduled check for unhandled messages');
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const unhandledMessages = await Message.findAll({
            where: {
                timestamp: { [Sequelize.Op.gte]: oneHourAgo },
                // כאן ניתן להוסיף תנאים נוספים לזיהוי הודעות שלא טופלו
            }
        });
        
        if (unhandledMessages.length > 0) {
            const warningMessage = `⚠️ Warning: ${unhandledMessages.length} unhandled messages in the last hour`;
            console.log('\x1b[33m%s\x1b[0m', warningMessage);
            logger.warn(warningMessage);
            
            // אפשר גם לשלוח התראה
            notifier.notify({
                title: 'WhatsApp Bot - Unhandled Messages',
                message: `${unhandledMessages.length} messages need attention`,
                sound: true
            });
        }
    } catch (error) {
        logger.error('Error checking for unhandled messages:', error);
    }
});

module.exports = router;