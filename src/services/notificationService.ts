import toast from 'react-hot-toast';

class NotificationService {
    private audioContext: AudioContext | null = null;
    private isSoundEnabled = true;
    private isInitialized = false;

    constructor() {
        this.initAudioOnInteraction();
    }

    private initAudioOnInteraction() {
        const init = () => {
            if (!this.audioContext && !this.isInitialized) {
                try {
                    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    this.isInitialized = true;
                } catch (e) {
                    console.warn('AudioContext não suportado');
                }
            }
        };

        ['click', 'touchstart', 'keydown'].forEach(event => {
            document.addEventListener(event, init, { once: true });
        });

        if (document.readyState === 'complete') {
            init();
        }
    }

    private playSound(type: 'notification' | 'success' | 'error') {
        if (!this.isSoundEnabled) return;

        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.isInitialized = true;
            } catch (e) {
                return;
            }
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

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

        // Mostrar toast com o tipo correto
        switch (type) {
            case 'success':
                toast.success(message, toastOptions);
                break;
            case 'error':
                toast.error(message, toastOptions);
                break;
            case 'warning':
                // Usar toast customizado sem JSX (compatível)
                toast.custom(
                    (t) => {
                        // Criar elementos DOM manualmente
                        const container = document.createElement('div');
                        container.className = `${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-50 border border-yellow-200 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4`;

                        // Ícone
                        const iconSpan = document.createElement('span');
                        iconSpan.className = 'text-2xl';
                        iconSpan.textContent = '⚠️';
                        container.appendChild(iconSpan);

                        // Mensagem
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'flex-1';
                        const messageP = document.createElement('p');
                        messageP.className = 'text-sm font-medium text-yellow-800';
                        messageP.textContent = message;
                        messageDiv.appendChild(messageP);
                        container.appendChild(messageDiv);

                        // Botão fechar
                        const closeBtn = document.createElement('button');
                        closeBtn.className = 'text-yellow-500 hover:text-yellow-700';
                        closeBtn.textContent = '✕';
                        closeBtn.onclick = (e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                        };
                        container.appendChild(closeBtn);

                        // Click no container
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
        if (Notification.permission === 'denied') return;

        if (Notification.permission === 'default') {
            Notification.requestPermission();
            return;
        }

        try {
            const notification = new Notification('🛒 Twendy Create', ({
                body: message,
                icon: options?.icon || '/favicon.ico',
                // vibrate is not present on NotificationOptions in some TS lib versions
                // so cast to any to avoid type error while keeping runtime behavior
                vibrate: [200, 100, 200],
                silent: true,
            } as any));

            setTimeout(() => notification.close(), 8000);

            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options?.onClick) {
                    options.onClick();
                }
            };
        } catch (error) {
            // Silenciosamente falha
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
        this.playSound('notification');
        setTimeout(() => this.playSound('success'), 300);
        setTimeout(() => this.playSound('error'), 700);
    }
}

// Exportar instância única
export const notificationService = new NotificationService();

// Função helper para usar diretamente
export const showNotification = (
    message: string,
    options?: Parameters<typeof notificationService.showNotification>[1]
) => {
    notificationService.showNotification(message, options);
};

// Função para testar o som (pode ser chamada do console)
export const testNotificationSound = () => {
    notificationService.testSound();
};

// Adicionar ao final do arquivo, após a exportação

// Função global para testar o som (disponível no console)
(window as any).testNotificationSound = () => {
    ('🔊 Testando som de notificação...');
    notificationService.testSound();
};

(window as any).testNotification = () => {
    ('📢 Testando notificação...');
    notificationService.showNotification('🔔 Teste de notificação!', {
        type: 'success',
        icon: '✅',
        sound: true,
        duration: 5000,
        onClick: () => {
            alert('Notificação clicada!');
        }
    });
};

(window as any).toggleNotificationSound = () => {
    const current = notificationService.isSoundOn();
    notificationService.toggleSound(!current);
};

export default notificationService;