import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ContainerConfig {
  name: string;
  image: string;
  port: number;
  envVars: Record<string, string>;
  cpuLimit?: string;
  memoryLimit?: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  ports: string;
  created: string;
}

/**
 * @description Serviço real de integração com Docker Engine
 * Orquestra containers via Docker CLI (compatível com Docker Socket)
 */
export class DockerService {
  private superDomain: string;

  constructor() {
    this.superDomain = process.env.SUPER_DOMAIN || 'sce.local';
  }

  /**
   * Verifica se Docker está disponível
   */
  async checkHealth(): Promise<boolean> {
    try {
      await execAsync('docker info');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build de imagem a partir de um Dockerfile
   */
  async buildImage(
    contextPath: string,
    imageName: string,
    onLog: (msg: string) => void
  ): Promise<string> {
    const tag = `${imageName}:${Date.now()}`;
    onLog(`🔨 Iniciando build: ${tag}`);

    return new Promise((resolve, reject) => {
      const buildProcess = exec(
        `docker build -t ${tag} ${contextPath}`,
        { maxBuffer: 50 * 1024 * 1024 }
      );

      buildProcess.stdout?.on('data', (data) => onLog(data.toString()));
      buildProcess.stderr?.on('data', (data) => onLog(data.toString()));

      buildProcess.on('close', (code) => {
        if (code === 0) {
          onLog(`✅ Build concluído: ${tag}`);
          resolve(tag);
        } else {
          reject(new Error(`Build falhou com código ${code}`));
        }
      });
    });
  }

  /**
   * Cria e inicia um container
   */
  async runContainer(config: ContainerConfig): Promise<string> {
    const {
      name,
      image,
      port,
      envVars,
      cpuLimit = '0.5',
      memoryLimit = '512m'
    } = config;

    // Montar env vars
    const envFlags = Object.entries(envVars)
      .map(([k, v]) => `-e ${k}="${v}"`)
      .join(' ');

    // Labels para Traefik (reverse proxy)
    const labels = [
      `--label "traefik.enable=true"`,
      `--label "traefik.http.routers.${name}.rule=Host(\`${name}.${this.superDomain}\`)"`,
      `--label "traefik.http.services.${name}.loadbalancer.server.port=${port}"`,
    ].join(' ');

    const cmd = `docker run -d \
      --name ${name} \
      --restart unless-stopped \
      --cpus=${cpuLimit} \
      --memory=${memoryLimit} \
      -p ${port} \
      ${envFlags} \
      ${labels} \
      --network sce-network \
      ${image}`;

    const { stdout } = await execAsync(cmd);
    return stdout.trim(); // Container ID
  }

  /**
   * Para e remove um container
   */
  async stopContainer(name: string): Promise<void> {
    try {
      await execAsync(`docker stop ${name}`);
      await execAsync(`docker rm ${name}`);
    } catch {
      // Container pode não existir
    }
  }

  /**
   * Reinicia um container
   */
  async restartContainer(name: string): Promise<void> {
    await execAsync(`docker restart ${name}`);
  }

  /**
   * Lista containers do SCE
   */
  async listContainers(): Promise<ContainerInfo[]> {
    const { stdout } = await execAsync(
      `docker ps -a --filter "network=sce-network" --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}"`
    );

    if (!stdout.trim()) return [];

    return stdout.trim().split('\n').map(line => {
      const [id, name, status, ports, created] = line.split('|');
      return { id, name, status, ports, created };
    });
  }

  /**
   * Obtém logs de um container
   */
  async getLogs(name: string, lines = 100): Promise<string> {
    const { stdout } = await execAsync(`docker logs --tail ${lines} ${name}`);
    return stdout;
  }

  /**
   * Obtém métricas de um container
   */
  async getStats(name: string): Promise<{ cpu: number; memory: number }> {
    try {
      const { stdout } = await execAsync(
        `docker stats ${name} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}"`
      );
      const [cpuStr, memStr] = stdout.trim().split('|');
      return {
        cpu: parseFloat(cpuStr.replace('%', '')) || 0,
        memory: parseFloat(memStr.split('/')[0].replace('MiB', '').trim()) || 0
      };
    } catch {
      return { cpu: 0, memory: 0 };
    }
  }

  /**
   * Clona repositório Git
   */
  async cloneRepo(repoUrl: string, branch: string, destPath: string): Promise<void> {
    await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} ${destPath}`);
  }

  /**
   * Cria a rede do SCE se não existir
   */
  async ensureNetwork(): Promise<void> {
    try {
      await execAsync('docker network create sce-network');
    } catch {
      // Rede já existe
    }
  }
}
