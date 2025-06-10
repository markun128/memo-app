class AutoTagger {
  constructor() {
    // キーワード辞書
    this.tagDictionary = {
      // 仕事関連
      '仕事': ['仕事', '会議', 'ミーティング', 'プロジェクト', '締切', 'デッドライン', 'タスク', '業務', '会社', '職場', 'オフィス', '上司', '同僚', '部下', '出張', '残業', '休暇', '有給'],
      'プログラミング': ['プログラミング', 'コード', 'コーディング', '開発', 'デバッグ', 'バグ', 'エラー', 'API', 'データベース', 'フロントエンド', 'バックエンド', 'JavaScript', 'Python', 'React', 'Node.js', 'Git', 'GitHub'],
      'デザイン': ['デザイン', 'UI', 'UX', 'フォトショップ', 'イラストレーター', 'カラー', '色', 'レイアウト', 'ロゴ', 'アイコン', 'フォント', 'タイポグラフィ'],
      '営業': ['営業', '顧客', 'クライアント', '提案', 'プレゼン', '契約', '売上', '目標', '成果', '商談', 'アポ'],
      
      // プライベート関連
      'プライベート': ['プライベート', '家族', '友達', '恋人', '趣味', '休日', '旅行', '映画', '音楽', 'ゲーム', '読書', 'スポーツ'],
      '家族': ['家族', '両親', '父', '母', '兄弟', '姉妹', '子供', '息子', '娘', '祖父', '祖母', '親戚'],
      '友達': ['友達', '友人', '仲間', '同級生', '先輩', '後輩', '飲み会', 'パーティー', '集まり'],
      '旅行': ['旅行', '出かける', '観光', 'ホテル', '温泉', '海', '山', '電車', '飛行機', '車', 'ドライブ', '散歩'],
      '食事': ['食事', '料理', '食べ物', 'ランチ', '昼食', '夕食', '朝食', 'レストラン', 'カフェ', '居酒屋'],
      
      // 健康・ライフスタイル
      '健康': ['健康', '運動', 'ジム', 'ランニング', 'ウォーキング', 'ヨガ', 'ストレッチ', '筋トレ', 'ダイエット', '体重', '病院', '医者'],
      '勉強': ['勉強', '学習', '資格', '試験', '英語', '本', '読書', 'セミナー', '講座', 'スキル', '知識'],
      
      // ショッピング・買い物
      '買い物': ['買い物', '購入', 'ショッピング', '商品', '店', 'ネット通販', 'Amazon', '楽天', 'セール', '安い', '高い', '値段', '価格'],
      '食材': ['食材', '野菜', '肉', '魚', '米', 'パン', '牛乳', '卵', 'スーパー', 'コンビニ'],
      '服': ['服', 'ファッション', '洋服', 'シャツ', 'パンツ', '靴', 'バッグ', 'アクセサリー'],
      
      // 感情・気分
      '嬉しい': ['嬉しい', '楽しい', '幸せ', '良かった', '最高', '素晴らしい', 'ハッピー', '感動', '喜び'],
      '悲しい': ['悲しい', 'つらい', '辛い', '涙', '落ち込む', 'ショック', '残念', '失望'],
      '疲れた': ['疲れた', '疲労', 'だるい', '眠い', 'しんどい', 'きつい', '大変'],
      '楽しい': ['楽しい', '面白い', 'ワクワク', 'ドキドキ', '興奮', '最高', '爆笑'],
      
      // 天気・季節
      '天気': ['天気', '晴れ', '雨', '曇り', '雪', '風', '暑い', '寒い', '涼しい', '暖かい'],
      '春': ['春', '桜', '花見', '新学期', '入学', '就職', '暖かい'],
      '夏': ['夏', '海', 'プール', '祭り', '花火', '暑い', 'エアコン', 'かき氷'],
      '秋': ['秋', '紅葉', '涼しい', '読書', 'スポーツ', '食欲'],
      '冬': ['冬', '雪', '寒い', 'クリスマス', '正月', '年末', 'こたつ', '鍋'],
      
      // 時間・期間
      '朝': ['朝', 'おはよう', '起床', '朝食', '出勤', '登校'],
      '夜': ['夜', 'おやすみ', '就寝', '夕食', '帰宅', '残業'],
      '週末': ['週末', '土曜', '日曜', '休日', 'お疲れさま']
    };

    // 感情キーワード
    this.emotionKeywords = {
      'ポジティブ': ['嬉しい', '楽しい', '幸せ', '良かった', '最高', '素晴らしい', 'ありがとう', '感謝', '成功', '達成'],
      'ネガティブ': ['悲しい', 'つらい', '疲れた', '大変', '困った', '失敗', '問題', 'ストレス', '心配'],
      '驚き': ['びっくり', '驚いた', 'まさか', 'すごい', '信じられない', 'やばい']
    };

    // カテゴリ推定キーワード
    this.categoryKeywords = {
      '仕事': ['仕事', '会議', 'プロジェクト', '締切', '業務', '会社', '職場', '上司', '同僚', '営業', 'プログラミング'],
      'プライベート': ['家族', '友達', '恋人', '趣味', '休日', '映画', '音楽', 'ゲーム', '旅行'],
      'アイデア': ['アイデア', '思いついた', '企画', '提案', '発明', '新しい', 'ひらめき', '考え'],
      '買い物': ['買い物', '購入', 'ショッピング', '商品', '店', 'セール', '食材', '服'],
      'その他': [] // デフォルト
    };
  }

  // メイン関数：テキストから自動でタグとカテゴリを生成
  autoTag(content) {
    const tags = new Set();
    const text = content.toLowerCase();

    // 既存の #タグ を抽出
    const existingTags = this.extractExistingTags(content);
    existingTags.forEach(tag => tags.add(tag));

    // キーワード辞書ベースのタグ付け
    this.addKeywordTags(text, tags);

    // 感情分析
    this.addEmotionTags(text, tags);

    // 時間に基づくタグ
    this.addTimeBasedTags(tags);

    // カテゴリ推定
    const suggestedCategory = this.suggestCategory(text);

    return {
      tags: Array.from(tags),
      suggestedCategory
    };
  }

  // 既存の #タグ を抽出
  extractExistingTags(content) {
    const tagRegex = /#([\\w\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FAF]+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  }

  // キーワード辞書ベースのタグ付け
  addKeywordTags(text, tags) {
    for (const [tag, keywords] of Object.entries(this.tagDictionary)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          tags.add(tag);
          break; // 一つでも見つかればそのタグを追加
        }
      }
    }
  }

  // 感情分析に基づくタグ付け
  addEmotionTags(text, tags) {
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          tags.add(emotion);
          break;
        }
      }
    }
  }

  // 時間に基づくタグ付け
  addTimeBasedTags(tags) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0=日曜, 6=土曜

    // 時間帯タグ
    if (hour >= 5 && hour < 12) {
      tags.add('朝');
    } else if (hour >= 12 && hour < 17) {
      tags.add('昼');
    } else if (hour >= 17 && hour < 22) {
      tags.add('夕方');
    } else {
      tags.add('夜');
    }

    // 曜日タグ
    if (day === 0 || day === 6) {
      tags.add('週末');
    } else {
      tags.add('平日');
    }
  }

  // カテゴリ推定
  suggestCategory(text) {
    let maxScore = 0;
    let suggestedCategory = 'その他';

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.length === 0) continue; // 'その他' をスキップ

      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score++;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        suggestedCategory = category;
      }
    }

    return suggestedCategory;
  }

  // 新しいキーワードを学習する機能（将来的な拡張用）
  learnFromUserInput(content, userTags, userCategory) {
    // ユーザーが手動で追加したタグから学習
    // 実装は簡略化
    console.log('Learning from user input:', { content, userTags, userCategory });
  }
}

// シングルトンインスタンス
const autoTagger = new AutoTagger();

module.exports = autoTagger;