-- Enable the pgvector extension
create extension if not exists vector;

-- Table for master documents
create table if not exists documents (
    id uuid primary key default gen_random_uuid(),
    source text not null unique,
    category text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Table for search chunks with 768-dim embeddings (matches text-embedding-004)
create table if not exists document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references documents(id) on delete cascade,
    content text not null,
    metadata jsonb default '{}'::jsonb,
    embedding vector(768)
);

-- HNSW cosine index for sub-millisecond similarity retrieval
create index if not exists document_chunks_hnsw 
on document_chunks using hnsw (embedding vector_cosine_ops);

-- RPC procedure combining metadata filtering and vector similarity
create or replace function match_chunks (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_category text default null
)
returns table (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        dc.id,
        dc.content,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) as similarity
    from document_chunks dc
    where 
        (filter_category is null or dc.metadata->>'category' = filter_category)
        and 1 - (dc.embedding <=> query_embedding) > match_threshold
    order by dc.embedding <=> query_embedding
    limit match_count;
end;
$$;