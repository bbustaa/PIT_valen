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
    // Verificar que el currentUserId se obtiene correctamente
    console.log('currentUserId:', currentUserId);

    // Obtener los chats existentes cuando se monta el componente
    const fetchChats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chats/${currentUserId}`);
        if (response.ok) {
          const data: ChatItem[] = await response.json();
          console.log('Chats obtenidos:', data); // Añadir log para verificar los datos obtenidos
          setChats(data);
        } else {
          console.error('Error: No se encontraron chats para el usuario actual.');
        }
      } catch (error) {
        console.error('Error al obtener los chats:', error);
      }
    };

    if (currentUserId) {
      fetchChats();
    }
  }, [currentUserId]);

  useEffect(() => {
    // Escuchar evento para notificar al usuario de un nuevo chat
    if (socket) {
      socket.on('new_chat_notification', (data: ChatItem) => {
        const { id, user1_id, user2_id, created_at } = data;
        if (user2_id === currentUserId || user1_id === currentUserId) {
          setChats((prevChats) => [
            ...prevChats,
            {
              id,
              user1_id,
              user2_id,
              created_at,
            },
          ]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_chat_notification');
      }
    };
  }, [currentUserId, socket]);

  // Función para abrir un chat seleccionado
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
          <Chat
            chatId={selectedChatId.toString()}
            currentUserId={currentUserId}
            socket={socket}
          />
        ) : (
          // Mostrar la lista de chats si no hay chat seleccionado
          <IonList>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <IonItem
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                >
                  <IonLabel>{`Chat con ID: ${chat.id}`}</IonLabel>
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
