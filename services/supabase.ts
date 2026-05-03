// services/supabase.ts — To'liq Supabase backend (tuzatilgan)
import { createClient } from '@supabase/supabase-js';
import { Question, TestResult, User, Role } from '../types';

const SUPABASE_URL = 'https://bwdnvxucvyeknesifnwg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Wn3kdqlj3_w9tIZZX83rYw_sB-23j8v';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FREE_DAILY_LIMIT = 20;

// =================== PAROL ===================
export const hashPassword = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hashed_' + Math.abs(hash).toString(16);
};

// =================== FOYDALANUVCHILAR ===================
export const loginUser = async (name: string, password: string): Promise<User | null> => {
  const hashed = hashPassword(password);
  const { data } = await supabase.from('users').select('*').eq('name', name).single();
  if (!data) return null;
  if (data.password !== hashed && data.password !== password) return null;
  await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', data.id);
  return mapUser(data);
};

export const registerUser = async (
  name: string,
  password: string,
  fullName?: string,
  phone?: string
): Promise<{ success: boolean; user?: User; message?: string }> => {
  // Login band emasligini tekshirish
  const { data: existing } = await supabase.from('users').select('id').eq('name', name).single();
  if (existing) return { success: false, message: "Bu login allaqachon band!" };

  // Telefon band emasligini tekshirish
  if (phone) {
    const { data: phoneExists } = await supabase.from('users').select('id').eq('phone', phone).single();
    if (phoneExists) return { success: false, message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan!" };
  }

  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const { data, error } = await supabase.from('users').insert({
    id,
    name,
    full_name: fullName || '',
    phone: phone || '',
    password: hashPassword(password),
    role: 'USER',
    total_points: 0,
    avatar: '',
    created_at: new Date().toISOString(),
  }).select().single();

  if (error || !data) return { success: false, message: "Xatolik yuz berdi. Qayta urinib ko'ring." };
  return { success: true, user: mapUser(data) };
};

export const resetPasswordByPhone = async (phone: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await supabase.from('users').select('id').eq('phone', phone).single();
  if (!data) return { success: false, message: "Bu telefon raqam topilmadi!" };
  const { error } = await supabase.from('users').update({ password: hashPassword(newPassword) }).eq('id', data.id);
  if (error) return { success: false, message: "Xatolik yuz berdi!" };
  return { success: true, message: "Parol muvaffaqiyatli yangilandi!" };
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return data ? mapUser(data) : null;
};

export const getUsers = async (): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapUser);
};

export const updateUserProfile = async (user: User): Promise<boolean> => {
  const updateData: any = {
    name: user.name,
    full_name: user.fullName || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    last_active: new Date().toISOString(),
    total_points: user.totalPoints || 0,
  };
  if (user.password) {
    updateData.password = user.password.startsWith('hashed_') ? user.password : hashPassword(user.password);
  }
  const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
  return !error;
};

export const updateLastActive = async (userId: string) => {
  await supabase.from('users').update({ last_active: new Date().toISOString() }).eq('id', userId);
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  return !error;
};

const mapUser = (d: any): User => ({
  id: d.id,
  name: d.name,
  fullName: d.full_name || '',
  phone: d.phone || '',
  password: d.password,
  avatar: d.avatar || '',
  role: d.role as Role,
  totalPoints: d.total_points || 0,
  createdAt: d.created_at,
  lastActive: d.last_active,
});

// =================== SAVOLLAR ===================
export const getQuestions = async (): Promise<Question[]> => {
  const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: true });
  return (data || []).map(mapQuestion);
};

export const getQuestionsByCategory = async (category: string): Promise<Question[]> => {
  let query = supabase.from('questions').select('*');
  if (category === 'umumiy') query = query.or('category.eq.umumiy,category.is.null');
  else query = query.eq('category', category);
  const { data } = await query.order('created_at', { ascending: true });
  return (data || []).map(mapQuestion);
};

export const saveQuestion = async (question: Question): Promise<boolean> => {
  const row = mapQuestionToRow(question);
  // Rasm hajmini tekshirish
  if (row.image && row.image.length > 500_000) {
    console.error('Rasm juda katta:', Math.round(row.image.length / 1024) + 'KB');
    (window as any).__lastSaveError = 'Rasm hajmi juda katta (' + Math.round(row.image.length/1024) + 'KB). 500KB dan oshmasligi kerak.';
    return false;
  }
  const { error } = await supabase.from('questions').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('saveQuestion xatolik:', error.message, error.code, error.details, error.hint);
    // RLS xatoligi
    if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
      (window as any).__lastSaveError = 'Supabase RLS xatoligi: questions jadvaliga yozish huquqi yo\'q.\n\nSupabase Dashboard > SQL Editor da quyidagini ishlatib yuboring:\nALTER TABLE questions DISABLE ROW LEVEL SECURITY;';
    } else {
      (window as any).__lastSaveError = error.message || 'Noma\'lum xatolik';
    }
  }
  return !error;
};

