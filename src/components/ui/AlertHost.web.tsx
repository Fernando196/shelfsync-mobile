import { useEffect, useState } from 'react';
import { AlertButton, Modal, Text, View } from 'react-native';
import { AlertState, closeAlert, subscribeAlert } from '../../lib/alertStore';
import { ButtonVariant } from '../../const/styles.const';
import ButtonPill from './ButtonPill';

function variantFor(b: AlertButton): ButtonVariant {
  if (b.style === 'cancel') return 'secondary';
  if (b.style === 'destructive') return 'danger';
  return 'primary';
}

export default function AlertHost() {
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => subscribeAlert(setAlert), []);

  if (!alert) return null;

  const press = (b: AlertButton) => {
    closeAlert();
    b.onPress?.();
  };

  // Con 2 botones van lado a lado (como el Alert nativo); con mas, apilados.
  const row = alert.buttons.length === 2;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => {
      const cancel = alert.buttons.find((b) => b.style === 'cancel');
      if (cancel) press(cancel);
    }}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5">
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">{alert.title}</Text>
          {!!alert.message && (
            <Text className="text-base text-slate-600 dark:text-slate-300 mt-2">{alert.message}</Text>
          )}
          <View className={`mt-4 ${row ? 'flex-row gap-3' : ''}`}>
            {alert.buttons.map((b, i) => (
              <View key={i} className={row ? 'flex-1' : ''}>
                <ButtonPill
                  label={b.text ?? 'Aceptar'}
                  variant={variantFor(b)}
                  onPress={() => press(b)}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
