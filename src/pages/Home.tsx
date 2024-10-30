import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonImg,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/react';
import { add, chatbubbles, paperPlane } from 'ionicons/icons';
import AddCardForm from './AddCardForm';
import MessagesInbox from './MessagesInbox';
import Chat from '../components/Chat';
import socket from './socket'; // Importar el socket desde el archivo socket.ts
import './Home.css';

interface HomeProps {
  onLogout: () => void;
  isAuthenticated: boolean;
}

interface Card {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  color: string;
  imageUrl: string;
  owner_id: string;
}

const Home: React.FC<HomeProps> = ({ onLogout, isAuthenticated }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [showMessagesInbox, setShowMessagesInbox] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null); // Para almacenar el ID del receptor del chat

  const currentUserId = localStorage.getItem('id') || '';

  // Cargar tarjetas desde la base de datos al iniciar
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('http://localhost:5000/tarjetas');
        const data = await response.json();
        setCards(data);
      } catch (error) {
        console.error('Error al cargar tarjetas:', error);
      }
    };
    fetchCards();
  }, []);

  const handleAddCard = async (title: string, subtitle: string, content: string, imageUrl: string) => {
    try {
      const newCard: Card = {
        id: Date.now(), // Generar un ID temporal
        title,
        subtitle,
        content,
        color: 'tertiary',
        imageUrl,
        owner_id: currentUserId,
      };

      // Enviar la tarjeta al backend
      const response = await fetch('http://localhost:5000/tarjetas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCard),
      });

      if (!response.ok) {
        throw new Error('No se pudo agregar la tarjeta');
      }

      // Añadir la tarjeta al estado local para actualizar la UI
      const data = await response.json();
      setCards((prevCards) => [...prevCards, data]);

      setShowAddCardForm(false);
    } catch (error) {
      console.error('Error al agregar tarjeta:', error);
    }
  };

  const openCardModal = (card: Card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const handleOpenChat = async (card: Card) => {  // <--- Añadir el tipo Card aquí
    if (card.owner_id !== currentUserId) {
      try {
        // Buscar si ya existe un chat con el owner de la tarjeta
        const response = await fetch(`http://localhost:5000/chats/find/${currentUserId}/${card.owner_id}`);
        const data = await response.json();
  
        if (data.chatId) {
          // Si ya existe un chat, usar ese chatId
          setChatId(data.chatId);
        } else {
          // Si no existe, creamos un nuevo chat en el backend
          const createChatResponse = await fetch(`http://localhost:5000/chats/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user1_id: currentUserId, user2_id: card.owner_id }),
          });
  
          const newChatData = await createChatResponse.json();
          setChatId(newChatData.chatId);
        }
        setReceiverId(card.owner_id); // Guardar el receiverId para enviar al backend
        setShowChat(true);
      } catch (error) {
        console.error('Error al abrir el chat:', error);
      }
    }
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
          {isAuthenticated && (
            <IonButtons slot="end">
              <IonButton onClick={onLogout}>Cerrar Sesión</IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Mostrando las tarjetas */}
        <div className="card-container">
          {cards.length > 0 ? (
            cards.map((card) => (
              <IonCard key={card.id} className="custom-card" color={card.color} onClick={() => openCardModal(card)}>
                <IonImg src={card.imageUrl} alt="Imagen de la tarjeta" />
                <IonCardHeader>
                  <IonCardTitle>{card.title}</IonCardTitle>
                </IonCardHeader>
              </IonCard>
            ))
          ) : (
            <p>No hay tarjetas disponibles</p>
          )}
        </div>

        {/* Botón flotante para añadir tarjeta */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowAddCardForm(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Botón flotante para abrir el buzón de mensajes */}
        <IonFab vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton color="primary" onClick={() => setShowMessagesInbox(true)}>
            <IonIcon icon={chatbubbles} />
          </IonFabButton>
        </IonFab>

        {/* Modal para añadir una tarjeta */}
        <IonModal isOpen={showAddCardForm} onDidDismiss={() => setShowAddCardForm(false)}>
          <IonContent>
            <AddCardForm onAddCard={handleAddCard} onClose={() => setShowAddCardForm(false)} />
          </IonContent>
        </IonModal>

        {/* Modal para mostrar el buzón de mensajes */}
        <IonModal isOpen={showMessagesInbox} onDidDismiss={() => setShowMessagesInbox(false)}>
          <IonContent>
            <MessagesInbox currentUserId={currentUserId} socket={socket} />
          </IonContent>
        </IonModal>

        {/* Modal para mostrar el contenido de una tarjeta */}
        <IonModal isOpen={showCardModal} onDidDismiss={() => setShowCardModal(false)}>
          <IonContent>
            {selectedCard && (
              <IonCard>
                <IonImg src={selectedCard.imageUrl} alt="Imagen de la tarjeta" />
                <IonCardHeader>
                  <IonCardTitle>{selectedCard.title}</IonCardTitle>
                  <IonCardSubtitle>{selectedCard.subtitle}</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>{selectedCard.content}</p>
                  {selectedCard.owner_id !== currentUserId && (
                    <IonButton expand="block" onClick={() => handleOpenChat(selectedCard)}>
                      <IonIcon icon={paperPlane} slot="start" />
                      Iniciar Chat
                    </IonButton>
                  )}
                </IonCardContent>
                <IonButton onClick={() => setShowCardModal(false)}>Cerrar</IonButton>
              </IonCard>
            )}
          </IonContent>
        </IonModal>

        {/* Modal para mostrar el chat */}
        {showChat && chatId && receiverId && (
          <IonModal isOpen={showChat} onDidDismiss={() => setShowChat(false)}>
            <IonContent>
              <Chat chatId={chatId} receiverId={receiverId} currentUserId={currentUserId} socket={socket} />
            </IonContent>
          </IonModal>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
