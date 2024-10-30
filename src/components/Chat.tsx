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
import socket from '../pages/socket';

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
            <IonItem key={message.id} lines="none">
              <IonLabel>
                <p>
                  <strong>{message.sender_id === currentUserId ? 'Tú' : message.sender_name}:</strong> {message.content}
                </p>
                <small>{new Date(message.timestamp!).toLocaleTimeString()}</small>
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