"use client";

import { useState, useRef, useEffect } from 'react';

// ============================================================================
// TIPOS E CONSTANTES
// ============================================================================

type AnimationType = 
  | 'fade-in' | 'slide-right' | 'slide-left' | 'slide-up' | 'slide-down'
  | 'scale-in' | 'zoom-explosion' | 'bounce'
  | 'fade-out' | 'slide-out-right' | 'slide-out-left' | 'slide-out-up'
  | 'scale-out' | 'zoom-implosion';

type LayerType = 'produto-preco' | 'preco' | 'whatsapp' | 'localizacao' | 'texto';

interface Layer {
  id: string;
  tipo: LayerType;
  nome: string;
  // Timing (em segundos)
  inicio: number;
  fim: number;
  // Posição e tamanho
  posicao: { x: number; y: number }; // porcentagem
  tamanho: { width: number; height: number }; // pixels
  // Animações
  animacaoEntrada: {
    tipo: AnimationType;
    duracao: number; // segundos
  };
  animacaoSaida?: {
    tipo: AnimationType;
    duracao: number;
  };
  // Estilos específicos
  estilos?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    backgroundColor?: string;
  };
  // Configurações específicas do Texto (Preço)
  textDelay?: number; // atraso em segundos
  textPosition?: { x: number; y: number }; // offset em pixels
}

interface Template {
  id: string;
  nome: string;
  videoFundo: string;
  duracao: number; // segundos
  fps: number;
  camadas: Layer[];
}

// Biblioteca de animações
const ANIMACOES_ENTRADA: { value: AnimationType; label: string; icon: string }[] = [
  { value: 'fade-in', label: 'Fade In', icon: '⚡' },
  { value: 'slide-right', label: 'Slide da Direita', icon: '👉' },
  { value: 'slide-left', label: 'Slide da Esquerda', icon: '👈' },
  { value: 'slide-up', label: 'Slide de Cima', icon: '👆' },
  { value: 'slide-down', label: 'Slide de Baixo', icon: '👇' },
  { value: 'scale-in', label: 'Crescer', icon: '📈' },
  { value: 'zoom-explosion', label: 'Zoom Explosão', icon: '💥' },
  { value: 'bounce', label: 'Bounce (Pular)', icon: '🏀' },
];

const ANIMACOES_SAIDA: { value: AnimationType; label: string; icon: string }[] = [
  { value: 'fade-out', label: 'Fade Out', icon: '🌫️' },
  { value: 'slide-out-right', label: 'Slide pra Direita', icon: '➡️' },
  { value: 'slide-out-left', label: 'Slide pra Esquerda', icon: '⬅️' },
  { value: 'slide-out-up', label: 'Slide pra Cima', icon: '⬆️' },
  { value: 'scale-out', label: 'Diminuir', icon: '📉' },
  { value: 'zoom-implosion', label: 'Zoom Implosão', icon: '🎯' },
];

