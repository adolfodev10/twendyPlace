import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  FileImage,
  Upload,
  X,
  AlertCircle,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [, setShowReplaceConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId || !user) return;

      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));

        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

          // Verificar se o pedido pertence ao usuário
          if (orderData.userId !== user.uid && orderData.userId !== user.uid) {
            toast.error('Pedido não encontrado');
            navigate('/my-orders');
            return;
          }

          setOrder(orderData);
        } else {
          toast.error('Pedido não encontrado');
          navigate('/my-orders');
        }
      } catch (error) {
        console.error('Erro ao carregar pedido:', error);
        toast.error('Erro ao carregar pedido');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, user, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use JPG, PNG, GIF, WebP ou PDF.');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo de 10MB.');
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !order || !user || !orderId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Nome do arquivo com timestamp para evitar cache
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `comprovativos/${orderId}/${timestamp}.${fileExtension}`;

      const storageRef = ref(storage, fileName);

      // Upload com progresso
      const uploadTask = uploadBytes(storageRef, selectedFile);

      // Simular progresso (uploadBytes não tem on progress nativamente)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Obter URL do arquivo
      const downloadURL = await getDownloadURL(storageRef);

      // Atualizar pedido no Firestore
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentProof: downloadURL,
        paymentProofUpdatedAt: serverTimestamp(),
        paymentProofHistory: arrayUnion({
          url: downloadURL,
          uploadedAt: new Date().toISOString(),
          fileName: selectedFile.name,
          replaced: !!order.paymentProof,
        }),
        updatedAt: serverTimestamp(),
      });

      // Atualizar estado local
      setOrder({
        ...order,
        paymentProof: downloadURL,
      });

      // Notificar admin sobre o comprovativo
      await notificationService.saveAdminNotification({
        orderId: order.id,
        orderNumber: order.orderNumber || order.id.slice(-8),
        message: order.paymentProof
          ? `Comprovativo ATUALIZADO para o pedido #${order.orderNumber || order.id.slice(-8)}`
          : `Novo comprovativo enviado para o pedido #${order.orderNumber || order.id.slice(-8)}`,
        type: 'payment_proof',
        status: order.status,
      });

      toast.success(
        order.paymentProof
          ? 'Comprovativo atualizado com sucesso!'
          : 'Comprovativo enviado com sucesso!',
        { duration: 5000 }
      );

      // Limpar estado
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowReplaceConfirm(false);

    } catch (error: any) {
      console.error('Erro ao enviar comprovativo:', error);

      if (error.code === 'storage/unauthorized') {
        toast.error('Sem permissão para enviar arquivo');
      } else if (error.code === 'storage/canceled') {
        toast.error('Upload cancelado');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        toast.error('Falha no upload. Verifique sua conexão.');
      } else {
        toast.error('Erro ao enviar comprovativo. Tente novamente.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      awaiting_payment: Clock,
      paid: CheckCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    };
    const Icon = iconMap[status] || Package;
    const colorMap: Record<string, string> = {
      awaiting_payment: 'text-yellow-500',
      paid: 'text-blue-500',
      processing: 'text-purple-500',
      shipped: 'text-cyan-500',
      delivered: 'text-green-500',
      cancelled: 'text-red-500',
    };
    return <Icon className={`h-6 w-6 ${colorMap[status] || 'text-gray-500'}`} />;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      awaiting_payment: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paid: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-purple-100 text-purple-700 border-purple-200',
      shipped: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      awaiting_payment: 'Aguardando Pagamento',
      paid: 'Pago',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labelMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Pedido não encontrado</p>
        </div>
      </div>
    );
  }

  const canUploadProof = order.status === 'awaiting_payment';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/my-orders"
              className="text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para meus pedidos
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Pedido #{order.orderNumber}
            </h1>
          </div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Status do Pedido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status do Pedido</h2>

          {/* Timeline de Status */}
          <div className="space-y-4">
            {['awaiting_payment', 'paid', 'processing', 'shipped', 'delivered'].map((status) => {
              const statusOrder = ['awaiting_payment', 'paid', 'processing', 'shipped', 'delivered'];
              const currentIndex = statusOrder.indexOf(order.status);
              const statusIndex = statusOrder.indexOf(status);
              const isCompleted = currentIndex !== -1 && statusIndex <= currentIndex;
              const isCurrent = order.status === status;

              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <span className={`text-sm ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload/Visualização de Comprovativo */}
        {canUploadProof && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileImage className="h-5 w-5 text-primary-600" />
              {order.paymentProof ? 'Atualizar Comprovativo' : 'Enviar Comprovativo de Pagamento'}
            </h2>

            {order.paymentProof && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Você já enviou um comprovativo. Pode substituí-lo se necessário.
                </p>
              </div>
            )}

            {/* Preview do arquivo selecionado */}
            {previewUrl && (
              <div className="mb-4 relative">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '300px' }}>
                  {selectedFile?.type === 'application/pdf' ? (
                    <div className="p-8 text-center">
                      <FileImage className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview do comprovativo"
                      className="w-full h-full object-contain"
                    />
                  )}
                  <button
                    onClick={clearFileSelection}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Comprovativo atual */}
            {order.paymentProof && !previewUrl && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Comprovativo atual:</p>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '200px' }}>
                  {order.paymentProof.match(/\.(pdf)$/i) ? (
                    <div className="p-8 text-center">
                      <FileImage className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                      <a
                        href={order.paymentProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Ver PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={order.paymentProof}
                      alt="Comprovativo atual"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Barra de progresso */}
            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">{uploadProgress}%</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {order.paymentProof ? 'Escolher novo arquivo' : 'Escolher arquivo'}
              </button>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {order.paymentProof ? 'Atualizar Comprovativo' : 'Enviar Comprovativo'}
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Formatos aceitos: JPG, PNG, GIF, WebP, PDF. Tamanho máximo: 10MB.
            </p>
          </div>
        )}

        {/* Comprovativo enviado (não pode alterar) */}
        {order.paymentProof && !canUploadProof && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileImage className="h-5 w-5 text-green-600" />
              Comprovativo de Pagamento
            </h2>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
              {order.paymentProof.match(/\.(pdf)$/i) ? (
                <div className="p-12 text-center">
                  <FileImage className="h-20 w-20 mx-auto text-gray-400 mb-4" />
                  <a
                    href={order.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Baixar PDF
                  </a>
                </div>
              ) : (
                <>
                  <img
                    src={order.paymentProof}
                    alt="Comprovativo de pagamento"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <a
                      href={order.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                      title="Ver em tela cheia"
                    >
                      <Eye className="h-4 w-4 text-gray-700" />
                    </a>
                    <a
                      href={order.paymentProof}
                      download
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                      title="Baixar"
                    >
                      <Download className="h-4 w-4 text-gray-700" />
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Detalhes do Pedido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Qtd: {item.qty} x Kz {item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  Kz {(item.qty * item.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary-600">Kz {order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Informações de Entrega */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Entrega</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{order.customer?.address || 'Endereço não informado'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Pedido realizado em{' '}
                {(order?.createdAt as { toDate?: () => Date })?.toDate
                  ? (order?.createdAt as Date)?.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : order?.createdAt
                    ? new Date(order.createdAt.getDate() * 1000).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : typeof order?.createdAt === 'string'
                      ? new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : order?.createdAt instanceof Date
                        ? order.createdAt.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Data não disponível'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4" />
              <span>Pagamento: {order.paymentProof ? 'Comprovativo enviado' : 'Aguardando comprovativo'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;