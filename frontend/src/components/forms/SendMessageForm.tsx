import { useForm } from 'react-hook-form';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { useState, useEffect } from 'react';

interface SendMessageFormProps {
  receiverId?: number;
  onSent?: () => void;
}

export default function SendMessageForm({ receiverId, onSent }: SendMessageFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ contenu: string; receiverId: string }>();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: number; nom: string; prenom: string }[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    userService.getUsers({ limit: 100 }).then(res => {
      setUsers(res.data || []);
    });
  }, []);

  const filteredUsers = users.filter(u =>
    (u.nom + ' ' + u.prenom).toLowerCase().includes(search.toLowerCase()) ||
    (u.prenom + ' ' + u.nom).toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: { contenu: string; receiverId: string }) => {
    try {
      const finalReceiverId = receiverId ?? Number(data.receiverId);
      await messageService.sendMessage({ contenu: data.contenu, receiverId: finalReceiverId });
      setSuccess('Message envoyé !');
      reset();
      if (onSent) onSent();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de l’envoi');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border rounded w-full p-2"
        placeholder="Rechercher un destinataire..."
      />
      <select
        {...register('receiverId', { required: 'Le destinataire est requis' })}
        className="border rounded w-full p-2"
        defaultValue=""
      >
        <option value="" disabled>Choisir le destinataire</option>
        {filteredUsers.map(u => (
          <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
        ))}
      </select>
      {errors.receiverId && <p className="text-red-500">{errors.receiverId.message}</p>}
      <textarea
        {...register('contenu', { required: 'Le contenu est requis' })}
        className="border rounded w-full p-2"
        placeholder="Votre message"
      />
      {errors.contenu && <p className="text-red-500">{errors.contenu.message}</p>}
      <button type="submit" className="btn btn-primary">Envoyer</button>
      {success && <p className="text-green-500">{success}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}