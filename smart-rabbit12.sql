--
-- PostgreSQL database dump
--

\restrict h8ntP9x24O8BM2veZxdf9nWgt0lHu9EdTXZfGfYQKOQIEBKsI9of6tgk3CUc0Pn

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: rabbit_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO rabbit_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: rabbit_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CageType" AS ENUM (
    'BREEDING',
    'WEANER'
);


ALTER TYPE public."CageType" OWNER TO postgres;

--
-- Name: HealthStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."HealthStatus" AS ENUM (
    'HEALTHY',
    'SICK',
    'INJURED'
);


ALTER TYPE public."HealthStatus" OWNER TO postgres;

--
-- Name: OffspringHealthStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OffspringHealthStatus" AS ENUM (
    'HEALTHY',
    'SICK',
    'INJURED'
);


ALTER TYPE public."OffspringHealthStatus" OWNER TO postgres;

--
-- Name: RabbitGender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RabbitGender" AS ENUM (
    'BUCK',
    'DOE'
);


ALTER TYPE public."RabbitGender" OWNER TO postgres;

--
-- Name: RabbitStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RabbitStatus" AS ENUM (
    'ACTIVE',
    'SOLD',
    'DECEASED',
    'WEANED'
);


ALTER TYPE public."RabbitStatus" OWNER TO postgres;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'SALE',
    'EXPENSE'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'WORKER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Birth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Birth" (
    id text NOT NULL,
    "matingId" text NOT NULL,
    "birthDate" timestamp(3) without time zone NOT NULL,
    "totalKits" integer NOT NULL,
    "aliveKits" integer NOT NULL,
    "deadKits" integer DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Birth" OWNER TO postgres;

--
-- Name: Cage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Cage" (
    id text NOT NULL,
    "cageId" text NOT NULL,
    type public."CageType" NOT NULL,
    "rabbitryId" text NOT NULL,
    capacity integer DEFAULT 1 NOT NULL,
    compartments integer DEFAULT 1 NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cage" OWNER TO postgres;

--
-- Name: Creditor; Type: TABLE; Schema: public; Owner: rabbit_user
--

