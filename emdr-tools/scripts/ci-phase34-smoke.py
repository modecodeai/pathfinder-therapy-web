#!/usr/bin/env python3
"""Production smoke: CI Phase 3 + Phase 4 analyse + apply (synthetic transcripts)."""
import json
import ssl
import time
import urllib.request

BASE = 'https://emdr.pathfindertherapy.com'

PHASE3 = """THERAPIST:
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
In my chest."""

PHASE4 = """THERAPIST:
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
Notice that."""

SEGMENT = """CLIENT:
Something new — I also remember the teacher laughing.
THERAPIST:
Go with that."""


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    headers = {
        'content-type': 'application/json',
        'user-agent': 'PathfinderCI-Smoke-v03/1.0',
        'accept': 'application/json',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(request, timeout=180, context=ctx) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {'raw': raw[:2000]}
        print('HTTP', e.code, path, parsed)
        raise


def approve_all_phase3(result: dict) -> dict:
    out = json.loads(json.dumps(result))
    for key in [
        'summary',
        'target',
        'worstPart',
        'image',
        'negativeCognition',
        'positiveCognition',
        'voc',
        'emotion',
        'sud',
        'bodyLocation',
    ]:
        item = out.get(key)
        if isinstance(item, dict) and 'reviewStatus' in item:
            item['reviewStatus'] = 'approved'
    return out


def approve_all_phase4(result: dict) -> dict:
    out = json.loads(json.dumps(result))
    if isinstance(out.get('summary'), dict):
        out['summary']['reviewStatus'] = 'approved'
    for step in out.get('sequence') or []:
        step['reviewStatus'] = 'approved'
    for key in [
        'associations',
        'adaptiveInformation',
        'sudChanges',
        'feederMemories',
        'blockingBeliefs',
        'therapistInterventions',
        'imageThoughtEmotionBodyChanges',
        'newMemories',
    ]:
        for item in out.get(key) or []:
            item['reviewStatus'] = 'approved'
    return out


def main() -> None:
    email = f'ci-v03-{int(time.time())}@pathfindertherapy.org.uk'
    _, reg = req(
        'POST',
        '/api/auth/register',
        body={
            'email': email,
            'password': 'TestPass1234!',
            'firstName': 'CI',
            'lastName': 'V03',
            'privacyConsent': True,
        },
    )
    token = reg['token']
    _, client = req('POST', '/api/clients', token, {'displayName': 'Synthetic Phase34 Client'})
    client_id = client['client']['id']
    print('client', client_id)

    _, status = req('GET', '/api/clinical-intelligence/status', token)
    print('status', status)
    assert status.get('configured'), 'CI not configured'

    # Phase 3
    print('--- Phase 3 analyse ---')
    _, p3 = req(
        'POST',
        '/api/clinical-intelligence/analyse',
        token,
        {
            'clientId': client_id,
            'protocol': 'standard-emdr',
            'phase': 'assessment',
            'transcript': PHASE3,
        },
    )
    assert p3.get('success'), p3
    sr3 = p3['structuredResult']
    assert sr3['analysisKind'] == 'phase3-assessment'
    assert sr3.get('vocNumeric') == 3, sr3.get('vocNumeric')
    assert sr3.get('sudNumeric') == 7, sr3.get('sudNumeric')
    print('phase3 ok', 'voc', sr3.get('vocNumeric'), 'sud', sr3.get('sudNumeric'), 'latency', p3.get('latencyMs'))

    reviewed3 = approve_all_phase3(sr3)
    analysis_id3 = p3['analysis']['id']
    req(
        'PATCH',
        f'/api/clinical-intelligence/analyses/{analysis_id3}',
        token,
        {'reviewedResult': reviewed3, 'reviewStatus': 'reviewed'},
    )
    _, applied3 = req(
        'POST',
        f'/api/clients/{client_id}/apply-to-target',
        token,
        {'clientId': client_id, 'analysisId': analysis_id3, 'reviewedResult': reviewed3},
    )
    assert applied3.get('ok'), applied3
    assert applied3['client']['activeTarget']['sud'] == 7
    print('apply-to-target ok', applied3['client']['activeTarget'])

    # Phase 4
    print('--- Phase 4 analyse ---')
    _, p4 = req(
        'POST',
        '/api/clinical-intelligence/analyse',
        token,
        {
            'clientId': client_id,
            'protocol': 'standard-emdr',
            'phase': 'desensitisation',
            'transcript': PHASE4,
        },
    )
    assert p4.get('success'), p4
    sr4 = p4['structuredResult']
    assert sr4['analysisKind'] == 'phase4-desensitisation'
    assert isinstance(sr4.get('sequence'), list) and len(sr4['sequence']) >= 1
    assert sr4.get('resolutionStatus') in ('not-established', 'in-progress', 'incomplete')
    print(
        'phase4 ok',
        'steps',
        len(sr4['sequence']),
        'resolution',
        sr4.get('resolutionStatus'),
        'latency',
        p4.get('latencyMs'),
    )

    reviewed4 = approve_all_phase4(sr4)
    analysis_id4 = p4['analysis']['id']
    _, applied4 = req(
        'POST',
        f'/api/clients/{client_id}/apply-findings',
        token,
        {'clientId': client_id, 'analysisId': analysis_id4, 'structuredResult': reviewed4},
    )
    assert applied4.get('ok'), applied4
    notes = applied4['client'].get('processingNotes') or []
    assert notes, 'expected processing notes'
    print('phase4 apply ok', 'notes', len(notes))

    # Segment
    print('--- Phase 4 segment ---')
    _, seg = req(
        'POST',
        '/api/clinical-intelligence/analyse-segment',
        token,
        {
            'clientId': client_id,
            'protocol': 'standard-emdr',
            'phase': 'desensitisation',
            'transcript': SEGMENT,
            'parentAnalysisId': analysis_id4,
        },
    )
    assert seg.get('success'), seg
    deltas = [
        s.get('findingDelta')
        for s in (seg['structuredResult'].get('sequence') or [])
        if s.get('findingDelta')
    ]
    print('segment deltas', deltas or '(none tagged — model may have returned empty sequence)')
    print('SMOKE PASS')


if __name__ == '__main__':
    main()
