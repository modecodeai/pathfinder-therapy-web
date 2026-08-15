#!/usr/bin/env python3
"""Production smoke: CI analyse + apply with synthetic transcript."""
import json
import ssl
import urllib.request

BASE = 'https://emdr.pathfindertherapy.com'
SYNTHETIC = """THERAPIST:
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
My wife is very supportive. Running helps me clear my head as well."""


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    headers = {
        'content-type': 'application/json',
        'user-agent': 'PathfinderCI-Smoke/1.0',
        'accept': 'application/json',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(request, timeout=180, context=ctx) as response:
        return response.status, json.loads(response.read().decode())


def main() -> None:
    import time

    email = f'ci-analyse-{int(time.time())}@pathfindertherapy.org.uk'
    _, reg = req(
        'POST',
        '/api/auth/register',
        body={
            'email': email,
            'password': 'TestPass1234!',
            'firstName': 'CI',
            'lastName': 'Analyse',
            'privacyConsent': True,
        },
    )
    token = reg['token']
    _, client = req('POST', '/api/clients', token, {'displayName': 'Synthetic Analyse Client'})
    client_id = client['client']['id']
    print('client', client_id)

    status, analysed = req(
        'POST',
        '/api/clinical-intelligence/analyse',
        token,
        {
            'clientId': client_id,
            'protocol': 'standard-emdr',
            'phase': 'history',
            'transcript': SYNTHETIC,
        },
    )
    print('analyse status', status, 'success', analysed.get('success'), 'latency', analysed.get('latencyMs'))
    if not analysed.get('success'):
        print(json.dumps(analysed, indent=2)[:4000])
        raise SystemExit(1)

    sr = analysed['structuredResult']
    print('presenting', [x['value'] for x in sr['presentingProblems']])
    print('triggers', [x['value'] for x in sr['triggers']])
    print('memories', [(m['headline'], m.get('approximateAge')) for m in sr['memories']])
    print('themes', [(t['theme'], t['confidence']) for t in sr['themes']])
    print('NCs', [(c['kind'], c['value']) for c in sr['negativeCognitions']])
    print('PCs', sr['positiveCognitions'])
    print('resources in', [x['value'] for x in sr['internalResources']], 'ext', [x['value'] for x in sr['externalResources']])
    print('targets', [x['value'] for x in sr['targetCandidates']])
    print('unanswered', sr['unansweredQuestions'])

    missing_ev = []
    for key in [
        'presentingProblems',
        'triggers',
        'memories',
        'themes',
        'negativeCognitions',
        'internalResources',
        'externalResources',
        'targetCandidates',
    ]:
        for item in sr[key]:
            if not item.get('evidence'):
                missing_ev.append(key)
    print('missing evidence count', len(missing_ev))

    unanswered = ' '.join(sr['unansweredQuestions']).lower()
    assert 'voc' in unanswered or 'sud' in unanswered or 'image' in unanswered or 'positive' in unanswered

    for key in [
        'presentingProblems',
        'triggers',
        'memories',
        'themes',
        'negativeCognitions',
        'internalResources',
        'externalResources',
        'targetCandidates',
    ]:
        for item in sr[key]:
            item['reviewStatus'] = 'approved'
    sr['summary']['reviewStatus'] = 'approved'

    status, applied = req(
        'POST',
        f'/api/clients/{client_id}/apply-findings',
        token,
        {
            'clientId': client_id,
            'analysisId': analysed['analysis']['id'],
            'structuredResult': sr,
        },
    )
    print('apply', status, applied.get('ok'), 'audit', applied.get('auditCount'))
    c = applied['client']
    print('stored presenting', c.get('presentingProblem'))
    print('stored triggers', [t['text'] for t in c['triggers']])
    print('stored memories', [(m['headline'], m.get('approximateAge')) for m in c['memories']])
    print('stored themes', c['themes'])
    print('stored nc/pc', c.get('approvedNc'), c.get('approvedPc'))
    print('stored resources', [(r['kind'], r['text']) for r in c['resources']])
    print('stored targets', [t['headline'] for t in c['targetCandidates']])
    assert c.get('activeTarget') is None
    print('OK')


if __name__ == '__main__':
    main()
