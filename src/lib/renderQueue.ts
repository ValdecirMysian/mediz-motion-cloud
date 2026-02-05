import fs from 'fs';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

// Tipos
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface RenderJob {
  id: string;
  status: JobStatus;
  template: any;
  dados: any;
  createdAt: number;
  completedAt?: number;
  outputUrl?: string;
  error?: string;
  position?: number;
}

// Configuração
const DATA_DIR = path.join(process.cwd(), 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');
const RENDERS_DIR = path.join(process.cwd(), 'public', 'renders');
const AVERAGE_RENDER_TIME_MS = 45000; // 45 segundos por vídeo (estimativa)

// Garante diretórios
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

const TEMP_ASSETS_DIR = path.join(process.cwd(), 'public', 'temp_assets');
if (!fs.existsSync(TEMP_ASSETS_DIR)) fs.mkdirSync(TEMP_ASSETS_DIR, { recursive: true });

// Helper para salvar Base64 como arquivo temporário
function extractBase64ToFiles(obj: any): any {
  if (!obj) return obj;
  
  // Se for array, processa cada item
  if (Array.isArray(obj)) {
    return obj.map(item => extractBase64ToFiles(item));
  }
  
  // Se for objeto, processa cada chave
  if (typeof obj === 'object') {
    const newObj: any = { ...obj };
    
    for (const key in newObj) {
      const value = newObj[key];
      
      if (typeof value === 'string' && value.startsWith('data:')) {
        // É base64! Salva em arquivo
        try {
          const matches = value.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const type = matches[1];
            const data = matches[2];
            
            let ext = 'bin';
            if (type.includes('image/png')) ext = 'png';
            else if (type.includes('image/jpeg')) ext = 'jpg';
            else if (type.includes('video/mp4')) ext = 'mp4';
            
            const filename = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;
            const filePath = path.join(TEMP_ASSETS_DIR, filename);
            
            fs.writeFileSync(filePath, Buffer.from(data, 'base64') as unknown as Uint8Array);
            
            // Substitui base64 por URL local absoluta (file protocol)
            // Remotion aceita file:/// paths
            // No Windows precisamos garantir que comece com file:///
            const absolutePath = filePath.replace(/\\/g, '/');
            newObj[key] = `file://${absolutePath.startsWith('/') ? '' : '/'}${absolutePath}`;
            
            console.log(`📦 [Queue] Base64 extraído para: ${filename}`);
          }
        } catch (e) {
          console.error('Erro ao extrair base64:', e);
          // Se falhar, mantém original
        }
      } else if (typeof value === 'object') {
        newObj[key] = extractBase64ToFiles(value);
      }
    }
    return newObj;
  }
  
  return obj;
}

class QueueManager {
  private queue: RenderJob[] = [];
  private isProcessing = false;
  private bundleLocation: string | null = null;

  constructor() {
    this.loadQueue();
    // Tenta processar itens pendentes ao iniciar (caso tenha restartado)
    if (this.queue.some(j => j.status === 'pending')) {
      this.processQueue();
    }
  }

  // Carrega fila do disco
  private loadQueue() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
        this.queue = JSON.parse(data);
        
        let changed = false;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        this.queue.forEach(job => {
          // 1. Se estava 'processing' no restart, marca como falha (Crash protection)
          if (job.status === 'processing') {
            job.status = 'failed';
            job.error = 'Processamento interrompido (Servidor reiniciou)';
            changed = true;
          }
          
          // 2. Se está 'pending' há muito tempo (> 5 min), cancela (Stale protection)
          // Isso limpa jobs fantasmas que ficaram travados de sessões anteriores
          if (job.status === 'pending' && (now - job.createdAt > fiveMinutes)) {
            job.status = 'failed';
            job.error = 'Expirado na fila (Timeout)';
            changed = true;
          }
        });

