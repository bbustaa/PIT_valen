import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast,
  IonAlert
} from '@ionic/react';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from './firebaseConfig';
import { logoGoogle } from 'ionicons/icons'; 
import { useHistory } from 'react-router-dom'; 
import axios from 'axios'; // Usamos axios para hacer las peticiones al servidor

const Login: React.FC = () => {
  const history = useHistory(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Ahora guardamos el usuario en la base de datos usando una API (servidor Node.js)
      const userData = {
        email: user.email!,
        nombre: user.displayName || '',
        apellido1: '',
        apellido2: '',
        direccion: '',
        foto: user.photoURL || ''
      };
      
      // Hacemos la solicitud al servidor para guardar el usuario en MySQL
      await axios.post('http://localhost:5000/register-google', userData);
      
      history.push('/completar-perfil');
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      setToastMessage('Error al iniciar sesión con Google.');
      setShowToast(true);
    }
  };

  const loginWithEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Aquí puedes hacer una solicitud a tu API para confirmar la autenticación con tu base de datos MySQL
      await axios.post('http://localhost:5000/login', { email, password });

      history.push('/inicio');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setToastMessage('Error al iniciar sesión.');
      setShowToast(true);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setToastMessage('Por favor, introduce tu correo electrónico.');
      setShowToast(true);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setToastMessage('Se ha enviado un correo electrónico para restablecer la contraseña.');
      setShowToast(true);
      setShowResetPassword(false);
    } catch (error) {
      console.error('Error al enviar el correo de restablecimiento:', error);
      setToastMessage('Error al enviar el correo de restablecimiento.');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonContent style={styles.content}>
        <div style={styles.cardContainer}> {/* Contenedor para centrar la tarjeta */}
          <IonCard style={styles.card}>
            <IonCardHeader>
              <IonCardTitle>Iniciar Sesión</IonCardTitle>
            </IonCardHeader>
            <div style={{ padding: '20px' }}>
              <IonButton expand="full" onClick={loginWithGoogle}>
                <IonIcon slot="start" icon={logoGoogle}></IonIcon>
                Iniciar sesión con Google
              </IonButton>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>O</div>

              <IonItem>
                <IonLabel position="floating">Correo Electrónico</IonLabel>
                <IonInput type="email" value={email} onIonChange={(e: any) => setEmail(e.target.value)} />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Contraseña</IonLabel>
                <IonInput type="password" value={password} onIonChange={(e: any) => setPassword(e.target.value)} />
              </IonItem>

              <IonButton expand="full" onClick={loginWithEmail} style={{ marginTop: '20px' }}>
                Iniciar sesión
              </IonButton>

              <IonButton
                expand="full"
                onClick={() => setShowResetPassword(true)}
                style={{ marginTop: '10px' }}
                color="light"
              >
                ¿Olvidaste tu contraseña?
              </IonButton>

              <IonButton
                expand="full"
                routerLink="/register"
                style={{ marginTop: '20px' }}
                color="primary"
              >
                Registrarse
              </IonButton>
            </div>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />

        <IonAlert
          isOpen={showResetPassword}
          onDidDismiss={() => setShowResetPassword(false)}
          header="Restablecer Contraseña"
          subHeader="Introduce tu correo electrónico"
          inputs={[
            {
              name: 'email',
              type: 'email',
              placeholder: 'Correo Electrónico',
              value: email,
            },
          ]}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Enviar',
              handler: (input) => {
                if (input.email) {
                  setEmail(input.email);
                  resetPassword();
                }
              }
            }
          ]}
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
};

export default Login;
