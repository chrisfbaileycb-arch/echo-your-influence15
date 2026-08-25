export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface CloudUser {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  aud?: string;
  created_at?: string;
}

export interface CloudSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: CloudUser;
}

export interface CloudAuthResponse {
  data: {
    user: CloudUser | null;
    session: CloudSession | null;
    claims?: Record<string, unknown>;
  };
  error: Error | null;
}

export interface DatabaseSchema {
  products: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    price: string | null;
    currency: string | null;
    source_url: string | null;
    source_domain: string | null;
    images: string[] | null;
    asset_kind?: string | null;
    campaign_mode?: string | null;
    suggested_network?: string | null;
    raw?: Json | null;
    created_at?: string;
    updated_at?: string;
  };
  personas: {
    id: string;
    user_id: string;
    name: string;
    bio: string | null;
    gender: string | null;
    age_range: string | null;
    vibe: string | null;
    niche: string | null;
    voice_tone: string | null;
    catchphrases: string[] | Json | null;
    speech_quirks: string | null;
    heygen_avatar_id: string | null;
    elevenlabs_voice_id: string | null;
    is_default: boolean;
    created_at?: string;
    updated_at?: string;
  };
  campaigns: {
    id: string;
    user_id: string;
    product_id: string | null;
    name: string;
    status: string;
    step: string | null;
    source_url: string | null;
    destination_url: string | null;
    asset_kind: string | null;
    include_video: boolean;
    utm_campaign: string | null;
    headline: string | null;
    primary_text: string | null;
    ad_description: string | null;
    raw?: Json | null;
    created_at?: string;
    updated_at?: string;
  };
  campaign_workflows: {
    id: string;
    user_id: string;
    org_id: string;
    name: string;
    status: string;
    current_step: string;
    product_id: string | null;
    persona_id: string | null;
    video_id: string | null;
    ad_image_id: string | null;
    affiliate_link_id: string | null;
    brief_data?: Json | null;
    strategy_data?: Json | null;
    content_data?: Json | null;
    outbound_data?: Json | null;
    publishing_data?: Json | null;
    report_data?: Json | null;
    created_at?: string;
    updated_at?: string;
  };
  videos: {
    id: string;
    user_id: string;
    product_id: string | null;
    persona_id: string | null;
    status: string;
    video_url: string | null;
    thumbnail_url: string | null;
    hook: string | null;
    script: string | null;
    caption: string | null;
    hashtags: string[] | null;
    duration_seconds: number;
    heygen_video_id: string | null;
    broll_url: string | null;
    error_message: string | null;
    created_at?: string;
    updated_at?: string;
  };
  ad_images: {
    id: string;
    user_id: string;
    product_id: string | null;
    campaign_id: string | null;
    image_url: string | null;
    storage_path: string | null;
    prompt: string | null;
    ratio: string | null;
    angle: string | null;
    created_at?: string;
    updated_at?: string;
  };
  calendar_slots: {
    id: string;
    user_id?: string;
    org_id: string;
    title: string;
    scheduled_for: string;
    platform: string;
    status: string;
    workflow_id?: string | null;
    campaign_id?: string | null;
    video_id?: string | null;
    product_id?: string | null;
    caption?: string | null;
    notes?: string | null;
    post_url?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  affiliate_programs: {
    id: string;
    user_id: string;
    network: string;
    program_name: string;
    tracking_id: string;
    base_url: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
  };
  affiliate_links: {
    id: string;
    user_id: string;
    product_id: string | null;
    affiliate_program_id: string | null;
    short_code: string;
    destination_url: string;
    total_clicks: number;
    created_at?: string;
    updated_at?: string;
  };
  link_clicks: {
    id: string;
    link_id: string;
    referer: string | null;
    user_agent: string | null;
    ip_hash: string | null;
    created_at?: string;
  };
  organizations: {
    id: string;
    name: string;
    owner_id: string;
    created_at?: string;
    updated_at?: string;
  };
  organization_members: {
    id: string;
    org_id: string;
    user_id: string;
    role: "owner" | "admin" | "member";
    created_at?: string;
    updated_at?: string;
  };
  profiles: {
    id: string;
    email?: string | null;
    referral_code?: string | null;
    referred_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  subscriptions: {
    id: string;
    user_id: string;
    tier: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
    created_at?: string;
    updated_at?: string;
  };
  usage_counters: {
    id: string;
    user_id: string;
    month: string;
    videos_generated: number;
    images_generated: number;
    broll_generated: number;
    created_at?: string;
    updated_at?: string;
  };
  referral_conversions: {
    id: string;
    referrer_id: string;
    referred_user_id: string;
    credited_cents: number;
    currency: string;
    stripe_balance_txn_id: string | null;
    credited_at: string | null;
    created_at?: string;
  };
  social_posts: {
    id: string;
    user_id: string;
    campaign_id?: string | null;
    title: string;
    content: string;
    platforms: string[];
    scheduled_at?: string | null;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
  social_post_variants: {
    id: string;
    post_id: string;
    platform: string;
    content: string;
    media_urls?: string[] | null;
    status: string;
    published_at?: string | null;
    error_message?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  job_queue: {
    id: string;
    task_name: string;
    payload: Json;
    status: "pending" | "running" | "completed" | "failed";
    retries: number;
    error?: string | null;
    scheduled_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  job_runs: {
    id: string;
    job_id: string;
    result: Json;
    duration_ms: number;
    created_at?: string;
  };
  integration_credentials: {
    id: string;
    user_id: string;
    provider: string;
    credentials: Json;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
  };
  product_briefs: {
    id: string;
    user_id: string;
    product_id: string | null;
    title: string;
    raw_content: string | null;
    key_benefits: string[] | null;
    target_audiences: string[] | null;
    created_at?: string;
    updated_at?: string;
  };
  outbound_campaigns: {
    id: string;
    user_id: string;
    name: string;
    target_niche: string | null;
    leads_count: number;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
  leads: {
    id: string;
    campaign_id: string;
    name: string;
    email: string | null;
    handle: string | null;
    platform: string | null;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
}

export type TableName = keyof DatabaseSchema;

export interface ADKTaskPayload {
  task: "post_scheduling" | "analytics_sweep" | "campaign_tracking" | "adk_execute";
  userId?: string;
  orgId?: string;
  parameters?: Record<string, unknown>;
}

export interface ADKTaskResult {
  success: boolean;
  task: string;
  timestamp: string;
  data: Record<string, unknown>;
  logs: string[];
}