        if (changed) this.saveQueue();
      }
    } catch (e) {
      console.error('Erro ao carregar fila:', e);
      this.queue = [];
    }
  }

  // Salva fila no disco (versão leve, sem template completo)
  private saveQueue() {
    try {
      // Opcional: Limpar jobs muito antigos para não inchar o arquivo
      const oneDayAgo = Date.now() - 86400000;
      
      const cleanQueue = this.queue
        .filter(j => j.createdAt > oneDayAgo || j.status === 'pending' || j.status === 'processing')
        .map(j => {
          // CLONE para não afetar o objeto em memória que está sendo processado
          const jobClone = { ...j };
          
          // Se já terminou ou falhou, não precisamos mais do template gigante no disco
          if (jobClone.status === 'completed' || jobClone.status === 'failed') {
             jobClone.template = null; 
             jobClone.dados = null;
          }
          
          // Mesmo para pendentes, removemos a thumbnail se ela for base64 gigante
          if (jobClone.template && jobClone.template.thumbnail && jobClone.template.thumbnail.length > 1000) {
             jobClone.template = { ...jobClone.template, thumbnail: undefined };
          }

          return jobClone;
        });
      
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(cleanQueue, null, 2));
    } catch (e) {
      console.error('Erro ao salvar fila:', e);
    }
  }

  // Adiciona novo job
  public addJob(template: any, dados: any): RenderJob {
    const job: RenderJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      template,
      dados,
      createdAt: Date.now()
    };

    this.queue.push(job);
    this.saveQueue();
    
    // Dispara processamento em background (fire and forget)
    this.processQueue();

    return this.getPublicJobInfo(job);
  }

  // Retorna info do job (sem dados pesados)
  public getJob(id: string): RenderJob | undefined {
    const job = this.queue.find(j => j.id === id);
    if (!job) return undefined;
    return this.getPublicJobInfo(job);
  }

  private getPublicJobInfo(job: RenderJob): RenderJob {
    // Calcula posição na fila (apenas para pendentes)
    let position = 0;
    if (job.status === 'pending') {
      position = this.queue.filter(j => j.status === 'pending' && j.createdAt < job.createdAt).length + 1;
      // Se tiver um processando, ele conta como "na frente"
      if (this.isProcessing) position += 1;
    }

    return {
      id: job.id,
      status: job.status,
      template: null, // Não retorna o template inteiro pra economizar banda
      dados: null,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      outputUrl: job.outputUrl,
      error: job.error,
      position: position
    };
  }

  // Loop de processamento
  private async processQueue() {
    if (this.isProcessing) return; // Já tem um worker rodando
    if (this.queue.filter(j => j.status === 'pending').length === 0) return; // Nada pra fazer

    this.isProcessing = true;

    try {
      // Pega o próximo
      const jobIndex = this.queue.findIndex(j => j.status === 'pending');
      if (jobIndex === -1) {
        this.isProcessing = false;
        return;
      }

      const job = this.queue[jobIndex];
      job.status = 'processing';
      this.saveQueue();

      console.log(`🔄 [Queue] Processando job ${job.id}...`);

      try {
        // === LÓGICA DE RENDERIZAÇÃO ===
        
        console.log(`🔍 [Queue] Validando dados do job ${job.id}...`);

        // Verifica se os dados são serializáveis
        try {
          const templateStr = JSON.stringify(job.template);
          const dadosStr = JSON.stringify(job.dados);
          
          console.log(`📦 [Queue] Template size: ${(templateStr.length / 1024).toFixed(2)} KB`);
          console.log(`📦 [Queue] Dados size: ${(dadosStr.length / 1024).toFixed(2)} KB`);
          
          // Se tiver imagens base64, elas vão estar MUITO grandes
          if (dadosStr.length > 1000000) { // > 1MB
            console.warn('⚠️ [Queue] DADOS MUITO GRANDES! Provavelmente imagens base64 pesadas');
          }

          // EXTRAÇÃO DE ASSETS: Converte base64 para arquivos temporários
          console.log('📦 [Queue] Verificando e extraindo assets Base64...');
          job.template = extractBase64ToFiles(job.template);
          job.dados = extractBase64ToFiles(job.dados);

          // CLEANUP: Remove thumbnail do template antes de renderizar (não é usada no vídeo e causa timeout)
          if (job.template.thumbnail && job.template.thumbnail.length > 1000) {
            console.log('🧹 [Queue] Removendo thumbnail gigante do template para evitar timeout...');
            job.template.thumbnail = undefined;
          }
          
          // console.log(`📋 [Queue] Template preview:`, templateStr.substring(0, 300));
          // console.log(`📋 [Queue] Dados preview:`, dadosStr.substring(0, 300));
        } catch (err) {
          console.error('❌ [Queue] Erro ao serializar dados:', err);
          throw new Error('Dados não serializáveis');
        }

        console.log(`🎬 [Queue] Selecionando composição...`);

        // 1. Bundle (Cacheado na instância)
        if (!this.bundleLocation) {
          console.log('📦 [Queue] Criando Bundle inicial...');
          const entryPoint = path.join(process.cwd(), 'src/remotion/index.ts');
          this.bundleLocation = await bundle({
            entryPoint,
            webpackOverride: (config) => config,
          });
        }

        // 2. Composição
        const composition = await selectComposition({
          serveUrl: this.bundleLocation,
          id: 'MedizMotionTeste',
          inputProps: {
            template: job.template,
            dados: job.dados,
          },
        });

        // 3. Render
        const fileName = `video-${job.id}.mp4`;
        const outputPath = path.join(RENDERS_DIR, fileName);

        await renderMedia({
          composition,
          serveUrl: this.bundleLocation,
          codec: 'h264',
          outputLocation: outputPath,
          inputProps: {
            template: job.template,
            dados: job.dados,
          },
          concurrency: 1, // Importante: Serializado
          verbose: true,
          timeoutInMilliseconds: 120000, // Aumenta timeout para 120s
          chromiumOptions: {
            gl: 'swangle', // Usa renderização de software para evitar crashes de GPU em VPS
          }
        });

        // Sucesso
        job.status = 'completed';
        job.outputUrl = `/renders/${fileName}`;
        job.completedAt = Date.now();
        console.log(`✅ [Queue] Job ${job.id} concluído!`);

      } catch (err: any) {
        console.error(`❌ [Queue] Job ${job.id} falhou:`, err);
        job.status = 'failed';
        job.error = err.message || 'Erro desconhecido na renderização';
      }

      this.saveQueue();

    } catch (fatalError) {
      console.error('🔥 [Queue] Erro fatal no worker:', fatalError);
    } finally {
      this.isProcessing = false;
      // Chama recursivamente para pegar o próximo
      this.processQueue();
    }
  }

  // Estimativa de tempo
  public getEstimatedTime(jobId: string): string {
    const job = this.getJob(jobId);
    if (!job || job.status === 'completed') return 'Pronto';
    if (job.status === 'failed') return 'Falhou';

    // Posição * Tempo Médio
    // Se position = 1 (é o próximo ou está processando), estimamos 45s
    const position = job.position || 1;
    const totalSeconds = (position * AVERAGE_RENDER_TIME_MS) / 1000;

    if (totalSeconds < 60) return `${Math.ceil(totalSeconds)} segundos`;
    return `${Math.ceil(totalSeconds / 60)} minutos`;
  }
}

// Exporta instância única (Singleton)
// No Next.js dev mode, isso pode ser recriado, mas em produção (start) mantém.
// Para garantir singleton no dev mode, usamos globalThis.
const globalForQueue = global as unknown as { renderQueue: QueueManager };

export const renderQueue = globalForQueue.renderQueue || new QueueManager();

if (process.env.NODE_ENV !== 'production') globalForQueue.renderQueue = renderQueue;