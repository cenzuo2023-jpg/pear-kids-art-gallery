/**
 * 麦浪美术中心 · 儿童艺术档案库 (Kids Art Archive)
 * 作品与小艺术家名人堂数据集
 */
var initialArtworks = [
  // 林雨桐 作品
  {
    id: "art-1",
    title: "夏日海滩上的冰淇淋怪兽",
    author: "林雨桐",
    age: "5岁",
    ageGroup: "3-5",
    category: "oil-pastel",
    categoryName: "重彩油画棒",
    date: "2026.07",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "小怪兽怕热，所以它把大海变成了蓝莓味的冰淇淋，大家都可以一边游泳一边吃甜筒。太阳公公戴了墨镜在旁边笑。",
    audioDuration: "00:24",
    teacherComment: "色彩冷暖对比极具张力，橘红怪兽与天蓝冰淇淋海形成了大胆的视觉表达，充满了自由而纯粹的童心想象。"
  },
  {
    id: "art-1-2",
    title: "彩虹长颈鹿在云端吃棉花糖",
    author: "林雨桐",
    age: "5岁",
    ageGroup: "3-5",
    category: "watercolor",
    categoryName: "水粉水彩",
    date: "2026.05",
    image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "长颈鹿脖子太长了，伸到了天上去吃软绵绵的棉花糖，身上被彩虹染成了很多条纹。",
    audioDuration: "00:20",
    teacherComment: "水粉色彩非常明亮纯净，画面呈现出难得的轻快与童真韵味。"
  },

  // 陈泽宇 作品
  {
    id: "art-2",
    title: "穿雨衣在水洼跳舞的小猫",
    author: "陈泽宇",
    age: "7岁",
    ageGroup: "6-8",
    category: "watercolor",
    categoryName: "水粉水彩",
    date: "2026.06",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "下大雨的时候，小猫穿上了黄色的雨衣和红色的小靴子。在水坑里跳起来的时候，水花像钻石一样到处飞溅。",
    audioDuration: "00:32",
    teacherComment: "水粉湿画法晕染自然，水花飞溅的运笔大胆果断。构图动感强烈，仿佛能从画中听到清脆的雨声。"
  },
  {
    id: "art-2-2",
    title: "深海里的机械发光潜水艇",
    author: "陈泽宇",
    age: "7岁",
    ageGroup: "6-8",
    category: "sketch",
    categoryName: "线描与设计",
    date: "2026.04",
    image: "https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "潜水艇上有好多探照灯，专门去海底给发光水母拍照片。",
    audioDuration: "00:28",
    teacherComment: "线条组织严密，机械结构与自然生物的结合充满童趣科技感。"
  },

  // 张若曦 作品 (粘土立体装置与多角度多视角雕塑展示)
  {
    id: "art-3",
    title: "森林深处的水晶精灵树屋",
    author: "张若曦",
    age: "10岁",
    ageGroup: "9-12",
    category: "clay",
    categoryName: "粘土与立体装置",
    date: "2026.05",
    image: "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "树屋上面住着掌管森林魔法的精灵，树枝上挂满了收集星光的水晶瓶。楼梯是用弯曲藤蔓做的，还有小松鼠的露台。",
    audioDuration: "00:45",
    teacherComment: "空间塑造能力出众，树屋层次极为丰富。综合运用超轻粘土、天然松果与透明材料，展现了很强的立体整合能力。"
  },
  {
    id: "art-3-2",
    title: "静物构想：蓝色陶罐与光影",
    author: "张若曦",
    age: "10岁",
    ageGroup: "9-12",
    category: "oil-pastel",
    categoryName: "重彩油画棒",
    date: "2026.03",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "阳光照在陶罐上的时候，背光的地方其实不是黑色的，而是藏着好看的深紫色和孔雀蓝。",
    audioDuration: "00:36",
    teacherComment: "对光影色彩的冷暖变化观察敏锐，油画棒叠色厚重有力，很有现代绘画的质感。"
  },

  // 王子涵 作品
  {
    id: "art-4",
    title: "彩虹森林巡逻队长",
    author: "王子涵",
    age: "4岁半",
    ageGroup: "3-5",
    category: "oil-pastel",
    categoryName: "油画棒拼贴",
    date: "2026.07",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "长颈鹿的脖子可以伸到云朵上面去吃棉花糖，它的斑纹是彩色的波点，走起路来会发出叮咚的声音。",
    audioDuration: "00:18",
    teacherComment: "用色纯真而热烈，大胆打破了常规的固有色认知，保留了低龄儿童最宝贵、最原始的直觉式表现力。"
  },

  // 李俊熙 作品
  {
    id: "art-5",
    title: "未来星际列车",
    author: "李俊熙",
    age: "11岁",
    ageGroup: "9-12",
    category: "sketch",
    categoryName: "线描与设计",
    date: "2026.06",
    image: "https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "这列火车不需要轨道，它是靠光子推进器在云海里穿梭的。车厢顶部有微型生态温室，可以带着植物去旅行。",
    audioDuration: "00:40",
    teacherComment: "复杂机械线条与透视关系把握严谨，马克笔叠色利落。作品不仅有精细的技术表现，更蕴含着独特的构思逻辑。"
  },

  // 苏可儿 作品 (立体拼贴综合媒介多角度展示)
  {
    id: "art-6",
    title: "立体主义花瓶与水果",
    author: "苏可儿",
    age: "8岁",
    ageGroup: "6-8",
    category: "collage",
    categoryName: "拼贴与综合媒介",
    date: "2026.07",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=85",
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=85"
    ],
    story: "我把报纸剪成了花瓶的半边，另一边用油画棒画上彩色的条纹。花朵里有眼睛，因为它们正在看着我们在画它们。",
    audioDuration: "00:29",
    teacherComment: "对‘多角度观察’的现代艺术语言理解透彻，剪纸拼贴与重彩绘画结合，形式感与童趣幽默并存。"
  }
];

