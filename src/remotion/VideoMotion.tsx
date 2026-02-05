import { AbsoluteFill, Video, Img, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { getLayerAnimation } from './motion-animations';

// ============================================================================
// TIPOS
// ============================================================================

type AnimationType =
  | 'scale-in' | 'zoom-explosion' | 'bounce' | 'rotate-in' | 'flip-in-y' | 'elastic-scale' | 'blur-in' | 'pop-in' | 'spiral-in' | 'swing-in'
  | 'fade-out' | 'slide-out-right' | 'slide-out-left' | 'slide-out-up' | 'slide-out-down'
  | 'scale-out' | 'zoom-implosion' | 'rotate-out' | 'flip-out-y' | 'blur-out' | 'pop-out' | 'spiral-out' | 'swing-out';

interface LayerData {
  id: string;
  tipo: 'produto-preco' | 'preco' | 'whatsapp' | 'localizacao' | 'texto';
  nome: string;
  // Timing
  inicio: number;
  fim: number;
  // Posição e tamanho
  posicao: { x: number; y: number };
  tamanho: { width: number; height: number };
  // Animações
  animacaoEntrada: {
    tipo: AnimationType;
    duracao: number;
  };
  animacaoSaida?: {
    tipo: AnimationType;
    duracao: number;
  };
  // Estilos
  estilos?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    backgroundColor?: string;
    objectFit?: 'cover' | 'contain' | 'fill';
    fontFamily?: string;
  };
  textDelay?: number;
  textPosition?: { x: number; y: number };
  conteudo?: {
    url?: string;
    texto?: string;
  };
}

interface TemplateConfig {
  videoFundo: string;
  camadas: LayerData[];
}

interface DadosCliente {
  // Dados que o cliente preenche
  produtos?: Array<{
    imagem: string;
    nome: string;
    preco: string;
  }>;
  whatsapp?: string;
  localizacao?: string;
  textos?: Record<string, string>; // textos customizados por ID da camada
}

interface VideoMotionProps {
  template: TemplateConfig;
  dados: DadosCliente;
}

// ============================================================================
// COMPONENTE DE CAMADA INDIVIDUAL
// ============================================================================

