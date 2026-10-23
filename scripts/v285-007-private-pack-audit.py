#!/usr/bin/env python3
"""Offline structural audit for the PRIVATE scenario 007/C archive.
Prints no story text. Does not connect to Supabase or enable gameplay.
Usage: python3 scripts/v285-007-private-pack-audit.py path/to/007_variante_C_integration_privee.zip
"""
import collections
import hashlib
import json
import sys
import zipfile

def audit(path):
    issues = []
    with zipfile.ZipFile(path) as archive:
        payload_name = '007_C_v280_private_payload.json'
        report_name = 'validation_report.json'
        assert {payload_name, report_name}.issubset(archive.namelist()), 'Missing private archive members'
        raw = archive.read(payload_name)
        assert len(raw) < 1_000_000, 'Unreasonably large payload'
        payload = json.loads(raw)
        report = json.loads(archive.read(report_name))
    require = lambda condition, reason: issues.append(reason) if not condition else None
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    require(hashlib.sha256(canonical).hexdigest() == report.get('sha256'), 'SHA-256 checksum mismatch')
    require(report.get('scenario_id') == '007' and report.get('variant_id') == 'C', 'Wrong report identity')
    require(report.get('persisted_to_supabase') is False and report.get('published') is False,
            'Archive must not impersonate published state')
    required = {'v280_private_cards','v280_relationships','v280_runtime_trames',
                'v280_investigations','v280_truth','v280_context','v280_editorial'}
    require(required.issubset(payload), 'Missing v280 data')
    cards = payload.get('v280_private_cards', [])
    require(isinstance(cards, list) and len(cards) == 3, 'Expected three suspect cards')
    slots = {str(c.get('slot')) for c in cards if isinstance(c, dict)}
    require(slots == {'1','2','3'}, 'Suspect slots must be unique')
    for card in cards:
        for key in ('identity','what_you_know','what_you_hide','your_chronology','objective'):
            require(isinstance(card.get(key), str) and len(card[key].strip()) >= 20,
                    'Empty/short private card field: ' + key)
    relations = payload.get('v280_relationships', {})
    require(isinstance(relations, dict) and set(relations) == {'1','2','3'}, 'Relationship source slots invalid')
    directed = set()
    for src, rows in relations.items():
        require(isinstance(rows, list) and len(rows) == 2, 'Each suspect needs two directed relations')
        for row in rows:
            dest = str(row.get('target_slot'))
            require(dest != src and dest in slots, 'Invalid relationship target')
            require(isinstance(row.get('known_fact'), str) and bool(row['known_fact'].strip()), 'Missing known fact')
            require(isinstance(row.get('conversation_tension'), str) and bool(row['conversation_tension'].strip()), 'Missing conversational tension')
            directed.add((src,dest))
    require(len(directed) == 6, 'Expected six distinct directed relationships')
    trames = payload.get('v280_runtime_trames', [])
    require(isinstance(trames,list) and sorted(str(t.get('min_cycle')) for t in trames)==['1','2','3'],
            'Exactly one guaranteed revelation per cycle is required')
    require(len(set(t.get('id') for t in trames)) == 3, 'Duplicate canonical revelation ID')
    for item in trames:
        require(isinstance(item.get('title'),str) and len(item['title'].strip()) > 3
                and isinstance(item.get('text'),str) and len(item['text'].strip()) > 40, 'Trame too short')
    investigations = payload.get('v280_investigations', [])
    require(isinstance(investigations, list) and len(investigations) == 9, 'Expected nine optional investigations')
    counts = collections.Counter(str(x.get('cycle')) for x in investigations)
    require(dict(counts) == {'1':3,'2':3,'3':3}, 'Need three investigations per cycle')
    require(len(set(x.get('id') for x in investigations)) == 9, 'Duplicate investigation ID')
    for item in investigations:
        require(isinstance(item.get('title'),str) and len(item['title'].strip()) > 5
                and isinstance(item.get('result'),str) and len(item['result'].strip()) > 40, 'Investigation too short')
    truth = payload.get('v280_truth', {})
    choices = {
        'cause': {'separate_dispute','debt_confrontation','lineage_document'},
        'actor': {'second_confrontation','third_file_struggle','second_document_struggle'},
        'decoy': {'forced_signature','concealed_debt','hidden_lineage'},
    }
    reconstruct = truth.get('reconstruction', {})
    require(set(reconstruct) == set(choices), 'Final reconstruction axes invalid')
    for axis, permitted in choices.items():
        require(reconstruct.get(axis) in permitted, 'Final answer does not map to public UI: ' + axis)
    levels = truth.get('levels')
    require(isinstance(levels,list) and len(levels)==3 and all(type(n) is int and 0<=n<=2 for n in levels),
            'Truth responsibility levels invalid')
    meta = payload.get('v280_editorial', {})
    require(meta.get('human_playtest_verified') is False and meta.get('supabase_persisted') is False,
            'Never assert an unverified human test or database persistence')
    if issues:
        for issue in sorted(set(issues)):
            print('FAIL:',issue)
        raise SystemExit(1)
    print('PASS: C archive integrity, 3 unique cards, 6 directed relations,')
    print('3 guaranteed revelations, 9 investigations (3/cycle), 3 final axes.')
    print('Editorial and runtime status: NOT VERIFIED / NOT RELEASED.')
    print('No private story content was printed or uploaded.')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/v285-007-private-pack-audit.py PRIVATE_ARCHIVE.zip')
    audit(sys.argv[1])