// 小艺术家名人堂数据列表（每个小艺术家包含圆形头像、个性签名、班级和参展作品数）
var studentList = [
  {
    id: "s-1",
    name: "林雨桐",
    age: "5岁",
    ageGroup: "3-5",
    className: "启蒙创想一班",
    avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    bio: "画画的时候我可以去任何想去的地方，我最喜欢天马行空的怪兽和甜品。",
    featuredArtCount: 2
  },
  {
    id: "s-2",
    name: "陈泽宇",
    age: "7岁",
    ageGroup: "6-8",
    className: "色彩探索二班",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80",
    bio: "下雨天画水彩最有趣了，水和颜色会自己在纸上赛跑！",
    featuredArtCount: 2
  },
  {
    id: "s-3",
    name: "张若曦",
    age: "10岁",
    ageGroup: "9-12",
    className: "综合立体造型班",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    bio: "用双手把脑海里的童话变成摸得到的立体世界，特别有成就感。",
    featuredArtCount: 2
  },
  {
    id: "s-4",
    name: "李俊熙",
    age: "11岁",
    ageGroup: "9-12",
    className: "少儿当代设计班",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    bio: "我想用画笔和精细的线条设计出未来在星际航行的各种交通工具。",
    featuredArtCount: 1
  },
  {
    id: "s-5",
    name: "王子涵",
    age: "4岁半",
    ageGroup: "3-5",
    className: "幼美启蒙二班",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    bio: "彩色的波点和好玩的动物是我最好的朋友！",
    featuredArtCount: 1
  },
  {
    id: "s-6",
    name: "苏可儿",
    age: "8岁",
    ageGroup: "6-8",
    className: "大师大师拼贴班",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80",
    bio: "艺术可以从不同的角度去看，拼贴出来的画面总是充满惊喜。",
    featuredArtCount: 1
  }
];

/**
 * 🌟 主题特展与专题策展文章数据集 (Thematic Curated Exhibitions)
 * 供首页焦点大轮播及独立专题文章页面使用
 */
