-- ============================================================================
-- 🍐 想吃梨儿童艺术启蒙 · 官方云端数据库建表与初始化脚本 (Database Schema)
-- 兼容主流云数据库：Supabase (PostgreSQL), Neon, AWS RDS, 腾讯云/阿里云 TDSQL/MySQL
-- ============================================================================

-- 1. 小艺术家名人堂表 (students)
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  age VARCHAR(32) NOT NULL,
  age_group VARCHAR(16) NOT NULL, -- '3-5' | '6-8' | '9-12'
  class_name VARCHAR(64) NOT NULL,
  avatar TEXT NOT NULL,
  bio TEXT NOT NULL,
  featured_art_count INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 少儿艺术作品表 (artworks)
CREATE TABLE IF NOT EXISTS artworks (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  author VARCHAR(64) NOT NULL,
  age VARCHAR(32) NOT NULL,
  age_group VARCHAR(16) NOT NULL,
  category VARCHAR(64) NOT NULL,
  category_name VARCHAR(64) NOT NULL,
  date VARCHAR(32) NOT NULL,
  image TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb, -- 多视角作品照片列表
  story TEXT NOT NULL,
  audio_duration VARCHAR(16) DEFAULT '00:20',
  audio_url TEXT,
  teacher_comment TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 主题特展深度期刊专页表 (thematic_exhibitions)
CREATE TABLE IF NOT EXISTS thematic_exhibitions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  subtitle VARCHAR(128) NOT NULL,
  cover_image TEXT NOT NULL,
  tag VARCHAR(64) NOT NULL,
  date VARCHAR(64) NOT NULL,
  intro TEXT NOT NULL,
  curator_note TEXT NOT NULL,
  sections JSONB DEFAULT '[]'::jsonb, -- 图文混排段落集
  artwork_ids JSONB DEFAULT '[]'::jsonb, -- 关联收录的作品ID集合
  is_in_hero BOOLEAN DEFAULT true, -- 是否加入首页焦点轮播
  hero_order INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 互动美育便签墙留言表 (sticky_notes)
CREATE TABLE IF NOT EXISTS sticky_notes (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(16) DEFAULT 'text', -- 'text' | 'artwork'
  author VARCHAR(64) NOT NULL,
  role VARCHAR(32) DEFAULT 'visitor',
  role_name VARCHAR(64) DEFAULT '',
  color VARCHAR(16) DEFAULT 'yellow', -- 'yellow' | 'green' | 'pink' | 'blue' | 'purple'
  content TEXT NOT NULL,
  artwork_title VARCHAR(128) DEFAULT '',
  artwork_image TEXT DEFAULT '',
  tag VARCHAR(64) DEFAULT '#美育便签',
  date VARCHAR(32) NOT NULL,
  likes INT DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false, -- 主理人删除/隐藏标记
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 主理人管理员账号表 (admin_users)
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(256) NOT NULL,
  role VARCHAR(32) DEFAULT 'curator',
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 🚀 初始预置数据集 (Seed Initial Data)
-- ============================================================================

-- 插入小艺术家初始数据
INSERT INTO students (id, name, age, age_group, class_name, avatar, bio, featured_art_count) VALUES
('s-1', '林雨桐', '5岁', '3-5', '启蒙萌芽A班', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=85', '喜欢用大块纯色表达情绪，拥有天马行空的怪物小宇宙。擅长油画棒与水粉结合。', 2),
('s-2', '陈泽宇', '7岁', '6-8', '少儿探索B班', 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=85', '对线条和空间有独到见解，笔下的小动物极富戏剧张力与故事感。', 2),
('s-3', '张若曦', '10岁', '9-12', '当代创想高级班', 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=400&auto=format&fit=crop&q=85', '热衷于立体装置与雕塑创作，作品充满对自然与未来生态的深刻探索。', 2),
('s-4', '周子墨', '4岁', '3-5', '色彩初探A班', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=85', '手指点画与重彩混色的小大师，画面洋溢着最原始纯真的生命力。', 1),
('s-5', '苏可儿', '6岁', '6-8', '综合材料B班', 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&auto=format&fit=crop&q=85', '善于将落叶、羽毛、拼贴等综合媒介与水彩交融，画面极具诗意。', 1),
('s-6', '陆星辰', '8岁', '6-8', '未来创想B班', 'https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=400&auto=format&fit=crop&q=85', '小小工业设计师，热衷于将自然界生命形态与机械科技概念大胆融合。', 1)
ON CONFLICT (id) DO NOTHING;

-- 插入便签墙精选数据
INSERT INTO sticky_notes (id, type, author, role, role_name, color, content, tag, date, likes) VALUES
('note-1', 'text', '林雨桐妈妈', 'parent', '👩‍👧 家长寄语', 'yellow', '以前总担心桐桐画画不按常理出牌，树画成紫色的、天画成绿色的。来到想吃梨后才发现，保护孩子眼睛里的自由，比画得‘像’重要的多！现在家里贴满了她的彩色小宇宙。', '#尊重原生创造力', '2026.08.17', 24),
('note-2', 'artwork', '陈一诺 (7岁)', 'student', '🎨 小学员', 'green', '今天在课堂上用重彩油画棒画的！下雨天猫咪不用撑伞，它直接飞到太空云朵里吃冰淇淋避雨，云朵是草莓味的。', '#童心脑洞大开', '2026.08.16', 38),
('note-3', 'text', '林老师', 'teacher', '👩‍🏫 美育主理人', 'purple', '在美育便签墙欢迎每一位家长和孩子！在这里没有标准答案，每一段童言童语、每一张哪怕是不经意的涂鸦草图，都是世界上绝无仅有的艺术宝贝。期待看到大家的分享！✨', '#想吃梨美育手记', '2026.08.15', 56),
('note-4', 'text', '周子墨爸爸', 'parent', '👨‍👦 家长寄语', 'blue', '特别认同林老师说的‘画画是情绪的释放’。子墨以前性格内向，现在每次上完美术课回到家都特别兴奋，拉着我们讲画里的小怪兽。艺术真的能打开孩子的心灵。', '#情绪释放与自信', '2026.08.14', 19),
('note-5', 'artwork', '陆星辰 (8岁)', 'student', '🎨 小学员', 'yellow', '这是我画的未来列车草图！它不需要铁轨，直接在草地上滑行，车顶有透明的植物温室，一边跑一边吐出新鲜的氧气泡泡。', '#未来工业小设计师', '2026.08.13', 31),
('note-6', 'text', '艺术系研究生沈学姐', 'visitor', '🌟 艺术爱好者', 'pink', '偶然刷到这个儿童画廊，被孩子们的色彩冲击到了！没有模板化范画的匠气，全是原生的当代艺术触觉。国内的美育太需要这样呵护孩子天性的土壤了，为林老师点赞！', '#当代少儿美育实践', '2026.08.12', 42),
('note-7', 'text', '苏可儿妈妈', 'parent', '👩‍👧 家长寄语', 'green', '展厅里每幅画点进去能听到孩子自己录的原声小故事，这个设计太温暖了！我们把可儿讲故事的声音发给外公外婆听，老人家开心得合不拢嘴。', '#童声原声回忆', '2026.08.11', 27),
('note-8', 'artwork', '王子涵 (6岁)', 'student', '🎨 小学员', 'pink', '霸王龙其实不凶，它只是太想吃西瓜了！我给它画了一个彩虹山，让它天天都能吃到甜甜的无籽大西瓜。', '#纯真童心', '2026.08.10', 45)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 🔓 开启公网访问与安全读写权限 (Grant Public API Access & Permissions)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
