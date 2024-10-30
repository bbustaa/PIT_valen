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
  IonButton,
  IonModal,
} from '@ionic/react';
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
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ currentUserId, socket }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buzón de Mensajes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <IonItem key={chat.id} onClick={() => openChatModal(chat)}>
                <IonLabel>
                  <p>{`Chat con ${chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id}`}</p>
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
          <IonModal isOpen={showChatModal} onDidDismiss={closeChatModal}>
            <IonContent>
              <IonButton onClick={closeChatModal}>Cerrar Chat</IonButton>
              <Chat
                chatId={selectedChat.id.toString()}
                currentUserId={currentUserId}
                socket={socket}
                receiverId={selectedChat.user1_id === currentUserId ? selectedChat.user2_id : selectedChat.user1_id}
              />
            </IonContent>
          </IonModal>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MessagesInbox;
