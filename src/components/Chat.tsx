import React, { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonFooter,
  IonButton,
  IonIcon,
  IonInput,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonPage,
} from '@ionic/react';
import { send } from 'ionicons/icons';
import socket from '../pages/socket';
import './Chat.css'; // Importar archivo CSS para los estilos

interface ChatProps {
  chatId: string;
  currentUserId: string;
  socket: any;
  receiverId?: string;
}

interface Message {
  id: number;
  chatId: string;
  sender_id: string;
  content: string;
  timestamp?: string;
  sender_name?: string; 
}

const Chat: React.FC<ChatProps> = ({ chatId, currentUserId, receiverId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  
  // Referencia al final de la lista de mensajes
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Unirse al chat
    socket.emit('join_chat', chatId.toString());

    // Recuperar los mensajes del chat cuando el componente se monta
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chats/${chatId}/messages`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error al obtener los mensajes del chat:', error);
      }
    };

    fetchMessages();

    // Manejar la recepción de nuevos mensajes
    const handleReceiveMessage = (message: Message) => {
      console.log("Mensaje recibido del socket:", message);
      if (message.chatId.toString() === chatId.toString()) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    // Limpiar los eventos al desmontar el componente
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.emit('leave_chat', chatId);
    };
  }, [chatId, socket]);

  // Efecto para desplazar automáticamente hacia el último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Manejar el envío de un nuevo mensaje
  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const message: Message = {
        id: Date.now(),
        chatId,
        sender_id: currentUserId,
        content: newMessage,
      };

      setNewMessage('');

      // Emitir el mensaje al servidor y añadirlo a la lista de mensajes localmente
      socket.emit('send_message', { ...message, receiver_id: receiverId }, (ack: any) => {
        if (ack?.success) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonList>
          {messages.map((message) => (
            <IonItem
              key={message.id}
              lines="none"
              className={
                message.sender_id === currentUserId ? 'message-item me' : 'message-item other'
              }
            >
              <IonLabel className="message-label">
                <p className="message-sender">
                  <strong>{message.sender_id === currentUserId ? 'Tú' : message.sender_name}:</strong>
                </p>
                <p className="message-content">{message.content}</p>
                <small className="message-timestamp">
                  {new Date(message.timestamp!).toLocaleTimeString()}
                </small>
              </IonLabel>
            </IonItem>
          ))}
          {/* Elemento para desplazar automáticamente hacia el final de la lista de mensajes */}
          <div ref={messagesEndRef} />
        </IonList>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonInput
            value={newMessage}
            placeholder="Escribe un mensaje..."
            onIonChange={(e) => setNewMessage(e.detail.value!)}
            slot="start"
            clearInput
          />
          <IonButton slot="end" color="primary" onClick={handleSendMessage}>
            <IonIcon icon={send} />
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Chat;
