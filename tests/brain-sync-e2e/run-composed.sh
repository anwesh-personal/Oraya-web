#!/usr/bin/env bash
set -euo pipefail

# Hermetic: loopback-only container, generated test HMAC, no Supabase/anchor
# credentials, and a guaranteed docker teardown even when the test fails.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ORAKHOS="$(cd "$ROOT/../Orakhos" && pwd)"
COMPOSE="$ROOT/tests/brain-sync-e2e/compose.yml"
DB_URL="postgresql://brain_e2e:ephemeral_only@127.0.0.1:55437/brain_e2e"
PORT=3107
JWT_SECRET="brain-sync-e2e-local-only-hmac-key"
USER_ID="00000000-0000-0000-0000-000000000001"
LOG="$(mktemp -t brain-sync-e2e.XXXXXX.log)"
NEXT_PID=""

cleanup() {
  if [[ -n "$NEXT_PID" ]]; then kill "$NEXT_PID" 2>/dev/null || true; wait "$NEXT_PID" 2>/dev/null || true; fi
  docker compose -f "$COMPOSE" down -v --remove-orphans >/dev/null
}
trap cleanup EXIT

docker compose -f "$COMPOSE" down -v --remove-orphans >/dev/null
docker compose -f "$COMPOSE" up -d --wait
psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO auth.users (id) VALUES ('$USER_ID');
INSERT INTO agent_brains (agent_id,user_id,display_name,synced_brain,sync_target,sync_embedding_model,sync_state)
VALUES ('ora','$USER_ID','Ora E2E',true,'cloud','Qwen3-Embedding-0.6B','configured');
INSERT INTO agent_brains (agent_id,user_id,display_name,synced_brain,sync_state)
VALUES ('local-only','$USER_ID','Local only',false,'local_only');
SQL

TOKEN="$(cd "$ROOT" && BRAIN_SYNC_E2E_JWT_SECRET="$JWT_SECRET" node --input-type=module -e '
import { SignJWT } from "jose";
const key = new TextEncoder().encode(process.env.BRAIN_SYNC_E2E_JWT_SECRET);
console.log(await new SignJWT({email:"e2e@local.test"}).setProtectedHeader({alg:"HS256"}).setSubject("00000000-0000-0000-0000-000000000001").setIssuer("brain-sync-e2e").setAudience("oraya-desktop").setIssuedAt().setExpirationTime("10m").sign(key));
')"

(
  cd "$ROOT"
  BRAIN_SYNC_E2E_DATABASE_URL="$DB_URL" BRAIN_SYNC_E2E_JWT_SECRET="$JWT_SECRET" \
  BRAIN_SYNC_E2E_DARK_ANCHOR_MODE=accept npm run dev -- -p "$PORT"
) >"$LOG" 2>&1 &
NEXT_PID="$!"
for _ in $(seq 1 60); do
  # 401 proves Next loaded the actual route; auth is expected before the token.
  if [[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/desktop/brain-sync/events?agent_id=ora&cursor=0")" == "401" ]]; then break; fi
  sleep 1
done
curl -fsS -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:$PORT/api/desktop/brain-sync/events?agent_id=ora&cursor=0" >/dev/null

cd "$ORAKHOS/src-tauri"
BRAIN_SYNC_E2E_URL="http://127.0.0.1:$PORT" BRAIN_SYNC_E2E_TOKEN="$TOKEN" \
  cargo test brain_sync_e2e_composed -- --nocapture

psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT CASE WHEN count(*) > 0 AND bool_and(network_invoked = false) THEN 'DARK_ANCHOR_NO_NETWORK_PASS' ELSE 'DARK_ANCHOR_NO_NETWORK_FAIL' END FROM brain_sync_e2e_anchor_audit"

