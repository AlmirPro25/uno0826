/**
 * ============================================
 * PROJECT CONTROLLER - Enterprise Grade
 * ============================================
 * 
 * CRUD completo com auditoria
 * Nível: Tech Lead Itaú
 */

import { Request, Response, NextFunction } from 'express';
import { projectService } from '../../core/services/ProjectService';

/**
 * POST /api/projects
 * Cria novo projeto
 */
export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, htmlCode, projectPlan } = req.body;

    const project = await projectService.create(
      { name, htmlCode, projectPlan },
      {
        userId: req.user!.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        requestId: req.requestId
      }
    );

    res.status(201).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        htmlCode: project.htmlCode,
        projectPlan: project.projectPlan,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects
 * Lista projetos do usuário com paginação
 */
export const listProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await projectService.listByUser(
      {
        userId: req.user!.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        requestId: req.requestId
      },
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result.data.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      pagination: result.pagination,
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Busca projeto por ID
 */
export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await projectService.getById(id, {
      userId: req.user!.id,
      ip: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      requestId: req.requestId
    });

    res.status(200).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        htmlCode: project.htmlCode,
        projectPlan: project.projectPlan,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * Atualiza projeto
 */
export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, htmlCode, projectPlan } = req.body;

    const project = await projectService.update(
      id,
      { name, htmlCode, projectPlan },
      {
        userId: req.user!.id,
        ip: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        requestId: req.requestId
      }
    );

    res.status(200).json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        htmlCode: project.htmlCode,
        projectPlan: project.projectPlan,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Remove projeto
 */
export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await projectService.delete(id, {
      userId: req.user!.id,
      ip: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      requestId: req.requestId
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
};
