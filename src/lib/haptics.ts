import * as Haptics from "expo-haptics";

// Envoltorios finos: si el dispositivo no soporta haptics (algunos Android),
// expo-haptics resuelve la promesa sin hacer nada, asi que no hace falta
// try/catch aqui.
export const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
export const hapticSelect = () => Haptics.selectionAsync();
export const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hapticError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
export const hapticWarning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
