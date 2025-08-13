
import { useState, useEffect, useRef } from 'react';

interface GroupChatProps {
  groupeId: number | string;
  user: { id: number; nom: string; prenom: string };
}

export default function GroupChat({ groupeId, user }: GroupChatProps) {

  type Attachment = { url: string; originalName: string; mimetype: string };
  type Message = {
    id: number;
    contenu: string;
    createdAt: string;
    user?: { id: number; nom: string; prenom: string };
    attachments?: Attachment[];
  };
  type Reaction = { like: number; emoji: Record<string, number> };

  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Record<number, Reaction>>({});
  const [contenu, setContenu] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/group-messages/${groupeId}`);
    const data = await res.json();
    setMessages(data.data || []);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [groupeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('contenu', contenu);
    files.forEach(file => formData.append('files', file));
    await fetch(`/api/group-messages/${groupeId}`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setContenu('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(false);
    fetchMessages();
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[80vh] border rounded bg-white shadow">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => {
          const isMine = msg.user?.id === user?.id;
          const msgReactions = reactions[msg.id] || { like: 0, emoji: {} };
          return (
            <div key={msg.id} className={`flex mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-lg p-3 shadow ${isMine ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'}`}>
                <div className="flex items-center mb-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mr-2 ${isMine ? 'bg-blue-600' : 'bg-gray-400'}`}> 
                    {msg.user?.prenom?.charAt(0)}{msg.user?.nom?.charAt(0)}
                  </div>
                  <span className="font-semibold">{msg.user?.prenom} {msg.user?.nom}</span>
                </div>
                <div className="mb-2">{msg.contenu}</div>
                {msg.attachments && msg.attachments.map(att => (
                  att.mimetype?.startsWith('image/')
                    ? <img key={att.url} src={att.url} alt={att.originalName} className="max-w-full my-2 rounded" />
                    : <a key={att.url} href={att.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 underline my-2">
                        <span role="img" aria-label="file">📎</span> {att.originalName}
                      </a>
                ))}
                <div className="text-xs text-gray-500 mt-2">{new Date(msg.createdAt).toLocaleString()}</div>
                {/* Réactions */}
                <div className="flex gap-2 mt-2 items-center">
                  <button
                    type="button"
                    className="px-2 py-1 rounded bg-gray-200 hover:bg-blue-200 text-sm"
                    onClick={() => setReactions(r => ({
                      ...r,
                      [msg.id]: {
                        ...msgReactions,
                        like: (msgReactions.like || 0) + 1,
                        emoji: msgReactions.emoji || {}
                      }
                    }))}
                  >👍 {msgReactions.like > 0 && msgReactions.like}</button>
                  {["😀", "😂", "😍", "🔥", "🎉"].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className="px-2 py-1 rounded bg-gray-200 hover:bg-yellow-200 text-sm"
                      onClick={() => setReactions(r => ({
                        ...r,
                        [msg.id]: {
                          ...msgReactions,
                          emoji: {
                            ...msgReactions.emoji,
                            [emoji]: (msgReactions.emoji[emoji] || 0) + 1
                          },
                          like: msgReactions.like || 0
                        }
                      }))}
                    >{emoji} {(msgReactions.emoji?.[emoji] ?? 0) > 0 && (msgReactions.emoji?.[emoji] ?? 0)}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex flex-col gap-2 p-4 border-t bg-gray-50">
        <textarea
          value={contenu}
          onChange={e => setContenu(e.target.value)}
          placeholder="Votre message..."
          className="border rounded p-2 resize-none"
          required
        />
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={e => setFiles(Array.from(e.target.files ?? []))}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="mb-2"
        />
        <button type="submit" className="btn btn-primary self-end" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}