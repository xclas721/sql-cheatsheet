<template>
  <div class="container">
    <header>
      <h1>SQL 語法速查表</h1>
    </header>

    <div class="main-content">
      <nav class="sidebar">
        <div class="category-list">
          <button 
            v-for="(card, index) in cards" 
            :key="index"
            class="category-btn"
            :class="{ active: expandedCard === index }"
            @click="expandedCard = index"
          >
            <span>{{ card.title }}</span>
            <span class="example-count">{{ card.examples.length }}</span>
          </button>
        </div>
      </nav>

      <div class="content-wrapper">
        <div class="content-area">
          <div v-if="expandedCard !== null" class="examples-container">
            <div class="examples-list">
              <button 
                v-for="(example, index) in cards[expandedCard].examples" 
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
                <h3>{{ cards[expandedCard].examples[selectedExample].label }}</h3>
                <button class="copy-btn" @click="copyToClipboard(cards[expandedCard].examples[selectedExample].code)">
                  <span class="copy-icon">📋</span>
                  複製代碼
                </button>
              </div>

              <div class="code-block">
                <pre><code class="language-sql" v-html="highlightedCode"></code></pre>
              </div>

              <div class="example-note">
                <span class="note-icon">💡</span>
                <span>{{ cards[expandedCard].examples[selectedExample].note }}</span>
              </div>
            </div>

            <div v-else class="welcome-message">
              <h2>{{ cards[expandedCard].title }}</h2>
              <p>{{ cards[expandedCard].desc }}</p>
              <p class="select-hint">請選擇一個示例查看詳細內容</p>
            </div>
          </div>

          <div v-else class="welcome-message">
            <h2>歡迎使用 SQL 語法速查表</h2>
            <p class="select-hint">請從左側選擇一個類別開始</p>
          </div>
        </div>

        <!-- 獨立的信息卡片 -->
        <div class="info-card">
          <div class="info-header">
            <h3>📝 實際範例</h3>
          </div>
          <div class="info-content">
            <div v-if="selectedExample !== null" class="example-section">
              <h4>{{ cards[expandedCard].examples[selectedExample].label }}</h4>
              <div v-if="currentExamples.length > 0">
                <div v-for="(example, index) in currentExamples" :key="index" class="example-block">
                  <div class="example-title">{{ example.title }}</div>
                  <pre><code class="language-sql" v-html="hljs.highlight(example.code, { language: 'sql' }).value"></code></pre>
                </div>
              </div>
              <div v-else class="example-placeholder">
                <p>此示例暫無實際範例</p>
              </div>
            </div>
            <div v-else class="example-placeholder">
              <p>請選擇一個查詢示例來查看實際範例</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, shallowRef } from 'vue'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import 'highlight.js/styles/github-dark.css'

// 註冊 SQL 語言
hljs.registerLanguage('sql', sql)

// 使用 shallowRef 來優化大型物件的響應性
const expandedCard = shallowRef(null)
const selectedExample = shallowRef(null)

// 快取已處理過的程式碼
const codeCache = new Map()

// 優化防抖函數
function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 計算當前顯示的 SQL 代碼
const currentCode = computed(() => {
  if (expandedCard.value === null || selectedExample.value === null) return ''
  return cards[expandedCard.value].examples[selectedExample.value].code
})

// 優化高亮處理
const highlightedCode = computed(() => {
  if (!currentCode.value) return ''
  
  // 檢查快取
  if (codeCache.has(currentCode.value)) {
    return codeCache.get(currentCode.value)
  }
  
  // 處理並快取結果
  const result = hljs.highlight(currentCode.value, { language: 'sql' }).value
  codeCache.set(currentCode.value, result)
  return result
})

// 使用防抖處理高亮
const debouncedHighlight = debounce(() => {
  nextTick(() => {
    const blocks = document.querySelectorAll('pre code:not(.hljs)')
    if (blocks.length === 0) return
    
    blocks.forEach((block) => {
      const code = block.textContent
      if (codeCache.has(code)) {
        block.innerHTML = codeCache.get(code)
        block.classList.add('hljs')
      } else {
        hljs.highlightElement(block)
        codeCache.set(code, block.innerHTML)
      }
    })
  })
}, 50) // 減少延遲時間

// 監聽選擇變化，使用防抖重新應用高亮
watch([expandedCard, selectedExample], () => {
  debouncedHighlight()
}, { flush: 'post' })

// 優化複製功能
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    alert('已複製到剪貼簿！')
  } catch (err) {
    console.error('複製失敗:', err)
  }
}