const LayerComponent: React.FC<{
  layer: LayerData;
  dados: DadosCliente;
  layerIndex: number; // ← NOVO: recebe o índice
}> = ({ layer, dados, layerIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calcula animação
  const animation = getLayerAnimation(frame, fps, {
    inicio: layer.inicio,
    fim: layer.fim,
    animacaoEntrada: layer.animacaoEntrada as any,
    animacaoSaida: layer.animacaoSaida as any,
  });

  if (!animation.visible) return null;

  // Estilos base
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${layer.posicao.x}%`,
    top: `${layer.posicao.y}%`,
    width: layer.tamanho.width,
    height: layer.tamanho.height,
    transform: `translate(-50%, -50%) 
                perspective(500px)
                translateX(${animation.translateX || 0}%) 
                translateY(${animation.translateY || 0}%) 
                scale(${animation.scale ?? 1})
                rotate(${animation.rotate || 0}deg)
                rotateY(${animation.rotateY || 0}deg)`,
    opacity: animation.opacity ?? 1,
    filter: animation.blur ? `blur(${animation.blur}px)` : undefined,
    fontFamily: layer.estilos?.fontFamily,
    backgroundColor: layer.tipo === 'produto-preco' ? undefined : layer.estilos?.backgroundColor,
  };

  // Renderiza baseado no tipo
  if (layer.tipo === 'produto-preco') {
    // Usa o layerIndex passado (conta apenas camadas tipo produto-preco)
    const produto = dados.produtos?.[layerIndex];
    
    if (!produto) return null;

    // Lógica de Animação do Texto (Preço)
    const textStartFrame = (layer.inicio + (layer.textDelay || 0)) * fps;
    const animationDuration = 15; // 0.5s em 30fps

    const textOpacity = interpolate(
      frame,
      [textStartFrame, textStartFrame + animationDuration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const textScale = interpolate(
      frame,
      [textStartFrame, textStartFrame + animationDuration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.back(1.5) }
    );

    // Offsets
    const offsetX = layer.textPosition?.x || 0;
    const offsetY = layer.textPosition?.y || 0;

    return (
      <div style={baseStyle}>
        {/* Imagem do produto - Ocupa 100% agora */}
        <div style={{
          width: '100%',
          height: '100%', 
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 8,
        }}>
          {produto.imagem ? (
            <Img
              src={produto.imagem}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: (layer.estilos?.objectFit as any) || 'cover', // Usa configuração do Admin
              }}
            />
          ) : (
            // Placeholder colorido
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}>
              📦
            </div>
          )}
        </div>

        {/* Preço - Overlay Absoluto embaixo */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: `translateX(calc(-50% + ${offsetX}px)) translateY(${offsetY}px) scale(${textScale})`,
          opacity: textOpacity,
          backgroundColor: layer.estilos?.backgroundColor || 'rgba(0,0,0,0.7)',
          padding: '5px 20px',
          borderRadius: 50,
          whiteSpace: 'nowrap',
          fontSize: layer.estilos?.fontSize || 60,
          fontWeight: layer.estilos?.fontWeight || 'bold',
          color: layer.estilos?.color || '#FFD700',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        }}>
          R$ {produto.preco}
        </div>
      </div>
    );
  }

  if (layer.tipo === 'preco') {
    const produto = dados.produtos?.[layerIndex];
    
    if (!produto) return null;

    return (
      <div style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: layer.estilos?.fontSize || 80,
        fontWeight: layer.estilos?.fontWeight || 'bold',
        color: layer.estilos?.color || '#FFD700',
        textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
      }}>
        R$ {produto.preco}
      </div>
    );
  }

  if (layer.tipo === 'whatsapp') {
    // Fallback: Se não tiver dados dinâmicos, tenta usar o texto da camada (template)
    const whatsapp = dados.whatsapp || layer.conteudo?.texto;
    if (!whatsapp) return null;

    return (
      <div style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: layer.estilos?.fontSize || 40,
        fontWeight: layer.estilos?.fontWeight || 'bold',
        color: layer.estilos?.color || '#25D366',
        backgroundColor: layer.estilos?.backgroundColor || 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: '10px 20px',
      }}>
        📱 {whatsapp}
      </div>
    );
  }

  if (layer.tipo === 'localizacao') {
    // Fallback: Se não tiver dados dinâmicos, tenta usar o texto da camada (template)
    // Tenta: 1. dados.textos[layer.id], 2. dados.localizacao (legacy), 3. template default
    const localizacao = dados.textos?.[layer.id] || dados.localizacao || layer.conteudo?.texto;
    
    if (!localizacao) return null;

    return (
      <div style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: layer.estilos?.fontSize || 30,
        fontWeight: layer.estilos?.fontWeight || 'normal',
        color: layer.estilos?.color || '#FFFFFF',
        backgroundColor: layer.estilos?.backgroundColor || 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        padding: '8px 16px',
      }}>
        📍 {localizacao}
      </div>
    );
  }

  if (layer.tipo === 'texto') {
    // Tenta: 1. dados.textos[layer.id], 2. template default
    const texto = dados.textos?.[layer.id] || layer.conteudo?.texto || layer.nome;

    return (
      <div style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: layer.estilos?.fontSize || 40,
        fontWeight: layer.estilos?.fontWeight || 'normal',
        color: layer.estilos?.color || '#FFFFFF',
        textAlign: (layer.estilos?.textAlign as any) || 'center',
      }}>
        {texto}
      </div>
    );
  }

  return null;
};

// ============================================================================
// COMPONENTE PRINCIPAL DO VÍDEO
// ============================================================================

export const VideoMotion = ({ template, dados }: VideoMotionProps) => {
  // Contador para índice de produtos
  let produtoIndex = 0;

  return (
    <AbsoluteFill>
      {/* Vídeo de fundo OU fundo colorido se não tiver vídeo */}
      {template.videoFundo ? (
        <Video
          src={template.videoFundo}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        // Fundo gradiente animado (placeholder)
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            color: 'white',
            fontSize: 40,
            fontWeight: 'bold',
            opacity: 0.3,
            textAlign: 'center',
            padding: 40,
          }}>
            🎬 Fundo do After Effects<br/>
            <span style={{ fontSize: 20 }}>
              (Faça upload no Motion Builder)
            </span>
          </div>
        </div>
      )}

      {/* Camadas dinâmicas */}
      {template.camadas.map((layer) => {
        // Incrementa contador apenas para camadas de produto
        const currentProdutoIndex = (layer.tipo === 'produto-preco' || layer.tipo === 'preco') 
          ? produtoIndex++ 
          : 0;

        return (
          <LayerComponent
            key={layer.id}
            layer={layer}
            dados={dados}
            layerIndex={currentProdutoIndex}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================================
// EXEMPLO DE USO NO ROOT.TSX
// ============================================================================

/*
import { Composition } from 'remotion';
import { VideoMotion } from './VideoMotion';

// Template configurado pelo admin
const templateOfertaDia = {
  videoFundo: 'https://cdn.mediz.digital/fundos/oferta-dia.mp4',
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
      estilos: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFD700',
      },
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
      estilos: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#FFD700',
      },
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
      estilos: {
        fontSize: 40,
        color: '#25D366',
        backgroundColor: 'rgba(0,0,0,0.6)',
      },
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="OfertaDia"
        component={VideoMotion}
        durationInFrames={450} // 15 segundos a 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          template: templateOfertaDia,
          dados: {
            produtos: [
              { imagem: 'url-produto-1.png', nome: 'Dipirona', preco: '9,90' },
              { imagem: 'url-produto-2.png', nome: 'Paracetamol', preco: '12,50' },
            ],
            whatsapp: '(45) 99999-9999',
            localizacao: 'Rua das Flores, 123 - Centro',
          },
        }}
      />
    </>
  );
};
*/