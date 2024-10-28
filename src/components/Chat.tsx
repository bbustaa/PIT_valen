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

interface ChatProps {
  chatId: string;
  currentUserId: string;
  socket: any;
}

interface Message {
  chatId: string;
  sender_id: string;
  content: string;
  timestamp?: string;
}

const Chat: React.FC<ChatProps> = ({ chatId, currentUserId, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');

  useEffect(() => {
    // Obtener mensajes previos del chat al cargar el componente
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/mensajes/${chatId}`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error al obtener mensajes:', error);
      }
    };

    fetchMessages();

    // Escuchar nuevos mensajes en tiempo real
    if (socket) {
      socket.on('receive_message', (message: Message) => {
        if (message.chatId === chatId) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('receive_message');
      }
    };
  }, [chatId, socket]);

  // Manejar el envío de un nuevo mensaje
  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const message: Message = {
        chatId,
        sender_id: currentUserId,
        content: newMessage,
      };
      socket.emit('send_message', message);
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage('');
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonList>
          {messages.map((message, index) => (
            <IonItem key={index} lines="none">
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