// Préflight éditorial LOCAL. Ne charge jamais de manuscrits sur GitHub ni sur stdout.
// Usage: node scripts/omerta-santoro-private-preflight.mjs /path/to/private_variants
import fs from 'node:fs';
import path from 'node:path';

export function auditSantoroDrafts(drafts) {
  const failures = [];
  const report = {
    variants: 0, characters: 0, authoredTips: 0, independentC3Sources: 0,
    emptyPersonalChronologies: 0, emptyPersonalSecrets: 0,
    emptyDialoguePrompts: 0, humanApproved: 0, releaseEligible: 0
  };
  const truths = new Map();
  for (const [name, m] of Object.entries(drafts)) {
    const match = /^(02[1-5])-([ABC])$/.exec(name);
    if (!match || !m || m.private_format !== 'santoro_v25' ||
        m.saga?.family !== 'SANTORO' || m.saga?.branch !== match[2]) {
      failures.push(name + ':invalid_saga_metadata');
      continue;
    }
    report.variants++;
    const cards = Array.isArray(m.private_cards) ? m.private_cards : [];
    report.characters += cards.length;
    if (cards.length !== 7 || new Set(cards.map(c => c.slot)).size !== 7) {
      failures.push(name + ':missing_or_duplicate_character');
    }
    const goals = m.canonical_truth?.verdict_goal_by_slot || {};
    const timelineIds = new Set((m.canonical_truth?.timeline || []).map(e=>e.id));
    for (const c of cards) {
      const goal = goals[String(c.slot)];
      if (!goal || c.verdict_goal?.goal_id !== goal.goal_id ||
          goal.mode !== 'avoid_formal_designation') failures.push(name + ':goal_mismatch');
      if (!String(c.what_you_know||'').trim() || !String(c.objective||'').trim())
        failures.push(name + ':missing_role_context');
      if (!String(c.your_chronology||'').trim()) report.emptyPersonalChronologies++;
      if (!String(c.what_you_hide||'').trim()) report.emptyPersonalSecrets++;
      if (!Array.isArray(c.conversation_hooks) ||
          c.conversation_hooks.filter(q=>typeof q==='string'&&q.trim()).length<2)
        report.emptyDialoguePrompts++;
      const tip=c.eligible_tip;
      if (tip?.id && tip?.text && tip.truth_in_variant === true &&
          timelineIds.has(tip.corroborates_with)) report.authoredTips++;
      else failures.push(name + ':unverifiable_tip');
    }
    const c3=(m.revelations||[]).filter(r =>
      r.kind==='guaranteed' && String(r.min_cycle)==='3' && r.audience==='investigation');
    if (c3.length!==1) failures.push(name + ':missing_guaranteed_crosscheck');
    for(const r of c3) {
      const events=r.editorial_provenance?.existing_events || [];
      if (events.length<2 || new Set(events).size<2 || events.some(x=>!timelineIds.has(x)) ||
          String(r.editorial_provenance?.independent_of_optional_actions)!=='true') {
        failures.push(name + ':nonindependent_crosscheck');
      } else report.independentC3Sources+=new Set(events).size;
    }
    if (!String(m.public_briefing||'').trim() || !String(m.final_reveal||'').trim())
      failures.push(name + ':missing_briefing_or_reveal');
    const truth=JSON.stringify(m.canonical_truth?.truth_by_axis || {});
    if (!truths.has(match[1]))truths.set(match[1],new Set());
    truths.get(match[1]).add(truth);
    const tipsApproved=cards.every(c=>c.eligible_tip?.source_review==='verified');
    const goalApproved=cards.every(c=>c.verdict_goal?.scoring_review==='approved');
    const c3Approved=c3.length===1 && c3[0].editorial_provenance?.human_source_review==='verified';
    const approved=m.status==='ready' && m.human_review_approved===true &&
      m.verdict_scoring_review==='approved' && tipsApproved && goalApproved && c3Approved;
    if (m.human_review_approved===true) report.humanApproved++;
    if (approved) report.releaseEligible++;
  }
  for(const sc of ['021','022','023','024','025'])
    if ((truths.get(sc)?.size || 0)!==3) failures.push(sc + ':variants_not_distinct');
  if(report.variants!==15)failures.push('missing_variants');
  return { ...report, structuralPass:failures.length===0, releasePass:failures.length===0 &&
    report.releaseEligible===15 && report.emptyPersonalChronologies===0 &&
    report.emptyPersonalSecrets===0 && report.emptyDialoguePrompts===0,
    issueCodes:[...new Set(failures)].slice(0,60) };
}

if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
  const folder=process.argv[2];
  if (!folder) {console.error('Provide a local private_variants directory.');process.exit(2);}
  const drafts={};
  for(const sc of ['021','022','023','024','025'])
    for(const v of ['A','B','C']) {
      const name=sc+'-'+v;
      const filename=path.join(folder,name+'.json');
      if(fs.existsSync(filename)) drafts[name]=JSON.parse(fs.readFileSync(filename,'utf8'));
    }
  const report=auditSantoroDrafts(drafts);
  console.log(JSON.stringify(report,null,2));
  if (!report.releasePass) process.exitCode=1;
}
