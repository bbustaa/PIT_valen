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
import { signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from './firebaseConfig';
import { logoGoogle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    apellido1: string;
    apellido2: string;
    direccion: string;
  };
}

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
  
      // Verificamos que el email está disponible
      if (!user.email) {
        throw new Error('No se pudo obtener el correo electrónico de la cuenta de Google.');
      }
  
      // Creamos un objeto con la información obtenida de Google
      const userData = {
        email: user.email
      };
  
      // Enviamos esta información al servidor
      const response = await axios.post<LoginResponse>('http://localhost:5000/register-google', userData);
  
      // Si el usuario ya existe (409), redirigir a /home
      if (response.status === 200 || response.status === 409) {
        const { email, id, nombre, apellido1, apellido2, direccion } = response.data.user;
        // Almacenar en el LocalStorage
        // Validación de datos
        localStorage.setItem('userEmail', email || '');
        localStorage.setItem('id', id ? id.toString() : '');
        localStorage.setItem('nombre', nombre || '');
        localStorage.setItem('apellido1', apellido1 || '');
        localStorage.setItem('apellido2', apellido2 || '');
        localStorage.setItem('direccion', direccion || '');
        history.push('/home');
        window.location.reload();
      } else if (response.status === 201) {
        // Si es un nuevo usuario, redirigir a completar perfil
        localStorage.setItem('userEmail', response.data.user.email);
        history.push('/complete-profile');
        window.location.reload();
      }
  
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        // El usuario ya está registrado, tomamos la información del error para usar su email
        const { email, id, nombre, apellido1, apellido2, direccion } = error.response.data.user;
        // Validación de datos
        localStorage.setItem('userEmail', email || '');
        localStorage.setItem('id', id ? id.toString() : '');
        localStorage.setItem('nombre', nombre || '');
        localStorage.setItem('apellido1', apellido1 || '');
        localStorage.setItem('apellido2', apellido2 || '');
        localStorage.setItem('direccion', direccion || '');
        history.push('/home');
        window.location.reload();
      } else {
        console.error('Error al iniciar sesión con Google:', error);
        setToastMessage('Error al iniciar sesión con Google.');
        setShowToast(true);
      }
    }
  };
  

  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    console.log('Iniciando el proceso de login...'); // Verifica que esta línea aparezca en la consola

    try {
      const response = await axios.post<LoginResponse>('http://localhost:5000/login', { email, password });

        console.log('Respuesta recibida:', response.data); // Verificar que la respuesta llega correctamente
        if (response.data && response.data.user) {
            localStorage.setItem('userEmail', response.data.user.email);
            localStorage.setItem('id_owner', response.data.user.id.toString());
            localStorage.setItem('nombre', response.data.user.nombre);
            localStorage.setItem('apellido1', response.data.user.apellido1);
            localStorage.setItem('apellido2', response.data.user.apellido2);
            localStorage.setItem('direccion', response.data.user.direccion);
            history.push('/home');
            // Refrescar la página después de la redirección
             window.location.reload();
        }
    } catch (err) {
      const error = err as any; // Convertir `unknown` a `any`
      if (error.response && error.response.status === 404) {
        // Si el correo no existe, redirigir a /register
        history.push('/register');
        // Refrescar la página después de la redirección
        window.location.reload();
      } else if (error.response && error.response.status === 401) {
        // Si la contraseña es incorrecta
        setToastMessage('Contraseña incorrecta.');
        setShowToast(true);
      } else {
        setToastMessage('Error al iniciar sesión.');
        setShowToast(true);
      }
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
        <div style={styles.cardContainer}>
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

              {/* Formulario para iniciar sesión con email y contraseña */}
              <form onSubmit={loginWithEmail}>
                <IonItem>
                  <IonLabel position="floating">Correo Electrónico</IonLabel>
                  <IonInput type="email" value={email} onIonInput={(e: any) => setEmail(e.target.value)} required />
                </IonItem>
                <IonItem>
                  <IonLabel position="floating">Contraseña</IonLabel>
                  <IonInput type="password" value={password} onIonInput={(e: any) => setPassword(e.target.value)} required />
                </IonItem>

                <IonButton expand="full" type="submit" style={{ marginTop: '20px' }}>
                  Iniciar sesión
                </IonButton>
              </form>

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

export default Login;