router.get('/whatsapp-messages', async (req, res) => {
  try {
      console.log('🔍 Fetching WhatsApp messages...');
      
      // בדיקה לגבי קיום הטבלה לפני השאילתה
      const tableExists = await Message.sequelize.query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='Messages';",
          { type: Message.sequelize.QueryTypes.SELECT }
      );
      
      if (tableExists.length === 0) {
          console.error('❌ Table Messages does not exist');
          return res.status(500).json({ 
              error: 'Database configuration error',
              details: 'Messages table not found'
          });
      }
      
      const messages = await Message.findAll({ 
          order: [['timestamp', 'DESC']]
      });
      
      console.log(`✅ Found ${messages.length} messages`);
      res.json(messages);
  } catch (error) {
      console.error('❌ Error fetching messages:', error);
      res.status(500).json({ 
          error: 'Server error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
});