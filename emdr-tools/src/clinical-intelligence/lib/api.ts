import type {
  AnyStructuredAnalysis,
  ApplyFindingsRequest,
  ApplyToTargetRequest,
  ClientRecord,
  ClinicalAIAnalysisRecord,
  SupportedAnalysisPhase,
  TargetAssessmentDraft,
} from '../types';

const TOKEN_KEY = 'pf-emdr-auth-token';

function authHeaders(): HeadersInit {
  const t = localStorage.getItem(TOKEN_KEY);
  return t
    ? { Authorization: `Bearer ${t}`, 'content-type': 'application/json' }
    : { 'content-type': 'application/json' };
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export interface CIStatus {
  configured: boolean;
  provider: string;
  modelConfigured: boolean;
  model?: string | null;
}

export interface CITestResult {
  success: boolean;
  provider: string;
  model?: string | null;
  response?: string;
  latencyMs?: number;
  error?: string;
}

export async function fetchCIStatus(): Promise<CIStatus> {
  const res = await fetch('/api/clinical-intelligence/status', { headers: authHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Sign in required' : 'Status unavailable');
  return parseJson(res);
}

export async function testCIConnection(): Promise<CITestResult> {
  const res = await fetch('/api/clinical-intelligence/test', {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function listClients(): Promise<
  Array<{ id: string; displayName: string; presentingProblem?: string; updatedAt: string }>
> {
  const res = await fetch('/api/clients', { headers: authHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Sign in required' : 'Could not load clients');
  const data = await parseJson<{
    clients: Array<{ id: string; displayName: string; presentingProblem?: string; updatedAt: string }>;
  }>(res);
  return data.clients;
}

export async function createClient(displayName: string): Promise<ClientRecord> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ displayName }),
  });
  const data = await parseJson<{ ok?: boolean; client?: ClientRecord; error?: string }>(res);
  if (!res.ok || !data.client) throw new Error(data.error ?? 'Could not create client');
  return data.client;
}

export async function getClient(clientId: string): Promise<ClientRecord> {
  const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}`, { headers: authHeaders() });
  const data = await parseJson<{ client?: ClientRecord; error?: string }>(res);
  if (!res.ok || !data.client) throw new Error(data.error ?? 'Client not found');
  return data.client;
}

export type AnalyseResponse = {
  success: boolean;
  error?: string;
  structuredResult?: AnyStructuredAnalysis;
  analysis?: ClinicalAIAnalysisRecord;
  model?: string;
  latencyMs?: number;
  rawTranscriptId?: string;
  isSegment?: boolean;
};

export async function analyseTranscript(payload: {
  clientId: string;
  protocol: 'standard-emdr';
  phase: SupportedAnalysisPhase;
  transcript: string;
  sessionDate?: string;
  sessionId?: string;
  parentAnalysisId?: string;
}): Promise<AnalyseResponse> {
  const res = await fetch('/api/clinical-intelligence/analyse', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function analyseTranscriptSegment(payload: {
  clientId: string;
  protocol: 'standard-emdr';
  phase: SupportedAnalysisPhase;
  transcript: string;
  parentAnalysisId: string;
  sessionDate?: string;
  sessionId?: string;
}): Promise<AnalyseResponse> {
  const res = await fetch('/api/clinical-intelligence/analyse-segment', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function applyFindings(
  clientId: string,
  body: ApplyFindingsRequest,
): Promise<{
  ok: boolean;
  needsResolution?: boolean;
  conflicts?: string[];
  client?: ClientRecord;
  error?: string;
}> {
  const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/apply-findings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function applyToTarget(
  clientId: string,
  body: ApplyToTargetRequest,
): Promise<{
  ok: boolean;
  client?: ClientRecord;
  draft?: TargetAssessmentDraft;
  error?: string;
}> {
  const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/apply-to-target`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function saveReviewedAnalysis(
  analysisId: string,
  reviewedResult: AnyStructuredAnalysis,
  reviewStatus: 'partially-reviewed' | 'reviewed' = 'partially-reviewed',
): Promise<void> {
  const res = await fetch(`/api/clinical-intelligence/analyses/${encodeURIComponent(analysisId)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ reviewedResult, reviewStatus }),
  });
  if (!res.ok) {
    const data = await parseJson<{ error?: string }>(res);
    throw new Error(data.error ?? 'Could not save reviewed analysis');
  }
}

export async function listClientAnalyses(clientId: string): Promise<
  Array<{
    id: string;
    protocol: string;
    phase: string;
    model: string;
    reviewStatus: string;
    createdAt: string;
  }>
> {
  const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/analyses`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Could not load analyses');
  const data = await parseJson<{
    analyses: Array<{
      id: string;
      protocol: string;
      phase: string;
      model: string;
      reviewStatus: string;
      createdAt: string;
    }>;
  }>(res);
  return data.analyses;
}

export const SYNTHETIC_TEST_TRANSCRIPT = `THERAPIST:
What would you like us to work on?
CLIENT:
I get really anxious when my manager comments on my work.
THERAPIST:
What tends to happen?
CLIENT:
I immediately think I've done something wrong and I'm going to get into trouble. I know that sounds ridiculous because I'm good at my job.
THERAPIST:
Does that feeling remind you of anything earlier?
CLIENT:
School reports. My mum would always focus on the one B instead of the As. I remember feeling that nothing I did was ever good enough.
THERAPIST:
How old were you?
CLIENT:
Probably around ten.
THERAPIST:
Who do you have around you now?
CLIENT:
My wife is very supportive. Running helps me clear my head as well.`;

export const SYNTHETIC_PHASE3_TRANSCRIPT = `THERAPIST:
So the target we're working with is the school report memory around age ten. What image represents the worst part?
CLIENT:
I can see my mum's face when she opens the report and looks disappointed.
THERAPIST:
What words go with that that express your negative belief about yourself now?
CLIENT:
I'm not good enough.
THERAPIST:
When you bring up that image, what would you prefer to believe about yourself instead?
CLIENT:
I am good enough.
THERAPIST:
When you think of that image and those words "I am good enough", how true do they feel from 1 to 7?
CLIENT:
About a 3.
THERAPIST:
What emotion do you feel now?
CLIENT:
Shame.
THERAPIST:
On a scale of 0 to 10, how disturbing does it feel?
CLIENT:
A 7.
THERAPIST:
Where do you feel that in your body?
CLIENT:
In my chest.`;

export const SYNTHETIC_PHASE4_TRANSCRIPT = `THERAPIST:
Notice that image, the words "I'm not good enough", the shame in your chest, and follow my fingers. Let whatever comes up, come up.
CLIENT:
It's getting hotter in my chest.
THERAPIST:
Go with that.
CLIENT:
Now I'm thinking about another time at school when I got told off in front of the class.
THERAPIST:
Notice that. Go with that.
CLIENT:
The image of Mum's face is a bit softer now. Still there though.
THERAPIST:
What do you notice in your body?
CLIENT:
Still in my chest but less tight. Maybe a 5 now.
THERAPIST:
Go with that.
CLIENT:
I keep thinking I have to be perfect or people will leave. That feels stuck.
THERAPIST:
Just notice that belief. Go with that.
CLIENT:
Actually… she was stressed a lot. It wasn't only about me.
THERAPIST:
Notice that.`;