export const deleteQuestion = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  return !error;
};

export const deleteAllQuestions = async (): Promise<boolean> => {
  const { error } = await supabase.from('questions').delete().neq('id', '');
  return !error;
};

export const bulkSaveQuestions = async (questions: Question[]): Promise<{ saved: number; errors: number }> => {
  let saved = 0, errors = 0;
  const batchSize = 50;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize).map(q => ({
      ...mapQuestionToRow(q),
      id: q.id || ('q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + i),
    }));
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) { console.error('Batch error:', error); errors += batch.length; }
    else saved += batch.length;
  }
  return { saved, errors };
};

const mapQuestion = (d: any): Question => ({
  id: d.id,
  questionText: d.question_text,
  options: { A: d.option_a, ...(d.option_b ? { B: d.option_b } : {}), ...(d.option_c ? { C: d.option_c } : {}), ...(d.option_d ? { D: d.option_d } : {}), ...(d.option_e ? { E: d.option_e } : {}), ...(d.option_f ? { F: d.option_f } : {}) },
  correctAnswer: d.correct_answer,
  image: d.image || '',
  category: d.category || 'umumiy',
  description: d.description || '',
});

const mapQuestionToRow = (q: Question) => ({
  id: q.id,
  question_text: q.questionText,
  option_a: q.options.A || '',
  option_b: q.options.B || '',
  option_c: q.options.C || '',
  option_d: q.options.D || '',
  option_e: q.options.E || '',
  option_f: (q.options as any).F || '',
  correct_answer: q.correctAnswer,
  image: q.image || '',
  category: q.category || 'umumiy',
  description: q.description || '',
});

// =================== TEST NATIJALARI ===================
export const saveResult = async (result: TestResult): Promise<boolean> => {
  const { error } = await supabase.from('test_results').insert({
    id: result.id,
    user_id: result.userId,
    date: result.date,
    total_questions: result.totalQuestions,
    correct_count: result.correctCount,
    score_percentage: result.scorePercentage,
    time_spent_seconds: result.timeSpentSeconds || 0,
    details: result.details,
  });
  if (!error) {
    const pts = Math.round(result.scorePercentage);
    const { data: u } = await supabase.from('users').select('total_points').eq('id', result.userId).single();
    if (u) await supabase.from('users').update({ total_points: (u.total_points || 0) + pts }).eq('id', result.userId);
  }
  return !error;
};

export const getResults = async (userId?: string): Promise<TestResult[]> => {
  let query = supabase.from('test_results').select('*').order('date', { ascending: false });
  if (userId) query = query.eq('user_id', userId);
  const { data } = await query.limit(500);
  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    date: d.date,
    totalQuestions: d.total_questions,
    correctCount: d.correct_count,
    scorePercentage: d.score_percentage,
    timeSpentSeconds: d.time_spent_seconds || 0,
    details: d.details || [],
  }));
};

// =================== PREMIUM ===================
export const isPremiumActive = async (userId: string): Promise<boolean> => {
  const { data } = await supabase.from('premium_users').select('expires_at').eq('user_id', userId).single();
  if (!data) return false;
  return new Date(data.expires_at) > new Date();
};

export const getPremiumInfo = async (userId: string): Promise<{ active: boolean; expiresAt?: string; plan?: string }> => {
  const { data } = await supabase.from('premium_users').select('*').eq('user_id', userId).single();
  if (!data) return { active: false };
  const active = new Date(data.expires_at) > new Date();
  return { active, expiresAt: data.expires_at, plan: data.plan };
};

export const activatePremiumForUser = async (userId: string, days: number, plan: string): Promise<boolean> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  const { error } = await supabase.from('premium_users').upsert({
    user_id: userId,
    plan,
    activated_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  }, { onConflict: 'user_id' });
  return !error;
};

