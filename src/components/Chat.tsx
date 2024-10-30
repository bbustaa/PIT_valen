import React, { useEffect, useState } from 'react';
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
import socket from '../pages/socket'; // Asegúrate de la ruta correcta a socket.ts

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
}

const Chat: React.FC<ChatProps> = ({ chatId, currentUserId, socket, receiverId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  useEffect(() => {
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

    // Unirse al chat al montar el componente
    socket.emit('join_chat', chatId);

    // Escuchar nuevos mensajes y actualizar la lista en tiempo real
    socket.on('receive_message', (message: Message) => {
      if (message.chatId === chatId) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    // Limpiar los eventos al desmontar el componente
    return () => {
      socket.off('receive_message');
    };
}, [chatId, socket]);

  // Manejar el envío de un nuevo mensaje
  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const message: Message = {
        id: Date.now(),
        chatId,
        sender_id: currentUserId,
        content: newMessage,
      };
      // Emitir el mensaje junto con receiverId al backend
      socket.emit('send_message', { ...message, receiver_id: receiverId });
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage('');
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonList>
          {messages.map((message) => (
            <IonItem key={message.id} lines="none">
              <IonLabel>
                <p>
                  <strong>{message.sender_id === currentUserId ? 'Tú' : 'Otro'}:</strong> {message.content}
                </p>
              </IonLabel>
            </IonItem>
          ))}
          {messages.length === 0 && (
            <IonItem lines="none">
              <IonLabel>No hay mensajes en este chat. Sé el primero en decir algo!</IonLabel>
            </IonItem>
          )}
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
