/**
 * 🍐 想吃梨 · 基础数据接口定义
 * 纯粹由 Supabase 云端数据库与 Local-First 实时缓存驱动，不预置任何静态假数据，彻底杜绝模板闪烁。
 */
var initialArtworks = [];
var initialStudents = [];
var initialThematicExhibitions = [];
var initialStickyNotes = [];
var initialCourseAlbums = [];

// Global Window Aliases for Universal Front-End & Admin Access
if (typeof window !== 'undefined') {
  window.initialArtworks = [];
  window.initialStudents = [];
  window.initialThematicExhibitions = [];
  window.initialStickyNotes = [];
  window.initialCourseAlbums = [];
}