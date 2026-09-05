#!/usr/bin/env python3
"""Acceptance smoke: two synthetic sessions → longitudinal AIP formulation preserved."""
import json
import ssl
import time
import urllib.request

BASE = 'https://emdr.pathfindertherapy.com'

PHASE1 = """THERAPIST:
What would you like us to work on?
CLIENT:
I get really anxious when my manager comments on my work.
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
My wife is very supportive. Running helps me clear my head as well."""

PHASE3 = """THERAPIST:
So the target is the school report memory around age ten. What image represents the worst part?
CLIENT:
I can see my mum's face when she opens the report and looks disappointed.
THERAPIST:
What words go with that negative belief about yourself now?
CLIENT:
I'm not good enough.
THERAPIST:
What would you prefer to believe instead?
CLIENT:
I am good enough.
THERAPIST:
How true does that feel from 1 to 7?
CLIENT:
About a 3.
THERAPIST:
What emotion do you feel? On 0 to 10 how disturbing? Where in the body?
CLIENT:
Shame. A 7. In my chest."""

PHASE4 = """THERAPIST:
Notice the image, the words, the shame in your chest, and follow.
CLIENT:
It's getting hotter in my chest.
THERAPIST:
Go with that.
CLIENT:
Actually… she was stressed a lot. It wasn't only about me.
THERAPIST:
Notice that."""


def req(method, path, token=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {
        'content-type': 'application/json',
        'user-agent': 'PathfinderCI-Smoke-v04/1.0',
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


def approve_tree(obj):
    if isinstance(obj, dict):
        if 'reviewStatus' in obj:
            obj['reviewStatus'] = 'approved'
        for v in obj.values():
            approve_tree(v)
    elif isinstance(obj, list):
        for v in obj:
            approve_tree(v)
    return obj


def main():
    email = f'ci-v04-{int(time.time())}@pathfindertherapy.org.uk'
    _, reg = req(
        'POST',
        '/api/auth/register',
        body={
            'email': email,
            'password': 'TestPass1234!',
            'firstName': 'CI',
            'lastName': 'V04',
            'privacyConsent': True,
        },
    )
    token = reg['token']
    _, client = req('POST', '/api/clients', token, {'displayName': 'AIP Longitudinal Client'})
    client_id = client['client']['id']
    print('client', client_id)

    # Session 1 — Phase 1
    _, a1 = req(
        'POST',
        '/api/clinical-intelligence/analyse',
        token,
        {
            'clientId': client_id,
            'protocol': 'standard-emdr',
            'phase': 'history',
            'transcript': PHASE1,
        },
    )
    assert a1.get('success'), a1
    reviewed1 = approve_tree(json.loads(json.dumps(a1['structuredResult'])))
    _, applied1 = req(
        'POST',
        f'/api/clients/{client_id}/apply-findings',
        token,
        {
            'clientId': client_id,
            'analysisId': a1['analysis']['id'],
            'structuredResult': reviewed1,
        },
    )
    assert applied1.get('ok'), applied1
    c = applied1['client']
    assert any(m.get('approximateAge') == 10 for m in c['memories']), c['memories']
    assert any('manager' in t['text'].lower() for t in c['triggers']), c['triggers']
    assert any(t['theme'] == 'responsibility-defectiveness' for t in c['themes']), c['themes']
    assert c.get('approvedNc'), c
    print('session1 phase1 ok')

    # Session 1 — Phase 3
    _, a3 = req(
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
    assert a3.get('success'), a3
    reviewed3 = approve_tree(json.loads(json.dumps(a3['structuredResult'])))
    _, applied3 = req(
        'POST',
        f'/api/clients/{client_id}/apply-to-target',
        token,
        {
            'clientId': client_id,
            'analysisId': a3['analysis']['id'],
            'reviewedResult': reviewed3,
        },
    )
    assert applied3.get('ok'), applied3
    c = applied3['client']
    assert c['activeTarget']['sud'] == 7
    assert c['activeTarget']['voc'] == 3
    mem_count = len(c['memories'])
    trig_count = len(c['triggers'])
    print('session1 phase3 ok', c['activeTarget'])

    # Session 2 — Phase 4
    _, a4 = req(
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
    assert a4.get('success'), a4
    reviewed4 = approve_tree(json.loads(json.dumps(a4['structuredResult'])))
    _, applied4 = req(
        'POST',
        f'/api/clients/{client_id}/apply-findings',
        token,
        {
            'clientId': client_id,
            'analysisId': a4['analysis']['id'],
            'structuredResult': reviewed4,
        },
    )
    assert applied4.get('ok'), applied4
    c = applied4['client']
    assert len(c['memories']) == mem_count
    assert len(c['triggers']) == trig_count
    assert any(m.get('approximateAge') == 10 for m in c['memories'])
    assert any(t['theme'] == 'responsibility-defectiveness' for t in c['themes'])
    assert c['activeTarget']['sud'] == 7
    assert c.get('processingNotes') or c.get('adaptiveInformation')
    assert c.get('sessionChanges')
    print('session2 phase4 ok notes', len(c.get('processingNotes') or []), 'changes', len(c.get('sessionChanges') or []))
    print('ACCEPTANCE PASS')


if __name__ == '__main__':
    main()
