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
import Chat from '../components/Chat';
import MessagesInbox from './MessagesInbox';
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

  const handleAddCard = (title: string, subtitle: string, content: string, imageUrl: string) => {
    const newCard: Card = {
      id: Date.now(),
      title,
      subtitle,
      content,
      color: 'tertiary',
      imageUrl,
      owner_id: currentUserId,
    };
    setCards([...cards, newCard]);
    setShowAddCardForm(false);
  };

  const openCardModal = (card: Card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const handleOpenChat = (card: Card) => {
    if (card.owner_id !== currentUserId) {
      setChatId(card.id.toString()); // Utiliza `card.id` como `chatId`
      setReceiverId(card.owner_id); // Guardamos el receiverId para enviarlo al backend
      setShowChat(true);
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
