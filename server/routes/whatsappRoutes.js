const path = require('path');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');
const { Message, Sequelize } = require('../models');
const winston = require('winston');
const notifier = require('node-notifier');
const cron = require('node-cron');
require('dotenv').config();

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

// פונקציה לשליחת הודעות WhatsApp ושמירתן במסד הנתונים
async function sendWhatsAppResponse(to, content, type = 'text', isWelcome = false) {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        logger.error('WhatsApp API credentials missing. Check environment variables.');
        throw new Error('WhatsApp API credentials missing');
    }
    
    try {
        let requestBody = {
            messaging_product: 'whatsapp',
            to: to
        };
        
        if (type === 'text') {
            requestBody.text = { body: content };
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

        await Message.create({
            sender: PHONE_NUMBER_ID,
            text: content,
            timestamp: new Date(),
            type: 'outgoing'
        });

        logger.info(`Message sent successfully to ${to}, response status: ${response.status}`);
        return response.data;
    } catch (error) {
        logger.error(`Error sending WhatsApp message to ${to}:`, error.response?.data || error.message);
        throw error;
    }
}

// נתיב GET עבור אימות ה-Webhook
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        logger.info('Webhook verification successful');
        res.status(200).send(challenge);
    } else {
        logger.error('Webhook verification failed');
        res.sendStatus(403);
    }
});

// נתיב POST שמאזין להודעות נכנסות
router.post('/webhook', async (req, res) => {
    try {
        const changes = req.body.entry?.[0]?.changes;
        if (!changes) {
            return res.status(400).json({ error: 'Invalid Webhook Data' });
        }

        for (const change of changes) {
            if (change.value?.messages) {
                for (const msg of change.value.messages) {
                    const messageText = msg.text?.body || '[מדיה]';
                    const timestamp = new Date(msg.timestamp * 1000);
                    
                    // בדיקת הודעות כפולות
                    const tenSecondsAgo = new Date(timestamp.getTime() - 10000);
                    const possibleDuplicate = await Message.findOne({
                        where: {
                            sender: msg.from,
                            text: messageText,
                            timestamp: { [Sequelize.Op.gte]: tenSecondsAgo }
                        }
                    });
                    if (possibleDuplicate) continue;
                    
                    // שמירת הודעה נכנסת
                    await Message.create({ sender: msg.from, text: messageText, timestamp, type: 'incoming' });
                    logger.info(`New message received from ${msg.from}`);

                    // שליחת הודעת ברוכים הבאים במידת הצורך
                    const messagesCount = await Message.count({ where: { sender: msg.from } });
                    if (messagesCount === 1) {
                        await sendWhatsAppResponse(msg.from, 'שלום וברוך הבא! איך אפשר לעזור לך?', 'text', true);
                    }
                }
            }
        }

        res.status(200).json({ message: 'Messages processed' });
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// נתיב GET להצגת כל ההודעות
router.get('/whatsapp-messages', async (req, res) => {
    try {
        const messages = await Message.findAll({ order: [['timestamp', 'DESC']] });
        res.json(messages);
    } catch (error) {
        logger.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// הגדרת משימת CRON לבדיקת הודעות לא מטופלות
cron.schedule('0 * * * *', async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const unhandledMessages = await Message.findAll({
            where: { timestamp: { [Sequelize.Op.gte]: oneHourAgo } }
        });
        
        if (unhandledMessages.length > 0) {
            logger.warn(`${unhandledMessages.length} unhandled messages in the last hour`);
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