import { supabase } from './supabase';

export interface UserRewards {
    id: string;
    user_id: string;
    stamps: number;
    pending_reward: boolean;
    created_at: string;
    updated_at: string;
}

// Get user rewards, create if not exists
export async function getUserRewards(userId: string): Promise<UserRewards | null> {
    // First try to get existing rewards
    const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') {
        // No record found, create one
        const { data: newData, error: insertError } = await supabase
            .from('user_rewards')
            .insert({ user_id: userId, stamps: 0, pending_reward: false })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating user rewards:', insertError);
            return null;
        }
        return newData;
    }

    if (error) {
        console.error('Error fetching user rewards:', error);
        return null;
    }

    return data;
}

// Add a stamp (called by staff)
export async function addStamp(userId: string): Promise<{ success: boolean; message: string; stamps?: number }> {
    const rewards = await getUserRewards(userId);

    if (!rewards) {
        return { success: false, message: 'User not found' };
    }

    // Check if user has pending reward
    if (rewards.pending_reward) {
        return { success: false, message: 'User has pending reward - must redeem before earning more stamps' };
    }

    // Check if already at max
    if (rewards.stamps >= 10) {
        return { success: false, message: 'User already has 10 stamps' };
    }

    const newStamps = rewards.stamps + 1;
    const hasPendingReward = newStamps >= 10;

    const { error } = await supabase
        .from('user_rewards')
        .update({
            stamps: newStamps,
            pending_reward: hasPendingReward,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error adding stamp:', error);
        return { success: false, message: 'Failed to add stamp' };
    }

    return {
        success: true,
        message: hasPendingReward ? 'Stamp added! Reward unlocked!' : `Stamp added! (${newStamps}/10)`,
        stamps: newStamps
    };
}

// Redeem reward (called by staff)
export async function redeemReward(userId: string): Promise<{ success: boolean; message: string }> {
    const rewards = await getUserRewards(userId);

    if (!rewards) {
        return { success: false, message: 'User not found' };
    }

    if (!rewards.pending_reward) {
        return { success: false, message: 'No pending reward to redeem' };
    }

    const { error } = await supabase
        .from('user_rewards')
        .update({
            stamps: 0,
            pending_reward: false,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (error) {
        console.error('Error redeeming reward:', error);
        return { success: false, message: 'Failed to redeem reward' };
    }

    return { success: true, message: 'Reward redeemed successfully!' };
}

// Get user info by ID (for staff verification)
export async function getUserById(userId: string): Promise<{ email: string } | null> {
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
        // Fallback: just check if rewards exist for this user
        const rewards = await getUserRewards(userId);
        if (rewards) {
            return { email: 'User exists' };
        }
        return null;
    }

    return { email: data.user.email || 'Unknown' };
}

// ==========================================
// LEADERBOARD FUNCTIONS - King of Coffee
// ==========================================

export interface LeaderboardEntry {
    user_id: string;
    first_name: string;
    last_name: string;
    points: number;
    rank: number;
}

export interface UserRank {
    rank: number | null;
    points: number;
}

// Get top 5 users for current week
export async function getTop5ThisWeek(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_top_5_this_week');

    if (error) {
        console.error('Error fetching top 5:', error);
        return [];
    }

    return data || [];
}

// Get current user's rank and points
export async function getUserRank(userId: string): Promise<UserRank> {
    const { data, error } = await supabase.rpc('get_user_rank', {
        p_user_id: userId
    });

    if (error) {
        console.error('Error fetching user rank:', error);
        return { rank: null, points: 0 };
    }

    // data is an array with single result
    if (data && data.length > 0) {
        return {
            rank: data[0].rank,
            points: data[0].points
        };
    }

    return { rank: null, points: 0 };
}
