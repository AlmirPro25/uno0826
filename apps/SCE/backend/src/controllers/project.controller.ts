
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProjectService, createProjectSchema } from '../services/project.service.js';

const projectService = new ProjectService();

export class ProjectController {
  /**
   * Cria um novo projeto
   * O ownerId vem do token JWT (usuário autenticado via PROST-QS)
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createProjectSchema.parse(request.body);
    const ownerId = request.user?.id;
    
    if (!ownerId) {
      return reply.status(401).send({ error: 'Usuário não autenticado' });
    }
    
    const project = await projectService.createProject({ ...data, ownerId });
    return reply.status(201).send(project);
  }

  /**
   * Lista projetos do usuário autenticado
   * Admin vê todos, usuário comum vê apenas os seus
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    const isAdmin = ['admin', 'super_admin', 'ADMIN'].includes(request.user?.role || '');
    
    const projects = isAdmin 
      ? await projectService.listAll()
      : await projectService.listByOwner(userId!);
      
    return reply.send(projects);
  }

  /**
   * Busca um projeto específico
   * Valida ownership: só dono ou admin pode ver
   */
  async getOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user?.id;
    const isAdmin = ['admin', 'super_admin', 'ADMIN'].includes(request.user?.role || '');
    
    const project = await projectService.getById(id);
    
    if (!project) {
      return reply.status(404).send({ error: 'Projeto não encontrado.' });
    }
    
    // Validação de ownership
    if (!isAdmin && project.ownerId !== userId) {
      return reply.status(403).send({ error: 'Acesso negado. Projeto não pertence a você.' });
    }
    
    return reply.send(project);
  }
  
  /**
   * Valida se usuário pode fazer deploy no projeto
   */
  static async canDeploy(projectId: string, userId: string, role: string): Promise<boolean> {
    const project = await projectService.getById(projectId);
    if (!project) return false;
    
    const isAdmin = ['admin', 'super_admin', 'ADMIN'].includes(role);
    return isAdmin || project.ownerId === userId;
  }
}
