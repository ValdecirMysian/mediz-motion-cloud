"use client";

import { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { VideoMotion } from '../../remotion/VideoMotion';
import AssetPicker from '../../components/AssetPicker';

// ============================================================================
// TIPOS
// ============================================================================

interface Template {
  id: string;
  nome: string;
  thumbnail: string;
  videoFundo: string;
  duracao: number;
  fps: number;
  camadas: any[];
}

interface DadosProduto {
  imagem: string;
  nome: string;
  preco: string;
  ajuste: 'cover' | 'contain' | 'fill';
}

// ============================================================================
// TEMPLATES DISPONÍVEIS (depois vem do banco)
// ============================================================================

const TEMPLATES: Template[] = [
  {
    id: 'oferta-dia',
    nome: 'Oferta do Dia',
    thumbnail: '/thumbnails/oferta-dia.jpg',
    videoFundo: '', // Seu vídeo do After Effects
    duracao: 15,
    fps: 30,
    camadas: [
      {
        id: 'produto-1',
        tipo: 'produto-preco',
        nome: 'Produto 1',
        inicio: 0,
        fim: 5,
        posicao: { x: 50, y: 40 },
        tamanho: { width: 400, height: 500 },
        animacaoEntrada: { tipo: 'slide-right', duracao: 0.5 },
        animacaoSaida: { tipo: 'fade-out', duracao: 0.3 },
        estilos: { fontSize: 60, fontWeight: 'bold', color: '#FFD700' },
      },
      {
        id: 'produto-2',
        tipo: 'produto-preco',
        nome: 'Produto 2',
        inicio: 5,
        fim: 10,
        posicao: { x: 50, y: 40 },
        tamanho: { width: 400, height: 500 },
        animacaoEntrada: { tipo: 'zoom-explosion', duracao: 0.6 },
        animacaoSaida: { tipo: 'slide-out-left', duracao: 0.4 },
        estilos: { fontSize: 60, fontWeight: 'bold', color: '#FFD700' },
      },
      {
        id: 'produto-3',
        tipo: 'produto-preco',
        nome: 'Produto 3',
        inicio: 10,
        fim: 15,
        posicao: { x: 50, y: 40 },
        tamanho: { width: 400, height: 500 },
        animacaoEntrada: { tipo: 'bounce', duracao: 0.7 },
        animacaoSaida: { tipo: 'fade-out', duracao: 0.3 },
        estilos: { fontSize: 60, fontWeight: 'bold', color: '#FFD700' },
      },
      {
        id: 'whatsapp',
        tipo: 'whatsapp',
        nome: 'WhatsApp',
        inicio: 2,
        fim: 15,
        posicao: { x: 50, y: 90 },
        tamanho: { width: 400, height: 60 },
        animacaoEntrada: { tipo: 'slide-down', duracao: 0.5 },
        estilos: { fontSize: 40, color: '#25D366', backgroundColor: 'rgba(0,0,0,0.6)' },
      },
    ],
  },
  // Você pode adicionar mais templates aqui
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const REMBG_URL = '/api/remove-bg';

export default function CriarVideo() {
  const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null);
  const [templatesDisponiveis, setTemplatesDisponiveis] = useState<Template[]>([]);
  const [produtos, setProdutos] = useState<DadosProduto[]>([
    { imagem: '', nome: '', preco: '', ajuste: 'contain' },
    { imagem: '', nome: '', preco: '', ajuste: 'contain' },
    { imagem: '', nome: '', preco: '', ajuste: 'contain' },
  ]);
  const [whatsapp, setWhatsapp] = useState('');
  // Estado dinâmico para armazenar valores de camadas de texto livre e localização
  // Chave = id da camada, Valor = texto digitado
  const [textosExtras, setTextosExtras] = useState<Record<string, string>>({});
  
  const [etapa, setEtapa] = useState<'template' | 'dados'>('template');
  
  // Configurações
  const [removerFundo, setRemoverFundo] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Asset Picker State
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);

  // Carrega templates do localStorage ao montar
  useEffect(() => {
    const carregarTemplates = async () => {
      try {
        const response = await fetch('/api/templates/list');
        const data = await response.json();
        
        if (data.templates && data.templates.length > 0) {
          setTemplatesDisponiveis(data.templates);
          console.log(`📦 ${data.templates.length} templates carregados do servidor`);
        } else {
          setTemplatesDisponiveis(TEMPLATES);
          console.log('📦 Usando templates padrão');
        }
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
        setTemplatesDisponiveis(TEMPLATES);
      }
    };
    
    carregarTemplates();
  }, []);

  // ========================================================================
  // FUNÇÕES
  // ========================================================================

  const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const uploadImageToS3 = async (base64: string): Promise<string> => {
    if (!base64 || !base64.startsWith('data:')) return base64; // Já é URL ou vazio

    const blob = base64ToBlob(base64);
    const ext = blob.type.split('/')[1] || 'png';
    const filename = `render-asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;

    // 1. Obter URL pré-assinada
    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, contentType: blob.type }),
    });

    if (!res.ok) throw new Error('Falha ao obter permissão de upload');
    const { uploadUrl, publicUrl } = await res.json();

    // 2. Fazer Upload para o S3
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': blob.type },
    });

    if (!uploadRes.ok) throw new Error('Falha no upload da imagem para a nuvem');

    return publicUrl;
  };

  const handleAssetSelect = (url: string) => {
    if (currentProductIndex !== null) {
      const novosProdutos = [...produtos];
      novosProdutos[currentProductIndex].imagem = url;
      setProdutos(novosProdutos);
      setShowAssetPicker(false);
      setCurrentProductIndex(null);
    }
  };

  const handleUploadImagem = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Se a remoção de fundo estiver ativa (global ou específica para este produto, se tivéssemos essa granulosidade)
    // No momento, usamos o estado global 'removerFundo' que é controlado pelos checkboxes em cada card
    // (todos os checkboxes controlam o mesmo estado global por enquanto, para simplificar)
    if (removerFundo) {
      // Adiciona ao estado de processamento
      setProcessingIds(prev => [...prev, index]);
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(REMBG_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Falha na remoção de fundo');

        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (evento) => {
          const novosProdutos = [...produtos];
          novosProdutos[index].imagem = evento.target?.result as string;
          setProdutos(novosProdutos);
          setProcessingIds(prev => prev.filter(id => id !== index)); // Remove do loading
        };
        reader.readAsDataURL(blob);

      } catch (error) {
        console.error('Erro no remove.bg:', error);
        alert('Falha ao remover fundo. Usando imagem original.');
        
        // Fallback: usa imagem original
        const reader = new FileReader();
        reader.onload = (evento) => {
          const novosProdutos = [...produtos];
          novosProdutos[index].imagem = evento.target?.result as string;
          setProdutos(novosProdutos);
          setProcessingIds(prev => prev.filter(id => id !== index));
        };
        reader.readAsDataURL(file);
      }
    } else {
      // Comportamento padrão (sem remover fundo)
      const reader = new FileReader();
      reader.onload = (evento) => {
        const novosProdutos = [...produtos];
        novosProdutos[index].imagem = evento.target?.result as string;
        setProdutos(novosProdutos);
      };
      reader.readAsDataURL(file);
    }
  };

  const atualizarProduto = (index: number, campo: 'nome' | 'preco' | 'ajuste', valor: string) => {
    const novosProdutos = [...produtos];
    novosProdutos[index] = {
      ...novosProdutos[index],
      [campo]: valor
    };
    setProdutos(novosProdutos);
  };

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const gerarVideo = async () => {
    setIsRendering(true);
    setVideoUrl(null);
    setProgress(0);
    setStatusMessage('Iniciando...');

    try {
      // 1. Processar uploads de imagens no CLIENTE para evitar erro 413
      setStatusMessage('Otimizando imagens para a nuvem...');
      
      // Cria uma cópia dos produtos com as URLs do S3
      const produtosProcessados = await Promise.all(produtos.map(async (p, index) => {
        if (p.imagem && p.imagem.startsWith('data:')) {
          try {
            setStatusMessage(`Enviando imagem do Produto ${index + 1}...`);
            const s3Url = await uploadImageToS3(p.imagem);
            return { ...p, imagem: s3Url };
          } catch (err) {
            console.error(`Erro ao enviar imagem ${index + 1}:`, err);
            throw new Error(`Falha ao enviar imagem do produto ${index + 1}. Tente uma imagem menor.`);
          }
        }
        return p;
      }));

      // 2. Iniciar Renderização (Agora o payload é leve, só URLs)
      setStatusMessage('Iniciando renderização...');
      
      const payload = {
        template: templateSelecionado,
        dados: { 
          produtos: produtosProcessados, 
          whatsapp, 
          textos: textosExtras 
        }
      };

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Payload muito grande mesmo após otimização. Contate o suporte.');
        }
        const data = await response.json();
        // Mostra detalhes se houver, para facilitar debug (ex: erro da Lambda)
        throw new Error(data.details || data.error || `Erro na API (${response.status})`);
      }

      const data = await response.json();
      
      const { renderId, bucketName } = data;
      setStatusMessage('Renderizando na AWS Lambda...');

      // 2. Polling de Status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch('/api/render/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ renderId, bucketName })
          });
          
          const statusData = await statusRes.json();

          if (statusData.type === 'error') {
            clearInterval(pollInterval);
            throw new Error(statusData.message);
          }

          if (statusData.type === 'done') {
            clearInterval(pollInterval);
            setVideoUrl(statusData.url);
            setStatusMessage('Concluído!');
            setIsRendering(false);
          } else if (statusData.type === 'progress') {
            const p = Math.round(statusData.progress * 100);
            setProgress(p);
            setStatusMessage(`Renderizando: ${p}%`);
          }
        } catch (err) {
          console.error('Polling error:', err);
          // Não para o polling por erro de rede temporário, mas idealmente teria limite de tentativas
        }
      }, 2000);

    } catch (error: any) {
      console.error('Erro na renderização:', error);
      alert(`Falha ao gerar o vídeo: ${error.message}`);
      setIsRendering(false);
    }
  };

  // Conta quantos produtos este template precisa
  const qtdProdutos = templateSelecionado ? templateSelecionado.camadas.filter(
    c => c.tipo === 'produto-preco'
  ).length : 0;

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Mediz Logo" className="h-12" />
              <div>
                <h1 className="text-xl font-bold text-white hidden">
                  Criar Vídeo de Oferta
                </h1>
                <p className="text-sm text-gray-400 font-medium border-l-2 border-gray-600 pl-3 ml-1">
                  Criador de Vídeos
                </p>
              </div>
            </div>
            
            {/* Stepper */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${etapa === 'template' ? 'text-blue-400' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${etapa === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                  1
                </div>
                <span className="font-medium">Escolher Template</span>
              </div>
              
              <div className="w-12 h-0.5 bg-gray-700"></div>
              
              <div className={`flex items-center gap-2 ${etapa === 'dados' ? 'text-blue-400' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${etapa === 'dados' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                  2
                </div>
                <span className="font-medium">Adicionar Produtos</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ETAPA 1: ESCOLHER TEMPLATE */}
        {etapa === 'template' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-white">Escolha o Modelo do Vídeo</h2>
            
            {templatesDisponiveis.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                <p className="text-gray-400 mb-4">Nenhum template criado ainda.</p>
                <p className="text-sm text-gray-500">
                  Vá para <strong className="text-gray-300">/admin/motion-builder</strong> e crie seu primeiro template!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {templatesDisponiveis.map(template => {
                  const qtdProdutos = template.camadas.filter(c => c.tipo === 'produto-preco').length;
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => {
                        setTemplateSelecionado(template);
                        setEtapa('dados');
                      }}
                      className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:bg-gray-750 transition-all transform hover:-translate-y-1 text-left border border-gray-700 ${
                        templateSelecionado?.id === template.id ? 'ring-4 ring-blue-500' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden relative">
                        {template.thumbnail ? (
                          <img 
                            src={template.thumbnail} 
                            alt={template.nome} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            onError={(e) => {
                              // Fallback se a imagem falhar
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-900', 'to-blue-900');
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                            <div className="text-gray-600 text-6xl">🎬</div>
                          </div>
                        )}
                        
                        {/* Badge de Duração */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                          {template.duracao}s
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-white">{template.nome}</h3>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                          <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
                            {qtdProdutos} produtos
                          </span>
                        </p>
                        
                        <div className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-center transition-colors">
                          Escolher Este Modelo
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ETAPA 2: ADICIONAR DADOS */}
        {etapa === 'dados' && templateSelecionado && (
          <div className="grid grid-cols-2 gap-8">
            {/* COLUNA ESQUERDA: Formulário */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Adicione seus Produtos</h2>
                <button
                  onClick={() => setEtapa('template')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                >
                  ← Trocar Template
                </button>
              </div>

              {/* Opção de Remover Fundo */}
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="removerFundo"
                  checked={removerFundo}
                  onChange={(e) => setRemoverFundo(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-800 border-gray-600"
                />
                <label htmlFor="removerFundo" className="text-sm cursor-pointer flex-1">
                  <span className="font-bold text-blue-300 block mb-0.5">✨ Remover Fundo Automaticamente</span>
                  <span className="text-xs text-blue-200/70">Ao marcar, as novas imagens enviadas terão o fundo removido pela IA.</span>
                </label>
              </div>

              {/* Cards de Produtos */}
              {produtos.slice(0, qtdProdutos).map((produto, index) => (
                <div key={index} className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      Produto {index + 1}
                    </h3>
                    
                    <button
                      onClick={() => setRemoverFundo(!removerFundo)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border
                        ${removerFundo 
                          ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500' 
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }
                      `}
                    >
                      <span>{removerFundo ? '✨ Remoção Ativa' : '✂️ Remover Fundo'}</span>
                      {/* Toggle visual simplificado */}
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${removerFundo ? 'bg-white/30' : 'bg-gray-900'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${removerFundo ? 'left-4.5' : 'left-0.5'}`} style={{ left: removerFundo ? '18px' : '2px' }}></div>
                      </div>
                    </button>
                  </div>

                  {/* Upload de Imagem */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      📸 Foto do Produto
                    </label>
                    
                    {processingIds.includes(index) ? (
                      <div className="w-full h-48 bg-blue-900/20 rounded-lg flex flex-col items-center justify-center animate-pulse border-2 border-blue-500/50 border-dashed">
                        <div className="text-3xl animate-spin mb-2">✨</div>
                        <span className="text-sm font-bold text-blue-400">Removendo fundo...</span>
                        <span className="text-xs text-blue-300/70 mt-1">Aguarde um momento</span>
                      </div>
                    ) : produto.imagem ? (
                      <div className="relative group">
                        <div className="w-full h-48 bg-gray-900 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                          <img
                            src={produto.imagem}
                            alt={`Produto ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const novosProdutos = [...produtos];
                            novosProdutos[index].imagem = '';
                            setProdutos(novosProdutos);
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition group">
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📦</div>
                        <div className="text-sm text-gray-300 mb-1 font-medium">
                          Clique para adicionar foto
                        </div>
                        <div className="text-xs text-gray-500">
                          PNG, JPG até 5MB
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImagem(index, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                    {/* Opções de Ajuste da Imagem */}
                    {produto.imagem && (
                      <div className="flex gap-2 justify-center mt-2">
                        {[
                          { val: 'cover', label: '🖼️ Preencher', desc: 'Corta bordas' },
                          { val: 'contain', label: '📐 Ajustar', desc: 'Mostra tudo' },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            onClick={() => atualizarProduto(index, 'ajuste', opt.val)}
                            className={`
                              px-3 py-1 text-xs rounded-full border transition-all flex flex-col items-center
                              ${produto.ajuste === opt.val 
                                ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                                : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                              }
                            `}
                            title={opt.desc}
                          >
                            <span className="font-bold">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nome do Produto (opcional) */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Nome do Produto (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dipirona 500mg"
                      value={produto.nome}
                      onChange={(e) => atualizarProduto(index, 'nome', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Preço */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      💰 Preço *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-400">R$</span>
                      <input
                        type="text"
                        placeholder="9,90"
                        value={produto.preco}
                        onChange={(e) => atualizarProduto(index, 'preco', e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-2xl font-bold text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* WhatsApp */}
              <div className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                  📱 WhatsApp
                </h3>
                <input
                  type="tel"
                  placeholder="(45) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Campos Dinâmicos (Texto Livre e Localização) */}
              {templateSelecionado.camadas?.filter(c => c.tipo === 'texto' || c.tipo === 'localizacao').map((camada) => (
                <div key={camada.id} className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    {camada.tipo === 'localizacao' ? '📍 Localização' : '✍️ Texto Livre'}
                    <span className="text-xs font-normal text-gray-400 ml-2">({camada.nome || 'Sem nome'})</span>
                  </h3>
                  <input
                    type="text"
                    placeholder={camada.texto || "Opcional - Deixe em branco para ocultar"} // Placeholder mostra a sugestão
                    value={textosExtras[camada.id] || ''} // Valor limpo: só o que foi digitado
                    onChange={(e) => setTextosExtras(prev => ({
                      ...prev,
                      [camada.id]: e.target.value
                    }))}
                    className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              ))}

              {/* Botão Gerar */}
              {!videoUrl ? (
                <button
                  onClick={gerarVideo}
                  disabled={isRendering}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                    ${isRendering 
                      ? 'bg-gray-700 text-gray-400 cursor-wait' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl transform hover:-translate-y-0.5 hover:from-blue-500 hover:to-purple-500'
                    }
                  `}
                >
                  {isRendering ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="animate-spin text-2xl">⏳</span> 
                        <span>{statusMessage}</span>
                      </div>
                      {progress > 0 && (
                        <div className="w-full bg-gray-900 rounded-full h-2 mt-1 overflow-hidden border border-gray-600">
                          <div 
                            className="bg-green-500 h-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    '🎬 Gerar Vídeo MP4'
                  )}
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-xl text-center">
                    <h3 className="font-bold text-lg mb-1">✅ Vídeo Pronto!</h3>
                    <p className="text-sm opacity-80">Seu vídeo foi renderizado com sucesso.</p>
                  </div>
                  
                  <a
                    href={videoUrl}
                    download={`oferta-mediz-${Date.now()}.mp4`}
                    className="block w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-500 text-center transition-all transform hover:-translate-y-0.5"
                  >
                    ⬇️ Baixar Vídeo Agora
                  </a>

                  <button
                    onClick={() => setVideoUrl(null)}
                    className="block w-full text-gray-500 text-sm hover:text-white hover:underline text-center transition"
                  >
                    Gerar outro vídeo
                  </button>
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: Preview */}
            <div className="sticky top-8">
              <div className="bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-700">
                <h3 className="font-bold mb-3 flex items-center justify-between text-white">
                  <span className="text-sm">👁️ Preview do Vídeo</span>
                  <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">Tempo real</span>
                </h3>

                {/* Player do Remotion - MENOR */}
                <div className="bg-black rounded-lg overflow-hidden ring-1 ring-gray-700" style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                  <Player
                    component={VideoMotion}
                    inputProps={{
                      template: templateSelecionado,
                      dados: {
                        produtos,
                        whatsapp,
                        textos: { ...textosExtras }, // Corrigido: envia como 'textos' para bater com a interface do VideoMotion
                      },
                    }}
                    durationInFrames={templateSelecionado.duracao * templateSelecionado.fps}
                    fps={templateSelecionado.fps}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    style={{
                      width: '100%',
                      aspectRatio: '9/16',
                    }}
                    controls
                    loop
                  />
                </div>

                {/* Dicas */}
                <div className="mt-4 bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
                  <p className="text-xs text-blue-300 font-bold mb-2">💡 Dicas Rápidas:</p>
                  <ul className="text-xs text-blue-200/80 space-y-1.5 list-disc pl-4">
                    <li>Fotos com fundo transparente ficam melhores</li>
                    <li>Use vírgula no preço (ex: 9,90)</li>
                    <li>Aperte ▶️ para ver as animações</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ASSET PICKER MODAL */}
      {showAssetPicker && (
        <AssetPicker
          folder="products"
          onSelect={handleAssetSelect}
          onClose={() => setShowAssetPicker(false)}
        />
      )}
    </div>
  );
}
