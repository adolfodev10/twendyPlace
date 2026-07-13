import toast from 'react-hot-toast';

class NotificationService {
  private audioContext: AudioContext | null = null;
  private isSoundEnabled = true;
  private isInitialized = false;
  private pendingSounds: Array<{type: 'notification' | 'success' | 'error'}> = [];

  constructor() {
    // Não inicializar automaticamente - esperar interação do usuário
    this.setupUserInteraction();
  }

  private setupUserInteraction() {
    // Inicializar AudioContext apenas após interação do usuário
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
          console.warn('AudioContext não suportado');
        }
      }
    };

    // Tentar inicializar em vários eventos de interação
    const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    const initOnce = () => {
      init();
      // Remover listeners após inicializar
      events.forEach(event => {
        document.removeEventListener(event, initOnce);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, initOnce, { once: true });
    });

    // Se já houve interação, inicializar imediatamente
    if (document.readyState === 'complete') {
      // Verificar se já houve interação com a página
      try {
        // Tentar criar um AudioContext (pode ser bloqueado)
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (this.audioContext.state === 'running') {
          this.isInitialized = true;
        } else {
          // Se estiver suspenso, esperar interação
          }
      } catch (e) {
        // Ignorar erro, aguardar interação
      }
    }
  }

  // 🔥 FORÇAR INICIALIZAÇÃO (chamar no clique do usuário)
  public ensureAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      return;
    }

    if (!this.audioContext || !this.isInitialized) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.isInitialized = true;
      } catch (e) {
        console.warn('Não foi possível inicializar AudioContext');
      }
    }
  }

  private playSound(type: 'notification' | 'success' | 'error') {
    if (!this.isSoundEnabled) {
      return;
    }

    // Se não estiver inicializado, armazenar para tocar depois
    if (!this.audioContext || !this.isInitialized) {
      this.pendingSounds.push({ type });
      // Tentar inicializar
      this.ensureAudioContext();
      return;
    }

    // Se o AudioContext estiver suspenso, tentar resumir
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        // Tocar o som após resumir
        this.playSoundInternal(type);
      }).catch(() => {
        // Armazenar para tocar depois
        this.pendingSounds.push({ type });
      });
      return;
    }

    // Tocar o som imediatamente
    this.playSoundInternal(type);
  }

  private playSoundInternal(type: 'notification' | 'success' | 'error') {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      
      switch (type) {
        case 'notification':
          this.playTone(800, 0.08, now);
          this.playTone(1000, 0.08, now + 0.12);
          break;
        case 'success':
          this.playTone(600, 0.1, now);
          this.playTone(800, 0.1, now + 0.1);
          this.playTone(1000, 0.15, now + 0.2);
          break;
        case 'error':
          this.playTone(400, 0.2, now);
          this.playTone(300, 0.3, now + 0.15);
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
      
      gainNode.gain.setValueAtTime(0.01, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      // Ignorar erros de áudio
    }
  }

  /**
   * Mostrar notificação com som
   */
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

    // 🔥 GARANTIR QUE O AUDIO CONTEXT ESTÁ INICIALIZADO
    if (sound) {
      this.ensureAudioContext();
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

    // Mostrar toast com o tipo correto
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

    // Notificação do navegador
    this.sendBrowserNotification(message, { icon, onClick });
  }

  /**
   * Enviar notificação do navegador
   */
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

  /**
   * Ativar/desativar som
   */
  toggleSound(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  /**
   * Verificar se o som está ativado
   */
  isSoundOn(): boolean {
    return this.isSoundEnabled;
  }

  /**
   * Testar som (para debug)
   */
  testSound() {
    this.ensureAudioContext();
    this.playSound('notification');
    setTimeout(() => {
      this.playSound('success');
    }, 300);
    setTimeout(() => {
      this.playSound('error');
    }, 700);
    setTimeout(() => {
    }, 1000);
  }
}

// Exportar instância única
export const notificationService = new NotificationService();

// Funções para usar no console
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