const TIPOS_CAMADA: { value: LayerType; label: string; icon: string; defaultSize: { width: number; height: number } }[] = [
  { value: 'produto-preco', label: 'Produto + Preço', icon: '📦', defaultSize: { width: 400, height: 500 } },
  { value: 'preco', label: 'Só Preço', icon: '💰', defaultSize: { width: 300, height: 100 } },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱', defaultSize: { width: 400, height: 60 } },
  { value: 'localizacao', label: 'Localização', icon: '📍', defaultSize: { width: 300, height: 50 } },
  { value: 'texto', label: 'Texto Livre', icon: '📝', defaultSize: { width: 350, height: 80 } },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AdminMotionBuilder() {
  const [template, setTemplate] = useState<Template>({
    id: 'novo-template',
    nome: 'Novo Template',
    videoFundo: '',
    duracao: 15,
    fps: 30,
    camadas: [],
  });

  const [camadaSelecionada, setCamadaSelecionada] = useState<string | null>(null);
  const [tempoAtual, setTempoAtual] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [templatesSalvos, setTemplatesSalvos] = useState<Template[]>([]);

  // Carrega templates salvos ao montar
  useEffect(() => {
    const carregarTemplates = () => {
      try {
        const salvos = JSON.parse(localStorage.getItem('mediz-templates') || '[]');
        setTemplatesSalvos(salvos);
        console.log(`📦 ${salvos.length} templates carregados do localStorage`);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      }
    };
    
    carregarTemplates();
  }, []);

  // ========================================================================
  // FUNÇÕES DE MANIPULAÇÃO
  // ========================================================================

  const adicionarCamada = (tipo: LayerType) => {
    const tipoCamada = TIPOS_CAMADA.find(t => t.value === tipo);
    
    const novaCamada: Layer = {
      id: `layer-${Date.now()}`,
      tipo,
      nome: `${tipoCamada?.label} ${template.camadas.length + 1}`,
      inicio: 0,
      fim: 5,
      posicao: { x: 50, y: 50 },
      tamanho: tipoCamada?.defaultSize || { width: 300, height: 300 },
      animacaoEntrada: {
        tipo: 'fade-in',
        duracao: 0.5,
      },
      textDelay: 0,
      textPosition: { x: 0, y: 0 },
      estilos: tipo === 'preco' ? {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#FFD700',
      } : undefined,
    };

    setTemplate({
      ...template,
      camadas: [...template.camadas, novaCamada],
    });
    setCamadaSelecionada(novaCamada.id);
  };

  const atualizarCamada = (id: string, updates: Partial<Layer>) => {
    setTemplate({
      ...template,
      camadas: template.camadas.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removerCamada = (id: string) => {
    setTemplate({
      ...template,
      camadas: template.camadas.filter(c => c.id !== id),
    });
    if (camadaSelecionada === id) {
      setCamadaSelecionada(null);
    }
  };

  const salvarTemplate = () => {
    try {
      // Salva no localStorage
      const templates = JSON.parse(localStorage.getItem('mediz-templates') || '[]');
      
      // Adiciona ou atualiza template
      const index = templates.findIndex((t: Template) => t.id === template.id);
      if (index >= 0) {
        templates[index] = template;
      } else {
        templates.push(template);
      }
      
      localStorage.setItem('mediz-templates', JSON.stringify(templates));
      
      console.log('✅ Template salvo no localStorage:', template);
      alert(`✅ Template "${template.nome}" salvo com sucesso!\n\n${templates.length} templates no total.`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('Erro ao salvar template!');
    }
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTemplate({ ...template, videoFundo: url });
    }
  };

  const getCamadaSelecionadaObj = () => {
    return template.camadas.find(c => c.id === camadaSelecionada);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const camadaAtual = getCamadaSelecionadaObj();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">📹 Mediz Motion Builder</h1>
          <input
            type="text"
            value={template.nome}
            onChange={(e) => setTemplate({ ...template, nome: e.target.value })}
            className="px-3 py-1 border rounded"
            placeholder="Nome do template"
          />
        </div>
        <button
          onClick={salvarTemplate}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
        >
          💾 Salvar Template
        </button>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* COLUNA ESQUERDA: Preview + Timeline */}
        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* PREVIEW */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">Preview do Vídeo</h2>
            
            {!template.videoFundo ? (
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <p className="text-gray-500 mb-4">Nenhum vídeo de fundo carregado</p>
                <label className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700">
                  📁 Upload Vídeo de Fundo (MP4)
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={handleUploadVideo}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                {/* Vídeo de fundo */}
                <video
                  ref={videoRef}
                  src={template.videoFundo}
                  className="w-full rounded-lg"
                  controls
                  onTimeUpdate={(e) => setTempoAtual(e.currentTarget.currentTime)}
                />

                {/* Overlay das camadas (para visualização de posição) */}
                <div className="absolute inset-0 pointer-events-none">
                  {template.camadas.map(camada => {
                    // Só mostra se estiver dentro do timing
                    const dentroDoTiming = tempoAtual >= camada.inicio && tempoAtual <= camada.fim;
                    
                    return (
                      <div
                        key={camada.id}
                        className={`absolute border-2 ${
                          camadaSelecionada === camada.id 
                            ? 'border-blue-500 bg-blue-500/20' 
                            : 'border-yellow-400 bg-yellow-400/10'
                        } ${!dentroDoTiming ? 'opacity-30' : ''}`}
                        style={{
                          left: `${camada.posicao.x}%`,
                          top: `${camada.posicao.y}%`,
                          width: camada.tamanho.width,
                          height: camada.tamanho.height,
                          transform: 'translate(-50%, -50%)',
                        }}
                        onClick={() => setCamadaSelecionada(camada.id)}
                      >
                        <span className="bg-blue-500 text-white px-2 py-1 text-xs">
                          {camada.nome}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  ⏱️ Tempo: {tempoAtual.toFixed(1)}s / {template.duracao}s
                </div>
              </div>
            )}
          </div>

          {/* TIMELINE */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Timeline</h2>
            
            {/* Régua de tempo */}
            <div className="relative h-8 bg-gray-200 rounded mb-4">
              {Array.from({ length: template.duracao + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-xs text-gray-600"
                  style={{ left: `${(i / template.duracao) * 100}%` }}
                >
                  <div className="w-px h-4 bg-gray-400"></div>
                  <span className="ml-1">{i}s</span>
                </div>
              ))}
              
              {/* Indicador de tempo atual */}
              <div
                className="absolute top-0 w-0.5 h-full bg-red-500"
                style={{ left: `${(tempoAtual / template.duracao) * 100}%` }}
              />
            </div>

            {/* Fundo (sempre 0-15s) */}
            <div className="mb-2">
              <div className="text-sm font-semibold mb-1">🎬 Vídeo de Fundo</div>
              <div className="h-8 bg-gradient-to-r from-purple-500 to-purple-700 rounded flex items-center px-2 text-white text-sm">
                0s - {template.duracao}s
              </div>
            </div>

            {/* Camadas */}
            {template.camadas.map((camada, index) => {
              const tipoInfo = TIPOS_CAMADA.find(t => t.value === camada.tipo);
              
              return (
                <div key={camada.id} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold">
                      {tipoInfo?.icon} {camada.nome}
                    </div>
                    <button
                      onClick={() => removerCamada(camada.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      🗑️ Remover
                    </button>
                  </div>
                  
                  <div className="relative h-12 bg-gray-100 rounded">
                    {/* Barra da camada */}
                    <div
                      className={`absolute h-full rounded flex items-center px-2 text-white text-xs cursor-pointer ${
                        camadaSelecionada === camada.id
                          ? 'bg-blue-600 ring-2 ring-blue-400'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      style={{
                        left: `${(camada.inicio / template.duracao) * 100}%`,
                        width: `${((camada.fim - camada.inicio) / template.duracao) * 100}%`,
                      }}
                      onClick={() => setCamadaSelecionada(camada.id)}
                    >
                      <div className="truncate">
                        {camada.inicio.toFixed(1)}s - {camada.fim.toFixed(1)}s
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Entra: {ANIMACOES_ENTRADA.find(a => a.value === camada.animacaoEntrada.tipo)?.icon} {ANIMACOES_ENTRADA.find(a => a.value === camada.animacaoEntrada.tipo)?.label}
                    {camada.animacaoSaida && (
                      <> | Sai: {ANIMACOES_SAIDA.find(a => a.value === camada.animacaoSaida?.tipo)?.icon} {ANIMACOES_SAIDA.find(a => a.value === camada.animacaoSaida?.tipo)?.label}</>
                    )}
                  </div>
                </div>
              );
            })}

            {template.camadas.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Nenhuma camada adicionada ainda
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Biblioteca + Configurações */}
        <div className="w-96 bg-white border-l p-6 overflow-y-auto">
          {/* Biblioteca de Camadas */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">📚 Biblioteca de Camadas</h3>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_CAMADA.map(tipo => (
                <button
                  key={tipo.value}
                  onClick={() => adicionarCamada(tipo.value)}
                  className="p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <div className="text-2xl mb-1">{tipo.icon}</div>
                  <div className="text-xs font-semibold">{tipo.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Configurações da Camada Selecionada */}
          {camadaAtual ? (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">⚙️ Configurações</h3>
              
              {/* Nome */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Nome da Camada:</label>
                <input
                  type="text"
                  value={camadaAtual.nome}
                  onChange={(e) => atualizarCamada(camadaAtual.id, { nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {/* Timing */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">⏱️ Timing:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Início (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={template.duracao}
                      value={camadaAtual.inicio}
                      onChange={(e) => atualizarCamada(camadaAtual.id, { inicio: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Fim (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={template.duracao}
                      value={camadaAtual.fim}
                      onChange={(e) => atualizarCamada(camadaAtual.id, { fim: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Posição */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">📍 Posição (%):</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">X (horizontal)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={camadaAtual.posicao.x}
                      onChange={(e) => atualizarCamada(camadaAtual.id, {
                        posicao: { ...camadaAtual.posicao, x: parseFloat(e.target.value) }
                      })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Y (vertical)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={camadaAtual.posicao.y}
                      onChange={(e) => atualizarCamada(camadaAtual.id, {
                        posicao: { ...camadaAtual.posicao, y: parseFloat(e.target.value) }
                      })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tamanho */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">📏 Tamanho (px):</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Largura</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={camadaAtual.tamanho.width}
                      onChange={(e) => atualizarCamada(camadaAtual.id, {
                        tamanho: { ...camadaAtual.tamanho, width: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Altura</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={camadaAtual.tamanho.height}
                      onChange={(e) => atualizarCamada(camadaAtual.id, {
                        tamanho: { ...camadaAtual.tamanho, height: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Animação de Entrada */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">🎬 Animação de Entrada:</label>
                <select
                  value={camadaAtual.animacaoEntrada.tipo}
                  onChange={(e) => atualizarCamada(camadaAtual.id, {
                    animacaoEntrada: {
                      ...camadaAtual.animacaoEntrada,
                      tipo: e.target.value as AnimationType,
                    }
                  })}
                  className="w-full px-3 py-2 border rounded mb-2"
                >
                  {ANIMACOES_ENTRADA.map(anim => (
                    <option key={anim.value} value={anim.value}>
                      {anim.icon} {anim.label}
                    </option>
                  ))}
                </select>
                
                <label className="text-xs text-gray-600">Duração (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2"
                  value={camadaAtual.animacaoEntrada.duracao}
                  onChange={(e) => atualizarCamada(camadaAtual.id, {
                    animacaoEntrada: {
                      ...camadaAtual.animacaoEntrada,
                      duracao: parseFloat(e.target.value),
                    }
                  })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>

              {/* Animação de Saída */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">🎬 Animação de Saída:</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={!!camadaAtual.animacaoSaida}
                    onChange={(e) => {
                      if (e.target.checked) {
                        atualizarCamada(camadaAtual.id, {
                          animacaoSaida: {
                            tipo: 'fade-out',
                            duracao: 0.5,
                          }
                        });
                      } else {
                        atualizarCamada(camadaAtual.id, {
                          animacaoSaida: undefined,
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Ativar animação de saída</span>
                </div>
                
                {camadaAtual.animacaoSaida && (
                  <>
                    <select
                      value={camadaAtual.animacaoSaida.tipo}
                      onChange={(e) => atualizarCamada(camadaAtual.id, {
                        animacaoSaida: {
                          ...camadaAtual.animacaoSaida!,
                          tipo: e.target.value as AnimationType,
                        }
                      })}
                      className="w-full px-3 py-2 border rounded mb-2"
                    >
                      {ANIMACOES_SAIDA.map(anim => (
                        <option key={anim.value} value={anim.value}>
                          {anim.icon} {anim.label}
                        </option>
                      ))}
                    </select>
                    
                    <label className="text-xs text-gray-600">Duração (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2"
                      value={camadaAtual.animacaoSaida.duracao}
                      onChange={(e) => atualizarCamada(camadaAtual.id, {
                        animacaoSaida: {
                          ...camadaAtual.animacaoSaida!,
                          duracao: parseFloat(e.target.value),
                        }
                      })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </>
                )}
              </div>

              {/* Configurações Específicas do Texto (Preço) dentro do Produto */}
              {camadaAtual.tipo === 'produto-preco' && (
                <div className="mb-4 border-t pt-4">
                  <label className="block text-sm font-semibold mb-2">🏷️ Posição e Timing do Preço:</label>
                  
                  <div className="mb-2">
                    <label className="text-xs text-gray-600">Atraso na entrada (segundos)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={camadaAtual.textDelay || 0}
                      onChange={(e) => atualizarCamada(camadaAtual.id, { textDelay: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                    <p className="text-[10px] text-gray-500">Tempo após o início da camada para o preço aparecer</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Offset X (px)</label>
                      <input
                        type="number"
                        step="1"
                        value={camadaAtual.textPosition?.x || 0}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          textPosition: { ...camadaAtual.textPosition, x: parseFloat(e.target.value) || 0, y: camadaAtual.textPosition?.y || 0 }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Offset Y (px)</label>
                      <input
                        type="number"
                        step="1"
                        value={camadaAtual.textPosition?.y || 0}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          textPosition: { ...camadaAtual.textPosition, x: camadaAtual.textPosition?.x || 0, y: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Estilos de Texto (se for tipo texto/preço) */}
              {(camadaAtual.tipo === 'preco' || camadaAtual.tipo === 'texto' || camadaAtual.tipo === 'whatsapp' || camadaAtual.tipo === 'localizacao') && (
                <div className="mb-4 border-t pt-4">
                  <label className="block text-sm font-semibold mb-2">🎨 Estilos de Texto:</label>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Tamanho da Fonte</label>
                      <input
                        type="number"
                        min="12"
                        max="200"
                        value={camadaAtual.estilos?.fontSize || 40}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          estilos: {
                            ...camadaAtual.estilos,
                            fontSize: parseInt(e.target.value),
                          }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600">Cor do Texto</label>
                      <input
                        type="color"
                        value={camadaAtual.estilos?.color || '#FFFFFF'}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          estilos: {
                            ...camadaAtual.estilos,
                            color: e.target.value,
                          }
                        })}
                        className="w-full h-10 border rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-600">Peso da Fonte</label>
                      <select
                        value={camadaAtual.estilos?.fontWeight || 'normal'}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          estilos: {
                            ...camadaAtual.estilos,
                            fontWeight: e.target.value,
                          }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Negrito</option>
                        <option value="900">Extra Negrito</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Deletar */}
              <button
                onClick={() => removerCamada(camadaAtual.id)}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 mt-4"
              >
                🗑️ Deletar Camada
              </button>
            </div>
          ) : (
            <div className="border-t pt-6 text-center text-gray-400">
              Selecione uma camada na timeline para configurar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}