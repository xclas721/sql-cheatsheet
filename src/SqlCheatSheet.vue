<template>
  <div class="sql-cheatsheet">
    <h1>SQL 語法速查表</h1>
    <div class="content">
      <div class="category-list">
        <button 
          v-for="(category, index) in categories" 
          :key="index"
          class="category-btn"
          :class="{ active: selectedCategory === index }"
          @click="selectedCategory = index"
        >
          {{ category.title }}
        </button>
      </div>

      <div v-if="selectedCategory !== null" class="examples-container">
        <div class="examples-list">
          <button 
            v-for="(example, index) in categories[selectedCategory].examples" 
            :key="index"
            class="example-btn"
            :class="{ active: selectedExample === index }"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>

        <div v-if="selectedExample !== null" class="example-detail">
          <div class="example-header">
            <h3>{{ categories[selectedCategory].examples[selectedExample].label }}</h3>
            <button class="copy-btn" @click="copyToClipboard(categories[selectedCategory].examples[selectedExample].code)">
              複製代碼
            </button>
          </div>

          <div class="code-block">
            <pre><code>{{ categories[selectedCategory].examples[selectedExample].code }}</code></pre>
          </div>

          <div class="example-note">
            <span>{{ categories[selectedCategory].examples[selectedExample].note }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SqlCheatSheet',
  data() {
    return {
      selectedCategory: null,
      selectedExample: null,
      categories: [
        {
          title: '基本查詢',
          examples: [
            { 
              label: '查詢單一表格資料',
              code: 'SELECT 欄位1, 欄位2 FROM 資料表;',
              note: '查詢 欄位1, 欄位2 直欄的資料'
            },
            {
              label: '查詢所有欄位',
              code: 'SELECT * FROM 資料表;',
              note: '查詢所有直欄、所有橫列的資料'
            }
          ]
        },
        {
          title: '條件查詢',
          examples: [
            {
              label: '基本條件查詢',
              code: 'SELECT 欄位1, 欄位2 FROM 資料表 WHERE 條件;',
              note: '查詢符合條件之橫列的資料'
            },
            {
              label: '模糊比對',
              code: "SELECT 欄位1, 欄位2 FROM 資料表 WHERE 欄位1 [NOT] LIKE '模式';",
              note: '使用模糊比對查詢資料'
            }
          ]
        }
      ]
    }
  },
  methods: {
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        alert('已複製到剪貼簿！')
      } catch (err) {
        console.error('複製失敗:', err)
      }
    }
  }
}
</script>

<style>
.sql-cheatsheet {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft JhengHei', Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.content {
  margin-top: 20px;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.category-btn {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.category-btn:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
}

.category-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.examples-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.example-btn {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.example-btn:hover {
  background: #f5f5f5;
}

.example-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.example-detail {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.example-header h3 {
  margin: 0;
  color: #333;
}

.copy-btn {
  padding: 8px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  background: #0056b3;
}

.code-block {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
}

.code-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-block code {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #333;
}

.example-note {
  background: #e9ecef;
  border-radius: 6px;
  padding: 15px;
  color: #666;
}

@media (max-width: 768px) {
  .examples-container {
    grid-template-columns: 1fr;
  }
  
  .category-list {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 

