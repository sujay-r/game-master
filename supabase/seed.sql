SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict kj1sQAQsZ7ld3Zh5XbHM0IbvVxQ1iKQwYa1WTnb6AJg1SJ4t6Bu4IqpMGzj4Exv

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '352704b2-c8b3-4301-8b3d-dc604adc0ca2', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"test@email.com","user_id":"a83a6e43-7ab9-451e-83fc-1c1ae4f3e68e","user_phone":""}}', '2026-03-28 12:24:46.776765+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'a83a6e43-7ab9-451e-83fc-1c1ae4f3e68e', 'authenticated', 'authenticated', 'test@email.com', '$2a$10$9aZtktuRrDQJRnKU9MIGEunJK11o29khQYghs9xJKVmy/u4V4L9Zq', '2026-03-28 12:24:46.780082+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-28 12:24:46.7671+00', '2026-03-28 12:24:46.781248+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('a83a6e43-7ab9-451e-83fc-1c1ae4f3e68e', 'a83a6e43-7ab9-451e-83fc-1c1ae4f3e68e', '{"sub": "a83a6e43-7ab9-451e-83fc-1c1ae4f3e68e", "email": "test@email.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-28 12:24:46.773511+00', '2026-03-28 12:24:46.773618+00', '2026-03-28 12:24:46.773618+00', 'fa6c6584-6fe7-42a1-a00f-e6b9cb7d552a');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: Stat; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Stat" ("id", "name", "value") VALUES
	(3, 'Focus', 80),
	(1, 'Health', 80),
	(2, 'Energy', 80),
	(4, 'Mood', 80);


--
-- Data for Name: StatusEffect; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: AffectedStat; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Quest; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Quest" ("id", "title", "description", "status", "created_at", "type", "updated_at", "notes") VALUES
	(1, 'Test main quest', 'This is a main quest', 'todo', '2026-03-28 11:40:06.828+00', 'main', '2026-03-28 11:40:06.828+00', NULL),
	(2, 'Test side quest', 'This is a side quest', 'todo', '2026-03-28 11:40:19.44+00', 'side', '2026-03-28 11:40:19.44+00', NULL),
	(3, 'Test life admin quest', 'This is a life admin quest', 'todo', '2026-03-28 11:40:31.749+00', 'lifeAdmin', '2026-03-28 11:40:31.749+00', NULL);


--
-- Data for Name: Reward; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Reward" ("id", "title", "description", "created_at", "claimed_at", "status", "updated_at") VALUES
	(1, 'Care reward', 'Reward claimed by using care token', '2026-03-28 11:43:42.526+00', NULL, 'PENDING', '2026-03-28 11:43:42.526+00'),
	(2, 'Grind reward', 'Reward claimed by using grind token', '2026-03-28 11:43:54.176+00', NULL, 'PENDING', '2026-03-28 11:43:54.176+00');


--
-- Data for Name: Token; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Token" ("token_type", "quantity", "icon_filename", "icon_color") VALUES
	('grind', 1, 'grind.svg', '#faa157'),
	('care', 1, 'care.svg', '#f54e89');


--
-- Data for Name: RewardCost; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."RewardCost" ("reward_id", "token_type", "quantity") VALUES
	(1, 'care', 1),
	(2, 'grind', 1);


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."Task" ("id", "title", "description", "status", "notes", "created_at", "quest_id", "due_date", "completed_at") VALUES
	(1, 'Unassigned task #1', 'Task is not assigned to any quest', 'TODO', '', '2026-03-28 11:40:49.248+00', NULL, NULL, NULL),
	(2, 'Unassigned task #2', 'Second task not assigned to any quest', 'TODO', '', '2026-03-28 11:41:03.261+00', NULL, NULL, NULL),
	(3, 'Main task #1', 'Task for the main quest', 'TODO', '', '2026-03-28 11:42:28.318+00', 1, NULL, NULL),
	(4, 'Main task #2', 'Second task for main quest', 'TODO', '', '2026-03-28 11:42:39.963+00', 1, NULL, NULL),
	(5, 'Task for side quest', 'This is a task for the side quest', 'TODO', '', '2026-03-28 11:42:53.608+00', 2, NULL, NULL),
	(6, 'Task for life admin quest', 'This is a task for the life admin quest', 'TODO', '', '2026-03-28 11:43:18.452+00', 3, NULL, NULL);


--
-- Data for Name: TaskOutcome; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."TaskOutcome" ("task_id", "token_type", "quantity") VALUES
	(3, 'grind', 1),
	(6, 'care', 1);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: Quest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Quest_id_seq"', 3, true);


--
-- Name: RewardCost_reward_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."RewardCost_reward_id_seq"', 1, false);


--
-- Name: Reward_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Reward_id_seq"', 2, true);


--
-- Name: Stat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Stat_id_seq"', 1, false);


--
-- Name: StatusEffect_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."StatusEffect_id_seq"', 1, false);


--
-- Name: TaskOutcome_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."TaskOutcome_task_id_seq"', 1, false);


--
-- Name: Task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."Task_id_seq"', 8, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict kj1sQAQsZ7ld3Zh5XbHM0IbvVxQ1iKQwYa1WTnb6AJg1SJ4t6Bu4IqpMGzj4Exv

RESET ALL;
