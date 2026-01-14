/**
 * ============================================
 * PROJECT SERVICE - CRUD Enterprise
 * ============================================
 * 
 * Operações com auditoria completa
 * Nível: Tech Lead Itaú
 */

import { Transaction } from 'sequelize';
import { sequelize } from '../../config/database';
import Project from '../../api/models/Project';
import { logger } from '../infrastructure/logging/Logger';
import { auditService, AuditAction } from '../infrastructure/audit/AuditService';
import {
  ProjectNotFoundError,
  ResourceOwnershipError,
  ValidationError
} from '../domain/errors/DomainErrors';

interface CreateProjectDTO {
  name: string;
  htmlCode: string;
  projectPlan?: string;
}

interface UpdateProjectDTO {
  name?: string;
  htmlCode?: string;
  projectPlan?: string;
}

interface RequestContext {
  userId: string;
  ip: string;
  userAgent: string;
  requestId: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ProjectService {
  private static instance: ProjectService;

  private constructor() {}

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }


  /**
   * CREATE - Cria novo projeto
   */
  public async create(
    dto: CreateProjectDTO,
    context: RequestContext
  ): Promise<Project> {
    // 1. Validação
    this.validateCreateDTO(dto);

    // 2. Cria projeto em transação
    const project = await sequelize.transaction(async (t: Transaction) => {
      const newProject = await (Project as any).create({
        name: dto.name.trim(),
        htmlCode: dto.htmlCode,
        projectPlan: dto.projectPlan,
        userId: context.userId
      }, { transaction: t });

      return newProject;
    });

    // 3. Auditoria
    await auditService.logResourceAccess({
      action: AuditAction.PROJECT_CREATED,
      userId: context.userId,
      resourceId: project.id,
      resourceType: 'project',
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId
    });

    logger.info('Project created', {
      projectId: project.id,
      userId: context.userId,
      requestId: context.requestId
    });

    return project;
  }

  /**
   * READ - Busca projeto por ID (com verificação de ownership)
   */
  public async getById(
    projectId: string,
    context: RequestContext
  ): Promise<Project> {
    const project = await (Project as any).findByPk(projectId);

    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }

    // Verifica ownership
    if (project.userId !== context.userId) {
      logger.security('Unauthorized project access attempt', {
        projectId,
        ownerId: project.userId,
        attemptedBy: context.userId,
        ip: context.ip
      });
      
      await auditService.logSecurityEvent({
        action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
        metadata: {
          resourceType: 'project',
          resourceId: projectId,
          attemptedBy: context.userId
        }
      });
      
      throw new ResourceOwnershipError('project');
    }

    // Log de acesso
    await auditService.logResourceAccess({
      action: AuditAction.PROJECT_ACCESSED,
      userId: context.userId,
      resourceId: projectId,
      resourceType: 'project',
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId
    });

    return project;
  }

  /**
   * LIST - Lista projetos do usuário com paginação
   */
  public async listByUser(
    context: RequestContext,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Project>> {
    // Sanitiza parâmetros
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const offset = (page - 1) * limit;

    const { count, rows } = await (Project as any).findAndCountAll({
      where: { userId: context.userId },
      order: [['updatedAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * UPDATE - Atualiza projeto com auditoria de mudanças
   */
  public async update(
    projectId: string,
    dto: UpdateProjectDTO,
    context: RequestContext
  ): Promise<Project> {
    // 1. Validação
    this.validateUpdateDTO(dto);

    // 2. Busca projeto (já verifica ownership)
    const project = await this.getById(projectId, context);

    // 3. Guarda valores antigos para auditoria
    const oldValues = {
      name: project.name,
      htmlCode: project.htmlCode,
      projectPlan: project.projectPlan
    };

    // 4. Atualiza em transação
    await sequelize.transaction(async (t: Transaction) => {
      if (dto.name !== undefined) project.name = dto.name.trim();
      if (dto.htmlCode !== undefined) project.htmlCode = dto.htmlCode;
      if (dto.projectPlan !== undefined) project.projectPlan = dto.projectPlan;
      
      await project.save({ transaction: t });
    });

    // 5. Auditoria com diff
    await auditService.log({
      action: AuditAction.PROJECT_UPDATED,
      userId: context.userId,
      targetId: projectId,
      targetType: 'project',
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      oldValue: oldValues,
      newValue: {
        name: project.name,
        htmlCode: project.htmlCode,
        projectPlan: project.projectPlan
      }
    });

    logger.info('Project updated', {
      projectId,
      userId: context.userId,
      requestId: context.requestId
    });

    return project;
  }

  /**
   * DELETE - Soft delete com auditoria
   */
  public async delete(
    projectId: string,
    context: RequestContext
  ): Promise<void> {
    // 1. Busca projeto (já verifica ownership)
    const project = await this.getById(projectId, context);

    // 2. Guarda dados para auditoria
    const deletedData = {
      id: project.id,
      name: project.name,
      userId: project.userId
    };

    // 3. Delete em transação
    await sequelize.transaction(async (t: Transaction) => {
      await project.destroy({ transaction: t });
    });

    // 4. Auditoria
    await auditService.log({
      action: AuditAction.PROJECT_DELETED,
      userId: context.userId,
      targetId: projectId,
      targetType: 'project',
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      oldValue: deletedData
    });

    logger.info('Project deleted', {
      projectId,
      userId: context.userId,
      requestId: context.requestId
    });
  }

  // ============================================
  // VALIDAÇÕES
  // ============================================

  private validateCreateDTO(dto: CreateProjectDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!dto.name || dto.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Project name is required' });
    } else if (dto.name.length > 255) {
      errors.push({ field: 'name', message: 'Project name must be less than 255 characters' });
    }

    if (!dto.htmlCode) {
      errors.push({ field: 'htmlCode', message: 'HTML code is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private validateUpdateDTO(dto: UpdateProjectDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (dto.name !== undefined && dto.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Project name cannot be empty' });
    }

    if (dto.name !== undefined && dto.name.length > 255) {
      errors.push({ field: 'name', message: 'Project name must be less than 255 characters' });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}

export const projectService = ProjectService.getInstance();
