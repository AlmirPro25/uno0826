/**
 * PROST-QS Kernel SDK - TypeScript Definitions
 */

export interface KernelConfig {
  baseURL?: string;
  token?: string;
  onTokenExpired?: () => void;
  debug?: boolean;
}

export interface Identity {
  user_id: string;
  primary_phone: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface BillingAccount {
  account_id: string;
  user_id: string;
  stripe_customer_id: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_type: string;
  reference_id: string;
  created_at: string;
}

export interface Ledger {
  balance: number;
  currency: string;
  entries: LedgerEntry[];
}

export interface PaymentIntent {
  id: string;
  account_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  account_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  account_id: string;
  name: string;
  status: string;
  bid_amount: number;
  total_spent: number;
  created_at: string;
}

export interface Budget {
  id: string;
  account_id: string;
  type: string;
  total_amount: number;
  spent_amount: number;
  status: string;
  created_at: string;
}

export interface Agent {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  type: 'observer' | 'operator' | 'executor';
  status: 'active' | 'suspended';
  created_at: string;
}

export interface AgentDecision {
  id: string;
  agent_id: string;
  domain: string;
  proposed_action: string;
  target_entity: string;
  payload: string;
  reason: string;
  risk_score: number;
  status: 'proposed' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface OTPRequest {
  verification_id: string;
  expires_in_seconds: number;
  channel: string;
  dev_otp?: string;
}

export interface OTPVerification {
  success: boolean;
  user_id: string;
  session_id: string;
  token: string;
  is_new_user: boolean;
}

export interface LoginResult {
  verificationId: string;
  expiresIn: number;
  devOTP?: string;
  verify: (code: string) => Promise<OTPVerification>;
}

export class KernelError extends Error {
  code: string;
  status: number;
  data: any;
  constructor(message: string, code: string, status: number, data?: any);
}

export class KernelHttpClient {
  constructor(config?: KernelConfig);
  setToken(token: string): void;
  clearToken(): void;
  isAuthenticated(): boolean;
  request<T = any>(endpoint: string, options?: RequestInit): Promise<T>;
  get<T = any>(endpoint: string, options?: RequestInit): Promise<T>;
  post<T = any>(endpoint: string, body: any, options?: RequestInit): Promise<T>;
  put<T = any>(endpoint: string, body: any, options?: RequestInit): Promise<T>;
  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T>;
}

export class AuthModule {
  constructor(client: KernelHttpClient);
  requestOTP(phone: string, channel?: string): Promise<OTPRequest>;
  verifyOTP(code: string, verificationId?: string): Promise<OTPVerification>;
  login(phone: string, channel?: string): Promise<LoginResult>;
  logout(): void;
  isAuthenticated(): boolean;
}

export class IdentityModule {
  constructor(client: KernelHttpClient);
  me(useCache?: boolean): Promise<Identity>;
  clearCache(): void;
  verifyToken(): Promise<boolean>;
}

export class BillingModule {
  constructor(client: KernelHttpClient);
  getAccount(): Promise<BillingAccount>;
  createAccount(email: string, phone: string): Promise<BillingAccount>;
  getLedger(): Promise<Ledger>;
  getBalance(): Promise<number>;
  createPaymentIntent(amount: number, currency?: string, description?: string, idempotencyKey?: string): Promise<PaymentIntent>;
  listPaymentIntents(): Promise<PaymentIntent[]>;
  getPaymentIntent(intentId: string): Promise<PaymentIntent>;
  createSubscription(planId: string, amount: number, currency?: string, interval?: string): Promise<Subscription>;
  getActiveSubscription(): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<Subscription>;
  requestPayout(amount: number, currency: string, destination: string): Promise<any>;
}

export class AdsModule {
  constructor(client: KernelHttpClient);
  getAccount(): Promise<any>;
  createAccount(): Promise<any>;
  listCampaigns(): Promise<Campaign[]>;
  createCampaign(name: string, budgetId: string, bidAmount: number): Promise<Campaign>;
  getCampaign(campaignId: string): Promise<Campaign>;
  pauseCampaign(campaignId: string): Promise<Campaign>;
  resumeCampaign(campaignId: string): Promise<Campaign>;
  listBudgets(): Promise<Budget[]>;
  createBudget(type: string, totalAmount: number): Promise<Budget>;
  getBudget(budgetId: string): Promise<Budget>;
  recordSpend(campaignId: string, amount: number, eventType?: string): Promise<any>;
}

export class AgentsModule {
  constructor(client: KernelHttpClient);
  listAgents(): Promise<Agent[]>;
  createAgent(name: string, description: string, type?: string): Promise<Agent>;
  getAgent(agentId: string): Promise<Agent>;
  suspendAgent(agentId: string): Promise<Agent>;
  activateAgent(agentId: string): Promise<Agent>;
  getAgentStats(agentId: string): Promise<any>;
  listPolicies(agentId: string): Promise<any[]>;
  createPolicy(agentId: string, domain: string, allowedActions: string[], maxAmount?: number, requiresApproval?: boolean): Promise<any>;
  listPendingDecisions(): Promise<AgentDecision[]>;
  listDecisions(status?: string): Promise<AgentDecision[]>;
  getDecision(decisionId: string): Promise<AgentDecision>;
  approveDecision(decisionId: string, note?: string): Promise<AgentDecision>;
  rejectDecision(decisionId: string, note?: string): Promise<AgentDecision>;
  proposeDecision(agentId: string, domain: string, action: string, targetEntity: string, payload?: any, reason?: string, amount?: number): Promise<AgentDecision>;
  getExecutionLogs(): Promise<any[]>;
}

export class KernelClient {
  constructor(config?: KernelConfig);
  auth: AuthModule;
  identity: IdentityModule;
  billing: BillingModule;
  ads: AdsModule;
  agents: AgentsModule;
  http: KernelHttpClient;
  setToken(token: string): void;
  getToken(): string | null;
  isAuthenticated(): boolean;
}

export default KernelClient;
