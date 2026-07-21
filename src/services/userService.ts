import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { db } from './firebase';
import { User } from '../types';

const auth = getAuth();

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);

      const users = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        const { uid: _uid, id: _id, ...userData } = data as Record<string, any>;
        return {
          id: doc.id,
          uid: doc.id,
          ...userData as Omit<User, 'id' | 'uid'>,
          name: userData.name || 'Sem nome',
          email: userData.email || '',
          role: userData.role || 'customer',
        };
      });

      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const snapshotData = snapshot.data();
        const { uid: _uid, id: _id, ...userData } = snapshotData as Record<string, any>;
        return {
          uid: snapshot.id,
          id: snapshot.id,
          ...userData as Omit<User, 'id' | 'uid'>,
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  },

  /**
   * Criar usuário no Firebase Auth + Firestore
   * A senha NÃO é salva no Firestore (apenas no Auth)
   */
  async createUser(data: {
    name: string;
    email: string;
    role: string;
    password: string;
    avatar?: string;
    sendEmail?: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // 1. Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const uid = userCredential.user.uid;

      // 2. Salvar dados do perfil no Firestore (SEM a senha!)
      await addDoc(collection(db, 'users'), {
        uid: uid,
        name: data.name,
        email: data.email,
        role: data.role || 'customer',
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=2563eb&color=fff&bold=true`,
        user_status: 'ACTIVO',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Enviar email de boas-vindas com a senha
      if (data.sendEmail && data.password) {
        await this.sendWelcomeEmail(data.email, data.name, data.password);
      }

      return { success: true, id: uid };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      // Traduzir erros comuns do Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Este email já está registrado' };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, error: 'Senha muito fraca (mínimo 6 caracteres)' };
      }
      
      return { success: false, error: error.message };
    }
  },

  async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      avatar?: string;
      user_status?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      await updateDoc(doc(db, 'users', id), updateData);
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'users', id));
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Redefinir senha - envia email de reset via Firebase Auth
   */
  async resetPassword(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getUserById(id);
      
      if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Enviar email de redefinição de senha (Firebase Auth)
      await sendPasswordResetEmail(auth, user.email);
      
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      return { success: false, error: error.message };
    }
  },

  async toggleUserStatus(
    id: string,
    status: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'users', id), {
        user_status: status,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Salvar email para envio (Firestore Trigger)
   * Ou usar Firebase Extensions: Trigger Email
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Opção 1: Salvar na coleção 'mail' (requer Firebase Extension Trigger Email)
      await addDoc(collection(db, 'mail'), {
        to: email,
        message: {
          subject: `Bem-vindo ao EKO - Suas credenciais de acesso`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #7c3aed;">🏭 EKO - Gestão de Bebidas</h2>
              </div>
              
              <h3>Bem-vindo, ${name}! 🎉</h3>
              
              <p>Sua conta foi criada com sucesso. Aqui estão suas credenciais de acesso:</p>
              
              <div style="background: #f8fafc; border: 2px solid #7c3aed; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>🔑 Senha:</strong> <code style="background: #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 16px; letter-spacing: 1px;">${password}</code></p>
              </div>
              
              <p style="color: #ef4444; font-size: 14px;">
                ⚠️ Por segurança, recomendamos alterar sua senha após o primeiro acesso.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/login" 
                   style="display: inline-block; padding: 14px 32px; background-color: #7c3aed; 
                          color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  Acessar o Sistema
                </a>
              </div>
              
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                EKO - Sistema de Gestão de Bebidas<br/>
                Este é um email automático, por favor não responda.
              </p>
            </div>
          `,
        },
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error: error.message };
    }
  },

  generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i = 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },
};

export default userService;