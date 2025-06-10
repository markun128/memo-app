const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const cosineSimilarity = require('cosine-similarity');

class VectorSearchService {
  constructor() {
    this.model = null;
    this.memoEmbeddings = new Map(); // id -> embedding
    this.initModel();
  }

  async initModel() {
    try {
      console.log('Loading Universal Sentence Encoder model...');
      this.model = await use.load();
      console.log('Model loaded successfully!');
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  async ensureModelLoaded() {
    if (!this.model) {
      await this.initModel();
    }
    return this.model !== null;
  }

  async getEmbedding(text) {
    if (!await this.ensureModelLoaded()) {
      throw new Error('Model not loaded');
    }

    try {
      const embeddings = await this.model.embed([text]);
      const embedding = await embeddings.data();
      embeddings.dispose(); // メモリリークを防ぐ
      return Array.from(embedding);
    } catch (error) {
      console.error('Error getting embedding:', error);
      throw error;
    }
  }

  async indexMemo(id, content) {
    try {
      const embedding = await this.getEmbedding(content);
      this.memoEmbeddings.set(id, embedding);
      console.log(`Indexed memo ${id}`);
    } catch (error) {
      console.error(`Error indexing memo ${id}:`, error);
    }
  }

  async searchSimilar(query, limit = 10) {
    if (!await this.ensureModelLoaded()) {
      throw new Error('Model not loaded');
    }

    try {
      const queryEmbedding = await this.getEmbedding(query);
      const results = [];

      for (const [id, embedding] of this.memoEmbeddings) {
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        results.push({ id, similarity });
      }

      // 類似度でソート（降順）
      results.sort((a, b) => b.similarity - a.similarity);
      
      return results.slice(0, limit);
    } catch (error) {
      console.error('Error in vector search:', error);
      throw error;
    }
  }

  removeMemo(id) {
    this.memoEmbeddings.delete(id);
    console.log(`Removed memo ${id} from index`);
  }

  clearIndex() {
    this.memoEmbeddings.clear();
    console.log('Cleared vector index');
  }

  getIndexSize() {
    return this.memoEmbeddings.size;
  }
}

// シングルトンインスタンス
const vectorSearchService = new VectorSearchService();

module.exports = vectorSearchService;