import { spring, interpolate, Easing } from 'remotion';

// ============================================================================
// TIPOS
// ============================================================================

export type AnimationType = 
  | 'fade-in' | 'slide-right' | 'slide-left' | 'slide-up' | 'slide-down'
| 'scale-in' | 'zoom-explosion' | 'bounce' | 'rotate-in' | 'flip-in-y' | 'flip-in-x'
  | 'elastic-scale' | 'blur-in' | 'pop-in' | 'spiral-in' | 'swing-in'
  | 'fade-out' | 'slide-out-right' | 'slide-out-left' | 'slide-out-up' | 'slide-out-down'
  | 'scale-out' | 'zoom-implosion' | 'rotate-out' | 'flip-out-y' | 'flip-out-x' | 'blur-out'
  | 'pop-out' | 'spiral-out' | 'swing-out';

interface AnimationParams {
  frame: number;
  fps: number;
  startFrame: number;
  durationInFrames: number;
}

// ============================================================================
// ANIMAÇÕES DE ENTRADA
// ============================================================================

export const fadeIn = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 1;
  
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
};

export const slideRight = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return -100;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [-100, 0]);
};

export const slideLeft = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 100;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [100, 0]);
};

export const slideUp = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 100;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [100, 0]);
};

export const slideDown = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return -100;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [-100, 0]);
};

export const scaleIn = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 1;
  
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
};

export const zoomExplosion = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 1;
  
  return spring({
    frame: frame - startFrame,
    fps,
    config: { 
      damping: 20,  // Menos damping = mais "explosivo"
      mass: 0.5,
    },
    durationInFrames,
  });
};

export const bounce = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return -100;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { 
      damping: 10,  // Baixo damping = muito bounce
      mass: 1,
      stiffness: 100,
    },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [-100, 0]);
};

export const rotateIn = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return -180;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [-180, 0]);
};

export const flipInY = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 90;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [90, 0]);
};

export const elasticScale = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 1;
  
  return spring({
    frame: frame - startFrame,
    fps,
    config: { 
      damping: 10,
      mass: 0.8,
      stiffness: 150,
    },
    durationInFrames,
  });
};

export const blurIn = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 10;
  if (frame > startFrame + durationInFrames) return 0;
  
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [10, 0],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.ease) }
  );
};

export const popIn = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 1;

  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames * 0.6, startFrame + durationInFrames],
    [0, 1.1, 1],
    { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 1, 0.5, 1) }
  );
};

export const spiralIn = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return -180;
  if (frame > startFrame + durationInFrames) return 0;

  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [-180, 0],
    { extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) }
  );
};

export const swingIn = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return -90;
  if (frame > startFrame + durationInFrames) return 0;

  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [-90, 0],
    { extrapolateRight: 'clamp', easing: Easing.elastic(1) }
  );
};

// ============================================================================
// ANIMAÇÕES DE SAÍDA
// ============================================================================

export const fadeOut = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 1;
  if (frame > startFrame + durationInFrames) return 0;
  
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [1, 0],
    { extrapolateRight: 'clamp' }
  );
};

export const slideOutRight = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 100;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [0, 100]);
};

export const slideOutLeft = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return -100;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [0, -100]);
};

export const slideOutUp = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return -100;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [0, -100]);
};

export const slideOutDown = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 100;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [0, 100]);
};

export const scaleOut = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 1;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [1, 0]);
};

export const zoomImplosion = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 1;
  if (frame > startFrame + durationInFrames) return 0;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { 
      damping: 20,
      mass: 0.5,
    },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [1, 0]);
};

export const rotateOut = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 180;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [0, 180]);
};

export const flipOutY = ({ frame, fps, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 90;
  
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 100 },
    durationInFrames,
  });
  
  return interpolate(progress, [0, 1], [0, 90]);
};

export const blurOut = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 10;
  
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 10],
    { extrapolateRight: 'clamp', easing: Easing.in(Easing.ease) }
  );
};

export const popOut = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 1;
  if (frame > startFrame + durationInFrames) return 0;

  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames * 0.4, startFrame + durationInFrames],
    [1, 1.1, 0],
    { extrapolateRight: 'clamp', easing: Easing.in(Easing.ease) }
  );
};

export const spiralOut = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 180;

  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 180],
    { extrapolateRight: 'clamp', easing: Easing.in(Easing.exp) }
  );
};

export const swingOut = ({ frame, startFrame, durationInFrames }: AnimationParams): number => {
  if (frame < startFrame) return 0;
  if (frame > startFrame + durationInFrames) return 90;

  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 90],
    { extrapolateRight: 'clamp', easing: Easing.in(Easing.back(1.5)) }
  );
};

// ============================================================================
// FUNÇÃO PRINCIPAL - Aplica a animação baseada no tipo
// ============================================================================

