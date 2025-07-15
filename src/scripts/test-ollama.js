import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

const embedder = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
});

async function test() {
    const result = await embedder.embedQuery("test track info");
    console.log(result);
}

test();
