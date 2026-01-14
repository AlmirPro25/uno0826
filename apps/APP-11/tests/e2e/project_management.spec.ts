
import { test, expect } from '@playwright/test';

test.describe('Project Management Flows', () => {
  const testUser = {
    email: `project_user_${Date.now()}@example.com`,
    password: 'projectpassword123',
    name: 'Project User',
  };

  test.beforeAll(async ({ request }) => {
    // Register and login a user before all project tests
    await request.post('/api/v1/auth/register', {
      data: {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      },
    });
  });

  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in for each test
    await page.goto('/login');
    await page.fill('input[data-aid="login-email-input"]', testUser.email);
    await page.fill('input[data-aid="login-password-input"]', testUser.password);
    await page.click('button[data-aid="login-submit-button"]');
    await page.waitForURL(/dashboard/);
  });

  test('should allow a user to create a new project', async ({ page }) => {
    await page.click('a[href="/dashboard/new-project"]'); // Navigate to new project page
    await expect(page).toHaveURL(/new-project/);

    const projectName = `My Awesome Project ${Date.now()}`;
    const projectDescription = 'A detailed description for my new AI-generated website.';
    const projectRequirement1 = 'Homepage with hero section';
    const projectRequirement2 = 'Contact form with validation';
    const projectTargetAudience = 'Small business owners';

    await page.fill('input[name="name"]', projectName);
    await page.fill('textarea[name="description"]', projectDescription);

    // Fill first requirement
    await page.fill('input[name="requirements.0"]', projectRequirement1);
    // Add another requirement
    await page.click('button:has-text("Adicionar Requisito")');
    await page.fill('input[name="requirements.1"]', projectRequirement2);

    // Select a style preference
    await page.click('div[role="combobox"]'); // Click on the select trigger
    await page.locator('div[role="option"]:has-text("Minimalist")').click(); // Select an option

    await page.fill('input[name="targetAudience"]', projectTargetAudience);

    await page.click('button[data-aid="create-project-submit-button"]');

    // Expect success toast
    await expect(page.locator('[data-aid="toast-description"]')).toContainText(`O projeto "${projectName}" foi iniciado.`);

    // Expect to be redirected to projects list
    await page.waitForURL(/dashboard\/projects/);
    await expect(page).toHaveURL(/dashboard\/projects/);

    // Verify the new project is listed
    await expect(page.locator(`h3:has-text("${projectName}")`)).toBeVisible();
    await expect(page.locator(`p:has-text("${projectDescription}")`)).toBeVisible();
  });

  test('should view project details', async ({ page, request }) => {
    // First, create a project via API to ensure it exists
    const createProjectData = {
      name: `View Project Test ${Date.now()}`,
      description: 'Description for viewing project details.',
      requirements: ['Viewable content'],
      stylePreference: 'MODERN',
    };
    const authResponse = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('accessToken'),
        user: JSON.parse(localStorage.getItem('userProfile') || '{}'),
      };
    });
    const createRes = await request.post(`/api/v1/users/${authResponse.user.id}/projects`, {
      headers: {
        Authorization: `Bearer ${authResponse.accessToken}`,
      },
      data: createProjectData,
    });
    const newProject = await createRes.json();
    const projectId = newProject.id;

    await page.goto('/dashboard/projects');
    await page.locator(`h3:has-text("${createProjectData.name}")`).click(); // Click on project card
    await page.waitForURL(new RegExp(`/dashboard/projects/${projectId}`));

    // Verify project details are displayed
    await expect(page.locator('h1')).toHaveText(createProjectData.name);
    await expect(page.locator(`p:has-text("${createProjectData.description}")`)).toBeVisible();
    await expect(page.locator(`li:has-text("${createProjectData.requirements[0]}")`)).toBeVisible();
    await expect(page.locator(`p:has-text("${createProjectData.stylePreference.replace('_', ' ')}")`)).toBeVisible();
  });

  test('should allow deleting a project', async ({ page, request }) => {
    // First, create a project via API to ensure it exists
    const createProjectData = {
      name: `Delete Project Test ${Date.now()}`,
      description: 'Description for deleting project.',
      requirements: ['Deletable content'],
      stylePreference: 'MINIMALIST',
    };
    const authResponse = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('accessToken'),
        user: JSON.parse(localStorage.getItem('userProfile') || '{}'),
      };
    });
    const createRes = await request.post(`/api/v1/users/${authResponse.user.id}/projects`, {
      headers: {
        Authorization: `Bearer ${authResponse.accessToken}`,
      },
      data: createProjectData,
    });
    const newProject = await createRes.json();
    const projectId = newProject.id;

    await page.goto(`/dashboard/projects/${projectId}`);
    await expect(page.locator('h1')).toHaveText(createProjectData.name);

    // Click delete button and confirm
    await page.click('button:has-text("Excluir Projeto")');
    await page.click('button:has-text("Excluir")'); // Confirm deletion in dialog

    // Expect success toast
    await expect(page.locator('[data-aid="toast-description"]')).toContainText('O projeto "'+ createProjectData.name +'" foi excluído com sucesso.');

    // Expect to be redirected to projects list
    await page.waitForURL(/dashboard\/projects/);
    await expect(page).toHaveURL(/dashboard\/projects/);

    // Verify the project is no longer listed
    await expect(page.locator(`h3:has-text("${createProjectData.name}")`)).not.toBeVisible();
  });
});