CREATE TABLE public."Creditor" (
    id text NOT NULL,
    name text NOT NULL,
    contact text,
    "amountOwed" double precision NOT NULL,
    description text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Creditor" OWNER TO rabbit_user;

--
-- Name: Death; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Death" (
    id text NOT NULL,
    "rabbitId" text NOT NULL,
    "deathDate" timestamp(3) without time zone NOT NULL,
    cause text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Death" OWNER TO postgres;

--
-- Name: Debtor; Type: TABLE; Schema: public; Owner: rabbit_user
--

CREATE TABLE public."Debtor" (
    id text NOT NULL,
    name text NOT NULL,
    contact text,
    "amountOwed" double precision NOT NULL,
    description text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Debtor" OWNER TO rabbit_user;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    amount double precision NOT NULL,
    "expenseDate" timestamp(3) without time zone NOT NULL,
    vendor text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Expense" OWNER TO postgres;

--
-- Name: Location; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Location" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    address text,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Location" OWNER TO postgres;

--
-- Name: Mating; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Mating" (
    id text NOT NULL,
    "buckId" text NOT NULL,
    "doeId" text NOT NULL,
    "matingDate" timestamp(3) without time zone NOT NULL,
    "expectedKindlingDate" timestamp(3) without time zone,
    successful boolean DEFAULT false NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Mating" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: rabbit_user
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "userId" text,
    "relatedId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO rabbit_user;

--
-- Name: OffspringBatch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OffspringBatch" (
    id text NOT NULL,
    "batchId" text NOT NULL,
    "birthId" text NOT NULL,
    count integer NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    notes text,
    "sourceBatchId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "overallHealthStatus" public."OffspringHealthStatus" DEFAULT 'HEALTHY'::public."OffspringHealthStatus" NOT NULL,
    "cageId" text,
    compartment integer DEFAULT 1,
    "maleCount" integer,
    "femaleCount" integer,
    "sexedAt" timestamp(6) with time zone
);


ALTER TABLE public."OffspringBatch" OWNER TO postgres;

--
-- Name: OffspringBatchHealthHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OffspringBatchHealthHistory" (
    id text NOT NULL,
    "batchId" text NOT NULL,
    status public."OffspringHealthStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OffspringBatchHealthHistory" OWNER TO postgres;

--
-- Name: OffspringDeath; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OffspringDeath" (
    id text NOT NULL,
    "birthId" text NOT NULL,
    "deathDate" timestamp(3) without time zone NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    cause text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OffspringDeath" OWNER TO postgres;

--
-- Name: OffspringWeight; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OffspringWeight" (
    id text NOT NULL,
    "batchId" text NOT NULL,
    weight double precision NOT NULL,
    "measurementDate" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OffspringWeight" OWNER TO postgres;

--
-- Name: Rabbit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Rabbit" (
    id text NOT NULL,
    "rabbitId" text NOT NULL,
    name text,
    gender public."RabbitGender" NOT NULL,
    breed text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "cageId" text NOT NULL,
    status public."RabbitStatus" DEFAULT 'ACTIVE'::public."RabbitStatus" NOT NULL,
    "healthStatus" public."HealthStatus" DEFAULT 'HEALTHY'::public."HealthStatus" NOT NULL,
    "healthDescription" text,
    color text,
    "motherId" text,
    "fatherId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    compartment integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Rabbit" OWNER TO postgres;

--
-- Name: Rabbitry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Rabbitry" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "locationId" text NOT NULL,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Rabbitry" OWNER TO postgres;

--
-- Name: RabbitryWorker; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RabbitryWorker" (
    id text NOT NULL,
    "rabbitryId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'worker'::text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RabbitryWorker" OWNER TO postgres;

--
-- Name: Sale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sale" (
    id text NOT NULL,
    "rabbitId" text,
    description text NOT NULL,
    amount double precision NOT NULL,
    "saleDate" timestamp(3) without time zone NOT NULL,
    "buyerName" text,
    "buyerContact" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sale" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'OWNER'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO postgres;

--
-- Name: WeightMeasurement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WeightMeasurement" (
    id text NOT NULL,
    "rabbitId" text NOT NULL,
    weight double precision NOT NULL,
    "measurementDate" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WeightMeasurement" OWNER TO postgres;

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
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: Birth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Birth" (id, "matingId", "birthDate", "totalKits", "aliveKits", "deadKits", notes, "createdAt", "updatedAt") FROM stdin;
cmi7qnfss000pdvb4pjpzux6i	cmi7qm9s6000ndvb4gahk4koy	2025-09-25 22:00:00	9	9	0	100 % successful delivery	2025-11-20 16:01:58.971	2025-11-20 16:01:58.971
cmi7qsqu7000xdvb4o1cq0o8b	cmi7qrpk9000vdvb4wj93s4o9	2025-09-27 22:00:00	9	9	0	100% successful birth	2025-11-20 16:06:06.558	2025-11-20 16:06:06.558
cmi7uusha000fdve45k44v400	cmi7ql57l000ldvb4cqyz92x3	2025-10-29 22:00:00	10	10	0	100% success	2025-11-20 17:59:40.118	2025-11-20 18:00:31.853
cmi7qq2xu000tdvb4tersb3o6	cmi7qorrl000rdvb41lagyios	2025-09-26 22:00:00	8	3	5	5 died..birth occured outside cage	2025-11-20 16:04:02.1	2025-11-20 21:34:38.618
\.


--
-- Data for Name: Cage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Cage" (id, "cageId", type, "rabbitryId", capacity, compartments, description, "createdAt", "updatedAt") FROM stdin;
cmi7psk260007dvrssgha1kf9	BC-001	BREEDING	cmi7prz7e0005dvrsptxfllf7	12	12		2025-11-20 17:37:58.157	2025-11-20 17:37:58.157
\.


--
-- Data for Name: Creditor; Type: TABLE DATA; Schema: public; Owner: rabbit_user
--

COPY public."Creditor" (id, name, contact, "amountOwed", description, "dueDate", status, notes, "createdAt", "updatedAt") FROM stdin;
cmk5pyi8w0000s6jiz13d41ey	Dad		19	Scale purchase	2026-01-08 00:00:00	PENDING		2026-01-08 17:26:28.064	2026-01-08 17:26:28.064
\.


--
-- Data for Name: Death; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Death" (id, "rabbitId", "deathDate", cause, notes, "createdAt", "updatedAt") FROM stdin;
cmi7ukt0r000adve4cpg5k3d8	cmi7qgdlt0009dvb4ci051zce	2025-11-11 00:00:00	Cold Stress	Pneumonia from post mortem	2025-11-20 19:51:54.603	2025-11-20 19:51:54.603
\.


--
-- Data for Name: Debtor; Type: TABLE DATA; Schema: public; Owner: rabbit_user
--

COPY public."Debtor" (id, name, contact, "amountOwed", description, "dueDate", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expense" (id, description, category, amount, "expenseDate", vendor, notes, "createdAt", "updatedAt") FROM stdin;
cmi7ufluq0007dve43ebkis8q	Hay Feed - 3 bales ($4 each)	Feed	12	2025-11-02 00:00:00	Hay supplier		2025-11-20 19:47:52.034	2025-11-20 19:47:52.034
cmi7x0jf60001dvuw0gze65bj	Weight Scale purchase	Equipment	20	2025-09-13 00:00:00			2025-11-20 21:00:07.827	2025-11-20 21:00:07.827
cmi7ulok8000bdve4oq4pwhn4	Post mortem fee	Feed	10	2025-11-20 00:00:00	Vet doctor		2025-11-20 19:52:35.48	2025-11-20 21:11:20.641
cmi7ugigj0008dve4is42c5a7	50 Kg pellet feed	Feed	24	2025-11-02 00:00:00	Farm n City		2025-11-20 19:48:34.291	2025-11-20 21:11:29.124
cmin4vxeu0001tgddrc3iqw6f	Transport fee	Other	1	2025-12-01 00:00:00	Makos		2025-12-01 12:37:02.31	2025-12-01 12:37:02.31
cmiq8fhje0005tgddik75rm8o	3 Hay Bales	Feed	12	2025-12-03 00:00:00	Kuwadzana supplier		2025-12-03 16:39:32.234	2025-12-03 16:39:32.234
cmin4x86o0002tgddtw5brows	50 Kg feed	Feed	24	2025-12-01 00:00:00	National Foods		2025-12-01 12:38:02.927	2025-12-03 16:39:59.851
\.


--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Location" (id, name, description, type, address, "userId", "createdAt", "updatedAt") FROM stdin;
cmi7pqent0003dvrsm0num28m	Mush Rabbits	Rabbit farming family business	backyard	9647 Nhiriri Road Mufakose Harare	cmi7pgkn40000dvrsr3fvzjpq	2025-11-20 17:36:17.846	2025-11-24 20:59:55.196
\.


--
-- Data for Name: Mating; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Mating" (id, "buckId", "doeId", "matingDate", "expectedKindlingDate", successful, notes, "createdAt", "updatedAt") FROM stdin;
cmi7qm9s6000ndvb4gahk4koy	cmi7qe2zk0001dvb43pe801zu	cmi7qiau0000ddvb4rh0letw4	2025-08-24 00:00:00	2025-09-23 00:00:00	t	Successful mating	2025-11-20 18:01:04.518	2025-11-20 18:01:58.994
cmi7qorrl000rdvb41lagyios	cmi7qe2zk0001dvb43pe801zu	cmi7qj5vs000hdvb40ggli70q	2025-08-24 00:00:00	2025-09-23 00:00:00	t	Successful mating	2025-11-20 18:03:01.137	2025-11-20 18:04:02.302
cmi7qrpk9000vdvb4wj93s4o9	cmi7qe2zk0001dvb43pe801zu	cmi7qff1l0005dvb4xmsq7999	2025-08-25 00:00:00	2025-09-24 00:00:00	t	Successful mating	2025-11-20 18:05:18.249	2025-11-20 18:06:06.577
cmi7ql57l000ldvb4cqyz92x3	cmi7qe2zk0001dvb43pe801zu	cmi7qgdlt0009dvb4ci051zce	2025-09-24 00:00:00	2025-10-24 00:00:00	t	Successful mating	2025-11-20 18:00:11.937	2025-11-20 19:59:40.545
cmj922nae0001s6oq4iz79fk5	cmi7qe2zk0001dvb43pe801zu	cmi7qj5vs000hdvb40ggli70q	2025-12-09 00:00:00	2026-01-08 00:00:00	f		2025-12-16 20:49:12.806	2025-12-16 20:49:12.806
cmj92315o0003s6oq2e08z1v5	cmi7qe2zk0001dvb43pe801zu	cmi7qiau0000ddvb4rh0letw4	2025-12-09 00:00:00	2026-01-08 00:00:00	f		2025-12-16 20:49:30.78	2025-12-16 20:49:30.78
cmj923b760005s6oq9ebuesjt	cmi7qe2zk0001dvb43pe801zu	cmi7qff1l0005dvb4xmsq7999	2025-12-09 00:00:00	2026-01-08 00:00:00	f		2025-12-16 20:49:43.795	2025-12-16 20:49:43.795
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: rabbit_user
--

COPY public."Notification" (id, type, title, message, priority, read, "userId", "relatedId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OffspringBatch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OffspringBatch" (id, "batchId", "birthId", count, status, notes, "sourceBatchId", "createdAt", "updatedAt", "overallHealthStatus", "cageId", compartment, "maleCount", "femaleCount", "sexedAt") FROM stdin;
cmi80vro80007dvrg8if02xrb	BTC-004	cmi7qq2xu000tdvb4tersb3o6	1	ARCHIVED	\N	\N	2025-11-20 20:48:23.769	2025-11-26 18:30:14.005	HEALTHY	cmi7psk260007dvrssgha1kf9	2	\N	\N	\N
cmigcavzd0001dvs08n56oc3c	BTC-005	cmi7qq2xu000tdvb4tersb3o6	1	SEXED	\N	cmi80vro80007dvrg8if02xrb	2025-11-26 18:30:14.373	2025-11-26 18:30:14.373	HEALTHY	cmi7psk260007dvrssgha1kf9	11	0	1	\N
cmi80v2h50005dvrg0toij07z	BTC-003	cmi7qnfss000pdvb4pjpzux6i	9	ARCHIVED	\N	\N	2025-11-20 20:47:51.113	2025-11-26 18:34:12.22	HEALTHY	cmi7psk260007dvrssgha1kf9	5	\N	\N	\N
cmigcfzib000ddvs0h5fktnzw	BTC-006	cmi7qnfss000pdvb4pjpzux6i	5	SEXED	\N	cmi80v2h50005dvrg0toij07z	2025-11-26 18:34:12.227	2025-11-26 18:34:12.227	HEALTHY	cmi7psk260007dvrssgha1kf9	10	5	0	\N
cmigcfzjo000hdvs09zawzh0f	BTC-007	cmi7qnfss000pdvb4pjpzux6i	4	SEXED	\N	cmi80v2h50005dvrg0toij07z	2025-11-26 18:34:12.276	2025-11-26 18:34:12.276	HEALTHY	cmi7psk260007dvrssgha1kf9	11	0	4	\N
cmi8097x70003dvrgx8idmqgm	BTC-002	cmi7qsqu7000xdvb4o1cq0o8b	5	ARCHIVED	\N	\N	2025-11-20 20:30:51.74	2025-11-26 18:35:32.897	HEALTHY	cmi7psk260007dvrssgha1kf9	2	\N	\N	\N
cmigchprc000ldvs0thbcqyzy	BTC-008	cmi7qsqu7000xdvb4o1cq0o8b	4	SEXED	\N	cmi8097x70003dvrgx8idmqgm	2025-11-26 18:35:32.904	2025-11-26 18:35:32.904	HEALTHY	cmi7psk260007dvrssgha1kf9	7	4	0	\N
cmigchpsb000pdvs0hfxjcq11	BTC-009	cmi7qsqu7000xdvb4o1cq0o8b	1	SEXED	\N	cmi8097x70003dvrgx8idmqgm	2025-11-26 18:35:32.939	2025-11-26 18:35:32.939	HEALTHY	cmi7psk260007dvrssgha1kf9	11	0	1	\N
cmi808unt0001dvrgbjf5f8au	BTC-001	cmi7uusha000fdve45k44v400	10	ARCHIVED	\N	\N	2025-11-20 20:30:34.548	2026-01-06 22:20:46.947	HEALTHY	cmi7psk260007dvrssgha1kf9	12	\N	\N	\N
cmk35lalh0003s6kht1ue88es	BTC-010	cmi7uusha000fdve45k44v400	4	SEXED	\N	cmi808unt0001dvrgbjf5f8au	2026-01-06 22:20:46.949	2026-01-06 22:20:46.949	HEALTHY	cmi7psk260007dvrssgha1kf9	10	4	0	\N
cmk35lalp0007s6kh383wu6yq	BTC-011	cmi7uusha000fdve45k44v400	3	SEXED	\N	cmi808unt0001dvrgbjf5f8au	2026-01-06 22:20:46.957	2026-01-06 22:20:46.957	HEALTHY	cmi7psk260007dvrssgha1kf9	12	0	3	\N
\.


--
-- Data for Name: OffspringBatchHealthHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OffspringBatchHealthHistory" (id, "batchId", status, notes, "createdAt") FROM stdin;
cmigcaw0f0003dvs06gql1pzr	cmigcavzd0001dvs08n56oc3c	HEALTHY	Created via sexing/splitting from batch BTC-004	2025-11-26 18:30:14.415
cmigcfzjg000fdvs0z42g54r4	cmigcfzib000ddvs0h5fktnzw	HEALTHY	Created via sexing/splitting from batch BTC-003	2025-11-26 18:34:12.268
cmigcfzkg000jdvs0qhn3we0w	cmigcfzjo000hdvs09zawzh0f	HEALTHY	Created via sexing/splitting from batch BTC-003	2025-11-26 18:34:12.305
cmigchps2000ndvs0n1lyd9n6	cmigchprc000ldvs0thbcqyzy	HEALTHY	Created via sexing/splitting from batch BTC-002	2025-11-26 18:35:32.931
cmigchpt0000rdvs0jobbjltq	cmigchpsb000pdvs0hfxjcq11	HEALTHY	Created via sexing/splitting from batch BTC-002	2025-11-26 18:35:32.964
cmk35i8ni0001s6kha52yvl0a	cmi808unt0001dvrgbjf5f8au	HEALTHY	Status changed from INJURED to HEALTHY	2026-01-06 22:18:24.463
cmk35lalo0005s6khx3psdbnr	cmk35lalh0003s6kht1ue88es	HEALTHY	Created via sexing/splitting from batch BTC-001. Original recorded count 10; current alive 7.	2026-01-06 22:20:46.956
cmk35lalv0009s6khrhsl1sdm	cmk35lalp0007s6kh383wu6yq	HEALTHY	Created via sexing/splitting from batch BTC-001. Original recorded count 10; current alive 7.	2026-01-06 22:20:46.964
\.


--
-- Data for Name: OffspringDeath; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OffspringDeath" (id, "birthId", "deathDate", count, cause, notes, "createdAt", "updatedAt") FROM stdin;
cmi7ra1s30001dve4q3ik4vxr	cmi7qsqu7000xdvb4o1cq0o8b	2025-09-28 22:00:00	1	Injury	Suspected crushing	2025-11-20 16:19:33.888	2025-11-20 16:19:33.888
cmi7u51lt0003dve4d4nqvgp0	cmi7qq2xu000tdvb4tersb3o6	2025-10-05 22:00:00	1	Malnutrition	Kit was not feeding mother's milk	2025-11-20 17:39:39.071	2025-11-20 17:39:39.071
cmi7ud0z10006dve48p9im8k6	cmi7qsqu7000xdvb4o1cq0o8b	2025-10-23 22:00:00	2	Injury	Suspected crushing	2025-11-20 17:45:51.608	2025-11-20 17:45:51.608
cmi7un22s000ddve4f17v9ves	cmi7qsqu7000xdvb4o1cq0o8b	2025-11-19 22:00:00	1	Injury	Suspected crushing	2025-11-20 17:53:39.651	2025-11-20 17:53:39.651
cmiijmkdd0001tg8tcng5g3ps	cmi7uusha000fdve45k44v400	2025-11-28 00:00:00	1	Unknown	No sign of crushing or other visible causes	2025-11-28 07:30:48.864	2025-11-28 07:30:48.864
cmiirak3m0001tgyzn0euzulg	cmi7qq2xu000tdvb4tersb3o6	2025-11-06 00:00:00	1	Other	Escaped cage ,suspected eaten by a cat	2025-11-28 11:05:25.57	2025-11-28 11:05:25.57
cmio9snrj0004tgddzyq2cb8s	cmi7uusha000fdve45k44v400	2025-12-02 00:00:00	1	Unknown		2025-12-02 07:42:14.095	2025-12-02 07:42:14.095
cmj924wz00007s6oqb6s3kukb	cmi7uusha000fdve45k44v400	2025-12-04 00:00:00	1	Injury	crushed under weight	2025-12-16 20:50:58.668	2025-12-16 20:50:58.668
\.


--
-- Data for Name: OffspringWeight; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OffspringWeight" (id, "batchId", weight, "measurementDate", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Rabbit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Rabbit" (id, "rabbitId", name, gender, breed, "dateOfBirth", "cageId", status, "healthStatus", "healthDescription", color, "motherId", "fatherId", notes, "createdAt", "updatedAt", compartment) FROM stdin;
cmi7qj5vs000hdvb40ggli70q	D-004	Eve 4	DOE	Californian	2025-01-01 00:00:00	cmi7psk260007dvrssgha1kf9	ACTIVE	HEALTHY		white	\N	\N		2025-11-20 17:58:39.496	2025-11-20 17:58:39.496	8
cmi7qgdlt0009dvb4ci051zce	D-002	Eve 2	DOE	Californian	2025-01-01 00:00:00	cmi7psk260007dvrssgha1kf9	DECEASED	HEALTHY		white	\N	\N		2025-11-20 17:56:29.537	2025-11-20 19:51:54.612	3
cmi7qff1l0005dvb4xmsq7999	D-001	Eve 1	DOE	Californian	2025-01-01 00:00:00	cmi7psk260007dvrssgha1kf9	ACTIVE	HEALTHY		white	\N	\N		2025-11-20 17:55:44.745	2025-11-20 22:03:48.346	2
cmi7qe2zk0001dvb43pe801zu	B-001	Adam	BUCK	Californian	2025-01-01 00:00:00	cmi7psk260007dvrssgha1kf9	ACTIVE	HEALTHY	Not feeding	white	\N	\N		2025-11-20 17:54:42.463	2025-11-21 00:02:38.722	9
cmi7qiau0000ddvb4rh0letw4	D-003	Eve 3	DOE	Californian	2025-01-01 00:00:00	cmi7psk260007dvrssgha1kf9	ACTIVE	HEALTHY	Eating less	white	\N	\N		2025-11-20 17:57:59.257	2025-11-24 22:23:50.009	5
\.


--
-- Data for Name: Rabbitry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Rabbitry" (id, name, description, "locationId", "ownerId", "createdAt", "updatedAt") FROM stdin;
cmi7prz7e0005dvrsptxfllf7	Rabbit Shed	Backyard shed	cmi7pqent0003dvrsm0num28m	cmi7pgkn40000dvrsr3fvzjpq	2025-11-20 17:37:31.131	2025-11-20 17:37:31.131
\.


--
-- Data for Name: RabbitryWorker; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RabbitryWorker" (id, "rabbitryId", "userId", role, "assignedAt") FROM stdin;
cmi7x2p9f0003dvuwcmi6ftqw	cmi7prz7e0005dvrsptxfllf7	cmi7pgkn40000dvrsr3fvzjpq	supervisor	2025-11-20 21:01:48.77
cmi7xat75000ddvuwthaichjy	cmi7prz7e0005dvrsptxfllf7	cmi7x9ymj0009dvuwqto0dsm5	worker	2025-11-20 21:08:07.121
\.


--
-- Data for Name: Sale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sale" (id, "rabbitId", description, amount, "saleDate", "buyerName", "buyerContact", notes, "createdAt", "updatedAt") FROM stdin;
cmi7u9lxr0004dve4k84vd20n	\N	Rabbit sale	30	2025-10-06 00:00:00	Baba Jay			2025-11-20 19:43:12.207	2025-11-20 19:43:12.207
cmi7wwiqt0000dvuw3mpsr91q	\N	Meat Sale	40.5	2025-08-16 00:00:00	Reymeg			2025-11-20 20:57:00.387	2025-11-20 21:11:51.328
cmin4uryd0000tgdd7x4oep6o	\N	Meat Sale	40.75	2025-12-01 00:00:00	Raymeg			2025-12-01 12:36:08.581	2025-12-01 12:36:08.581
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, "createdAt", "updatedAt") FROM stdin;
cmi7pgkn40000dvrsr3fvzjpq	Makomborero Mushangwe	makomushangwe88@gmail.com	\N	\N	$2b$12$nXyGWsTpo9aqsqCuW8A4wegpqgHreWMz/txvYVfMW7qeYdl1rIpmW	OWNER	2025-11-20 17:28:39.039	2025-11-20 21:01:48.751
cmi7x9ymj0009dvuwqto0dsm5	Worker 1	worker1@smartrabbit.com	\N	\N	$2b$12$F1XeNDdaYwpZpHVTJl91SOo5alx7tYFTMi.wGzmA.siHzIB01TMry	WORKER	2025-11-20 21:07:27.499	2025-11-20 21:08:07.09
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Data for Name: WeightMeasurement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WeightMeasurement" (id, "rabbitId", weight, "measurementDate", notes, "createdAt", "updatedAt") FROM stdin;
cmi7qe30g0003dvb4zslopbtw	cmi7qe2zk0001dvb43pe801zu	5	2025-11-20 17:54:42.489	\N	2025-11-20 17:54:42.496	2025-11-20 17:54:42.496
cmi7qff250007dvb4xbtakoqv	cmi7qff1l0005dvb4xmsq7999	5	2025-11-20 17:55:44.76	\N	2025-11-20 17:55:44.765	2025-11-20 17:55:44.765
cmi7qgdm7000bdvb4woxxikxb	cmi7qgdlt0009dvb4ci051zce	5	2025-11-20 17:56:29.547	\N	2025-11-20 17:56:29.551	2025-11-20 17:56:29.551
cmi7qiauf000fdvb452lc7iql	cmi7qiau0000ddvb4rh0letw4	5	2025-11-20 17:57:59.267	\N	2025-11-20 17:57:59.271	2025-11-20 17:57:59.271
cmi7qj5wc000jdvb4ivi6e9fe	cmi7qj5vs000hdvb40ggli70q	5	2025-11-20 17:58:39.514	\N	2025-11-20 17:58:39.516	2025-11-20 17:58:39.516
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9a75c661-4cd6-4d19-a6bf-29161dfc202e	c760d8bb841d1efa68b0a600c700a9ec1cf73e5bdce35264eda69c6af9718c12	2025-11-26 17:46:41.299792+00	20251126174640_sexing_module_fix	\N	\N	2025-11-26 17:46:40.917085+00	1
9f1752eb-0952-4058-b0e0-e740eb2ef3e9	10c51d4cb0c384e5c21cdea41b07140adb4a30d2e5d123c2760b5eb9604902e2	2026-01-06 22:02:14.974879+00	20260106164956_add_debtors_creditors	\N	\N	2026-01-06 22:02:14.94988+00	1
c6bd799d-dc04-4d2a-9a6d-a0e56a07c6b0	8ce572d49b1141b10e2b9b585deeaeb420a987cffbbef1f739f7d39cab025816	2026-01-06 22:02:14.981487+00	20260106170410_add_notifications	\N	\N	2026-01-06 22:02:14.975398+00	1
5ad1186c-bf6f-4e48-bfdf-5b7e63e722f8	36e8984895095d1248af20af84ab74db0b78f9726b41b8a8156a5297aa404757	\N	20260110223310_add_batch_sales	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260110223310_add_batch_sales\n\nDatabase error code: 42501\n\nDatabase error:\nERROR: must be owner of table Sale\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42501), message: "must be owner of table Sale", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("aclchk.c"), line: Some(2950), routine: Some("aclcheck_error") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260110223310_add_batch_sales"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260110223310_add_batch_sales"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-01-12 00:49:35.248299+00	2026-01-12 00:16:46.180016+00	0
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Birth Birth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Birth"
    ADD CONSTRAINT "Birth_pkey" PRIMARY KEY (id);


--
-- Name: Cage Cage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cage"
    ADD CONSTRAINT "Cage_pkey" PRIMARY KEY (id);


--
-- Name: Creditor Creditor_pkey; Type: CONSTRAINT; Schema: public; Owner: rabbit_user
--

ALTER TABLE ONLY public."Creditor"
    ADD CONSTRAINT "Creditor_pkey" PRIMARY KEY (id);


--
-- Name: Death Death_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Death"
    ADD CONSTRAINT "Death_pkey" PRIMARY KEY (id);


--
-- Name: Debtor Debtor_pkey; Type: CONSTRAINT; Schema: public; Owner: rabbit_user
--

ALTER TABLE ONLY public."Debtor"
    ADD CONSTRAINT "Debtor_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: Location Location_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_pkey" PRIMARY KEY (id);


--
-- Name: Mating Mating_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mating"
    ADD CONSTRAINT "Mating_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: rabbit_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OffspringBatchHealthHistory OffspringBatchHealthHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringBatchHealthHistory"
    ADD CONSTRAINT "OffspringBatchHealthHistory_pkey" PRIMARY KEY (id);


--
-- Name: OffspringBatch OffspringBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringBatch"
    ADD CONSTRAINT "OffspringBatch_pkey" PRIMARY KEY (id);


--
-- Name: OffspringDeath OffspringDeath_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringDeath"
    ADD CONSTRAINT "OffspringDeath_pkey" PRIMARY KEY (id);


--
-- Name: OffspringWeight OffspringWeight_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringWeight"
    ADD CONSTRAINT "OffspringWeight_pkey" PRIMARY KEY (id);


--
-- Name: Rabbit Rabbit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbit"
    ADD CONSTRAINT "Rabbit_pkey" PRIMARY KEY (id);


--
-- Name: RabbitryWorker RabbitryWorker_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RabbitryWorker"
    ADD CONSTRAINT "RabbitryWorker_pkey" PRIMARY KEY (id);


--
-- Name: Rabbitry Rabbitry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbitry"
    ADD CONSTRAINT "Rabbitry_pkey" PRIMARY KEY (id);


--
-- Name: Sale Sale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WeightMeasurement WeightMeasurement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WeightMeasurement"
    ADD CONSTRAINT "WeightMeasurement_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Cage_cageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Cage_cageId_key" ON public."Cage" USING btree ("cageId");


--
-- Name: OffspringBatch_batchId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OffspringBatch_batchId_key" ON public."OffspringBatch" USING btree ("batchId");


--
-- Name: Rabbit_rabbitId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Rabbit_rabbitId_key" ON public."Rabbit" USING btree ("rabbitId");


--
-- Name: RabbitryWorker_rabbitryId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RabbitryWorker_rabbitryId_userId_key" ON public."RabbitryWorker" USING btree ("rabbitryId", "userId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Birth Birth_matingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Birth"
    ADD CONSTRAINT "Birth_matingId_fkey" FOREIGN KEY ("matingId") REFERENCES public."Mating"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cage Cage_rabbitryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cage"
    ADD CONSTRAINT "Cage_rabbitryId_fkey" FOREIGN KEY ("rabbitryId") REFERENCES public."Rabbitry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Death Death_rabbitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Death"
    ADD CONSTRAINT "Death_rabbitId_fkey" FOREIGN KEY ("rabbitId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Location Location_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mating Mating_buckId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mating"
    ADD CONSTRAINT "Mating_buckId_fkey" FOREIGN KEY ("buckId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Mating Mating_doeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Mating"
    ADD CONSTRAINT "Mating_doeId_fkey" FOREIGN KEY ("doeId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OffspringBatchHealthHistory OffspringBatchHealthHistory_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringBatchHealthHistory"
    ADD CONSTRAINT "OffspringBatchHealthHistory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."OffspringBatch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OffspringBatch OffspringBatch_birthId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringBatch"
    ADD CONSTRAINT "OffspringBatch_birthId_fkey" FOREIGN KEY ("birthId") REFERENCES public."Birth"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OffspringDeath OffspringDeath_birthId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringDeath"
    ADD CONSTRAINT "OffspringDeath_birthId_fkey" FOREIGN KEY ("birthId") REFERENCES public."Birth"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OffspringWeight OffspringWeight_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringWeight"
    ADD CONSTRAINT "OffspringWeight_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."OffspringBatch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rabbit Rabbit_cageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbit"
    ADD CONSTRAINT "Rabbit_cageId_fkey" FOREIGN KEY ("cageId") REFERENCES public."Cage"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rabbit Rabbit_fatherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbit"
    ADD CONSTRAINT "Rabbit_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Rabbit Rabbit_motherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbit"
    ADD CONSTRAINT "Rabbit_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RabbitryWorker RabbitryWorker_rabbitryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RabbitryWorker"
    ADD CONSTRAINT "RabbitryWorker_rabbitryId_fkey" FOREIGN KEY ("rabbitryId") REFERENCES public."Rabbitry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RabbitryWorker RabbitryWorker_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RabbitryWorker"
    ADD CONSTRAINT "RabbitryWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rabbitry Rabbitry_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbitry"
    ADD CONSTRAINT "Rabbitry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rabbitry Rabbitry_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Rabbitry"
    ADD CONSTRAINT "Rabbitry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sale Sale_rabbitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_rabbitId_fkey" FOREIGN KEY ("rabbitId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WeightMeasurement WeightMeasurement_rabbitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WeightMeasurement"
    ADD CONSTRAINT "WeightMeasurement_rabbitId_fkey" FOREIGN KEY ("rabbitId") REFERENCES public."Rabbit"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OffspringBatch fk_cage; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OffspringBatch"
    ADD CONSTRAINT fk_cage FOREIGN KEY ("cageId") REFERENCES public."Cage"(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: rabbit_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: TABLE "Account"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Account" TO rabbit_user;


--
-- Name: TABLE "Birth"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Birth" TO rabbit_user;


--
-- Name: TABLE "Cage"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Cage" TO rabbit_user;


--
-- Name: TABLE "Death"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Death" TO rabbit_user;


--
-- Name: TABLE "Expense"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Expense" TO rabbit_user;


--
-- Name: TABLE "Location"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Location" TO rabbit_user;


--
-- Name: TABLE "Mating"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Mating" TO rabbit_user;


--
-- Name: TABLE "OffspringBatch"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."OffspringBatch" TO rabbit_user;


--
-- Name: TABLE "OffspringBatchHealthHistory"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."OffspringBatchHealthHistory" TO rabbit_user;


--
-- Name: TABLE "OffspringDeath"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."OffspringDeath" TO rabbit_user;


--
-- Name: TABLE "OffspringWeight"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."OffspringWeight" TO rabbit_user;


--
-- Name: TABLE "Rabbit"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Rabbit" TO rabbit_user;


--
-- Name: TABLE "Rabbitry"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Rabbitry" TO rabbit_user;


--
-- Name: TABLE "RabbitryWorker"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."RabbitryWorker" TO rabbit_user;


--
-- Name: TABLE "Sale"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Sale" TO rabbit_user;


--
-- Name: TABLE "Session"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."Session" TO rabbit_user;


--
-- Name: TABLE "User"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."User" TO rabbit_user;


--
-- Name: TABLE "VerificationToken"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."VerificationToken" TO rabbit_user;


--
-- Name: TABLE "WeightMeasurement"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."WeightMeasurement" TO rabbit_user;


--
-- Name: TABLE _prisma_migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._prisma_migrations TO rabbit_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO rabbit_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO rabbit_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO rabbit_user;


--
-- PostgreSQL database dump complete
--

\unrestrict h8ntP9x24O8BM2veZxdf9nWgt0lHu9EdTXZfGfYQKOQIEBKsI9of6tgk3CUc0Pn

