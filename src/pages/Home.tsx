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
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonImg
} from '@ionic/react';
import { add } from 'ionicons/icons';
import AddCardForm from './AddCardForm';
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
      owner_id: localStorage.getItem('id') || ''
    };
    setCards([...cards, newCard]);
    setShowAddCardForm(false);
  };

  const openModal = (card: Card) => {
    setSelectedCard(card);
    setShowModal(true);
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
                <IonCardHeader>
                  <IonCardTitle>{card.title}</IonCardTitle>
                  <IonCardSubtitle>{card.subtitle}</IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>{card.content}</IonCardContent>
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
        {showAddCardForm && <AddCardForm onAddCard={handleAddCard} />}

        {/* Modal para mostrar los detalles de una tarjeta */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedCard?.title}</IonTitle>
              <IonButton slot="end" onClick={() => setShowModal(false)}>Cerrar</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{selectedCard?.title}</IonCardTitle>
              <IonCardSubtitle>{selectedCard?.subtitle}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonImg src={selectedCard?.imageUrl} alt="Imagen de la tarjeta" />
              <p>{selectedCard?.content}</p>
            </IonCardContent>
          </IonCard>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
