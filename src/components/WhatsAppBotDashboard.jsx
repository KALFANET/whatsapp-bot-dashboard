import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, Users, BarChart2, Bell, Settings, Lock, CheckCircle, AlertTriangle, Eye, MessageCircle } from 'lucide-react';
import WhatsAppMessages from './WhatsAppMessages';

const API_BASE_URL = "http://localhost:3001/api/files";
const PDF_URL = "https://nm-digitalhub.com/uploads/";
// Main dashboard component
const WhatsAppBotDashboard = () => {
const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

const [documents, setDocuments] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  let isMounted = true;
  fetchDocuments().then(() => {
      if (!isMounted) return;
  });

  return () => { isMounted = false; };
}, []);



  // Sample data for users
  const users = [
    { id: 1, name: 'ישראל ישראלי', phone: '054-1234567', role: 'מנהל מערכת', status: 'פעיל', lastActive: '13/03/2025 09:45' },
    { id: 2, name: 'שרה כהן', phone: '054-7654321', role: 'משתמש רגיל', status: 'פעיל', lastActive: '13/03/2025 08:30' },
    { id: 3, name: 'יוסף לוי', phone: '054-9876543', role: 'משתמש רגיל', status: 'מושהה', lastActive: '12/03/2025 16:20' },
    { id: 4, name: 'רחל אברהם', phone: '054-3456789', role: 'מנהל קבצים', status: 'פעיל', lastActive: '13/03/2025 07:15' }
  ];
  
  // Sample data for statistics
  const stats = {
    totalDocuments: 1458,
    processedToday: 73,
    pendingDocuments: 12,
    topDocumentTypes: [
      { type: 'חשבוניות', count: 532 },
      { type: 'תעודות משלוח', count: 327 },
      { type: 'חוזים', count: 215 },
      { type: 'הזמנות', count: 198 },
      { type: 'מסמכי זיהוי', count: 186 }
    ],
    activeUsers: 42
  };
  
  const fetchQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/questions');
      setQuestions(response.data);
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
    }
  };
  
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  const handleAddQuestion = async () => {
    try {
      await axios.post('http://localhost:3001/api/questions', { question: newQuestion, answerType: 'text' });
      fetchQuestions();
      setShowModal(false);
    } catch (error) {
      console.error('❌ Error adding question:', error);
    }
  };
  const fetchDocuments = async () => {
    setLoading(true);
    try {
        const response = await axios.get(API_BASE_URL);
        console.log('📌 Server Response:', response.data);
        if (Array.isArray(response.data)) {
            setDocuments(response.data);
        } else {
            setDocuments([]);
        }
    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        if (error.response) {
            console.error('📌 Server Response:', error.response.data);
        }
        setDocuments([]);
    } finally {
        setLoading(false);
    }
  };
  
  // יש לקרוא לפונקציה לאחר הגדרתה
  useEffect(() => {
    fetchDocuments();
  }, []);
const handleFileChange = (event) => {
  if (!event.target.files || event.target.files.length === 0) {
      console.warn("⚠️ No file selected.");
      return;
  }
  
  setSelectedFile(event.target.files[0]);
};

const handleFileUpload = async () => {
  if (!selectedFile) return;

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
      const response = await axios.post(API_BASE_URL + '/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
          setDocuments([...documents, response.data.document]);
          setSelectedFile(null);
          alert('✅ File uploaded successfully');
      } else {
          console.error("❌ Upload failed:", response.data);
          alert('❌ Error uploading file');
      }

  } catch (error) {
      console.error("❌ Error uploading file:", error);
      if (error.response) {
          console.error("📌 Response Data:", error.response.data);
      }
      alert('❌ Error uploading file');
  }
};
const handleDeleteDocument = async (publicId) => {
  if (!publicId) {
      console.error("❌ Missing publicId for deletion.");
      return;
  }

  try {
      console.log('🔍 Deleting file:', publicId);

      const response = await axios.delete(`${API_BASE_URL}/delete/${encodeURIComponent(publicId)}`);
      
      if (response.status === 200) {
          setDocuments(documents.filter(doc => doc.publicId !== publicId));
          alert('✅ File deleted successfully');
      } else {
          console.error("❌ Failed to delete file:", response.data);
          alert('❌ Error deleting file');
      }

  } catch (error) {
      console.error("❌ Axios DELETE error:", error);
      if (error.response) {
          console.error("📌 Response Data:", error.response.data);
      }
      alert('❌ Error deleting file');
  }
};
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800" style={{ direction: 'rtl' }}>
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-teal-600">בוט מסמכים WhatsApp</h1>
          <p className="text-sm text-gray-500">פאנל ניהול</p>
        </div>
        <nav className="p-4">
          <ul>
            <li 
              className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'documents' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="ml-2" size={20} />
              <span>מסמכים</span>
            </li>
            <li 
              className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'users' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="ml-2" size={20} />
              <span>משתמשים</span>
            </li>
            <li 
              className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'stats' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart2 className="ml-2" size={20} />
              <span>סטטיסטיקות</span>
            </li>
            <li 
              className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'alerts' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('alerts')}
            >
              <Bell className="ml-2" size={20} />
              <span>התראות</span>
            </li>
            <li 
              className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'settings' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="ml-2" size={20} />
              <span>הגדרות</span>
            </li>
            <li 
              className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'questions' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('questions')}
            >
              <FileText className="ml-2" size={20} />
              <span>שאלות</span>
            </li>
            <li 
  className={`mb-2 p-2 rounded-lg cursor-pointer flex items-center ${activeTab === 'whatsappMessages' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-100'}`}
  onClick={() => setActiveTab('whatsappMessages')}>
  <MessageCircle className="ml-2" size={20} />
  <span>הודעות WhatsApp</span>
