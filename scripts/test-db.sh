#!/usr/bin/env bash
# Applies the migrations + seed to a scratch database and runs the RLS tests.
# Requires psql and a PostgreSQL server. Connection via standard PG* env vars,
# e.g. PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=postgres.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${LOOP_TEST_DB:-loop_test}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }
run supabase/tests/auth-stub.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/tests/grants-stub.sql
run supabase/seed.sql
psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f supabase/tests/rls_test.sql 2>&1 | sed -n "s/.*NOTICE:  //p"
echo "Database tests passed."