// =================== PREMIUM SO'ROVLAR ===================
export const createPremiumRequest = async (
  userId: string, userName: string, planLabel: string, price: number, days: number, screenshotUrl?: string
): Promise<{ success: boolean; requestId?: string }> => {
  const id = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const { error } = await supabase.from('premium_requests').insert({
    id, user_id: userId, user_name: userName,
    plan: planLabel, price, days,
    screenshot_url: screenshotUrl || '',
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  if (error) return { success: false };
  return { success: true, requestId: id };
};

export const getPremiumRequests = async (status?: string) => {
  let query = supabase.from('premium_requests').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return data || [];
};

export const approvePremiumRequest = async (requestId: string): Promise<boolean> => {
  const { data: req } = await supabase.from('premium_requests').select('*').eq('id', requestId).single();
  if (!req) return false;
  const success = await activatePremiumForUser(req.user_id, req.days, req.plan);
  if (!success) return false;
  await supabase.from('premium_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', requestId);
  return true;
};

export const rejectPremiumRequest = async (requestId: string): Promise<boolean> => {
  const { error } = await supabase.from('premium_requests').update({
    status: 'rejected', reviewed_at: new Date().toISOString()
  }).eq('id', requestId);
  return !error;
};

export const getUserPremiumRequest = async (userId: string) => {
  const { data } = await supabase.from('premium_requests')
    .select('*').eq('user_id', userId).eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(1).single();
  return data;
};

// =================== FAYL YUKLASH ===================
export const uploadScreenshot = async (file: File, userId: string): Promise<string | null> => {
  const ext = file.name.split('.').pop();
  const path = `screenshots/${userId}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('premium-screenshots').upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('premium-screenshots').getPublicUrl(path);
  return data.publicUrl;
};

// =================== KUNLIK LIMIT ===================
export const getDailyTestInfo = async (userId: string): Promise<{ used: number; limit: number; canTest: boolean }> => {
  const premium = await isPremiumActive(userId);
  if (premium) return { used: 0, limit: 999, canTest: true };
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('daily_tests').select('count').eq('user_id', userId).eq('test_date', today).single();
  const used = data?.count || 0;
  return { used, limit: FREE_DAILY_LIMIT, canTest: used < FREE_DAILY_LIMIT };
};

// FAQAT TEST TUGAGANDAN SO'NG chaqiriladi
export const incrementDailyTest = async (userId: string): Promise<void> => {
  const premium = await isPremiumActive(userId);
  if (premium) return;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('daily_tests').select('count').eq('user_id', userId).eq('test_date', today).single();
  if (data) {
    await supabase.from('daily_tests').update({ count: data.count + 1 }).eq('user_id', userId).eq('test_date', today);
  } else {
    await supabase.from('daily_tests').insert({ user_id: userId, test_date: today, count: 1 });
  }
};

// =================== SOZLAMALAR ===================
export const getSetting = async (key: string): Promise<string> => {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single();
  return data?.value || '';
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
};

export const getAllSettings = async (): Promise<Record<string, string>> => {
  const { data } = await supabase.from('settings').select('*');
  if (!data) return {};
  return Object.fromEntries(data.map(d => [d.key, d.value]));
};

// =================== STATISTIKA ===================
export const getAdminStats = async () => {
  const [usersRes, questionsRes, resultsRes, premiumRes, pendingRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).neq('role', 'ADMIN'),
    supabase.from('questions').select('id', { count: 'exact', head: true }),
    supabase.from('test_results').select('id', { count: 'exact', head: true }),
    supabase.from('premium_users').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
    supabase.from('premium_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return {
    totalUsers: usersRes.count || 0,
    totalQuestions: questionsRes.count || 0,
    totalTests: resultsRes.count || 0,
    activePremium: premiumRes.count || 0,
    pendingRequests: pendingRes.count || 0,
  };
};

export const getAllPremiumUsers = async () => {
  const { data } = await supabase
    .from('premium_users')
    .select('*, users(name, avatar)')
    .order('expires_at', { ascending: false });
  return data || [];
};

// =================== ADMIN ===================
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  const hashed = hashPassword(password);
  const { data } = await supabase.from('users').select('password').eq('role', 'ADMIN').single();
  if (!data) return false;
  return data.password === hashed || data.password === password;
};

export const updateAdminPassword = async (newPass: string): Promise<void> => {
  await supabase.from('users').update({ password: hashPassword(newPass) }).eq('role', 'ADMIN');
};

// =================== REALTIME ===================
export const subscribeToPremiumRequests = (callback: (payload: any) => void) => {
  return supabase
    .channel('premium_requests_channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'premium_requests' }, callback)
    .subscribe();
};
