import { supabase } from './supabase';

export interface UserInfo {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

/**
 * 获取用户完整信息（管理员专用）
 * 使用Supabase RPC函数查询用户信息
 */
export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    // 调用Supabase RPC函数
    const { data, error } = await supabase
      .rpc('get_user_info', { user_id: userId })
      .single();
    
    if (error) {
      console.error('RPC get_user_info error:', error);
      return null;
    }
    
    return data as UserInfo;
  } catch (err) {
    console.error('Failed to get user info:', err);
    return null;
  }
}

/**
 * 验证当前用户是否为管理员
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const role = user.user_metadata?.role;
    return role === 'admin';
  } catch (err) {
    console.error('Failed to check admin status:', err);
    return false;
  }
}
