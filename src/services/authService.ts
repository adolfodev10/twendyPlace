import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export const authService = {

  // 🔥 Buscar usuário atual
  getCurrentUser(): any {
    return auth.currentUser;
  },

  // 🔥 Buscar papel do usuário
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
   * Login do usuário
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Buscar dados adicionais do usuário
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      return {
        success: true,
        user: {
          ...userCredential.user,
          ...userData
        }
      };
    } catch (error: any) {
      console.error('Erro no login:', error);

      let message = 'Erro ao fazer login.';
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Esta conta foi desativada.';
      }

      return { success: false, error: message };
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
  }
};

export default authService;