const express = require('express');
const router = express.Router();
const axios = require('axios');
const bodyParser = require('body-parser');
const { Message } = require('../models');
require('dotenv').config(); // טעינת משתני הסביבה

router.use(bodyParser.json());

// נתיב GET עבור אימות ה-Webhook
router.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook Verified Successfully');
            res.status(200).send(challenge);
        } else {
            console.error('❌ Webhook verification failed: Invalid token');
            res.sendStatus(403);
        }
    } else {
        console.error('❌ Webhook verification failed: Missing parameters');
        res.sendStatus(400);
    }
});

// נתיב POST שמאזין להודעות נכנסות מ-WhatsApp
router.post('/webhook', async (req, res) => {
    try {
        if (!req.body.entry || !req.body.entry[0] || !req.body.entry[0].changes) {
            return res.status(400).json({ error: 'Invalid Webhook Data' });
        }

        const changes = req.body.entry[0].changes;
        for (const change of changes) {
            if (change.value && change.value.messages) {
                for (const msg of change.value.messages) {
                    // שמירת ההודעה במסד הנתונים
                    await Message.create({
                        sender: msg.from,
                        text: msg.text?.body || '',
                        timestamp: new Date(msg.timestamp * 1000)
                    });
                    
                    // הצגת הודעה בטרמינל על קבלת הודעה חדשה
                    console.log('\x1b[34m%s\x1b[0m', `📩 New message received from: ${msg.from}`);
                }
            }
        }

        res.status(200).json({ message: 'Messages processed' });
    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/whatsapp-messages', async (req, res) => {
    try {
        const messages = await Message.findAll({ order: [['timestamp', 'DESC']] });
        res.json(messages);
    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;