var themeExhibitions = [
  {
    id: "theme-summer-nature",
    title: "森林与星空的对话：2026 夏季少儿自然探索特展",
    subTitle: "Forest & Starry Sky: Summer Kids Nature Art Expedition",
    tag: "🌟 2026 夏季年度重磅特展",
    season: "SUMMER 2026 SPECIAL",
    date: "2026.06 - 2026.08",
    coverImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85",
    curator: "陈昨老师 & 想吃梨教研组",
    artworkCount: 4,
    introSummary: "在大自然与星空之间，孩子们以纯真直觉构筑森林树屋、彩虹异兽与蓝色陶罐，带我们重返万物有灵的奇妙世界。",
    curatorStatement: [
      "每一棵树都藏着一颗星星的心跳，每一片云朵都是大自然未写完的童话。",
      "本次《森林与星空的对话》特展，汇集了 3 至 12 岁小艺术家们在夏季户外写生与立体装置探索中的代表性创作。我们鼓励孩子们跳出常规透视与固有色彩的框架，用双手直接触摸松果、泥土、油画棒与水粉，把他们眼中的林间微光、星际幻想与奇妙生物凝聚在画布与装置之中。",
      "在这个特展中，你不仅会看到林雨桐笔下天马行空的夏日冰淇淋海，还能步入张若曦耗时三周打造的水晶精灵树屋，感受童年艺术最本真、最丰沛的生命力。"
    ],
    keyHighlights: [
      { icon: "🌲", title: "自然媒介与立体探索", desc: "融合超轻粘土、天然松果与透明水晶媒介，打破平面绘画限制。" },
      { icon: "🎨", title: "直觉色彩与情感表达", desc: "打破固有色彩概念，用纯粹高饱和色彩传递童真温度。" },
      { icon: "🎙️", title: "沉浸童声原声记录", desc: "每件参展作品均收录小艺术家创作时的独家原声故事。" }
    ],
    artworkIds: ["art-1", "art-3", "art-1-2", "art-3-2"]
  },
  {
    id: "theme-future-space",
    title: "星际轨道与光子列车：少儿未来科技设计展",
    subTitle: "Interstellar Tracks & Cyber Voyage: Kids Sci-Fi Vision",
    tag: "🚀 科技与创想专题展",
    season: "SCIENCE & IMAGINATION",
    date: "2026.05 - 2026.07",
    coverImage: "https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=1600&auto=format&fit=crop&q=85",
    curator: "想吃梨当代设计组",
    artworkCount: 3,
    introSummary: "当少儿纯真线条遇上机械结构与未来生态，探索光子列车、发光潜水艇与星际空间站的奇妙科技蓝图。",
    curatorStatement: [
      "未来的世界会长成什么样？在成人的眼中或许是严密的参数与冷峻的钢铁，但在孩子的画笔下，未来是一列头顶微型生态温室的星际列车，是一艘专门去深海给发光水母拍照片的潜水艇。",
      "本次特展聚焦于高年龄段小艺术家的线描构想与工业设计启蒙，展现了少儿对结构逻辑、透视关系以及人与自然共生关系的深层思考。"
    ],
    keyHighlights: [
      { icon: "📐", title: "精密线描与空间构图", desc: "严密机械线条与自由想象结合，锻炼空间几何感知。" },
      { icon: "🌱", title: "绿色生态温室构想", desc: "将自然植物与未来交通工具跨界融合。" },
      { icon: "💡", title: "光影层次与马克笔技法", desc: "运用精细阴影与高光塑造科技光感。" }
    ],
    artworkIds: ["art-5", "art-2-2", "art-2"]
  },
  {
    id: "theme-cubism-colors",
    title: "多维视界：少儿现代主义拼贴与童心色彩狂想",
    subTitle: "Multidimensional Perspectives: Modernist Collage & Pure Colors",
    tag: "🎨 现代艺术探索展",
    season: "MODERN ART SALON",
    date: "2026.04 - 2026.06",
    coverImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1600&auto=format&fit=crop&q=85",
    curator: "陈昨老师",
    artworkCount: 3,
    introSummary: "借鉴立体主义与综合媒介剪贴手法，小艺术家们打破单一视角，让色彩与材质在画纸上自由碰撞与重组。",
    curatorStatement: [
      "毕加索曾说：‘我花了一辈子学习如何像孩子一样画画。’",
      "现代艺术的核心在于打破常规认知，重新发现事物的多维之美。在本次特展中，苏可儿与王子涵等小艺术家通过剪报、布料与油画棒的综合拼贴，创造出‘长着眼睛的花朵’与‘在云端吃棉花糖的彩虹长颈鹿’，展现了令人惊叹的形式感与幽默感。"
    ],
    keyHighlights: [
      { icon: "✂️", title: "综合材质拼贴媒介", desc: "解构报纸、布料与色纸，探索肌理与触觉质感。" },
      { icon: "👁️", title: "立体主义多角度观察", desc: "同时展现物体的正面与剖面，培养抽象思辨能力。" },
      { icon: "🌈", title: "高纯度童心波点", desc: "不受拘束的原始表现力，释放自由生命力。" }
    ],
    artworkIds: ["art-6", "art-4", "art-3-2"]
  }
];

/**
 * 📝 美育便签墙数据集 (Community Sticky Notes Wall)
 * 对外完全开放，支持家长、学生、老师与艺术爱好者自由张贴心得心语及小习作卡片
 */
