import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { useHistory } from "react-router-dom"; // Importa useHistory para redirigir

const AddPet: React.FC = () => {
  const history = useHistory(); // Inicializa useHistory
  const [pets, setPets] = useState([{ nombre: "", tipo_mascota: "", foto: "", descripcion: "" }]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addNewPet = () => {
    setPets([...pets, { nombre: "", tipo_mascota: "", foto: "", descripcion: "" }]);
  };

  const handlePetChange = (index: number, field: string, value: string) => {
    const newPets = [...pets];
    newPets[index] = { ...newPets[index], [field]: value };
    setPets(newPets);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const id_owner = localStorage.getItem('id_owner');  // Obtener el id_owner del almacenamiento local
    
    if (!id_owner) {
       console.error('id_owner no encontrado en localStorage');
       setToastMessage("Error: No se encontró el ID del dueño.");
       setShowToast(true);
       return;
    }

    console.log("Datos enviados a /add-pet:", { pets, id_owner });

    try {
       const response = await fetch("http://localhost:5000/add-pet", {
          method: "POST",
          headers: {
             "Content-Type": "application/json",
          },
          body: JSON.stringify({ pets, id_owner }),  // Asegúrate de enviar el id_owner
       });

       if (!response.ok) {
          throw new Error("Error al guardar las mascotas.");
       }

       const result = await response.json();
       console.log("Respuesta del servidor:", result);
       setToastMessage("Mascotas guardadas exitosamente.");
       setShowToast(true);

       // Redirige a /home después de que las mascotas se hayan guardado correctamente
       history.push('/home');

    } catch (error) {
       console.error("Error al guardar las mascotas:", error);
       setToastMessage("Hubo un error al guardar las mascotas.");
       setShowToast(true);
    }
 };

  return (
    <IonPage>
      <IonContent style={styles.content}>
        <div style={styles.cardContainer}>
          <IonCard style={styles.card}>
            <IonCardHeader>
              <IonCardTitle>Añadir Mascotas</IonCardTitle>
            </IonCardHeader>
            <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
              {pets.map((pet, index) => (
                <div key={index} style={styles.petCard}>
                  <IonItem>
                    <IonLabel position="floating">Nombre de la Mascota</IonLabel>
                    <IonInput
                      type="text"
                      value={pet.nombre}
                      onIonChange={(e: any) => handlePetChange(index, "nombre", e.target.value)}
                      required
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel>Tipo de Mascota</IonLabel>
                    <IonSelect
                      value={pet.tipo_mascota}
                      onIonChange={(e: any) => handlePetChange(index, "tipo_mascota", e.detail.value)}
                      placeholder="Selecciona el tipo de mascota"
                    >
                      <IonSelectOption value="perro">Perro</IonSelectOption>
                      <IonSelectOption value="gato">Gato</IonSelectOption>
                      <IonSelectOption value="ave">Ave</IonSelectOption>
                      <IonSelectOption value="otros">Otros</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="floating">Foto URL (Opcional)</IonLabel>
                    <IonInput
                      type="text"
                      value={pet.foto}
                      onIonChange={(e: any) => handlePetChange(index, "foto", e.target.value)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="floating">Descripción</IonLabel>
                    <IonInput
                      type="text"
                      value={pet.descripcion}
                      onIonChange={(e: any) => handlePetChange(index, "descripcion", e.target.value)}
                    />
                  </IonItem>
                </div>
              ))}
              <IonButton
                onClick={addNewPet}
                expand="full"
                style={{ marginTop: "10px" }}
                color="secondary"
              >
                Añadir Otra Mascota
              </IonButton>
              <IonButton
                type="submit"
                expand="full"
                style={{ marginTop: "20px" }}
                color="primary"
              >
                Guardar Mascotas
              </IonButton>
            </form>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage || undefined}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

const styles = {
  content: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5dc', // Color crema
  },
  cardContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '20px',
  },
  card: {
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  petCard: {
    marginBottom: '20px',
  },
};

export default AddPet;
