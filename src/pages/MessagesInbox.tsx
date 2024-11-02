import React, { useEffect, useState, useRef } from 'react';
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
import { exit } from 'ionicons/icons'; // Importar el ícono de salida
import Chat from '../components/Chat';

interface MessagesInboxProps {
  currentUserId: string;
  socket: any; // Socket instance
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
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ currentUserId, socket }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const messagesModalRef = useRef<HTMLIonModalElement | null>(null); // Ref para el modal

  useEffect(() => {
    // Fetch chats when the component mounts
    const fetchChats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/chats/${currentUserId}`);
        if (response.ok) {
          const data: ChatItem[] = await response.json();
          const userChats = data.filter(
            (chat) => chat.user1_id === currentUserId || chat.user2_id === currentUserId
          );
          setChats(userChats);
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
    // Socket listener to update chats with new messages
    const handleReceiveMessage = (message: { chatId: number; content: string; sender_id: string; timestamp: string }) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === message.chatId
            ? {
                ...chat,
                lastMessage: message.content,
                lastMessageTime: message.timestamp,
                unread: chat.id !== selectedChat?.id, // Mark as unread if not currently selected
              }
            : chat
        )
      );
    };

    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
    }

    return () => {
      if (socket) {
        socket.off('receive_message', handleReceiveMessage);
      }
    };
  }, [socket, selectedChat]);

  const openChatModal = (chat: ChatItem) => {
    setSelectedChat(chat);
    setShowChatModal(true);
    socket.emit('join_chat', chat.id.toString());
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    if (selectedChat) {
      socket.emit('leave_chat', selectedChat.id.toString());
    }
    setSelectedChat(null);
  };

  const closeMessagesModal = () => {
    if (messagesModalRef.current) {
      messagesModalRef.current.dismiss(); // Usar el ref para cerrar el modal explícitamente
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buzón de Mensajes</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={closeMessagesModal}>
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
                  <p>{`Chat sobre: ${chat.card_title}`}</p>
                  {chat.lastMessage && (
                    <>
                      <p className="last-message">{chat.lastMessage}</p>
                      {chat.lastMessageTime && (
                        <small>{new Date(chat.lastMessageTime).toLocaleTimeString()}</small>
                      )}
                    </>
                  )}
                </IonLabel>
                {chat.unread && <span className="unread-indicator">Nuevo</span>}
              </IonItem>
            ))
          ) : (
            <IonItem>
              <IonLabel>No tienes chats disponibles.</IonLabel>
            </IonItem>
          )}
        </IonList>

        {/* Modal to display the chat */}
        {selectedChat && (
          <IonModal ref={messagesModalRef} isOpen={showChatModal} onDidDismiss={closeChatModal}>
            <IonContent>
              <IonButton onClick={closeChatModal}>Cerrar Chat</IonButton>
              <Chat
                chatId={selectedChat.id.toString()}
                currentUserId={currentUserId}
                socket={socket}
                receiverId={selectedChat.user1_id === currentUserId ? selectedChat.user2_id : selectedChat.user1_id}
                onExit={closeChatModal} // Añadir la propiedad onExit
              />
            </IonContent>
          </IonModal>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MessagesInbox;
