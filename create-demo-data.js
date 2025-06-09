const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// 疑似メモデータ
const demoMemos = [
  {
    id: `memo_${Date.now()}_1`,
    content: "今日は素晴らしい一日でした！ #日記 #ポジティブ\n朝から晩まで充実していて、新しいことも学べました。",
    category: "プライベート",
    tags: ["日記", "ポジティブ"],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: `memo_${Date.now()}_2`,
    content: "React アプリの開発でやること\n- API 連携の実装 ✅\n- データベース設計 ✅\n- テスト作成 #開発 #TODO",
    category: "仕事",
    tags: ["開発", "TODO"],
    isFavorite: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1時間前
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: `memo_${Date.now()}_3`,
    content: "買い物リスト #買い物\n- 牛乳 🥛\n- パン 🍞\n- 卵 🥚\n- りんご 🍎\n- コーヒー ☕",
    category: "買い物",
    tags: ["買い物"],
    isFavorite: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2時間前
    updatedAt: new Date(Date.now() - 1800000).toISOString() // 30分前
  },
  {
    id: `memo_${Date.now()}_4`,
    content: "新しいアプリのアイデア 💡\n\n音楽と感情を記録するアプリ\n- 今聞いている曲\n- その時の気分\n- 日記機能 #アイデア #音楽 #日記",
    category: "アイデア",
    tags: ["アイデア", "音楽", "日記"],
    isFavorite: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1日前
    updatedAt: new Date(Date.now() - 3600000).toISOString() // 1時間前
  },
  {
    id: `memo_${Date.now()}_5`,
    content: "読書メモ：「人を動かす」- デール・カーネギー\n\n人間関係の原則\n1. 批判、非難、愚痴を言わない\n2. 率直で誠実な評価を与える\n3. 強い欲求を起こさせる #読書 #自己啓発",
    category: "その他",
    tags: ["読書", "自己啓発"],
    isFavorite: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2日前
    updatedAt: new Date(Date.now() - 86400000).toISOString() // 1日前
  },
  {
    id: `memo_${Date.now()}_6`,
    content: "週末の予定 #予定\n土曜日：\n- 朝ジョギング 🏃‍♂️\n- 映画鑑賞 🎬\n- 友達とカフェ ☕\n\n日曜日：\n- 掃除 🧹\n- 料理 🍳\n- 読書 📚",
    category: "プライベート",
    tags: ["予定"],
    isFavorite: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3日前
    updatedAt: new Date(Date.now() - 172800000).toISOString() // 2日前
  }
];

async function createDemoData() {
  console.log('🚀 疑似メモデータを作成しています...');
  
  try {
    // ヘルスチェック
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ APIサーバーに接続しました');
    
    // 各メモを作成
    for (let i = 0; i < demoMemos.length; i++) {
      const memo = demoMemos[i];
      try {
        const response = await axios.post(`${API_BASE_URL}/memos`, memo);
        console.log(`✅ メモ ${i + 1}/${demoMemos.length} を作成: "${memo.content.substring(0, 30)}..."`);
      } catch (error) {
        console.error(`❌ メモ ${i + 1} の作成に失敗:`, error.response?.data || error.message);
      }
      
      // 少し待つ（IDの重複を避けるため）
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 作成されたメモを確認
    const allMemos = await axios.get(`${API_BASE_URL}/memos`);
    console.log(`\n🎉 疑似データの作成が完了しました！`);
    console.log(`📊 合計 ${allMemos.data.length} 件のメモが作成されています`);
    
    // カテゴリ別の統計
    const categories = {};
    allMemos.data.forEach(memo => {
      categories[memo.category] = (categories[memo.category] || 0) + 1;
    });
    
    console.log('\n📋 カテゴリ別統計:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`);
    });
    
    const favoriteCount = allMemos.data.filter(memo => memo.isFavorite).length;
    console.log(`⭐ お気に入り: ${favoriteCount}件`);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ APIサーバーに接続できません。先に npm run server でサーバーを起動してください。');
    } else {
      console.error('❌ エラーが発生しました:', error.message);
    }
  }
}

// 実行
createDemoData();