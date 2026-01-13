// Kernel API service for Nexus P2P integration

const API_BASE = '/api/v1/kernel';

interface KernelStatus {
  enabled: boolean;
  kernel_url: string;
  linked: boolean;
  linked_user: string;
  local_peer_id: string;
  queue_size: number;
}

interface LoginResponse {
  status: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface PlanLimits {
  max_peers: number;
  max_file_size_mb: number;
  max_communities: number;
  history_days: number;
  video_calls: boolean;
  priority_relay: boolean;
}

// Get kernel bridge status
export async function getKernelStatus(): Promise<KernelStatus> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to get kernel status');
  return res.json();
}

// Enable kernel bridge
export async function enableKernel(
  kernelUrl: string,
  appKey?: string,
  appSecret?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kernel_url: kernelUrl,
      app_key: appKey || '',
      app_secret: appSecret || '',
    }),
  });
  if (!res.ok) throw new Error('Failed to enable kernel');
}

// Disable kernel bridge
export async function disableKernel(): Promise<void> {
  const res = await fetch(`${API_BASE}/disable`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to disable kernel');
}

// Login to kernel
export async function loginToKernel(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
}

// Logout from kernel
export async function logoutFromKernel(): Promise<void> {
  const res = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to logout');
}

// Link P2P identity to kernel user
export async function linkIdentity(): Promise<{ linked_user: string }> {
  const res = await fetch(`${API_BASE}/link`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to link identity');
  }
  return res.json();
}

// Get kernel user profile
export async function getKernelProfile(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/profile`);
  if (!res.ok) throw new Error('Failed to get profile');
  return res.json();
}

// Get plan limits
export async function getPlanLimits(): Promise<PlanLimits> {
  const res = await fetch(`${API_BASE}/limits`);
  if (!res.ok) throw new Error('Failed to get limits');
  return res.json();
}

// Check capability
export async function checkCapability(
  capability: string
): Promise<{ capability: string; allowed: boolean }> {
  const res = await fetch(`${API_BASE}/capability?name=${capability}`);
  if (!res.ok) throw new Error('Failed to check capability');
  return res.json();
}

// Get checkout URL for upgrade
export async function getCheckoutUrl(
  planId: string = 'pro',
  successUrl?: string,
  cancelUrl?: string
): Promise<{ checkout_url: string }> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      success_url: successUrl || `${window.location.origin}/settings?success=true`,
      cancel_url: cancelUrl || `${window.location.origin}/settings?canceled=true`,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create checkout');
  }
  return res.json();
}
