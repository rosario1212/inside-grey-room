BEGIN;
DO $fix$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('igr_private.igr_v665_019_offered(text,integer)'::regprocedure) INTO d;IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF;n:=d;
n:=replace(n,'a.payload->>''choice''=e->>''id''','a.payload->>''choice''=regexp_replace(e->>''id'',''^019_[ABC]_'',''019_'')');
n:=replace(n,'jsonb_build_object(''id'',item->>''id'',''title'',item->>''title'')','jsonb_build_object(''id'',regexp_replace(item->>''id'',''^019_[ABC]_'',''019_''),''title'',item->>''title'')');
IF n=d THEN RAISE EXCEPTION '019 variant-leak guard not applied';END IF;EXECUTE n;END $fix$;
DO $fix$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('public.igr_v575_019_investigate(text,uuid,text)'::regprocedure) INTO d;IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF;n:=d;
n:=replace(n,'WHERE e->>''id''=p_choice AND (e->>''cycle'')::int=room_.cycle','WHERE regexp_replace(e->>''id'',''^019_[ABC]_'',''019_'')=p_choice AND (e->>''cycle'')::int=room_.cycle');
IF n=d THEN RAISE EXCEPTION '019 variant-leak guard not applied';END IF;EXECUTE n;END $fix$;
DO $fix$ DECLARE d text;n text;BEGIN SELECT pg_get_functiondef('igr_private.igr_v570_019_safe_pack(text)'::regprocedure) INTO d;IF d IS NULL THEN RAISE EXCEPTION '019 function missing';END IF;n:=d;
n:=replace(n,'''news'',coalesce(m->''v570_journal_news'',''[]''::jsonb)','''news'',(SELECT coalesce(jsonb_agg(jsonb_set(e,''{id}'',to_jsonb(regexp_replace(e->>''id'',''^019_[ABC]_'',''019_'')),true) ORDER BY e->>''id''),''[]''::jsonb) FROM jsonb_array_elements(coalesce(m->''v570_journal_news'',''[]''::jsonb)) e)');
IF n=d THEN RAISE EXCEPTION '019 variant-leak guard not applied';END IF;EXECUTE n;END $fix$;

DO $qa$
DECLARE t text;
BEGIN
 SELECT pg_get_functiondef('igr_private.igr_v665_019_offered(text,integer)'::regprocedure) INTO t;
 IF t NOT LIKE '%regexp_replace(item->>%'
 OR t NOT LIKE '%regexp_replace(e->>%'
 THEN RAISE EXCEPTION '019 anonymous lead IDs missing';END IF;
 SELECT pg_get_functiondef('public.igr_v575_019_investigate(text,uuid,text)'::regprocedure) INTO t;
 IF t NOT LIKE '%regexp_replace(e->>%'
 THEN RAISE EXCEPTION '019 anonymous lead choices missing';END IF;
 IF (igr_private.igr_v571_019_release_status()->>'eligible')::boolean IS DISTINCT FROM true
 THEN RAISE EXCEPTION '019 no longer eligible';END IF;
END $qa$;
COMMIT;
