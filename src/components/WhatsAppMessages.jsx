import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw, Search, Trash2, Send, MessageSquare } from 'lucide-react'; // שימוש באייקונים מקצועיים
import './WhatsAppMessages.css';

function WhatsAppMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // מסנן לפי סוג הודעה
  const [filterSender, setFilterSender] = useState('all'); // מסנן לפי שולח

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3001/api/whatsapp/whatsapp-messages');
        setMessages(response.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteMessage = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/whatsapp/messages/${id}`);
      setMessages(messages.filter((msg) => msg.id !== id));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  // סינון הודעות לפי סוג ושולח
  const filteredMessages = messages.filter((msg) => {
    if (filterType !== 'all' && msg.type !== filterType) return false;
    if (filterSender !== 'all' && msg.sender !== filterSender) return false;
    return msg.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>הודעות WhatsApp</h2>
        <div className="actions">
          <button onClick={() => window.location.reload()} className="refresh-button">
            <RefreshCcw size={18} /> רענן
          </button>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="חפש הודעות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">כל ההודעות</option>
            <option value="incoming">הודעות נכנסות</option>
            <option value="outgoing">הודעות יוצאות</option>
          </select>
          <select value={filterSender} onChange={(e) => setFilterSender(e.target.value)}>
            <option value="all">כל השולחים</option>
            {[...new Set(messages.map((msg) => msg.sender))].map((sender) => (
              <option key={sender} value={sender}>{sender}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="loading">טוען הודעות...</p>}
      {error && <p className="error">שגיאה: {error}</p>}

      {filteredMessages.length === 0 ? (
        <p className="no-messages">אין הודעות להצגה</p>
      ) : (
        <div className="messages-list">
          {filteredMessages.map((message) => (
            <div key={message.id} className={`message-item ${message.type === 'outgoing' ? 'outgoing' : 'incoming'}`}>
              <div className="message-header">
                <span className="message-sender">
                  {message.type === 'outgoing' ? 'את/ה' : message.sender}
                  {message.type === 'outgoing' && <Send size={14} className="outgoing-icon" />}
                  {message.type === 'incoming' && <MessageSquare size={14} className="incoming-icon" />}
                </span>
                <button onClick={() => handleDeleteMessage(message.id)} className="delete-button">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="message-content">{message.text}</div>
              <div className="message-time">{formatDate(message.timestamp)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="messages-footer">
        <p>סה"כ: {filteredMessages.length} הודעות</p>
      </div>
    </div>
  );
}

export default WhatsAppMessages;
