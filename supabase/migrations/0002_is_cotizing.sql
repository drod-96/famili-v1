-- ═══════════════════════════════════════════════════════════════════════════
-- Caisse Familiale — cotisation optionnelle
--
-- À exécuter une fois dans l'éditeur SQL du projet Supabase, après 0001_init.sql.
--
-- Certains membres ne sont pas tenus de cotiser (par exemple les enfants ou
-- les membres dispensés). `is_cotizing` le dit : tout le monde cotise par
-- défaut, et c'est en base — pas dans l'appli — qu'on lève l'obligation pour
-- qui en est dispensé. Un membre non cotisant peut quand même verser s'il le
-- souhaite ; seule l'obligation mensuelle (retard, reste à payer) ne
-- s'applique plus à lui.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.members
  add column if not exists is_cotizing boolean not null default true;
