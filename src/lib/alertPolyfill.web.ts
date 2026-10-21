import { Alert, AlertButton } from 'react-native';
import { showAlert } from './alertStore';

// En react-native-web Alert.alert no hace nada, asi que los dialogos con botones
// (confirmaciones, errores) se perdian. Se reemplaza por un modal propio
// (AlertHost.web.tsx) en vez de alert/confirm del navegador, que muestran
// los botones en el idioma del sistema y se ven fuera de lugar.
Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
  showAlert({
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'Aceptar' }],
  });
};