</li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-x-auto">
        {/* Header */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center">
          <div className="flex items-center">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="חיפוש..." 
                className="pl-3 pr-10 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex items-center">
            <Bell className="ml-4 text-gray-600 cursor-pointer" size={20} />
            <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center">
              <span>מ</span>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-6">
        {activeTab === 'whatsappMessages' && <WhatsAppMessages />}
        
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">ניהול מסמכים</h2>
                <div className="flex">
                <input type="file" onChange={handleFileChange} className="hidden" id="fileUpload" />
<label htmlFor="fileUpload" className="bg-teal-500 text-white px-4 py-2 rounded-lg ml-2 flex items-center cursor-pointer">
    <UploadIcon size={18} className="ml-2" />
    העלאת מסמך
</label>
<button onClick={handleFileUpload} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg ml-2">שלח</button>
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center">
                    <span>סינון</span>
                  </button>
                </div>
              </div>
              
              {/* Documents table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם מסמך</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוג</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שולח</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">גודל</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                    </tr>
                  </thead>
<tbody className="bg-white divide-y divide-gray-200">
    {loading ? (
      <tr>
          <td colSpan="8" className="text-center py-4">🔄 טוען נתונים…</td>
      </tr>
    ) : documents.length === 0 ? (
      <tr>
          <td colSpan="8" className="text-center py-4">📂 אין מסמכים זמינים</td>
      </tr>
    ) : (
      documents.map((doc) => (
          doc ? (
              <tr key={doc.publicId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.fileName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.fileName.endsWith('.pdf') ? 'PDF' : 'תמונה'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${doc.status === 'מעובד' ? 'bg-green-100 text-green-800' : 
                            doc.status === 'בעיבוד' ? 'bg-blue-100 text-blue-800' : 
                            doc.status === 'מוצפן' ? 'bg-purple-100 text-purple-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {doc.status || 'מעובד'}
                      </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.sender || 'לא זמין'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.date || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size || 'לא ידוע'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex">
                      <a href={`https://nm-digitalhub.com/uploads/${doc.fileName}`} target="_blank" rel="noopener noreferrer">
                                                    <Eye size={18} className="text-teal-600 ml-2 cursor-pointer" />
                          </a>
                          <button onClick={() => handleDeleteDocument(doc.publicId)} className="text-red-600 cursor-pointer">
                              מחק
                          </button>
                      </div>
                  </td>
              </tr>
          ) : null
      ))
    )}
</tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">ניהול משתמשים</h2>
                <button className="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center">
                  <span>הוספת משתמש</span>
                </button>
              </div>
              
              {/* Users table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טלפון</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תפקיד</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">התחברות אחרונה</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.status === 'פעיל' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActive}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex">
                            <EditIcon size={18} className="text-blue-600 ml-2 cursor-pointer" />
                            <Lock size={18} className="text-gray-600 cursor-pointer" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">סטטיסטיקות מערכת</h2>
              
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">סה"כ מסמכים</p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalDocuments}</h3>
                    </div>
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <FileText className="text-teal-600" size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">מסמכים שעובדו היום</p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.processedToday}</h3>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="text-blue-600" size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">מסמכים בהמתנה</p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingDocuments}</h3>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="text-yellow-600" size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">משתמשים פעילים</p>
                      <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.activeUsers}</h3>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top document types */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">סוגי מסמכים נפוצים</h3>
                <div className="space-y-4">
                  {stats.topDocumentTypes.map((type, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-40 text-sm">{type.type}</div>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div 
                            className="bg-teal-500 h-4 rounded-full" 
                            style={{ width: `${(type.count / stats.totalDocuments) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm font-medium">{type.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'alerts' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">ניהול התראות</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div className="font-medium">התראות מערכת</div>
                  <button className="text-teal-500 text-sm">קריאת כל ההתראות</button>
                </div>
                
                <div className="divide-y divide-gray-100">
                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start mb-1">
                      <div className="p-1 bg-red-100 rounded-full ml-3">
                        <AlertTriangle className="text-red-600" size={16} />
                      </div>
                      <div>
                        <div className="font-medium">שגיאת מערכת</div>
                        <div className="text-sm text-gray-500">תקלה בחיבור למערכת ה-DMS</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mr-8">לפני 10 דקות</div>
                  </div>
                  
                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start mb-1">
                      <div className="p-1 bg-yellow-100 rounded-full ml-3">
                        <AlertTriangle className="text-yellow-600" size={16} />
                      </div>
                      <div>
                        <div className="font-medium">אזהרת אבטחה</div>
                        <div className="text-sm text-gray-500">נסיון גישה ממיקום לא מוכר</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mr-8">לפני 35 דקות</div>
                  </div>
                  
                  <div className="p-4 hover:bg-gray-50">
                    <div className="flex items-start mb-1">
                      <div className="p-1 bg-green-100 rounded-full ml-3">
                        <CheckCircle className="text-green-600" size={16} />
                      </div>
                      <div>
                        <div className="font-medium">עיבוד בוצע בהצלחה</div>
                        <div className="text-sm text-gray-500">12 מסמכים עובדו ונשלחו ל-DMS</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mr-8">לפני שעה</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">הגדרות מערכת</h2>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">הגדרות WhatsApp</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">מספר טלפון הבוט</label>
                      <input type="text" className="w-full p-2 border rounded-lg" value="+972-54-1234567" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">מפתח API</label>
                      <div className="flex">
                        <input type="password" className="w-full p-2 border rounded-r-none rounded-lg" value="••••••••••••••••" />
                        <button className="bg-gray-200 px-4 rounded-l-none rounded-lg border-t border-r border-b">הצג</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">הגדרות OCR</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">מנוע OCR</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option>Google Vision API</option>
                        <option>Tesseract.js</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">שפות לזיהוי</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option>עברית</option>
                        <option>עברית + אנגלית</option>
                        <option>כל השפות</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">הגדרות אבטחה</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input type="checkbox" id="otp-auth" className="ml-2" checked />
                      <label htmlFor="otp-auth" className="text-sm">הפעל אימות OTP</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="file-encryption" className="ml-2" checked />
                      <label htmlFor="file-encryption" className="text-sm">הצפנת קבצים אוטומטית</label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg ml-2">איפוס</button>
                  <button className="bg-teal-500 text-white px-4 py-2 rounded-lg">שמירת הגדרות</button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'questions' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">ניהול שאלות</h2>
              <button onClick={() => setShowModal(true)} className="bg-teal-500 text-white px-4 py-2 rounded-lg mb-4">הוסף שאלה</button>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שאלה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סוג תשובה</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-4">📌 אין שאלות זמינות</td>
                      </tr>
                    ) : (
                      questions.map((q) => (
                        <tr key={q.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.question}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.answerType}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
        {showModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4">הוספת שאלה חדשה</h2>
      <input 
        type="text" 
        value={newQuestion} 
        onChange={(e) => setNewQuestion(e.target.value)} 
        className="w-full p-2 border rounded-lg mb-4"
        placeholder="הקלד את השאלה כאן..."
      />
      <div className="flex justify-end space-x-2">
        <button onClick={handleAddQuestion} className="bg-teal-500 text-white px-4 py-2 rounded-lg">שמור</button>
        <button onClick={() => setShowModal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">ביטול</button>
      </div>
    </div>
  </div>
)} {/* הוסר ה-`;` המיותר */}
      </div>
    </div>
  );  
}

// Adding necessary icons that aren't in lucide-react
const UploadIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DownloadIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const EditIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default WhatsAppBotDashboard;