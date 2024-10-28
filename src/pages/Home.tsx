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
  IonCardContent
} from '@ionic/react';
import { add } from 'ionicons/icons';
import AddCardForm from './AddCardForm';
import Chat from '../components/Chat';
import './Home.css';

interface HomeProps {
  onLogout: () => void;
  isAuthenticated: boolean;
}

// Definir la interfaz para la tarjeta
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
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

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
      owner_id: currentUserId
    };
    setCards([...cards, newCard]);
    setShowAddCardForm(false);
  };
  

  const openModal = (card: Card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  // Manejar la apertura del chat
  const handleOpenChat = (card: Card) => {
    if (card.owner_id !== currentUserId) {
      setChatId(card.owner_id);
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
              <IonCard
                key={card.id}
                className="custom-card"
                color={card.color}
                onClick={() => openModal(card)}
              >
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

        {/* Formulario para añadir tarjeta */}
        <IonModal isOpen={showAddCardForm} onDidDismiss={() => setShowAddCardForm(false)}>
          <AddCardForm onAddCard={handleAddCard} />
        </IonModal>

        {/* Modal para mostrar los detalles de una tarjeta */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedCard?.title}</IonTitle>
              <IonButton slot="end" onClick={() => setShowModal(false)}>Cerrar</IonButton>
            </IonToolbar>
          </IonHeader>
          {selectedCard && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{selectedCard.title}</IonCardTitle>
                <IonCardSubtitle>{selectedCard.subtitle}</IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <IonImg src={selectedCard.imageUrl} alt="Imagen de la tarjeta" />
                <p>{selectedCard.content}</p>
                {selectedCard.owner_id !== currentUserId && (
                  <IonButton onClick={() => handleOpenChat(selectedCard)}>Iniciar Chat</IonButton>
                )}
              </IonCardContent>
            </IonCard>
          )}
        </IonModal>

        {/* Mostrar el componente de chat si está habilitado */}
        {showChat && chatId && (
          <IonModal isOpen={showChat} onDidDismiss={() => setShowChat(false)}>
            <Chat chatId={chatId} currentUserId={currentUserId} />
          </IonModal>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;