
// src/services/GitHubService.ts

export interface GitHubUserProfile {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string | null;
}

export interface GitHubRepoDetails {
  name: string;
  description?: string;
  private?: boolean;
  // homepage?: string;
}

export interface GitHubFile {
  path: string;
  content: string; // Base64 encoded content for actual API, but string here for simulation
}

export interface CreateRepoResponse {
  success: boolean;
  repoUrl?: string;
  error?: string;
}

export interface ExchangeTokenResponse {
    accessToken: string | null;
    error?: string;
}

/**
 * Simulates initiating the GitHub OAuth flow.
 * In a real app, this would redirect the user to GitHub's authorization URL.
 */
export const initiateGitHubOAuth = (): void => {
  console.log("GitHubService: Simulating initiation of GitHub OAuth flow...");
  // Real implementation would be:
  // const clientId = 'YOUR_GITHUB_OAUTH_APP_CLIENT_ID';
  // const redirectUri = 'YOUR_APP_CALLBACK_URL';
  // const scope = 'repo public_repo user:email'; // Or other scopes
  // window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  alert("Simulação: Redirecionando para o GitHub para autorização.\n(Em uma aplicação real, você seria redirecionado para o site do GitHub agora.)");
};

/**
 * Simulates exchanging an authorization code for an access token.
 * In a real app, this would make a POST request to your backend,
 * which then securely communicates with GitHub.
 * @param code The authorization code received from GitHub.
 * @returns A promise that resolves to a simulated access token or an error.
 */
export const exchangeCodeForToken = async (code: string): Promise<ExchangeTokenResponse> => {
  console.log(`GitHubService: Simulating exchange of auth code "${code}" for access token...`);
  // Simulate backend call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (code === "dummy_auth_code_from_github") {
        const simulatedToken = `simulated_gh_token_${Date.now()}`;
        console.log(`GitHubService: Simulated access token obtained: ${simulatedToken}`);
        resolve({ accessToken: simulatedToken });
      } else {
        console.error("GitHubService: Simulated token exchange failed - invalid code.");
        resolve({ accessToken: null, error: "Código de autorização inválido (simulado)." });
      }
    }, 1000);
  });
};

/**
 * Simulates fetching the authenticated user's profile from GitHub.
 * @param token The simulated access token.
 * @returns A promise that resolves to a simulated user profile or null.
 */
export const getUserProfile = async (token: string): Promise<GitHubUserProfile | null> => {
  console.log(`GitHubService: Simulating fetching user profile with token "${token}"...`);
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (token.startsWith("simulated_gh_token_")) {
        const dummyUser: GitHubUserProfile = {
          login: `github-user-${Math.floor(Math.random() * 10000)}`,
          id: Math.floor(Math.random() * 1000000),
          avatar_url: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 10000)}?v=4`,
          html_url: "https://github.com/mockuser",
          name: "Mock GitHub User"
        };
        console.log("GitHubService: Simulated user profile fetched:", dummyUser);
        resolve(dummyUser);
      } else {
        console.error("GitHubService: Simulated user profile fetch failed - invalid token.");
        resolve(null);
      }
    }, 1000);
  });
};

/**
 * Simulates creating a new GitHub repository and pushing files.
 * In a real app, this would make requests to your backend, which then uses the GitHub API.
 * @param token The simulated access token.
 * @param repoDetails Details for the new repository.
 * @param files An array of files to create in the repository.
 * @returns A promise that resolves to a success/failure response.
 */
export const createGitHubRepo = async (
  token: string,
  repoDetails: GitHubRepoDetails,
  files: GitHubFile[]
): Promise<CreateRepoResponse> => {
  console.log(`GitHubService: Simulating creation of repo "${repoDetails.name}" with token "${token}" and ${files.length} files...`);
  // Simulate API calls for repo creation and file pushing
  return new Promise((resolve) => {
    setTimeout(() => {
      if (token.startsWith("simulated_gh_token_")) {
        const repoUrl = `https://github.com/mockuser/${repoDetails.name}`;
        console.log(`GitHubService: Simulated repository "${repoDetails.name}" created at ${repoUrl}.`);
        files.forEach(file => console.log(`  - Simulated push of ${file.path}`));
        resolve({ success: true, repoUrl });
      } else {
        console.error("GitHubService: Simulated repo creation failed - invalid token.");
        resolve({ success: false, error: "Token inválido (simulado)." });
      }
    }, 2000);
  });
};
