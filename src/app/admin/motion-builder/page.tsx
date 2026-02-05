"use client";

import { useState, useRef, useEffect } from 'react';
import AssetPicker from '../../../components/AssetPicker';

// ============================================================================
// TIPOS E CONSTANTES
// ============================================================================

type AnimationType = 
  | 'fade-in' | 'slide-right' | 'slide-left' | 'slide-up' | 'slide-down'
  | 'scale-in' | 'zoom-explosion' | 'bounce' | 'rotate-in' | 'flip-in-y' | 'elastic-scale' | 'blur-in' | 'pop-in' | 'spiral-in' | 'swing-in'
  | 'fade-out' | 'slide-out-right' | 'slide-out-left' | 'slide-out-up' | 'slide-out-down'
  | 'scale-out' | 'zoom-implosion' | 'rotate-out' | 'flip-out-y' | 'blur-out' | 'pop-out' | 'spiral-out' | 'swing-out';

type LayerType = 'produto-preco' | 'preco' | 'whatsapp' | 'localizacao' | 'texto';

const FONTES_DISPONIVEIS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Palatino, serif', label: 'Palatino' },
  { value: 'Garamond, serif', label: 'Garamond' },
  { value: 'Bookman, serif', label: 'Bookman' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { value: 'Arial Black, sans-serif', label: 'Arial Black' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: 'Roboto, sans-serif', label: 'Roboto (System)' },
];

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
    fontFamily?: string;
    color?: string;
    textAlign?: string;
    backgroundColor?: string;
    objectFit?: 'cover' | 'contain' | 'fill';
  };
  // Configurações específicas do Texto (Preço)
  textDelay?: number; // atraso em segundos
  textPosition?: { x: number; y: number }; // offset em pixels
  // Conteúdo (imagem, texto específico, etc)
  conteudo?: {
    url?: string;
    texto?: string;
  };
}

interface Template {
  id: string;
  nome: string;
  thumbnail?: string;
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
  { value: 'rotate-in', label: 'Rotacionar', icon: '🔄' },
  { value: 'flip-in-y', label: 'Girar (Flip)', icon: '↔️' },
  { value: 'elastic-scale', label: 'Elástico', icon: '🍮' },
  { value: 'blur-in', label: 'Blur In', icon: '🌫️' },
  { value: 'pop-in', label: 'Pop (Estouro)', icon: '🎈' },
  { value: 'spiral-in', label: 'Espiral', icon: '🌀' },
  { value: 'swing-in', label: 'Balanço', icon: '🔔' },
];

const ANIMACOES_SAIDA: { value: AnimationType; label: string; icon: string }[] = [
  { value: 'fade-out', label: 'Fade Out', icon: '🌫️' },
  { value: 'slide-out-right', label: 'Slide pra Direita', icon: '➡️' },
  { value: 'slide-out-left', label: 'Slide pra Esquerda', icon: '⬅️' },
  { value: 'slide-out-up', label: 'Slide pra Cima', icon: '⬆️' },
  { value: 'slide-out-down', label: 'Slide pra Baixo', icon: '⬇️' },
  { value: 'scale-out', label: 'Diminuir', icon: '📉' },
  { value: 'zoom-implosion', label: 'Zoom Implosão', icon: '🎯' },
  { value: 'rotate-out', label: 'Rotacionar Saída', icon: '🔄' },
  { value: 'flip-out-y', label: 'Girar Saída (Flip)', icon: '↔️' },
  { value: 'blur-out', label: 'Blur Out', icon: '🌫️' },
  { value: 'pop-out', label: 'Pop Out (Estouro)', icon: '🎈' },
  { value: 'spiral-out', label: 'Espiral Saída', icon: '🌀' },
  { value: 'swing-out', label: 'Balanço Saída', icon: '🔔' },
];

const TIPOS_CAMADA: { value: LayerType; label: string; icon: string; defaultSize: { width: number; height: number } }[] = [
  { value: 'produto-preco', label: 'Produto + Preço', icon: '📦', defaultSize: { width: 800, height: 800 } },
  { value: 'preco', label: 'Só Preço', icon: '💰', defaultSize: { width: 400, height: 150 } },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱', defaultSize: { width: 600, height: 100 } },
  { value: 'localizacao', label: 'Localização', icon: '📍', defaultSize: { width: 500, height: 80 } },
  { value: 'texto', label: 'Texto Livre', icon: '📝', defaultSize: { width: 600, height: 120 } },
];