const cards = [
  {
    title: '基本查詢',
    desc: '查詢所有欄位與資料列',
    examples: [
      { label: '查詢單一表格資料', code: 'SELECT 欄位1, 欄位2 FROM 資料表;', note: '查詢 欄位1, 欄位2 直欄的資料' },
      { label: '查詢所有欄位', code: 'SELECT * FROM 資料表;', note: '查詢所有直欄、所有橫列的資料' },
      { label: '使用別名', code: 'SELECT 欄位1 [AS] 別名1, 欄位2 [AS] 別名2 FROM 資料表;', note: '將查詢結果直欄標題依別名顯示' },
      { label: '查詢不重複資料', code: 'SELECT DISTINCT 欄位1 FROM 資料表 WHERE 條件;', note: '查詢符合條件之不重複橫列的資料' },
    ]
  },
  {
    title: '條件查詢',
    desc: '使用 WHERE 篩選資料',
    examples: [
      { label: '基本條件查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表 WHERE 條件;', note: '查詢符合條件之橫列的資料' },
      { label: '模糊比對', code: "SELECT 欄位1, 欄位2 FROM 資料表 WHERE 欄位1 [NOT] LIKE '模式';", note: '使用模糊比對查詢資料' },
      { label: '陣列比對', code: "SELECT 欄位1, 欄位2 FROM 資料表 WHERE 欄位1 [NOT] IN (值列表);", note: '查詢欄位值是否在指定陣列中' },
      { label: '範圍查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表 WHERE 欄位1 BETWEEN 最小值 AND 最大值;', note: '查詢欄位值是否在兩個值之間' },
      { label: '空值查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表 WHERE 欄位1 IS [NOT] NULL;', note: '查詢欄位值是否為空值' },
    ]
  },
  {
    title: '排序與分頁',
    desc: 'ORDER BY、TOP、OFFSET',
    examples: [
      { label: '排序查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表 ORDER BY 欄位1 [ASC|DESC];', note: '查詢結果依直欄值升冪或降冪排列' },
      { label: '限制筆數', code: 'SELECT TOP 筆數 (PERCENT) 欄位1, 欄位2 FROM 資料表 ORDER BY 欄位1;', note: '將查詢結果回傳前 n (百分比) 列' },
      { label: '分頁查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表 ORDER BY 欄位1 OFFSET 跳過筆數 ROWS FETCH NEXT 取得筆數 ROWS;', note: '將查詢結果跳過 n1 列後回傳 n2 列' },
    ]
  },
  {
    title: '分組與聚合',
    desc: 'GROUP BY 與彙總函數',
    examples: [
      { label: '基本聚合', code: 'SELECT 聚合函數(欄位1) FROM 資料表;', note: '以全表格為一組使用彙總函數計算' },
      { label: '分組聚合', code: 'SELECT 欄位1, 聚合函數(欄位2) FROM 資料表 GROUP BY 欄位1;', note: '群組資料列並使用彙總函數' },
      { label: '分組篩選', code: 'SELECT 欄位1, 聚合函數(欄位2) FROM 資料表 GROUP BY 欄位1 HAVING 條件;', note: '群組資料計算後篩選群組' },
      { label: '常用彙總函數', code: `COUNT(運算式) - 回傳表列元素之筆數
SUM(運算式) - 回傳表列元素之加總值
AVG(運算式) - 回傳表列元素之平均值
MAX(運算式) - 回傳表列元素之最大值
MIN(運算式) - 回傳表列元素之最小值`, note: 'SQL 彙總函數列表' },
    ]
  },
  {
    title: '集合運算',
    desc: 'UNION、INTERSECT、MINUS',
    examples: [
      { label: '聯集查詢', code: `SELECT 欄位1, 欄位2 FROM 資料表1
UNION [ALL]
SELECT 欄位1, 欄位2 FROM 資料表2;`, note: '將兩個查詢之結果列合併(聯集)' },
      { label: '交集差集', code: `SELECT 欄位1, 欄位2 FROM 資料表1
INTERSECT (MINUS)
SELECT 欄位1, 欄位2 FROM 資料表2;`, note: '求將兩個查詢之結果列的交集(差集)' },
    ]
  },
  {
    title: '多表聯結',
    desc: '各種 JOIN 語法',
    examples: [
      { label: '內部連結', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 INNER JOIN 資料表2 ON 條件;', note: '執行內部連結 資料表1, 資料表2' },
      { label: '使用別名連結', code: 'SELECT 別名1.欄位1, 別名2.欄位2 FROM 資料表1 [AS] 別名1 INNER JOIN 資料表2 [AS] 別名2 ON 條件;', note: '使用表格別名執行內部連結' },
      { label: '外部連結', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 LEFT(RIGHT) JOIN 資料表2 ON 條件;', note: '執行左(右)外部連結 資料表1, 資料表2' },
      { label: '全外部連結', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 FULL OUTER JOIN 資料表2 ON 條件;', note: '執行全外部連結 資料表1, 資料表2' },
      { label: '交叉連結', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 CROSS JOIN 資料表2;', note: '執行交叉連結 資料表1, 資料表2' },
      { label: '自我連結', code: 'SELECT 別名1.欄位1, 別名2.欄位2 FROM 資料表1 別名1 INNER JOIN 資料表1 別名2 ON 條件;', note: '執行自我連結 資料表1' },
    ]
  },
  {
    title: '子查詢',
    desc: '各種子查詢用法',
    examples: [
      { label: '單值子查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 WHERE 欄位1 = (SELECT ---);', note: '子查詢回傳單一欄位單一值' },
      { label: '多值子查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 WHERE 欄位1 IN (SELECT ---);', note: '子查詢回傳單一欄位多個值' },
      { label: '比較子查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 WHERE 欄位1 > ANY(ALL) (SELECT ---);', note: '子查詢回傳單一欄位多個值' },
      { label: '存在子查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 WHERE EXISTS (SELECT ---);', note: '子查詢回傳多個欄位' },
      { label: '分組子查詢', code: `SELECT 欄位1, 聚合函數(欄位2)
FROM 資料表
GROUP BY 欄位1
HAVING 欄位1 = (SELECT ---);`, note: '以子查詢之回傳值篩選群組' },
      { label: '連結子查詢', code: 'SELECT 欄位1, 欄位2 FROM 資料表1 JOIN (SELECT ---) 資料表2 ON 條件;', note: '以子查詢進行連結' },
    ]
  },
  {
    title: '資料操作',
    desc: 'INSERT、UPDATE、DELETE',
    examples: [
      { label: '新增單筆', code: 'INSERT INTO 資料表(欄位列表) VALUES(值列表);', note: '新增單筆資料' },
      { label: '新增多筆', code: `INSERT INTO 資料表(欄位列表)
VALUES (值列表),
(值列表), ….`, note: '新增多筆資料' },
      { label: '從其他表新增', code: `INSERT INTO 資料表(欄位列表)
SELECT 欄位列表
FROM 資料表2;`, note: '自另一表格新增資料' },
      { label: '更新資料', code: `UPDATE 資料表
SET 欄位1 = 新值,
欄位2 = 新值
WHERE 條件;`, note: '修改符合條件資料列之欄位資料' },
      { label: '刪除資料', code: 'DELETE FROM 資料表 WHERE 條件;', note: '刪除符合條件之資料列' },
      { label: '清空表格', code: 'DELETE FROM 資料表;', note: '刪除表格中所有資料列' },
    ]
  },
  {
    title: '表格管理',
    desc: 'CREATE、ALTER、DROP',
    examples: [
      { label: '建立表格', code: `CREATE TABLE 資料表 (
  ID INT PRIMARY KEY,
  名稱 VARCHAR NOT NULL,
  價格 INT DEFAULT 0
);`, note: '新增一個包含三個欄位的表格' },
      { label: '從查詢建立', code: 'SELECT 欄位1,欄位2 INTO 新資料表 FROM 資料表 WHERE 條件;', note: '用一個既有之表格創建新表格' },
      { label: '刪除表格', code: 'DROP TABLE 資料表;', note: '刪除表格' },
      { label: '新增欄位', code: 'ALTER TABLE 資料表 ADD 欄位;', note: '在表格中加入欄位' },
      { label: '移除欄位', code: 'ALTER TABLE 資料表 DROP COLUMN 欄位1;', note: '移除表格中之欄位' },
      { label: '修改欄位', code: 'ALTER TABLE 資料表 ALTER COLUMN 欄位;', note: '修改欄位定義' },
      { label: '重新命名', code: "EXEC sp_rename '資料表1', '資料表2';", note: '將 資料表1 表格重新命名為 資料表2' },
      { label: '清空資料', code: 'TRUNCATE TABLE 資料表;', note: '刪除表格中所有資料' },
    ]
  },
  {
    title: '限制條件',
    desc: 'PRIMARY KEY、FOREIGN KEY、UNIQUE、CHECK',
    examples: [
      { label: '主鍵限制', code: `CREATE TABLE 資料表(
  欄位1 INT, 欄位2 INT,
  PRIMARY KEY (欄位1,欄位2)
);`, note: '主鍵限制' },
      { label: '外鍵限制', code: `CREATE TABLE 資料表1(
  欄位1 INT PRIMARY KEY,
  欄位2 INT,
  FOREIGN KEY (欄位2) REFERENCES 資料表2(欄位2)
);`, note: '外鍵限制' },
      { label: '唯一值限制', code: `CREATE TABLE 資料表(
  欄位1 INT, 欄位2 INT,
  UNIQUE(欄位1,欄位2)
);`, note: '唯一值限制' },
      { label: '檢查限制', code: `CREATE TABLE 資料表(
  欄位1 INT, 欄位2 INT,
  CHECK(欄位1 > 0 AND 欄位1 >= 欄位2)
);`, note: '檢查限制' },
      { label: '非空值限制', code: `CREATE TABLE 資料表(
  欄位1 INT PRIMARY KEY,
  欄位2 VARCHAR NOT NULL
);`, note: '非空值限制' },
      { label: '新增限制', code: 'ALTER TABLE 資料表 ADD 限制條件;', note: '新增限制條件' },
      { label: '刪除限制', code: 'ALTER TABLE 資料表 DROP 限制條件;', note: '刪除限制條件' },
    ]
  },
  {
    title: '檢視與索引',
    desc: 'CREATE VIEW、CREATE INDEX',
    examples: [
      { label: '建立檢視', code: `CREATE VIEW 檢視名稱(欄位1,欄位2) AS
SELECT 欄位1, 欄位2
FROM 資料表;`, note: '以基底表格新增簡單檢視' },
      { label: '檢查選項', code: `CREATE VIEW 檢視名稱(欄位1,欄位2) AS
SELECT 欄位1, 欄位2 FROM 資料表
WITH CHECK OPTION;`, note: '新增檢視並設定檢查選項' },
      { label: '複雜檢視', code: `CREATE VIEW 檢視名稱(欄位1,欄位2) AS
SELECT 資料表1.欄位1, 資料表2.欄位2 FROM 資料表1
JOIN 資料表2 ON 條件;`, note: '以基底表格新增複雜檢視' },
      { label: '刪除檢視', code: 'DROP VIEW 檢視名稱;', note: '刪除檢視' },
      { label: '建立索引', code: 'CREATE INDEX 索引名稱 ON 資料表(欄位1,欄位2);', note: '在表格中以欄位建立索引' },
      { label: '唯一索引', code: 'CREATE UNIQUE INDEX 索引名稱 ON 資料表(欄位1,欄位2);', note: '在表格中以欄位建立唯一索引' },
      { label: '刪除索引', code: 'DROP INDEX 索引名稱 ON 資料表;', note: '刪除索引' },
    ]
  },
]

// 範例數據
const examples = {
  '基本查詢': {
    '查詢單一表格資料': [
      {
        title: '查詢員工基本資料',
        code: `SELECT 員工編號, 姓名, 部門, 職稱
FROM 員工資料表;`
      },
      {
        title: '查詢產品資訊',
        code: `SELECT 產品編號, 產品名稱, 單價, 庫存量
FROM 產品資料表;`
      }
    ],
    '查詢所有欄位': [
      {
        title: '查詢完整員工資料',
        code: `SELECT *
FROM 員工資料表;`
      },
      {
        title: '查詢完整訂單資料',
        code: `SELECT *
FROM 訂單資料表;`
      }
    ],
    '使用別名': [
      {
        title: '使用欄位別名',
        code: `SELECT 
  員工編號 AS 工號,
  姓名 AS 員工姓名,
  部門 AS 所屬部門
FROM 員工資料表;`
      },
      {
        title: '使用表格別名',
        code: `SELECT 
  e.員工編號,
  e.姓名,
  d.部門名稱
FROM 員工資料表 e
JOIN 部門資料表 d ON e.部門編號 = d.部門編號;`
      }
    ],
    '查詢不重複資料': [
      {
        title: '查詢不重複部門',
        code: `SELECT DISTINCT 部門
FROM 員工資料表;`
      },
      {
        title: '查詢不重複職稱',
        code: `SELECT DISTINCT 職稱
FROM 員工資料表
WHERE 部門 = '資訊部';`
      }
    ]
  },
  '條件查詢': {
    '基本條件查詢': [
      {
        title: '查詢特定部門員工',
        code: `SELECT 員工編號, 姓名, 部門
FROM 員工資料表
WHERE 部門 = '資訊部';`
      },
      {
        title: '查詢高於平均薪資的員工',
        code: `SELECT 員工編號, 姓名, 薪資
FROM 員工資料表
WHERE 薪資 > (SELECT AVG(薪資) FROM 員工資料表);`
      }
    ],
    '模糊比對': [
      {
        title: '查詢特定字首的產品',
        code: `SELECT 產品編號, 產品名稱
FROM 產品資料表
WHERE 產品名稱 LIKE '筆記%';`
      },
      {
        title: '查詢包含特定字的產品',
        code: `SELECT 產品編號, 產品名稱
FROM 產品資料表
WHERE 產品名稱 LIKE '%電腦%';`
      }
    ],
    '陣列比對': [
      {
        title: '查詢特定部門的員工',
        code: `SELECT 員工編號, 姓名, 部門
FROM 員工資料表
WHERE 部門 IN ('資訊部', '人事部', '財務部');`
      },
      {
        title: '查詢特定產品的訂單',
        code: `SELECT 訂單編號, 產品編號, 數量
FROM 訂單明細
WHERE 產品編號 IN (SELECT 產品編號 FROM 產品資料表 WHERE 類別 = '電子產品');`
      }
    ],
    '範圍查詢': [
      {
        title: '查詢特定薪資範圍的員工',
        code: `SELECT 員工編號, 姓名, 薪資
FROM 員工資料表
WHERE 薪資 BETWEEN 30000 AND 50000;`
      },
      {
        title: '查詢特定日期範圍的訂單',
        code: `SELECT 訂單編號, 客戶名稱, 訂單日期
FROM 訂單資料表
WHERE 訂單日期 BETWEEN '2024-01-01' AND '2024-03-31';`
      }
    ],
    '空值查詢': [
      {
        title: '查詢未分配部門的員工',
        code: `SELECT 員工編號, 姓名
FROM 員工資料表
WHERE 部門 IS NULL;`
      },
      {
        title: '查詢已分配部門的員工',
        code: `SELECT 員工編號, 姓名, 部門
FROM 員工資料表
WHERE 部門 IS NOT NULL;`
      }
    ]
  },
  '排序與分頁': {
    '排序查詢': [
      {
        title: '依薪資排序員工',
        code: `SELECT 員工編號, 姓名, 薪資
FROM 員工資料表
ORDER BY 薪資 DESC;`
      },
      {
        title: '依多欄位排序訂單',
        code: `SELECT 訂單編號, 客戶名稱, 訂單日期, 訂單金額
FROM 訂單資料表
ORDER BY 訂單日期 DESC, 訂單金額 DESC;`
      }
    ],
    '限制筆數': [
      {
        title: '查詢前10名高薪員工',
        code: `SELECT TOP 10 員工編號, 姓名, 薪資
FROM 員工資料表
ORDER BY 薪資 DESC;`
      },
      {
        title: '查詢前5%高額訂單',
        code: `SELECT TOP 5 PERCENT 訂單編號, 訂單金額
FROM 訂單資料表
ORDER BY 訂單金額 DESC;`
      }
    ],
    '分頁查詢': [
      {
        title: '分頁查詢員工資料',
        code: `SELECT 員工編號, 姓名, 部門
FROM 員工資料表
ORDER BY 員工編號
OFFSET 10 ROWS
FETCH NEXT 5 ROWS ONLY;`
      },
      {
        title: '分頁查詢訂單資料',
        code: `SELECT 訂單編號, 客戶名稱, 訂單日期
FROM 訂單資料表
ORDER BY 訂單日期 DESC
OFFSET 20 ROWS
FETCH NEXT 10 ROWS ONLY;`
      }
    ]
  },
  '分組與聚合': {
    '基本聚合': [
      {
        title: '計算部門平均薪資',
        code: `SELECT 部門, AVG(薪資) as 平均薪資
FROM 員工資料表
GROUP BY 部門;`
      },
      {
        title: '統計各類產品數量',
        code: `SELECT 產品類別, COUNT(*) as 產品數量
FROM 產品資料表
GROUP BY 產品類別;`
      }
    ],
    '分組聚合': [
      {
        title: '計算各部門各職稱人數',
        code: `SELECT 部門, 職稱, COUNT(*) as 人數
FROM 員工資料表
GROUP BY 部門, 職稱;`
      },
      {
        title: '計算各客戶訂單總金額',
        code: `SELECT 客戶編號, SUM(訂單金額) as 總金額
FROM 訂單資料表
GROUP BY 客戶編號;`
      }
    ],
    '分組篩選': [
      {
        title: '查詢平均薪資超過50000的部門',
        code: `SELECT 部門, AVG(薪資) as 平均薪資
FROM 員工資料表
GROUP BY 部門
HAVING AVG(薪資) > 50000;`
      },
      {
        title: '查詢訂單數超過10筆的客戶',
        code: `SELECT 客戶編號, COUNT(*) as 訂單數
FROM 訂單資料表
GROUP BY 客戶編號
HAVING COUNT(*) > 10;`
      }
    ]
  },
  '集合運算': {
    '聯集查詢': [
      {
        title: '合併兩個部門的員工資料',
        code: `SELECT 員工編號, 姓名, 部門
FROM 資訊部員工
UNION
SELECT 員工編號, 姓名, 部門
FROM 人事部員工;`
      },
      {
        title: '合併兩個時期的訂單資料',
        code: `SELECT 訂單編號, 訂單日期, 訂單金額
FROM 2023年訂單
UNION ALL
SELECT 訂單編號, 訂單日期, 訂單金額
FROM 2024年訂單;`
      }
    ],
    '交集差集': [
      {
        title: '查詢同時在兩個部門的員工',
        code: `SELECT 員工編號, 姓名
FROM 資訊部員工
INTERSECT
SELECT 員工編號, 姓名
FROM 專案團隊;`
      },
      {
        title: '查詢只在A部門不在B部門的員工',
        code: `SELECT 員工編號, 姓名
FROM 資訊部員工
MINUS
SELECT 員工編號, 姓名
FROM 專案團隊;`
      }
    ]
  },
  '多表聯結': {
    '內部連結': [
      {
        title: '查詢員工及其部門資訊',
        code: `SELECT e.員工編號, e.姓名, d.部門名稱
FROM 員工資料表 e
INNER JOIN 部門資料表 d ON e.部門編號 = d.部門編號;`
      },
      {
        title: '查詢訂單及其客戶資訊',
        code: `SELECT o.訂單編號, o.訂單日期, c.客戶名稱
FROM 訂單資料表 o
INNER JOIN 客戶資料表 c ON o.客戶編號 = c.客戶編號;`
      }
    ],
    '外部連結': [
      {
        title: '查詢所有部門及其員工',
        code: `SELECT d.部門名稱, e.員工編號, e.姓名
FROM 部門資料表 d
LEFT JOIN 員工資料表 e ON d.部門編號 = e.部門編號;`
      },
      {
        title: '查詢所有客戶及其訂單',
        code: `SELECT c.客戶名稱, o.訂單編號, o.訂單金額
FROM 客戶資料表 c
LEFT JOIN 訂單資料表 o ON c.客戶編號 = o.客戶編號;`
      }
    ]
  },
  '子查詢': {
    '單值子查詢': [
      {
        title: '查詢高於平均薪資的員工',
        code: `SELECT 員工編號, 姓名, 薪資
FROM 員工資料表
WHERE 薪資 > (SELECT AVG(薪資) FROM 員工資料表);`
      },
      {
        title: '查詢最新訂單的客戶',
        code: `SELECT 客戶編號, 客戶名稱
FROM 客戶資料表
WHERE 客戶編號 = (SELECT 客戶編號 FROM 訂單資料表 ORDER BY 訂單日期 DESC FETCH FIRST 1 ROW ONLY);`
      }
    ],
    '多值子查詢': [
      {
        title: '查詢特定部門的員工',
        code: `SELECT 員工編號, 姓名, 部門
FROM 員工資料表
WHERE 部門 IN (SELECT 部門名稱 FROM 部門資料表 WHERE 部門類型 = '技術部門');`
      },
      {
        title: '查詢特定產品的訂單',
        code: `SELECT 訂單編號, 訂單日期
FROM 訂單資料表
WHERE 訂單編號 IN (SELECT 訂單編號 FROM 訂單明細 WHERE 產品編號 = 'P001');`
      }
    ]
  },
  '資料操作': {
    '新增單筆': [
      {
        title: '新增員工資料',
        code: `INSERT INTO 員工資料表 (員工編號, 姓名, 部門, 薪資)
VALUES ('E001', '張三', '資訊部', 45000);`
      },
      {
        title: '新增產品資料',
        code: `INSERT INTO 產品資料表 (產品編號, 產品名稱, 單價)
VALUES ('P001', '筆記型電腦', 35000);`
      }
    ],
    '更新資料': [
      {
        title: '更新員工薪資',
        code: `UPDATE 員工資料表
SET 薪資 = 薪資 * 1.1
WHERE 部門 = '資訊部';`
      },
      {
        title: '更新產品庫存',
        code: `UPDATE 產品資料表
SET 庫存量 = 庫存量 - 10
WHERE 產品編號 = 'P001';`
      }
    ],
    '刪除資料': [
      {
        title: '刪除特定員工',
        code: `DELETE FROM 員工資料表
WHERE 員工編號 = 'E001';`
      },
      {
        title: '刪除過期訂單',
        code: `DELETE FROM 訂單資料表
WHERE 訂單日期 < '2023-01-01';`
      }
    ]
  },
  '表格管理': {
    '建立表格': [
      {
        title: '建立員工資料表',
        code: `CREATE TABLE 員工資料表 (
  員工編號 VARCHAR(10) PRIMARY KEY,
  姓名 VARCHAR(50) NOT NULL,
  部門 VARCHAR(30),
  職稱 VARCHAR(30),
  薪資 INT DEFAULT 0,
  入職日期 DATE
);`
      },
      {
        title: '建立產品資料表',
        code: `CREATE TABLE 產品資料表 (
  產品編號 VARCHAR(10) PRIMARY KEY,
  產品名稱 VARCHAR(100) NOT NULL,
  類別 VARCHAR(30),
  單價 DECIMAL(10,2),
  庫存量 INT DEFAULT 0,
  建立日期 DATETIME DEFAULT GETDATE()
);`
      }
    ],
    '從查詢建立': [
      {
        title: '從現有表格建立新表格',
        code: `SELECT 員工編號, 姓名, 部門
INTO 部門員工清單
FROM 員工資料表
WHERE 部門 IS NOT NULL;`
      },
      {
        title: '建立高薪員工表格',
        code: `SELECT 員工編號, 姓名, 薪資
INTO 高薪員工清單
FROM 員工資料表
WHERE 薪資 > 50000;`
      }
    ],
    '修改表格': [
      {
        title: '新增欄位',
        code: `ALTER TABLE 員工資料表
ADD 電子郵件 VARCHAR(100),
    電話 VARCHAR(20);`
      },
      {
        title: '修改欄位',
        code: `ALTER TABLE 產品資料表
ALTER COLUMN 產品名稱 VARCHAR(150);`
      }
    ]
  },
  '限制條件': {
    '主鍵限制': [
      {
        title: '建立主鍵',
        code: `CREATE TABLE 訂單資料表 (
  訂單編號 VARCHAR(20) PRIMARY KEY,
  客戶編號 VARCHAR(10),
  訂單日期 DATE,
  訂單金額 DECIMAL(10,2)
);`
      },
      {
        title: '複合主鍵',
        code: `CREATE TABLE 訂單明細 (
  訂單編號 VARCHAR(20),
  產品編號 VARCHAR(10),
  數量 INT,
  PRIMARY KEY (訂單編號, 產品編號)
);`
      }
    ],
    '外鍵限制': [
      {
        title: '建立外鍵關聯',
        code: `CREATE TABLE 訂單資料表 (
  訂單編號 VARCHAR(20) PRIMARY KEY,
  客戶編號 VARCHAR(10),
  FOREIGN KEY (客戶編號) REFERENCES 客戶資料表(客戶編號)
);`
      },
      {
        title: '多個外鍵',
        code: `CREATE TABLE 訂單明細 (
  訂單編號 VARCHAR(20),
  產品編號 VARCHAR(10),
  FOREIGN KEY (訂單編號) REFERENCES 訂單資料表(訂單編號),
  FOREIGN KEY (產品編號) REFERENCES 產品資料表(產品編號)
);`
      }
    ],
    '唯一值限制': [
      {
        title: '單欄位唯一值',
        code: `CREATE TABLE 客戶資料表 (
  客戶編號 VARCHAR(10) PRIMARY KEY,
  電子郵件 VARCHAR(100) UNIQUE,
  電話 VARCHAR(20)
);`
      },
      {
        title: '複合唯一值',
        code: `CREATE TABLE 產品庫存 (
  產品編號 VARCHAR(10),
  倉庫編號 VARCHAR(10),
  庫存量 INT,
  UNIQUE (產品編號, 倉庫編號)
);`
      }
    ]
  },
  '檢視與索引': {
    '建立檢視': [
      {
        title: '建立部門員工檢視',
        code: `CREATE VIEW 部門員工檢視 AS
SELECT 
  d.部門名稱,
  e.員工編號,
  e.姓名,
  e.職稱
FROM 部門資料表 d
LEFT JOIN 員工資料表 e ON d.部門編號 = e.部門編號;`
      },
      {
        title: '建立銷售統計檢視',
        code: `CREATE VIEW 銷售統計檢視 AS
SELECT 
  p.產品名稱,
  SUM(od.數量) as 總銷售量,
  SUM(od.數量 * od.單價) as 總銷售額
FROM 產品資料表 p
JOIN 訂單明細 od ON p.產品編號 = od.產品編號
GROUP BY p.產品名稱;`
      }
    ],
    '檢查選項': [
      {
        title: '建立帶檢查選項的部門檢視',
        code: `CREATE VIEW 部門員工檢視 AS
SELECT 部門編號, 部門名稱, 員工編號, 姓名
FROM 部門資料表 d
JOIN 員工資料表 e ON d.部門編號 = e.部門編號
WHERE 部門名稱 IN ('資訊部', '人事部', '財務部')
WITH CHECK OPTION;`
      },
      {
        title: '建立帶檢查選項的薪資檢視',
        code: `CREATE VIEW 高薪員工檢視 AS
SELECT 員工編號, 姓名, 部門, 薪資
FROM 員工資料表
WHERE 薪資 >= 50000
WITH CHECK OPTION;`
      }
    ],
    '複雜檢視': [
      {
        title: '建立部門績效檢視',
        code: `CREATE VIEW 部門績效檢視 AS
SELECT 
  d.部門名稱,
  COUNT(e.員工編號) as 員工數,
  AVG(e.薪資) as 平均薪資,
  SUM(p.績效分數) as 總績效分數
FROM 部門資料表 d
LEFT JOIN 員工資料表 e ON d.部門編號 = e.部門編號
LEFT JOIN 績效資料表 p ON e.員工編號 = p.員工編號
GROUP BY d.部門名稱;`
      },
      {
        title: '建立客戶訂單統計檢視',
        code: `CREATE VIEW 客戶訂單統計檢視 AS
SELECT 
  c.客戶名稱,
  COUNT(o.訂單編號) as 訂單數,
  SUM(o.訂單金額) as 總金額,
  MAX(o.訂單日期) as 最近訂單日期
FROM 客戶資料表 c
LEFT JOIN 訂單資料表 o ON c.客戶編號 = o.客戶編號
GROUP BY c.客戶名稱;`
      }
    ],
    '刪除檢視': [
      {
        title: '刪除單一檢視',
        code: `DROP VIEW 部門員工檢視;`
      },
      {
        title: '刪除多個檢視',
        code: `DROP VIEW 部門績效檢視, 客戶訂單統計檢視;`
      }
    ]
  },
  '資料操作': {
    '從其他表新增': [
      {
        title: '從查詢結果新增資料',
        code: `INSERT INTO 高薪員工清單 (員工編號, 姓名, 薪資)
SELECT 員工編號, 姓名, 薪資
FROM 員工資料表
WHERE 薪資 > 50000;`
      },
      {
        title: '從多表聯結新增資料',
        code: `INSERT INTO 部門績效統計 (部門編號, 部門名稱, 平均薪資)
SELECT 
  d.部門編號,
  d.部門名稱,
  AVG(e.薪資) as 平均薪資
FROM 部門資料表 d
JOIN 員工資料表 e ON d.部門編號 = e.部門編號
GROUP BY d.部門編號, d.部門名稱;`
      }
    ],
    '新增多筆': [
      {
        title: '新增多筆員工資料',
        code: `INSERT INTO 員工資料表 (員工編號, 姓名, 部門, 薪資)
VALUES 
  ('E001', '張三', '資訊部', 45000),
  ('E002', '李四', '人事部', 42000),
  ('E003', '王五', '財務部', 48000);`
      },
      {
        title: '新增多筆產品資料',
        code: `INSERT INTO 產品資料表 (產品編號, 產品名稱, 單價, 庫存量)
VALUES 
  ('P001', '筆記型電腦', 35000, 10),
  ('P002', '印表機', 8000, 15),
  ('P003', '螢幕', 5000, 20);`
      }
    ]
  },
  '子查詢': {
    '存在子查詢': [
      {
        title: '查詢有訂單的客戶',
        code: `SELECT 客戶編號, 客戶名稱
FROM 客戶資料表 c
WHERE EXISTS (
  SELECT 1 
  FROM 訂單資料表 o 
  WHERE o.客戶編號 = c.客戶編號
);`
      },
      {
        title: '查詢有績效評分的員工',
        code: `SELECT 員工編號, 姓名, 部門
FROM 員工資料表 e
WHERE EXISTS (
  SELECT 1 
  FROM 績效資料表 p 
  WHERE p.員工編號 = e.員工編號 
  AND p.績效分數 >= 80
);`
      }
    ],
    '分組子查詢': [
      {
        title: '查詢高於部門平均薪資的員工',
        code: `SELECT 員工編號, 姓名, 部門, 薪資
FROM 員工資料表 e
WHERE 薪資 > (
  SELECT AVG(薪資)
  FROM 員工資料表
  WHERE 部門 = e.部門
);`
      },
      {
        title: '查詢高於產品類別平均單價的產品',
        code: `SELECT 產品編號, 產品名稱, 類別, 單價
FROM 產品資料表 p
WHERE 單價 > (
  SELECT AVG(單價)
  FROM 產品資料表
  WHERE 類別 = p.類別
);`
      }
    ],
    '連結子查詢': [
      {
        title: '使用子查詢進行部門統計',
        code: `SELECT d.部門名稱, e.員工數, e.平均薪資
FROM 部門資料表 d
JOIN (
  SELECT 部門, 
         COUNT(*) as 員工數,
         AVG(薪資) as 平均薪資
  FROM 員工資料表
  GROUP BY 部門
) e ON d.部門名稱 = e.部門;`
      },
      {
        title: '使用子查詢進行客戶訂單分析',
        code: `SELECT c.客戶名稱, o.訂單數, o.總金額
FROM 客戶資料表 c
JOIN (
  SELECT 客戶編號,
         COUNT(*) as 訂單數,
         SUM(訂單金額) as 總金額
  FROM 訂單資料表
  GROUP BY 客戶編號
) o ON c.客戶編號 = o.客戶編號;`
      }
    ]
  }
}

// 獲取當前範例
const currentExamples = computed(() => {
  if (expandedCard.value === null || selectedExample.value === null) return []
  const category = cards[expandedCard.value].title
  const example = cards[expandedCard.value].examples[selectedExample.value].label
  return examples[category]?.[example] || []
})

// 優化初始化
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const block = entry.target
        if (!block.classList.contains('hljs')) {
          const code = block.textContent
          if (codeCache.has(code)) {
            block.innerHTML = codeCache.get(code)
            block.classList.add('hljs')
          } else {
            hljs.highlightElement(block)
            codeCache.set(code, block.innerHTML)
          }
        }
      }
    })
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  })

  // 只觀察未處理的程式碼區塊
  document.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
    observer.observe(block)
  })
})

