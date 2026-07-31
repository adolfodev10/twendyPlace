import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  query, 
  collection, 
  getDocs, 
  where,
  updateDoc,
} from 'firebase/firestore';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
  isLocked?: boolean;
  remainingMinutes?: number;
  remainingAttempts?: number;
}

interface LockStatus {
  isLocked: boolean;
  remainingMinutes?: number;
  attempts?: number;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export const authService = {

  getCurrentUser(): any {
    return auth.currentUser;
  },

  async getUserRole(uid: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.role || 'customer';
      }
      return 'customer';
    } catch (error) {
      console.error('Erro ao buscar papel do usuário:', error);
      return 'customer';
    }
  },

  /**
   * Verificar status de bloqueio da conta
   */
  async checkLockStatus(email: string): Promise<LockStatus> {
    try {
      const lockDoc = await getDoc(doc(db, 'loginAttempts', email.toLowerCase()));
      
      if (!lockDoc.exists()) {
        return { isLocked: false, attempts: 0 };
      }

      const lockData = lockDoc.data();
      const lockoutUntil = lockData.lockoutUntil?.toDate();

      // Verificar se está bloqueado
      if (lockoutUntil && lockoutUntil > new Date()) {
        const remainingMs = lockoutUntil.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return { 
          isLocked: true, 
          remainingMinutes,
          attempts: lockData.attempts || 0
        };
      }

      // Se o período de bloqueio expirou, limpar o documento
      if (lockoutUntil && lockoutUntil <= new Date()) {
        await updateDoc(doc(db, 'loginAttempts', email.toLowerCase()), {
          attempts: 0,
          lockoutUntil: null,
          lastAttempt: serverTimestamp()
        });
        return { isLocked: false, attempts: 0 };
      }

      return { 
        isLocked: false, 
        attempts: lockData.attempts || 0
      };
    } catch (error) {
      console.error('Erro ao verificar status de bloqueio:', error);
      return { isLocked: false, attempts: 0 };
    }
  },

  /**
   * Registrar um novo usuário
   */
  async register(data: RegisterData): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const { user } = userCredential;

      // Atualizar perfil com nome
      await updateProfile(user, {
        displayName: data.name,
      });

      // Salvar dados do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        postalCode: data.postalCode || '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=2563eb&color=fff&bold=true`,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, user };
    } catch (error: any) {
      console.error('Erro no registro:', error);

      let message = 'Erro ao criar conta.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este email já está em uso.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'O email fornecido é inválido.';
      }

      return { success: false, error: message };
    }
  },

  /**
   * Login do usuário com controle de tentativas e bloqueio
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Verificar se a conta está bloqueada
      const lockStatus = await this.checkLockStatus(normalizedEmail);
      
      if (lockStatus.isLocked) {
        return {
          success: false,
          isLocked: true,
          remainingMinutes: lockStatus.remainingMinutes,
          error: `Conta temporariamente bloqueada. Aguarde ${lockStatus.remainingMinutes} minutos.`,
          remainingAttempts: 0
        };
      }

      // Tentar fazer login
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = userCredential.user.uid;

      // Resetar tentativas de login após sucesso
      await setDoc(doc(db, 'loginAttempts', normalizedEmail), {
        attempts: 0,
        lastAttempt: serverTimestamp(),
        lockoutUntil: null,
        lastSuccessfulLogin: serverTimestamp()
      }, { merge: true });

      // Buscar dados adicionais do usuário
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          success: true,
          user: {
            uid,
            email: userCredential.user.email || normalizedEmail,
            role: userData.role || 'customer',
            name: userData.name || '',
          },
        };
      }

      // Buscar por UID caso não encontre pelo ID do documento
      const q = query(collection(db, 'users'), where('uid', '==', uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return {
          success: true,
          user: {
            uid: uid,
            email: userCredential.user.email || normalizedEmail,
            role: userData.role || 'customer',
            name: userData.name || '',
          },
        };
      }

      return {
        success: true,
        user: {
          uid,
          email: userCredential.user.email || normalizedEmail,
          role: 'customer',
          name: userCredential.user.displayName || '',
        },
      };
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // Buscar documento de tentativas
      const attemptsDoc = await getDoc(doc(db, 'loginAttempts', normalizedEmail));
      let attempts = 1;
      
      if (attemptsDoc.exists()) {
        attempts = (attemptsDoc.data().attempts || 0) + 1;
      }
      
      // Verificar se deve bloquear a conta
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = new Date();
        lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
        
        await setDoc(doc(db, 'loginAttempts', normalizedEmail), {
          attempts,
          lastAttempt: serverTimestamp(),
          lockoutUntil,
          lastFailedAttempt: serverTimestamp()
        }, { merge: true });
        
        return {
          success: false,
          isLocked: true,
          remainingMinutes: LOCKOUT_DURATION_MINUTES,
          error: 'Conta bloqueada devido a muitas tentativas. Aguarde 15 minutos.',
          remainingAttempts: 0
        };
      }
      
      // Atualizar tentativas
      await setDoc(doc(db, 'loginAttempts', normalizedEmail), {
        attempts,
        lastAttempt: serverTimestamp(),
        lockoutUntil: null,
        lastFailedAttempt: serverTimestamp()
      }, { merge: true });
      
      // Mapear erros do Firebase
      let message = 'Erro ao fazer login.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          message = 'Senha incorreta.';
          break;
        case 'auth/invalid-credential':
          message = 'Credenciais inválidas.';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido.';
          break;
        case 'auth/user-disabled':
          message = 'Esta conta foi desativada.';
          break;
        case 'auth/too-many-requests':
          message = 'Muitas tentativas. Aguarde alguns minutos.';
          break;
      }
      
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
      
      return { 
        success: false, 
        error: message,
        remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
      };
    }
  },

  /**
   * Logout do usuário
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Erro no logout:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Resetar senha
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Erro no reset de senha:', error);

      let message = 'Erro ao enviar email de recuperação.';
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      }

      return { success: false, error: message };
    }
  },

  /**
   * Buscar dados do usuário
   */
  async getUserData(uid: string): Promise<any> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  },

  /**
   * Verificar se o usuário é admin
   */
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      return false;
    }
  },

  /**
   * Limpar tentativas de login manualmente (para admin)
   */
  async clearLoginAttempts(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await setDoc(doc(db, 'loginAttempts', normalizedEmail), {
        attempts: 0,
        lastAttempt: serverTimestamp(),
        lockoutUntil: null
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Erro ao limpar tentativas de login:', error);
      return false;
    }
  }
};

export default authService;