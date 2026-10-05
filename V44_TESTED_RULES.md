# v44 tested rules

This branch implements the tested Judge + Lawyer v44 gameplay contract.

## Lawyer
- one official client per lawyer;
- meeting required before Accept or Refuse;
- one interrogation-only, 60-second consultation per non-represented suspect;
- interrogation timer pauses and resumes with the remaining time;
- no free waiting-room consultation loop.

## Judge
- no artificial task during card reading / initial debrief;
- Cabinet active from cycle 1;
- requests from Investigator, Lawyer, Prosecutor and independent Journalist;
- three protected elements maximum per game;
- one joint Investigator + Analyst review;
- summons only players currently marked FREE;
- same target max once per cycle, 2 minutes, target confirms in app;
- mandatory final deliberation: 3 minutes short / 4 minutes long, with Prosecutor when present;
- Judge final speech before reveal;
- secret integrity assessment by the investigation camp;
- canonical reveal compares investigation, Judge decision and truth.

See `JUDGE_LAWYER_AUDIT_V44.md` for the executed integration tests.
