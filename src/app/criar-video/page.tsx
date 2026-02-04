"use client";

import { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { VideoMotion } from '../../remotion/VideoMotion';

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
    { imagem: '', nome: '', preco: '' },
    { imagem: '', nome: '', preco: '' },
    { imagem: '', nome: '', preco: '' },
  ]);
  const [whatsapp, setWhatsapp] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [etapa, setEtapa] = useState<'template' | 'dados'>('template');
  
  // Configurações
  const [removerFundo, setRemoverFundo] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Carrega templates do localStorage ao montar
  useEffect(() => {
    const carregarTemplates = () => {
      try {
        const salvos = JSON.parse(localStorage.getItem('mediz-templates') || '[]');
        
        // Se não tiver nenhum, usa o template padrão
        if (salvos.length === 0) {
          setTemplatesDisponiveis(TEMPLATES);
        } else {
          setTemplatesDisponiveis(salvos);
        }
        
        console.log(`📦 ${salvos.length} templates carregados`);
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

  const atualizarProduto = (index: number, campo: 'nome' | 'preco', valor: string) => {
    const novosProdutos = [...produtos];
    novosProdutos[index][campo] = valor;
    setProdutos(novosProdutos);
  };

  const gerarVideo = async () => {
    setIsRendering(true);
    setVideoUrl(null);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: templateSelecionado,
          dados: { produtos, whatsapp, localizacao }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar vídeo');
      }

      setVideoUrl(data.url);
      
    } catch (error) {
      console.error('Erro na renderização:', error);
      alert('Falha ao gerar o vídeo. Verifique o console.');
    } finally {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Mediz Logo" className="h-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 hidden">
                  Criar Vídeo de Oferta
                </h1>
                <p className="text-sm text-gray-600 font-medium border-l-2 border-gray-300 pl-3 ml-1">
                  Criador de Vídeos
                </p>
              </div>
            </div>
            
            {/* Stepper */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${etapa === 'template' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className="font-medium">Escolher Template</span>
              </div>
              
              <div className="w-12 h-0.5 bg-gray-300"></div>
              
              <div className={`flex items-center gap-2 ${etapa === 'dados' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${etapa === 'dados' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
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
            <h2 className="text-xl font-bold mb-6">Escolha o Modelo do Vídeo</h2>
            
            {templatesDisponiveis.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-500 mb-4">Nenhum template criado ainda.</p>
                <p className="text-sm text-gray-400">
                  Vá para <strong>/admin/motion-builder</strong> e crie seu primeiro template!
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
                      className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 ${
                        templateSelecionado?.id === template.id ? 'ring-4 ring-blue-500' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <div className="text-white text-6xl">🎬</div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg">{template.nome}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {qtdProdutos} produtos • {template.duracao}s
                        </p>
                        
                        <div className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-center">
                          Escolher Este
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
                <h2 className="text-xl font-bold">Adicione seus Produtos</h2>
                <button
                  onClick={() => setEtapa('template')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Trocar Template
                </button>
              </div>

              {/* Opção de Remover Fundo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="removerFundo"
                  checked={removerFundo}
                  onChange={(e) => setRemoverFundo(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="removerFundo" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-bold text-blue-800">✨ Remover Fundo Automaticamente</span>
                  <p className="text-xs text-gray-500">Ao marcar, as novas imagens enviadas terão o fundo removido pela IA.</p>
                </label>
              </div>

              {/* Cards de Produtos */}
              {produtos.slice(0, qtdProdutos).map((produto, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
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
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span>{removerFundo ? '✨ Remoção Ativa' : '✂️ Remover Fundo'}</span>
                      {/* Toggle visual simplificado */}
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${removerFundo ? 'bg-white/30' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${removerFundo ? 'left-4.5' : 'left-0.5'}`} style={{ left: removerFundo ? '18px' : '2px' }}></div>
                      </div>
                    </button>
                  </div>

                  {/* Upload de Imagem */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📸 Foto do Produto
                    </label>
                    
                    {processingIds.includes(index) ? (
                      <div className="w-full h-48 bg-blue-50 rounded-lg flex flex-col items-center justify-center animate-pulse border-2 border-blue-200 border-dashed">
                        <div className="text-3xl animate-spin mb-2">✨</div>
                        <span className="text-sm font-bold text-blue-600">Removendo fundo...</span>
                        <span className="text-xs text-blue-400 mt-1">Aguarde um momento</span>
                      </div>
                    ) : produto.imagem ? (
                      <div className="relative">
                        <img
                          src={produto.imagem}
                          alt={`Produto ${index + 1}`}
                          className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            const novosProdutos = [...produtos];
                            novosProdutos[index].imagem = '';
                            setProdutos(novosProdutos);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                        <div className="text-4xl mb-2">📦</div>
                        <div className="text-sm text-gray-600 mb-1">
                          Clique para adicionar foto
                        </div>
                        <div className="text-xs text-gray-400">
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
                  </div>

                  {/* Nome do Produto (opcional) */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome do Produto (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dipirona 500mg"
                      value={produto.nome}
                      onChange={(e) => atualizarProduto(index, 'nome', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Preço */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💰 Preço *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-700">R$</span>
                      <input
                        type="text"
                        placeholder="9,90"
                        value={produto.preco}
                        onChange={(e) => atualizarProduto(index, 'preco', e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* WhatsApp */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  📱 WhatsApp
                </h3>
                <input
                  type="tel"
                  placeholder="(45) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Localização (se o template tiver) */}
              {templateSelecionado.camadas?.some(c => c.tipo === 'localizacao') && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    📍 Localização
                  </h3>
                  <input
                    type="text"
                    placeholder="Rua das Flores, 123 - Centro"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Botão Gerar */}
              {!videoUrl ? (
                <button
                  onClick={gerarVideo}
                  disabled={isRendering}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
                    ${isRendering 
                      ? 'bg-gray-400 cursor-wait' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  {isRendering ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin text-2xl">⏳</span> Gerando Vídeo... (Aguarde)
                    </span>
                  ) : (
                    '🎬 Gerar Vídeo MP4'
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl text-center">
                    <h3 className="font-bold text-lg mb-1">✅ Vídeo Pronto!</h3>
                    <p className="text-sm">Seu vídeo foi renderizado com sucesso.</p>
                  </div>
                  
                  <a
                    href={videoUrl}
                    download={`oferta-mediz-${Date.now()}.mp4`}
                    className="block w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 text-center transition-all"
                  >
                    ⬇️ Baixar Vídeo Agora
                  </a>

                  <button
                    onClick={() => setVideoUrl(null)}
                    className="block w-full text-gray-500 text-sm hover:underline text-center"
                  >
                    Gerar outro vídeo
                  </button>
                </div>
              )}
            </div>

            {/* COLUNA DIREITA: Preview */}
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="font-bold mb-3 flex items-center justify-between">
                  <span className="text-sm">👁️ Preview do Vídeo</span>
                  <span className="text-xs text-gray-500">Tempo real</span>
                </h3>

                {/* Player do Remotion - MENOR */}
                <div className="bg-black rounded-lg overflow-hidden" style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                  <Player
                    component={VideoMotion}
                    inputProps={{
                      template: templateSelecionado,
                      dados: {
                        produtos,
                        whatsapp,
                        localizacao,
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
                <div className="mt-3 bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-medium mb-1">💡 Dicas Rápidas:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Fotos com fundo branco</li>
                    <li>• Preço: 9,90 (com vírgula)</li>
                    <li>• Aperte ▶️ pra ver animações</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
