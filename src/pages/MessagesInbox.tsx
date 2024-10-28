import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import Chat from '../components/Chat';

interface MessagesInboxProps {
  currentUserId: string;
  socket: any;
}

interface ChatItem {
  id: number;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ currentUserId, socket }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chats/${currentUserId}`);
        const data = await response.json();
        setChats(data);
      } catch (error) {
        console.error('Error al obtener los chats:', error);
      }
    };
    fetchChats();
  }, [currentUserId]);

  const openChat = (chatId: number) => {
    setSelectedChatId(chatId);
    setShowChat(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buzón de Mensajes</IonTitle>
          {showChat && (
            <IonButton slot="start" onClick={() => setShowChat(false)}>
              <IonIcon icon={arrowBackOutline} />
              Volver
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {showChat && selectedChatId ? (
          // Mostrar la conversación si se ha seleccionado un chat
          <Chat chatId={selectedChatId.toString()} currentUserId={currentUserId} socket={socket} />
        ) : (
          // Mostrar la lista de chats si no hay chat seleccionado
          <IonList>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <IonItem key={chat.id} onClick={() => openChat(chat.id)}>
                  <IonLabel>
                    {chat.user1_id === currentUserId
                      ? `Chat con ${chat.user2_id}`
                      : `Chat con ${chat.user1_id}`}
                  </IonLabel>
                </IonItem>
              ))
            ) : (
              <IonItem>
                <IonLabel>No tienes chats disponibles.</IonLabel>
              </IonItem>
            )}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MessagesInbox;
