# BE-03: Full-Text Search Implementation

**Status**: `pending`  
**Estimate**: 3 hours  
**Priority**: High  
**Dependencies**: BE-02

## Description

Implement PostgreSQL full-text search functionality for documents using `tsvector` and `tsquery`. No vector embeddings, just text-based search.

## Tasks

- [ ] Create search function in database
- [ ] Implement text indexing on document upload
- [ ] Create Edge Function for search API
- [ ] Test search accuracy and performance
- [ ] Add search ranking
- [ ] Document search API

## Tech Spec

### Database Search Function

```sql
-- Function to update search vector on insert/update
CREATE OR REPLACE FUNCTION documents_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.filename, '') || ' ' ||
    COALESCE(NEW.content_text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
CREATE TRIGGER documents_search_update
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_search_vector_update();

-- Search function with ranking
CREATE OR REPLACE FUNCTION search_documents(
  user_id_param UUID,
  query_text TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  filename VARCHAR,
  content_text TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.filename,
    d.content_text,
    ts_rank(d.search_vector, query) AS rank
  FROM documents d, to_tsquery('english', query_text) query
  WHERE d.user_id = user_id_param
    AND d.search_vector @@ query
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

### Edge Function API

```typescript
// supabase/functions/text-search/index.ts
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const { query, limit = 20 } = await req.json();
  const supabase = createClient(url, key);

  const { data, error } = await supabase.rpc("search_documents", {
    user_id_param: userId,
    query_text: query,
    result_limit: limit,
  });

  return new Response(JSON.stringify({ results: data }));
});
```

## Acceptance Criteria

- [ ] Search returns relevant results
- [ ] Search performance <300ms for 1000+ docs
- [ ] Ranking works correctly
- [ ] Edge Function deployed and working
- [ ] Search handles special characters
- [ ] Empty queries handled gracefully

## Notes

- Use English text search configuration
- Consider adding Spanish support later for Colombia
- Test with realistic document corpus

