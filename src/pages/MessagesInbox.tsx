import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonModal,
} from '@ionic/react';
import { exit } from 'ionicons/icons';
import Chat from '../components/Chat';

interface MessagesInboxProps {
  currentUserId: string;
  socket: any;
  onClose: () => void;
  setHasUnreadMessages: (hasUnread: boolean) => void;
}

interface ChatItem {
  id: number;
  user1_id: string;
  user2_id: string;
  created_at: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: boolean;
  card_title: string;
  has_unread?: number;
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ currentUserId, socket, onClose, setHasUnreadMessages }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentUserId) {
      // Unirse a una sala única para el usuario
      socket.emit('join_user_room', currentUserId);
      console.log(`Usuario ${currentUserId} se unió a la sala de usuario.`);

      // Fetch inicial de los chats
      fetchChats();

      // Manejar la recepción de nuevos mensajes
      socket.on('receive_message', (message: { chatId: number; content: string; sender_id: string; timestamp: string }) => {
        console.log('Mensaje recibido del socket:', message);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === message.chatId
              ? {
                  ...chat,
                  lastMessage: message.content,
                  lastMessageTime: message.timestamp,
                  unread: chat.id !== selectedChat?.id,
                }
              : chat
          )
        );
      });

      // Manejar actualización de mensajes no leídos
      socket.on('update_unread_status', (data: { chatId: number; receiver_id: string }) => {
        if (data.receiver_id === currentUserId) {
          console.log('Actualización de estado de mensajes no leídos recibida:', data);
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === data.chatId ? { ...chat, unread: true } : chat
            )
          );
          setHasUnreadMessages(true); // Actualizar el estado global de mensajes no leídos
        }
      });
      
      socket.on('messages_read', (data: { chatId: number; userId: string }) => {
        if (data.userId === currentUserId) {
          console.log('Marcando mensajes como leídos:', data);
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === data.chatId ? { ...chat, unread: false } : chat
            )
          );
          setHasUnreadMessages(false); // Actualizar el estado global de mensajes leídos
        }
      });
      

      return () => {
        // Salir de la sala del usuario al desmontar
        socket.emit('leave_user_room', currentUserId);
        socket.off('receive_message');
        socket.off('update_unread_status');
        socket.off('messages_read');
      };
    }
  }, [currentUserId, selectedChat, socket]);

  // Fetch de chats para obtener la lista actualizada
  const fetchChats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/chats/${currentUserId}`);
      if (response.ok) {
        const data: ChatItem[] = await response.json();
        const userChats = data.map((chat) => ({
          ...chat,
          unread: chat.has_unread === 1, // Convertir a booleano
        }));
        setChats(userChats);
      } else {
        console.error('Error: No se encontraron chats para el usuario actual.');
      }
    } catch (error) {
      console.error('Error al obtener los chats:', error);
    }
  };

  // Cuando el chat se abre, marcar como leído
  const openChatModal = (chat: ChatItem) => {
    setSelectedChat(chat);
    setShowChatModal(true);
    socket.emit('join_chat', { chatId: chat.id.toString(), userId: currentUserId });

    // Marcar como leído en el estado local
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === chat.id ? { ...c, unread: false } : c
      )
    );
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    if (selectedChat) {
      socket.emit('leave_chat', selectedChat.id.toString());
    }
    setSelectedChat(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buzón de Mensajes</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={exit} />
              Salir
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <IonItem key={chat.id} onClick={() => openChatModal(chat)}>
                <IonLabel>
                  <p style={{ fontWeight: chat.unread ? 'bold' : 'normal' }}>
                    {`Chat sobre: ${chat.card_title}`}
                  </p>
                  {chat.lastMessage && (
                    <>
                      <p className="last-message">{chat.lastMessage}</p>
                      {chat.lastMessageTime && (
                        <small>{new Date(chat.lastMessageTime).toLocaleTimeString()}</small>
                      )}
                    </>
                  )}
                </IonLabel>
                {chat.unread && (
                  <span className="unread-indicator"></span>
                )}
              </IonItem>
            ))
          ) : (
            <IonItem>
              <IonLabel>No tienes chats disponibles.</IonLabel>
            </IonItem>
          )}
        </IonList>

        {/* Modal para mostrar el chat */}
        {selectedChat && (
          <IonModal isOpen={showChatModal} onDidDismiss={closeChatModal}>
            <IonContent>
              <IonButton onClick={closeChatModal}>Cerrar Chat</IonButton>
              <Chat
                chatId={selectedChat.id.toString()}
                currentUserId={currentUserId}
                socket={socket}
                receiverId={selectedChat.user1_id === currentUserId ? selectedChat.user2_id : selectedChat.user1_id}
                onExit={closeChatModal}
              />
            </IonContent>
          </IonModal>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MessagesInbox;