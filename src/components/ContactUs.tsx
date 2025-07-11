import React, { useState } from 'react';
import { Mail, Phone, Send, MapPin, Clock, MessageCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add the message to Firestore
      await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'new'
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

      toast.success('Message sent successfully! We will get back to you soon.');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Get in <span className="text-amber-500">Touch</span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Have questions? We're here to help you achieve academic excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="contact-name" className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-gray-700 font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-gray-700 font-medium mb-2">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
                <Send className="w-5 h-5 ml-2" />
              </button>
            </form>
          </div>

          <div className="bg-blue-800 rounded-2xl p-8 text-white">
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Mail className="w-6 h-6 mr-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Email</h4>
                    <p className="text-blue-100">content.notelibrary@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 mr-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Location</h4>
                    <p className="text-blue-100">Kathmandu, Nepal</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-6 h-6 mr-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Response Time</h4>
                    <p className="text-blue-100">Within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MessageCircle className="w-6 h-6 mr-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Support</h4>
                    <p className="text-blue-100">Monday - Friday</p>
                    <p className="text-blue-100 text-sm">9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-blue-700">
                <h4 className="font-medium mb-3">Why Contact Us?</h4>
                <ul className="space-y-2 text-blue-100 text-sm">
                  <li>• Academic guidance and support</li>
                  <li>• Technical issues with the app</li>
                  <li>• Feedback and suggestions</li>
                  <li>• Partnership opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;