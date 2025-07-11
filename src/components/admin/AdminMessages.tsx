import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Mail, Trash2, Check, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: any;
  status: 'new' | 'read' | 'replied';
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'contactMessages', messageId));
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleStatusUpdate = async (messageId: string, newStatus: 'read' | 'replied') => {
    try {
      await updateDoc(doc(db, 'contactMessages', messageId), {
        status: newStatus
      });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'read':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'replied':
        return <Mail className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Contact Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedMessage?.id === message.id
                    ? 'bg-blue-50 border-l-4 border-blue-800'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{message.name}</span>
                  {getStatusIcon(message.status)}
                </div>
                <p className="text-sm text-gray-600 truncate">{message.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {message.createdAt?.toDate().toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Message Details */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">{selectedMessage.name}</h2>
                  <p className="text-gray-600">{selectedMessage.email}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedMessage.id, 'read')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Mark as Read"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedMessage.id, 'replied')}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Mark as Replied"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500">
                  Received on {selectedMessage.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-full">
              <p className="text-gray-500">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages; 