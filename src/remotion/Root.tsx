import { Composition } from "remotion";
import { Main } from "./MyComp/Main";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { NextLogo } from "./MyComp/NextLogo";

// ========== NOVO: Importa o VideoMotion ==========
import { VideoMotion } from "./VideoMotion";

// ========== TEMPLATE DE TESTE (sem vídeo de fundo real) ==========
const templateTeste = {
  videoFundo: "", // Vazio = vai usar fundo colorido
  camadas: [
    // Produto 1 (0-5 segundos)
    {
      id: "produto-1",
      tipo: "produto-preco" as const,
      nome: "Produto 1",
      inicio: 0,
      fim: 5,
      posicao: { x: 50, y: 40 },
      tamanho: { width: 400, height: 500 },
      animacaoEntrada: {
        tipo: "slide-right",
        duracao: 0.5,
      },
      animacaoSaida: {
        tipo: "fade-out",
        duracao: 0.3,
      },
      estilos: {
        fontSize: 60,
        fontWeight: "bold",
        color: "#FFD700",
      },
    },
    
    // Produto 2 (5-10 segundos)
    {
      id: "produto-2",
      tipo: "produto-preco" as const,
      nome: "Produto 2",
      inicio: 5,
      fim: 10,
      posicao: { x: 50, y: 40 },
      tamanho: { width: 400, height: 500 },
      animacaoEntrada: {
        tipo: "zoom-explosion",
        duracao: 0.6,
      },
      animacaoSaida: {
        tipo: "slide-out-left",
        duracao: 0.4,
      },
      estilos: {
        fontSize: 60,
        fontWeight: "bold",
        color: "#FFD700",
      },
    },
    
    // Produto 3 (10-15 segundos)
    {
      id: "produto-3",
      tipo: "produto-preco" as const,
      nome: "Produto 3",
      inicio: 10,
      fim: 15,
      posicao: { x: 50, y: 40 },
      tamanho: { width: 400, height: 500 },
      animacaoEntrada: {
        tipo: "bounce",
        duracao: 0.7,
      },
      animacaoSaida: {
        tipo: "fade-out",
        duracao: 0.3,
      },
      estilos: {
        fontSize: 60,
        fontWeight: "bold",
        color: "#FFD700",
      },
    },
    
    // WhatsApp (fixo, aparece em 2s)
    {
      id: "whatsapp",
      tipo: "whatsapp" as const,
      nome: "WhatsApp",
      inicio: 2,
      fim: 15,
      posicao: { x: 50, y: 90 },
      tamanho: { width: 400, height: 60 },
      animacaoEntrada: {
        tipo: "slide-down",
        duracao: 0.5,
      },
      estilos: {
        fontSize: 40,
        color: "#25D366",
        backgroundColor: "rgba(0,0,0,0.6)",
      },
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Composições originais */}
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
      
      {/* ========== NOVO: VideoMotion - Teste de Animações ========== */}
      <Composition
        id="MedizMotionTeste"
        component={VideoMotion as React.FC<any>}
        durationInFrames={450} // 15 segundos a 30fps
        fps={30}
        width={1080}
        height={1920} // Vertical (Stories/Reels)
        defaultProps={{
          template: templateTeste,
          dados: {
            produtos: [
              {
                imagem: "", // Vazio = vai usar placeholder colorido
                nome: "Dipirona 500mg",
                preco: "9,90",
              },
              {
                imagem: "",
                nome: "Paracetamol 750mg",
                preco: "12,50",
              },
              {
                imagem: "",
                nome: "Ibuprofeno 600mg",
                preco: "15,90",
              },
            ],
            whatsapp: "(45) 99999-9999",
            localizacao: "Rua das Flores, 123 - Centro",
          },
        }}
      />
    </>
  );
};