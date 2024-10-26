import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonModal } from '@ionic/react';

interface AddCardFormProps {
  onAddCard: (title: string, subtitle: string, content: string, imageUrl: string) => void;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ onAddCard }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Obtener el id_owner desde el localStorage
  const owner_id = localStorage.getItem('id');

  // Añadir un console.log para verificar que id_owner está disponible
  console.log('ID del dueño obtenido desde localStorage:', owner_id);

  const handleAddCard = async () => {
    if (title && subtitle && content && imageUrl && owner_id) {
      try {
        console.log('Datos enviados al backend:', {
          title,
          subtitle,
          content,
          imageUrl,
          owner_id
        });

        const response = await fetch('http://localhost:5000/tarjetas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            subtitle,
            content,
            imageUrl,
            owner_id
          }),
        });

        if (!response.ok) {
          throw new Error('Error en la respuesta de la API');
        }

        const data = await response.json();
        if (data.id) {
          onAddCard(title, subtitle, content, imageUrl);
          setTitle('');
          setSubtitle('');
          setContent('');
          setImageUrl('');
          setIsOpen(false); // Cerrar el formulario después de agregar la tarjeta
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error al agregar tarjeta:', error);
      }
    } else {
      console.error('Todos los campos son requeridos');
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => setIsOpen(false)}>
      <IonItem>
        <IonLabel position="floating">Card Title</IonLabel>
        <IonInput value={title} onIonChange={e => setTitle(e.detail.value!)} />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Card Subtitle</IonLabel>
        <IonInput value={subtitle} onIonChange={e => setSubtitle(e.detail.value!)} />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Card Content</IonLabel>
        <IonInput value={content} onIonChange={e => setContent(e.detail.value!)} />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Image URL</IonLabel>
        <IonInput value={imageUrl} onIonChange={e => setImageUrl(e.detail.value!)} />
      </IonItem>
      <IonButton expand="full" onClick={handleAddCard}>Add Card</IonButton>
      <IonButton expand="full" color="medium" onClick={() => setIsOpen(false)}>Cancel</IonButton>
    </IonModal>
  );
};

export default AddCardForm;
