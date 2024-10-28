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
import { add, chatbubbles } from 'ionicons/icons'; // Añadir icono para mensajería
import AddCardForm from './AddCardForm';
import Chat from '../components/Chat';
import MessagesInbox from './MessagesInbox';
import socket from './socket'; // Importar el socket desde el archivo socket.ts
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
  const [showMessagesInbox, setShowMessagesInbox] = useState(false);

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
              <IonCard key={card.id} className="custom-card" color={card.color}>
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

        {/* Modal para mostrar la lista de chats (buzón de mensajes) */}
        <IonModal isOpen={showMessagesInbox} onDidDismiss={() => setShowMessagesInbox(false)}>
          <MessagesInbox currentUserId={currentUserId} socket={socket} />
        </IonModal>

        {/* Formulario para añadir tarjeta */}
        <IonModal isOpen={showAddCardForm} onDidDismiss={() => setShowAddCardForm(false)}>
          <AddCardForm onAddCard={handleAddCard} />
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
