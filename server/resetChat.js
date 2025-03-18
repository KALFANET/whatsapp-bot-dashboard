// server/resetChat.js
const { Message } = require('./models');

async function resetChat(phoneNumber) {
  try {
    console.log(`🔄 Resetting chat for user: ${phoneNumber}`);
    
    // מחיקת כל ההודעות של המשתמש הספציפי
    const deletedCount = await Message.destroy({
      where: {
        sender: phoneNumber
      }
    });
    
    console.log(`✅ Deleted ${deletedCount} messages for ${phoneNumber}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting chat:', error);
    process.exit(1);
  }
}

// מספר הטלפון שברצונך לאפס את הצ'אט שלו
const phoneToReset = process.argv[2] || '972532743588';
resetChat(phoneToReset);