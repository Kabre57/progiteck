import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMessages,
  getConversations,
  getUnreadCount,
  sendMessage,
  markAsRead,
  deleteMessage
} from '@/controllers/messageController';
import { authenticateToken } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router: Router = Router();

// Validation pour l'envoi de message
const sendMessageValidation = [
  body('contenu')
    .notEmpty()
    .withMessage('Le contenu du message est requis')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Le contenu doit contenir entre 1 et 2000 caractères'),
  
  body('receiverId')
    .notEmpty()
    .withMessage('L\'ID du destinataire est requis')
    .isInt({ min: 1 })
    .withMessage('L\'ID du destinataire doit être un entier positif')
];

// Routes
router.get('/', authenticateToken, getMessages);
router.get('/conversations', authenticateToken, getConversations);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.post('/', 
  authenticateToken,
  validate(sendMessageValidation),
  sendMessage
);
router.patch('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteMessage);

export default router;