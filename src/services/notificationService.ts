import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from './firebase';

interface AdminNotification {
  orderId: string;
  orderNumber: string;
  message: string;
  type: 'new_order' | 'payment_proof' | 'status_change';
  status: string;
}


class NotificationService {
  private audioContext: AudioContext | null = null;
  private isSoundEnabled = true;
  private isInitialized = false;
  private pendingSounds: Array<{ type: 'notification' | 'success' | 'error' }> = [];
  private isMobile = false;

  async checkNotificationExists(orderId: string, type?: string): Promise<boolean> {
    try {
      const notificationsRef = collection(db, 'adminNotification');
      let q;

      if (type) {
        q = query(notificationsRef,
          where('orderId', '==', orderId),
          where('type', '==', type)
        );
      }
      else {
        q = query(
          notificationsRef,
          where('orderId', '==', orderId)
        );
      }
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    }
    catch (error) {
      console.error('Erro ao verificar notificação:', error);
      return false;
    }
  }


  constructor() {
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);

    this.setupUserInteraction();
  }

  private setupUserInteraction() {
    const init = () => {
      if (!this.audioContext && !this.isInitialized) {
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          this.isInitialized = true;

          if (this.pendingSounds.length > 0) {
            this.pendingSounds.forEach(sound => {
              this.playSound(sound.type);
            });
            this.pendingSounds = [];
          }
        } catch (e) {
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove', 'pointerdown'];
    const initOnce = () => {
      init();
      events.forEach(event => {
        document.removeEventListener(event, initOnce);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, initOnce, { once: true });
    });

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'running') {
        this.isInitialized = true;
      } else if (this.audioContext.state === 'suspended') {
        if (!this.isMobile) {
          this.audioContext.resume().then(() => {
            this.isInitialized = true;
          }).catch(() => { });
        }
      }
    } catch (e) {
    }
  }

  public ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.isInitialized = true;
        if (this.pendingSounds.length > 0) {
          this.pendingSounds.forEach(sound => {
            this.playSound(sound.type);
          });
          this.pendingSounds = [];
        }
      }).catch(() => {
      });
      return;
    }

    if (!this.audioContext || !this.isInitialized) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.isInitialized = true;
      } catch (e) {
      }
    }
  }

  private playSound(type: 'notification' | 'success' | 'error') {
    if (!this.isSoundEnabled) {
      return;
    }

    if (this.isMobile && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
      }
    }

    if (!this.audioContext || !this.isInitialized) {
      this.pendingSounds.push({ type });
      this.ensureAudioContext();
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.playSoundInternal(type);
      }).catch(() => {
        this.pendingSounds.push({ type });
      });
      return;
    }

    this.playSoundInternal(type);
  }

  private playSoundInternal(type: 'notification' | 'success' | 'error') {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;

      const isMobile = this.isMobile;

      switch (type) {
        case 'notification':
          this.playTone(isMobile ? 1000 : 800, isMobile ? 0.06 : 0.08, now);
          this.playTone(isMobile ? 1200 : 1000, isMobile ? 0.06 : 0.08, now + (isMobile ? 0.08 : 0.12));
          break;
        case 'success':
          this.playTone(isMobile ? 700 : 600, isMobile ? 0.08 : 0.1, now);
          this.playTone(isMobile ? 900 : 800, isMobile ? 0.08 : 0.1, now + (isMobile ? 0.08 : 0.1));
          this.playTone(isMobile ? 1100 : 1000, isMobile ? 0.12 : 0.15, now + (isMobile ? 0.16 : 0.2));
          break;
        case 'error':
          this.playTone(isMobile ? 500 : 400, isMobile ? 0.15 : 0.2, now);
          this.playTone(isMobile ? 400 : 300, isMobile ? 0.2 : 0.3, now + (isMobile ? 0.12 : 0.15));
          break;
        default:
          this.playTone(700, 0.15, now);
      }
    } catch (error) {
      console.debug('Erro ao tocar som:', error);
    }
  }

  private playTone(frequency: number, duration: number, startTime: number) {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      const maxVolume = this.isMobile ? 0.4 : 0.3;

      gainNode.gain.setValueAtTime(0.01, startTime);
      gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
    }
  }

  showNotification(
    message: string,
    options?: {
      type?: 'success' | 'error' | 'info' | 'warning';
      duration?: number;
      icon?: string;
      onClick?: () => void;
      sound?: boolean;
    }
  ) {
    const {
      type = 'info',
      duration = 6000,
      icon = '🔔',
      onClick,
      sound = true,
    } = options || {};

    if (sound) {
      const soundType = type === 'success' ? 'success' :
        type === 'error' ? 'error' : 'notification';
      this.playSound(soundType);
    }

    const toastOptions: any = {
      duration,
      icon,
      style: {
        minWidth: '300px',
        maxWidth: '450px',
        padding: '14px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        fontSize: '14px',
        fontWeight: '600',
        cursor: onClick ? 'pointer' : 'default',
      },
    };

    if (onClick) {
      toastOptions.onClick = onClick;
    }

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.custom(
          (t) => {
            const container = document.createElement('div');
            container.className = `${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-50 border border-yellow-200 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4`;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'text-2xl';
            iconSpan.textContent = '⚠️';
            container.appendChild(iconSpan);

            const messageDiv = document.createElement('div');
            messageDiv.className = 'flex-1';
            const messageP = document.createElement('p');
            messageP.className = 'text-sm font-medium text-yellow-800';
            messageP.textContent = message;
            messageDiv.appendChild(messageP);
            container.appendChild(messageDiv);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'text-yellow-500 hover:text-yellow-700';
            closeBtn.textContent = '✕';
            closeBtn.onclick = (e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            };
            container.appendChild(closeBtn);

            container.onclick = () => {
              toast.dismiss(t.id);
              if (onClick) onClick();
            };

            return container as any;
          },
          { duration }
        );
        break;
      default:
        toast(message, toastOptions);
    }

    this.sendBrowserNotification(message, { icon, onClick });
  }

  async saveAdminNotification(notification: AdminNotification) {
    try {
      const exists = await this.checkNotificationExists(
        notification.orderId,
        notification.type
      );

      if (exists) {
        return true;
      }

      const notifRef = doc(collection(db, 'adminNotifications'));
      await setDoc(notifRef, {
        ...notification,
        read: false,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar notificação admin:', error);
      return false;
    }
  }

  async getAdminNotifications(limitCount = 50) {
    try {
      const q = query(
        collection(db, 'adminNotifications'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const q = query(
        collection(db, 'adminNotifications'),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'adminNotifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  }

  async markAllAsRead(notificationIds: string[]) {
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      notificationIds.forEach(id => {
        const notifRef = doc(db, 'adminNotifications', id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }
  }

  async clearAll(notificationIds: string[]) {
    try {
      const { writeBatch, doc } = await import('firebase/firestore');
      const batch = writeBatch(db);

      notificationIds.forEach(id => {
        const notifRef = doc(db, 'adminNotifications', id);
        batch.delete(notifRef);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      return false;
    }
  }

  onAdminNotifications(callback: (notifications: any[]) => void) {
    const q = query(
      collection(db, 'adminNotifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(notifications);
    });
  }



  private sendBrowserNotification(message: string, options?: {
    icon?: string;
    onClick?: () => void;
  }) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') {
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.sendBrowserNotification(message, options);
        }
      });
      return;
    }

    try {
      const notification = new Notification('🛒 Twendy Create', {
        body: message,
        icon: options?.icon || '/favicon.ico',
        vibrate: [200, 100, 200],
        silent: true,
      } as any);

      setTimeout(() => notification.close(), 8000);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.onClick) {
          options.onClick();
        }
      };

    } catch (error) {
      console.debug('Erro ao enviar notificação:', error);
    }
  }


  toggleSound(enabled: boolean) {
    this.isSoundEnabled = enabled;
    if (!enabled) {
      this.pendingSounds = [];
    }
  }

  isSoundOn(): boolean {
    return this.isSoundEnabled;
  }

  testSound() {
    this.ensureAudioContext();

    if (this.isMobile && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }

    this.playSound('notification');
    setTimeout(() => {
      this.playSound('success');
    }, 300);
    setTimeout(() => {
      this.playSound('error');
    }, 700);
    setTimeout(() => {
      if (this.isMobile) {
        toast.success('📱 Modo mobile detectado - verifique o volume do dispositivo');
      }
    }, 1000);
  }
}

export const notificationService = new NotificationService();

export const testNotificationSound = () => {
  notificationService.testSound();
};

export const showNotification = (
  message: string,
  options?: Parameters<typeof notificationService.showNotification>[1]
) => {
  notificationService.showNotification(message, options);
};

export default notificationService;