// 清理快取
const clearCache = () => {
  if (codeCache.size > 1000) { // 限制快取大小
    const keys = Array.from(codeCache.keys())
    for (let i = 0; i < 500; i++) {
      codeCache.delete(keys[i])
    }
  }
}

// 定期清理快取
setInterval(clearCache, 300000) // 每5分鐘清理一次
</script>

<style>
/* 全局樣式 */
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: #0d1117;
}

#app {
  min-height: 100vh;
  background-color: #0d1117;
}
</style>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: #0d1117;
  color: #c9d1d9;
  font-family: 'Noto Sans TC', 'Microsoft JhengHei', Arial, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #161b22;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

header h1 {
  font-size: 2rem;
  color: #58a6ff;
  margin-bottom: 0.5rem;
}

header p {
  color: #8b949e;
  font-size: 1rem;
  margin: 0;
}

.main-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  min-height: calc(100vh - 200px);
}

.sidebar {
  background: #161b22;
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.category-btn {
  background: #21262d;
  border: 1px solid #30363d;
  padding: 1rem 1.2rem;
  text-align: left;
  color: #c9d1d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.example-count {
  background: #30363d;
  color: #8b949e;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  min-width: 24px;
  text-align: center;
}

.category-btn:hover .example-count {
  background: #58a6ff;
  color: #0d1117;
}

.category-btn.active .example-count {
  background: #0d1117;
  color: #58a6ff;
}

.category-btn:hover {
  background: #30363d;
  color: #58a6ff;
  transform: translateX(4px);
}

.category-btn.active {
  background: #58a6ff;
  color: #0d1117;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
}

.content-area {
  background: #161b22;
  border-radius: 8px;
  padding: 2rem;
}

.examples-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.example-btn {
  background: #21262d;
  border: none;
  padding: 0.8rem 1rem;
  text-align: left;
  color: #c9d1d9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.example-btn:hover {
  background: #30363d;
  color: #58a6ff;
}

.example-btn.active {
  background: #58a6ff;
  color: #0d1117;
}

.example-detail {
  background: #21262d;
  border-radius: 8px;
  padding: 1.5rem;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.example-header h3 {
  color: #58a6ff;
  font-size: 1.2rem;
  margin: 0;
}

.code-block {
  background: #0d1117;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #30363d;
}

pre {
  margin: 0;
  overflow-x: auto;
}

code {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 自定義 highlight.js 主題 */
:deep(.hljs) {
  background: #0d1117;
  color: #c9d1d9;
}

:deep(.hljs-keyword) {
  color: #ff7b72;
  font-weight: bold;
}

:deep(.hljs-function) {
  color: #d2a8ff;
}

:deep(.hljs-string) {
  color: #a5d6ff;
}

:deep(.hljs-number) {
  color: #79c0ff;
}

:deep(.hljs-operator) {
  color: #ff7b72;
}

:deep(.hljs-comment) {
  color: #8b949e;
}

.example-note {
  background: #161b22;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1rem;
  color: #8b949e;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.note-icon {
  font-size: 1.2rem;
}

.copy-btn {
  background: #58a6ff;
  color: #0d1117;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.copy-btn:hover {
  background: #1f6feb;
}

.welcome-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #8b949e;
}

.welcome-message h2 {
  color: #58a6ff;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.select-hint {
  color: #8b949e;
  font-size: 1.1rem;
}

@media (max-width: 1200px) {
  .examples-container {
    grid-template-columns: 1fr;
  }

  .examples-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    margin-bottom: 1rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  header {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  header h1 {
    font-size: 1.5rem;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .sidebar {
    position: static;
    margin-bottom: 1rem;
  }

  .category-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
  }

  .example-count {
    padding: 0.15rem 0.4rem;
    font-size: 0.8rem;
    min-width: 20px;
  }

  .content-wrapper {
    gap: 1rem;
  }

  .content-area {
    padding: 1rem;
  }

  .examples-container {
    grid-template-columns: 1fr;
  }

  .examples-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .example-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }

  .example-detail {
    padding: 1rem;
  }

  .example-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .example-header h3 {
    font-size: 1.1rem;
  }

  .copy-btn {
    width: 100%;
    justify-content: center;
  }

  .code-block {
    padding: 0.8rem;
    margin: 0.8rem 0;
  }

  code {
    font-size: 0.85rem;
  }

  .example-note {
    padding: 0.8rem;
    font-size: 0.9rem;
  }

  .info-card {
    margin-top: 1rem;
  }

  .info-header {
    padding: 0.8rem 1rem;
  }

  .info-content {
    padding: 1rem;
  }

  .example-block {
    padding: 1rem;
  }

  .example-title {
    font-size: 0.9rem;
  }

  .example-block code {
    font-size: 0.85rem;
  }
}

/* 針對更小的螢幕 */
@media (max-width: 480px) {
  .container {
    padding: 0.8rem;
  }

  .category-list {
    grid-template-columns: 1fr;
  }

  .examples-list {
    grid-template-columns: 1fr;
  }

  .category-btn, .example-btn {
    padding: 0.7rem 0.8rem;
  }

  .code-block {
    padding: 0.6rem;
  }

  code {
    font-size: 0.8rem;
  }
}

/* 優化觸控體驗 */
@media (hover: none) {
  .category-btn:active,
  .example-btn:active,
  .copy-btn:active {
    transform: scale(0.98);
  }

  .category-btn:hover,
  .example-btn:hover,
  .copy-btn:hover {
    transform: none;
  }
}

/* 新增的卡片樣式 */
.info-card {
  background: #161b22;
  border-radius: 8px;
  border: 1px solid #30363d;
  overflow: hidden;
}

.info-header {
  background: #21262d;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #30363d;
}

.info-header h3 {
  color: #58a6ff;
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-content {
  padding: 1.5rem;
}

.info-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
}

.info-content li {
  color: #c9d1d9;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.info-content li::before {
  content: "•";
  color: #58a6ff;
  font-size: 1.2rem;
}

/* 範例卡片樣式 */
.example-section {
  display: flex;
    flex-direction: column;
  gap: 1.5rem;
}

.example-section h4 {
  color: #58a6ff;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #30363d;
}

.example-block {
  background: #0d1117;
  border-radius: 6px;
  padding: 1.2rem;
  border: 1px solid #30363d;
  transition: all 0.2s ease;
}

.example-block:hover {
  border-color: #58a6ff;
  transform: translateY(-2px);
}

.example-title {
  color: #8b949e;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.example-block pre {
  margin: 0;
  padding: 0;
}

.example-block code {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.example-placeholder {
  color: #8b949e;
  text-align: center;
  padding: 2rem;
  background: #0d1117;
  border-radius: 6px;
  border: 1px solid #30363d;
}

@media (max-width: 768px) {
  .example-block {
    padding: 1rem;
  }
  
  .example-block code {
    font-size: 0.85rem;
  }
}
</style> 

