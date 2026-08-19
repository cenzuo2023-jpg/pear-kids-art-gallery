/**
 * 🍐 想吃梨儿童艺术启蒙 · 课程与特展 Base64 图片安全迁移至 Supabase Storage 脚本
 * 
 * 功能与安全保证：
 * 1. 【安全第一】: 严禁任何 truncate/delete 操作，仅对上传成功的字段进行安全 PATCH 替换。
 * 2. 【幂等可重入】: 自动识别 http/https URL 并直接跳过，支持任意次数重复运行。
 * 3. 【完整性校验】: 只有当单条记录的所有图片全部在 Storage 上传成功后，才执行数据库字段更新。
 * 4. 【Dry-Run 模式】: 默认运行演练模式，直观预览待迁移图片数量、体积削减与迁移计划。
 * 5. 【凭证安全】: 从 process.env 或 .env 读取密钥，绝不硬编码敏感凭证。
 * 
 * 运行方式：
 * - 演练预览 (Dry-Run): node scripts/migrate-course-images-to-storage.js
 * - 执行迁移 (Apply)  : node scripts/migrate-course-images-to-storage.js --apply
 * - 指定密钥运行       : node scripts/migrate-course-images-to-storage.js --apply --key=YOUR_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. 读取环境变量
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        env[k.trim()] = v.join('=').trim();
      }
    }
  }
  return env;
}

const env = loadEnv();
const args = process.argv.slice(2);
const isApply = args.includes('--apply') || args.includes('--execute');
const keyArg = args.find(a => a.startsWith('--key='));
const customKey = keyArg ? keyArg.split('=')[1] : null;

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || "https://hnzddhxgzbkllnmwpvdi.supabase.co";
const SUPABASE_KEY = customKey || process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || env.SUPABASE_KEY || "sb_publishable_xHnY5J95z8B5pPLGMf2w9w_pLGfZXC9";

const REST_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

// 2. Base64 辅助解析工具
function parseBase64(dataUri) {
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) {
    return null;
  }
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  const rawSubtype = match[1].toLowerCase();
  let ext = 'jpg';
  let mime = 'image/jpeg';
  if (rawSubtype.includes('png')) { ext = 'png'; mime = 'image/png'; }
  else if (rawSubtype.includes('webp')) { ext = 'webp'; mime = 'image/webp'; }
  else if (rawSubtype.includes('gif')) { ext = 'gif'; mime = 'image/gif'; }
  else if (rawSubtype.includes('svg')) { ext = 'svg'; mime = 'image/svg+xml'; }

  const buffer = Buffer.from(match[2], 'base64');
  const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 10);
  return { buffer, ext, mime, hash, byteSize: buffer.length };
}

// 3. 上传单个 Buffer 到 Supabase Storage
async function uploadToStorage(buffer, mime, storagePath) {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/course-media/${storagePath}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": mime,
      "x-upsert": "true"
    },
    body: buffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Storage HTTP ${res.status}: ${errText}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/course-media/${storagePath}`;
  return publicUrl;
}

// 4. 主迁移函数
async function migrateThematicExhibitions() {
  console.log('='.repeat(70));
  console.log(`🍐 想吃梨美育 · Supabase 特展与课程 Base64 图片对象存储迁移工具`);
  console.log(`📡 目标 Supabase 实例: ${SUPABASE_URL}`);
  console.log(`⚙️ 运行模式: ${isApply ? '🚀 实际执行迁移 (--apply)' : '🔍 演练预览模式 (Dry-Run)'}`);
  console.log('='.repeat(70));

  // 检查 Storage Bucket 可用性
  console.log('\n[步骤 1/4] 检查 Storage course-media Bucket 状态...');
  try {
    const bucketCheckRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/course-media`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    if (bucketCheckRes.ok) {
      console.log('✅ Supabase Storage course-media Bucket 已就绪！');
    } else {
      console.warn(`⚠️ 注意: course-media Bucket 响应为 ${bucketCheckRes.status}`);
      console.warn('   如未创建，请在 Supabase Dashboard -> Storage 中创建公开 Bucket "course-media"');
    }
  } catch (err) {
    console.warn('⚠️ 检查 Bucket 异常:', err.message);
  }

  // 获取所有特展数据 (通过单条迭代或分块拉取，防止一次性拉取触发超时)
  console.log('\n[步骤 2/4] 获取 thematic_exhibitions 记录列表...');
  const listRes = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?select=id,title,created_at&order=created_at.desc`, {
    headers: REST_HEADERS
  });
  if (!listRes.ok) {
    console.error('❌ 获取特展列表失败:', listRes.status, await listRes.text());
    process.exit(1);
  }

  const themesSummaryList = await listRes.json();
  console.log(`📋 共找到 ${themesSummaryList.length} 条特展/课程记录需要巡检`);

  const stats = {
    totalRecords: themesSummaryList.length,
    scannedImages: 0,
    base64ImagesFound: 0,
    alreadyHttpUrls: 0,
    uploadedToStorage: 0,
    failedUploads: 0,
    recordsUpdated: 0,
    totalBase64BytesOriginal: 0,
    totalStorageBytesMigrated: 0
  };

  console.log('\n[步骤 3/4] 逐条扫描与安全迁移...');

  for (let i = 0; i < themesSummaryList.length; i++) {
    const summary = themesSummaryList[i];
    const themeId = summary.id;
    console.log(`\n------------------------------------------------------------`);
    console.log(`[${i + 1}/${themesSummaryList.length}] 正在处理: 《${summary.title}》 (ID: ${themeId})`);

    // 单条拉取完整记录 (避免全表 select * 超时)
    const singleRes = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?select=*&id=eq.${encodeURIComponent(themeId)}&limit=1`, {
      headers: REST_HEADERS
    });
    if (!singleRes.ok) {
      console.error(`❌ 获取详情失败 (${singleRes.status}): 跳过该条记录`);
      continue;
    }
    const singleData = await singleRes.json();
    if (!singleData || singleData.length === 0) continue;
    const theme = singleData[0];

    let hasChanges = false;
    let rowUploadSuccess = true;
    const pendingUploads = []; // { type, path, buffer, mime, applyCallback }

    // 1. 检查 cover_image
    if (theme.cover_image) {
      stats.scannedImages++;
      const parsed = parseBase64(theme.cover_image);
      if (parsed) {
        stats.base64ImagesFound++;
        stats.totalBase64BytesOriginal += parsed.byteSize;
        const storagePath = `themes/${themeId}/cover_${parsed.hash}.${parsed.ext}`;
        pendingUploads.push({
          type: 'cover_image',
          storagePath,
          buffer: parsed.buffer,
          mime: parsed.mime,
          apply: (publicUrl) => { theme.cover_image = publicUrl; hasChanges = true; }
        });
        console.log(`   📸 发现封面 Base64 图 (${(parsed.byteSize / 1024).toFixed(1)} KB) -> 待迁移至 ${storagePath}`);
      } else if (theme.cover_image.startsWith('http')) {
        stats.alreadyHttpUrls++;
      }
    }

    // 2. 检查 sections[*].image
    if (Array.isArray(theme.sections)) {
      theme.sections.forEach((sec, idx) => {
        if (sec && sec.image) {
          stats.scannedImages++;
          const parsed = parseBase64(sec.image);
          if (parsed) {
            stats.base64ImagesFound++;
            stats.totalBase64BytesOriginal += parsed.byteSize;
            const storagePath = `themes/${themeId}/section_${idx}_${parsed.hash}.${parsed.ext}`;
            pendingUploads.push({
              type: `section[${idx}]`,
              storagePath,
              buffer: parsed.buffer,
              mime: parsed.mime,
              apply: (publicUrl) => { sec.image = publicUrl; hasChanges = true; }
            });
            console.log(`   🖼️ 发现第 ${idx + 1} 个段落插图 Base64 (${(parsed.byteSize / 1024).toFixed(1)} KB) -> 待迁移至 ${storagePath}`);
          } else if (sec.image.startsWith('http')) {
            stats.alreadyHttpUrls++;
          }
        }
      });
    }

    // 3. 检查 curator_note 中的内联 Markdown Base64 图片
    if (theme.curator_note && typeof theme.curator_note === 'string') {
      const inlineBase64Regex = /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g;
      let match;
      let noteImgIndex = 0;
      while ((match = inlineBase64Regex.exec(theme.curator_note)) !== null) {
        stats.scannedImages++;
        const rawUri = match[0];
        const parsed = parseBase64(rawUri);
        if (parsed) {
          stats.base64ImagesFound++;
          stats.totalBase64BytesOriginal += parsed.byteSize;
          const currentIdx = noteImgIndex++;
          const storagePath = `themes/${themeId}/curator_inline_${currentIdx}_${parsed.hash}.${parsed.ext}`;
          pendingUploads.push({
            type: `curator_note_inline[${currentIdx}]`,
            storagePath,
            buffer: parsed.buffer,
            mime: parsed.mime,
            apply: (publicUrl) => {
              theme.curator_note = theme.curator_note.replace(rawUri, publicUrl);
              hasChanges = true;
            }
          });
          console.log(`   📝 发现策展手记内联 Base64 图 (${(parsed.byteSize / 1024).toFixed(1)} KB) -> 待迁移至 ${storagePath}`);
        }
      }
    }

    if (pendingUploads.length === 0) {
      console.log(`   ✨ 该记录无需迁移（全部图片已经是 Storage URL 或无图片）`);
      continue;
    }

    console.log(`   📦 待迁移图片数: ${pendingUploads.length} 张`);

    if (isApply) {
      // 执行上传
      for (const item of pendingUploads) {
        try {
          const publicUrl = await uploadToStorage(item.buffer, item.mime, item.storagePath);
          item.apply(publicUrl);
          stats.uploadedToStorage++;
          stats.totalStorageBytesMigrated += item.buffer.length;
          console.log(`   ✅ [成功] ${item.type} -> ${publicUrl}`);
        } catch (uploadErr) {
          console.error(`   ❌ [失败] ${item.type} 上传 Storage 失败:`, uploadErr.message);
          stats.failedUploads++;
          rowUploadSuccess = false;
          break; // 保证原子性，任何一张失败都不更新该记录
        }
      }

      // 只有该记录的所有图片全部上传成功，才更新数据库字段
      if (rowUploadSuccess && hasChanges) {
        console.log(`   💾 正在写回 Supabase 数据库 (仅更新轻量化后的 URL 结构)...`);
        const patchPayload = {
          cover_image: theme.cover_image,
          sections: theme.sections,
          curator_note: theme.curator_note
        };
        const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/thematic_exhibitions?id=eq.${encodeURIComponent(themeId)}`, {
          method: 'PATCH',
          headers: REST_HEADERS,
          body: JSON.stringify(patchPayload)
        });
        if (patchRes.ok) {
          stats.recordsUpdated++;
          console.log(`   🎉 记录 《${summary.title}》 数据库字段更新成功！`);
        } else {
          console.error(`   ❌ 记录 《${summary.title}》 PATCH 数据库失败:`, patchRes.status, await patchRes.text());
        }
      } else if (!rowUploadSuccess) {
        console.warn(`   ⚠️ 记录 《${summary.title}》 存在上传失败的图片，未修改数据库原字段以保证安全。`);
      }
    }
  }

  // 5. 输出迁移成果统计报告
  console.log('\n' + '='.repeat(70));
  console.log(`📊 迁移报告与统计指标总结 (${isApply ? '实际执行完成' : 'Dry-Run 演练结果'})`);
  console.log('='.repeat(70));
  console.log(`- 扫描特展记录总数   : ${stats.totalRecords} 条`);
  console.log(`- 扫描图片总计       : ${stats.scannedImages} 张`);
  console.log(`- 发现存量 Base64 图 : ${stats.base64ImagesFound} 张 (${(stats.totalBase64BytesOriginal / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`- 已是标准 URL 图片  : ${stats.alreadyHttpUrls} 张`);
  if (isApply) {
    console.log(`- 成功上传至 Storage : ${stats.uploadedToStorage} 张`);
    console.log(`- 上传失败图片数     : ${stats.failedUploads} 张`);
    console.log(`- 成功更新数据库记录 : ${stats.recordsUpdated} 条`);
    console.log(`- 数据库瘦身体积节省 : 约 ${(stats.totalBase64BytesOriginal / (1024 * 1024)).toFixed(2)} MB`);
  } else {
    console.log(`\n💡 提示: 当前为演练模式 (未对数据库和 Storage 作出修改)。`);
    console.log(`   如需正式执行迁移，请运行:`);
    console.log(`   node scripts/migrate-course-images-to-storage.js --apply`);
  }
  console.log('='.repeat(70));
}

migrateThematicExhibitions().catch(err => {
  console.error('\n❌ 迁移脚本发生未捕获异常:', err);
  process.exit(1);
});