var initialStickyNotes = [
  {
    id: "note-1",
    type: "text",
    author: "林雨桐妈妈",
    role: "parent",
    roleName: "👩‍👧 家长寄语",
    color: "yellow",
    content: "以前总担心桐桐画画不按常理出牌，树画成紫色的、天画成绿色的。来到想吃梨后才发现，保护孩子眼睛里的自由，比画得‘像’重要的多！现在家里贴满了她的彩色小宇宙。",
    tag: "#尊重原生创造力",
    date: "2026.08.17",
    likes: 24,
    isLiked: false
  },
  {
    id: "note-2",
    type: "artwork",
    author: "陈一诺 (7岁)",
    role: "student",
    roleName: "🎨 小学员",
    color: "green",
    artworkTitle: "《下雨天去太空避雨的猫》",
    artworkImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    content: "今天在课堂上用重彩油画棒画的！下雨天猫咪不用撑伞，它直接飞到太空云朵里吃冰淇淋避雨，云朵是草莓味的。",
    tag: "#童心脑洞大开",
    date: "2026.08.16",
    likes: 38,
    isLiked: false
  },
  {
    id: "note-3",
    type: "text",
    author: "陈昨老师",
    role: "teacher",
    roleName: "👩‍🏫 美育主理人",
    color: "purple",
    content: "在美育便签墙欢迎每一位家长和孩子！在这里没有标准答案，每一段童言童语、每一张哪怕是不经意的涂鸦草图，都是世界上绝无仅有的艺术宝贝。期待看到大家的分享！✨",
    tag: "#想吃梨美育手记",
    date: "2026.08.15",
    likes: 56,
    isLiked: false
  },
  {
    id: "note-4",
    type: "text",
    author: "周子墨爸爸",
    role: "parent",
    roleName: "👨‍👦 家长寄语",
    color: "blue",
    content: "特别认同陈昨老师说的‘画画是情绪的释放’。子墨以前性格内向，现在每次上完美术课回到家都特别兴奋，拉着我们讲画里的小怪兽。艺术真的能打开孩子的心灵。",
    tag: "#情绪释放与自信",
    date: "2026.08.14",
    likes: 19,
    isLiked: false
  },
  {
    id: "note-5",
    type: "artwork",
    author: "陆星辰 (8岁)",
    role: "student",
    roleName: "🎨 小学员",
    color: "yellow",
    artworkTitle: "《未来草地滑行太阳能列车》",
    artworkImage: "https://images.unsplash.com/photo-1569172122301-bc500fba0935?w=800&auto=format&fit=crop&q=80",
    content: "这是我画的未来列车草图！它不需要铁轨，直接在草地上滑行，车顶有透明的植物温室，一边跑一边吐出新鲜的氧气泡泡。",
    tag: "#未来工业小设计师",
    date: "2026.08.13",
    likes: 31,
    isLiked: false
  },
  {
    id: "note-6",
    type: "text",
    author: "艺术系研究生沈学姐",
    role: "visitor",
    roleName: "🌟 艺术爱好者",
    color: "pink",
    content: "偶然刷到这个儿童画廊，被孩子们的色彩冲击到了！没有模板化范画的匠气，全是原生的当代艺术触觉。国内的美育太需要这样呵护孩子天性的土壤了，为陈昨老师点赞！",
    tag: "#当代少儿美育实践",
    date: "2026.08.12",
    likes: 42,
    isLiked: false
  },
  {
    id: "note-7",
    type: "text",
    author: "苏可儿妈妈",
    role: "parent",
    roleName: "👩‍👧 家长寄语",
    color: "green",
    content: "展厅里每幅画点进去能听到孩子自己录的原声小故事，这个设计太温暖了！我们把可儿讲故事的声音发给外公外婆听，老人家开心得合不拢嘴。",
    tag: "#童声原声回忆",
    date: "2026.08.11",
    likes: 27,
    isLiked: false
  },
  {
    id: "note-8",
    type: "artwork",
    author: "王子涵 (6岁)",
    role: "student",
    roleName: "🎨 小学员",
    color: "pink",
    artworkTitle: "《在彩虹山吃西瓜的霸王龙》",
    artworkImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80",
    content: "霸王龙其实不凶，它只是太想吃西瓜了！我给它画了一个彩虹山，让它天天都能吃到甜甜的无籽大西瓜。",
    tag: "#纯真童心",
    date: "2026.08.10",
    likes: 45,
    isLiked: false
  },
  {
    id: "note-9",
    type: "text",
    author: "周子墨 (4岁)",
    role: "student",
    roleName: "👧 孩子童言",
    color: "yellow",
    content: "天上的云朵其实是棉花糖小羊变成的，我明天要把它们都画出来！☁️🐑",
    tag: "#纯真童言",
    date: "2026.08.09",
    likes: 52,
    isLiked: false
  },
  {
    id: "note-10",
    type: "text",
    author: "辰辰妈妈",
    role: "parent",
    roleName: "👩‍👧 家长寄语",
    color: "blue",
    content: "每一堂课孩子都在发光！感谢陈昨老师用爱呵护孩子的艺术天赋 💖",
    tag: "#给陈昨老师点赞",
    date: "2026.08.08",
    likes: 33,
    isLiked: false
  }
];

// 全局别名兼容
if (typeof window !== 'undefined') {
  window.initialArtworks = initialArtworks;
  window.studentList = studentList;
  window.initialStudents = studentList;
  window.themeExhibitions = themeExhibitions;
  window.initialThematicExhibitions = themeExhibitions;
  window.initialStickyNotes = initialStickyNotes;
}
