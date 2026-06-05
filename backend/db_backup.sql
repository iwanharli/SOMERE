--
-- PostgreSQL database dump
--

\restrict 7Jkp37eaNIaBFOHxuL4soG8y3cSKEgSgx4MRBNpAfPOymo7e6Ucsp9NvqGJmKou

-- Dumped from database version 18.3 (Postgres.app)
-- Dumped by pg_dump version 18.3 (Postgres.app)

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
-- Name: TokenRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TokenRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."TokenRequestStatus" OWNER TO postgres;

--
-- Name: TokenTxType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TokenTxType" AS ENUM (
    'INJECT',
    'DEDUCT',
    'ORDER',
    'REFUND'
);


ALTER TYPE public."TokenTxType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "targetId" text,
    event text NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.config (
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text
);


ALTER TABLE public.config OWNER TO postgres;

--
-- Name: panelin_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.panelin_orders (
    id integer NOT NULL,
    "serviceId" integer NOT NULL,
    link text,
    quantity integer NOT NULL,
    rate integer NOT NULL,
    charge integer NOT NULL,
    "startCount" integer,
    remains integer,
    status text NOT NULL,
    comments text,
    "orderDate" timestamp(3) without time zone NOT NULL,
    "syncedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.panelin_orders OWNER TO postgres;

--
-- Name: panelin_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.panelin_services (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    type text NOT NULL,
    rate integer NOT NULL,
    min integer NOT NULL,
    max integer NOT NULL,
    dripfeed boolean NOT NULL,
    refill boolean NOT NULL,
    cancel boolean NOT NULL,
    "syncedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.panelin_services OWNER TO postgres;

--
-- Name: panelin_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.panelin_transactions (
    id integer NOT NULL,
    type text,
    amount integer NOT NULL,
    "balanceBefore" integer,
    "balanceAfter" integer,
    description text,
    "transactionDate" timestamp(3) without time zone NOT NULL,
    "syncedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.panelin_transactions OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: service_token_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_token_prices (
    id text NOT NULL,
    "serviceId" integer NOT NULL,
    "tokenPrice" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text
);


ALTER TABLE public.service_token_prices OWNER TO postgres;

--
-- Name: token_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_requests (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount integer NOT NULL,
    reason text,
    status public."TokenRequestStatus" DEFAULT 'PENDING'::public."TokenRequestStatus" NOT NULL,
    "adminNote" text,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.token_requests OWNER TO postgres;

--
-- Name: token_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.token_transactions (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."TokenTxType" NOT NULL,
    amount integer NOT NULL,
    "balanceBefore" integer NOT NULL,
    "balanceAfter" integer NOT NULL,
    note text,
    "orderId" integer,
    "serviceId" integer,
    "tokenPrice" integer,
    "performedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.token_transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    username text NOT NULL,
    "tokenBalance" integer DEFAULT 0 NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL,
    "failedAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
37ba1811-9cde-4781-a71c-078c4c3bf57f	0006601319e64aa9babf6d99251b6125f51c2869c3c90d99e5c225d208053081	2026-06-04 19:35:07.429475+07	20260604123507_init	\N	\N	2026-06-04 19:35:07.422955+07	1
d57c4e99-f7ab-4cf4-aff9-00dcea9b0c1d	e3e70f147ccd269697dda3f2bd080838a64ab4dba057540662b48245bba4a2dd	2026-06-04 19:51:26.325461+07	20260604125126_add_panelin_cache	\N	\N	2026-06-04 19:51:26.318951+07	1
bb9139c1-5832-4694-9d71-a8973eaa53dd	7bf6ecc5e7d215025f55c30dfc8f3d29c7691db08d35208ead300b103f54fe79	2026-06-04 19:59:17.69755+07	20260604125917_remove_reports_metrics	\N	\N	2026-06-04 19:59:17.694673+07	1
b686494e-c3b0-4f17-89fd-a54e19674879	3858bb73ad4dc5dba8f29cdee9415308e0ff002850019ceddead9087f7aab35b	2026-06-04 20:00:57.483194+07	20260604130057_add_user_role	\N	\N	2026-06-04 20:00:57.481427+07	1
db84057f-d458-4a5d-a46f-01d11a5c2563	35e82bf8edc431ec5cd463e01fc42eb512407b3c2371e29e7971e1fe56f9972b	2026-06-04 22:16:40.916469+07	20260604_add_username	\N	\N	2026-06-04 22:16:40.913756+07	1
5bf7c8eb-57dd-4c88-a0a4-4cc0652c7a04	7a183bd6706441d1bd99148b8cf55bb5f0c18f211592d19259d1e60a1532fe6f	2026-06-04 22:29:21.142265+07	20260604152921_add_token_system	\N	\N	2026-06-04 22:29:21.136206+07	1
94521331-0b0f-41c9-ae2c-63e4b9da0551	b884babb71c5fa382e3d9cee42f64d159af45aa6f3436d1c3c227e5157afd8e5	2026-06-05 00:30:13.37319+07	20260604173013_add_activity_log	\N	\N	2026-06-05 00:30:13.368616+07	1
f61183ec-d596-4fd8-ac16-b4f268ffc240	e1a174acdd784bc365b05df4151fdfd52550cbd1134492ba6129d41cfc9542b3	2026-06-05 02:49:44.153094+07	20260604194944_add_user_status	\N	\N	2026-06-05 02:49:44.151331+07	1
a92850cc-b860-41f3-a23b-014ee92c5feb	e6b8120cb536da51554f34d5c33b34387547d909e67c9a568306284feb4820a4	2026-06-05 03:01:12.664078+07	20260604200112_add_account_lockout	\N	\N	2026-06-05 03:01:12.662394+07	1
58b770e7-3672-44c3-a08b-5103decc1f58	d7d969118f9ccbd41f7bf5b88ce2612a7692850b53fc16de5f502d26903f7f57	2026-06-05 03:03:08.765487+07	20260604200308_add_refresh_token	\N	\N	2026-06-05 03:03:08.761618+07	1
70f6aca7-5a52-4eb8-adc1-cb415700807d	f2be24f48a57ce4572caadb26016ea813c006e4976f6e9237784076d411da518	2026-06-05 03:14:39.960417+07	20260604201439_add_token_request	\N	\N	2026-06-05 03:14:39.95676+07	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, "userId", "targetId", event, description, metadata, "ipAddress", "createdAt") FROM stdin;
cmpzu7xd50001cvywwcxlzd7o	admin_sore_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username"}	::1	2026-06-04 18:37:22.985
cmpzuya95000110iwr3ci81fm	admin_sore_001	\N	PROFILE_UPDATE	Memperbarui profil: nama	{"changed": ["nama"]}	::1	2026-06-04 18:57:52.745
cmpzvdh45000164ub40am3zz9	admin_sore_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username"}	::1	2026-06-04 19:09:41.477
cmpzw95nl000564ub4vd391hr	admin_sore_001	demo_user_001	TOKEN_INJECT	Inject 50 token ke @userdemo (Debug)	{"note": "Debug", "after": 50, "amount": 50, "before": 0}	::1	2026-06-04 19:34:19.618
cmpzwdydx0001t24vuh7gc64c	admin_sore_001	\N	SYNC_SERVICES	Sync services: 28 data diperbarui	{"synced": 28}	::1	2026-06-04 19:38:03.477
cmpzwdzb10003t24ve3zs7s0q	admin_sore_001	\N	SYNC_ORDERS	Sync status aktif: 0 tugas diperbarui	{"synced": 0}	::1	2026-06-04 19:38:04.67
cmpzwe0i90005t24vvof1y23b	admin_sore_001	\N	SYNC_TRANSACTIONS	Sync transaksi: 0 data baru	{"synced": 0}	::1	2026-06-04 19:38:06.225
cmpzx4h4u00017jqjmljoc2ym	admin_sore_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-04 19:58:40.83
cmpzx7qhv00037jqj4b2dr728	demo_user_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-04 20:01:12.931
cmpzxjx2z0003qfvpfmjyty01	demo_user_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-04 20:10:41.339
cmpzy5hmn0005c0ag70nqkcb3	admin_sore_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-04 20:27:27.743
cmpzy9sd9000yc0aghc1qd73k	admin_sore_001	\N	SYNC_SERVICES	Sync services: 28 data diperbarui	{"device": "Chrome · macOS", "synced": 28}	::1	2026-06-04 20:30:48.286
cmpzyhp7u0003528w4xh7ba76	demo_user_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-04 20:36:57.45
cmq07r4lf000bvyh7ojuydbhd	demo_user_001	\N	ORDER_CREATE	Buat tugas #1 — service #4, 1000 unit → https://www.instagram.com/p/DYUI7FakUGt	{"link": "https://www.instagram.com/p/DYUI7FakUGt", "device": "Chrome · macOS", "orderId": 1, "quantity": 1000, "serviceId": 4, "tokenUsed": 5, "tokenPricePer1000": 5}	::1	2026-06-05 00:56:13.828
cmq07sqmz000dvyh72si521fy	admin_sore_001	\N	SYNC_ORDERS	Sync status aktif: 0 tugas diperbarui	{"device": "Chrome · macOS", "synced": 0}	::1	2026-06-05 00:57:29.051
cmq07ss0s000fvyh7c4bsk52z	admin_sore_001	\N	SYNC_TRANSACTIONS	Sync transaksi: 1 data baru	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 00:57:30.844
cmq07vf1d000hvyh7l87wv4jg	admin_sore_001	\N	SYNC_ORDERS	Sync status aktif: 0 tugas diperbarui	{"device": "Chrome · macOS", "synced": 0}	::1	2026-06-05 00:59:33.984
cmq07vilk000jvyh7vd7lp84p	admin_sore_001	\N	SYNC_ORDERS	Sync semua tugas: 1 data diperbarui	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 00:59:38.6
cmq08b43600052rrf9fvd5yeh	admin_sore_001	\N	SYNC_ORDERS	Sync semua tugas: 1 data diperbarui	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 01:11:46.291
cmq08ichi00072rrf5vac5twc	admin_sore_001	\N	SYNC_ORDERS	Sync semua tugas: 1 data diperbarui	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 01:17:23.766
cmq08igf300092rrfs4ec3shn	admin_sore_001	\N	SYNC_ORDERS	Sync status aktif: 1 tugas diperbarui	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 01:17:28.864
cmq096111000f2rrfb7issh29	admin_sore_001	\N	SYNC_ORDERS	Sync semua tugas: 1 data diperbarui	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 01:35:48.662
cmq0a0e4q0001p2lqcey8pr3x	admin_sore_001	\N	SYNC_ORDERS	Sync semua tugas: 1 data diperbarui	{"device": "Chrome · macOS", "synced": 1}	::1	2026-06-05 01:59:25.322
cmq0bqktt000511zy1zv6x32v	demo_user_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-05 02:47:46.673
cmq0c0ei80003dddnebop4rir	demo_user_001	\N	TOKEN_INJECT	Mengajukan permintaan 100 token	{"device": "Chrome · macOS", "requestId": "cmq0c0ei50001dddn6tnfxcvc"}	::1	2026-06-05 02:55:25.041
cmq0c0nzl0007dddnqrnjs5gt	demo_admin_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-05 02:55:37.33
cmq0c19v7000bdddnamqq0ysz	demo_admin_001	demo_user_001	TOKEN_INJECT	Menyetujui pengajuan 100 token untuk @userdemo	{"amount": 100, "device": "Chrome · macOS", "requestId": "cmq0c0ei50001dddn6tnfxcvc"}	::1	2026-06-05 02:56:05.684
cmq0c299b000fdddndho2mjcs	demo_user_001	\N	AUTH_LOGIN	Login berhasil	{"via": "username", "device": "Chrome · macOS"}	::1	2026-06-05 02:56:51.551
\.


--
-- Data for Name: config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.config (key, value, "updatedAt", "updatedBy") FROM stdin;
token_idr_value	10000	2026-06-04 22:29:30.4	\N
\.


--
-- Data for Name: panelin_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.panelin_orders (id, "serviceId", link, quantity, rate, charge, "startCount", remains, status, comments, "orderDate", "syncedAt") FROM stdin;
1	4	https://www.instagram.com/p/DYUI7FakUGt	1000	42000	42000	0	0	completed	\N	2026-06-05 00:56:13	2026-06-05 04:30:59.524
\.


--
-- Data for Name: panelin_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.panelin_services (id, name, description, category, type, rate, min, max, dripfeed, refill, cancel, "syncedAt") FROM stdin;
3	Instagram Report Post/Reels [Nudity / Sexual Activity]	Report postingan berbau pornografi/ketelanjangan. Target: Link Post/Reels.	Report	Default	40000	1000	50000	f	f	f	2026-06-04 20:30:48.268
26	Telegram Report Bot [Phishing / Penipuan]	Report bot Telegram phishing/penipuan. Target: Username Bot.	Report	Default	78000	1000	50000	f	f	f	2026-06-04 20:30:48.269
24	Telegram Report Channel [Pornography / Konten Dewasa]	Report channel Telegram konten pornografi. Target: Link Channel (t.me).	Report	Default	65000	1000	50000	f	f	f	2026-06-04 20:30:48.269
23	Telegram Report Channel [Scam / Penipuan]	Report channel Telegram penipuan/scam. Target: Link Channel (t.me).	Report	Default	70000	1000	50000	f	f	f	2026-06-04 20:30:48.269
25	Telegram Report Group [Spam Massal]	Report grup Telegram spam massal. Target: Link Grup (t.me).	Report	Default	58000	1000	50000	f	f	f	2026-06-04 20:30:48.269
28	Telegram Report Sticker Pack [Inappropriate Content]	Report sticker pack Telegram tidak pantas. Target: Link Sticker Pack.	Report	Default	52000	1000	50000	f	f	f	2026-06-04 20:30:48.269
17	Facebook Report Account [Fake Account / Identitas Palsu]	Report akun Facebook palsu/imitasi. Target: Link Profil/Page.	Report	Default	50000	1000	50000	f	f	f	2026-06-04 20:30:48.268
18	Facebook Report Account [Scam & Fraud]	Report akun Facebook penipuan. Target: Link Profil/Page.	Report	Default	48000	1000	50000	f	f	f	2026-06-04 20:30:48.268
19	Facebook Report Page [Hate Speech]	Report Fanpage Facebook ujaran kebencian. Target: Link Page.	Report	Default	46000	1000	50000	f	f	f	2026-06-04 20:30:48.268
21	Facebook Report Post [Bullying / Harassment]	Report postingan dengan unsur perundungan. Target: Link Post.	Report	Default	42000	1000	50000	f	f	f	2026-06-04 20:30:48.268
20	Facebook Report Post [Nudity / Sexual Content]	Report konten dewasa di postingan Facebook. Target: Link Post.	Report	Default	44000	1000	50000	f	f	f	2026-06-04 20:30:48.268
22	Facebook Report Reels/Video [Violence & Graphic]	Report video Facebook konten kekerasan/grafis. Target: Link Reels/Video.	Report	Default	47000	1000	50000	f	f	f	2026-06-04 20:30:48.268
1	Instagram Report Account [Impersonation / Akun Palsu]	Report akun dengan alasan berpura-pura menjadi orang lain. Target: Link Profil.	Report	Default	55000	1000	50000	f	f	f	2026-06-04 20:30:48.268
2	Instagram Report Account [Spam & Scam]	Report akun dengan alasan penipuan atau spam massal. Target: Link Profil.	Report	Default	45000	1000	50000	f	f	f	2026-06-04 20:30:48.268
4	Instagram Report Post/Reels [Hate Speech & Symbols]	Report postingan ujaran kebencian. Target: Link Post/Reels.	Report	Default	42000	1000	50000	f	f	f	2026-06-04 20:30:48.268
27	Telegram Report User [Harassment & Threats]	Report user Telegram pelecehan/ancaman. Target: Username/Link Profil.	Report	Default	60000	1000	50000	f	f	f	2026-06-04 20:30:48.269
6	TikTok Report Account [Frauds & Scams]	Report akun penipuan. Target: Link Profil TikTok.	Report	Default	60000	1000	50000	f	f	f	2026-06-04 20:30:48.269
5	TikTok Report Account [Underage / Di Bawah Umur]	Report akun pengguna di bawah usia 13 tahun. Target: Link Profil.	Report	Default	65000	1000	50000	f	f	f	2026-06-04 20:30:48.269
7	TikTok Report Video [Dangerous Acts / Aktivitas Berbahaya]	Report video yang menampilkan aktivitas membahayakan diri. Target: Link Video.	Report	Default	48000	1000	50000	f	f	f	2026-06-04 20:30:48.269
8	TikTok Report Video [Harassment & Bullying]	Report video dengan unsur perundungan. Target: Link Video.	Report	Default	52000	1000	50000	f	f	f	2026-06-04 20:30:48.269
9	Twitter/X Report Account [Fake / Bot Network]	Report akun bot spam di Twitter. Target: Link Profil X.	Report	Default	58000	1000	50000	f	f	f	2026-06-04 20:30:48.269
10	Twitter/X Report Account [Promoting Violence]	Report akun yang mempromosikan kekerasan. Target: Link Profil X.	Report	Default	62000	1000	50000	f	f	f	2026-06-04 20:30:48.269
11	Twitter/X Report Tweet [Abuse & Harassment]	Report cuitan yang menyerang personal. Target: Link Tweet.	Report	Default	48000	1000	50000	f	f	f	2026-06-04 20:30:48.269
12	Twitter/X Report Tweet [Sensitive / Graphic Media]	Report media/gambar eksplisit di dalam Tweet. Target: Link Tweet.	Report	Default	50000	1000	50000	f	f	f	2026-06-04 20:30:48.269
13	YouTube Report Channel [Impersonation]	Report channel yang mencuri identitas channel lain. Target: Link Channel.	Report	Default	95000	1000	50000	f	f	f	2026-06-04 20:30:48.269
16	YouTube Report Video [Copyright / Trademark Violation]	Report video yang melanggar hak cipta. Target: Link Video.	Report	Default	85000	1000	50000	f	f	f	2026-06-04 20:30:48.269
14	YouTube Report Video [Spam & Misleading]	Report video clickbait, scam, atau misleading. Target: Link Video.	Report	Default	75000	1000	50000	f	f	f	2026-06-04 20:30:48.269
15	YouTube Report Video [Violent or Repulsive Content]	Report konten menjijikkan atau terlalu brutal. Target: Link Video.	Report	Default	80000	1000	50000	f	f	f	2026-06-04 20:30:48.269
\.


--
-- Data for Name: panelin_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.panelin_transactions (id, type, amount, "balanceBefore", "balanceAfter", description, "transactionDate", "syncedAt") FROM stdin;
1	order_charge	-42000	2000000	1958000	\N	2026-06-05 00:56:13	2026-06-05 00:57:30.842
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
cmpzy3qma0001c0agkotr8kqn	277ba7a40c77699944a7b1ca569770f43b22e07aef19943b6f586b209d19fbc47506d76287f42850382727fee4ece29cb5af2a54b7cc15bc5b1fce69d448f4de	demo_user_001	2026-06-11 20:26:06.081	2026-06-04 20:26:06.082
cmq0b80sn0007p2lqm0wulq0k	3add11b9dd8faab1c649f514175411fde7922f1bd5203693ec8d351deaf18c5a8caebc332ba333684face8a7d1ca3f1db5b8f0ce5423ac9adc43d1638340ed31	demo_user_001	2026-06-12 02:33:20.902	2026-06-05 02:33:20.903
cmq0boov0000111zym6qyqftr	c6371e4d025f311df9f6f9d6ec20442ab028e88381290768edd8d226d4401cb60b7752b96709173b17e71ed20d2a286d000f939c1111314766b9bbdb9804fe27	admin_sore_001	2026-06-12 02:46:18.585	2026-06-05 02:46:18.588
cmq0bqktr000311zyql5przh0	1ca7536949d245761402df37ed754b85c089df44ae45f49851e205bf73498a2ce6d62c6aa48e96dabe8980bd57ed1f3d85ab8a56c19cc1d4a5121bac587cec5f	demo_user_001	2026-06-12 02:47:46.671	2026-06-05 02:47:46.672
cmq0c0nzk0005dddnz8q8ss5r	ff22312eb84d353065f102aad2246908b54ab087f38fbc497aa0541f5b630c8ad586d5e4c141db069fe5c44431fcb328edafb7e0ada116bca7ff4554ecb82bfb	demo_admin_001	2026-06-12 02:55:37.327	2026-06-05 02:55:37.328
cmq0fynq50001jqon655459aa	8db7805d29171baf54b376b69847cf301a33cc553ea3b65a501637c35eb63a01fb8dbb2cbb88ff70dc4a05d3dd356e84d58c0359e7276d431c4f74955221c09e	demo_user_001	2026-06-12 04:46:02.14	2026-06-05 04:46:02.141
\.


--
-- Data for Name: service_token_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_token_prices (id, "serviceId", "tokenPrice", "isActive", "updatedAt", "updatedBy") FROM stdin;
cmpzy64es0006c0aghdil32be	2	5	t	2026-06-04 20:27:57.238	admin_sore_001
cmpzy66690007c0ag02tarur2	3	4	t	2026-06-04 20:27:59.553	admin_sore_001
cmpzy67mg0008c0agte1erzgt	4	5	t	2026-06-04 20:28:01.432	admin_sore_001
cmpzy68n10009c0agkorqt3kt	5	7	t	2026-06-04 20:28:02.749	admin_sore_001
cmpzy6agq000ac0agnc480p3k	6	6	t	2026-06-04 20:28:05.114	admin_sore_001
cmpzy6cab000bc0agvr6q08za	7	5	t	2026-06-04 20:28:07.475	admin_sore_001
cmpzy6dy9000cc0aghfomrmm3	8	6	t	2026-06-04 20:28:09.634	admin_sore_001
cmpzy6f04000dc0agtz2pamnc	9	6	t	2026-06-04 20:28:10.997	admin_sore_001
cmpzy6gqv000ec0agmmi0lmr1	10	7	t	2026-06-04 20:28:13.255	admin_sore_001
cmpzy6ie7000fc0ag8klgq8ih	11	5	t	2026-06-04 20:28:15.392	admin_sore_001
cmpzy6kjz000gc0agbfu71zzq	12	5	t	2026-06-04 20:28:18.191	admin_sore_001
cmpzy6n8o000hc0agr9x9et9z	13	10	t	2026-06-04 20:28:21.673	admin_sore_001
cmpzy6pz8000ic0ag9mfvvgmo	14	8	t	2026-06-04 20:28:25.221	admin_sore_001
cmpzy6t8b000jc0agpwyoqv1r	15	8	t	2026-06-04 20:28:29.435	admin_sore_001
cmpzy6v0d000kc0agztrtwgg7	16	9	t	2026-06-04 20:28:31.741	admin_sore_001
cmpzy6x4a000lc0ag60ojitra	17	5	t	2026-06-04 20:28:34.474	admin_sore_001
cmpzy6zq6000mc0aggxc5htyy	18	5	t	2026-06-04 20:28:37.854	admin_sore_001
cmpzy7avu000nc0agclka861y	19	5	t	2026-06-04 20:28:52.314	admin_sore_001
cmpzy7ei8000oc0agwha8j1d4	20	5	t	2026-06-04 20:28:57.008	admin_sore_001
cmpzy7gd1000pc0ag2wvr9nbz	21	5	t	2026-06-04 20:28:59.413	admin_sore_001
cmpzy7ig6000qc0ag7jrabwk3	22	5	t	2026-06-04 20:29:02.118	admin_sore_001
cmpzy7kqi000rc0ag71wwrngv	23	7	t	2026-06-04 20:29:05.082	admin_sore_001
cmpzy7mql000sc0agq0kitx5v	24	7	t	2026-06-04 20:29:07.677	admin_sore_001
cmpzy7ohr000tc0agc3ajl0n9	25	6	t	2026-06-04 20:29:09.952	admin_sore_001
cmpzy7qdn000uc0aggihk040y	26	8	t	2026-06-04 20:29:12.395	admin_sore_001
cmpzy7s4j000vc0agn76ikh56	27	6	t	2026-06-04 20:29:14.659	admin_sore_001
cmpzy7ueo000wc0ag2zijc5k1	28	6	t	2026-06-04 20:29:17.617	admin_sore_001
cmpzozhq50000wyxjoo8kmm5n	1	6	t	2026-06-05 00:55:34.45	admin_sore_001
\.


--
-- Data for Name: token_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_requests (id, "userId", amount, reason, status, "adminNote", "reviewedBy", "reviewedAt", "createdAt") FROM stdin;
cmq0c0ei50001dddn6tnfxcvc	demo_user_001	100	\N	APPROVED	\N	demo_admin_001	2026-06-05 02:56:05.679	2026-06-05 02:55:25.038
\.


--
-- Data for Name: token_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.token_transactions (id, "userId", type, amount, "balanceBefore", "balanceAfter", note, "orderId", "serviceId", "tokenPrice", "performedBy", "createdAt") FROM stdin;
cmpzw95nd000364uby4tj7f13	demo_user_001	INJECT	50	0	50	Debug	\N	\N	\N	admin_sore_001	2026-06-04 19:34:19.608
cmq07r4kq0009vyh7bg7i7ao4	demo_user_001	ORDER	5	50	45	\N	1	4	5	\N	2026-06-05 00:56:13.802
cmq0c19v40009dddncfbntr0t	demo_user_001	INJECT	100	45	145	Disetujui dari pengajuan #nfxcvc	\N	\N	\N	demo_admin_001	2026-06-05 02:56:05.68
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password, "createdAt", "updatedAt", role, username, "tokenBalance", status, "failedAttempts", "lockedUntil") FROM stdin;
demo_admin_001	admindemo@somere.id	Admin Demo	$2a$12$KCKFSWfCdNt1CxAQWoCqcOgRuCjORxjtYuDq44p9gItXl6DyxT71.	2026-06-04 20:01:26.976	2026-06-04 20:01:26.976	ADMIN	admindemo	0	ACTIVE	0	\N
admin_sore_001	admin@somere.id	King Somere	$2a$12$GfgCh0tLAbywhkmg3VsTxOsCQjt3jePlAxsGIeYTkkp331JEzih6m	2026-06-04 19:40:22.748	2026-06-04 18:57:52.741	ADMIN	admin	0	ACTIVE	0	\N
demo_user_001	userdemo@somere.id	User Demo	$2a$12$zMwTQTuoTp2Z40JaYdo8t.ebP.gHGDO..FwprPGy/IBC16.MSQIu2	2026-06-04 20:01:26.976	2026-06-05 02:56:05.68	USER	userdemo	145	ACTIVE	0	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: config config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (key);


--
-- Name: panelin_orders panelin_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panelin_orders
    ADD CONSTRAINT panelin_orders_pkey PRIMARY KEY (id);


--
-- Name: panelin_services panelin_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panelin_services
    ADD CONSTRAINT panelin_services_pkey PRIMARY KEY (id);


--
-- Name: panelin_transactions panelin_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.panelin_transactions
    ADD CONSTRAINT panelin_transactions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: service_token_prices service_token_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_token_prices
    ADD CONSTRAINT service_token_prices_pkey PRIMARY KEY (id);


--
-- Name: token_requests token_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_requests
    ADD CONSTRAINT token_requests_pkey PRIMARY KEY (id);


--
-- Name: token_transactions token_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT token_transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: activity_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activity_logs_createdAt_idx" ON public.activity_logs USING btree ("createdAt");


--
-- Name: activity_logs_event_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX activity_logs_event_idx ON public.activity_logs USING btree (event);


--
-- Name: activity_logs_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activity_logs_userId_idx" ON public.activity_logs USING btree ("userId");


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: service_token_prices_serviceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "service_token_prices_serviceId_key" ON public.service_token_prices USING btree ("serviceId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: activity_logs activity_logs_targetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: token_requests token_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_requests
    ADD CONSTRAINT "token_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: token_transactions token_transactions_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT "token_transactions_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: token_transactions token_transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.token_transactions
    ADD CONSTRAINT "token_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7Jkp37eaNIaBFOHxuL4soG8y3cSKEgSgx4MRBNpAfPOymo7e6Ucsp9NvqGJmKou