# Web RAG parity: a synced agent's KB chunk is retrievable through the SAME
# match_kb_chunks hybrid retrieval (via p_agent_id), with no divergent path.
psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT CASE WHEN EXISTS(
       SELECT 1 FROM match_kb_chunks(
         '$USER_ID'::uuid, NULL,
         (SELECT embedding::text FROM kb_chunks WHERE sync_chunk_id='kbchunk-local' LIMIT 1),
         'sovereign portable embeddings', 5, 'ora')
       WHERE chunk_id = (SELECT id FROM kb_chunks WHERE sync_chunk_id='kbchunk-local' LIMIT 1)
     ) THEN 'WEB_RAG_SYNCED_KB_RETRIEVE_PASS' ELSE 'WEB_RAG_SYNCED_KB_RETRIEVE_FAIL' END"

# Web RAG tombstone honesty: the tombstoned cloud chunk is excluded from retrieval.
psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT CASE WHEN NOT EXISTS(
       SELECT 1 FROM match_kb_chunks(
         '$USER_ID'::uuid, NULL,
         (SELECT embedding::text FROM kb_chunks WHERE sync_chunk_id='kbchunk-local' LIMIT 1),
         'sovereign embeddings retrieval', 5, 'ora')
       WHERE chunk_id IN (SELECT id FROM kb_chunks WHERE sync_chunk_id='kbchunk-cloud')
     ) THEN 'WEB_RAG_TOMBSTONE_EXCLUDED_PASS' ELSE 'WEB_RAG_TOMBSTONE_EXCLUDED_FAIL' END"

# Database-level embedding model pin (defence in depth): a synced chunk with a
# non-pinned model must violate the CHECK constraint.
psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "DO \$\$ BEGIN
     BEGIN
       INSERT INTO kb_chunks (source_id,user_id,chunk_index,content,embedding,source_title,agent_id,embedding_model,content_hash,tombstone)
       VALUES ((SELECT id FROM kb_sources WHERE sync_doc_id='kbdoc-local' LIMIT 1),
               '$USER_ID'::uuid, 999, 'pin probe',
               (SELECT embedding FROM kb_chunks WHERE sync_chunk_id='kbchunk-local' LIMIT 1),
               'probe','ora','rogue-embedder','pinprobehash',false);
       RAISE EXCEPTION 'MODEL_PIN_NOT_ENFORCED';
     EXCEPTION WHEN check_violation THEN RAISE NOTICE 'DB_MODEL_PIN_ENFORCED_PASS';
     END;
   END \$\$;"

# KG no-dangling-edge guarantee (server side): no edge may reference an entity id
# that does not exist, and no resolved edge may have a null endpoint.
psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT CASE WHEN NOT EXISTS(
       SELECT 1 FROM agent_entity_relationships r
       WHERE (r.source_entity_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM agent_context_entities e WHERE e.id=r.source_entity_id))
          OR (r.target_entity_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM agent_context_entities e WHERE e.id=r.target_entity_id))
          OR (r.resolved AND (r.source_entity_id IS NULL OR r.target_entity_id IS NULL))
     ) THEN 'KG_NO_DANGLING_EDGE_PASS' ELSE 'KG_NO_DANGLING_EDGE_FAIL' END"

# KG out-of-order edge (edge-before-entity) was buffered unresolved on the server
# then resolved once both endpoints arrived: the nova→neeva edge is resolved live.
psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT CASE WHEN EXISTS(
       SELECT 1 FROM agent_entity_relationships r
       WHERE r.agent_id='ora' AND r.relationship_type='member_of' AND r.resolved AND NOT r.tombstone
         AND r.source_entity_id IS NOT NULL AND r.target_entity_id IS NOT NULL
     ) THEN 'KG_OUT_OF_ORDER_RESOLVED_PASS' ELSE 'KG_OUT_OF_ORDER_RESOLVED_FAIL' END"

# KG tombstone honesty (server side): the tombstoned zara entity and works_on edge
# are no longer live in the canonical PG mirror.
psql "$DB_URL" -v ON_ERROR_STOP=1 -At -c \
  "SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM agent_context_entities WHERE agent_id='ora' AND canonical_name='zara' AND NOT tombstone)
                AND NOT EXISTS(SELECT 1 FROM agent_entity_relationships WHERE agent_id='ora' AND relationship_type='works_on' AND NOT tombstone)
     THEN 'KG_TOMBSTONE_EXCLUDED_PASS' ELSE 'KG_TOMBSTONE_EXCLUDED_FAIL' END"
