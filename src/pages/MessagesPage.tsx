import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { messageService, Message, Contact } from '../services/messageService';
import { 
  Search, 
  Send, 
  User, 
  Users, 
  Clock, 
  Check, 
  CheckCheck,
  Plus,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const [showContactList, setShowContactList] = useState(true);

  // Surveiller les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowContactList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Charger les contacts au chargement de la page
  useEffect(() => {
    loadContacts();
  }, []);

  // Charger les messages lorsqu'un contact est sélectionné
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
      if (mobileView) {
        setShowContactList(false);
      }
    }
  }, [selectedContact, mobileView]);

  // Faire défiler vers le bas lorsque de nouveaux messages sont chargés
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = async () => {
    try {
      const data = await messageService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    }
  };

  const loadMessages = async (contactId: number) => {
    try {
      setLoading(true);
      const response = await messageService.getMessages(contactId);
      setMessages(response.data);
      
      // Marquer tous les messages comme lus
      await messageService.markAllAsRead(contactId);
      
      // Mettre à jour le compteur de messages non lus
      setContacts(contacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, unreadCount: 0 } 
          : contact
      ));
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContact || !newMessage.trim()) return;
    
    try {
      const message = await messageService.sendMessage(selectedContact.id, newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleNewMessageClick = async () => {
    setShowNewMessage(true);
    try {
      const contacts = await messageService.getAvailableContacts();
      setAvailableContacts(contacts);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts disponibles:', error);
      toast.error('Erreur lors du chargement des contacts disponibles');
    }
  };

  const handleSearchContact = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchContact(value);
    
    if (showNewMessage) {
      try {
        const contacts = await messageService.getAvailableContacts(value);
        setAvailableContacts(contacts);
      } catch (error) {
        console.error('Erreur lors de la recherche de contacts:', error);
      }
    }
  };

  const handleNewContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowNewMessage(false);
    setSearchContact('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + 
             date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getInitials = (nom: string, prenom: string) => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={handleNewMessageClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau message
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col md:flex-row">
        {/* Liste des contacts */}
        {showContactList && (
          <div className="w-full md:w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Rechercher..."
                  value={searchContact}
                  onChange={handleSearchContact}
                />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-16rem)]">
              {showNewMessage ? (
                // Liste des contacts disponibles pour un nouveau message
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center">
                    <button
                      onClick={() => setShowNewMessage(false)}
                      className="mr-2 text-gray-500 hover:text-gray-700"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h3 className="text-lg font-medium text-gray-900">Nouveau message</h3>
                  </div>
                  
                  {availableContacts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucun contact trouvé
                    </div>
                  ) : (
                    availableContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleNewContactSelect(contact)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {getInitials(contact.nom, contact.prenom)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.nom} {contact.prenom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {contact.role?.libelle || 'Utilisateur'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                // Liste des conversations existantes
                contacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucune conversation
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div
                      key={contact.id}
                      className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                        selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 relative">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {getInitials(contact.nom, contact.prenom)}
                              </span>
                            </div>
                            {contact.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {contact.unreadCount}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.nom} {contact.prenom}
                            </p>
                            {contact.lastMessage && (
                              <p className="text-xs text-gray-500 truncate">
                                {contact.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                        {contact.lastMessageDate && (
                          <div className="text-xs text-gray-500">
                            {formatDate(contact.lastMessageDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}

        {/* Zone de conversation */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* En-tête de la conversation */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                {mobileView && (
                  <button
                    onClick={() => setShowContactList(true)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {getInitials(selectedContact.nom, selectedContact.prenom)}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedContact.nom} {selectedContact.prenom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedContact.email}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Users className="h-12 w-12 mb-2" />
                    <p>Commencez une conversation avec {selectedContact.nom}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => {
                      const isSender = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                              isSender 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{message.contenu}</p>
                            <div className={`text-xs mt-1 flex items-center justify-end ${
                              isSender ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatDate(message.createdAt)}
                              {isSender && (
                                <span className="ml-1">
                                  {message.lu ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Formulaire d'envoi de message */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Écrivez votre message..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Users className="h-16 w-16 mb-4" />
              <p className="text-lg">Sélectionnez une conversation ou commencez-en une nouvelle</p>
              <button
                onClick={handleNewMessageClick}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};