const getMatchingExitAnimation = (entryAnim: AnimationType): AnimationType => {
  switch (entryAnim) {
    case 'slide-right': return 'slide-out-right';
    case 'slide-left': return 'slide-out-left';
    case 'slide-up': return 'slide-out-up';
    case 'slide-down': return 'slide-out-down';
    case 'scale-in': return 'scale-out';
    case 'zoom-explosion': return 'zoom-implosion';
    case 'rotate-in': return 'rotate-out';
    case 'flip-in-y': return 'flip-out-y';
    case 'blur-in': return 'blur-out';
    case 'pop-in': return 'pop-out';
    case 'spiral-in': return 'spiral-out';
    case 'swing-in': return 'swing-out';
    case 'fade-in': return 'fade-out';
    default: return 'fade-out';
  }
};

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
  const [isPlaying, setIsPlaying] = useState(false); // Novo estado
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null); // Ref para o container do preview
  const [templatesSalvos, setTemplatesSalvos] = useState<Template[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Asset Picker State
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetPickerConfig, setAssetPickerConfig] = useState<{ folder: string, onSelect: (url: string) => void } | null>(null);

  const openAssetPicker = (folder: string, callback: (url: string) => void) => {
    setAssetPickerConfig({ folder, onSelect: callback });
    setShowAssetPicker(true);
  };

  // Calcula escala para preview
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Calcula a escala necessária para caber 1080x1920 no container
        const scaleX = width / 1080;
        const scaleY = height / 1920;
        // Usa a menor escala para garantir que caiba (contain)
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Carrega templates salvos ao montar
  useEffect(() => {
    carregarTemplatesSalvos();
  }, []);

  const carregarTemplatesSalvos = async () => {
    try {
      const response = await fetch('/api/templates/list');
      const data = await response.json();
      
      if (data.templates) {
        setTemplatesSalvos(data.templates);
        console.log(`📦 ${data.templates.length} templates carregados do servidor`);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const deletarTemplateSalvo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const response = await fetch(`/api/templates/delete?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Falha ao excluir');
      
      setTemplatesSalvos(prev => prev.filter(t => t.id !== id));
      
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir template.');
    }
  };

  const carregarTemplate = (t: Template) => {
    setTemplate(t);
    setShowLoadModal(false);
  };

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
      conteudo: {
        texto: tipo === 'whatsapp' ? '(45) 99999-9999' : 
               tipo === 'localizacao' ? 'Av. Brasil, 1234' : 
               tipo === 'texto' ? 'Seu Texto Aqui' : undefined
      },
      estilos: {
        fontSize: tipo === 'preco' ? 80 : 40,
        fontWeight: tipo === 'preco' ? 'bold' : 'normal',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        textAlign: 'center',
      },
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

  const [isSaving, setIsSaving] = useState(false);

  const salvarTemplate = async () => {
    try {
      setIsSaving(true);
      // Se for um novo template (id padrão), gera um ID único
      let templateParaSalvar = { ...template };
      if (templateParaSalvar.id === 'novo-template') {
        templateParaSalvar.id = `template-${Date.now()}`;
        setTemplate(templateParaSalvar); // Atualiza estado local também
      }
      
      const response = await fetch('/api/templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateParaSalvar)
      });

      if (!response.ok) throw new Error('Falha ao salvar');

      const data = await response.json();

      console.log('✅ Template salvo no servidor:', templateParaSalvar);
      
      // Atualiza lista e estado local com a thumbnail gerada
      if (data.thumbnail) {
        setTemplate(prev => ({ ...prev, thumbnail: data.thumbnail }));
      }
      
      await carregarTemplatesSalvos(); // Atualiza lista
      alert(`✅ Template "${templateParaSalvar.nome}" salvo com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('Erro ao salvar template!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Tenta usar Base64 para persistência (cuidado com tamanho)
      // Se for muito grande, talvez falhe no localStorage, mas para demo serve
      const reader = new FileReader();
      reader.onload = (evt) => {
        setTemplate({ ...template, videoFundo: evt.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getCamadaSelecionadaObj = () => {
    return template.camadas.find(c => c.id === camadaSelecionada);
  };

  // ========================================================================
  // CONTROLES DE VÍDEO
  // ========================================================================

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
    setTempoAtual(0);
  };

  // Sincroniza estado de play se o vídeo pausar/tocar por outros meios (ex: fim do vídeo)
  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  // ========================================================================
  // DRAG & DROP LOGIC
  // ========================================================================

  const handleMouseDown = (e: React.MouseEvent, camadaId: string, camadaPos: { x: number, y: number }) => {
    e.stopPropagation();
    if (!previewRef.current) return;

    setCamadaSelecionada(camadaId);
    setIsDragging(true);
    
    // Calcula o offset inicial do mouse em relação ao centro do elemento
    // Precisamos converter coordenadas do mouse (px) para porcentagem
    // IMPORTANTE: Usamos o rect do elemento PREVIEW (scaled), não do container 1080p
    const rect = previewRef.current.getBoundingClientRect();
    const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setDragOffset({
      x: mouseXPercent - camadaPos.x,
      y: mouseYPercent - camadaPos.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !camadaSelecionada || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    
    // Nova posição baseada no mouse
    let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;

    // Limites (0-100%)
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    atualizarCamada(camadaSelecionada, {
      posicao: { x: newX, y: newY }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ========================================================================
  // LÓGICA DE ANIMAÇÃO (Preview)
  // ========================================================================
  
  const getAnimationStyles = (layer: Layer, currentTime: number): React.CSSProperties => {
    const { inicio, fim, animacaoEntrada, animacaoSaida } = layer;
    let style: React.CSSProperties = { opacity: 1, transform: 'translate(-50%, -50%)' };
    
    // 1. Animação de Entrada
    if (currentTime >= inicio && currentTime <= inicio + animacaoEntrada.duracao) {
      const progress = (currentTime - inicio) / animacaoEntrada.duracao;
      const eased = Math.min(1, Math.max(0, progress)); // clamp 0-1
      
      switch (animacaoEntrada.tipo) {
        case 'fade-in':
          style.opacity = eased;
          break;
        case 'slide-right': // Entra da esquerda para a posição
          style.transform = `translate(calc(-50% - ${(1 - eased) * 100}px), -50%)`;
          style.opacity = eased;
          break;
        case 'slide-left': // Entra da direita
          style.transform = `translate(calc(-50% + ${(1 - eased) * 100}px), -50%)`;
          style.opacity = eased;
          break;
        case 'slide-up': // Entra de baixo
          style.transform = `translate(-50%, calc(-50% + ${(1 - eased) * 100}px))`;
          style.opacity = eased;
          break;
        case 'slide-down': // Entra de cima
          style.transform = `translate(-50%, calc(-50% - ${(1 - eased) * 100}px))`;
          style.opacity = eased;
          break;
        case 'scale-in':
          style.transform = `translate(-50%, -50%) scale(${eased})`;
          style.opacity = eased;
          break;
        case 'zoom-explosion':
          style.transform = `translate(-50%, -50%) scale(${eased * 2})`;
          style.opacity = Math.min(1, eased * 2);
          if (eased > 0.5) style.transform = `translate(-50%, -50%) scale(${2 - (eased - 0.5) * 2})`; // volta ao normal
          break;
        case 'bounce':
          // Simples bounce effect
          const bounce = eased < 0.5 ? eased * 2 : 1 - (eased - 0.5) * 0.2; 
          style.transform = `translate(-50%, -50%) scale(${bounce})`;
          break;
        case 'rotate-in':
          style.transform = `translate(-50%, -50%) rotate(${(1 - eased) * -180}deg) scale(${eased})`;
          style.opacity = eased;
          break;
        case 'flip-in-y':
          style.transform = `translate(-50%, -50%) perspective(400px) rotateY(${(1 - eased) * 90}deg)`;
          style.opacity = eased;
          break;
        case 'elastic-scale':
           // Efeito elástico simples
           const p = eased;
           const scale = p === 0 || p === 1 ? p : -Math.pow(2, 10 * (p - 1)) * Math.sin((p - 1.1) * 5 * Math.PI) + 1;
           style.transform = `translate(-50%, -50%) scale(${scale})`;
           style.opacity = eased;
           break;
        case 'blur-in':
          style.filter = `blur(${(1 - eased) * 10}px)`;
          style.opacity = eased;
          break;
        case 'pop-in':
          const pop = eased < 0.6 ? eased * 1.83 : 1.1 - (eased - 0.6) * 0.25; // Aproximação visual do bezier
          style.transform = `translate(-50%, -50%) scale(${Math.min(1, pop)})`;
          style.opacity = eased;
          break;
        case 'spiral-in':
          style.transform = `translate(-50%, -50%) rotate(${(1 - eased) * -180}deg) scale(${eased})`;
          style.opacity = eased;
          break;
        case 'swing-in':
          style.transform = `translate(-50%, -50%) rotate(${(1 - eased) * -90}deg)`;
          style.transformOrigin = 'top center';
          style.opacity = eased;
          break;
      }
    }
    
    // 2. Animação de Saída
    else if (animacaoSaida && currentTime >= fim - animacaoSaida.duracao && currentTime <= fim) {
      const progress = (currentTime - (fim - animacaoSaida.duracao)) / animacaoSaida.duracao;
      const eased = Math.min(1, Math.max(0, progress)); // 0 -> 1 (onde 1 é o fim total)
      
      switch (animacaoSaida.tipo) {
        case 'fade-out':
          style.opacity = 1 - eased;
          break;
        case 'slide-out-right': // Sai para a direita
          style.transform = `translate(calc(-50% + ${eased * 100}px), -50%)`;
          style.opacity = 1 - eased;
          break;
        case 'slide-out-left': // Sai para a esquerda
          style.transform = `translate(calc(-50% - ${eased * 100}px), -50%)`;
          style.opacity = 1 - eased;
          break;
        case 'slide-out-up': // Sai para cima
          style.transform = `translate(-50%, calc(-50% - ${eased * 100}px))`;
          style.opacity = 1 - eased;
          break;
        case 'slide-out-down': // Sai para baixo
          style.transform = `translate(-50%, calc(-50% + ${eased * 100}px))`;
          style.opacity = 1 - eased;
          break;
        case 'scale-out':
          style.transform = `translate(-50%, -50%) scale(${1 - eased})`;
          style.opacity = 1 - eased;
          break;
        case 'zoom-implosion':
           style.transform = `translate(-50%, -50%) scale(${1 - eased})`;
           style.opacity = 1 - eased;
           break;
        case 'rotate-out':
           style.transform = `translate(-50%, -50%) rotate(${eased * 180}deg) scale(${1 - eased})`;
           style.opacity = 1 - eased;
           break;
        case 'flip-out-y':
           style.transform = `translate(-50%, -50%) perspective(400px) rotateY(${eased * 90}deg)`;
           style.opacity = 1 - eased;
           break;
        case 'blur-out':
          style.filter = `blur(${eased * 10}px)`;
          style.opacity = 1 - eased;
          break;
        case 'pop-out':
          const pop = eased < 0.2 ? 1 + eased * 0.5 : 1.1 - (eased - 0.2) * 1.375;
          style.transform = `translate(-50%, -50%) scale(${Math.max(0, pop)})`;
          style.opacity = 1 - eased;
          break;
        case 'spiral-out':
          style.transform = `translate(-50%, -50%) rotate(${eased * 180}deg) scale(${1 - eased})`;
          style.opacity = 1 - eased;
          break;
        case 'swing-out':
          style.transform = `translate(-50%, -50%) rotate(${eased * 90}deg)`;
          style.transformOrigin = 'top center';
          style.opacity = 1 - eased;
          break;
      }
    }

    return style;
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  const camadaAtual = getCamadaSelecionadaObj();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Mediz Logo" className="h-10" />
          <div className="h-6 w-px bg-gray-600 mx-2"></div>
          <h1 className="text-xl font-bold text-gray-100">Motion Builder</h1>
          <input
            type="text"
            value={template.nome}
            onChange={(e) => setTemplate({ ...template, nome: e.target.value })}
            className="px-3 py-1 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Nome do template"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoadModal(true)}
            className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-bold hover:bg-gray-600 border border-gray-600 transition"
          >
            📂 Abrir
          </button>
          <button
            onClick={salvarTemplate}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
              isSaving 
                ? 'bg-blue-800 text-blue-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span> Salvando...
              </>
            ) : (
              <>💾 Salvar</>
            )}
          </button>
        </div>
      </header>

      {/* MODAL DE CARREGAR */}
      {showAssetPicker && assetPickerConfig && (
        <AssetPicker
          folder={assetPickerConfig.folder}
          onSelect={(url) => {
            assetPickerConfig.onSelect(url);
            setShowAssetPicker(false);
          }}
          onClose={() => setShowAssetPicker(false)}
        />
      )}

      {/* MODAL DE CARREGAR TEMPLATE */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">📂 Abrir Template</h2>
              <button 
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition"
              >
                &times;
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {templatesSalvos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum template salvo ainda.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templatesSalvos.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => carregarTemplate(t)}
                      className="border border-gray-700 bg-gray-750 rounded-lg p-3 hover:border-blue-500 hover:bg-gray-700 cursor-pointer transition relative group flex gap-3 items-center"
                    >
                      {/* Thumbnail Preview */}
                      <div className="w-16 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0 border border-gray-600">
                        {t.thumbnail ? (
                          <img src={t.thumbnail} alt={t.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl text-gray-500">🎬</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold mb-1 truncate text-gray-200" title={t.nome}>{t.nome}</div>
                        <div className="text-xs text-gray-400 mb-2">
                          {t.camadas.length} camadas • {t.duracao}s
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => deletarTemplateSalvo(t.id, e)}
                        className="absolute top-2 right-2 bg-red-900/50 text-red-400 p-1.5 rounded hover:bg-red-900 opacity-0 group-hover:opacity-100 transition"
                        title="Excluir Template"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* COLUNA ESQUERDA: Preview (Topo) + Timeline (Baixo) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* ÁREA DE PREVIEW (Cima) */}
          <div 
            ref={containerRef}
            className="flex-1 bg-gray-950 flex items-center justify-center p-8 overflow-hidden relative"
          >
            {!template.videoFundo ? (
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center bg-gray-800/50 backdrop-blur-sm">
                <p className="text-gray-400 mb-6 font-medium text-lg">Nenhum vídeo de fundo carregado</p>
                <div className="flex gap-4 justify-center">
                  <label className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-500 shadow-lg transition transform hover:scale-105 active:scale-95 inline-block font-medium">
                    📁 Upload Vídeo (MP4)
                    <input
                      type="file"
                      accept="video/mp4"
                      onChange={handleUploadVideo}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={() => openAssetPicker('backgrounds', (url) => setTemplate({ ...template, videoFundo: url }))}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-purple-500 shadow-lg transition transform hover:scale-105 active:scale-95 inline-block font-medium"
                  >
                    📚 Escolher da Biblioteca
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="relative shadow-2xl overflow-hidden bg-black ring-1 ring-gray-800"
                style={{
                  width: 1080,
                  height: 1920,
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* Vídeo de fundo */}
                <video
                  ref={videoRef}
                  src={template.videoFundo}
                  className="absolute inset-0 w-full h-full object-cover"
                  // controls removido para usar controles personalizados
                  onTimeUpdate={(e) => setTempoAtual(e.currentTarget.currentTime)}
                  onPlay={handleVideoPlay}
                  onPause={handleVideoPause}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Overlay das camadas (para visualização de posição) */}
                <div 
                  ref={previewRef}
                  className="absolute inset-0 overflow-hidden" 
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {template.camadas.map(camada => {
                    // Só mostra se estiver dentro do timing
                    const dentroDoTiming = tempoAtual >= camada.inicio && tempoAtual <= camada.fim;
                    
                    const animStyles = getAnimationStyles(camada, tempoAtual);
                    
                    return (
                      <div
                        key={camada.id}
                        className={`absolute border-2 cursor-move select-none ${ // Adicionado cursor-move e select-none
                          camadaSelecionada === camada.id 
                            ? 'border-blue-500 bg-blue-500/20 z-10' // z-10 para ficar em cima quando selecionado
                            : 'border-yellow-400 bg-yellow-400/10'
                        }`}
                        style={{
                          display: dentroDoTiming ? 'flex' : 'none',
                          left: `${camada.posicao.x}%`,
                          top: `${camada.posicao.y}%`,
                          width: camada.tamanho?.width || 100,
                          height: camada.tamanho?.height || 100,
                          ...animStyles,
                          // transform já está incluído no animStyles
                          fontSize: `${camada.estilos?.fontSize || 16}px`, // Garante unidade px
                          fontWeight: camada.estilos?.fontWeight,
                          fontFamily: camada.estilos?.fontFamily,
                          color: camada.estilos?.color,
                          textAlign: (camada.estilos?.textAlign as any) || 'center',
                          backgroundColor: camada.tipo === 'produto-preco' ? undefined : camada.estilos?.backgroundColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, camada.id, camada.posicao)}
                      >
                        {camada.conteudo?.url ? (
                          <img 
                            src={camada.conteudo.url} 
                            alt={camada.nome}
                            className="w-full h-full"
                            style={{ objectFit: (camada.estilos?.objectFit as any) || 'cover' }}
                          />
                        ) : (
                          camada.conteudo?.texto ? (
                            <span style={{ fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }}>
                              {camada.conteudo.texto}
                            </span>
                          ) : (
                            // Renderiza baseado no tipo para o preview
                            <div className="flex items-center justify-center gap-2 px-4 whitespace-nowrap">
                              {camada.tipo === 'whatsapp' && <span>📱</span>}
                              {camada.tipo === 'localizacao' && <span>📍</span>}
                              
                              <span style={{ fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }}>
                                {camada.conteudo?.texto || camada.nome}
                              </span>
                            </div>
                          )
                        )}

                        {/* Preço Overlay para 'produto-preco' */}
                        {camada.tipo === 'produto-preco' && (
                          <div style={{
                            position: 'absolute',
                            bottom: '5%',
                            left: '50%',
                            // Aplica offset e esconde se estiver no delay
                            // SE a camada estiver selecionada, mostra sempre (para facilitar edição)
                            transform: `translateX(calc(-50% + ${camada.textPosition?.x || 0}px)) translateY(${camada.textPosition?.y || 0}px)`,
                            opacity: (camadaSelecionada === camada.id || tempoAtual >= camada.inicio + (camada.textDelay || 0)) ? 1 : 0,
                            transition: 'opacity 0.3s', // Pequena transição para não ser brusco no preview
                            backgroundColor: camada.estilos?.backgroundColor || 'rgba(0,0,0,0.7)',
                            padding: '5px 20px',
                            borderRadius: 50,
                            whiteSpace: 'nowrap',
                            fontSize: `${camada.estilos?.fontSize || 60}px`,
                            fontWeight: camada.estilos?.fontWeight || 'bold',
                            color: camada.estilos?.color || '#FFD700',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            fontFamily: camada.estilos?.fontFamily,
                          }}>
                            {camada.conteudo?.texto || 'R$ 99,90'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none font-mono">
                  ⏱️ {tempoAtual.toFixed(1)}s / {template.duracao}s
                </div>
              </div>
            )}
          </div>

          {/* TIMELINE (Baixo - Fixa) */}
          <div className="h-64 bg-gray-800 border-t border-gray-700 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-20">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-850">
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Timeline</h2>
              <div className="flex gap-2">
                 <button 
                   onClick={togglePlay}
                   className="p-1.5 rounded hover:bg-gray-700 text-lg transition text-gray-200"
                   title={isPlaying ? "Pausar" : "Reproduzir"}
                 >
                   {isPlaying ? '⏸️' : '▶️'}
                 </button>
                 <button 
                   onClick={stopVideo}
                   className="p-1.5 rounded hover:bg-gray-700 text-lg transition text-gray-200"
                   title="Parar"
                 >
                   ⏹️
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar bg-gray-900">
              
              {/* Régua de tempo */}
              <div className="relative h-6 bg-gray-800 border-b border-gray-700 mb-4 select-none">
                {Array.from({ length: template.duracao + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 text-[10px] text-gray-500 flex flex-col items-center"
                    style={{ left: `${(i / template.duracao) * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-px h-2 bg-gray-600 mb-0.5"></div>
                    <span>{i}s</span>
                  </div>
                ))}
                
                {/* Agulha (Playhead) */}
                <div
                  className="absolute top-0 w-0.5 h-[500px] bg-red-500 z-50 pointer-events-none" // Agulha longa atravessando tudo
                  style={{ left: `${(tempoAtual / template.duracao) * 100}%` }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5px] -mt-1.5 shadow-sm"></div>
                </div>
              </div>

              {/* Lista de Camadas na Timeline */}
              <div className="space-y-1 pb-10">
                 {/* Fundo (Video Base) */}
                <div className="flex items-center group mb-2">
                  <div className="w-32 flex-shrink-0 text-xs font-semibold text-gray-400 truncate pr-2">
                    🎬 Vídeo Base
                  </div>
                  <div className="flex-1 relative h-6 bg-gray-800 rounded overflow-hidden border border-gray-700">
                    <div className="absolute inset-0 bg-gray-700 opacity-30 w-full"></div>
                    <div className="h-full bg-purple-900/40 border border-purple-700 rounded flex items-center px-2 text-purple-300 text-xs w-full">
                       0s - {template.duracao}s
                    </div>
                  </div>
                </div>

                {/* Camadas Dinâmicas */}
                {template.camadas.map((camada) => {
                  const tipoInfo = TIPOS_CAMADA.find(t => t.value === camada.tipo);
                  
                  return (
                    <div key={camada.id} className="flex items-center group relative hover:bg-gray-800 rounded transition-colors">
                      {/* Nome e Ações da Camada (Esquerda) */}
                      <div className="w-32 flex-shrink-0 flex items-center justify-between pr-2 border-r border-gray-700 mr-2">
                        <div 
                          className={`text-xs font-medium truncate cursor-pointer transition ${
                            camadaSelecionada === camada.id ? 'text-blue-400' : 'text-gray-300 hover:text-white'
                          }`}
                          onClick={() => setCamadaSelecionada(camada.id)}
                        >
                          {tipoInfo?.icon} {camada.nome}
                        </div>
                        <button
                          onClick={() => removerCamada(camada.id)}
                          className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover Camada"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      {/* Barra de Tempo (Direita) */}
                      <div className="flex-1 relative h-7 bg-gray-800/50 rounded border border-gray-700/50">
                         <div
                          className={`absolute h-full rounded-md flex items-center px-2 text-white text-[10px] cursor-pointer transition-all shadow-sm border ${
                            camadaSelecionada === camada.id
                              ? 'bg-blue-600 border-blue-400 z-10'
                              : 'bg-blue-900/60 border-blue-700 hover:bg-blue-800/80 opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            left: `${(camada.inicio / template.duracao) * 100}%`,
                            width: `${((camada.fim - camada.inicio) / template.duracao) * 100}%`,
                          }}
                          onClick={() => setCamadaSelecionada(camada.id)}
                        >
                          <div className="truncate w-full flex justify-between items-center">
                            <span>{ANIMACOES_ENTRADA.find(a => a.value === camada.animacaoEntrada.tipo)?.icon}</span>
                            <span className="opacity-40 mx-1">|</span>
                            <span>{ANIMACOES_SAIDA.find(a => a.value === camada.animacaoSaida?.tipo)?.icon}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Biblioteca + Configurações (Mantida Fixa) */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-0 flex flex-col shadow-xl z-30 overflow-y-auto custom-scrollbar">
          <div className="p-6">
            {/* Biblioteca de Camadas */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-gray-200">📚 Biblioteca</h3>
              <div className="grid grid-cols-2 gap-2">
              {TIPOS_CAMADA.map(tipo => (
                <button
                  key={tipo.value}
                  onClick={() => adicionarCamada(tipo.value)}
                  className="p-3 border border-gray-600 bg-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-600 transition text-gray-200"
                >
                  <div className="text-2xl mb-1">{tipo.icon}</div>
                  <div className="text-xs font-semibold">{tipo.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Configurações da Camada Selecionada */}
          {camadaAtual ? (
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold mb-4 text-blue-400 flex items-center gap-2">
                ⚙️ Configurações
                <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">{camadaAtual.tipo}</span>
              </h3>
              
              {/* Nome */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-400">Nome da Camada:</label>
                <input
                  type="text"
                  value={camadaAtual.nome}
                  onChange={(e) => atualizarCamada(camadaAtual.id, { nome: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Upload de Imagem (se aplicável) */}
              {(camadaAtual.tipo === 'produto-preco' || camadaAtual.tipo === 'localizacao') && (
                <div className="mb-4 p-3 bg-gray-900 rounded border border-gray-700">
                  <label className="block text-sm font-semibold mb-2 text-gray-300">🖼️ Imagem do Produto/Logo:</label>
                  
                  {!camadaAtual.conteudo?.url ? (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            atualizarCamada(camadaAtual.id, {
                              conteudo: { ...camadaAtual.conteudo, url: evt.target?.result as string }
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-900 file:text-blue-200
                        hover:file:bg-blue-800 cursor-pointer"
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 bg-gray-800 rounded overflow-hidden border border-gray-600">
                        <img 
                          src={camadaAtual.conteudo.url} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => atualizarCamada(camadaAtual.id, { 
                          conteudo: { ...camadaAtual.conteudo, url: undefined } 
                        })}
                        className="text-sm text-red-400 hover:text-red-300 underline"
                      >
                        Remover Imagem
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Ajuste da Imagem (Object Fit) */}
              {(camadaAtual.tipo === 'produto-preco' || camadaAtual.tipo === 'localizacao') && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1 text-gray-400">📐 Ajuste da Imagem:</label>
                  <div className="flex gap-2">
                    {['cover', 'contain', 'fill'].map((fit) => (
                      <button
                        key={fit}
                        onClick={() => atualizarCamada(camadaAtual.id, {
                          estilos: { ...camadaAtual.estilos, objectFit: fit as any }
                        })}
                        className={`px-3 py-1 text-sm border rounded transition ${
                          (camadaAtual.estilos?.objectFit || 'cover') === fit 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        {fit === 'cover' ? 'Cobrir' : fit === 'contain' ? 'Conter' : 'Esticar'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Texto do Conteúdo */}
              {(camadaAtual.tipo === 'produto-preco' || camadaAtual.tipo === 'preco' || camadaAtual.tipo === 'texto' || camadaAtual.tipo === 'whatsapp' || camadaAtual.tipo === 'localizacao') && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1 text-gray-400">
                    {camadaAtual.tipo === 'produto-preco' ? '📝 Preço Exemplo:' : '📝 Conteúdo do Texto:'}
                  </label>
                  <input
                    type="text"
                    value={camadaAtual.conteudo?.texto || ''}
                    onChange={(e) => atualizarCamada(camadaAtual.id, {
                      conteudo: { ...camadaAtual.conteudo, texto: e.target.value }
                    })}
                    placeholder={camadaAtual.tipo === 'produto-preco' ? "R$ 99,90" : "Digite o texto aqui..."}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Timing */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-400">⏱️ Timing:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Início (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={template.duracao}
                      value={isNaN(camadaAtual.inicio) ? '' : camadaAtual.inicio}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        atualizarCamada(camadaAtual.id, { inicio: isNaN(val) ? 0 : val });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Fim (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={template.duracao}
                      value={isNaN(camadaAtual.fim) ? '' : camadaAtual.fim}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        atualizarCamada(camadaAtual.id, { fim: isNaN(val) ? 0 : val });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Posição */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-400">📍 Posição (%):</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X (horizontal)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={isNaN(camadaAtual.posicao.x) ? '' : camadaAtual.posicao.x}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        atualizarCamada(camadaAtual.id, {
                          posicao: { ...camadaAtual.posicao, x: isNaN(val) ? 0 : val }
                        });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y (vertical)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={isNaN(camadaAtual.posicao.y) ? '' : camadaAtual.posicao.y}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        atualizarCamada(camadaAtual.id, {
                          posicao: { ...camadaAtual.posicao, y: isNaN(val) ? 0 : val }
                        });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tamanho */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-400">📏 Tamanho (px):</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Largura</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={isNaN(camadaAtual.tamanho.width) ? '' : camadaAtual.tamanho.width}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        atualizarCamada(camadaAtual.id, {
                          tamanho: { ...camadaAtual.tamanho, width: isNaN(val) ? 100 : val }
                        });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Altura</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={isNaN(camadaAtual.tamanho.height) ? '' : camadaAtual.tamanho.height}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        atualizarCamada(camadaAtual.id, {
                          tamanho: { ...camadaAtual.tamanho, height: isNaN(val) ? 100 : val }
                        });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Animação de Entrada */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-400">🎬 Animação de Entrada:</label>
                <select
                  value={camadaAtual.animacaoEntrada.tipo}
                  onChange={(e) => {
                    const newType = e.target.value as AnimationType;
                    const updates: Partial<Layer> = {
                      animacaoEntrada: {
                        ...camadaAtual.animacaoEntrada,
                        tipo: newType,
                      }
                    };
                    // Atualiza animação de saída para combinar, se estiver ativa
                    if (camadaAtual.animacaoSaida) {
                      updates.animacaoSaida = {
                        ...camadaAtual.animacaoSaida,
                        tipo: getMatchingExitAnimation(newType)
                      };
                    }
                    atualizarCamada(camadaAtual.id, updates);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded mb-2 text-white focus:border-blue-500 outline-none"
                >
                  {ANIMACOES_ENTRADA.map(anim => (
                    <option key={anim.value} value={anim.value}>
                      {anim.icon} {anim.label}
                    </option>
                  ))}
                </select>
                
                <label className="text-xs text-gray-500">Duração (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2"
                  value={isNaN(camadaAtual.animacaoEntrada.duracao) ? '' : camadaAtual.animacaoEntrada.duracao}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    atualizarCamada(camadaAtual.id, {
                      animacaoEntrada: {
                        ...camadaAtual.animacaoEntrada,
                        duracao: isNaN(val) ? 0.5 : val,
                      }
                    });
                  }}
                  className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Animação de Saída */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-400">🎬 Animação de Saída:</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={!!camadaAtual.animacaoSaida}
                    onChange={(e) => {
                      if (e.target.checked) {
                        atualizarCamada(camadaAtual.id, {
                          animacaoSaida: {
                            tipo: getMatchingExitAnimation(camadaAtual.animacaoEntrada.tipo),
                            duracao: 0.5,
                          }
                        });
                      } else {
                        atualizarCamada(camadaAtual.id, {
                          animacaoSaida: undefined,
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Ativar animação de saída</span>
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
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded mb-2 text-white focus:border-blue-500 outline-none"
                    >
                      {ANIMACOES_SAIDA.map(anim => (
                        <option key={anim.value} value={anim.value}>
                          {anim.icon} {anim.label}
                        </option>
                      ))}
                    </select>
                    
                    <label className="text-xs text-gray-500">Duração (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2"
                      value={isNaN(camadaAtual.animacaoSaida.duracao) ? '' : camadaAtual.animacaoSaida.duracao}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        atualizarCamada(camadaAtual.id, {
                          animacaoSaida: {
                            ...camadaAtual.animacaoSaida!,
                            duracao: isNaN(val) ? 0.5 : val,
                          }
                        });
                      }}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </>
                )}
              </div>

              {/* Configurações Específicas do Texto (Preço) dentro do Produto */}
              {camadaAtual.tipo === 'produto-preco' && (
                <div className="mb-4 border-t border-gray-700 pt-4">
                  <label className="block text-sm font-semibold mb-2 text-yellow-500">🏷️ Posição e Timing do Preço:</label>
                  
                  <div className="mb-2">
                    <label className="text-xs text-gray-500">Atraso na entrada (segundos)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={camadaAtual.textDelay || 0}
                      onChange={(e) => atualizarCamada(camadaAtual.id, { textDelay: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">Tempo após o início da camada para o preço aparecer</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Offset X (px)</label>
                      <input
                        type="number"
                        step="1"
                        value={camadaAtual.textPosition?.x || 0}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          textPosition: { ...camadaAtual.textPosition, x: parseFloat(e.target.value) || 0, y: camadaAtual.textPosition?.y || 0 }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Offset Y (px)</label>
                      <input
                        type="number"
                        step="1"
                        value={camadaAtual.textPosition?.y || 0}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          textPosition: { ...camadaAtual.textPosition, x: camadaAtual.textPosition?.x || 0, y: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Estilos de Texto (se for tipo texto/preço) */}
              {(camadaAtual.tipo === 'produto-preco' || camadaAtual.tipo === 'preco' || camadaAtual.tipo === 'texto' || camadaAtual.tipo === 'whatsapp' || camadaAtual.tipo === 'localizacao') && (
                <div className="mb-4 border-t border-gray-700 pt-4">
                  <label className="block text-sm font-semibold mb-2 text-gray-400">🎨 Estilos de Texto:</label>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Tamanho da Fonte</label>
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
                        className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500">Cor do Texto</label>
                      <div className="flex gap-2">
                         <input
                          type="color"
                          value={camadaAtual.estilos?.color || '#FFFFFF'}
                          onChange={(e) => atualizarCamada(camadaAtual.id, {
                            estilos: {
                              ...camadaAtual.estilos,
                              color: e.target.value,
                            }
                          })}
                          className="w-10 h-10 border border-gray-700 rounded bg-transparent p-1 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={camadaAtual.estilos?.color || '#FFFFFF'}
                          onChange={(e) => atualizarCamada(camadaAtual.id, {
                            estilos: {
                              ...camadaAtual.estilos,
                              color: e.target.value,
                            }
                          })}
                          className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-gray-500">Cor do Fundo</label>
                        {camadaAtual.estilos?.backgroundColor && camadaAtual.estilos.backgroundColor !== 'transparent' && (
                          <button 
                            onClick={() => atualizarCamada(camadaAtual.id, {
                              estilos: { ...camadaAtual.estilos, backgroundColor: 'transparent' }
                            })}
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={camadaAtual.estilos?.backgroundColor !== 'transparent' ? camadaAtual.estilos?.backgroundColor : '#ffffff'}
                          onChange={(e) => atualizarCamada(camadaAtual.id, {
                            estilos: {
                              ...camadaAtual.estilos,
                              backgroundColor: e.target.value,
                            }
                          })}
                          className="w-10 h-10 border border-gray-700 rounded bg-transparent p-1 cursor-pointer"
                        />
                         <input
                          type="text"
                          value={camadaAtual.estilos?.backgroundColor !== 'transparent' ? camadaAtual.estilos?.backgroundColor : 'Transparent'}
                          onChange={(e) => atualizarCamada(camadaAtual.id, {
                            estilos: {
                              ...camadaAtual.estilos,
                              backgroundColor: e.target.value,
                            }
                          })}
                          className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none uppercase"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-500">Peso da Fonte</label>
                      <select
                        value={camadaAtual.estilos?.fontWeight || 'normal'}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          estilos: {
                            ...camadaAtual.estilos,
                            fontWeight: e.target.value,
                          }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Negrito</option>
                        <option value="900">Extra Negrito</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-xs text-gray-500">Fonte (Font Family)</label>
                      <select
                        value={camadaAtual.estilos?.fontFamily || 'Arial, sans-serif'}
                        onChange={(e) => atualizarCamada(camadaAtual.id, {
                          estilos: {
                            ...camadaAtual.estilos,
                            fontFamily: e.target.value,
                          }
                        })}
                        className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 outline-none"
                      >
                        {FONTES_DISPONIVEIS.map(font => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Deletar */}
              <button
                onClick={() => removerCamada(camadaAtual.id)}
                className="w-full bg-red-900/50 text-red-200 border border-red-900 py-2 rounded-lg font-bold hover:bg-red-900 mt-4 transition"
              >
                🗑️ Deletar Camada
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-700 pt-6 text-center text-gray-500">
              Selecione uma camada na timeline para configurar
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}