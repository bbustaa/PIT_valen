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
  IonToast
} from "@ionic/react";
import { useHistory } from 'react-router-dom';
import { auth } from './firebaseConfig'; // Asegúrate de importar 'auth'
import { createUserWithEmailAndPassword } from "firebase/auth";

const Register: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setShowToast(true);
      return;
    }

    try {
      // Utiliza Firebase para registrar al usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario registrado con Firebase:", userCredential.user);

      // Opcional: Guarda el email en localStorage o maneja el estado de autenticación como prefieras
      localStorage.setItem('userEmail', email);

      // Redirige a la página de perfil completo o cualquier otra página
      history.push('/complete-profile');
      window.location.reload();
    } catch (error) {
      console.error("Error al registrar con Firebase:", error);
      //setErrorMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonContent style={styles.content}>
        <div style={styles.cardContainer}>
          <IonCard style={styles.card}>
            <IonCardHeader>
              <IonCardTitle>Registrar Usuario</IonCardTitle>
            </IonCardHeader>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              {errorMessage && (
                <IonToast
                  isOpen={showToast}
                  onDidDismiss={() => setShowToast(false)}
                  message={errorMessage}
                  duration={2000}
                />
              )}
              <IonItem>
                <IonLabel position="floating">Correo Electrónico</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonChange={(e: any) => setEmail(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Contraseña</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={(e: any) => setPassword(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Repetir Contraseña</IonLabel>
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonChange={(e: any) => setConfirmPassword(e.target.value)}
                  required
                />
              </IonItem>
              <IonButton
                type="submit"
                expand="full"
                style={{ marginTop: "20px" }}
                color="primary"
              >
                Registrar
              </IonButton>
            </form>
          </IonCard>
        </div>
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
    backgroundColor: '#f5f5dc', 
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
};

export default Register;
