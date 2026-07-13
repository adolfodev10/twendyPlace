import toast from 'react-hot-toast';

class NotificationService {
  private audioContext: AudioContext | null = null;
  private isSoundEnabled = true;
  private isInitialized = false;
  private pendingSounds: Array<{type: 'notification' | 'success' | 'error'}> = [];
  private isMobile = false;

  constructor() {
    // Detectar se é mobile
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);
    
    this.setupUserInteraction();
  }

  private setupUserInteraction() {
    const init = () => {
      if (!this.audioContext && !this.isInitialized) {
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          this.isInitialized = true;
          
          // Tocar sons pendentes
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

    // Múltiplos eventos para garantir interação do usuário
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

    // Tentar inicializar imediatamente (pode funcionar em alguns navegadores)
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'running') {
        this.isInitialized = true;
      } else if (this.audioContext.state === 'suspended') {
        // No mobile, o AudioContext geralmente começa suspenso
        // Tenta resumir automaticamente (pode funcionar em alguns casos)
        if (!this.isMobile) {
          this.audioContext.resume().then(() => {
            this.isInitialized = true;
          }).catch(() => {});
        }
      }
    } catch (e) {
      // Ignorar erro, aguardar interação
    }
  }

  public ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.isInitialized = true;
        // Tocar sons pendentes
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

    // No mobile, tentar usar vibrate como fallback
    if (this.isMobile && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        // Ignorar erro de vibração
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
      
      // No mobile, usar tons mais altos e curtos
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
      
      // No mobile, aumentar o volume um pouco
      const maxVolume = this.isMobile ? 0.4 : 0.3;
      
      gainNode.gain.setValueAtTime(0.01, startTime);
      gainNode.gain.linearRampToValueAtTime(maxVolume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      // Ignorar erros de áudio
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
    // Se estiver desativando, parar sons pendentes
    if (!enabled) {
      this.pendingSounds = [];
    }
  }

  isSoundOn(): boolean {
    return this.isSoundEnabled;
  }

  testSound() {
    // Tentar garantir que o AudioContext está ativo
    this.ensureAudioContext();
    
    // No mobile, usar vibração como feedback
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