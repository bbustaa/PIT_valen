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
  lastMessage?: string; // Nuevo campo para mostrar el último mensaje
  lastMessageTime?: string; // Añadir la propiedad que causa el error
  unread?: boolean; // También añadir 'unread' ya que se usa más adelante
}

interface Message {
  id: number;
  chatId: string;
  sender_id: string;
  content: string;
  timestamp?: string;
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ currentUserId, socket }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);

  useEffect(() => {
    // Obtener los chats existentes cuando se monta el componente
    const fetchChats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chats/${currentUserId}`);
        if (response.ok) {
          const data: ChatItem[] = await response.json();
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
    const handleReceiveMessage = (message: Message) => {
      setChats((prevChats) => {
        const updatedChats = prevChats.map((chat) => {
          if (chat.id.toString() === message.chatId) {
            return {
              ...chat,
              lastMessage: message.content,
              lastMessageTime: message.timestamp, // Nueva propiedad para mostrar el tiempo
              unread: chat.id !== selectedChatId, // Si no es el chat abierto, marcar como no leído
            };
          }
          return chat;
        });
        return updatedChats;
      });
    };
  
    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
    }
  
    return () => {
      if (socket) {
        socket.off('receive_message', handleReceiveMessage);
      }
    };
  }, [socket, selectedChatId]);
  
  // Función para abrir un chat seleccionado
  const openChat = (chat: ChatItem) => {
    setSelectedChatId(chat.id);
    const receiver = chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;
    setReceiverId(receiver);
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
        {showChat && selectedChatId && receiverId ? (
          <Chat
            chatId={selectedChatId.toString()}
            currentUserId={currentUserId}
            socket={socket}
            receiverId={receiverId}
          />
        ) : (
          <IonList>
            {chats.length > 0 ? (
              chats.map((chat) => (
                <IonItem key={chat.id} onClick={() => openChat(chat)}>
                  <IonLabel>
                    <p>{`Chat con ${chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id}`}</p>
                    {chat.lastMessage && (
                      <>
                        <p className="last-message">{chat.lastMessage}</p>
                        {chat.lastMessageTime && <small>{new Date(chat.lastMessageTime).toLocaleTimeString()}</small>}
                      </>
                    )}
                  </IonLabel>
                  {chat.unread && <span className="unread-indicator">Nuevo</span>}  {/* Indicador de mensajes no leídos */}
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
