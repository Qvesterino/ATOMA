import os
import sys
import json
import faiss
import numpy as np
import requests

EMBED_MODEL = "nomic-embed-text"
OLLAMA_URL = "http://localhost:11434/api/embeddings"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 200

INDEX_FILE = "atoma_index.faiss"
META_FILE = "atoma_meta.json"


def embed(text):
    r = requests.post(OLLAMA_URL, json={
        "model": EMBED_MODEL,
        "prompt": text
    })
    return np.array(r.json()["embedding"], dtype="float32")


def chunk_text(text):
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def collect_files(folder):
    allowed = (".js", ".ts", ".md")
    file_list = []
    for root, _, files in os.walk(folder):
        for f in files:
            if f.endswith(allowed):
                file_list.append(os.path.join(root, f))
    return file_list


def build_index(folder):
    files = collect_files(folder)

    print(f"Found {len(files)} files")

    all_chunks = []
    metadata = []

    for path in files:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

        chunks = chunk_text(text)

        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            metadata.append({
                "file": path,
                "chunk_id": i,
                "text": chunk[:500]
            })

    print(f"Total chunks: {len(all_chunks)}")

    vectors = []
    for i, chunk in enumerate(all_chunks):
        print(f"Embedding {i+1}/{len(all_chunks)}")
        vec = embed(chunk)
        vectors.append(vec)

    dim = len(vectors[0])
    index = faiss.IndexFlatL2(dim)
    index.add(np.stack(vectors))

    faiss.write_index(index, INDEX_FILE)

    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("Index built successfully.")


def search(query, top_k=5):
    if not os.path.exists(INDEX_FILE):
        print("Index not found. Run build first.")
        return

    index = faiss.read_index(INDEX_FILE)

    with open(META_FILE, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    q_vec = embed(query)
    D, I = index.search(np.array([q_vec]), top_k)

    print("\nTop Results:\n")
    for idx in I[0]:
        m = metadata[idx]
        print("="*60)
        print(f"File: {m['file']}")
        print(f"Chunk: {m['chunk_id']}")
        print("-"*60)
        print(m["text"])
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python ai_node_memory.py build <folder>")
        print("  python ai_node_memory.py search \"your query\"")
        sys.exit(1)

    command = sys.argv[1]

    if command == "build":
        folder = sys.argv[2]
        build_index(folder)

    elif command == "search":
        query = sys.argv[2]
        search(query)

    else:
        print("Unknown command")