export const getAnimationValue = (
  type: AnimationType,
  params: AnimationParams
): { opacity?: number; translateX?: number; translateY?: number; scale?: number; rotate?: number; rotateY?: number; blur?: number } => {
  // const { frame } = params;
  
  // Animações de Entrada
  if (type === 'fade-in') {
    return { opacity: fadeIn(params) };
  }
  
  if (type === 'slide-right') {
    return { 
      opacity: fadeIn(params),
      translateX: slideRight(params) 
    };
  }
  
  if (type === 'slide-left') {
    return { 
      opacity: fadeIn(params),
      translateX: slideLeft(params) 
    };
  }
  
  if (type === 'slide-up') {
    return { 
      opacity: fadeIn(params),
      translateY: slideUp(params) 
    };
  }
  
  if (type === 'slide-down') {
    return { 
      opacity: fadeIn(params),
      translateY: slideDown(params) 
    };
  }
  
  if (type === 'scale-in') {
    return { 
      opacity: fadeIn(params),
      scale: scaleIn(params) 
    };
  }
  
  if (type === 'zoom-explosion') {
    return { 
      opacity: fadeIn(params),
      scale: zoomExplosion(params) 
    };
  }
  
  if (type === 'bounce') {
    return { 
      opacity: fadeIn(params),
      translateY: bounce(params) 
    };
  }

  if (type === 'rotate-in') {
    return {
      opacity: fadeIn(params),
      rotate: rotateIn(params),
      scale: scaleIn(params)
    };
  }

  if (type === 'flip-in-y') {
    return {
      opacity: fadeIn(params),
      rotateY: flipInY(params)
    };
  }

  if (type === 'elastic-scale') {
    return {
      opacity: fadeIn(params),
      scale: elasticScale(params)
    };
  }

  if (type === 'blur-in') {
    return {
      opacity: fadeIn(params),
      blur: blurIn(params)
    };
  }

  if (type === 'pop-in') {
    return {
      opacity: fadeIn(params),
      scale: popIn(params)
    };
  }

  if (type === 'spiral-in') {
    return {
      opacity: fadeIn(params),
      scale: scaleIn(params),
      rotate: spiralIn(params)
    };
  }

  if (type === 'swing-in') {
    return {
      opacity: fadeIn(params),
      rotate: swingIn(params)
    };
  }
  
  // Animações de Saída
  if (type === 'fade-out') {
    return { opacity: fadeOut(params) };
  }
  
  if (type === 'slide-out-right') {
    return { 
      opacity: fadeOut(params),
      translateX: slideOutRight(params) 
    };
  }
  
  if (type === 'slide-out-left') {
    return { 
      opacity: fadeOut(params),
      translateX: slideOutLeft(params) 
    };
  }
  
  if (type === 'slide-out-up') {
    return { 
      opacity: fadeOut(params),
      translateY: slideOutUp(params) 
    };
  }

  if (type === 'slide-out-down') {
    return {
      opacity: fadeOut(params),
      translateY: slideOutDown(params)
    };
  }
  
  if (type === 'scale-out') {
    return { 
      opacity: fadeOut(params),
      scale: scaleOut(params) 
    };
  }
  
  if (type === 'zoom-implosion') {
    return { 
      opacity: fadeOut(params),
      scale: zoomImplosion(params) 
    };
  }

  if (type === 'rotate-out') {
    return {
      opacity: fadeOut(params),
      rotate: rotateOut(params),
      scale: scaleOut(params)
    };
  }

  if (type === 'flip-out-y') {
    return {
      opacity: fadeOut(params),
      rotateY: flipOutY(params)
    };
  }

  if (type === 'blur-out') {
    return {
      opacity: fadeOut(params),
      blur: blurOut(params)
    };
  }

  if (type === 'pop-out') {
    return {
      opacity: fadeOut(params),
      scale: popOut(params)
    };
  }

  if (type === 'spiral-out') {
    return {
      opacity: fadeOut(params),
      scale: scaleOut(params),
      rotate: spiralOut(params)
    };
  }

  if (type === 'swing-out') {
    return {
      opacity: fadeOut(params),
      rotate: swingOut(params)
    };
  }
  
  return {};
};

// ============================================================================
// HELPER - Calcula o progresso de uma camada considerando entrada E saída
// ============================================================================

export interface LayerTimingConfig {
  inicio: number;          // segundos
  fim: number;            // segundos
  animacaoEntrada: {
    tipo: AnimationType;
    duracao: number;      // segundos
  };
  animacaoSaida?: {
    tipo: AnimationType;
    duracao: number;      // segundos
  };
}

export const getLayerAnimation = (
  frame: number,
  fps: number,
  config: LayerTimingConfig
) => {
  const inicioFrame = config.inicio * fps;
  const fimFrame = config.fim * fps;
  const duracaoEntradaFrames = config.animacaoEntrada.duracao * fps;
  const duracaoSaidaFrames = config.animacaoSaida?.duracao ? config.animacaoSaida.duracao * fps : 0;
  
  // Antes de começar
  if (frame < inicioFrame) {
    return { opacity: 0, translateX: 0, translateY: 0, scale: 0, visible: false };
  }
  
  // Depois de terminar
  if (frame > fimFrame) {
    return { opacity: 0, translateX: 0, translateY: 0, scale: 0, visible: false };
  }
  
  // Durante a animação de entrada
  if (frame <= inicioFrame + duracaoEntradaFrames) {
    const animacao = getAnimationValue(config.animacaoEntrada.tipo, {
      frame,
      fps,
      startFrame: inicioFrame,
      durationInFrames: duracaoEntradaFrames,
    });
    
    return { ...animacao, visible: true };
  }
  
  // Durante a animação de saída (se existir)
  if (config.animacaoSaida && frame >= fimFrame - duracaoSaidaFrames) {
    const animacao = getAnimationValue(config.animacaoSaida.tipo, {
      frame,
      fps,
      startFrame: fimFrame - duracaoSaidaFrames,
      durationInFrames: duracaoSaidaFrames,
    });
    
    return { ...animacao, visible: true };
  }
  
  // Estado visível normal (entre entrada e saída)
  return { opacity: 1, translateX: 0, translateY: 0, scale: 1, visible: true };
};